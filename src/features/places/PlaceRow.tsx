import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { StatusBadge } from '@/components/StatusBadge';
import type { Place } from '@/features/places/types';
import { colors, radius, spacing } from '@/theme';

type Props = {
  place: Place;
  addedBy: string | undefined;
  onPress: () => void;
  onPressStatus: () => void;
};

export function PlaceRow({ place, addedBy, onPress, onPressStatus }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {addedBy ? `Ajouté par ${addedBy}` : place.address}
        </Text>
      </View>
      <View style={styles.side}>
        <StatusBadge status={place.status} onPress={onPressStatus} />
        {place.status === 'done' && place.rating !== null ? <RatingStars value={place.rating} size={12} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  side: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});
