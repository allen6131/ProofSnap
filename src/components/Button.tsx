import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends PressableProps {
  label?: string;
  title?: string;
  variant?: Variant;
}

export function Button({
  children,
  label,
  title,
  variant = 'primary',
  disabled,
  style,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      <Text style={[styles.label, variant === 'secondary' || variant === 'ghost' ? styles.darkLabel : null]}>
        {children ?? label ?? title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primary: {
    backgroundColor: '#0f172a',
  },
  secondary: {
    backgroundColor: '#e2e8f0',
  },
  danger: {
    backgroundColor: '#b91c1c',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  darkLabel: {
    color: '#0f172a',
  },
});
