import { CATEGORIES, type CategoryDef } from '@/features/places/categories';
import type { Place, PlaceStatus } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';

export type StatusFilter = 'all' | PlaceStatus;

export type PlaceSection = {
  category: CategoryDef;
  data: Place[];
};

export function groupPlacesByCategory(
  places: readonly Place[],
  filter: StatusFilter,
  sharedOnly: boolean,
): PlaceSection[] {
  const visible = places.filter(
    (place) => (filter === 'all' || place.status === filter) && (!sharedOnly || isSharedWish(place)),
  );
  return CATEGORIES.map((category) => ({
    category,
    data: visible
      .filter((place) => place.category === category.key)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  })).filter((section) => section.data.length > 0);
}
