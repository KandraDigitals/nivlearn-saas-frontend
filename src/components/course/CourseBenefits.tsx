'use client';

import React, { useState, useMemo } from 'react';
import {
  User,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useLeadModal } from '@/context/LeadModalContext';
import type { CourseDetail } from '@/services/catalog.service';

/**
 * Robust utility to parse raw HTML strings (like `<ul><li>...</li></ul>` or `<p>...<br>...</p>`)
 * into clean, standalone benefit bullet strings.
 */
function parseBenefitItems(html?: string): string[] {
  if (!html) return [];

  // Match <li> elements first
  const liMatches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (liMatches && liMatches.length > 0) {
    return liMatches
      .map((item) =>
        item
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter((text) => text.length > 0 && text !== '<br>');
  }

  // Fallback: match <p> tags
  const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (pMatches && pMatches.length > 0) {
    return pMatches
      .map((p) =>
        p
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .trim()
      )
      .filter(Boolean);
  }

  // Last fallback: split by line breaks or sentences
  const cleaned = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned ? [cleaned] : [];
}

export default function CourseBenefits({ course }: { course: CourseDetail }) {
  const [activeTab, setActiveTab] = useState<'individual' | 'organisational'>('individual');
  const { openModal } = useLeadModal();

  const benefits = course.benefits_section || (course.overview_content?.benefits ? {
    benefits_desc: course.overview_content.benefits.description,
    individual_benefits: course.overview_content.benefits.individual,
    organisational_benefits: course.overview_content.benefits.organization,
  } : undefined);

  const individualItems = useMemo(
    () => parseBenefitItems(benefits?.individual_benefits),
    [benefits?.individual_benefits]
  );

  const organisationalItems = useMemo(
    () => parseBenefitItems(benefits?.organisational_benefits),
    [benefits?.organisational_benefits]
  );

  if (
    !benefits ||
    (individualItems.length === 0 &&
      organisationalItems.length === 0 &&
      !benefits.benefits_desc)
  ) {
    return null;
  }

  const hasIndividual = individualItems.length > 0;
  const hasOrganisational = organisationalItems.length > 0;
  const hasBothTabs = hasIndividual && hasOrganisational;

  const currentItems = activeTab === 'individual'
    ? (hasIndividual ? individualItems : organisationalItems)
    : (hasOrganisational ? organisationalItems : individualItems);

  const handleActionClick = () => {
    if (activeTab === 'individual') {
      openModal({
        formTitle: `Enquire About ${course.course_title}`,
        formDescription: `Connect with an admissions advisor to discuss learning outcomes, syllabus, and placement support.`,
        defaultValues: {
          leadSource: `course-benefits-individual-${course.slug}`,
          courseSlug: course.slug,
          purpose: 'Upskilling',
        },
        config: {
          showCourse: false,
          purpose: true,
          showMessage: false,
        },
      });
    } else {
      openModal({
        formTitle: 'Corporate & Team Training Quote',
        formDescription: `Train your team on ${course.course_title} with dedicated cohorts, custom milestones, and corporate pricing.`,
        defaultValues: {
          leadSource: `course-benefits-corporate-${course.slug}`,
          courseSlug: course.slug,
          purpose: 'Corporate Training for Team',
        },
        config: {
          showCourse: false,
          company: true,
          purpose: true,
          showMessage: false,
        },
      });
    }
  };

  return (
    <section id="benefits" className="relative bg-light py-12 lg:py-16 border-y border-border-muted/50">
      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

          {/* ── Left Column: Context, Tabs & CTA ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 self-start space-y-5">

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-prime/10 text-prime text-[11px] font-bold tracking-widest uppercase mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Measurable Career Value</span>
              </div>

              <h2 className="font-heading text-xl 2xl:text-2xl lg:text-[1.75rem] font-extrabold text-prime-dark tracking-tight leading-snug">
                Program Benefits
              </h2>

              {benefits.benefits_desc && (
                <div
                  className="text-text-muted text-xs sm:text-sm mt-3 leading-relaxed [&_p]:mb-1.5 [&_p]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: benefits.benefits_desc }}
                />
              )}
            </div>

            {/* Tab Switcher */}
            {hasBothTabs && (
              <div className="inline-flex items-center self-start p-1 rounded-xl bg-border-muted/40 shadow-inner border border-border-muted/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('individual')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'individual'
                    ? 'bg-prime text-on-dark shadow-xs'
                    : 'text-text-muted hover:text-prime-dark'
                    }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>For Individuals</span>
                  <span className={`text-[10px] min-w-[18px] text-center px-1.5 py-0.5 rounded-full font-semibold ${activeTab === 'individual' ? 'bg-white/20 text-on-dark' : 'bg-border-muted text-text-muted'
                    }`}>
                    {individualItems.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('organisational')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'organisational'
                    ? 'bg-prime text-on-dark shadow-xs'
                    : 'text-text-muted hover:text-prime-dark'
                    }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>For Organisations</span>
                  <span className={`text-[10px] min-w-[18px] text-center px-1.5 py-0.5 rounded-full font-semibold ${activeTab === 'organisational' ? 'bg-white/20 text-on-dark' : 'bg-border-muted text-text-muted'
                    }`}>
                    {organisationalItems.length}
                  </span>
                </button>
              </div>
            )}

            {/* CTA Card — pushed to bottom via mt-auto */}
            <div className="rounded-xl bg-surface border border-border-muted/70 p-5 shadow-xs">
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                {activeTab === 'individual'
                  ? 'Connect with a NivLearn advisor to get a personalised curriculum walkthrough, batch schedules, and placement support details.'
                  : 'Get a customised proposal with dedicated cohorts, enterprise progress tracking, and volume pricing for your team.'}
              </p>
              <button
                type="button"
                onClick={handleActionClick}
                className="w-full py-2.5 px-4 bg-prime hover:bg-prime-outline text-on-dark text-xs sm:text-sm font-semibold rounded-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>{activeTab === 'individual' ? 'Enquire About Course' : 'Request Enterprise Quote'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* ── Right Column: Full-width stacked benefit rows ── */}
          <div className={`lg:col-span-7 ${currentItems.length > 4 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-2.5"}`}>
            {currentItems.map((item, index) => {
              const itemNumber = (index + 1).toString().padStart(2, '0');
              return (
                <div
                  key={`${activeTab}-${index}`}
                  className="group relative flex items-center gap-3 bg-surface rounded-xl px-4 py-3.5 border border-border-muted/70 hover:border-prime/40 hover:shadow-sm transition-all duration-200 overflow-hidden"
                >
                  {/* Left brand accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-prime/20 group-hover:bg-prime transition-colors duration-200" />

                  {/* Number pill */}
                  <span className="ml-2 w-8 h-8 rounded-lg bg-prime/8 text-prime text-xs font-extrabold flex items-center justify-center shrink-0 tabular-nums group-hover:bg-prime group-hover:text-on-dark transition-colors duration-200 border border-prime/15 group-hover:border-prime">
                    {itemNumber}
                  </span>

                  {/* Text — takes all remaining space so the row fills width */}
                  <p className="flex-1 text-xs sm:text-sm font-semibold text-prime-dark group-hover:text-prime transition-colors leading-snug">
                    {item}
                  </p>

                  {/* Success tick */}
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-success/70 group-hover:text-success transition-colors" />
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
