import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing, stroke } from '@/theme';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md - 3,
  },
  segmentSelected: {
    backgroundColor: colors.mint,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.inkMuted,
  },
  labelSelected: {
    color: colors.ink,
  },
});
