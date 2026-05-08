import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { apiRequest } from '../api/client';
import { StatusChip } from '../components/StatusChip';
import { useAuth } from '../store/auth';

interface DashboardItem {
  ramp_id: string;
  ramp_name: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
  next_best_window: string | null;
  top_reasons: Array<{ message: string }>;
  active_alerts: number;
}

export function DashboardScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiRequest<{ items: DashboardItem[]; empty_message: string }>('/me/dashboard', {}, token);
      setItems(data.items);
      setMessage(data.empty_message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  return (
    <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Dashboard</Text>
      {items.length === 0 ? (
        <Text style={{ color: '#718096' }}>
          {message || 'Save your first ramp to compare beginner-friendly launch windows.'}
        </Text>
      ) : null}
      {items.map((item) => (
        <View key={item.ramp_id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>{item.ramp_name}</Text>
            <StatusChip color={item.color} />
          </View>
          <Text style={{ color: '#4a5568', marginTop: 6 }}>Next best window: {item.next_best_window ?? 'No data'}</Text>
          <Text style={{ color: '#4a5568' }}>Alerts: {item.active_alerts}</Text>
          {item.top_reasons.slice(0, 2).map((reason, idx) => (
            <Text key={idx} style={{ color: '#2d3748', marginTop: 3 }}>• {reason.message}</Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
