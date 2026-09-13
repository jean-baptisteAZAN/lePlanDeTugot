import type { Place } from '@/features/places/types';

export function isLikedBy(place: Place, uid: string): boolean {
  return place.likedBy.includes(uid);
}

export function isSharedWish(place: Place): boolean {
  return place.likedBy.some((uid) => uid !== place.createdBy);
}
