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

export type Video = {
  id: string;
  videoId: string;
  url: string;
  title: string;
  channel: string | null;
  thumbnailUrl: string | null;
  comment: string | null;
  createdBy: string;
  createdAt: Timestamp;
};

export type VideoInput = Pick<Video, 'videoId' | 'url' | 'title' | 'channel' | 'thumbnailUrl' | 'comment'>;

export const VIDEO_TITLE_MAX = 200;
export const VIDEO_COMMENT_MAX = 2000;

const videosCollection = collection(db, 'videos');

export function subscribeVideos(onData: (videos: Video[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(
    query(videosCollection, orderBy('createdAt', 'desc')),
    (snapshot) => {
      onData(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data({ serverTimestamps: 'estimate' }) as Omit<Video, 'id'>),
        })),
      );
    },
    onError,
  );
}

export async function createVideo(input: VideoInput): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Not authenticated');
  }
  await addDoc(videosCollection, { ...input, createdBy: uid, createdAt: serverTimestamp() });
}

export async function deleteVideo(id: string): Promise<void> {
  await deleteDoc(doc(db, 'videos', id));
}
