import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Sticker, stickerTilt } from '@/components/Sticker';
import { TicketHeader } from '@/components/TicketHeader';
import { placeCityId } from '@/features/cities/cities';
import { useCities } from '@/features/cities/CitiesProvider';
import { CATEGORIES, CATEGORY_BY_KEY } from '@/features/places/categories';
import { pickerStyles } from '@/features/places/pickerStyles';
import { usePlaces } from '@/features/places/PlacesProvider';
import { pickRandom, randomCandidates } from '@/features/places/random';
import type { CategoryKey } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

export function IdeasPanel() {
  const { places, loading } = usePlaces();
  const { usersById } = useUsers();
  const { activeCity } = useCities();
  const [categories, setCategories] = useState<CategoryKey[]>([]);
  const [sharedOnly, setSharedOnly] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const candidates = useMemo(
    () =>
      randomCandidates(
        places.filter((place) => placeCityId(place) === activeCity.id),
        { categories, sharedOnly },
      ),
    [places, activeCity.id, categories, sharedOnly],
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
      return <ActivityIndicator style={pickerStyles.loader} color={colors.ink} />;
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
      return <Button label="Tirer au sort" icon="dice-outline" onPress={draw} style={pickerStyles.drawButton} />;
    }

    const category = CATEGORY_BY_KEY[picked.category];
    const author = usersById[picked.createdBy]?.displayName;
    const selectedId = picked.id;

    return (
      <View style={pickerStyles.ticket}>
        <TicketHeader label="Billet pour ce soir" />
        <View style={pickerStyles.cardHeader}>
          <Ionicons name={category.icon} size={18} color={colors.tangerine} />
          <Text style={pickerStyles.cardCategory}>{category.label}</Text>
          {isSharedWish(picked) ? (
            <View style={pickerStyles.plusTag} accessible accessibilityLabel="Partants tous les deux">
              <Text style={pickerStyles.plusTagText}>+1</Text>
            </View>
          ) : null}
        </View>
        <Text style={pickerStyles.cardName}>{picked.name}</Text>
        <Text style={pickerStyles.cardAddress}>{picked.address}</Text>
        {author ? <Text style={pickerStyles.cardMeta}>Ajouté par {author}</Text> : null}
        <View style={pickerStyles.actions}>
          <Button
            label="Un autre"
            variant="secondary"
            onPress={draw}
            disabled={candidates.length < 2}
            style={pickerStyles.action}
          />
          <Button
            label="Voir le lieu"
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: selectedId } })}
            style={pickerStyles.action}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={pickerStyles.label}>Catégories</Text>
      <View style={pickerStyles.chips}>
        {CATEGORIES.map((category, index) => (
          <Sticker
            key={category.key}
            label={category.label}
            icon={category.icon}
            tone="mint"
            tilt={stickerTilt(index)}
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
          trackColor={{ false: colors.inkFaint, true: colors.mint }}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: stroke,
    borderColor: colors.ink,
  },
  switchLabel: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
});
