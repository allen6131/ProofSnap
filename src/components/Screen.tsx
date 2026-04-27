import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  title?: string;
  subtitle?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({ children, scroll = true, title, subtitle, contentContainerStyle }: ScreenProps) {
  const header = title ? (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  ) : null;

  if (!scroll) {
    return (
      <View style={[styles.container, styles.content, contentContainerStyle]}>
        {header}
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {header}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    gap: 8,
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
});
