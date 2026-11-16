import type { LeadModalConfig } from '@/context/LeadModalContext';

/*
 * Lead-form setups shared by every CTA on a page. A CTA opens the lead modal
 * with one of these (see components/forms/LeadCta.tsx); inline forms pass the
 * same values to <LeadForm>. `leadSource` tells the CRM where the lead came from.
 * Page-specific answers go in `extraFields` and reach the CRM as customFields.
 */

const HEADCOUNT = [
  { label: '1 – 10', value: '1-10' },
  { label: '11 – 50', value: '11-50' },
  { label: '51 – 200', value: '51-200' },
  { label: '200+', value: '200+' },
];

export const LEAD_FORMS = {
  /** General "talk to an advisor" (blog, legal pages, about us). */
  advisor: {
    formTitle: 'Talk to a Learning Advisor',
    formDescription: 'Tell us your goals and an advisor will suggest the right course and batch for you.',
    defaultValues: { leadSource: 'advisor-cta' },
    config: { showCourse: true, showMessage: true },
  },

  /** Schedules page: no batch fits, or a custom quote. */
  schedule: {
    formTitle: 'Find a Batch That Fits',
    formDescription: 'Tell us your preferred dates and timings and we will suggest a batch or set one up for you.',
    defaultValues: { leadSource: 'schedules-page' },
    config: { showCourse: true, showMessage: true },
    extraFields: [
      {
        name: 'preferredTiming',
        label: 'Preferred timing',
        type: 'select',
        options: [
          { label: 'Weekdays', value: 'weekday' },
          { label: 'Weekends', value: 'weekend' },
          { label: 'Flexible', value: 'flexible' },
        ],
      },
    ],
    submitButtonText: 'Request a Batch',
  },

  corporate: {
    formTitle: 'Plan Training for Your Team',
    formDescription: 'Share your requirements and our corporate team will send a tailored proposal.',
    defaultValues: { leadSource: 'corporate-page', purpose: 'Corporate Training' },
    config: { showCourse: true, showMessage: true, company: true, designation: true },
    extraFields: [
      { name: 'teamSize', label: 'Team size', type: 'select', required: true, options: HEADCOUNT },
    ],
    submitButtonText: 'Request Proposal',
  },

  corporateBrochure: {
    formTitle: 'Get the Corporate Brochure',
    formDescription: 'Share your details and we will email you our corporate training brochure.',
    defaultValues: { leadSource: 'corporate-brochure', purpose: 'Corporate Training' },
    config: { showCourse: false, showMessage: false, company: true, designation: true },
    submitButtonText: 'Send Me the Brochure',
  },

  hire: {
    formTitle: 'Become a NivLearn Hiring Partner',
    formDescription: 'Tell us the roles you are hiring for. Access to our talent pool is free.',
    defaultValues: { leadSource: 'hire-from-us' },
    config: { showCourse: false, showMessage: true, company: true, designation: true },
    extraFields: [
      { name: 'rolesHiring', label: 'Roles you are hiring for', required: true, placeholder: 'e.g. Full Stack Developer, Sales Executive' },
      { name: 'openings', label: 'Number of openings', type: 'select', options: HEADCOUNT },
    ],
    submitButtonText: 'Start Hiring',
  },

  instructor: {
    formTitle: 'Apply to Become an Instructor',
    formDescription: 'Share your expertise and our trainer team will reach out with the next steps.',
    defaultValues: { leadSource: 'become-an-instructor' },
    config: { showCourse: false, showMessage: true },
    extraFields: [
      { name: 'expertise', label: 'Subjects you can teach', required: true, placeholder: 'e.g. PMP, Scrum, AWS' },
      {
        name: 'experience',
        label: 'Training experience',
        type: 'select',
        required: true,
        options: [
          { label: 'Less than 2 years', value: '0-2' },
          { label: '2 – 5 years', value: '2-5' },
          { label: '5 – 10 years', value: '5-10' },
          { label: '10+ years', value: '10+' },
        ],
      },
      { name: 'profileUrl', label: 'LinkedIn / portfolio link', placeholder: 'https://' },
    ],
    submitButtonText: 'Submit Application',
  },

  guestAuthor: {
    formTitle: 'Write for NivLearn',
    formDescription: 'Pitch your article idea and our editorial team will get back to you.',
    defaultValues: { leadSource: 'guest-author' },
    config: { showCourse: false, showMessage: true },
    extraFields: [
      { name: 'articleTopic', label: 'Proposed article topic', required: true },
      { name: 'writingSamples', label: 'Link to writing samples', placeholder: 'https://' },
    ],
    submitButtonText: 'Send My Pitch',
  },

  accreditation: {
    formTitle: 'Ask About Accredited Programs',
    formDescription: 'Find the right accredited certification and the next batch dates.',
    defaultValues: { leadSource: 'accreditations-page', purpose: 'Upskilling' },
    config: { showCourse: true, showMessage: true },
  },

  /** Site-level smart popup (exit-intent / scroll / timer). */
  siteLevel: {
    formTitle: 'Connect with a Course Advisor',
    formDescription: 'Have questions about course syllabus, batch schedules, or certifications? A learning advisor will connect with you within 15 minutes.',
    defaultValues: { leadSource: 'site-level-advisor-popup', purpose: 'Upskilling / Certification' },
    config: { showCourse: true, showMessage: false },
    submitButtonText: 'Request Free Advisory Callback',
  },
} satisfies Record<string, LeadModalConfig>;

export type LeadFormKey = keyof typeof LEAD_FORMS;
