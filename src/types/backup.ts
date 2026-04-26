export type BackupProviderKind = 'none' | 'localEncryptedArchive' | 'cloudEncrypted';

export type BackupStatus = 'disabled' | 'notConfigured' | 'ready' | 'backingUp' | 'restoring' | 'error';

export interface BackupSettings {
  providerKind: BackupProviderKind;
  status: BackupStatus;
  lastBackupAt?: string | null;
  lastError?: string | null;
  encryptedCloudBackupEnabled: boolean;
}

export interface BackupManifest {
  appName: 'ProofSnap';
  schemaVersion: number;
  createdAt: string;
  reportsCount: number;
  photosCount: number;
  includesPdfExports: boolean;
}

export interface BackupProvider {
  getStatus(): Promise<BackupSettings>;
  createEncryptedArchive(): Promise<{ uri: string; manifest: BackupManifest }>;
  restoreEncryptedArchive(uri: string): Promise<void>;
}
