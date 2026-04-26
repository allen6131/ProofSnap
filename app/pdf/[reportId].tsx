import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { generateReportPdf, shareReportPdf } from '@/pdf/pdfService';

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
      await shareReportPdf(reportId);
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
        ProofSnap generates PDFs locally with report details, timestamps, captions, and a free-tier
        watermark.
      </Text>

      <Card>
        <Text style={styles.cardTitle}>Free export</Text>
        <Text style={styles.body}>
          This export includes the ProofSnap watermark. Toggle Pro in settings later to test branded,
          watermark-free exports.
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
