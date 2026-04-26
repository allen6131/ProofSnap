import type { BackupArchivePlan } from './backupTypes';

export function describeBackupArchive(archive: BackupArchivePlan): string {
  return `${archive.manifest.reportCount} reports, ${archive.manifest.photoCount} photos, encrypted before upload`;
}
