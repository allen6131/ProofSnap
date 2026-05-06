import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';

import { apiRequest } from '../api/client';
import { useAuth } from '../store/auth';

export function SettingsScreen() {
  const { token, setToken } = useAuth();
  const [boatType, setBoatType] = useState('other');
  const [maxWind, setMaxWind] = useState('15');
  const [maxGust, setMaxGust] = useState('22');
  const [maxWave, setMaxWave] = useState('2.0');
  const [minTide, setMinTide] = useState('');
  const [daylightOnly, setDaylightOnly] = useState(true);

  const load = async () => {
    if (!token) return;
    const profile = await apiRequest<any>('/me/profile', {}, token);
    setBoatType(profile.boat_type ?? 'other');
    setMaxWind(String(profile.max_wind_kt ?? 15));
    setMaxGust(String(profile.max_gust_kt ?? 22));
    setMaxWave(String(profile.max_wave_height_ft ?? 2));
    setMinTide(profile.min_tide_height_ft_mllw != null ? String(profile.min_tide_height_ft_mllw) : '');
    setDaylightOnly(Boolean(profile.daylight_only));
  };

  useEffect(() => {
    load();
  }, [token]);

  const save = async () => {
    if (!token) return;
    await apiRequest('/me/profile', {
      method: 'PUT',
      body: JSON.stringify({
        boat_type: boatType,
        max_wind_kt: Number(maxWind),
        max_gust_kt: Number(maxGust),
        max_wave_height_ft: Number(maxWave),
        min_tide_height_ft_mllw: minTide ? Number(minTide) : null,
        daylight_only: daylightOnly,
      }),
    }, token);
    Alert.alert('Saved', 'Profile thresholds updated.');
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 10 }}>Settings</Text>
      <Text style={{ color: '#4a5568', marginBottom: 12 }}>
        Tune rampready to the boat you are learning on and the conditions you are comfortable launching in.
      </Text>
      <Text style={{ fontWeight: '700' }}>Boat type</Text>
      <TextInput value={boatType} onChangeText={setBoatType} style={{ borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 10, marginBottom: 8 }} />

      <Text style={{ fontWeight: '700' }}>Max wind (kt)</Text>
      <TextInput value={maxWind} onChangeText={setMaxWind} keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 10, marginBottom: 8 }} />

      <Text style={{ fontWeight: '700' }}>Max gust (kt)</Text>
      <TextInput value={maxGust} onChangeText={setMaxGust} keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 10, marginBottom: 8 }} />

      <Text style={{ fontWeight: '700' }}>Max wave height (ft)</Text>
      <TextInput value={maxWave} onChangeText={setMaxWave} keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 10, marginBottom: 8 }} />

      <Text style={{ fontWeight: '700' }}>Min tide height (ft MLLW)</Text>
      <TextInput value={minTide} onChangeText={setMinTide} keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 10, marginBottom: 8 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontWeight: '700' }}>Daylight only</Text>
        <Switch value={daylightOnly} onValueChange={setDaylightOnly} />
      </View>

      <Pressable onPress={save} style={{ backgroundColor: '#1a202c', borderRadius: 8, padding: 12, marginBottom: 8 }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Save limits</Text>
      </Pressable>

      <Pressable onPress={() => setToken(null)} style={{ backgroundColor: '#c53030', borderRadius: 8, padding: 12 }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Logout</Text>
      </Pressable>

      <Text style={{ marginTop: 14, fontSize: 12, color: '#718096' }}>
        rampready is a planning and awareness tool only. It is not a navigation tool, not an emergency service, and not a substitute for official marine forecasts, nautical charts, local knowledge, or safe boating judgment. Weather, tide, water-level, current, buoy, and ramp information may be delayed, incomplete, preliminary, or inaccurate. Always check official NOAA/NWS sources and local conditions before launching.
      </Text>
    </ScrollView>
  );
}
