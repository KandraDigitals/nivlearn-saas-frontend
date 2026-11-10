'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useLeadModal } from '@/context/LeadModalContext';
import type { Category, Course } from '@/components/Navbar/types';
import { CategoryTabs, CourseCard, MobileCourseView } from './courses';
import { getCachedCourses, fetchCoursesForCategory } from '@/lib/courseCache';

export interface CoursesSectionProps {
    categories?: Category[];
    title?: string;
    subtitle?: string;
}

function CourseCardSkeleton() {
    return (
        <div className="flex flex-col justify-between bg-surface border border-border-muted rounded-md shadow-xs overflow-hidden animate-pulse">
            <div className="w-full">
                <div className="w-full aspect-[16/9] bg-slate-200/80" />
            </div>
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                    <div className="w-24 h-4 bg-slate-200 rounded mb-3" />
                    <div className="space-y-2 mb-4">
                        <div className="w-4/5 h-5 bg-slate-200 rounded" />
                        <div className="w-1/2 h-5 bg-slate-200 rounded" />
                    </div>
                    <div className="space-y-2 mb-4">
                        <div className="w-32 h-3.5 bg-slate-100 rounded" />
                        <div className="w-28 h-3.5 bg-slate-100 rounded" />
                    </div>
                </div>
                <div className="pt-2 border-t border-border-muted/30 grid grid-cols-2 gap-2 mt-auto">
                    <div className="h-8 bg-slate-100 rounded-md" />
                    <div className="h-8 bg-slate-200 rounded-md" />
                </div>
            </div>
        </div>
    );
}

export default function CoursesSection({
    categories = [],
    title = 'Explore In-Demand Courses',
    subtitle = 'Hands-on curriculum designed by industry tech leaders to advance your professional career.',
}: CoursesSectionProps) {
    const { openModal } = useLeadModal();

    // Active category selection
    const [selectedSlug, setSelectedSlug] = useState<string>(
        categories[0]?.slug || ''
    );
    const [coursesByCat, setCoursesByCat] = useState<Record<string, Course[]>>({});
    const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

    // Visible count for desktop grid (Load More pagination)
    const [visibleCount, setVisibleCount] = useState<number>(6);

    const activeCategory = useMemo(() => {
        return (
            categories.find((c) => c.slug === selectedSlug) ||
            categories[0] ||
            null
        );
    }, [categories, selectedSlug]);

    // On-demand course fetch when a category tab is selected
    useEffect(() => {
        const slug = selectedSlug || activeCategory?.slug;
        if (!slug) return;

        // If already in synchronous memory cache or populated in props, nothing to fetch
        if (
            getCachedCourses(slug) ||
            (activeCategory?.courses && activeCategory.courses.length > 0)
        ) {
            return;
        }

        let isMounted = true;
        queueMicrotask(() => {
            if (isMounted) setLoadingSlug(slug);
        });

        fetchCoursesForCategory(slug)
            .then((courses) => {
                if (!isMounted) return;
                setCoursesByCat((prev) => ({
                    ...prev,
                    [slug]: courses,
                }));
            })
            .finally(() => {
                if (isMounted) setLoadingSlug(null);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedSlug, activeCategory, coursesByCat]);

    const courses: Course[] = useMemo(() => {
        const slug = selectedSlug || activeCategory?.slug;
        if (!slug) return [];
        return (
            coursesByCat[slug] ||
            getCachedCourses(slug) ||
            activeCategory?.courses ||
            []
        );
    }, [selectedSlug, activeCategory, coursesByCat]);

    const displayedCourses = useMemo(() => {
        return courses.slice(0, visibleCount);
    }, [courses, visibleCount]);

    const handleCategoryChange = (slug: string) => {
        setSelectedSlug(slug);
        setVisibleCount(6);
    };

    const handleEnquire = (course: Course) => {
        openModal({
            formTitle: `Enquire About ${course.name}`,
            formDescription: `Get detailed syllabus, upcoming batch schedules, and fee details for ${course.name}.`,
            defaultValues: {
                courseSlug: course.slug,
                leadSource: 'home-courses-grid',
            },
            config: {
                showCourse: true,
                showMessage: true,
                purpose: true,
            },
        });
    };

    if (categories.length === 0) {
        return null;
    }

    const activeCategorySlug = activeCategory?.slug || '';
    const currentSlug = selectedSlug || activeCategorySlug;
    const hasLoadedCategory = coursesByCat[currentSlug] !== undefined;
    const hasCourses = (coursesByCat[currentSlug]?.length ?? 0) > 0 || (activeCategory?.courses?.length ?? 0) > 0;
    const isLoading = loadingSlug === currentSlug || (!hasLoadedCategory && !hasCourses);

    return (
        <section
            className="py-8 mt-4 md:mt-0 md:py-16 bg-surface"
            id="courses"
        >
            <div className="section-container">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-prime/10 border border-prime/15 text-prime text-[11px] 2xl:text-xs font-bold uppercase tracking-wider mb-2.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Top Learning Paths</span>
                        </div>
                        <h2 className="font-heading text-2xl sm:text-3xl 2xl:text-4xl font-extrabold text-prime-dark tracking-tight">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="mt-2 text-sm text-text-muted max-w-2xl">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Modular Category Navigation Tabs */}
                <CategoryTabs
                    categories={categories}
                    selectedSlug={activeCategorySlug}
                    onSelectCategory={handleCategoryChange}
                />

                {/* Content: 1) Loading Skeleton, 2) Empty State, 3) Courses View */}
                {isLoading ? (
                    <>
                        {/* Mobile Skeleton: Single Card + Controls */}
                        <div className="block md:hidden w-full max-w-sm mx-auto">
                            <CourseCardSkeleton />
                            <div className="flex items-center justify-between mt-5 px-1 animate-pulse">
                                <div className="w-24 h-8 bg-slate-100 rounded-md" />
                                <div className="w-16 h-4 bg-slate-100 rounded" />
                                <div className="w-20 h-8 bg-slate-100 rounded-md" />
                            </div>
                        </div>

                        {/* Desktop & Tablet Skeleton Grid: 6 Cards */}
                        <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <CourseCardSkeleton key={i} />
                            ))}
                        </div>
                    </>
                ) : courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-surface-muted border border-border-muted/50 my-6">
                        <BookOpen className="w-10 h-10 text-text-muted/60 mb-3" />
                        <h3 className="text-base sm:text-lg font-bold text-prime-dark mb-1">
                            No courses available yet
                        </h3>
                        <p className="text-xs sm:text-sm text-text-muted max-w-sm">
                            Courses for{' '}
                            <span className="font-semibold text-prime">
                                {activeCategory?.name}
                            </span>{' '}
                            are being updated. Check back shortly or contact our team.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* 1. Mobile View: 1 Card at a time + Previous & Next Buttons */}
                        <MobileCourseView
                            courses={courses}
                            activeCategorySlug={activeCategorySlug}
                            onEnquire={handleEnquire}
                        />

                        {/* 2. Desktop & Tablet Grid View */}
                        <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {displayedCourses.map((course, idx) => (
                                <CourseCard
                                    key={`${course.slug}-${idx}`}
                                    course={course}
                                    activeCategorySlug={activeCategorySlug}
                                    onEnquire={handleEnquire}
                                />
                            ))}
                        </div>

                        {/* Load More Button (Desktop only) */}
                        {courses.length > visibleCount && (
                            <div className="hidden md:flex justify-center items-center mt-10">
                                <button
                                    type="button"
                                    onClick={() => setVisibleCount((prev) => prev + 6)}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 border border-prime text-prime hover:bg-prime hover:text-on-dark font-semibold text-sm rounded-md shadow-xs transition-colors cursor-pointer"
                                >
                                    <span>Load More Courses</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
