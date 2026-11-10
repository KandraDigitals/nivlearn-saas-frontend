'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';
import { buttonClass } from '@/components/ui/button';
import { Menu, ChevronDown, Search, LayoutGrid } from 'lucide-react';

import { Category } from './types';
import SearchBar from './SearchBar';
import CourseMenu from './CourseMenu';
import ResourcesMenu from './ResourcesMenu';
import MobileMenu from './MobileMenu';
import { prefetchCategoryCourses } from '@/lib/courseCache';

interface NavbarClientProps {
    categories?: Category[];
}

export default function NavbarClient({ categories = [] }: NavbarClientProps) {
    const [activeMenu, setActiveMenu] = useState<'courses' | 'resources' | null>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        categories[0] ?? null
    );

    const navRef = useRef<HTMLElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [topOffset, setTopOffset] = useState<number>(64);

    // Prefetch first category in background during browser idle time
    useEffect(() => {
        if (categories.length > 0 && categories[0]?.slug) {
            prefetchCategoryCourses(categories[0].slug);
        }
    }, [categories]);

    // Calculate exact bottom edge of navbar before opening dropdowns
    const updateOffset = useCallback(() => {
        if (navRef.current) {
            const rect = navRef.current.getBoundingClientRect();
            const bottom = Math.max(0, Math.round(rect.bottom));
            setTopOffset((prev) => (prev !== bottom ? bottom : prev));
        }
    }, []);

    useEffect(() => {
        if (!activeMenu) return;

        updateOffset();
        window.addEventListener('resize', updateOffset);

        return () => {
            window.removeEventListener('resize', updateOffset);
        };
    }, [activeMenu, updateOffset]);

    // Desktop hover handlers with smooth debounce
    const handleMouseEnter = (menu: 'courses' | 'resources') => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        updateOffset();
        setActiveMenu(menu);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setActiveMenu(null);
        }, 180);
    };

    const handleCancelLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    // Close menu when clicking outside or pressing Escape
    useEffect(() => {
        if (!activeMenu) return;

        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (navRef.current && !navRef.current.contains(target)) {
                setActiveMenu(null);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setActiveMenu(null);
                setIsMobileSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [activeMenu]);

    return (
        <>
            <nav ref={navRef} className="relative w-full z-40 bg-surface border-b border-border-muted/60">
                <div className="section-container">
                    <div className="flex items-center justify-between h-16 py-3">
                        {/* Mobile In-Navbar Active Search Field */}
                        {isMobileSearchOpen ? (
                            <div className="flex lg:hidden items-center gap-2 w-full animate-in fade-in duration-150">
                                <SearchBar
                                    categories={categories}
                                    autoFocus
                                    className="flex-1"
                                    onSelect={() => setIsMobileSearchOpen(false)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsMobileSearchOpen(false)}
                                    className="px-2 py-1.5 text-xs font-semibold text-text-muted hover:text-prime-dark cursor-pointer shrink-0"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            /* Standard Navbar Content */
                            <>
                                {/* Left: Brand + Course Button + Search */}
                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <Link href="/" className="flex-shrink-0" onClick={() => setActiveMenu(null)}>
                                        <BrandLogo className="h-7 md:h-9" preload />
                                    </Link>

                                    <div className="hidden lg:flex items-center gap-3">
                                        {/* Courses Button: Hover & Click on Desktop */}
                                        <button
                                            type="button"
                                            onMouseEnter={() => handleMouseEnter('courses')}
                                            onMouseLeave={handleMouseLeave}
                                            onClick={() => {
                                                updateOffset();
                                                setActiveMenu(activeMenu === 'courses' ? null : 'courses');
                                            }}
                                            className={`rounded-md px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-colors ${activeMenu === 'courses'
                                                ? 'bg-prime text-on-dark shadow-xs'
                                                : 'bg-prime-dark hover:bg-prime-dark/90 text-on-dark'
                                                }`}
                                        >
                                            <LayoutGrid size={18} />
                                            <span className="font-montserrat text-sm font-medium">Courses</span>
                                            <ChevronDown
                                                size={14}
                                                className={`transition-transform duration-200 ${activeMenu === 'courses' ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        </button>

                                        {/* Search on Desktop */}
                                        <SearchBar
                                            categories={categories}
                                            onFocus={() => setActiveMenu(null)}
                                        />
                                    </div>
                                </div>

                                {/* Right: Navigation Links */}
                                <div className="hidden lg:flex items-center gap-6">
                                    <Link
                                        href="/corporate"
                                        onClick={() => setActiveMenu(null)}
                                        className="text-sm font-medium font-montserrat text-prime-dark hover:text-prime-yellow transition-colors"
                                    >
                                        Enterprise
                                    </Link>

                                    <button
                                        type="button"
                                        onMouseEnter={() => handleMouseEnter('resources')}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => setActiveMenu(activeMenu === 'resources' ? null : 'resources')}
                                        className={`flex items-center gap-1 text-sm font-medium font-montserrat cursor-pointer transition-colors py-1 ${activeMenu === 'resources' ? 'text-prime-yellow' : 'text-prime-dark hover:text-prime-yellow'
                                            }`}
                                    >
                                        <span>Resources</span>
                                        <ChevronDown
                                            size={14}
                                            className={`transition-transform duration-200 ${activeMenu === 'resources' ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    <Link
                                        href="/contact-us"
                                        onClick={() => setActiveMenu(null)}
                                        className={buttonClass('primary', 'md', 'font-montserrat')}
                                    >
                                        Contact Us
                                    </Link>
                                </div>

                                {/* Mobile Icons: Search Icon + Hamburger Menu */}
                                <div className="flex lg:hidden items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveMenu(null);
                                            setIsMobileSearchOpen(true);
                                        }}
                                        aria-label="Search courses"
                                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-prime-dark hover:bg-sec-prime active:scale-95 transition-all touch-manipulation cursor-pointer"
                                    >
                                        <Search size={20} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsMobileOpen(true)}
                                        aria-label="Open menu"
                                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-prime-dark hover:bg-sec-prime active:scale-95 transition-all touch-manipulation cursor-pointer"
                                    >
                                        <Menu size={22} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Courses Mega Dropdown */}
                {activeMenu === 'courses' && (
                    <CourseMenu
                        categories={categories}
                        selectedCategory={selectedCategory || categories[0] || null}
                        onSelectCategory={(cat) => setSelectedCategory(cat)}
                        onMouseEnter={handleCancelLeave}
                        onMouseLeave={handleMouseLeave}
                        onClose={() => setActiveMenu(null)}
                        topOffset={topOffset}
                    />
                )}

                {/* Resources Mega Dropdown */}
                {activeMenu === 'resources' && (
                    <ResourcesMenu
                        onMouseEnter={handleCancelLeave}
                        onMouseLeave={handleMouseLeave}
                        onClose={() => setActiveMenu(null)}
                        topOffset={topOffset}
                    />
                )}
            </nav>

            {/* Mobile Drawer Navigation (Smooth slide-in & full courses list) */}
            <MobileMenu
                isOpen={isMobileOpen}
                onClose={() => setIsMobileOpen(false)}
                categories={categories}
            />
        </>
    );
}
