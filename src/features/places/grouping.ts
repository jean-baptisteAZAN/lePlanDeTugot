import { CATEGORIES, type CategoryDef } from '@/features/places/categories';
import type { Place, PlaceStatus } from '@/features/places/types';

export type StatusFilter = 'all' | PlaceStatus;

export type PlaceSection = {
  category: CategoryDef;
  data: Place[];
};

export function groupPlacesByCategory(places: readonly Place[], filter: StatusFilter): PlaceSection[] {
  const visible = filter === 'all' ? places : places.filter((place) => place.status === filter);
  return CATEGORIES.map((category) => ({
    category,
    data: visible
      .filter((place) => place.category === category.key)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  })).filter((section) => section.data.length > 0);
}
