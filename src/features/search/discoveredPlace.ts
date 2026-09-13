import { Alert, Linking } from 'react-native';

import type { PlaceInput } from '@/features/places/types';
import { normalizePlaceInput } from '@/features/places/validation';
import { type DiscoveredPlace, discoveredCategory } from '@/features/search/discovery';

export function formatRating(place: Pick<DiscoveredPlace, 'rating' | 'userRatingCount'>): string {
  const rating = place.rating.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `★ ${rating} · ${place.userRatingCount.toLocaleString('fr-FR')} avis`;
}

export function openInGoogleMaps(uri: string): void {
  Linking.openURL(uri).catch(() => Alert.alert('Oups', 'Impossible d’ouvrir Google Maps.'));
}

export function discoveredPlaceInput(place: DiscoveredPlace): PlaceInput {
  return normalizePlaceInput({
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
}
