import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ToggleChip } from '@/components/ToggleChip';
import { CATEGORIES, CATEGORY_BY_KEY } from '@/features/places/categories';
import { usePlaces } from '@/features/places/PlacesProvider';
import { pickRandom, randomCandidates } from '@/features/places/random';
import type { CategoryKey } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, radius, spacing } from '@/theme';

export default function RandomPlaceScreen() {
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
      return <ActivityIndicator style={styles.loader} color={colors.textMuted} />;
    }
    if (candidates.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucun lieu ne correspond</Text>
          <Text style={styles.emptyText}>Élargis les filtres ou ajoute de nouvelles idées.</Text>
        </View>
      );
    }
    if (!picked) {
      return (
        <Pressable style={({ pressed }) => [styles.button, styles.drawButton, pressed && styles.pressed]} onPress={draw}>
          <Ionicons name="dice-outline" size={22} color={colors.surface} />
          <Text style={styles.buttonText}>Tirer au sort</Text>
        </Pressable>
      );
    }

    const category = CATEGORY_BY_KEY[picked.category];
    const author = usersById[picked.createdBy]?.displayName;
    const selectedId = picked.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name={category.icon} size={18} color={colors.textMuted} />
          <Text style={styles.cardCategory}>{category.label}</Text>
          {isSharedWish(picked) ? <Ionicons name="heart" size={16} color={colors.heart} /> : null}
        </View>
        <Text style={styles.cardName}>{picked.name}</Text>
        <Text style={styles.cardAddress}>{picked.address}</Text>
        {author ? <Text style={styles.cardMeta}>Ajouté par {author}</Text> : null}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              candidates.length < 2 && styles.disabled,
              pressed && styles.pressed,
            ]}
            onPress={draw}
            disabled={candidates.length < 2}
          >
            <Text style={styles.secondaryButtonText}>Un autre</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: selectedId } })}
          >
            <Text style={styles.buttonText}>Voir le lieu</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Catégories</Text>
      <View style={styles.chips}>
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
      <Text style={styles.hint}>Aucune sélection = toutes les catégories</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Seulement nos envies communes</Text>
        <Switch
          value={sharedOnly}
          onValueChange={setSharedOnly}
          trackColor={{ false: colors.border, true: colors.heart }}
        />
      </View>

      {renderResult()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
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
  loader: {
    marginTop: spacing.xl * 2,
  },
  empty: {
    marginTop: spacing.xl * 2,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardCategory: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  cardAddress: {
    fontSize: 15,
    color: colors.textMuted,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  drawButton: {
    marginTop: spacing.xl,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
});
