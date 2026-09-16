import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { cityPushLabel } from '@/features/cities/cities';
import { useCities } from '@/features/cities/CitiesProvider';
import { createPlace } from '@/features/places/api';
import { CATEGORY_BY_KEY } from '@/features/places/categories';
import { validatePlaceInput } from '@/features/places/validation';
import { notifyPartner } from '@/features/push/notifyPartner';
import { formatDistance, type Reco } from '@/features/recos/recos';
import { discoveredPlaceInput, formatRating, openInGoogleMaps } from '@/features/search/discoveredPlace';
import { discoveredCategory } from '@/features/search/discovery';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, fonts, hardShadow, radius, spacing, stroke } from '@/theme';

type AddState = 'idle' | 'adding' | 'added';

const ADD_LABELS: Record<AddState, string> = {
  idle: 'À faire',
  adding: 'Ajout…',
  added: 'Ajouté',
};

type Props = {
  reco: Reco;
  myUid: string;
};

export function RecoCard({ reco, myUid }: Props) {
  const { users } = useUsers();
  const { activeCity } = useCities();
  const [addState, setAddState] = useState<AddState>('idle');
  const { place } = reco;
  const category = CATEGORY_BY_KEY[discoveredCategory(place)];
  const mapsUri = place.googleMapsUri;

  async function addToTodo() {
    if (addState !== 'idle') return;
    const input = discoveredPlaceInput(place);
    const problem = validatePlaceInput(input);
    if (problem) {
      Alert.alert('Oups', problem);
      return;
    }
    setAddState('adding');
    try {
      const id = await createPlace(input, activeCity.id);
      void notifyPartner({ id, name: input.name, category: input.category }, users, myUid, cityPushLabel(activeCity));
      setAddState('added');
    } catch {
      setAddState('idle');
      Alert.alert('Oups', 'Ajout impossible, réessaie.');
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={category.icon} size={16} color={colors.tangerine} />
        <Text style={styles.category}>{category.label}</Text>
        <Text style={styles.distance}>{formatDistance(reco.distanceMeters)}</Text>
      </View>
      <Text style={styles.name}>{place.name}</Text>
      <Text style={styles.address} numberOfLines={2}>
        {place.address}
      </Text>
      <Text style={styles.rating}>{formatRating(place)}</Text>
      <View style={styles.actions}>
        <Button
          label={ADD_LABELS[addState]}
          onPress={addToTodo}
          loading={addState === 'adding'}
          disabled={addState === 'added'}
          style={styles.action}
        />
        {mapsUri ? (
          <Button
            label="Google Maps"
            variant="secondary"
            icon="map-outline"
            onPress={() => openInGoogleMaps(mapsUri)}
            style={styles.action}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: stroke,
    borderColor: colors.ink,
    boxShadow: hardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  category: {
    flex: 1,
    fontFamily: fonts.heavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.tangerine,
  },
  distance: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.cobalt,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 25,
    color: colors.ink,
  },
  address: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.inkMuted,
  },
  rating: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  action: {
    flex: 1,
  },
});
