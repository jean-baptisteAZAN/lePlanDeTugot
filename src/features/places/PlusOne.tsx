import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { setLiked } from '@/features/places/api';
import type { Place } from '@/features/places/types';
import { isLikedBy, isSharedWish } from '@/features/places/wishes';
import { colors, fonts, stroke } from '@/theme';

type Props = {
  place: Place;
  myUid: string;
  size?: 'sm' | 'lg';
};

export function PlusOne({ place, myUid, size = 'sm' }: Props) {
  if (place.status !== 'todo') {
    return null;
  }

  const sizeStyle = size === 'lg' ? styles.lg : styles.sm;
  const textSizeStyle = size === 'lg' ? styles.textLg : styles.textSm;

  if (place.createdBy === myUid) {
    if (!isSharedWish(place)) {
      return null;
    }
    return (
      <View style={[styles.tag, sizeStyle, styles.on]} accessible accessibilityLabel="Partants tous les deux">
        <Text style={[styles.text, textSizeStyle]}>+1</Text>
      </View>
    );
  }

  const liked = isLikedBy(place, myUid);

  function toggle() {
    setLiked(place.id, !liked).catch(() => Alert.alert('Oups', 'Impossible de mettre à jour, réessaie.'));
  }

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: liked }}
      accessibilityLabel={liked ? 'Retirer mon +1' : 'Moi aussi'}
      style={({ pressed }) => [styles.tag, sizeStyle, liked ? styles.on : styles.off, pressed && styles.pressed]}
    >
      <Text style={[styles.text, textSizeStyle, !liked && styles.textOff]}>+1</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: 6,
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    transform: [{ rotate: '6deg' }],
  },
  lg: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    transform: [{ rotate: '-4deg' }],
  },
  on: {
    backgroundColor: colors.lemon,
  },
  off: {
    backgroundColor: colors.surface,
    borderColor: colors.inkFaint,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontFamily: fonts.display,
    color: colors.ink,
  },
  textSm: {
    fontSize: 11,
  },
  textLg: {
    fontSize: 20,
  },
  textOff: {
    color: colors.inkFaint,
  },
});
