import { router } from 'expo-router';
import { useState } from 'react';

import { createPlace } from '@/features/places/api';
import { suggestCategory } from '@/features/places/categories';
import { PlaceForm } from '@/features/places/PlaceForm';
import type { PlaceInput } from '@/features/places/types';
import type { PlaceDetails } from '@/features/search/googlePlaces';
import { PlaceSearch } from '@/features/search/PlaceSearch';

export default function NewPlaceScreen() {
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
    await createPlace(input);
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
