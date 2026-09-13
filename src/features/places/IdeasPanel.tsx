import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ToggleChip } from '@/components/ToggleChip';
import { CATEGORIES, CATEGORY_BY_KEY } from '@/features/places/categories';
import { pickerStyles } from '@/features/places/pickerStyles';
import { usePlaces } from '@/features/places/PlacesProvider';
import { pickRandom, randomCandidates } from '@/features/places/random';
import type { CategoryKey } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, radius, spacing } from '@/theme';

export function IdeasPanel() {
  const { places, loading } = usePlaces();
  const { usersById } = useUsers();
  const [categories, setCategories] = useState<CategoryKey[]>([]);
  const [sharedOnly, setSharedOnly] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const candidates = useMemo(
    () => randomCandidates(places, { categories, sharedOnly }),
    [places, categories, sharedOnly],
  );
  const picked = candidates.find((place) => place.id === pickedId) ?? null;

  function draw() {
    setPickedId(pickRandom(candidates, pickedId)?.id ?? null);
  }

  function toggleCategory(key: CategoryKey) {
    setCategories((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  function renderResult() {
    if (loading) {
      return <ActivityIndicator style={pickerStyles.loader} color={colors.textMuted} />;
    }
    if (candidates.length === 0) {
      return (
        <View style={pickerStyles.empty}>
          <Text style={pickerStyles.emptyTitle}>Aucun lieu ne correspond</Text>
          <Text style={pickerStyles.emptyText}>Élargis les filtres ou ajoute de nouvelles idées.</Text>
        </View>
      );
    }
    if (!picked) {
      return (
        <Pressable
          style={({ pressed }) => [pickerStyles.button, pickerStyles.drawButton, pressed && pickerStyles.pressed]}
          onPress={draw}
        >
          <Ionicons name="dice-outline" size={22} color={colors.surface} />
          <Text style={pickerStyles.buttonText}>Tirer au sort</Text>
        </Pressable>
      );
    }

    const category = CATEGORY_BY_KEY[picked.category];
    const author = usersById[picked.createdBy]?.displayName;
    const selectedId = picked.id;

    return (
      <View style={pickerStyles.card}>
        <View style={pickerStyles.cardHeader}>
          <Ionicons name={category.icon} size={18} color={colors.textMuted} />
          <Text style={pickerStyles.cardCategory}>{category.label}</Text>
          {isSharedWish(picked) ? <Ionicons name="heart" size={16} color={colors.heart} /> : null}
        </View>
        <Text style={pickerStyles.cardName}>{picked.name}</Text>
        <Text style={pickerStyles.cardAddress}>{picked.address}</Text>
        {author ? <Text style={pickerStyles.cardMeta}>Ajouté par {author}</Text> : null}
        <View style={pickerStyles.actions}>
          <Pressable
            style={({ pressed }) => [
              pickerStyles.button,
              pickerStyles.secondaryButton,
              candidates.length < 2 && pickerStyles.disabled,
              pressed && pickerStyles.pressed,
            ]}
            onPress={draw}
            disabled={candidates.length < 2}
          >
            <Text style={pickerStyles.secondaryButtonText}>Un autre</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [pickerStyles.button, pressed && pickerStyles.pressed]}
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: selectedId } })}
          >
            <Text style={pickerStyles.buttonText}>Voir le lieu</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={pickerStyles.label}>Catégories</Text>
      <View style={pickerStyles.chips}>
        {CATEGORIES.map((category) => (
          <ToggleChip
            key={category.key}
            label={category.label}
            icon={category.icon}
            selected={categories.includes(category.key)}
            onPress={() => toggleCategory(category.key)}
          />
        ))}
      </View>
      <Text style={pickerStyles.hint}>Aucune sélection = toutes les catégories</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Seulement nos envies communes</Text>
        <Switch
          value={sharedOnly}
          onValueChange={setSharedOnly}
          trackColor={{ false: colors.border, true: colors.heart }}
        />
      </View>

      {renderResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  switchLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
});
