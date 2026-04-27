import type { ReportPhoto } from '@/types/photo';
import type { Report, ReportStatus, ReportWithPhotoCount } from '@/types/report';
import type { BrandingSettings } from '@/types/settings';

export interface ReportRow {
  id: string;
  title: string;
  template_id: string | null;
  client_name: string | null;
  property_name: string | null;
  address: string | null;
  general_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ReportListRow extends ReportRow {
  photo_count: number | null;
}

export interface ReportPhotoRow {
  id: string;
  report_id: string;
  local_uri: string;
  file_name: string | null;
  caption: string | null;
  section_label: string | null;
  taken_at: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  created_at: string;
  sort_order: number;
}

export interface BrandingSettingsRow {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_uri: string | null;
  footer_text: string | null;
  updated_at: string;
}

function normalizeStatus(status: string): ReportStatus {
  return status === 'completed' || status === 'archived' ? status : 'draft';
}

export function mapReportRow(row: ReportRow): Report {
  return {
    id: row.id,
    title: row.title,
    templateId: row.template_id,
    clientName: row.client_name,
    propertyName: row.property_name,
    address: row.address,
    generalNotes: row.general_notes,
    status: normalizeStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export function mapReportListRow(row: ReportListRow): ReportWithPhotoCount {
  return {
    ...mapReportRow(row),
    photoCount: row.photo_count ?? 0,
  };
}

export function mapReport(row: Record<string, unknown>): Report {
  return mapReportRow(row as unknown as ReportRow);
}

export function mapReportListItem(row: Record<string, unknown>): ReportWithPhotoCount {
  return mapReportListRow(row as unknown as ReportListRow);
}

export function mapReportPhotoRow(row: ReportPhotoRow): ReportPhoto {
  return {
    id: row.id,
    reportId: row.report_id,
    localUri: row.local_uri,
    fileName: row.file_name,
    caption: row.caption,
    sectionLabel: row.section_label,
    takenAt: row.taken_at,
    latitude: row.latitude,
    longitude: row.longitude,
    locationAccuracy: row.location_accuracy,
    createdAt: row.created_at,
    sortOrder: row.sort_order,
  };
}

export function mapReportPhoto(row: Record<string, unknown>): ReportPhoto {
  return mapReportPhotoRow(row as unknown as ReportPhotoRow);
}

export function mapBrandingSettings(row: Record<string, unknown> | null): BrandingSettings {
  return mapBrandingSettingsRow(row as unknown as BrandingSettingsRow | null);
}

export function mapBrandingSettingsRow(row: BrandingSettingsRow | null): BrandingSettings {
  if (!row) {
    return {
      id: 'default',
      updatedAt: new Date(0).toISOString(),
    };
  }

  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    logoUri: row.logo_uri,
    footerText: row.footer_text,
    updatedAt: row.updated_at,
  };
}
