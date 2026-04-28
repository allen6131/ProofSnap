import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { apiRequest } from '../api/client';
import { StatusChip } from '../components/StatusChip';
import { useAuth } from '../store/auth';
import { LaunchWindow } from '../types';

export function RampDetailScreen({ rampId }: { rampId: string }) {
  const { token } = useAuth();
  const [ramp, setRamp] = useState<any>(null);
  const [windows, setWindows] = useState<LaunchWindow[]>([]);

  const load = async () => {
    const [rampData, launchData] = await Promise.all([
      apiRequest<any>(`/ramps/${rampId}`),
      apiRequest<{ windows: LaunchWindow[] }>(`/ramps/${rampId}/launch-windows?days=2`, {}, token ?? undefined),
    ]);
    setRamp(rampData);
    setWindows(launchData.windows);
  };

  const saveRamp = async () => {
    if (!token) return;
    try {
      await apiRequest(`/me/saved-ramps/${rampId}`, { method: 'POST' }, token);
      Alert.alert('Saved', 'Ramp saved to your dashboard.');
    } catch (error) {
      Alert.alert('Unable to save ramp', String(error));
    }
  };

  const submitIssue = async () => {
    try {
      await apiRequest(`/ramps/${rampId}/reports`, {
        method: 'POST',
        body: JSON.stringify({ report_type: 'other', message: 'Sample user report from mobile MVP.' }),
      }, token ?? undefined);
      Alert.alert('Submitted', 'Thanks for reporting a ramp issue.');
    } catch (error) {
      Alert.alert('Submission failed', String(error));
    }
  };

  useEffect(() => {
    load();
  }, [rampId]);

  if (!ramp) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading ramp...</Text></View>;
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>{ramp.name}</Text>
      <Text style={{ color: '#4a5568' }}>{ramp.city}, {ramp.state}</Text>
      <Text style={{ color: '#4a5568', marginBottom: 10 }}>Last updated: {ramp.manually_verified_at || 'Not manually verified'}</Text>

      <Pressable onPress={saveRamp} style={{ backgroundColor: '#1a202c', borderRadius: 8, padding: 12, marginBottom: 8 }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Save ramp</Text>
      </Pressable>

      <Pressable onPress={submitIssue} style={{ backgroundColor: '#2b6cb0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Report issue</Text>
      </Pressable>

      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Next 48h launch windows</Text>
      {windows.map((window) => (
        <View key={window.starts_at} style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '700' }}>{window.starts_at} → {window.ends_at}</Text>
            <StatusChip color={window.color} />
          </View>
          <Text style={{ color: '#4a5568' }}>Score: {window.score} • Confidence: {window.confidence_score}</Text>
          {window.reasons.slice(0, 2).map((reason) => (
            <Text key={reason.code} style={{ color: '#2d3748', marginTop: 2 }}>• {reason.message}</Text>
          ))}
          <Text style={{ color: '#4a5568', marginTop: 6 }}>
            Sources: National Weather Service, NOAA CO-OPS, NOAA National Data Buoy Center
          </Text>
        </View>
      ))}

      <Text style={{ fontSize: 12, color: '#718096', marginTop: 8 }}>{ramp.disclaimer}</Text>
    </ScrollView>
  );
}
