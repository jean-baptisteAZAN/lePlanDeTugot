import { placeCityId } from '@/features/cities/cities';
import type { Place } from '@/features/places/types';
import {
  categoryTypes,
  type DiscoveredPlace,
  isDiscoveryCategory,
  type LatLng,
  searchNearby,
} from '@/features/search/discovery';

const MAX_SOURCES = 5;
const RECOS_PER_SOURCE = 3;
const RECO_RADIUS_METERS = 1500;
const MIN_RATING = 4.3;
const MIN_RATING_COUNT = 100;
const SAME_PLACE_METERS = 25;
const EARTH_RADIUS_METERS = 6371000;

export type Reco = {
  place: DiscoveredPlace;
  distanceMeters: number;
};

export type RecoGroup = {
  source: Place;
  recos: Reco[];
};

export function pickRecoSources(places: readonly Place[], cityId: string): Place[] {
  return places
    .filter(
      (place) =>
        placeCityId(place) === cityId &&
        place.status === 'done' &&
        place.rating === 5 &&
        isDiscoveryCategory(place.category),
    )
    .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis())
    .slice(0, MAX_SOURCES);
}

export function distanceMeters(from: LatLng, to: LatLng): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `à ${Math.max(50, Math.round(meters / 50) * 50)} m`;
  }
  return `à ${(meters / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}

export async function fetchRecoGroups(
  sources: readonly Place[],
  knownIds: ReadonlySet<string>,
): Promise<RecoGroup[]> {
  const results = await Promise.allSettled(
    sources.map((source) =>
      isDiscoveryCategory(source.category)
        ? searchNearby(
            { latitude: source.lat, longitude: source.lng },
            categoryTypes(source.category),
            RECO_RADIUS_METERS,
          )
        : Promise.resolve<DiscoveredPlace[]>([]),
    ),
  );

  if (results.length > 0 && results.every((result) => result.status === 'rejected')) {
    throw new Error('Recos unavailable');
  }

  const taken = new Set(knownIds);
  const groups: RecoGroup[] = [];

  sources.forEach((source, index) => {
    const result = results[index];
    if (result.status !== 'fulfilled') {
      return;
    }
    const center = { latitude: source.lat, longitude: source.lng };
    const recos = result.value
      .map((place) => ({ place, distanceMeters: distanceMeters(center, { latitude: place.lat, longitude: place.lng }) }))
      .filter(
        (reco) =>
          reco.place.rating >= MIN_RATING &&
          reco.place.userRatingCount >= MIN_RATING_COUNT &&
          reco.distanceMeters > SAME_PLACE_METERS &&
          !taken.has(reco.place.googlePlaceId),
      )
      .slice(0, RECOS_PER_SOURCE);
    recos.forEach((reco) => taken.add(reco.place.googlePlaceId));
    if (recos.length > 0) {
      groups.push({ source, recos });
    }
  });

  return groups;
}
