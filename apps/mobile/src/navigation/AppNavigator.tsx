import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';

import { DashboardScreen } from '../screens/DashboardScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RampDetailScreen } from '../screens/RampDetailScreen';
import { RampsScreen } from '../screens/RampsScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAuth } from '../store/auth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function RampsStack() {
  const [selectedRampId, setSelectedRampId] = useState<string | null>(null);

  if (selectedRampId) {
    return (
      <Stack.Navigator>
        <Stack.Screen name="RampDetail" options={{ title: 'Ramp Detail' }}>
          {() => <RampDetailScreen rampId={selectedRampId} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return <RampsScreen onSelect={setSelectedRampId} />;
}

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Ramps" component={RampsStack} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { token } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  return (
    <NavigationContainer>
      {token ? (
        <MainTabs />
      ) : showRegister ? (
        <RegisterScreen onToggle={() => setShowRegister(false)} />
      ) : (
        <LoginScreen onToggle={() => setShowRegister(true)} />
      )}
    </NavigationContainer>
  );
}
