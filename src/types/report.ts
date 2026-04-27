export type ReportStatus = 'draft' | 'completed' | 'archived';

export interface Report {
  id: string;
  title: string;
  templateId?: string | null;
  clientName?: string | null;
  propertyName?: string | null;
  address?: string | null;
  generalNotes?: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface ReportWithPhotoCount extends Report {
  photoCount: number;
}

export interface CreateReportInput {
  title: string;
  templateId?: string | null;
  clientName?: string | null;
  propertyName?: string | null;
  address?: string | null;
  generalNotes?: string | null;
}

export type UpdateReportInput = Partial<
  Pick<
    Report,
    | 'title'
    | 'templateId'
    | 'clientName'
    | 'propertyName'
    | 'address'
    | 'generalNotes'
    | 'status'
    | 'completedAt'
  >
>;
