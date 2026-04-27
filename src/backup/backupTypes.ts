export type BackupProviderStatus = 'not-configured' | 'ready' | 'backing-up' | 'error';

export interface BackupManifest {
  version: 1;
  createdAt: string;
  appName: 'ProofSnap';
  encrypted: boolean;
  reportCount: number;
  photoCount: number;
  includesPdfs: boolean;
}

export interface BackupManifestInput {
  reportCount: number;
  photoCount: number;
  includesPdfs: boolean;
}

export interface BackupStatus {
  provider: 'local-placeholder' | 'cloud';
  status: BackupProviderStatus;
  message: string;
  lastBackupAt?: string | null;
}

export interface BackupArchivePlan {
  manifest: BackupManifest;
  includesSqliteDatabase: boolean;
  includesReportFiles: boolean;
  encryption: 'client-side-required';
}

export interface BackupArchive {
  manifest: BackupManifest;
  files: string[];
}
