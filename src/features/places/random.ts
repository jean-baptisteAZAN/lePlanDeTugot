import type { CategoryKey, Place } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';

export type RandomFilters = {
  categories: readonly CategoryKey[];
  sharedOnly: boolean;
};

export function randomCandidates(places: readonly Place[], filters: RandomFilters): Place[] {
  return places.filter(
    (place) =>
      place.status === 'todo' &&
      (filters.categories.length === 0 || filters.categories.includes(place.category)) &&
      (!filters.sharedOnly || isSharedWish(place)),
  );
}

export function pickRandom(candidates: readonly Place[], excludeId: string | null): Place | null {
  const pool = candidates.length > 1 ? candidates.filter((place) => place.id !== excludeId) : candidates;
  if (pool.length === 0) {
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
