import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/apiProxy';
import type { Course, CourseCardData } from '@/components/Navbar/types';

export const dynamic = 'force-dynamic';

interface RawCourseIcon {
  url?: string;
  thumbnail?: string;
  alt?: string;
  [key: string]: unknown;
}

interface RawCourseCard {
  courseThumbnail?: RawCourseIcon;
  courseIcon?: RawCourseIcon;
  courseTag?: string;
  courseType?: string;
  courseMode?: string;
  courseDuration?: string;
  totalEnrolled?: string;
  [key: string]: unknown;
}

interface RawCourse {
  _id?: string;
  course_name?: string;
  course_title?: string;
  name?: string;
  slug?: string;
  order?: number;
  category_slug?: string;
  category?: string | { _id?: string; slug?: string } | null;
  courseCard?: RawCourseCard;
  [key: string]: unknown;
}

function sanitizeCourse(c: RawCourse, categorySlug: string): Course {
  const rawCard = c.courseCard;
  let sanitizedCard: CourseCardData | undefined = undefined;

  if (rawCard) {
    sanitizedCard = {
      courseThumbnail:
        rawCard.courseThumbnail?.url || rawCard.courseThumbnail?.thumbnail
          ? {
              url: typeof rawCard.courseThumbnail.url === 'string' ? rawCard.courseThumbnail.url : undefined,
              thumbnail:
                typeof rawCard.courseThumbnail.thumbnail === 'string'
                  ? rawCard.courseThumbnail.thumbnail
                  : undefined,
              alt: typeof rawCard.courseThumbnail.alt === 'string' ? rawCard.courseThumbnail.alt : undefined,
            }
          : undefined,
      courseIcon:
        rawCard.courseIcon?.url || rawCard.courseIcon?.thumbnail
          ? {
              url: typeof rawCard.courseIcon.url === 'string' ? rawCard.courseIcon.url : undefined,
              thumbnail:
                typeof rawCard.courseIcon.thumbnail === 'string' ? rawCard.courseIcon.thumbnail : undefined,
              alt: typeof rawCard.courseIcon.alt === 'string' ? rawCard.courseIcon.alt : undefined,
            }
          : undefined,
      courseDuration: typeof rawCard.courseDuration === 'string' ? rawCard.courseDuration : undefined,
      courseMode: typeof rawCard.courseMode === 'string' ? rawCard.courseMode : undefined,
      courseTag: typeof rawCard.courseTag === 'string' ? rawCard.courseTag : undefined,
      courseType: typeof rawCard.courseType === 'string' ? rawCard.courseType : undefined,
      totalEnrolled: typeof rawCard.totalEnrolled === 'string' ? rawCard.totalEnrolled : undefined,
    };
  }

  const thumb =
    typeof c.thumbnail === 'string'
      ? c.thumbnail
      : sanitizedCard?.courseThumbnail?.url ||
        sanitizedCard?.courseThumbnail?.thumbnail ||
        sanitizedCard?.courseIcon?.thumbnail ||
        sanitizedCard?.courseIcon?.url;
  const dur = typeof c.duration === 'string' ? c.duration : sanitizedCard?.courseDuration;
  const enr = typeof c.enrolled === 'string' ? c.enrolled : sanitizedCard?.totalEnrolled;
  const tag = typeof c.tag === 'string' ? c.tag : sanitizedCard?.courseTag;
  const type = typeof c.type === 'string' ? c.type : sanitizedCard?.courseType;

  return {
    name: (c.course_name || c.course_title || c.name || '') as string,
    slug: (c.slug || '') as string,
    catslug: categorySlug,
    order: typeof c.order === 'number' ? c.order : 0,
    thumbnail: thumb,
    duration: dur,
    enrolled: enr,
    tag,
    type,
    courseCard: sanitizedCard,
  };
}

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('q') || request.nextUrl.searchParams.get('search');

    if (!category && !search) {
      return NextResponse.json({ courses: [], total: 0 });
    }

    const queryParams = new URLSearchParams({
      limit: '100',
      page: '1',
      select: 'slug,course_title,course_name,order,category,category_slug,courseCard',
    });

    if (category) queryParams.set('category', category);
    if (search) queryParams.set('search', search);

    const res = await fetchFromBackend('/courses', {
      request,
      queryParams,
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend responded with ${res.status}`, courses: [] },
        { status: res.status }
      );
    }

    const json = await res.json();
    let rawList: RawCourse[] = Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json)
        ? json
        : [];

    const totalPages = json?.meta?.pages || json?.pagination?.pages || 1;
    if (totalPages > 1 && !search) {
      const extraPromises = [];
      for (let p = 2; p <= totalPages; p++) {
        const extraParams = new URLSearchParams({
          limit: '100',
          page: String(p),
          select: 'slug,course_title,course_name,order,category,category_slug,courseCard',
        });
        if (category) extraParams.set('category', category);
        extraPromises.push(
          fetchFromBackend('/courses', {
            request,
            queryParams: extraParams,
            cache: 'no-store',
          }).then((r) => (r.ok ? r.json() : null))
        );
      }
      const extraResults = await Promise.all(extraPromises);
      for (const extra of extraResults) {
        const list = Array.isArray(extra?.data)
          ? extra.data
          : Array.isArray(extra)
            ? extra
            : [];
        rawList = rawList.concat(list);
      }
    }

    const courses: Course[] = rawList
      .map((c) => {
        const catSlug =
          category ||
          (typeof c.category === 'object' && c.category?.slug ? c.category.slug : (c.category_slug || ''));
        return sanitizeCourse(c, catSlug);
      })
      .filter((c) => c.name && c.slug)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return NextResponse.json(
      { courses, total: courses.length },
      {
        headers: {
          'Cache-Control': search
            ? 'no-store, no-cache, must-revalidate'
            : 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error: unknown) {
    console.error('[api/courses] Error fetching courses for category:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', courses: [] },
      { status: 500 }
    );
  }
}
