'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid, GraduationCap, ChevronRight } from 'lucide-react';
import { Category, Course } from './types';
import NavContact from './NavContact';
import { getCachedCourses, fetchCoursesForCategory } from '@/lib/courseCache';

interface CourseMenuProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  onClose: () => void;
  isLoading?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  topOffset?: number;
}

/** Left Column Category List Skeleton Loader */
function CategoryListSkeleton() {
  return (
    <div className="p-2 space-y-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-2.5 rounded-md bg-zinc-200/50"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-5 h-5 rounded bg-zinc-300/70 shrink-0" />
            <div className="h-4 bg-zinc-300/70 rounded w-3/4" />
          </div>
          <div className="w-3.5 h-3.5 rounded bg-zinc-300/50 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Right Column Course Grid Skeleton Loader */
function CourseGridSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
      {/* Header Skeleton */}
      <div className="px-4 py-3 border-b border-zinc-200 bg-white flex items-center justify-between gap-4 flex-shrink-0 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-zinc-200" />
          <div className="space-y-1.5">
            <div className="w-48 h-4 bg-zinc-200 rounded" />
            <div className="w-28 h-2.5 bg-zinc-100 rounded" />
          </div>
        </div>
        <div className="w-24 h-3 bg-zinc-200 rounded" />
      </div>

      {/* Courses Cards Skeleton Grid */}
      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-2 rounded-md border border-zinc-100 bg-zinc-50/60 animate-pulse"
            >
              <div className="w-9 h-9 rounded-md bg-zinc-200 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 bg-zinc-200 rounded w-5/6" />
                <div className="h-3 bg-zinc-100 rounded w-2/3" />
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="h-3 w-16 bg-zinc-200 rounded" />
                  <div className="h-3 w-12 bg-zinc-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CourseMenu({
  categories,
  selectedCategory,
  onSelectCategory,
  onClose,
  isLoading = false,
  onMouseEnter,
  onMouseLeave,
  topOffset = 64,
}: CourseMenuProps) {
  const currentCategory = selectedCategory || categories[0] || null;
  const [coursesByCat, setCoursesByCat] = useState<Record<string, Course[]>>({});
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  // Fetch courses on-demand only when a category is selected/clicked
  useEffect(() => {
    if (!currentCategory?.slug) return;
    const catSlug = currentCategory.slug;

    // If already in synchronous memory cache or populated in props, nothing to fetch
    if (
      getCachedCourses(catSlug) ||
      (currentCategory.courses && currentCategory.courses.length > 0)
    ) {
      return;
    }

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) setLoadingCategory(catSlug);
    });

    fetchCoursesForCategory(catSlug)
      .then((courses) => {
        if (!isMounted) return;
        setCoursesByCat((prev) => ({
          ...prev,
          [catSlug]: courses,
        }));
      })
      .finally(() => {
        if (isMounted) setLoadingCategory(null);
      });

    return () => {
      isMounted = false;
    };
  }, [currentCategory?.slug, currentCategory?.courses, coursesByCat]);

  const activeCourses = currentCategory
    ? coursesByCat[currentCategory.slug] || getCachedCourses(currentCategory.slug) || currentCategory.courses || []
    : [];

  const isFetchingCourses =
    isLoading ||
    (currentCategory !== null && loadingCategory === currentCategory.slug);

  const handleSelectCategory = (category: Category) => {
    if (category.slug === currentCategory?.slug) return;
    onSelectCategory(category);
  };

  const handleCourseClick = () => {
    onClose();
  };

  useEffect(() => {
    // 1. Lock document body scrolling while CourseMenu is open
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // 2. Wheel boundary trap: prevents scroll chaining to the background page
    // when reaching the edges of inner scrollable containers or hovering over non-scrollable areas
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest('.custom-scrollbar') as HTMLElement | null;

      if (!scrollable) {
        // Cursor is over header, footer, borders, or backdrop: block wheel scroll
        e.preventDefault();
        return;
      }

      // Cursor is over an inner scrollable list (courses or categories)
      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const isAtTop = scrollTop <= 0 && e.deltaY < 0;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 1 && e.deltaY > 0;

      if (isAtTop || isAtBottom) {
        // Stop scroll propagation at list boundaries
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 bg-black/35 flex justify-center pt-2 px-4 cursor-default overscroll-contain"
      style={{ top: `${topOffset}px` }}
      onClick={onClose}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Mega Menu Modal Container with Consistent Responsive Height */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: `calc(100vh - ${topOffset + 24}px)`,
        }}
        className="bg-white rounded-md border border-zinc-200 lg:max-w-6xl 2xl:max-w-7xl w-full mx-auto overflow-hidden flex flex-col h-[620px] lg:h-[680px] xl:h-[720px] min-h-[420px] shadow-2xl cursor-auto overscroll-contain"
      >
        {/* Main 2-Column Layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left Column: Categories List */}
          <div className="w-72 sm:w-[300px] lg:w-[290px] flex-shrink-0 bg-slate-50/70 border-r border-zinc-200 flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-2 text-black font-semibold text-base">
                <LayoutGrid className="text-prime-yellow text-lg" size={18} />
                <span>Categories</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Click to view category programs</p>
            </div>

            {/* Category List or Skeleton */}
            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-2 space-y-1.5">
              {isLoading ? (
                <CategoryListSkeleton />
              ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                  <p className="text-xs font-medium">No categories available</p>
                </div>
              ) : (
                categories.map((category) => {
                  const isActive = currentCategory?.slug === category.slug;
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => handleSelectCategory(category)}
                      className={`w-full text-left flex items-center justify-between px-2 py-2.5 rounded-md text-sm transition-colors duration-150 cursor-pointer ${isActive
                        ? 'bg-gradient-to-r from-prime to-prime-dark text-white font-semibold'
                        : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 font-medium'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="text-sm leading-snug break-words">
                          {category.name}
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`flex-shrink-0 ${isActive ? 'text-white opacity-100' : 'text-zinc-400 opacity-60'}`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Courses Content or Skeleton */}
          {isFetchingCourses ? (
            <CourseGridSkeleton />
          ) : (
            <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-200 bg-white flex items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-prime/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="text-prime text-lg" size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-base text-prime-dark">
                      {currentCategory?.name || 'Select a Category'}
                    </h3>
                    {currentCategory && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {activeCourses.length} programs available • Industry Recognized
                      </p>
                    )}
                  </div>
                </div>

                {currentCategory && (
                  <Link
                    href={`/${currentCategory.slug}`}
                    onClick={onClose}
                    className="text-xs font-semibold text-prime hover:text-prime-dark hover:underline flex items-center gap-1 flex-shrink-0"
                  >
                    <span>View All {currentCategory.name}</span>
                    <ChevronRight size={14} />
                  </Link>
                )}
              </div>

              {/* Courses Scrollable Grid */}
              <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-2">
                {currentCategory && activeCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeCourses.map((course) => {
                      const iconUrl =
                        course.courseCard?.courseIcon?.thumbnail ||
                        course.courseCard?.courseIcon?.url;
                      const duration = course.courseCard?.courseDuration;
                      const mode = course.courseCard?.courseMode || 'Live Online & Self-Paced';
                      const tag = course.courseCard?.courseTag;

                      return (
                        <Link
                          key={course.slug}
                          href={`/${currentCategory.slug}/${course.slug}`}
                          onClick={handleCourseClick}
                          className="group relative flex items-start gap-3 p-2 rounded-md border border-zinc-200/90 bg-white hover:border-prime/50 hover:bg-slate-50/60 hover:shadow-2xs transition-all duration-150"
                        >
                          {/* Course Icon (from CDN) or fallback */}
                          <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden bg-slate-50 border border-zinc-100">
                            {iconUrl ? (
                              <Image
                                src={iconUrl}
                                alt={course.courseCard?.courseIcon?.alt || course.name}
                                width={36}
                                height={36}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-prime-yellow" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm text-prime-dark group-hover:text-prime transition-colors duration-150 line-clamp-2 leading-snug">
                                {course.name}
                              </h4>
                              <ChevronRight
                                className="text-zinc-300 group-hover:text-prime transition-colors duration-150 flex-shrink-0 mt-0.5"
                                size={16}
                              />
                            </div>

                            {/* Meta Row: Mode & Badges */}
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{mode}</span>
                              </span>

                              {duration && (
                                <span className="text-[10px] font-medium text-prime-dark bg-slate-100 px-2 py-0.5 rounded">
                                  {duration}
                                </span>
                              )}

                              {tag && tag.toLowerCase() !== course.name.toLowerCase() && (
                                <span className="text-[9px] font-semibold text-secondary bg-secondary/10 border border-secondary/20 px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-16">
                    <GraduationCap className="mx-auto mb-3 text-zinc-300" size={48} />
                    <p className="text-sm font-medium">Select a category on the left to view programs</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Anchored Bottom Contact Section */}
        <NavContact />
      </div>
    </div>
  );
}
