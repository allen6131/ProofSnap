import type { ReportTemplate } from '@/types/template';

export const BLANK_TEMPLATE_ID = 'blank';

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: BLANK_TEMPLATE_ID,
    name: 'Blank Report',
    description: 'Start from scratch and add your own sections as you document the job.',
    defaultSections: [],
    isBasic: true,
    isFree: true,
  },
  {
    id: 'job-completion',
    name: 'Job Completion Report',
    description: 'Show finished work, follow-up notes, and completion proof for a client.',
    defaultSections: ['Overview', 'Completed Work', 'Materials', 'Final Condition'],
    isBasic: true,
    isFree: true,
  },
  {
    id: 'before-after',
    name: 'Before / After Report',
    description: 'Pair before and after photos for cleaning, repair, and improvement work.',
    defaultSections: ['Before', 'During', 'After', 'Close-ups'],
    isBasic: true,
    isFree: true,
  },
  {
    id: 'property-condition',
    name: 'Property Condition Report',
    description: 'Document rooms, fixtures, damage, and move-in or move-out condition.',
    defaultSections: ['Exterior', 'Kitchen', 'Bathrooms', 'Bedrooms', 'Living Areas', 'Damage Notes'],
    isBasic: true,
    isFree: true,
  },
  {
    id: 'cleaning-proof',
    name: 'Cleaning Proof Report',
    description: 'Capture room-by-room cleaning proof for turnovers, rentals, and clients.',
    defaultSections: ['Entry', 'Kitchen', 'Bathrooms', 'Bedrooms', 'Laundry', 'Final Walkthrough'],
    isBasic: true,
    isFree: true,
  },
];

export const builtInReportTemplates = REPORT_TEMPLATES;

export function getReportTemplateById(templateId?: string | null): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((template) => template.id === templateId);
}

export function getTemplateById(templateId?: string | null): ReportTemplate {
  return getReportTemplateById(templateId) ?? REPORT_TEMPLATES[0];
}
