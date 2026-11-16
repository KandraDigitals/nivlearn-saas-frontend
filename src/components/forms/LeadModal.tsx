'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    X,
    CheckCircle2,
    BookOpen,
    Building2,
    GraduationCap,
    Star,
    ShieldCheck,
    Download
} from 'lucide-react';
import { useLeadModal } from '@/context/LeadModalContext';
import LeadForm from './LeadForm';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import type { CourseOptionItem } from './types';

interface LeadModalProps {
    courses?: CourseOptionItem[];
}

export default function LeadModal({ courses }: LeadModalProps = {}) {
    const pathname = usePathname();
    const pathSegments = (pathname || '').split('/').filter(Boolean);
    const isCoursePage = pathSegments.length >= 2 && pathSegments[0] !== 'blog' && pathSegments[0] !== 'api';
    const activeCourseSlug = isCoursePage ? pathSegments[1] : undefined;

    const { isOpen, closeModal, modalConfig, courses: contextCourses } = useLeadModal();
    const effectiveCourses = courses || modalConfig.courses || contextCourses;

    const resolvedCourseSlug =
        modalConfig.defaultValues?.courseSlug ||
        modalConfig.courseSlug ||
        (isCoursePage ? activeCourseSlug : undefined);

    const [visible, setVisible] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Keep mounted during exit animation
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setVisible(true);
                setIsSuccess(false);
            }, 0);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => {
                setVisible(false);
                setIsSuccess(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useBodyScrollLock(visible);

    if (!visible) return null;

    const rawTitle = modalConfig.formTitle || 'Talk to Learning Advisor';
    const title = typeof rawTitle === 'string' ? rawTitle : 'Talk to Learning Advisor';

    const titleLower = title.toLowerCase();
    const isCurriculum = titleLower.includes('curriculum') || titleLower.includes('syllabus') || titleLower.includes('download');
    const isCorporate =
        titleLower.includes('corporate') ||
        Boolean(modalConfig.config?.company) ||
        Boolean(modalConfig.config?.designation) ||
        (modalConfig.defaultValues?.purpose || '').toLowerCase().includes('corporate');

    // Determine category badge
    const badge = isCorporate
        ? { text: 'Corporate Training', icon: Building2, color: 'text-amber-700 bg-amber-500/10 border-amber-500/20' }
        : isCurriculum
            ? { text: 'Curriculum Guide', icon: BookOpen, color: 'text-prime bg-prime/10 border-prime/20' }
            : { text: 'Admissions Advisory', icon: GraduationCap, color: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' };

    // Format long course titles cleanly
    let displayHeadline = title;
    let courseSubtitle = '';
    if (title.startsWith('Corporate Training:')) {
        displayHeadline = 'Enterprise Team Training';
        courseSubtitle = title.replace('Corporate Training:', '').trim();
    } else if (title.toLowerCase() === 'corporate training' || isCorporate) {
        displayHeadline = 'Enterprise Team Training';
        courseSubtitle = 'Customized cohorts & workforce upskilling for organizations';
    } else if (title.startsWith('Enquire About')) {
        displayHeadline = 'Personalized Course Advisory';
        courseSubtitle = title.replace('Enquire About', '').trim();
    } else if (title.startsWith('Connect with')) {
        displayHeadline = 'Connect with Course Advisor';
        courseSubtitle = title.replace('Connect with a Course Advisor', '').trim();
    } else if (isCurriculum) {
        displayHeadline = 'Download Detailed Curriculum';
    }

    return (
        <div
            className={`fixed z-50 inset-0 flex items-center justify-center overflow-y-auto bg-overlay/65 backdrop-blur-xs p-3 sm:p-4 md:p-6 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                }`}
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`relative flex flex-col md:flex-row bg-surface rounded-2xl shadow-2xl border border-border-muted/60 transition-all duration-300 transform max-w-md sm:max-w-xl md:max-w-2xl w-full overflow-hidden max-h-[92vh] sm:max-h-[90vh] ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modern Integrated Close Button */}
                <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Close modal"
                    className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-surface-muted/90 hover:bg-sec-prime border border-border-muted/70 text-text-muted hover:text-prime-dark flex items-center justify-center transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-prime/20"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Thank You Section */}
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center w-full py-12 px-6 text-center bg-gradient-to-b from-light/40 to-surface">
                        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-success/5 animate-in zoom-in-75 duration-300">
                            <CheckCircle2 className="w-9 h-9" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-prime-dark mb-2">Inquiry Received!</h2>
                        <p className="text-text-muted text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
                            Thank you for your interest. A certified NivLearn learning advisor has been assigned and will connect with you within 15 minutes.
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-prime/10 text-prime text-xs font-semibold mb-6">
                            <ShieldCheck className="w-4 h-4 text-prime" />
                            <span>Confirmation details sent to your registered email</span>
                        </div>
                        {modalConfig.downloadUrl ? (
                            <div className="flex flex-col items-center gap-2 mb-4 w-full max-w-xs">
                                <a
                                    href={modalConfig.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-prime-yellow hover:bg-amber-400 text-prime-dark font-extrabold rounded-xl shadow-xs transition-colors text-xs sm:text-sm cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download Syllabus PDF Now</span>
                                </a>
                                <p className="text-[11px] text-text-muted">
                                    Your download should start automatically. If not, click above.
                                </p>
                            </div>
                        ) : null}
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-6 py-2 border border-border-muted hover:bg-slate-100 text-text-muted hover:text-prime-dark font-semibold rounded-xl transition-colors text-xs sm:text-sm cursor-pointer"
                        >
                            Back to NivLearn
                        </button>
                    </div>
                ) : (
                    /* Main Modal Content */
                    <div className="flex flex-col md:flex-row w-full h-full items-stretch">
                        {/* Left Section: Clean Trust & Advisor Column (Desktop) */}
                        <div className="hidden md:flex flex-col justify-between md:w-[42%] bg-gradient-to-b from-light/90 via-surface to-light/40 border-r border-border-muted/50 p-6">
                            {/* Top: Branding & Intent Badge */}
                            <div>
                                <div className="mb-3">
                                    <Image
                                        src="/logo.svg"
                                        alt="NivLearn"
                                        width={130}
                                        height={32}
                                        priority
                                        className="object-contain h-6.5 w-auto"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${badge.color}`}>
                                        <badge.icon className="w-3.5 h-3.5" />
                                        <span>{badge.text}</span>
                                    </span>
                                    <h2 className="text-base font-black text-prime-dark tracking-tight leading-snug pt-1">
                                        {displayHeadline}
                                    </h2>
                                    {courseSubtitle && (
                                        <p className="text-xs font-semibold text-prime line-clamp-2">
                                            {courseSubtitle}
                                        </p>
                                    )}
                                </div>

                                {/* Advisor Image with Live Status */}
                                <div className="relative rounded-xl overflow-hidden shadow-sm border border-border-muted/60 bg-surface mt-3">
                                    <Image
                                        src="/Forms/lead-advisor-photo.webp"
                                        alt="NivLearn Admissions Advisor"
                                        width={320}
                                        height={200}
                                        priority
                                        className="w-full h-32 sm:h-36 object-cover object-top"
                                    />
                                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-surface/95 backdrop-blur-xs border border-border-muted/60 flex items-center gap-1.5 shadow-xs">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-[10px] font-bold text-prime-dark">Online • 15m Callback</span>
                                    </div>
                                </div>

                                {/* Reassurance Checklist (Adapts cleanly to form height) */}
                                <div className="mt-3 space-y-1.5 text-[10px] text-slate-600 font-medium">
                                    {isCorporate ? (
                                        <>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>Customized team syllabus & timelines</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>Dedicated cohorts & sandbox labs</span>
                                            </div>

                                        </>
                                    ) : isCurriculum ? (
                                        <>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>Complete module syllabus & capstones</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>Instant PDF download + email copy</span>
                                            </div>

                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>1-on-1 personalized academic counselling</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>Upcoming cohort dates & seat availability</span>
                                            </div>

                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Bottom: Social Proof */}
                            <div className="pt-3 border-t border-border-muted/60 flex items-center justify-between text-[11px] text-text-muted mt-3">
                                <div className="flex items-center gap-1.5 font-medium">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    <span className="font-bold text-prime-dark">4.9/5</span>
                                    <span>Alumni Rating</span>
                                </div>
                                <span className="font-semibold text-prime">450K+ Learners</span>
                            </div>
                        </div>

                        {/* Right Section: Form Column */}
                        <div className="w-full md:w-[58%] p-5 sm:p-6 overflow-y-auto max-h-[88vh] flex flex-col">
                            <div className="w-full my-auto">
                            {/* Mobile Header (Shown on small screens only) */}
                            <div className="flex md:hidden flex-col items-center w-full pb-3 mb-3 border-b border-border-muted/50 text-center">
                                <Image
                                    src="/logo.svg"
                                    alt="NivLearn"
                                    width={120}
                                    height={28}
                                    priority
                                    className="object-contain h-6 w-auto mb-2"
                                />
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mb-1.5 ${badge.color}`}>
                                    <badge.icon className="w-3 h-3" />
                                    <span>{badge.text}</span>
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-prime-dark tracking-tight">
                                    {displayHeadline}
                                </h3>
                                {courseSubtitle && (
                                    <p className="text-[11px] font-semibold text-prime mt-0.5 line-clamp-1">
                                        {courseSubtitle}
                                    </p>
                                )}
                            </div>

                            {/* Desktop Form Header: Minimal and non-redundant */}
                            <div className="hidden md:block mb-3">
                                <h3 className="text-base font-bold text-prime-dark tracking-tight">
                                    {isCorporate ? 'Request Team Training Proposal' : isCurriculum ? 'Download Curriculum' : 'Enter Your Details'}
                                </h3>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {isCorporate
                                        ? 'Our enterprise team will prepare a custom proposal and volume quote.'
                                        : isCurriculum
                                            ? 'We will share the full curriculum PDF directly with you.'
                                            : 'A learning advisor will connect with you within 15 minutes.'}
                                </p>
                            </div>

                            <LeadForm
                                layout="compact"
                                formTitle={null}
                                formDescription={null}
                                courses={effectiveCourses}
                                config={{
                                    budget: modalConfig.config?.budget ?? false,
                                    participants: modalConfig.config?.participants ?? modalConfig.participants ?? false,
                                    hearAbout: modalConfig.config?.hearAbout ?? false,
                                    subject: modalConfig.config?.subject ?? false,
                                    purpose: modalConfig.config?.purpose ?? false,
                                    showCourse: isCoursePage ? false : (modalConfig.config?.showCourse ?? true),
                                    showMessage: modalConfig.config?.showMessage ?? true,
                                    company: modalConfig.config?.company ?? (isCorporate ? true : false),
                                    designation: modalConfig.config?.designation ?? (isCorporate ? true : false),
                                    isReferral: modalConfig.config?.isReferral ?? false,
                                }}
                                defaultValues={{
                                    leadSource: modalConfig.defaultValues?.leadSource ?? modalConfig.source ?? 'cta-popup-form',
                                    ...modalConfig.defaultValues,
                                    ...(resolvedCourseSlug ? { courseSlug: resolvedCourseSlug } : {}),
                                }}
                                extraFields={modalConfig.extraFields}
                                submitButtonText={
                                    modalConfig.submitButtonText ||
                                    (isCorporate ? 'Request Corporate Proposal' : isCurriculum ? 'Download Syllabus PDF' : 'Request Free Callback')
                                }
                                onSuccess={() => {
                                    setIsSuccess(true);
                                    try {
                                        localStorage.setItem('nivlearn_lead_submitted', 'true');
                                        sessionStorage.setItem('nivlearn_site_popup_dismissed', 'true');
                                    } catch {}
                                    if (modalConfig.downloadUrl && typeof window !== 'undefined') {
                                        try {
                                            const link = document.createElement('a');
                                            link.href = modalConfig.downloadUrl;
                                            link.target = '_blank';
                                            link.rel = 'noopener noreferrer';
                                            link.download = '';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        } catch (err) {
                                            console.warn('[LeadModal] Automatic download trigger failed:', err);
                                        }
                                    }
                                    if (modalConfig.onSuccess) {
                                        modalConfig.onSuccess();
                                    }
                                }}
                            />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
