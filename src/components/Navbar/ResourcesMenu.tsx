'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { COMPANY_LINKS, RESOURCE_LINKS } from './navLinks';
import NavContact from './NavContact';

interface ResourcesMenuProps {
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  topOffset?: number;
}

export default function ResourcesMenu({
  onClose,
  onMouseEnter,
  onMouseLeave,
  topOffset = 64,
}: ResourcesMenuProps) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest('.custom-scrollbar') as HTMLElement | null;

      if (!scrollable) {
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const isAtTop = scrollTop <= 0 && e.deltaY < 0;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 1 && e.deltaY > 0;

      if (isAtTop || isAtBottom) {
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
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: `calc(100vh - ${topOffset + 24}px)`,
        }}
        className="bg-white rounded-xl shadow-2xl border border-zinc-200/90 w-full max-w-5xl mx-auto overflow-hidden flex flex-col h-[480px] cursor-auto overscroll-contain"
      >
        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0 p-6 gap-6">
          {/* Main Resources */}
          <div className="flex-1 border-r border-zinc-100 pr-6 overflow-y-auto overscroll-contain custom-scrollbar">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex-shrink-0">
              Resources &amp; Community
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {RESOURCE_LINKS.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  onClick={onClose}
                  className="group block p-3 rounded-lg border border-zinc-100 hover:border-prime/40 hover:bg-prime/5 transition-all"
                >
                  <span className="font-semibold text-xs text-prime-dark group-hover:text-prime transition-colors block">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                    {item.descp}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div className="w-64 sm:w-72 flex-shrink-0 overflow-y-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex-shrink-0">
              Company
            </h4>
            <div className="space-y-1">
              {COMPANY_LINKS.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold text-prime-dark hover:bg-prime/5 hover:text-prime transition-colors"
                >
                  {item.name}
                  <span aria-hidden>&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Contact Footer (Anchored) */}
        <NavContact />
      </div>
    </div>
  );
}
