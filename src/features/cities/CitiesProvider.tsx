import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { createCity, subscribeCities } from '@/features/cities/api';
import { distanceKm, PARIS, PARIS_CITY_ID, PARIS_DEDUPE_RADIUS_KM } from '@/features/cities/cities';
import type { City, CityInput } from '@/features/cities/types';

const ACTIVE_CITY_KEY = 'city:active';

type CitiesState = {
  cities: City[];
  citiesById: Record<string, City>;
  activeCity: City;
  ready: boolean;
  setActiveCity: (cityId: string) => void;
  addCity: (input: CityInput) => Promise<void>;
};

type RemoteCities = {
  uid: string | null;
  cities: City[];
  loaded: boolean;
};

const EMPTY_REMOTE: RemoteCities = { uid: null, cities: [], loaded: false };

const CitiesContext = createContext<CitiesState | null>(null);

export function CitiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [storedId, setStoredId] = useState<string | null | undefined>(undefined);
  const [remote, setRemote] = useState<RemoteCities>(EMPTY_REMOTE);

  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_CITY_KEY)
      .then((value) => setStoredId(value))
      .catch(() => setStoredId(null));
  }, []);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeCities(
      (cities) => setRemote({ uid, cities, loaded: true }),
      (error) => {
        console.warn('Cities subscription failed', error);
        setRemote((previous) => ({ uid, cities: previous.uid === uid ? previous.cities : [], loaded: true }));
      },
    );
    return () => {
      unsubscribe();
      setRemote(EMPTY_REMOTE);
    };
  }, [uid]);

  const setActiveCity = useCallback((cityId: string) => {
    setStoredId(cityId);
    AsyncStorage.setItem(ACTIVE_CITY_KEY, cityId).catch((error: unknown) =>
      console.warn('Saving active city failed', error),
    );
  }, []);

  const value = useMemo<CitiesState>(() => {
    const isCurrent = uid !== null && remote.uid === uid;
    const remoteCities = isCurrent ? remote.cities.filter((city) => city.id !== PARIS_CITY_ID) : [];
    const cities = [PARIS, ...remoteCities];
    const citiesById: Record<string, City> = Object.fromEntries(cities.map((city) => [city.id, city]));
    const wantedId = storedId ?? PARIS_CITY_ID;
    const activeCity = citiesById[wantedId] ?? PARIS;
    const ready =
      storedId !== undefined && (uid === null || wantedId === PARIS_CITY_ID || (isCurrent && remote.loaded));

    async function addCity(input: CityInput) {
      const existing = cities.find((city) => city.googlePlaceId !== null && city.googlePlaceId === input.googlePlaceId);
      if (existing) {
        setActiveCity(existing.id);
        return;
      }
      const nearParis =
        distanceKm({ latitude: input.lat, longitude: input.lng }, { latitude: PARIS.lat, longitude: PARIS.lng }) <=
        PARIS_DEDUPE_RADIUS_KM;
      setActiveCity(nearParis ? PARIS_CITY_ID : await createCity(input));
    }

    return { cities, citiesById, activeCity, ready, setActiveCity, addCity };
  }, [uid, remote, storedId, setActiveCity]);

  return <CitiesContext value={value}>{children}</CitiesContext>;
}

export function useCities(): CitiesState {
  const value = useContext(CitiesContext);
  if (!value) {
    throw new Error('useCities must be used inside CitiesProvider');
  }
  return value;
}
