import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, type Unsubscribe } from 'firebase/firestore';

import type { City, CityInput, Coordinates, Viewport } from '@/features/cities/types';
import { auth, db } from '@/lib/firebase';

const citiesCollection = collection(db, 'cities');

function isCoordinates(value: unknown): value is Coordinates {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Coordinates).latitude === 'number' &&
    typeof (value as Coordinates).longitude === 'number'
  );
}

function isViewport(value: unknown): value is Viewport {
  return (
    typeof value === 'object' &&
    value !== null &&
    isCoordinates((value as Viewport).low) &&
    isCoordinates((value as Viewport).high)
  );
}

export function subscribeCities(onData: (cities: City[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(
    query(citiesCollection, orderBy('name')),
    (snapshot) => {
      onData(
        snapshot.docs.flatMap((document) => {
          const data = document.data();
          const viewport: unknown = data.viewport;
          if (
            typeof data.name !== 'string' ||
            typeof data.lat !== 'number' ||
            typeof data.lng !== 'number' ||
            !isViewport(viewport)
          ) {
            return [];
          }
          return [
            {
              id: document.id,
              name: data.name,
              lat: data.lat,
              lng: data.lng,
              viewport,
              googlePlaceId: typeof data.googlePlaceId === 'string' ? data.googlePlaceId : null,
            },
          ];
        }),
      );
    },
    onError,
  );
}

export async function createCity(input: CityInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Not authenticated');
  }
  const ref = await addDoc(citiesCollection, { ...input, createdBy: uid, createdAt: serverTimestamp() });
  return ref.id;
}
