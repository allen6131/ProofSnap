export type BackupProviderStatus = 'not-configured' | 'ready' | 'backing-up' | 'error';

export interface BackupManifest {
  version: 1;
  createdAt: string;
  appName: 'ProofSnap';
  encrypted: boolean;
  reportCount: number;
  photoCount: number;
}

export interface BackupStatus {
  provider: 'local-placeholder' | 'cloud';
  status: BackupProviderStatus;
  message: string;
  lastBackupAt?: string | null;
}

export interface BackupProvider {
  getStatus(): Promise<BackupStatus>;
  createEncryptedBackup(): Promise<never>;
  restoreEncryptedBackup(): Promise<never>;
}

export const localBackupProvider: BackupProvider = {
  async getStatus() {
    return {
      provider: 'local-placeholder',
      status: 'not-configured',
      message:
        'ProofSnap is offline-first. Optional encrypted cloud backup is not enabled in this MVP.',
      lastBackupAt: null,
    };
  },
  async createEncryptedBackup() {
    throw new Error('Encrypted backup export is planned for a later release.');
  },
  async restoreEncryptedBackup() {
    throw new Error('Encrypted backup restore is planned for a later release.');
  },
};

