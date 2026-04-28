import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { apiRequest } from '../api/client';
import { useAuth } from '../store/auth';

export function SavedScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (!token) return;
    const data = await apiRequest<any[]>('/me/saved-ramps', {}, token);
    setItems(data);
  };

  useEffect(() => {
    load();
  }, [token]);

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 10 }}>Saved ramps</Text>
      {items.map((item) => (
        <View key={item.id} style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <Text style={{ fontWeight: '700' }}>{item.ramp.name}</Text>
          <Text style={{ color: '#4a5568' }}>{item.ramp.city}, {item.ramp.state}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
