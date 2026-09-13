import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { subscribePlaces } from '@/features/places/api';
import type { Place } from '@/features/places/types';

type PlacesState = {
  places: Place[];
  loading: boolean;
  error: Error | null;
};

const PlacesContext = createContext<PlacesState | null>(null);

export function PlacesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<PlacesState>({ places: [], loading: true, error: null });

  useEffect(() => {
    if (!uid) {
      setState({ places: [], loading: false, error: null });
      return;
    }
    setState((previous) => ({ ...previous, loading: true, error: null }));
    return subscribePlaces(
      (places) => setState({ places, loading: false, error: null }),
      (error) => setState((previous) => ({ ...previous, loading: false, error })),
    );
  }, [uid]);

  return <PlacesContext value={state}>{children}</PlacesContext>;
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
