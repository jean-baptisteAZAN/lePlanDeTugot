import type { City, Coordinates } from '@/features/cities/types';
import type { Place } from '@/features/places/types';

export const PARIS_CITY_ID = 'paris';

export const PARIS: City = {
  id: PARIS_CITY_ID,
  name: 'Paris',
  lat: 48.8566,
  lng: 2.3522,
  viewport: {
    low: { latitude: 48.8156, longitude: 2.2241 },
    high: { latitude: 48.9022, longitude: 2.4699 },
  },
  googlePlaceId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
};

const METERS_PER_DEGREE = 111320;
const MIN_BIAS_RADIUS_METERS = 5000;
const MAX_BIAS_RADIUS_METERS = 50000;
const MIN_REGION_DELTA = 0.02;
const REGION_PADDING = 1.1;
const INNER_FRACTION = 0.5;
const EARTH_RADIUS_KM = 6371;

export const PARIS_DEDUPE_RADIUS_KM = 15;

export function placeCityId(place: Pick<Place, 'cityId'>): string {
  return place.cityId ?? PARIS_CITY_ID;
}

export function viewportCenter(city: City): Coordinates {
  const { low, high } = city.viewport;
  return {
    latitude: (low.latitude + high.latitude) / 2,
    longitude: (low.longitude + high.longitude) / 2,
  };
}

export function cityRegion(city: City): Coordinates & { latitudeDelta: number; longitudeDelta: number } {
  const { low, high } = city.viewport;
  return {
    ...viewportCenter(city),
    latitudeDelta: Math.max(MIN_REGION_DELTA, (high.latitude - low.latitude) * REGION_PADDING),
    longitudeDelta: Math.max(MIN_REGION_DELTA, (high.longitude - low.longitude) * REGION_PADDING),
  };
}

export function cityBiasCircle(city: City): { center: Coordinates; radius: number } {
  const { low, high } = city.viewport;
  const center = viewportCenter(city);
  const heightMeters = (high.latitude - low.latitude) * METERS_PER_DEGREE;
  const widthMeters =
    (high.longitude - low.longitude) * METERS_PER_DEGREE * Math.cos((center.latitude * Math.PI) / 180);
  const halfDiagonal = Math.sqrt(heightMeters ** 2 + widthMeters ** 2) / 2;
  return {
    center,
    radius: Math.min(MAX_BIAS_RADIUS_METERS, Math.max(MIN_BIAS_RADIUS_METERS, Math.round(halfDiagonal))),
  };
}

export function randomInnerPoint(city: City): Coordinates {
  const { low, high } = city.viewport;
  const center = viewportCenter(city);
  return {
    latitude: center.latitude + (Math.random() - 0.5) * (high.latitude - low.latitude) * INNER_FRACTION,
    longitude: center.longitude + (Math.random() - 0.5) * (high.longitude - low.longitude) * INNER_FRACTION,
  };
}

export function cityPushLabel(city: City): string | null {
  return city.id === PARIS_CITY_ID ? null : city.name;
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLng ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
