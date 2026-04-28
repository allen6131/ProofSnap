import { StatusBar } from 'react-native';

import { AppNavigator } from './navigation/AppNavigator';
import { AuthProvider } from './store/auth';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </AuthProvider>
  );
}
