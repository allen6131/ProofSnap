import type { EntitlementState } from '@/types/entitlement';
import type { ReportPhoto } from '@/types/photo';
import type { Report } from '@/types/report';
import type { BrandingSettings } from '@/types/settings';

export interface GenerateReportHtmlInput {
  report: Report;
  photos: ReportPhoto[];
  branding: BrandingSettings;
  entitlement: EntitlementState;
}

export interface GeneratedPdfFile {
  uri: string;
  reportId: string;
  createdAt: string;
}

export interface SharePdfOptions {
  dialogTitle?: string;
}
