import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { CategoryKey } from '@/features/places/types';

export type CategoryDef = {
  key: CategoryKey;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const CATEGORY_BY_KEY: Record<CategoryKey, CategoryDef> = {
  resto: { key: 'resto', label: 'Resto', icon: 'restaurant-outline' },
  bar: { key: 'bar', label: 'Bar', icon: 'wine-outline' },
  cafe: { key: 'cafe', label: 'Café', icon: 'cafe-outline' },
  activite: { key: 'activite', label: 'Activité', icon: 'bicycle-outline' },
  culture: { key: 'culture', label: 'Culture', icon: 'color-palette-outline' },
  autre: { key: 'autre', label: 'Autre', icon: 'ellipsis-horizontal-circle-outline' },
};

export const CATEGORIES: readonly CategoryDef[] = Object.values(CATEGORY_BY_KEY);

const BAR_TYPES = new Set(['bar', 'pub', 'wine_bar', 'cocktail_bar', 'night_club', 'bar_and_grill']);
const CAFE_TYPES = new Set(['cafe', 'coffee_shop', 'bakery', 'tea_house', 'cat_cafe']);
const CULTURE_TYPES = new Set([
  'museum',
  'art_gallery',
  'movie_theater',
  'performing_arts_theater',
  'cultural_center',
  'historical_landmark',
  'library',
  'concert_hall',
  'opera_house',
]);
const ACTIVITE_TYPES = new Set([
  'park',
  'amusement_park',
  'bowling_alley',
  'spa',
  'tourist_attraction',
  'zoo',
  'aquarium',
  'gym',
  'escape_room',
  'karaoke',
]);

function categoryForType(type: string): CategoryKey | null {
  if (BAR_TYPES.has(type)) return 'bar';
  if (CAFE_TYPES.has(type)) return 'cafe';
  if (type === 'restaurant' || type.endsWith('_restaurant')) return 'resto';
  if (CULTURE_TYPES.has(type)) return 'culture';
  if (ACTIVITE_TYPES.has(type)) return 'activite';
  return null;
}

export function suggestCategory(primaryType: string | null, types: readonly string[]): CategoryKey {
  const candidates = primaryType ? [primaryType, ...types] : types;
  for (const type of candidates) {
    const category = categoryForType(type);
    if (category) return category;
  }
  return 'autre';
}
