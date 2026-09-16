import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
  updateDoc,
} from 'firebase/firestore';

import type { Place, PlaceInput } from '@/features/places/types';
import { auth, db } from '@/lib/firebase';

const placesCollection = collection(db, 'places');

export async function createPlace(input: PlaceInput, cityId: string): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Not authenticated');
  }
  const ref = await addDoc(placesCollection, {
    ...input,
    cityId,
    createdBy: uid,
    likedBy: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePlace(id: string, input: PlaceInput): Promise<void> {
  await updateDoc(doc(db, 'places', id), { ...input, updatedAt: serverTimestamp() });
}

export async function deletePlace(id: string): Promise<void> {
  await deleteDoc(doc(db, 'places', id));
}

export async function placeExists(id: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, 'places', id));
  return snapshot.exists();
}

export function subscribePlaces(
  onData: (places: Place[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(placesCollection, orderBy('createdAt', 'desc')),
    (snapshot) => {
      onData(
        snapshot.docs.map((document) => {
          const data = document.data({ serverTimestamps: 'estimate' }) as Omit<Place, 'id'>;
          return {
            ...data,
            id: document.id,
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            cityId: typeof data.cityId === 'string' ? data.cityId : null,
          };
        }),
      );
    },
    onError,
  );
}

export async function setLiked(id: string, liked: boolean): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Not authenticated');
  }
  await updateDoc(doc(db, 'places', id), {
    likedBy: liked ? arrayUnion(uid) : arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
}
