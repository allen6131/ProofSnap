import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { apiRequest } from '../api/client';
import { useAuth } from '../store/auth';

export function RegisterScreen({ onToggle }: { onToggle: () => void }) {
  const { setToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = async () => {
    try {
      const response = await apiRequest<{ access_token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(response.access_token);
    } catch (error) {
      Alert.alert('Registration failed', String(error));
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: '800' }}>Create your rampready account</Text>
      <Text style={{ color: '#4a5568' }}>
        Save favorite ramps and get launch guidance tuned for your boat and comfort level.
      </Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 10 }} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 10 }} />
      <Pressable onPress={register} style={{ backgroundColor: '#1a202c', borderRadius: 8, padding: 12 }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Register</Text>
      </Pressable>
      <Pressable onPress={onToggle}>
        <Text style={{ color: '#2b6cb0', textAlign: 'center' }}>Already have an account? Login</Text>
      </Pressable>
    </View>
  );
}
