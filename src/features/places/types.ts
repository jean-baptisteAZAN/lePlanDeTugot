import type { Timestamp } from 'firebase/firestore';

export type CategoryKey = 'resto' | 'bar' | 'cafe' | 'activite' | 'culture' | 'autre';

export type PlaceStatus = 'todo' | 'done';

export type Rating = 1 | 2 | 3 | 4 | 5;

export type Place = {
  id: string;
  name: string;
  category: CategoryKey;
  address: string;
  lat: number;
  lng: number;
  googlePlaceId: string | null;
  status: PlaceStatus;
  rating: Rating | null;
  comment: string | null;
  likedBy: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type PlaceInput = Pick<
  Place,
  'name' | 'category' | 'address' | 'lat' | 'lng' | 'googlePlaceId' | 'status' | 'rating' | 'comment'
>;
