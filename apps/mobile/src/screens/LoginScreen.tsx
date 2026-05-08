import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { apiRequest } from '../api/client';
import { useAuth } from '../store/auth';

export function LoginScreen({ onToggle }: { onToggle: () => void }) {
  const { setToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const response = await apiRequest<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(response.access_token);
    } catch (error) {
      Alert.alert('Login failed', String(error));
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: '800' }}>rampready</Text>
      <Text style={{ color: '#4a5568' }}>
        Beginner-friendly ramp, weather, tide, and launch-window guidance before you tow.
      </Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 10 }} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 10 }} />
      <Pressable onPress={login} style={{ backgroundColor: '#1a202c', borderRadius: 8, padding: 12 }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Login</Text>
      </Pressable>
      <Pressable onPress={onToggle}>
        <Text style={{ color: '#2b6cb0', textAlign: 'center' }}>No account? Register</Text>
      </Pressable>
      <Text style={{ fontSize: 12, color: '#718096', marginTop: 12 }}>
        For launch planning only. Not for navigation, emergency, or safety-critical use.
      </Text>
    </View>
  );
}
