import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CenteredMessage } from '@/components/CenteredMessage';
import { useAuth } from '@/features/auth/AuthProvider';
import { placeCityId } from '@/features/cities/cities';
import { useCities } from '@/features/cities/CitiesProvider';
import { deletePlace, placeExists, updatePlace } from '@/features/places/api';
import { PlaceForm } from '@/features/places/PlaceForm';
import { usePlace, usePlaces } from '@/features/places/PlacesProvider';
import { PlusOne } from '@/features/places/PlusOne';
import type { Place, PlaceInput } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';
import type { PlaceDetails } from '@/features/search/googlePlaces';
import { PlaceSearch } from '@/features/search/PlaceSearch';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, fonts, spacing } from '@/theme';

type LookupState = 'checking' | 'missing' | 'error';

function toInput(place: Place, markDone: boolean): PlaceInput {
  return {
    name: place.name,
    category: place.category,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    googlePlaceId: place.googlePlaceId,
    status: markDone ? 'done' : place.status,
    rating: place.rating,
    comment: place.comment,
  };
}

export default function PlaceDetailScreen() {
  const { user } = useAuth();
  const { id, done } = useLocalSearchParams<{ id: string; done?: string }>();
  const place = usePlace(id);
  const { loading } = usePlaces();
  const { usersById } = useUsers();
  const { citiesById, activeCity } = useCities();
  const [edited, setEdited] = useState<PlaceInput | null>(null);
  const [searching, setSearching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lookup, setLookup] = useState<LookupState>('checking');
  const found = place !== undefined;

  useEffect(() => {
    setLookup('checking');
    if (found || loading || deleting) return;
    let cancelled = false;
    placeExists(id)
      .then((exists) => {
        if (!cancelled && !exists) setLookup('missing');
      })
      .catch(() => {
        if (!cancelled) setLookup('error');
      });
    return () => {
      cancelled = true;
    };
  }, [found, loading, deleting, id]);

  if (deleting) {
    return <CenteredMessage loading text="Suppression…" />;
  }

  if (!place) {
    if (lookup === 'missing') {
      return <CenteredMessage text="Ce lieu n’existe plus" />;
    }
    if (lookup === 'error') {
      return <CenteredMessage text="Impossible de charger ce lieu" />;
    }
    return <CenteredMessage loading text="Chargement…" />;
  }

  const placeId = place.id;
  const values = edited ?? toInput(place, done === '1');

  function handleLocationSelect(details: PlaceDetails) {
    setEdited({
      ...values,
      address: details.address,
      lat: details.lat,
      lng: details.lng,
      googlePlaceId: details.googlePlaceId,
    });
    setSearching(false);
  }

  async function handleSubmit(input: PlaceInput) {
    await updatePlace(placeId, input);
    router.back();
  }

  function confirmDelete() {
    Alert.alert('Supprimer ce lieu ?', `${values.name} sera supprimé pour vous deux.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deletePlace(placeId);
            router.back();
          } catch {
            setDeleting(false);
            Alert.alert('Oups', 'Suppression impossible, réessaie.');
          }
        },
      },
    ]);
  }

  if (searching) {
    return (
      <PlaceSearch
        city={citiesById[placeCityId(place)] ?? activeCity}
        onSelect={handleLocationSelect}
        onCancel={() => setSearching(false)}
      />
    );
  }

  const author = usersById[place.createdBy]?.displayName;
  const createdOn = place.createdAt.toDate().toLocaleDateString('fr-FR');
  const wishLabel =
    place.status !== 'todo' || values.status !== 'todo' || !user
      ? null
      : isSharedWish(place)
        ? 'Partants tous les deux'
        : place.createdBy === user.uid
          ? null
          : 'Moi aussi';

  return (
    <>
      <Stack.Screen options={{ title: place.name }} />
      <PlaceForm
        values={values}
        onChange={(patch) => setEdited({ ...values, ...patch })}
        onChangeLocation={() => setSearching(true)}
        onSubmit={handleSubmit}
        submitLabel="Enregistrer"
        footer={
          <View style={styles.footer}>
            {wishLabel && user ? (
              <View style={styles.wishRow}>
                <PlusOne place={place} myUid={user.uid} size="lg" />
                <Text style={styles.wishText}>{wishLabel}</Text>
              </View>
            ) : null}
            <Text style={styles.meta}>{author ? `Ajouté par ${author} le ${createdOn}` : `Ajouté le ${createdOn}`}</Text>
            <Button
              label="Supprimer"
              icon="trash-outline"
              variant="danger"
              onPress={confirmDelete}
              style={styles.deleteButton}
            />
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  wishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  wishText: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  deleteButton: {
    alignSelf: 'stretch',
  },
});
