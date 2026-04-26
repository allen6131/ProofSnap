import * as FileSystem from 'expo-file-system/legacy';

import { createId } from '@/lib/ids';

export interface StoredPhotoFile {
  localUri: string;
  fileName: string;
}

function extensionFromUri(uri: string): string {
  const cleanUri = uri.split('?')[0] ?? uri;
  const extension = cleanUri.split('.').pop()?.toLowerCase();

  if (!extension || extension.length > 5) {
    return 'jpg';
  }

  return extension === 'jpeg' ? 'jpg' : extension;
}

export async function ensureReportPhotoDirectory(reportId: string): Promise<string> {
  const baseDirectory = `${FileSystem.documentDirectory ?? ''}reports/${reportId}/photos/`;
  await FileSystem.makeDirectoryAsync(baseDirectory, { intermediates: true });
  return baseDirectory;
}

export async function copyPhotoIntoReport(reportId: string, sourceUri: string): Promise<StoredPhotoFile> {
  const directory = await ensureReportPhotoDirectory(reportId);
  const fileName = `${createId()}.${extensionFromUri(sourceUri)}`;
  const localUri = `${directory}${fileName}`;

  await FileSystem.copyAsync({ from: sourceUri, to: localUri });

  return { localUri, fileName };
}
