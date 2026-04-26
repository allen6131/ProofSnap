import { APP_NAME } from '@/lib/format';
import type { BackupManifest, BackupManifestInput } from '@/backup/backupTypes';

export function createBackupManifest(input: BackupManifestInput): BackupManifest {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    appName: APP_NAME,
    encrypted: true,
    reportCount: input.reportCount,
    photoCount: input.photoCount,
    includesPdfs: input.includesPdfs,
  };
}
