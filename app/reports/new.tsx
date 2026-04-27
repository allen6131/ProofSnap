import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { REPORT_TEMPLATES } from '@/data/reportTemplates';
import {
  canCreateReport,
  getMonthKey,
  getReportLimitMessage,
} from '@/entitlement/entitlementRules';
import { loadLocalEntitlement } from '@/entitlement/localEntitlementProvider';
import { countReportsCreatedInMonth, createReport } from '@/repositories/reportRepository';

export default function NewReportScreen() {
  const [reportsThisMonth, setReportsThisMonth] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    countReportsCreatedInMonth(getMonthKey()).then(setReportsThisMonth).catch(() => setReportsThisMonth(0));
  }, []);

  async function handleCreate(templateId: string, templateName: string) {
    const entitlement = await loadLocalEntitlement(reportsThisMonth);
    const decision = canCreateReport(entitlement);

    if (!decision.allowed) {
      Alert.alert('Free report limit reached', getReportLimitMessage(entitlement), [
        { text: 'Not now', style: 'cancel' },
        { text: 'See Pro', onPress: () => router.push('/upgrade') },
      ]);
      return;
    }

    setIsCreating(true);
    try {
      const report = await createReport({
        title: templateId === 'blank' ? 'Untitled Report' : templateName,
        templateId,
      });
      router.replace(`/reports/${report.id}`);
    } catch {
      Alert.alert('Could not create report', 'Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Start a report</Text>
      <Text style={styles.subtitle}>
        Choose a flexible template. Sections are suggestions only, so every report can adapt to
        the job.
      </Text>

      <View style={styles.list}>
        {REPORT_TEMPLATES.map((template) => (
          <Card key={template.id}>
            <Text style={styles.cardTitle}>{template.name}</Text>
            <Text style={styles.cardBody}>{template.description}</Text>
            {template.defaultSections.length > 0 ? (
              <Text style={styles.sections}>{template.defaultSections.join(' • ')}</Text>
            ) : null}
            <Button
              disabled={isCreating}
              title={isCreating ? 'Creating…' : `Use ${template.name}`}
              onPress={() => void handleCreate(template.id, template.name)}
            />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardBody: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  list: {
    gap: 14,
  },
  sections: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 14,
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
});
