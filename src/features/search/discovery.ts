import { suggestCategory } from '@/features/places/categories';
import type { CategoryKey } from '@/features/places/types';
import { BASE_URL, buildHeaders } from '@/features/search/googlePlaces';

export type DiscoveryCategory = Exclude<CategoryKey, 'autre'>;

export type DiscoveredPlace = {
  googlePlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  userRatingCount: number;
  googleMapsUri: string | null;
  primaryType: string | null;
  types: string[];
};

type LatLng = { latitude: number; longitude: number };

type NearbyResponse = {
  places?: {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    location?: LatLng;
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    primaryType?: string;
    types?: string[];
  }[];
};

export const DISCOVERY_CATEGORY_KEYS: readonly DiscoveryCategory[] = ['resto', 'bar', 'cafe', 'activite', 'culture'];

const DISCOVERY_TYPES: Record<DiscoveryCategory, readonly string[]> = {
  resto: ['restaurant'],
  bar: ['bar', 'wine_bar', 'pub', 'cocktail_bar'],
  cafe: ['cafe', 'coffee_shop', 'tea_house'],
  activite: ['amusement_center', 'bowling_alley', 'spa', 'karaoke', 'park'],
  culture: ['museum', 'art_gallery', 'performing_arts_theater', 'movie_theater', 'concert_hall', 'opera_house'],
};

const ARRONDISSEMENT_CENTERS: readonly LatLng[] = [
  { latitude: 48.8625, longitude: 2.3364 },
  { latitude: 48.8683, longitude: 2.3428 },
  { latitude: 48.863, longitude: 2.3601 },
  { latitude: 48.8543, longitude: 2.3576 },
  { latitude: 48.8445, longitude: 2.3497 },
  { latitude: 48.8491, longitude: 2.3326 },
  { latitude: 48.8562, longitude: 2.3121 },
  { latitude: 48.8727, longitude: 2.3125 },
  { latitude: 48.877, longitude: 2.3375 },
  { latitude: 48.8761, longitude: 2.3607 },
  { latitude: 48.8591, longitude: 2.3799 },
  { latitude: 48.8409, longitude: 2.3876 },
  { latitude: 48.8283, longitude: 2.3622 },
  { latitude: 48.8292, longitude: 2.3266 },
  { latitude: 48.8401, longitude: 2.2931 },
  { latitude: 48.8637, longitude: 2.2769 },
  { latitude: 48.8873, longitude: 2.3067 },
  { latitude: 48.8925, longitude: 2.3484 },
  { latitude: 48.8871, longitude: 2.3847 },
  { latitude: 48.8634, longitude: 2.4011 },
];

const SEARCH_RADIUS_METERS = 1500;
const MIN_RATING = 4.3;
const MIN_RATING_COUNT = 150;
const MAX_ATTEMPTS = 3;
const NEARBY_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.primaryType',
  'places.types',
].join(',');

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function typesFor(categories: readonly DiscoveryCategory[]): string[] {
  const selected = categories.length > 0 ? categories : DISCOVERY_CATEGORY_KEYS;
  return [...new Set(selected.flatMap((category) => DISCOVERY_TYPES[category]))];
}

async function searchNearby(center: LatLng, includedTypes: readonly string[]): Promise<DiscoveredPlace[]> {
  const response = await fetch(`${BASE_URL}/places:searchNearby`, {
    method: 'POST',
    headers: buildHeaders(NEARBY_FIELD_MASK),
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      rankPreference: 'POPULARITY',
      languageCode: 'fr',
      regionCode: 'fr',
      locationRestriction: { circle: { center, radius: SEARCH_RADIUS_METERS } },
    }),
  });
  if (!response.ok) {
    throw new Error(`Places nearby search failed: ${response.status}`);
  }
  const json = (await response.json()) as NearbyResponse;
  return (json.places ?? []).flatMap((place) => {
    if (!place.location || place.rating === undefined || place.userRatingCount === undefined) {
      return [];
    }
    return [
      {
        googlePlaceId: place.id,
        name: place.displayName?.text ?? '',
        address: place.formattedAddress ?? '',
        lat: place.location.latitude,
        lng: place.location.longitude,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        googleMapsUri: place.googleMapsUri ?? null,
        primaryType: place.primaryType ?? null,
        types: place.types ?? [],
      },
    ];
  });
}

export async function discoverPlace(
  categories: readonly DiscoveryCategory[],
  excludedIds: ReadonlySet<string>,
): Promise<DiscoveredPlace | null> {
  const includedTypes = typesFor(categories);
  for (const center of shuffled(ARRONDISSEMENT_CENTERS).slice(0, MAX_ATTEMPTS)) {
    const candidates = (await searchNearby(center, includedTypes)).filter(
      (place) =>
        place.rating >= MIN_RATING &&
        place.userRatingCount >= MIN_RATING_COUNT &&
        !excludedIds.has(place.googlePlaceId),
    );
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }
  return null;
}

export function discoveredCategory(place: DiscoveredPlace): CategoryKey {
  const candidates = place.primaryType ? [place.primaryType, ...place.types] : place.types;
  for (const type of candidates) {
    const match = DISCOVERY_CATEGORY_KEYS.find((key) => DISCOVERY_TYPES[key].includes(type));
    if (match) {
      return match;
    }
  }
  return suggestCategory(place.primaryType, place.types);
}
