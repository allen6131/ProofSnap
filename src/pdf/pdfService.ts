import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { loadLocalEntitlement } from '@/entitlement/localEntitlementProvider';
import { listReportPhotos } from '@/repositories/photoRepository';
import { getReport } from '@/repositories/reportRepository';
import { getBrandingSettings } from '@/repositories/settingsRepository';

import { generateReportHtml } from './htmlGenerator';
import { movePdfToReportExports } from './pdfStorage';

export async function generateReportPdf(reportId: string): Promise<string> {
  const report = await getReport(reportId);
  if (!report) {
    throw new Error('Report not found.');
  }

  const [photos, branding, entitlement] = await Promise.all([
    listReportPhotos(reportId),
    getBrandingSettings(),
    loadLocalEntitlement(),
  ]);
  const html = generateReportHtml({
    report,
    photos,
    branding,
    entitlement,
  });
  const result = await Print.printToFileAsync({ html, base64: false });
  return movePdfToReportExports(reportId, result.uri);
}

export async function sharePdfUri(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share ProofSnap report',
    UTI: 'com.adobe.pdf',
  });
}

export async function shareReportPdf(reportId: string): Promise<string> {
  const uri = await generateReportPdf(reportId);
  await sharePdfUri(uri);
  return uri;
}
