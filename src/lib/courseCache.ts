import type { Course } from '@/components/Navbar/types';

// Global client-side in-memory cache shared across desktop & mobile navbar components
const courseCache = new Map<string, Course[]>();
const inFlightRequests = new Map<string, Promise<Course[]>>();

/**
 * Returns courses synchronously from cache if already loaded.
 */
export function getCachedCourses(slug: string): Course[] | undefined {
  if (!slug) return undefined;
  return courseCache.get(slug);
}

/**
 * Fetch courses for a category slug with automatic deduplication, caching, and error safety.
 */
export async function fetchCoursesForCategory(slug: string): Promise<Course[]> {
  if (!slug) return [];

  // Return cached result immediately
  if (courseCache.has(slug)) {
    return courseCache.get(slug)!;
  }

  // Deduplicate concurrent requests for the same slug
  if (inFlightRequests.has(slug)) {
    return inFlightRequests.get(slug)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`/api/courses?category=${encodeURIComponent(slug)}`);
      if (!res.ok) {
        throw new Error(`Failed to load courses for ${slug}: ${res.status}`);
      }
      const data = await res.json();
      const courses: Course[] = Array.isArray(data.courses) ? data.courses : [];
      courseCache.set(slug, courses);
      return courses;
    } catch (err) {
      console.error(`[courseCache] Failed to load courses for "${slug}":`, err);
      // Cache empty array to prevent infinite retry storms
      courseCache.set(slug, []);
      return [];
    } finally {
      inFlightRequests.delete(slug);
    }
  })();

  inFlightRequests.set(slug, fetchPromise);
  return fetchPromise;
}

/**
 * Background prefetch during browser idle time to guarantee instant menu opening.
 */
export function prefetchCategoryCourses(slug: string): void {
  if (!slug || courseCache.has(slug) || inFlightRequests.has(slug)) return;

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(
        () => {
          fetchCoursesForCategory(slug);
        },
        { timeout: 2000 }
      );
    } else {
      setTimeout(() => {
        fetchCoursesForCategory(slug);
      }, 1000);
    }
  }
}

