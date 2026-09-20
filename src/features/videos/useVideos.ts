import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { subscribeVideos, type Video } from '@/features/videos/api';

type VideosSnapshot = {
  uid: string | null;
  videos: Video[];
  error: Error | null;
};

const EMPTY_SNAPSHOT: VideosSnapshot = { uid: null, videos: [], error: null };

export function useVideos(): { videos: Video[]; loading: boolean; error: Error | null } {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [snapshot, setSnapshot] = useState<VideosSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeVideos(
      (videos) => setSnapshot({ uid, videos, error: null }),
      (error) =>
        setSnapshot((previous) => ({ uid, videos: previous.uid === uid ? previous.videos : [], error })),
    );
    return () => {
      unsubscribe();
      setSnapshot(EMPTY_SNAPSHOT);
    };
  }, [uid]);

  const isCurrent = uid !== null && snapshot.uid === uid;
  return {
    videos: isCurrent ? snapshot.videos : [],
    loading: uid !== null && !isCurrent,
    error: isCurrent ? snapshot.error : null,
  };
}
