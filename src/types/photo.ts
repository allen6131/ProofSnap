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

export interface CreateReportPhotoInput {
  localUri: string;
  fileName?: string | null;
  caption?: string | null;
  sectionLabel?: string | null;
  takenAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  sortOrder?: number;
}

export type UpdateReportPhotoInput = Partial<
  Pick<
    ReportPhoto,
    | 'localUri'
    | 'fileName'
    | 'caption'
    | 'sectionLabel'
    | 'takenAt'
    | 'latitude'
    | 'longitude'
    | 'locationAccuracy'
    | 'sortOrder'
  >
>;
