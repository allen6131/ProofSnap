import { Stack } from 'expo-router';

async function initializeDatabaseIfAvailable() {
  const database = await import('../src/db/database').catch(() => null);
  await database?.initializeDatabase();
}

initializeDatabaseIfAvailable().catch((error: unknown) => {
  console.error('Failed to initialize ProofSnap database', error);
});

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'ProofSnap' }} />
      <Stack.Screen name="reports/new" options={{ title: 'New Report' }} />
      <Stack.Screen name="reports/[id]" options={{ title: 'Report Editor' }} />
      <Stack.Screen name="photos/[id]" options={{ title: 'Photo Note' }} />
      <Stack.Screen name="pdf/[reportId]" options={{ title: 'PDF Export' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings & Branding' }} />
      <Stack.Screen name="upgrade" options={{ title: 'Upgrade ProofSnap' }} />
    </Stack>
  );
}
