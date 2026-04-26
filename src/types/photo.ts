export interface ReportPhoto {
  id: string;
  reportId: string;
  localUri: string;
  fileName?: string | null;
  caption?: string | null;
  sectionLabel?: string | null;
  takenAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  createdAt: string;
  sortOrder: number;
}
