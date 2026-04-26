import * as FileSystem from 'expo-file-system/legacy';

export function getPdfExportDirectory(reportId: string): string {
  return `${FileSystem.documentDirectory ?? ''}reports/${reportId}/exports/`;
}

export function getPdfExportUri(reportId: string): string {
  return `${getPdfExportDirectory(reportId)}${reportId}-${Date.now()}.pdf`;
}

export async function movePdfToReportExports(reportId: string, temporaryUri: string): Promise<string> {
  const exportDirectory = getPdfExportDirectory(reportId);
  await FileSystem.makeDirectoryAsync(exportDirectory, { intermediates: true });
  const destination = getPdfExportUri(reportId);
  await FileSystem.moveAsync({ from: temporaryUri, to: destination });
  return destination;
}
