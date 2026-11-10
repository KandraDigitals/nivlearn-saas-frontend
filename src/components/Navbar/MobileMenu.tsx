'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BrandLogo from '@/components/ui/BrandLogo';
import { X, ChevronDown, GraduationCap, ChevronRight, MessageSquare, Headphones } from 'lucide-react';
import { Category } from './types';
import { COMPANY_LINKS, RESOURCE_LINKS } from './navLinks';
import { getCachedCourses, fetchCoursesForCategory } from '@/lib/courseCache';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

// Resources includes Corporate Training (the desktop "Enterprise" link), so no separate Menu group.
const NAV_GROUPS = [
  { title: 'Resources', links: RESOURCE_LINKS },
  { title: 'Company', links: COMPANY_LINKS },
];

export default function MobileMenu({ isOpen, onClose, categories }: MobileMenuProps) {
  const [isCoursesOpen, setIsCoursesOpen] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [coursesByCat, setCoursesByCat] = useState<Record<string, Category['courses']>>({});
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleClose = () => {
    setExpandedCategory(null);
    onClose();
  };

  // Safe on-demand course fetch using shared global cache
  const fetchCategoryCourses = useCallback(async (slug: string) => {
    if (!slug) return;

    // If already in synchronous memory cache or populated in props, nothing to fetch
    if (getCachedCourses(slug)) return;

    const cat = categories.find((c) => c.slug === slug);
    if (cat?.courses && cat.courses.length > 0) return;

    setLoadingCategory(slug);

    try {
      const courses = await fetchCoursesForCategory(slug);
      setCoursesByCat((prev) => ({
        ...prev,
        [slug]: courses,
      }));
    } finally {
      setLoadingCategory((curr) => (curr === slug ? null : curr));
    }
  }, [categories]);

  const toggleCategory = (slug: string) => {
    const next = expandedCategory === slug ? null : slug;
    setExpandedCategory(next);
    if (next) {
      fetchCategoryCourses(next);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${
        isOpen
          ? 'visible pointer-events-auto'
          : 'invisible pointer-events-none transition-[visibility] duration-300'
      }`}
    >
      {/* Backdrop with smooth fade (no backdrop-blur to avoid mobile GPU stutter/thermal throttling) */}
      <div
        className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer with smooth 3D hardware-accelerated slide-in from left */}
      <div
        className={`fixed inset-y-0 left-0 w-full max-w-[320px] sm:max-w-sm bg-white shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out transform-gpu will-change-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-white flex-shrink-0">
          <Link href="/" onClick={handleClose}>
            <BrandLogo className="h-7" />
          </Link>
          <button
            onClick={handleClose}
            aria-label="Close menu"
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 active:scale-95 transition-all touch-manipulation cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-3 space-y-3">
          {/* Courses & Categories Section */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setIsCoursesOpen(!isCoursesOpen)}
              className="w-full flex items-center justify-between p-3 font-semibold text-xs sm:text-sm text-prime-dark bg-slate-50 hover:bg-slate-100 transition-colors touch-manipulation cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="text-prime text-base" size={18} />
                <span>Explore All Courses</span>
                {categories.length > 0 && (
                  <span className="text-[10px] text-zinc-500 font-normal">
                    ({categories.length} {categories.length === 1 ? 'Category' : 'Categories'})
                  </span>
                )}
              </div>
              <ChevronDown
                size={18}
                className={`text-zinc-400 transition-transform duration-200 ${isCoursesOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isCoursesOpen && (
              <div className="divide-y divide-zinc-100 border-t border-zinc-200">
                {categories.map((category) => {
                  const isExpanded = expandedCategory === category.slug;
                  const activeCategoryCourses =
                    coursesByCat[category.slug] ||
                    getCachedCourses(category.slug) ||
                    category.courses ||
                    [];
                  const isFetchingCategory = loadingCategory === category.slug;

                  return (
                    <div key={category.slug} className="bg-white">
                      {/* Category Header Button */}
                      <button
                        onClick={() => toggleCategory(category.slug)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-xs font-semibold transition-colors touch-manipulation cursor-pointer ${isExpanded
                          ? 'bg-prime/5 text-prime'
                          : 'text-zinc-800 hover:bg-zinc-50'
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <GraduationCap
                            size={16}
                            className={`shrink-0 ${isExpanded ? 'text-prime-yellow' : 'text-zinc-400'}`}
                          />
                          <span className="truncate">{category.name}</span>
                          {activeCategoryCourses.length > 0 && (
                            <span className="text-[10px] text-zinc-400 font-normal shrink-0">
                              ({activeCategoryCourses.length})
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-zinc-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-prime' : ''}`}
                        />
                      </button>

                      {/* Course Items List inside Category */}
                      {isExpanded && (
                        <div className="bg-slate-50/70 px-2 py-2 space-y-1.5 border-t border-zinc-100">
                          {isFetchingCategory ? (
                            <div className="p-3 text-center text-xs text-zinc-400 animate-pulse">
                              Loading programs...
                            </div>
                          ) : activeCategoryCourses.length > 0 ? (
                            activeCategoryCourses.map((course) => {
                              const iconUrl =
                                course.courseCard?.courseIcon?.thumbnail ||
                                course.courseCard?.courseIcon?.url;
                              const duration = course.courseCard?.courseDuration;

                              return (
                                  <Link
                                    key={course.slug}
                                    href={`/${category.slug}/${course.slug}`}
                                    onClick={handleClose}
                                    className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-zinc-200/80 hover:border-prime/50 hover:bg-prime/5 transition-all block"
                                  >
                                  {/* Icon */}
                                  <div className="w-7 h-7 rounded bg-prime/5 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                                    {iconUrl ? (
                                      <Image
                                        src={iconUrl}
                                        alt={course.name}
                                        width={28}
                                        height={28}
                                        className="w-full h-full object-contain p-0.5"
                                      />
                                    ) : (
                                      <div className="w-2 h-2 rounded-full bg-prime-yellow" />
                                    )}
                                  </div>

                                  {/* Title & Duration */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-xs font-medium text-prime-dark line-clamp-2 leading-tight">
                                        {course.name}
                                      </span>
                                      <ChevronRight className="text-zinc-400 size-3 shrink-0" />
                                    </div>
                                    {duration && (
                                      <span className="text-[10px] text-zinc-500 font-normal block mt-0.5">
                                        {duration} • Live Online
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              );
                            })
                          ) : (
                            <p className="text-[11px] text-zinc-400 p-2 text-center">
                              No courses listed in this domain yet
                            </p>
                          )}

                          {/* View All Category Link */}
                          <Link
                            href={`/${category.slug}`}
                            onClick={handleClose}
                            className="block text-center text-[11px] font-semibold text-prime hover:underline py-1"
                          >
                            View All {category.name} &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Nav Links */}
          {NAV_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title} className="space-y-0.5 pt-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3 pb-1">
                {group.title}
              </div>
              {group.links.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  onClick={handleClose}
                  className="block px-3 py-2 text-xs font-medium text-zinc-700 hover:text-prime hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        {/* Footer Quick Support */}
        <div className="p-3 border-t border-zinc-200 bg-slate-50 flex items-center justify-between text-xs flex-shrink-0">
          <Link
            href="https://wa.me/919513001835"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="flex items-center gap-2 text-prime font-semibold hover:opacity-80"
          >
            <MessageSquare size={15} className="text-prime-yellow" />
            <span className="text-[11px]">Chat on WhatsApp</span>
          </Link>

          <Link
            href="mailto:reachus@nivlearn.com"
            onClick={handleClose}
            className="flex items-center gap-1.5 text-zinc-600 hover:text-prime"
          >
            <Headphones size={15} className="text-zinc-500" />
            <span className="text-[11px]">Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
