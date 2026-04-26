import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ProofSnap</Text>
      <Text style={styles.title}>Professional photo proof reports in seconds.</Text>
      <Text style={styles.body}>
        Capture timestamped job photos, organize notes by section, and export polished PDFs
        while staying offline by default.
      </Text>
      <Link href="/reports/new" style={styles.primaryLink}>
        Create your first report
      </Link>
      <Link href="/settings" style={styles.secondaryLink}>
        Settings & branding
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  primaryLink: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  secondaryLink: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
  },
  title: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 16,
    textAlign: 'center',
  },
});
