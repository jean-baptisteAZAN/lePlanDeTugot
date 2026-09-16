import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useCities } from '@/features/cities/CitiesProvider';
import { colors, fonts, spacing, stroke } from '@/theme';

export function CitySwitcher() {
  const { activeCity } = useCities();

  return (
    <Pressable
      onPress={() => router.push('/city/select')}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`Ville : ${activeCity.name}. Changer de ville`}
      style={({ pressed }) => [styles.sticker, pressed && styles.pressed]}
    >
      <Ionicons name="location" size={15} color={colors.ink} />
      <Text style={styles.label} numberOfLines={1}>
        {activeCity.name}
      </Text>
      <Ionicons name="chevron-down" size={15} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sticker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 200,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: stroke,
    borderColor: colors.ink,
    backgroundColor: colors.lemon,
    transform: [{ rotate: '-2deg' }],
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
});
