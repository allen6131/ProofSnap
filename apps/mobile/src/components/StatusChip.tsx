import { Text, View } from 'react-native';

const palette = {
  green: '#1f9d55',
  yellow: '#d69e2e',
  red: '#c53030',
  gray: '#718096',
};

export function StatusChip({ color }: { color: 'green' | 'yellow' | 'red' | 'gray' }) {
  return (
    <View style={{ backgroundColor: palette[color], borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: '#fff', fontWeight: '700', textTransform: 'uppercase' }}>{color}</Text>
    </View>
  );
}
