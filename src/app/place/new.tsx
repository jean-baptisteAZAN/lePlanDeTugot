import { router } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { createPlace } from '@/features/places/api';
import { suggestCategory } from '@/features/places/categories';
import { PlaceForm } from '@/features/places/PlaceForm';
import type { PlaceInput } from '@/features/places/types';
import { notifyPartner } from '@/features/push/notifyPartner';
import type { PlaceDetails } from '@/features/search/googlePlaces';
import { PlaceSearch } from '@/features/search/PlaceSearch';
import { useUsers } from '@/features/users/UsersProvider';

export default function NewPlaceScreen() {
  const { user } = useAuth();
  const { users } = useUsers();
  const [values, setValues] = useState<PlaceInput | null>(null);
  const [searching, setSearching] = useState(true);

  function handleSelect(details: PlaceDetails) {
    setValues((previous) => ({
      name: details.name,
      category: suggestCategory(details.primaryType, details.types),
      address: details.address,
      lat: details.lat,
      lng: details.lng,
      googlePlaceId: details.googlePlaceId,
      status: previous?.status ?? 'todo',
      rating: previous?.rating ?? null,
      comment: previous?.comment ?? null,
    }));
    setSearching(false);
  }

  async function handleSubmit(input: PlaceInput) {
    const id = await createPlace(input);
    if (user) {
      void notifyPartner({ id, name: input.name, category: input.category }, users, user.uid);
    }
    router.back();
  }

  if (searching || !values) {
    return <PlaceSearch onSelect={handleSelect} onCancel={values ? () => setSearching(false) : undefined} />;
  }

  return (
    <PlaceForm
      values={values}
      onChange={(patch) => setValues({ ...values, ...patch })}
      onChangeLocation={() => setSearching(true)}
      onSubmit={handleSubmit}
      submitLabel="Ajouter"
    />
  );
}
