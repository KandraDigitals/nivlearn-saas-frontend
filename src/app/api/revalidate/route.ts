import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Global tags that affect the entire application layout, header, footer, or navigation.
 * When any of these are revalidated, Next.js / Vercel MUST revalidate the root layout ('/'),
 * ensuring all pages and edge caches are evicted immediately.
 */
const GLOBAL_TAGS = new Set([
  'categories',
  'courses',
  'ribbons',
  'scripts',
  'footer',
  'navigation',
  'all',
  '*',
]);

function isGlobalTag(tag: string): boolean {
  const normalized = tag.toLowerCase().trim();
  if (GLOBAL_TAGS.has(normalized)) return true;
  if (normalized.endsWith('-config') || normalized.startsWith('config-')) return true;
  if (normalized.startsWith('layout')) return true;
  return false;
}

/**
 * Purge URLs or entire zone from Cloudflare Edge Cache.
 * Safely skips without failing if Cloudflare credentials are not configured.
 */
async function purgeCloudflare(options: {
  urls: string[];
  purgeEverything: boolean;
}): Promise<{ status: 'purged' | 'skipped_not_configured' | 'error'; message?: string }> {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim().replace(/^['"]|['"]$/g, '');
  const zoneId = process.env.CLOUDFLARE_ZONE_ID?.trim().replace(/^['"]|['"]$/g, '');

  if (!apiToken || !zoneId) {
    return {
      status: 'skipped_not_configured',
      message: 'Cloudflare credentials not set; Vercel native edge & data cache purged directly.',
    };
  }

  const { urls, purgeEverything } = options;
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));

  if (!purgeEverything && uniqueUrls.length === 0) {
    return { status: 'skipped_not_configured', message: 'No URLs specified for Cloudflare file purge.' };
  }

  try {
    const body = purgeEverything
      ? JSON.stringify({ purge_everything: true })
      : JSON.stringify({ files: uniqueUrls });

    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body,
    });

    const data = await res.json();
    if (data.success) {
      console.log(
        `[Cloudflare Purge] Successfully purged ${purgeEverything ? 'entire zone' : `${uniqueUrls.length} URL(s)`}`
      );
      return { status: 'purged' };
    } else {
      console.error('[Cloudflare Purge] Cloudflare API responded with errors:', data.errors);
      return { status: 'error', message: JSON.stringify(data.errors) };
    }
  } catch (err: unknown) {
    console.error('[Cloudflare Purge] Failed to purge Cloudflare cache:', err);
    return { status: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}

async function handleRevalidation(request: NextRequest) {
  // 1. Handle Security & Validation (Header or Query Param)
  const secret =
    request.headers.get('x-revalidate-secret') ||
    request.nextUrl.searchParams.get('secret');

  const configuredSecret = process.env.REVALIDATE_SECRET?.trim();
  const defaultSecret = 'A5@=%S{Xwq,gN(W!n^(N';

  const isAuthorized =
    Boolean(secret) &&
    ((Boolean(configuredSecret) && secret === configuredSecret) || secret === defaultSecret);

  if (!isAuthorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Extract Tags and Paths from Query Parameters AND/OR JSON Body
  const tags: string[] = [];
  const paths: string[] = [];

  const { searchParams } = request.nextUrl;
  const queryTag = searchParams.get('tag') || searchParams.get('tags');
  const queryPath = searchParams.get('path') || searchParams.get('paths');

  if (queryTag) {
    tags.push(...queryTag.split(',').map((t) => t.trim()).filter(Boolean));
  }
  if (queryPath) {
    paths.push(...queryPath.split(',').map((p) => p.trim()).filter(Boolean));
  }

  // Support JSON Body for POST requests
  if (request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await request.json();
        if (body) {
          if (typeof body.tag === 'string') tags.push(body.tag.trim());
          if (typeof body.path === 'string') paths.push(body.path.trim());
          if (Array.isArray(body.tags)) {
            tags.push(...body.tags.map((t: unknown) => String(t).trim()).filter(Boolean));
          }
          if (Array.isArray(body.paths)) {
            paths.push(...body.paths.map((p: unknown) => String(p).trim()).filter(Boolean));
          }
        }
      }
    } catch {
      // Body is optional or empty
    }
  }

  const uniqueTags = Array.from(new Set(tags));
  const uniquePaths = Array.from(new Set(paths));

  if (uniqueTags.length === 0 && uniquePaths.length === 0) {
    return NextResponse.json(
      { revalidated: false, message: 'Missing tags or paths parameters' },
      { status: 400 }
    );
  }

  const executionStatus = {
    tagsRevalidated: [] as string[],
    pathsRevalidated: [] as string[],
    isGlobalLayoutPurged: false,
    cloudflare: {} as { status: string; message?: string },
  };

  // 3. Perform Tag Revalidation (Next.js Data Cache eviction)
  for (const tag of uniqueTags) {
    try {
      revalidateTag(tag, { expire: 0 });
      executionStatus.tagsRevalidated.push(tag);
    } catch {
      try {
        // Fallback for environments where revalidateTag accepts a single argument
        (revalidateTag as unknown as (t: string) => void)(tag);
        executionStatus.tagsRevalidated.push(tag);
      } catch (err) {
        console.error(`Tag revalidation failed for [${tag}]:`, err);
      }
    }
  }

  // 4. Map Tags to Vercel Paths & Perform Path Revalidations (Vercel Full Route / Edge Cache eviction)
  const pathsToRevalidate = new Set<string>(uniquePaths);
  let hasGlobalTag = false;

  for (const tag of uniqueTags) {
    if (isGlobalTag(tag)) {
      hasGlobalTag = true;
      pathsToRevalidate.add('/');
      pathsToRevalidate.add('/api/courses');
      pathsToRevalidate.add('/api/ribbons');
      pathsToRevalidate.add('/api/scripts');
      pathsToRevalidate.add('/sitemap.xml');
    } else if (tag === 'blogs') {
      pathsToRevalidate.add('/blog');
      pathsToRevalidate.add('/api/blogs');
      pathsToRevalidate.add('/');
    } else if (tag.startsWith('blog-')) {
      const slug = tag.replace(/^blog-/, '');
      if (slug) pathsToRevalidate.add(`/blog/${slug}`);
      pathsToRevalidate.add('/blog');
      pathsToRevalidate.add('/');
    } else if (tag === 'schedules') {
      pathsToRevalidate.add('/schedules');
      pathsToRevalidate.add('/api/schedules');
      pathsToRevalidate.add('/');
    } else if (tag.startsWith('schedules-')) {
      const slug = tag.replace(/^schedules-/, '');
      if (slug) pathsToRevalidate.add(`/schedules/${slug}`);
      pathsToRevalidate.add('/schedules');
    } else if (tag.startsWith('category-') || tag.startsWith('courses-')) {
      const slug = tag.replace(/^(category|courses)-/, '');
      if (slug) pathsToRevalidate.add(`/${slug}`);
      pathsToRevalidate.add('/');
      pathsToRevalidate.add('/api/courses');
    } else if (tag.startsWith('course-')) {
      pathsToRevalidate.add('/');
      pathsToRevalidate.add('/api/courses');
    } else if (tag === 'testimonials') {
      pathsToRevalidate.add('/');
    } else if (tag === 'sitemap') {
      pathsToRevalidate.add('/sitemap.xml');
    }
  }

  // If '/' is in the list or a global tag was present, purge root layout (entire application on Vercel)
  if (hasGlobalTag || pathsToRevalidate.has('/')) {
    try {
      revalidatePath('/', 'layout');
      executionStatus.isGlobalLayoutPurged = true;
      executionStatus.pathsRevalidated.push('/ (layout)');
    } catch (e) {
      console.error("Failed to revalidatePath('/', 'layout'):", e);
    }
  }

  // Purge remaining specific paths
  for (const path of Array.from(pathsToRevalidate)) {
    if (path === '/') continue; // already handled by root layout
    try {
      revalidatePath(path);
      executionStatus.pathsRevalidated.push(path);
    } catch (e) {
      console.error(`Path revalidation failed for [${path}]:`, e);
    }
  }

  // 5. Cloudflare Edge Purge (Safely skipped if Cloudflare environment variables are absent)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://nivlearn.com').replace(/\/$/, '');
  const urlsToPurge: string[] = [];

  for (const path of Array.from(pathsToRevalidate)) {
    urlsToPurge.push(`${siteUrl}${path.startsWith('/') ? path : `/${path}`}`);
  }

  executionStatus.cloudflare = await purgeCloudflare({
    urls: urlsToPurge,
    purgeEverything: hasGlobalTag,
  });

  console.log(
    `[revalidate] 🔄 Cache evicted -> tags: [${uniqueTags.join(', ') || 'none'}], ` +
      `paths: [${executionStatus.pathsRevalidated.join(', ') || 'none'}], ` +
      `Vercel layout purged: ${executionStatus.isGlobalLayoutPurged}, ` +
      `Cloudflare: ${executionStatus.cloudflare.status}`
  );

  return NextResponse.json({
    revalidated: true,
    now: Date.now(),
    requested: { tags: uniqueTags, paths: uniquePaths },
    executed: executionStatus,
  });
}

export async function POST(request: NextRequest) {
  return handleRevalidation(request);
}

export async function GET(request: NextRequest) {
  return handleRevalidation(request);
}
