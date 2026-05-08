export type PhotoMetadata = {
  photoId: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  section?: string;
  thumbnailBase64?: string;
  thumbnailUrl?: string;
};

export type AnalysisRequestPayload = {
  reportId: string;
  templateName: string;
  asyncProcessing?: boolean;
  photos: PhotoMetadata[];
};

export type AnalysisResponsePayload = {
  aiSuggestedCaptions: Array<{ photoId: string; caption: string }>;
  aiMissingShots: string[];
  aiSections: Array<{ photoId: string; section: string }>;
  aiQualityWarnings: Array<{ photoId: string; warnings: string[] }>;
};

export type AnalysisResponse = AnalysisResponsePayload & {
  reportId: string;
  status: 'completed' | 'processing';
  callbackToken?: string;
};

export type BackupRecord = {
  userId: string;
  reportId: string;
  encryptedBlob: string;
  photoReferences: string[];
  timestamp: string;
  updatedAt: string;
};
