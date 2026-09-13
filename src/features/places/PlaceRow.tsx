import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { Stamp } from '@/components/Stamp';
import { PlusOne } from '@/features/places/PlusOne';
import type { Place } from '@/features/places/types';
import { colors, fonts, hardShadow, radius, spacing, stroke } from '@/theme';

const PERFORATION = [0, 1, 2, 3, 4, 5, 6, 7];

type Props = {
  place: Place;
  myUid: string;
  addedBy: string | undefined;
  onPress: () => void;
  onPressStatus: () => void;
};

export function PlaceRow({ place, myUid, addedBy, onPress, onPressStatus }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ticket, pressed && styles.pressed]}>
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {addedBy ? `Ajouté par ${addedBy}` : place.address}
        </Text>
        {place.status === 'done' && place.rating !== null ? (
          <RatingStars value={place.rating} size={12} />
        ) : (
          <PlusOne place={place} myUid={myUid} />
        )}
      </View>
      <View style={styles.perforation}>
        {PERFORATION.map((hole) => (
          <View key={hole} style={styles.hole} />
        ))}
      </View>
      <View style={styles.stub}>
        <Stamp status={place.status} rating={place.rating} onPress={onPressStatus} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ticket: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: stroke,
    borderColor: colors.ink,
    marginBottom: spacing.md,
    boxShadow: hardShadow,
  },
  pressed: {
    opacity: 0.8,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  name: {
    fontFamily: fonts.heavy,
    fontSize: 16,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  perforation: {
    width: 2,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 6,
  },
  hole: {
    width: 1.5,
    height: 5,
    borderRadius: 1,
    backgroundColor: colors.inkFaint,
  },
  stub: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
