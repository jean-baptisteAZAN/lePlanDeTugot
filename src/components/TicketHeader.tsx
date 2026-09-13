import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing, stroke } from '@/theme';

const BARS = [2, 1, 3, 1, 2, 2, 1, 3, 1, 2];

export function TicketHeader({ label }: { label: string }) {
  return (
    <View style={styles.top}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barcode} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {BARS.map((width, index) => (
          <View key={index} style={[styles.bar, { width }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
    borderBottomWidth: stroke,
    borderBottomColor: colors.inkFaint,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.cobalt,
  },
  barcode: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 2,
    height: 16,
  },
  bar: {
    backgroundColor: colors.ink,
  },
});
