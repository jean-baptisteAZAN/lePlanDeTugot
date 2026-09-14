import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { type Note, subscribeNotes } from '@/features/notes/api';

type NotesSnapshot = {
  uid: string | null;
  notes: Note[];
  error: Error | null;
};

const EMPTY_SNAPSHOT: NotesSnapshot = { uid: null, notes: [], error: null };

export function useNotes(): { notes: Note[]; loading: boolean; error: Error | null } {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [snapshot, setSnapshot] = useState<NotesSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeNotes(
      (notes) => setSnapshot({ uid, notes, error: null }),
      (error) =>
        setSnapshot((previous) => ({ uid, notes: previous.uid === uid ? previous.notes : [], error })),
    );
    return () => {
      unsubscribe();
      setSnapshot(EMPTY_SNAPSHOT);
    };
  }, [uid]);

  const isCurrent = uid !== null && snapshot.uid === uid;
  return {
    notes: isCurrent ? snapshot.notes : [],
    loading: uid !== null && !isCurrent,
    error: isCurrent ? snapshot.error : null,
  };
}
