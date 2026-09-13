import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { colors, hardShadow, spacing } from '@/theme';

export function Fab() {
  return (
    <Pressable
      accessibilityLabel="Ajouter un lieu"
      accessibilityRole="button"
      onPress={() => router.push('/place/new')}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Ionicons name="add" size={32} color={colors.surface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: colors.tangerine,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: hardShadow,
    transform: [{ rotate: '-8deg' }],
  },
  pressed: {
    transform: [{ rotate: '-8deg' }, { scale: 0.94 }],
  },
});
