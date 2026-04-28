import { StatusBar } from 'expo-status-bar';

import { AppNavigator } from './navigation/AppNavigator';
import { AuthProvider } from './store/auth';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </AuthProvider>
  );
}
