import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';

export type Note = {
  id: string;
  title: string;
  createdBy: string;
  createdAt: Timestamp;
};

export const NOTE_TITLE_MAX = 200;

const notesCollection = collection(db, 'notes');

export function subscribeNotes(onData: (notes: Note[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(
    query(notesCollection, orderBy('createdAt', 'desc')),
    (snapshot) => {
      onData(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data({ serverTimestamps: 'estimate' }) as Omit<Note, 'id'>),
        })),
      );
    },
    onError,
  );
}

export async function createNote(title: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Not authenticated');
  }
  await addDoc(notesCollection, { title, createdBy: uid, createdAt: serverTimestamp() });
}

export async function deleteNote(id: string): Promise<void> {
  await deleteDoc(doc(db, 'notes', id));
}
