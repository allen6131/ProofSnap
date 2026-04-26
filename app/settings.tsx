import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ENTITLEMENT_PLAN_SETTING_KEY } from '@/entitlement/localEntitlementProvider';
import { BackupSettingsSection } from '@/features/settings/BackupSettingsSection';
import { LOCATION_STAMPING_SETTING_KEY, pickPhotoFromLibrary } from '@/photos/photoService';
import { getAppSetting, setAppSetting } from '@/repositories/appSettingsRepository';
import { getBrandingSettings, saveBrandingSettings } from '@/repositories/settingsRepository';
import type { BrandingSettingsPatch } from '@/types/settings';

export default function SettingsScreen() {
  const [form, setForm] = useState<BrandingSettingsPatch>({});
  const [devPro, setDevPro] = useState(false);
  const [locationStamping, setLocationStamping] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [branding, plan, savedLocationStamping] = await Promise.all([
      getBrandingSettings(),
      getAppSetting(ENTITLEMENT_PLAN_SETTING_KEY),
      getAppSetting(LOCATION_STAMPING_SETTING_KEY),
    ]);
    setForm(branding);
    setDevPro(plan === 'pro' || plan === 'pro_annual' || plan === 'lifetime');
    setLocationStamping(savedLocationStamping === 'true');
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch((error) => {
      Alert.alert('Settings unavailable', error instanceof Error ? error.message : 'Try again.');
      setLoading(false);
    });
  }, [load]);

  const updateField = (key: keyof BrandingSettingsPatch, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    await saveBrandingSettings(form);
    await setAppSetting(ENTITLEMENT_PLAN_SETTING_KEY, devPro ? 'pro_annual' : 'free');
    await setAppSetting(LOCATION_STAMPING_SETTING_KEY, locationStamping ? 'true' : 'false');
    Alert.alert('Saved', 'Branding and local entitlement settings are saved on this device.');
  };

  const chooseLogo = async () => {
    try {
      const picked = await pickPhotoFromLibrary();
      if (picked) {
        updateField('logoUri', picked.uri);
      }
    } catch (error) {
      Alert.alert('Could not choose logo', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen
      title="Settings & branding"
      subtitle="Save business details for Pro PDFs. Everything stays on this device."
      refreshing={loading}
      onRefresh={load}
    >
      <Card>
        <Text style={styles.sectionTitle}>Branding</Text>
        <TextInput
          style={styles.input}
          placeholder="Company name"
          value={form.companyName ?? ''}
          onChangeText={(value) => updateField('companyName', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact name"
          value={form.contactName ?? ''}
          onChangeText={(value) => updateField('contactName', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email ?? ''}
          onChangeText={(value) => updateField('email', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          keyboardType="phone-pad"
          value={form.phone ?? ''}
          onChangeText={(value) => updateField('phone', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Website"
          autoCapitalize="none"
          value={form.website ?? ''}
          onChangeText={(value) => updateField('website', value)}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Footer text"
          multiline
          value={form.footerText ?? ''}
          onChangeText={(value) => updateField('footerText', value)}
        />
        <Button variant="secondary" onPress={() => void chooseLogo()}>
          {form.logoUri ? 'Change logo image' : 'Choose logo image'}
        </Button>
        {form.logoUri ? <Text style={styles.helper}>Logo selected: {form.logoUri}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Pro testing</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Local Pro mode</Text>
            <Text style={styles.helper}>
              Development-only toggle to verify no-watermark PDFs and branding.
            </Text>
          </View>
          <Switch value={devPro} onValueChange={setDevPro} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Location stamping</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Stamp new photos with GPS</Text>
            <Text style={styles.helper}>
              Off by default. When enabled, ProofSnap asks for location only while adding a photo.
            </Text>
          </View>
          <Switch value={locationStamping} onValueChange={setLocationStamping} />
        </View>
      </Card>

      <BackupSettingsSection />

      <Button onPress={() => void save()}>Save settings</Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  helper: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
});
