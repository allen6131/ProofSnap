import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { generateReportPdf, sharePdfUri } from '@/pdf/pdfService';

export default function PdfExportScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastPdfUri, setLastPdfUri] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!reportId) {
      return;
    }
    setIsGenerating(true);
    try {
      const uri = await generateReportPdf(reportId);
      setLastPdfUri(uri);
      Alert.alert('PDF generated', 'Your report PDF was created on this device.');
    } catch {
      Alert.alert('Could not generate PDF', 'Please check the report and try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [reportId]);

  const handleShare = useCallback(async () => {
    if (!reportId) {
      return;
    }
    setIsGenerating(true);
    try {
      const uri = lastPdfUri ?? (await generateReportPdf(reportId));
      setLastPdfUri(uri);
      await sharePdfUri(uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not share PDF', message);
    } finally {
      setIsGenerating(false);
    }
  }, [lastPdfUri, reportId]);

  return (
    <Screen>
      <Text style={styles.title}>PDF export</Text>
      <Text style={styles.body}>
        ProofSnap generates PDFs locally with report details, timestamps, captions, and the
        watermark/branding for your current local entitlement.
      </Text>

      <Card>
        <Text style={styles.cardTitle}>Local export</Text>
        <Text style={styles.body}>
          Free exports include the ProofSnap watermark. Toggle Pro in settings to test branded,
          watermark-free exports without adding real store purchases yet.
        </Text>
        {lastPdfUri ? <Text style={styles.uri}>Last PDF: {lastPdfUri}</Text> : null}
      </Card>

      <Button disabled={isGenerating} onPress={handleGenerate}>
        {isGenerating ? 'Working…' : 'Generate PDF'}
      </Button>
      <Button disabled={isGenerating} variant="secondary" onPress={handleShare}>
        Generate & share
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
  },
  uri: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});
