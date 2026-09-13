import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Rating } from '@/features/places/types';
import { colors } from '@/theme';

const VALUES: readonly Rating[] = [1, 2, 3, 4, 5];

type Props = {
  value: Rating | null;
  onChange?: (value: Rating) => void;
  size?: number;
};

export function RatingStars({ value, onChange, size = 16 }: Props) {
  return (
    <View style={styles.row}>
      {VALUES.map((star) => {
        const icon = (
          <Ionicons
            name={value !== null && star <= value ? 'star' : 'star-outline'}
            size={size}
            color={colors.star}
          />
        );
        if (!onChange) {
          return <View key={star}>{icon}</View>;
        }
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={6}
            accessibilityLabel={`${star} étoile${star > 1 ? 's' : ''}`}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
});
