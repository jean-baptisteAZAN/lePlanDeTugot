import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlaceStatus } from '@/features/places/types';
import { colors, radius, spacing } from '@/theme';

type Props = {
  status: PlaceStatus;
  onPress?: () => void;
};

export function StatusBadge({ status, onPress }: Props) {
  const done = status === 'done';
  const badge = (
    <View style={[styles.badge, { backgroundColor: done ? colors.doneSoft : colors.todoSoft }]}>
      <Text style={[styles.text, { color: done ? colors.done : colors.todo }]}>{done ? 'Fait' : 'À faire'}</Text>
    </View>
  );
  if (!onPress) {
    return badge;
  }
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {badge}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
