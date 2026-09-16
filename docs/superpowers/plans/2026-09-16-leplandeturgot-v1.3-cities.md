# Le Plan de Turgot v1.3 — Focus sur une ville — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each phone focus the app on one city (Paris by default, any other city added through Google search and shared between both users), so the list, map, place search, "Ce soir ?" (Nos idées and Découverte), Recos and new-place pushes all work for the active city.

**Architecture:** Same Expo SDK 57 / expo-router app as v1.2 (`docs/superpowers/plans/2026-09-13-leplandeturgot-v1.2.md`), now on branch `feat/cities` (from `main` at `5187f32`). A new `cities` feature holds the city model, a built-in Paris constant, a Firestore `cities` collection and a `CitiesProvider` exposing the per-phone active city (AsyncStorage). Places gain an optional `cityId` written at creation; places without it count as Paris. Screens filter on the active city; Google autocomplete and Nearby Search take their bias / centers from the active city's viewport. The Google search UI is refactored into a generic `SearchPanel` + `useGoogleSearch` so place search and city search share one debounced implementation. JavaScript only — no native rebuild.

**Tech Stack:** Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6 strict, expo-router 57 (Tabs `headerTitle`, Stack modal routes), react-native-maps (`MapView.animateToRegion`), `@react-native-async-storage/async-storage` 2.2, Firebase JS SDK Firestore, Google Places API (New): Autocomplete (`includedPrimaryTypes: ['(cities)']`), Place Details (`viewport`), Nearby Search.

**Spec:** No spec file — design approved in chat on 2026-09-16. The "Design summary" below is the spec.

## Global Constraints

- Platform: iOS only.
- No dependency changes of any kind (no `npm install`, no `npx expo install`, never `--legacy-peer-deps` / `--force`). Never touch `package.json` or `package-lock.json`.
- No native changes: do not touch `ios/`, `app.json`, `eas.json`; do not run `expo prebuild`, `pod install` or `expo run`.
- `firestore.rules` is modified in Task 1 only, exactly as written in this plan.
- Never read, touch or stage `*.p8`, `.env.local`, `.superpowers/`.
- AGENTS.md: "Expo HAS CHANGED" — for any Expo API not spelled out in this plan, read https://docs.expo.dev/versions/v57.0.0/ before writing code.
- No automated tests of any kind (user decision).
- Verification for every task: `npx tsc --noEmit` passes AND `npx expo export --platform ios --output-dir .expo/export-check` succeeds.
- Routes live in `src/app/`. Everything else in `src/`. Import alias `@/*` → `src/*`.
- All UI copy in French (informal "tu", typographic apostrophe `’`). Code identifiers in English.
- Keep every existing behavior, handler, guard and all existing French copy except the changes listed in the Design summary.
- Style with the existing tokens (`colors`, `fonts`, `spacing`, `radius`, `stroke`, `hardShadow` from `@/theme`) and existing components (`Button`, `Sticker`, `CenteredMessage`). With custom fonts, set `fontFamily` from `fonts` and never `fontWeight`.
- Default to no code comments; one short line only when the why is non-obvious.
- No emojis in code or UI copy (the `★` glyph is allowed, it is already used).
- Stage files by explicit path only (never `git add -A` / `git add .`). Deleted files via `git rm`.
- Commit trailers: `Co-Authored-By: <implementer model name> <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT`.

## Design summary

**Cities**
- Paris is built in: a constant with id `paris` (never stored in Firestore). Other cities are added through Google search restricted to cities and shared between both users in a new Firestore collection `cities`: `name`, center `lat`/`lng`, `viewport` `{ low: { latitude, longitude }, high: { latitude, longitude } }`, `googlePlaceId`, `createdBy`, `createdAt`. No city deletion.
- Adding a city that is already in the list (same `googlePlaceId`, including Paris through its known Google place ID) does not create a duplicate: it just makes it active.
- City list order: Paris first, then the Firestore cities by name.

**Active city (per phone)**
- Stored in AsyncStorage under `city:active`, default Paris. If the stored id is not in the city list, the app uses Paris (without rewriting storage).
- While logged in with a stored non-Paris city, the root navigator waits for the first `cities` snapshot (or its error, which falls back to Paris) before rendering, to avoid a flash of Paris content.

**City switcher**
- The header title of **Liste**, **Carte** and **Recos** becomes a lemon sticker: location icon + `<Ville>` + Ionicons `chevron-down`, tilted −2°. Tapping opens the modal route `city/select` (title "Villes").
- The modal lists the cities (tap = set active + close; the active one is lemon with a check) and a secondary button **"Ajouter une ville"** that switches the modal to a Google city search (placeholder "Nom de la ville (ex : Lyon)", "Annuler" back to the list). Picking a result shows "Ajout de la ville…", creates the city (or reuses an existing one), makes it active and closes the modal. Failure: Alert "Oups" / "Impossible d’ajouter cette ville, réessaie.". Detail fetch failure: Alert "Oups" / "Impossible de récupérer cette ville, réessaie.".
- Balcon is unchanged (its header keeps "Balcon", notes are not per city).

**Places**
- New optional field `cityId: string`. Every creation path writes the active city id: manual create (`place/new`), Découverte "Ajouter à nos idées", Recos "À faire". Places without `cityId` count as `paris`; no migration. Editing a place never rewrites `cityId` (`updatePlace` keeps merging `PlaceInput` only).

**Filtering by active city**
- Liste, Carte markers, "Ce soir ?" Nos idées pool, Recos sources. The "+1"/filters/empty states keep their current copy.

**Search, map, discovery, recos, push**
- Place search (create and detail "Changer l’adresse") is biased to a city: `locationBias.circle` centered on the city viewport center with radius = half the viewport diagonal, clamped to 5 000–50 000 m. Create uses the active city; detail uses the place's own city (fallback active city). `includedRegionCodes: ['fr']` is removed.
- Map: initial region from the active city viewport (spans × 1.1, min 0.02°); when the active city changes, the map animates to the new region (400 ms).
- Découverte: Paris keeps the 20 arrondissement centers (3 shuffled attempts). Other cities: 3 attempts, each centered on a random point of the **inner box of the viewport**, i.e. uniformly distributed within ±25 % of the viewport's latitude span and ±25 % of its longitude span around the viewport center (the middle 50 % of each span). Radius stays 1 500 m. The hint becomes "Aucune sélection = toutes les catégories · lieux bien notés à <Ville>".
- Recos: sources are the 5 most recent done + 5★ places **of the active city** (search stays around each source); changing city recomputes.
- Push body appends the city when it is not Paris: `jb a ajouté Café X (Café, Lyon)`; Paris keeps `jb a ajouté Café X (Café)`. The city name is the sender's active city (the place was just created in it).

**Firestore rules** — `cities` block (read: members; create: members with key/type validation, `createdBy == auth.uid`, `createdAt == request.time`; no update/delete) and optional string `cityId` on places. The user must republish the rules right after Task 1 (see Manual steps): from Task 1 on, every created place carries `cityId`, which the currently published rules reject.

## APIs checked for this plan

- Google Places Autocomplete (New): `includedPrimaryTypes` accepts up to five Table A/B types **or** the collection `(cities)` / `(regions)` used alone; `locationBias.circle.radius` must be within 0–50 000 m; `includedRegionCodes` is optional.
- Google Place Details (New): field mask `viewport` returns `{ low: { latitude, longitude }, high: { latitude, longitude } }` (Essentials SKU); `displayName` is Pro, `location` Essentials.
- react-native-maps (installed): `MapView#animateToRegion(region: Region, duration?: number)`, `Region` exported from the package root.
- expo-router 57 bottom tabs: `headerTitle?: string | ((props) => ReactNode)` in screen options.
- No Expo API outside those already used in the codebase is introduced.

## File structure (changes)

```
firestore.rules                              replace (Task 1)
src/features/cities/types.ts                 create (T1): Coordinates, Viewport, City, CityInput
src/features/cities/cities.ts                create (T1): PARIS, PARIS_CITY_ID, placeCityId, cityRegion, cityBiasCircle, randomInnerPoint, cityPushLabel
src/features/cities/api.ts                   create (T1): subscribeCities, createCity
src/features/cities/CitiesProvider.tsx       create (T1): CitiesProvider, useCities
src/features/cities/CitySwitcher.tsx         create (T1): header title sticker
src/features/cities/CitySearch.tsx           create (T1): Google city search
src/features/search/useGoogleSearch.ts       create (T1): generic debounced Google search hook
src/features/search/SearchPanel.tsx          create (T1): generic search UI (moved from PlaceSearch)
src/features/search/usePlaceSearch.ts        delete (T1)
src/features/search/PlaceSearch.tsx          replace (T1 wrapper; T2 adds city bias)
src/features/search/googlePlaces.ts          replace (T1: city search/details); modify (T2: autocomplete bias)
src/features/places/types.ts                 modify (T1): Place.cityId
src/features/places/api.ts                   modify (T1): createPlace(input, cityId), cityId mapping
src/app/_layout.tsx                          replace (T1): CitiesProvider, ready gate, city/select modal
src/app/city/select.tsx                      create (T1): city list + add city
src/app/(tabs)/_layout.tsx                   modify (T1): headerTitle CitySwitcher on Liste/Carte/Recos
src/app/place/new.tsx                        modify (T1: cityId; T2: search city; T3: push city)
src/features/search/DiscoveryPanel.tsx       modify (T1: cityId; T3: city centers, hint, push city)
src/features/recos/RecoCard.tsx              modify (T1: cityId; T3: push city)
src/app/place/[id].tsx                       modify (T2): search biased to the place's city
src/app/(tabs)/index.tsx                     modify (T2): filter by active city
src/app/(tabs)/map.tsx                       replace (T2): filter + city region
src/features/places/IdeasPanel.tsx           modify (T2): filter by active city
src/features/search/discovery.ts             modify (T3): discoverPlace(…, city)
src/features/recos/recos.ts                  modify (T3): pickRecoSources(places, cityId)
src/app/(tabs)/recos.tsx                     modify (T3): active city sources
src/features/push/notifyPartner.ts           modify (T3): city suffix
```

---

### Task 1: City data, active city, switcher, `cityId` on creation, rules

**Files:**
- Create: `src/features/cities/types.ts`, `src/features/cities/cities.ts`, `src/features/cities/api.ts`, `src/features/cities/CitiesProvider.tsx`, `src/features/cities/CitySwitcher.tsx`, `src/features/cities/CitySearch.tsx`, `src/features/search/useGoogleSearch.ts`, `src/features/search/SearchPanel.tsx`, `src/app/city/select.tsx`
- Replace: `firestore.rules`, `src/features/search/googlePlaces.ts`, `src/features/search/PlaceSearch.tsx`, `src/app/_layout.tsx`
- Modify: `src/features/places/types.ts`, `src/features/places/api.ts`, `src/app/(tabs)/_layout.tsx`, `src/app/place/new.tsx`, `src/features/search/DiscoveryPanel.tsx`, `src/features/recos/RecoCard.tsx`
- Delete: `src/features/search/usePlaceSearch.ts`

**Interfaces:**
- Consumes: `useAuth()` (`@/features/auth/AuthProvider`) → `{ user: User | null }`; `auth`, `db` (`@/lib/firebase`); `BASE_URL`, `buildHeaders(fieldMask?: string)`, `newSessionToken()` (`@/features/search/googlePlaces`, kept); `Button`, `CenteredMessage`; theme tokens; `useIntro`, `usePushSetup`, `PlacesProvider`, `UsersProvider`, `IntroProvider`, `AuthProvider` (root layout, unchanged behavior).
- Produces:
  - `@/features/cities/types`: `type Coordinates = { latitude: number; longitude: number }`, `type Viewport = { low: Coordinates; high: Coordinates }`, `type City = { id: string; name: string; lat: number; lng: number; viewport: Viewport; googlePlaceId: string | null }`, `type CityInput = Omit<City, 'id'>`
  - `@/features/cities/cities`: `PARIS_CITY_ID: 'paris'`, `PARIS: City`, `placeCityId(place: Pick<Place, 'cityId'>): string`, `viewportCenter(city: City): Coordinates`, `cityRegion(city: City): { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }`, `cityBiasCircle(city: City): { center: Coordinates; radius: number }`, `randomInnerPoint(city: City): Coordinates`, `cityPushLabel(city: City): string | null`
  - `@/features/cities/api`: `subscribeCities(onData: (cities: City[]) => void, onError: (error: Error) => void): Unsubscribe`, `createCity(input: CityInput): Promise<string>`
  - `@/features/cities/CitiesProvider`: `CitiesProvider`, `useCities(): { cities: City[]; citiesById: Record<string, City>; activeCity: City; ready: boolean; setActiveCity: (cityId: string) => void; addCity: (input: CityInput) => Promise<void> }`
  - `CitySwitcher()` (`@/features/cities/CitySwitcher`), `CitySearch({ onSelect: (input: CityInput) => void; onCancel: () => void })` (`@/features/cities/CitySearch`)
  - `@/features/search/useGoogleSearch`: `type SuggestFn = (input: string, sessionToken: string, signal: AbortSignal) => Promise<PlaceSuggestion[]>`, `type DetailsFn<T> = (placeId: string, sessionToken: string) => Promise<T>`, `useGoogleSearch<T>(suggest: SuggestFn, details: DetailsFn<T>): { query; setQuery; suggestions; loading; error; select: (placeId: string) => Promise<T> }`
  - `SearchPanel<T>({ placeholder: string; selectErrorMessage: string; suggest: SuggestFn; details: DetailsFn<T>; onSelect: (value: T) => void; onCancel?: () => void })` (`@/features/search/SearchPanel`)
  - `@/features/search/googlePlaces` additionally exports `autocompleteCities(input: string, sessionToken: string, signal?: AbortSignal): Promise<PlaceSuggestion[]>`, `getCityDetails(placeId: string, sessionToken: string): Promise<CityInput>`; `autocomplete(input, sessionToken, signal?)` keeps its current signature in this task
  - `PlaceSearch({ onSelect: (details: PlaceDetails) => void; onCancel?: () => void })` unchanged props in this task
  - `Place.cityId: string | null`; `createPlace(input: PlaceInput, cityId: string): Promise<string>`
  - modal route `/city/select`

- [ ] **Step 1: Create `src/features/cities/types.ts`**

```ts
export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Viewport = {
  low: Coordinates;
  high: Coordinates;
};

export type City = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  viewport: Viewport;
  googlePlaceId: string | null;
};

export type CityInput = Omit<City, 'id'>;
```

- [ ] **Step 2: Create `src/features/cities/cities.ts`**

```ts
import type { City, Coordinates } from '@/features/cities/types';
import type { Place } from '@/features/places/types';

export const PARIS_CITY_ID = 'paris';

export const PARIS: City = {
  id: PARIS_CITY_ID,
  name: 'Paris',
  lat: 48.8566,
  lng: 2.3522,
  viewport: {
    low: { latitude: 48.8156, longitude: 2.2241 },
    high: { latitude: 48.9022, longitude: 2.4699 },
  },
  googlePlaceId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
};

const METERS_PER_DEGREE = 111320;
const MIN_BIAS_RADIUS_METERS = 5000;
const MAX_BIAS_RADIUS_METERS = 50000;
const MIN_REGION_DELTA = 0.02;
const REGION_PADDING = 1.1;
const INNER_FRACTION = 0.5;

export function placeCityId(place: Pick<Place, 'cityId'>): string {
  return place.cityId ?? PARIS_CITY_ID;
}

export function viewportCenter(city: City): Coordinates {
  const { low, high } = city.viewport;
  return {
    latitude: (low.latitude + high.latitude) / 2,
    longitude: (low.longitude + high.longitude) / 2,
  };
}

export function cityRegion(city: City): Coordinates & { latitudeDelta: number; longitudeDelta: number } {
  const { low, high } = city.viewport;
  return {
    ...viewportCenter(city),
    latitudeDelta: Math.max(MIN_REGION_DELTA, (high.latitude - low.latitude) * REGION_PADDING),
    longitudeDelta: Math.max(MIN_REGION_DELTA, (high.longitude - low.longitude) * REGION_PADDING),
  };
}

export function cityBiasCircle(city: City): { center: Coordinates; radius: number } {
  const { low, high } = city.viewport;
  const center = viewportCenter(city);
  const heightMeters = (high.latitude - low.latitude) * METERS_PER_DEGREE;
  const widthMeters =
    (high.longitude - low.longitude) * METERS_PER_DEGREE * Math.cos((center.latitude * Math.PI) / 180);
  const halfDiagonal = Math.sqrt(heightMeters ** 2 + widthMeters ** 2) / 2;
  return {
    center,
    radius: Math.min(MAX_BIAS_RADIUS_METERS, Math.max(MIN_BIAS_RADIUS_METERS, Math.round(halfDiagonal))),
  };
}

export function randomInnerPoint(city: City): Coordinates {
  const { low, high } = city.viewport;
  const center = viewportCenter(city);
  return {
    latitude: center.latitude + (Math.random() - 0.5) * (high.latitude - low.latitude) * INNER_FRACTION,
    longitude: center.longitude + (Math.random() - 0.5) * (high.longitude - low.longitude) * INNER_FRACTION,
  };
}

export function cityPushLabel(city: City): string | null {
  return city.id === PARIS_CITY_ID ? null : city.name;
}
```

- [ ] **Step 3: Create `src/features/cities/api.ts`**

```ts
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
```

- [ ] **Step 4: Create `src/features/cities/CitiesProvider.tsx`**

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { createCity, subscribeCities } from '@/features/cities/api';
import { PARIS, PARIS_CITY_ID } from '@/features/cities/cities';
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
      setActiveCity(existing ? existing.id : await createCity(input));
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
```

- [ ] **Step 5: Create `src/features/cities/CitySwitcher.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useCities } from '@/features/cities/CitiesProvider';
import { colors, fonts, spacing, stroke } from '@/theme';

export function CitySwitcher() {
  const { activeCity } = useCities();

  return (
    <Pressable
      onPress={() => router.push('/city/select')}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`Ville : ${activeCity.name}. Changer de ville`}
      style={({ pressed }) => [styles.sticker, pressed && styles.pressed]}
    >
      <Ionicons name="location" size={15} color={colors.ink} />
      <Text style={styles.label} numberOfLines={1}>
        {activeCity.name}
      </Text>
      <Ionicons name="chevron-down" size={15} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sticker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 200,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: stroke,
    borderColor: colors.ink,
    backgroundColor: colors.lemon,
    transform: [{ rotate: '-2deg' }],
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
});
```

- [ ] **Step 6: Create `src/features/search/useGoogleSearch.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

import { newSessionToken, type PlaceSuggestion } from '@/features/search/googlePlaces';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export type SuggestFn = (input: string, sessionToken: string, signal: AbortSignal) => Promise<PlaceSuggestion[]>;

export type DetailsFn<T> = (placeId: string, sessionToken: string) => Promise<T>;

export function useGoogleSearch<T>(suggest: SuggestFn, details: DetailsFn<T>) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionToken = useRef(newSessionToken());
  const latest = useRef({ suggest, details });

  useEffect(() => {
    latest.current = { suggest, details };
  });

  useEffect(() => {
    const input = query.trim();
    if (input.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      latest.current
        .suggest(input, sessionToken.current, controller.signal)
        .then((results) => {
          if (controller.signal.aborted) return;
          setSuggestions(results);
          setError(null);
          setLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setError('Recherche indisponible, réessaie');
          setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const select = useCallback(async (placeId: string): Promise<T> => {
    const value = await latest.current.details(placeId, sessionToken.current);
    sessionToken.current = newSessionToken();
    return value;
  }, []);

  return { query, setQuery, suggestions, loading, error, select };
}
```

- [ ] **Step 7: Create `src/features/search/SearchPanel.tsx`** (UI moved verbatim from the current `PlaceSearch.tsx`, parameterized)

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { PlaceSuggestion } from '@/features/search/googlePlaces';
import { type DetailsFn, type SuggestFn, useGoogleSearch } from '@/features/search/useGoogleSearch';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

type Props<T> = {
  placeholder: string;
  selectErrorMessage: string;
  suggest: SuggestFn;
  details: DetailsFn<T>;
  onSelect: (value: T) => void;
  onCancel?: () => void;
};

export function SearchPanel<T>({ placeholder, selectErrorMessage, suggest, details, onSelect, onCancel }: Props<T>) {
  const { query, setQuery, suggestions, loading, error, select } = useGoogleSearch(suggest, details);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  async function handlePress(suggestion: PlaceSuggestion) {
    setSelectingId(suggestion.placeId);
    try {
      onSelect(await select(suggestion.placeId));
    } catch {
      Alert.alert('Oups', selectErrorMessage);
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.inputRow}>
          <Ionicons name="search" size={18} color={colors.inkMuted} />
          <TextInput
            style={styles.input}
            autoFocus
            placeholder={placeholder}
            placeholderTextColor={colors.inkFaint}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {loading ? <ActivityIndicator size="small" color={colors.ink} /> : null}
        </View>
        {onCancel ? (
          <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button">
            <Text style={styles.cancel}>Annuler</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={suggestions}
        keyExtractor={(suggestion) => suggestion.placeId}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
            onPress={() => handlePress(item)}
            disabled={selectingId !== null}
          >
            <View style={styles.suggestionText}>
              <Text style={styles.mainText} numberOfLines={1}>
                {item.mainText}
              </Text>
              <Text style={styles.secondaryText} numberOfLines={1}>
                {item.secondaryText}
              </Text>
            </View>
            {selectingId === item.placeId ? <ActivityIndicator size="small" color={colors.ink} /> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
  },
  cancel: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.cobalt,
  },
  error: {
    fontFamily: fonts.bold,
    color: colors.danger,
    paddingHorizontal: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  pressed: {
    opacity: 0.6,
  },
  suggestionText: {
    flex: 1,
    gap: 2,
  },
  mainText: {
    fontFamily: fonts.heavy,
    fontSize: 16,
    color: colors.ink,
  },
  secondaryText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
  },
});
```

- [ ] **Step 8: Replace `src/features/search/googlePlaces.ts`**

`autocomplete` keeps its current behavior and signature in this task (Task 2 changes it). The shared request/parse moves into `requestSuggestions`.

```ts
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';

import type { CityInput, Viewport } from '@/features/cities/types';
import { env } from '@/lib/env';

export const BASE_URL = 'https://places.googleapis.com/v1';
const PARIS_CENTER = { latitude: 48.8566, longitude: 2.3522 };
const DETAILS_FIELD_MASK = 'id,displayName,formattedAddress,location,types,primaryType';
const CITY_DETAILS_FIELD_MASK = 'id,displayName,location,viewport';
const FALLBACK_VIEWPORT_DELTA = 0.05;

export type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

export type PlaceDetails = {
  googlePlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  primaryType: string | null;
  types: string[];
};

type AutocompleteResponse = {
  suggestions?: {
    placePrediction?: {
      placeId: string;
      text?: { text: string };
      structuredFormat?: {
        mainText?: { text: string };
        secondaryText?: { text: string };
      };
    };
  }[];
};

type DetailsResponse = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
  primaryType?: string;
};

type CityDetailsResponse = {
  id: string;
  displayName?: { text: string };
  location?: { latitude: number; longitude: number };
  viewport?: Viewport;
};

export function newSessionToken(): string {
  return Crypto.randomUUID();
}

export function buildHeaders(fieldMask?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': env.googlePlacesApiKey,
  };
  const bundleIdentifier = Constants.expoConfig?.ios?.bundleIdentifier;
  if (bundleIdentifier) {
    headers['X-Ios-Bundle-Identifier'] = bundleIdentifier;
  }
  if (fieldMask) {
    headers['X-Goog-FieldMask'] = fieldMask;
  }
  return headers;
}

async function requestSuggestions(body: Record<string, unknown>, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const response = await fetch(`${BASE_URL}/places:autocomplete`, {
    method: 'POST',
    signal,
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Places autocomplete failed: ${response.status}`);
  }
  const json = (await response.json()) as AutocompleteResponse;
  return (json.suggestions ?? []).flatMap((suggestion) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return [];
    return [
      {
        placeId: prediction.placeId,
        mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? '',
        secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
      },
    ];
  });
}

export function autocomplete(input: string, sessionToken: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  return requestSuggestions(
    {
      input,
      sessionToken,
      languageCode: 'fr',
      includedRegionCodes: ['fr'],
      locationBias: { circle: { center: PARIS_CENTER, radius: 15000 } },
    },
    signal,
  );
}

export function autocompleteCities(
  input: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  return requestSuggestions({ input, sessionToken, languageCode: 'fr', includedPrimaryTypes: ['(cities)'] }, signal);
}

function detailsUrl(placeId: string, sessionToken: string): string {
  return (
    `${BASE_URL}/places/${encodeURIComponent(placeId)}` +
    `?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=fr`
  );
}

export async function getPlaceDetails(placeId: string, sessionToken: string): Promise<PlaceDetails> {
  const response = await fetch(detailsUrl(placeId, sessionToken), { headers: buildHeaders(DETAILS_FIELD_MASK) });
  if (!response.ok) {
    throw new Error(`Places details failed: ${response.status}`);
  }
  const json = (await response.json()) as DetailsResponse;
  if (!json.location) {
    throw new Error('Place has no location');
  }
  return {
    googlePlaceId: json.id,
    name: json.displayName?.text ?? '',
    address: json.formattedAddress ?? '',
    lat: json.location.latitude,
    lng: json.location.longitude,
    primaryType: json.primaryType ?? null,
    types: json.types ?? [],
  };
}

export async function getCityDetails(placeId: string, sessionToken: string): Promise<CityInput> {
  const response = await fetch(detailsUrl(placeId, sessionToken), { headers: buildHeaders(CITY_DETAILS_FIELD_MASK) });
  if (!response.ok) {
    throw new Error(`Places city details failed: ${response.status}`);
  }
  const json = (await response.json()) as CityDetailsResponse;
  if (!json.location) {
    throw new Error('City has no location');
  }
  const { latitude, longitude } = json.location;
  return {
    name: json.displayName?.text ?? '',
    lat: latitude,
    lng: longitude,
    viewport: json.viewport ?? {
      low: { latitude: latitude - FALLBACK_VIEWPORT_DELTA, longitude: longitude - FALLBACK_VIEWPORT_DELTA },
      high: { latitude: latitude + FALLBACK_VIEWPORT_DELTA, longitude: longitude + FALLBACK_VIEWPORT_DELTA },
    },
    googlePlaceId: json.id,
  };
}
```

- [ ] **Step 9: Replace `src/features/search/PlaceSearch.tsx` and delete `usePlaceSearch.ts`**

```tsx
import { autocomplete, getPlaceDetails, type PlaceDetails } from '@/features/search/googlePlaces';
import { SearchPanel } from '@/features/search/SearchPanel';

type Props = {
  onSelect: (details: PlaceDetails) => void;
  onCancel?: () => void;
};

export function PlaceSearch({ onSelect, onCancel }: Props) {
  return (
    <SearchPanel
      placeholder="Nom ou adresse (ex : Le Comptoir)"
      selectErrorMessage="Impossible de récupérer ce lieu, réessaie."
      suggest={autocomplete}
      details={getPlaceDetails}
      onSelect={onSelect}
      onCancel={onCancel}
    />
  );
}
```

```bash
git rm src/features/search/usePlaceSearch.ts
```

Confirm nothing else imports it: `grep -rn "usePlaceSearch" src` must print nothing.

- [ ] **Step 10: Create `src/features/cities/CitySearch.tsx`**

```tsx
import type { CityInput } from '@/features/cities/types';
import { autocompleteCities, getCityDetails } from '@/features/search/googlePlaces';
import { SearchPanel } from '@/features/search/SearchPanel';

type Props = {
  onSelect: (input: CityInput) => void;
  onCancel: () => void;
};

export function CitySearch({ onSelect, onCancel }: Props) {
  return (
    <SearchPanel
      placeholder="Nom de la ville (ex : Lyon)"
      selectErrorMessage="Impossible de récupérer cette ville, réessaie."
      suggest={autocompleteCities}
      details={getCityDetails}
      onSelect={onSelect}
      onCancel={onCancel}
    />
  );
}
```

- [ ] **Step 11: Add `cityId` to places**

In `src/features/places/types.ts`, add `cityId: string | null;` to `Place` right after `likedBy: string[];`. `PlaceInput` is unchanged (its `Pick` list does not include `cityId`).

In `src/features/places/api.ts`:

1. Replace `createPlace` with:

```ts
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
```

2. In `subscribePlaces`, replace the returned object line

```ts
          return { ...data, id: document.id, likedBy: Array.isArray(data.likedBy) ? data.likedBy : [] };
```

with

```ts
          return {
            ...data,
            id: document.id,
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            cityId: typeof data.cityId === 'string' ? data.cityId : null,
          };
```

`updatePlace` stays as is (it merges `PlaceInput`, so an existing `cityId` is never rewritten).

- [ ] **Step 12: Pass the active city at every creation site**

`src/app/place/new.tsx`:
1. Add `import { useCities } from '@/features/cities/CitiesProvider';` (keep imports sorted by path).
2. Add `const { activeCity } = useCities();` right after `const { users } = useUsers();`.
3. Replace `const id = await createPlace(input);` with `const id = await createPlace(input, activeCity.id);`.

`src/features/search/DiscoveryPanel.tsx`:
1. Add `import { useCities } from '@/features/cities/CitiesProvider';`.
2. Add `const { activeCity } = useCities();` right after `const { users } = useUsers();`.
3. Replace `const id = await createPlace(input);` with `const id = await createPlace(input, activeCity.id);`.

`src/features/recos/RecoCard.tsx`:
1. Add `import { useCities } from '@/features/cities/CitiesProvider';`.
2. Add `const { activeCity } = useCities();` right after `const { users } = useUsers();`.
3. Replace `const id = await createPlace(input);` with `const id = await createPlace(input, activeCity.id);`.

- [ ] **Step 13: Create `src/app/city/select.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { CenteredMessage } from '@/components/CenteredMessage';
import { useCities } from '@/features/cities/CitiesProvider';
import { CitySearch } from '@/features/cities/CitySearch';
import type { CityInput } from '@/features/cities/types';
import { colors, fonts, hardShadow, radius, spacing, stroke } from '@/theme';

type Mode = 'list' | 'search' | 'saving';

export default function CitySelectScreen() {
  const { cities, activeCity, setActiveCity, addCity } = useCities();
  const [mode, setMode] = useState<Mode>('list');

  function choose(cityId: string) {
    setActiveCity(cityId);
    router.back();
  }

  async function handleSelect(input: CityInput) {
    setMode('saving');
    try {
      await addCity(input);
      router.back();
    } catch (cause) {
      console.warn('City save failed', cause);
      setMode('search');
      Alert.alert('Oups', 'Impossible d’ajouter cette ville, réessaie.');
    }
  }

  if (mode === 'saving') {
    return <CenteredMessage loading text="Ajout de la ville…" />;
  }

  if (mode === 'search') {
    return <CitySearch onSelect={handleSelect} onCancel={() => setMode('list')} />;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {cities.map((city) => {
        const active = city.id === activeCity.id;
        return (
          <Pressable
            key={city.id}
            onPress={() => choose(city.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.pressed]}
          >
            <Ionicons name={active ? 'location' : 'location-outline'} size={20} color={colors.ink} />
            <Text style={styles.name}>{city.name}</Text>
            {active ? <Ionicons name="checkmark" size={20} color={colors.ink} /> : null}
          </Pressable>
        );
      })}
      <Button label="Ajouter une ville" icon="add" variant="secondary" onPress={() => setMode('search')} style={styles.add} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
  },
  rowActive: {
    backgroundColor: colors.lemon,
    boxShadow: hardShadow,
  },
  pressed: {
    opacity: 0.85,
  },
  name: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  add: {
    marginTop: spacing.md,
  },
});
```

- [ ] **Step 14: Replace `src/app/_layout.tsx`**

Keeps the font gate, provider order, `usePushSetup()` first in the navigator, the intro/login/app protected groups and all modal options; adds `CitiesProvider`, the cities `ready` gate and the `city/select` modal.

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { CenteredMessage } from '@/components/CenteredMessage';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { CitiesProvider, useCities } from '@/features/cities/CitiesProvider';
import { IntroProvider, useIntro } from '@/features/intro/IntroProvider';
import { PlacesProvider } from '@/features/places/PlacesProvider';
import { usePushSetup } from '@/features/push/usePushSetup';
import { UsersProvider } from '@/features/users/UsersProvider';
import { useAppFonts } from '@/lib/useAppFonts';
import { colors, fonts } from '@/theme';

export default function RootLayout() {
  const fontsReady = useAppFonts();

  if (!fontsReady) {
    return null;
  }

  return (
    <IntroProvider>
      <AuthProvider>
        <UsersProvider>
          <PlacesProvider>
            <CitiesProvider>
              <RootNavigator />
            </CitiesProvider>
          </PlacesProvider>
        </UsersProvider>
        <StatusBar style="dark" />
      </AuthProvider>
    </IntroProvider>
  );
}

function RootNavigator() {
  usePushSetup();
  const { user, initializing } = useAuth();
  const { seen } = useIntro();
  const { ready: citiesReady } = useCities();

  if (initializing || seen === null || !citiesReady) {
    return <CenteredMessage loading text="" />;
  }

  const loggedIn = user !== null;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.paper },
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
      }}
    >
      <Stack.Protected guard={!seen}>
        <Stack.Screen name="intro" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={seen && !loggedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={seen && loggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="place/new"
          dangerouslySingular
          options={{ presentation: 'modal', title: 'Nouveau lieu' }}
        />
        <Stack.Screen name="place/[id]" options={{ presentation: 'modal', title: 'Lieu' }} />
        <Stack.Screen
          name="place/random"
          dangerouslySingular
          options={{ presentation: 'modal', title: 'On fait quoi ce soir ?' }}
        />
        <Stack.Screen
          name="city/select"
          dangerouslySingular
          options={{ presentation: 'modal', title: 'Villes' }}
        />
      </Stack.Protected>
    </Stack>
  );
}
```

- [ ] **Step 15: Header title sticker in `src/app/(tabs)/_layout.tsx`**

1. Add `import { CitySwitcher } from '@/features/cities/CitySwitcher';` after the `StampTabBar` import.
2. In the `index`, `map` and `recos` `Tabs.Screen` options, add `headerTitle: () => <CitySwitcher />,` right after the `title` line. Keep `title` (it is the tab label). Do not change the `balcon` screen.

- [ ] **Step 16: Replace `firestore.rules`**

Keep the two UIDs exactly as they are in the current file (they are the same as below).

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isMember() {
      return request.auth != null
        && request.auth.uid in ['8UvdSScymWVOMe2Qyi5YaB6sM6B3', 'G1nr3j7i3yPMVuzlnbpP6ix6J8L2'];
    }

    function isValidPlace(data) {
      return data.keys().hasOnly([
          'name', 'category', 'address', 'lat', 'lng', 'googlePlaceId',
          'status', 'rating', 'comment', 'createdBy', 'createdAt', 'updatedAt', 'likedBy', 'cityId'
        ])
        && data.name is string && data.name.size() > 0 && data.name.size() <= 200
        && data.category in ['resto', 'bar', 'cafe', 'activite', 'culture', 'autre']
        && data.address is string
        && data.lat is number && data.lng is number
        && (data.googlePlaceId == null || data.googlePlaceId is string)
        && data.status in ['todo', 'done']
        && ((data.status == 'todo' && data.rating == null)
          || (data.status == 'done' && data.rating is int && data.rating >= 1 && data.rating <= 5))
        && (data.comment == null || (data.comment is string && data.comment.size() <= 2000))
        && (!('likedBy' in data) || (data.likedBy is list && data.likedBy.size() <= 2))
        && (!('cityId' in data) || (data.cityId is string && data.cityId.size() > 0 && data.cityId.size() <= 100))
        && data.createdBy is string
        && data.updatedAt == request.time;
    }

    function isCoordinates(point) {
      return point is map
        && point.keys().hasOnly(['latitude', 'longitude'])
        && point.latitude is number
        && point.longitude is number;
    }

    match /places/{placeId} {
      allow read: if isMember();
      allow create: if isMember()
        && isValidPlace(request.resource.data)
        && request.resource.data.createdBy == request.auth.uid
        && request.resource.data.createdAt == request.time;
      allow update: if isMember()
        && isValidPlace(request.resource.data)
        && request.resource.data.createdBy == resource.data.createdBy
        && request.resource.data.createdAt == resource.data.createdAt;
      allow delete: if isMember();
    }

    match /cities/{cityId} {
      allow read: if isMember();
      allow create: if isMember()
        && cityId != 'paris'
        && request.resource.data.keys().hasOnly(['name', 'lat', 'lng', 'viewport', 'googlePlaceId', 'createdBy', 'createdAt'])
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 100
        && request.resource.data.lat is number
        && request.resource.data.lng is number
        && request.resource.data.viewport is map
        && request.resource.data.viewport.keys().hasOnly(['low', 'high'])
        && isCoordinates(request.resource.data.viewport.low)
        && isCoordinates(request.resource.data.viewport.high)
        && (request.resource.data.googlePlaceId == null || request.resource.data.googlePlaceId is string)
        && request.resource.data.createdBy == request.auth.uid
        && request.resource.data.createdAt == request.time;
    }

    match /notes/{noteId} {
      allow read, delete: if isMember();
      allow create: if isMember()
        && request.resource.data.keys().hasOnly(['title', 'createdBy', 'createdAt'])
        && request.resource.data.title is string
        && request.resource.data.title.size() > 0
        && request.resource.data.title.size() <= 200
        && request.resource.data.createdBy == request.auth.uid
        && request.resource.data.createdAt == request.time;
    }

    match /users/{uid} {
      allow read: if isMember();
      allow update: if isMember()
        && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['displayName', 'expoPushToken'])
        && request.resource.data.displayName is string
        && (request.resource.data.expoPushToken == null || request.resource.data.expoPushToken is string);
    }
  }
}
```

- [ ] **Step 17: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed.

- [ ] **Step 18: Commit**

```bash
git add src/features/cities/types.ts src/features/cities/cities.ts src/features/cities/api.ts src/features/cities/CitiesProvider.tsx src/features/cities/CitySwitcher.tsx src/features/cities/CitySearch.tsx src/features/search/useGoogleSearch.ts src/features/search/SearchPanel.tsx src/features/search/googlePlaces.ts src/features/search/PlaceSearch.tsx src/features/places/types.ts src/features/places/api.ts src/app/place/new.tsx src/features/search/DiscoveryPanel.tsx src/features/recos/RecoCard.tsx src/app/city/select.tsx src/app/_layout.tsx "src/app/(tabs)/_layout.tsx" firestore.rules
git status
git commit -m "$(cat <<'EOF'
feat: cities with per-phone active city and city switcher

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

`git status` after commit must show a clean tree (the `git rm` of `usePlaceSearch.ts` is part of the commit).

---

### Task 2: Filter by active city, map region, search bias

**Files:**
- Modify: `src/features/search/googlePlaces.ts`, `src/app/place/new.tsx`, `src/app/place/[id].tsx`, `src/app/(tabs)/index.tsx`, `src/features/places/IdeasPanel.tsx`
- Replace: `src/features/search/PlaceSearch.tsx`, `src/app/(tabs)/map.tsx`

**Interfaces:**
- Consumes (Task 1): `useCities()` → `{ citiesById, activeCity }`; `placeCityId`, `cityRegion`, `cityBiasCircle` (`@/features/cities/cities`); `City` type; `SearchPanel`; existing `usePlaces`, `groupPlacesByCategory`, `randomCandidates`, `pickRandom`.
- Produces:
  - `@/features/search/googlePlaces`: `type SearchBias = { center: { latitude: number; longitude: number }; radius: number }`; `autocomplete(input: string, sessionToken: string, bias: SearchBias, signal?: AbortSignal): Promise<PlaceSuggestion[]>` (no `includedRegionCodes`); `PARIS_CENTER` constant removed
  - `PlaceSearch({ city: City; onSelect: (details: PlaceDetails) => void; onCancel?: () => void })`

- [ ] **Step 1: Bias place autocomplete in `src/features/search/googlePlaces.ts`**

1. Delete the line `const PARIS_CENTER = { latitude: 48.8566, longitude: 2.3522 };`.
2. Add, right after the `PlaceDetails` type:

```ts
export type SearchBias = {
  center: { latitude: number; longitude: number };
  radius: number;
};
```

3. Replace the whole `autocomplete` function with:

```ts
export function autocomplete(
  input: string,
  sessionToken: string,
  bias: SearchBias,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  return requestSuggestions({ input, sessionToken, languageCode: 'fr', locationBias: { circle: bias } }, signal);
}
```

- [ ] **Step 2: Replace `src/features/search/PlaceSearch.tsx`**

```tsx
import { cityBiasCircle } from '@/features/cities/cities';
import type { City } from '@/features/cities/types';
import { autocomplete, getPlaceDetails, type PlaceDetails } from '@/features/search/googlePlaces';
import { SearchPanel } from '@/features/search/SearchPanel';

type Props = {
  city: City;
  onSelect: (details: PlaceDetails) => void;
  onCancel?: () => void;
};

export function PlaceSearch({ city, onSelect, onCancel }: Props) {
  const bias = cityBiasCircle(city);

  return (
    <SearchPanel
      placeholder="Nom ou adresse (ex : Le Comptoir)"
      selectErrorMessage="Impossible de récupérer ce lieu, réessaie."
      suggest={(input, sessionToken, signal) => autocomplete(input, sessionToken, bias, signal)}
      details={getPlaceDetails}
      onSelect={onSelect}
      onCancel={onCancel}
    />
  );
}
```

- [ ] **Step 3: Search city in `src/app/place/new.tsx`**

Replace the `PlaceSearch` return line with:

```tsx
    return (
      <PlaceSearch
        city={activeCity}
        onSelect={handleSelect}
        onCancel={values ? () => setSearching(false) : () => router.back()}
      />
    );
```

- [ ] **Step 4: Search city in `src/app/place/[id].tsx`**

1. Add imports: `import { placeCityId } from '@/features/cities/cities';` and `import { useCities } from '@/features/cities/CitiesProvider';` (sorted by path).
2. Add `const { citiesById, activeCity } = useCities();` right after `const { usersById } = useUsers();` (above every early return).
3. Replace

```tsx
    return <PlaceSearch onSelect={handleLocationSelect} onCancel={() => setSearching(false)} />;
```

with

```tsx
    return (
      <PlaceSearch
        city={citiesById[placeCityId(place)] ?? activeCity}
        onSelect={handleLocationSelect}
        onCancel={() => setSearching(false)}
      />
    );
```

- [ ] **Step 5: Filter the list in `src/app/(tabs)/index.tsx`**

1. Add imports: `import { placeCityId } from '@/features/cities/cities';` and `import { useCities } from '@/features/cities/CitiesProvider';`.
2. Add `const { activeCity } = useCities();` right after `const { usersById } = useUsers();`.
3. Replace the `sections` memo with:

```tsx
  const sections = useMemo(
    () =>
      groupPlacesByCategory(
        places.filter((place) => placeCityId(place) === activeCity.id),
        filter,
        sharedOnly,
      ),
    [places, activeCity.id, filter, sharedOnly],
  );
```

- [ ] **Step 6: Replace `src/app/(tabs)/map.tsx`**

```tsx
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Fab } from '@/components/Fab';
import { cityRegion, placeCityId } from '@/features/cities/cities';
import { useCities } from '@/features/cities/CitiesProvider';
import { usePlaces } from '@/features/places/PlacesProvider';
import type { Place } from '@/features/places/types';
import { colors, fonts, spacing, stroke } from '@/theme';

const REGION_ANIMATION_MS = 400;

function describe(place: Place): string {
  if (place.status === 'todo') {
    return 'À faire';
  }
  const rating = place.rating ?? 0;
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
}

export default function MapScreen() {
  const { places } = usePlaces();
  const { activeCity } = useCities();
  const mapRef = useRef<MapView>(null);
  const initialRegion = useRef(cityRegion(activeCity)).current;
  const cityPlaces = useMemo(
    () => places.filter((place) => placeCityId(place) === activeCity.id),
    [places, activeCity.id],
  );

  useEffect(() => {
    mapRef.current?.animateToRegion(cityRegion(activeCity), REGION_ANIMATION_MS);
  }, [activeCity.id]);

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={initialRegion}>
        {cityPlaces.map((place) => (
          <Marker
            // Status in the key forces a remount: iOS does not repaint pinColor changes.
            key={`${place.id}-${place.status}`}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            pinColor={place.status === 'done' ? colors.done : colors.todo}
            title={place.name}
            description={describe(place)}
            onCalloutPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })}
          />
        ))}
      </MapView>
      <View style={styles.legend}>
        <View style={[styles.legendSticker, styles.tiltLeft]}>
          <View style={[styles.dot, { backgroundColor: colors.todo }]} />
          <Text style={styles.legendText}>À faire</Text>
        </View>
        <View style={[styles.legendSticker, styles.tiltRight]}>
          <View style={[styles.dot, { backgroundColor: colors.done }]} />
          <Text style={styles.legendText}>Fait</Text>
        </View>
      </View>
      <Fab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  legendSticker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tiltLeft: {
    transform: [{ rotate: '-3deg' }],
  },
  tiltRight: {
    transform: [{ rotate: '2deg' }],
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  legendText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
});
```

- [ ] **Step 7: Filter "Nos idées" in `src/features/places/IdeasPanel.tsx`**

1. Add imports: `import { placeCityId } from '@/features/cities/cities';` and `import { useCities } from '@/features/cities/CitiesProvider';`.
2. Add `const { activeCity } = useCities();` right after `const { usersById } = useUsers();`.
3. Replace the `candidates` memo with:

```tsx
  const candidates = useMemo(
    () =>
      randomCandidates(
        places.filter((place) => placeCityId(place) === activeCity.id),
        { categories, sharedOnly },
      ),
    [places, activeCity.id, categories, sharedOnly],
  );
```

- [ ] **Step 8: Verify**

```bash
grep -rn "includedRegionCodes\|PARIS_CENTER" src
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: the grep prints nothing; tsc and export succeed.

- [ ] **Step 9: Commit**

```bash
git add src/features/search/googlePlaces.ts src/features/search/PlaceSearch.tsx src/app/place/new.tsx "src/app/place/[id].tsx" "src/app/(tabs)/index.tsx" "src/app/(tabs)/map.tsx" src/features/places/IdeasPanel.tsx
git status
git commit -m "$(cat <<'EOF'
feat: filter places, map and search by active city

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 3: Découverte city centers, Recos city sources, push city suffix

**Files:**
- Modify: `src/features/search/discovery.ts`, `src/features/search/DiscoveryPanel.tsx`, `src/features/recos/recos.ts`, `src/app/(tabs)/recos.tsx`, `src/features/push/notifyPartner.ts`, `src/app/place/new.tsx`, `src/features/recos/RecoCard.tsx`

**Interfaces:**
- Consumes (Task 1): `PARIS_CITY_ID`, `randomInnerPoint`, `placeCityId`, `cityPushLabel` (`@/features/cities/cities`); `City` type; `useCities()` → `{ activeCity }` (already imported in `new.tsx`, `DiscoveryPanel.tsx`, `RecoCard.tsx` by Task 1).
- Produces:
  - `discoverPlace(categories: readonly DiscoveryCategory[], excludedIds: ReadonlySet<string>, city: City): Promise<DiscoveredPlace | null>`
  - `pickRecoSources(places: readonly Place[], cityId: string): Place[]`
  - `notifyPartner(place: Pick<Place, 'id' | 'name' | 'category'>, users: readonly AppUser[], myUid: string, cityName: string | null): Promise<void>`

- [ ] **Step 1: City-aware search centers in `src/features/search/discovery.ts`**

1. Add imports after the existing ones at the top:

```ts
import { PARIS_CITY_ID, randomInnerPoint } from '@/features/cities/cities';
import type { City } from '@/features/cities/types';
```

(keep imports sorted by path: `@/features/cities/...` before `@/features/places/...`).

2. Add, right after the `shuffled` function:

```ts
function searchCenters(city: City): LatLng[] {
  if (city.id === PARIS_CITY_ID) {
    return shuffled(ARRONDISSEMENT_CENTERS).slice(0, MAX_ATTEMPTS);
  }
  return Array.from({ length: MAX_ATTEMPTS }, () => randomInnerPoint(city));
}
```

3. Replace the `discoverPlace` signature and loop header:

```ts
export async function discoverPlace(
  categories: readonly DiscoveryCategory[],
  excludedIds: ReadonlySet<string>,
  city: City,
): Promise<DiscoveredPlace | null> {
  for (const center of searchCenters(city)) {
```

The loop body (per-attempt `typesFor`, filters, random pick) and everything else in the file stay unchanged, including the 10 s timeout and the random category when none is selected.

- [ ] **Step 2: Push city suffix in `src/features/push/notifyPartner.ts`**

Replace the function signature and the `body` line:

```ts
export async function notifyPartner(
  place: Pick<Place, 'id' | 'name' | 'category'>,
  users: readonly AppUser[],
  myUid: string,
  cityName: string | null,
): Promise<void> {
```

```ts
    const categoryLabel = CATEGORY_BY_KEY[place.category].label;
    const details = cityName ? `${categoryLabel}, ${cityName}` : categoryLabel;
```

(insert those two lines right after `if (!partner?.expoPushToken) return;`) and

```ts
        body: `${me?.displayName ?? 'Quelqu’un'} a ajouté ${place.name} (${details})`,
```

Everything else stays unchanged.

- [ ] **Step 3: Update the three push callers**

`src/app/place/new.tsx`:
1. Add `import { cityPushLabel } from '@/features/cities/cities';`.
2. Replace `void notifyPartner({ id, name: input.name, category: input.category }, users, user.uid);` with `void notifyPartner({ id, name: input.name, category: input.category }, users, user.uid, cityPushLabel(activeCity));`.

`src/features/recos/RecoCard.tsx`:
1. Add `import { cityPushLabel } from '@/features/cities/cities';`.
2. Replace `void notifyPartner({ id, name: input.name, category: input.category }, users, myUid);` with `void notifyPartner({ id, name: input.name, category: input.category }, users, myUid, cityPushLabel(activeCity));`.

`src/features/search/DiscoveryPanel.tsx`:
1. Add `import { cityPushLabel } from '@/features/cities/cities';`.
2. Replace `void notifyPartner({ id, name: input.name, category: input.category }, users, user.uid);` with `void notifyPartner({ id, name: input.name, category: input.category }, users, user.uid, cityPushLabel(activeCity));`.
3. Replace `const found = await discoverPlace(categories, new Set([...knownIds, ...proposedIds.current]));` with `const found = await discoverPlace(categories, new Set([...knownIds, ...proposedIds.current]), activeCity);`.
4. Replace the hint line

```tsx
      <Text style={pickerStyles.hint}>Aucune sélection = toutes les catégories · lieux bien notés dans Paris</Text>
```

with

```tsx
      <Text style={pickerStyles.hint}>
        Aucune sélection = toutes les catégories · lieux bien notés à {activeCity.name}
      </Text>
```

- [ ] **Step 4: City sources in `src/features/recos/recos.ts`**

1. Add `import { placeCityId } from '@/features/cities/cities';` before the `@/features/places/types` import.
2. Replace `pickRecoSources` with:

```ts
export function pickRecoSources(places: readonly Place[], cityId: string): Place[] {
  return places
    .filter(
      (place) =>
        placeCityId(place) === cityId &&
        place.status === 'done' &&
        place.rating === 5 &&
        isDiscoveryCategory(place.category),
    )
    .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis())
    .slice(0, MAX_SOURCES);
}
```

- [ ] **Step 5: Active city in `src/app/(tabs)/recos.tsx`**

1. Add `import { useCities } from '@/features/cities/CitiesProvider';` (sorted by path, after `@/features/auth/AuthProvider`).
2. Add `const { activeCity } = useCities();` right after `const { places, loading: placesLoading } = usePlaces();`.
3. Replace `const sources = useMemo(() => pickRecoSources(places), [places]);` with `const sources = useMemo(() => pickRecoSources(places, activeCity.id), [places, activeCity.id]);`.

The existing `sourceKey` (sorted source ids) changes when the city changes, which already triggers a recompute; the `requestId` guard drops stale results.

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed. Do not call the Google API.

- [ ] **Step 7: Commit**

```bash
git add src/features/search/discovery.ts src/features/search/DiscoveryPanel.tsx src/features/recos/recos.ts "src/app/(tabs)/recos.tsx" src/features/push/notifyPartner.ts src/app/place/new.tsx src/features/recos/RecoCard.tsx
git status
git commit -m "$(cat <<'EOF'
feat: city-aware discovery, recos and push

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

## Manual steps (user)

1. **Right after Task 1 is merged into your working copy, republish the Firestore rules**: Console Firebase → Firestore → Règles → paste the whole committed `firestore.rules` (`pbcopy < firestore.rules`) → Publier. Without it, adding a place (it now carries `cityId`) and adding a city are refused ("Missing or insufficient permissions").
2. Reload the app (no native rebuild).
3. Test: tap the "Paris ▾" sticker → Ajouter une ville → Lyon → the list, map, "Ce soir ?" and Recos switch to Lyon; add a place in Lyon → the other phone gets "jb a ajouté … (Resto, Lyon)"; switch back to Paris → Paris places are back; the other phone keeps its own active city.
