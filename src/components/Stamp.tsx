import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlaceStatus, Rating } from '@/features/places/types';
import { colors, fonts } from '@/theme';

type Props = {
  status: PlaceStatus;
  rating: Rating | null;
  onPress?: () => void;
  size?: number;
};

export function Stamp({ status, rating, onPress, size = 50 }: Props) {
  const done = status === 'done';
  const label = done ? (rating ? `Fait, noté ${rating} sur 5` : 'Fait') : 'À faire';
  const circle = { width: size, height: size, borderRadius: size / 2 };

  const stamp = done ? (
    <View style={[styles.done, circle]}>
      <View style={[styles.innerRing, { borderRadius: (size - 6) / 2 }]} />
      <Text style={styles.doneText}>FAIT</Text>
      {rating ? <Text style={styles.doneRating}>{rating}/5</Text> : null}
    </View>
  ) : (
    <View style={[styles.todo, circle]}>
      <Text style={styles.todoText}>{'à\ntamponner'}</Text>
    </View>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label}>
        {stamp}
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}>
      {stamp}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  done: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cobalt,
    transform: [{ rotate: '-12deg' }],
  },
  innerRing: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 1,
    borderColor: colors.cobalt,
  },
  doneText: {
    fontFamily: fonts.display,
    fontSize: 11,
    lineHeight: 13,
    color: colors.cobalt,
  },
  doneRating: {
    fontFamily: fonts.display,
    fontSize: 10,
    lineHeight: 12,
    color: colors.cobalt,
  },
  todo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.inkFaint,
  },
  todoText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    lineHeight: 10,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});
