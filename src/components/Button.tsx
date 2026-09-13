import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, fonts, hardShadow, radius, spacing, stroke } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: colors.ink,
  secondary: colors.ink,
  danger: colors.danger,
};

export function Button({ label, onPress, variant = 'primary', icon, loading = false, disabled = false, style }: Props) {
  const inactive = disabled || loading;
  const textColor = TEXT_COLOR[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.base, styles[variant], inactive && styles.inactive, pressed && styles.pressed, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: stroke,
    borderColor: colors.ink,
  },
  primary: {
    backgroundColor: colors.lemon,
    boxShadow: hardShadow,
  },
  secondary: {
    backgroundColor: colors.surface,
  },
  danger: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
  },
  inactive: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 16,
    textAlign: 'center',
  },
});
