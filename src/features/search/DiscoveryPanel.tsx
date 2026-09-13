import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ToggleChip } from '@/components/ToggleChip';
import { useAuth } from '@/features/auth/AuthProvider';
import { createPlace } from '@/features/places/api';
import { CATEGORY_BY_KEY } from '@/features/places/categories';
import { pickerStyles } from '@/features/places/pickerStyles';
import { usePlaces } from '@/features/places/PlacesProvider';
import { normalizePlaceInput, validatePlaceInput } from '@/features/places/validation';
import { notifyPartner } from '@/features/push/notifyPartner';
import {
  DISCOVERY_CATEGORY_KEYS,
  type DiscoveredPlace,
  type DiscoveryCategory,
  discoveredCategory,
  discoverPlace,
} from '@/features/search/discovery';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, spacing } from '@/theme';

type AddState = 'idle' | 'adding' | 'added';

const ADD_LABELS: Record<AddState, string> = {
  idle: 'Ajouter à nos idées',
  adding: 'Ajout…',
  added: 'Ajouté',
};

function formatRating(place: DiscoveredPlace): string {
  const rating = place.rating.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `★ ${rating} · ${place.userRatingCount.toLocaleString('fr-FR')} avis`;
}

function openInGoogleMaps(uri: string) {
  Linking.openURL(uri).catch(() => Alert.alert('Oups', 'Impossible d’ouvrir Google Maps.'));
}

export function DiscoveryPanel() {
  const { user } = useAuth();
  const { places } = usePlaces();
  const { users } = useUsers();
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [result, setResult] = useState<DiscoveredPlace | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [addState, setAddState] = useState<AddState>('idle');
  const proposedIds = useRef(new Set<string>());
  const busy = searching || addState === 'adding';

  const knownIds = useMemo(
    () => new Set(places.flatMap((place) => (place.googlePlaceId ? [place.googlePlaceId] : []))),
    [places],
  );

  function toggleCategory(key: DiscoveryCategory) {
    setCategories((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  async function discover() {
    if (busy) return;
    setSearching(true);
    setNotFound(false);
    try {
      const found = await discoverPlace(categories, new Set([...knownIds, ...proposedIds.current]));
      if (found) {
        proposedIds.current.add(found.googlePlaceId);
        setAddState('idle');
      }
      setResult(found);
      setNotFound(found === null);
    } catch {
      Alert.alert('Oups', 'Recherche indisponible, réessaie.');
    } finally {
      setSearching(false);
    }
  }

  async function addToIdeas(place: DiscoveredPlace) {
    if (!user || busy) return;
    const input = normalizePlaceInput({
      name: place.name,
      category: discoveredCategory(place),
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      googlePlaceId: place.googlePlaceId,
      status: 'todo',
      rating: null,
      comment: null,
    });
    const problem = validatePlaceInput(input);
    if (problem) {
      Alert.alert('Oups', problem);
      return;
    }
    setAddState('adding');
    try {
      const id = await createPlace(input);
      void notifyPartner({ id, name: input.name, category: input.category }, users, user.uid);
      setAddState('added');
    } catch {
      setAddState('idle');
      Alert.alert('Oups', 'Ajout impossible, réessaie.');
    }
  }

  function renderResult() {
    if (searching && !result) {
      return <ActivityIndicator style={pickerStyles.loader} color={colors.textMuted} />;
    }
    if (!result) {
      return (
        <>
          {notFound ? (
            <View style={pickerStyles.empty}>
              <Text style={pickerStyles.emptyTitle}>Rien trouvé</Text>
              <Text style={pickerStyles.emptyText}>Réessaie ou change de catégorie.</Text>
            </View>
          ) : null}
          <Pressable
            style={({ pressed }) => [pickerStyles.button, pickerStyles.drawButton, pressed && pickerStyles.pressed]}
            onPress={discover}
          >
            <Ionicons name="sparkles-outline" size={22} color={colors.surface} />
            <Text style={pickerStyles.buttonText}>Découvrir</Text>
          </Pressable>
        </>
      );
    }

    const category = CATEGORY_BY_KEY[discoveredCategory(result)];
    const mapsUri = result.googleMapsUri;
    const current = result;

    return (
      <View style={pickerStyles.card}>
        <View style={pickerStyles.cardHeader}>
          <Ionicons name={category.icon} size={18} color={colors.textMuted} />
          <Text style={pickerStyles.cardCategory}>{category.label}</Text>
        </View>
        <Text style={pickerStyles.cardName}>{result.name}</Text>
        <Text style={pickerStyles.cardAddress}>{result.address}</Text>
        <Text style={pickerStyles.cardMeta}>{formatRating(result)}</Text>
        {mapsUri ? (
          <Pressable onPress={() => openInGoogleMaps(mapsUri)} hitSlop={8}>
            <Text style={styles.link}>Voir sur Google Maps</Text>
          </Pressable>
        ) : null}
        <View style={pickerStyles.actions}>
          <Pressable
            style={({ pressed }) => [
              pickerStyles.button,
              pickerStyles.secondaryButton,
              busy && pickerStyles.disabled,
              pressed && pickerStyles.pressed,
            ]}
            onPress={discover}
            disabled={busy}
          >
            {searching ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={pickerStyles.secondaryButtonText}>Un autre</Text>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              pickerStyles.button,
              (addState !== 'idle' || searching) && pickerStyles.disabled,
              pressed && pickerStyles.pressed,
            ]}
            onPress={() => addToIdeas(current)}
            disabled={addState !== 'idle' || searching}
          >
            <Text style={pickerStyles.buttonText}>{ADD_LABELS[addState]}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={pickerStyles.label}>Catégories</Text>
      <View style={pickerStyles.chips}>
        {DISCOVERY_CATEGORY_KEYS.map((key) => (
          <ToggleChip
            key={key}
            label={CATEGORY_BY_KEY[key].label}
            icon={CATEGORY_BY_KEY[key].icon}
            selected={categories.includes(key)}
            onPress={() => toggleCategory(key)}
          />
        ))}
      </View>
      <Text style={pickerStyles.hint}>Aucune sélection = toutes les catégories · lieux bien notés dans Paris</Text>

      {renderResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
