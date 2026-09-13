import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { subscribePlaces } from '@/features/places/api';
import type { Place } from '@/features/places/types';

type PlacesState = {
  places: Place[];
  loading: boolean;
  error: Error | null;
};

type PlacesSnapshot = {
  uid: string | null;
  places: Place[];
  error: Error | null;
};

const PlacesContext = createContext<PlacesState | null>(null);

const EMPTY_SNAPSHOT: PlacesSnapshot = { uid: null, places: [], error: null };

export function PlacesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [snapshot, setSnapshot] = useState<PlacesSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribePlaces(
      (places) => setSnapshot({ uid, places, error: null }),
      (error) =>
        setSnapshot((previous) => ({ uid, places: previous.uid === uid ? previous.places : [], error })),
    );
    return () => {
      unsubscribe();
      setSnapshot(EMPTY_SNAPSHOT);
    };
  }, [uid]);

  const value = useMemo<PlacesState>(() => {
    const isCurrent = uid !== null && snapshot.uid === uid;
    return {
      places: isCurrent ? snapshot.places : [],
      loading: uid !== null && !isCurrent,
      error: isCurrent ? snapshot.error : null,
    };
  }, [uid, snapshot]);

  return <PlacesContext value={value}>{children}</PlacesContext>;
}

export function usePlaces(): PlacesState {
  const value = useContext(PlacesContext);
  if (!value) {
    throw new Error('usePlaces must be used inside PlacesProvider');
  }
  return value;
}

export function usePlace(id: string | undefined): Place | undefined {
  const { places } = usePlaces();
  return useMemo(() => places.find((place) => place.id === id), [places, id]);
}
