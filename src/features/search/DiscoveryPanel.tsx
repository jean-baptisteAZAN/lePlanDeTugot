import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Sticker, stickerTilt } from '@/components/Sticker';
import { TicketHeader } from '@/components/TicketHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { cityPushLabel } from '@/features/cities/cities';
import { useCities } from '@/features/cities/CitiesProvider';
import { createPlace } from '@/features/places/api';
import { CATEGORY_BY_KEY } from '@/features/places/categories';
import { pickerStyles } from '@/features/places/pickerStyles';
import { usePlaces } from '@/features/places/PlacesProvider';
import { validatePlaceInput } from '@/features/places/validation';
import { notifyPartner } from '@/features/push/notifyPartner';
import { discoveredPlaceInput, formatRating, openInGoogleMaps } from '@/features/search/discoveredPlace';
import {
  DISCOVERY_CATEGORY_KEYS,
  type DiscoveredPlace,
  type DiscoveryCategory,
  discoveredCategory,
  discoverPlace,
} from '@/features/search/discovery';
import { useUsers } from '@/features/users/UsersProvider';
import { colors } from '@/theme';

type AddState = 'idle' | 'adding' | 'added';

const ADD_LABELS: Record<AddState, string> = {
  idle: 'Ajouter à nos idées',
  adding: 'Ajout…',
  added: 'Ajouté',
};

export function DiscoveryPanel() {
  const { user } = useAuth();
  const { places } = usePlaces();
  const { users } = useUsers();
  const { activeCity } = useCities();
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
      const found = await discoverPlace(categories, new Set([...knownIds, ...proposedIds.current]), activeCity);
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
    const input = discoveredPlaceInput(place);
    const problem = validatePlaceInput(input);
    if (problem) {
      Alert.alert('Oups', problem);
      return;
    }
    setAddState('adding');
    try {
      const id = await createPlace(input, activeCity.id);
      void notifyPartner({ id, name: input.name, category: input.category }, users, user.uid, cityPushLabel(activeCity));
      setAddState('added');
    } catch {
      setAddState('idle');
      Alert.alert('Oups', 'Ajout impossible, réessaie.');
    }
  }

  function renderResult() {
    if (searching && !result) {
      return <ActivityIndicator style={pickerStyles.loader} color={colors.ink} />;
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
          <Button label="Découvrir" icon="sparkles-outline" onPress={discover} style={pickerStyles.drawButton} />
        </>
      );
    }

    const category = CATEGORY_BY_KEY[discoveredCategory(result)];
    const mapsUri = result.googleMapsUri;
    const current = result;

    return (
      <View style={pickerStyles.ticket}>
        <TicketHeader label="Billet découverte" />
        <View style={pickerStyles.cardHeader}>
          <Ionicons name={category.icon} size={18} color={colors.tangerine} />
          <Text style={pickerStyles.cardCategory}>{category.label}</Text>
        </View>
        <Text style={pickerStyles.cardName}>{result.name}</Text>
        <Text style={pickerStyles.cardAddress}>{result.address}</Text>
        <Text style={pickerStyles.cardMeta}>{formatRating(result)}</Text>
        {mapsUri ? (
          <Pressable onPress={() => openInGoogleMaps(mapsUri)} hitSlop={8} accessibilityRole="link">
            <Text style={pickerStyles.link}>Voir sur Google Maps</Text>
          </Pressable>
        ) : null}
        <View style={pickerStyles.actions}>
          <Button
            label="Un autre"
            variant="secondary"
            onPress={discover}
            loading={searching}
            disabled={busy}
            style={pickerStyles.action}
          />
          <Button
            label={ADD_LABELS[addState]}
            onPress={() => addToIdeas(current)}
            disabled={addState !== 'idle' || searching}
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
        {DISCOVERY_CATEGORY_KEYS.map((key, index) => (
          <Sticker
            key={key}
            label={CATEGORY_BY_KEY[key].label}
            icon={CATEGORY_BY_KEY[key].icon}
            tone="mint"
            tilt={stickerTilt(index)}
            selected={categories.includes(key)}
            onPress={() => toggleCategory(key)}
          />
        ))}
      </View>
      <Text style={pickerStyles.hint}>
        Aucune sélection = toutes les catégories · lieux bien notés · {activeCity.name}
      </Text>

      {renderResult()}
    </View>
  );
}
