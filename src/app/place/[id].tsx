import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { deletePlace, updatePlace } from '@/features/places/api';
import { PlaceForm } from '@/features/places/PlaceForm';
import { usePlace, usePlaces } from '@/features/places/PlacesProvider';
import type { Place, PlaceInput } from '@/features/places/types';
import type { PlaceDetails } from '@/features/search/googlePlaces';
import { PlaceSearch } from '@/features/search/PlaceSearch';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, spacing } from '@/theme';

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
  const { id, done } = useLocalSearchParams<{ id: string; done?: string }>();
  const place = usePlace(id);
  const { loading } = usePlaces();
  const { usersById } = useUsers();
  const [edited, setEdited] = useState<PlaceInput | null>(null);
  const [searching, setSearching] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (deleting) {
    return <CenteredMessage loading text="Suppression…" />;
  }

  if (!place) {
    return <CenteredMessage loading={loading} text={loading ? 'Chargement…' : 'Ce lieu n’existe plus'} />;
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
    return <PlaceSearch onSelect={handleLocationSelect} onCancel={() => setSearching(false)} />;
  }

  const author = usersById[place.createdBy]?.displayName;
  const createdOn = place.createdAt.toDate().toLocaleDateString('fr-FR');

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
            <Text style={styles.meta}>{author ? `Ajouté par ${author} le ${createdOn}` : `Ajouté le ${createdOn}`}</Text>
            <Pressable style={styles.deleteButton} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteText}>Supprimer</Text>
            </Pressable>
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
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
