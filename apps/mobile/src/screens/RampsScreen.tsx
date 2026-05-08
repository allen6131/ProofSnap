import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { apiRequest } from '../api/client';
import { Ramp } from '../types';

export function RampsScreen({ onSelect }: { onSelect: (rampId: string) => void }) {
  const [query, setQuery] = useState('');
  const [ramps, setRamps] = useState<Ramp[]>([]);

  const load = async () => {
    const data = await apiRequest<Ramp[]>(`/ramps?region=FL&q=${encodeURIComponent(query)}`);
    setRamps(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 10 }}>Ramps</Text>
      <Text style={{ color: '#4a5568', marginBottom: 10 }}>
        Find launch ramps and check whether conditions look approachable for newer boaters.
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by ramp, city, or area"
        style={{ borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 10, marginBottom: 10 }}
      />
      <Pressable onPress={load} style={{ backgroundColor: '#2b6cb0', borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Search</Text>
      </Pressable>
      <ScrollView>
        {ramps.map((ramp) => (
          <Pressable key={ramp.id} onPress={() => onSelect(ramp.id)} style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <Text style={{ fontSize: 17, fontWeight: '700' }}>{ramp.name}</Text>
            <Text style={{ color: '#4a5568' }}>{ramp.city}, {ramp.state}</Text>
            <Text style={{ color: '#4a5568' }}>Confidence: {ramp.confidence_score}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
