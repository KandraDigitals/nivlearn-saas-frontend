'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLeadModal } from '@/context/LeadModalContext';
import { LEAD_FORMS } from '@/lib/leadForms';

const STORAGE_KEY = 'nivlearn_site_popup_dismissed';
const SUBMITTED_KEY = 'nivlearn_lead_submitted';

// Sensitive or conversion routes where the popup should never fire
const EXCLUDED_PATHS = [
  '/checkout',
  '/privacy-policy',
  '/terms-and-conditions',
  '/refund-policy',
  '/grievance-redressal-policy',
];

export default function SiteLevelPopupTrigger() {
  const pathname = usePathname();
  const { isOpen, openModal } = useLeadModal();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // 1. If a modal is already open or already triggered in this session instance, skip
    if (isOpen || hasTriggeredRef.current) return;

    // 2. Check excluded routes
    if (EXCLUDED_PATHS.some((path) => pathname?.startsWith(path))) return;

    // 3. Check sessionStorage (dismissed this session) and localStorage (already converted)
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === 'true') return;
      if (localStorage.getItem(SUBMITTED_KEY) === 'true') return;
    } catch {
      // Storage access blocked or restricted (private browsing)
    }

    const triggerPopup = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;

      try {
        sessionStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // Storage write error
      }

      openModal(LEAD_FORMS.siteLevel);
    };

    // Trigger A: Desktop Exit-Intent (cursor moving towards browser top boundary)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && !hasTriggeredRef.current) {
        triggerPopup();
      }
    };

    // Trigger B: Mobile / Scroll Depth (40% down the page)
    const handleScroll = () => {
      if (hasTriggeredRef.current) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 100) {
        const scrollPercent = (scrollTop / docHeight) * 100;
        if (scrollPercent >= 40) {
          triggerPopup();
        }
      }
    };

    // Trigger C: Smart Timer Fallback (15 seconds of active browsing)
    const timer = setTimeout(() => {
      if (!hasTriggeredRef.current) {
        triggerPopup();
      }
    }, 15000);

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname, isOpen, openModal]);

  return null;
}
