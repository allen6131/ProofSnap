import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { getTemplateById } from '@/data/reportTemplates';
import { formatDisplayDate } from '@/lib/dates';
import { compactJoin } from '@/lib/format';
import { listReports } from '@/repositories/reportRepository';
import type { ReportWithPhotoCount } from '@/types/report';

export default function ReportsIndexScreen() {
  const [reports, setReports] = useState<ReportWithPhotoCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setReports(await listReports());
    } catch {
      setError('Could not load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports]),
  );

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ProofSnap</Text>
          <Text style={styles.title}>Reports</Text>
        </View>
        <Link href="/settings" style={styles.settingsLink}>
          Settings
        </Link>
      </View>

      <Link href="/reports/new" asChild>
        <Button title="New Report" />
      </Link>

      {isLoading ? (
        <ActivityIndicator color="#2563eb" style={styles.loader} />
      ) : error ? (
        <Card>
          <Text style={styles.error}>{error}</Text>
          <Button title="Retry" variant="secondary" onPress={loadReports} />
        </Card>
      ) : reports.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>Create your first photo proof report</Text>
          <Text style={styles.emptyBody}>
            Capture timestamped photos, add job notes, and export a professional PDF while
            keeping everything stored on this device by default.
          </Text>
          <Link href="/reports/new" asChild>
            <Button title="Create your first report" />
          </Link>
        </Card>
      ) : (
        reports.map((report) => {
          const template = getTemplateById(report.templateId);
          const subtitle = compactJoin([
            template.name,
            report.clientName,
            report.propertyName,
            `${report.photoCount} photo${report.photoCount === 1 ? '' : 's'}`,
          ]);

          return (
            <Link key={report.id} href={`/reports/${report.id}`} asChild>
              <Card pressable>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportSubtitle}>{subtitle}</Text>
                <Text style={styles.reportDate}>Updated {formatDisplayDate(report.updatedAt)}</Text>
              </Card>
            </Link>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  emptyBody: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  error: {
    color: '#b91c1c',
    marginBottom: 12,
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loader: {
    padding: 32,
  },
  reportDate: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 10,
  },
  reportSubtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  reportTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  settingsLink: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '700',
    padding: 8,
  },
  title: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '900',
  },
});
