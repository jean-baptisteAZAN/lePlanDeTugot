# Le Plan de Turgot v1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the v1 final-review fixes, then add "Moi aussi" (heart a place the other added, filter shared wishes) and "On fait quoi ce soir ?" (random pick of a to-do place with category / shared-wish filters).

**Architecture:** Same app as v1 (`docs/superpowers/plans/2026-09-13-leplandeturgot-v1.md`): Expo SDK 57 + expo-router under `src/app`, Firebase JS SDK Firestore real-time providers, no server. "Moi aussi" adds a `likedBy: string[]` field on `places` written with `arrayUnion`/`arrayRemove`. The random picker is a pure filter + pick function and a new modal route. JavaScript only — no new dependencies, no native rebuild.

**Tech Stack:** Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6 strict, expo-router 57, firebase ≥12 (Firestore `arrayUnion`, `arrayRemove`, `getDoc`), @expo/vector-icons Ionicons.

**Spec:** No spec file — design approved in chat on 2026-09-13; the "Design summary" section below is the spec. v1 plan for existing code context: `docs/superpowers/plans/2026-09-13-leplandeturgot-v1.md`.

## Global Constraints

- Platform: iOS only.
- No new dependencies. No native changes: do not touch `ios/`, `app.json`, `package.json`, and do not run `expo prebuild`, `pod install` or `expo run`.
- AGENTS.md: "Expo HAS CHANGED" — for any Expo API not spelled out in this plan, read https://docs.expo.dev/versions/v57.0.0/ before writing code.
- No automated tests of any kind (user decision).
- Verification for every task: `npx tsc --noEmit` passes AND `npx expo export --platform ios --output-dir .expo/export-check` succeeds.
- Routes live in `src/app/`. Everything else in `src/`. Import alias `@/*` → `src/*`.
- All UI copy in French (informal "tu", typographic apostrophe `’`). Code identifiers in English.
- Default to no code comments; one short line only when the why is non-obvious.
- No emojis in code or UI copy.
- Firestore field names exactly as in "Data model" below.
- Stage files by explicit path only (never `git add -A` / `git add .`). Never commit `.env.local`, `.superpowers/`, `.expo/`, `ios/`.
- Commit trailers: `Co-Authored-By: <implementer model name> <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT`.

## Design summary

**Final-review fixes (from v1):**
- F1: opening `/place/[id]` for a place not yet in the local snapshot (e.g. notification tap after background) shows "Chargement…" while a one-shot `getDoc` checks existence; "Ce lieu n’existe plus" only if the doc really doesn't exist; "Impossible de charger ce lieu" if the check fails.
- F2: `PlacesProvider` reports `loading: true` from the very first render after a uid appears (no empty-state flash).
- F3: logout never hangs offline: clearing the push token races a 3 s timeout, then Firebase sign-out always runs.
- F4: double tap on (+) opens only one "Nouveau lieu" modal (`dangerouslySingular`).
- F5: "Nouveau lieu" search screen has "Annuler" before the first pick (closes the modal).

**"Moi aussi":**
- Adding a place counts as the creator wanting it. Only the other user can tap the heart.
- Place field `likedBy: string[]` (uids who tapped the heart). Missing on old docs → read as `[]`.
- "Envie à deux" = `likedBy` contains a uid different from `createdBy`.
- Heart shown only on places with status `todo`:
  - place added by the other → tappable heart (outline / filled), toggles my uid in `likedBy`;
  - place I added → small filled read-only heart only when the other wants it too, otherwise nothing.
- List: heart on each row; toggle chip "Envie à deux" next to Tous / À faire / Fait, combinable.
- Detail: heart + label ("Moi aussi" for the other's place not yet shared, "Envie partagée" when shared).
- No push on heart.
- Firestore rules accept `likedBy` (optional, list, max 2 items). User republishes rules in the console.

**"On fait quoi ce soir ?":**
- Dice button in the header (left) of the Liste and Carte tabs → modal `place/random` titled "On fait quoi ce soir ?".
- Filters: category chips (multi-select, none = all) and switch "Seulement nos envies communes".
- Pool = places with status `todo` matching filters.
- "Tirer au sort" → card (category, name, address, "Ajouté par X", heart if shared) with "Un autre" (never the same place twice in a row when the pool has ≥ 2) and "Voir le lieu" (opens detail).
- Empty pool → "Aucun lieu ne correspond" + "Élargis les filtres ou ajoute de nouvelles idées."
- Out of scope: proximity, directions button, push.

## Data model (Firestore)

```
users/{uid}    { displayName: string, expoPushToken: string | null }
places/{id}    { name, category, address, lat, lng, googlePlaceId, status, rating, comment,
                 createdBy, createdAt, updatedAt,
                 likedBy: string[] }   // new, optional on docs created before v1.1
```

## File structure (changes)

```
src/theme.ts                              modify: add colors.heart
src/features/auth/AuthProvider.tsx        modify: signOut timeout (F3)
src/features/places/types.ts              modify: Place.likedBy
src/features/places/api.ts                modify: placeExists (F1), likedBy default + setLiked
src/features/places/PlacesProvider.tsx    modify: derived loading (F2)
src/features/places/wishes.ts             create: isLikedBy, isSharedWish
src/features/places/WishHeart.tsx         create: heart toggle / indicator
src/features/places/grouping.ts           modify: sharedOnly filter
src/features/places/PlaceRow.tsx          modify: heart
src/features/places/random.ts             create: randomCandidates, pickRandom
src/components/ToggleChip.tsx             create: selectable chip
src/app/_layout.tsx                       modify: dangerouslySingular (F4), place/random screen
src/app/(tabs)/_layout.tsx                modify: dice header button
src/app/(tabs)/index.tsx                  modify: myUid, "Envie à deux" chip
src/app/place/new.tsx                     modify: cancel before first pick (F5)
src/app/place/[id].tsx                    modify: existence check (F1), heart row
src/app/place/random.tsx                  create: random picker modal (Task 4: mode switch only)
firestore.rules                           modify: likedBy validation
src/features/search/googlePlaces.ts       modify (Task 4): export BASE_URL, buildHeaders
src/features/search/discovery.ts          create (Task 4): Nearby Search discovery
src/features/search/DiscoveryPanel.tsx    create (Task 4): discovery UI
src/features/places/IdeasPanel.tsx        create (Task 4): "Nos idées" UI moved out of random.tsx
src/features/places/pickerStyles.ts       create (Task 4): styles shared by both panels
```

## Design summary — Task 4 "Découverte" mode (approved in chat 2026-09-13)

- The "On fait quoi ce soir ?" modal gets a segmented control "Nos idées" / "Découverte" at the top. "Nos idées" = Task 3 picker unchanged.
- Découverte: category chips (same as Nos idées minus "Autre"; none selected = all), no shared-wish switch. Button "Découvrir" → card: category, name, address, "★ 4,6 · 1 234 avis", link "Voir sur Google Maps", buttons "Un autre" and "Ajouter à nos idées" (creates a `todo` place + partner push; label becomes "Ajout…" then "Ajouté").
- Search: Google Places API (New) Nearby Search, zone = all Paris. Each draw picks a random arrondissement center (radius 1500 m), `rankPreference: POPULARITY`, keeps places with rating ≥ 4.3 and ≥ 150 reviews, excludes places already in the app (same `googlePlaceId`) and places already proposed in this session, picks one at random. Up to 3 arrondissements per draw; none → "Rien trouvé" / "Réessaie ou change de catégorie."
- Category → Google types (verified in Table A): resto `restaurant`; bar `bar`, `wine_bar`, `pub`, `cocktail_bar`; café `cafe`, `coffee_shop`, `tea_house`; activité `amusement_center`, `bowling_alley`, `spa`, `karaoke`, `park`; culture `museum`, `art_gallery`, `performing_arts_theater`, `movie_theater`, `concert_hall`, `opera_house`.
- Out of scope: open-now filter, photos, GPS.

---

### Task 1: Final-review fixes (F1–F5)

**Files:**
- Modify: `src/features/places/api.ts`, `src/features/places/PlacesProvider.tsx`, `src/features/auth/AuthProvider.tsx`, `src/app/_layout.tsx`, `src/app/place/new.tsx`, `src/app/place/[id].tsx`
- Also stage: `tsconfig.json` (already reformatted in the working tree by the Expo CLI during the user's native build; commit it as-is, do not edit it)

**Interfaces:**
- Consumes: existing v1 code (read each file before editing)
- Produces:
  - `placeExists(id: string): Promise<boolean>` in `@/features/places/api`
  - `usePlaces()` keeps its shape `{ places: Place[]; loading: boolean; error: Error | null }` with derived `loading`
  - `/place/[id]` full file below (Task 2 replaces it again)

- [ ] **Step 1: Add `placeExists` to `src/features/places/api.ts`**

Add `getDoc` to the existing `firebase/firestore` import list (keep alphabetical order) and append:

```ts
export async function placeExists(id: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, 'places', id));
  return snapshot.exists();
}
```

- [ ] **Step 2: Replace `src/features/places/PlacesProvider.tsx`**

```tsx
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

export function PlacesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [snapshot, setSnapshot] = useState<PlacesSnapshot>({ uid: null, places: [], error: null });

  useEffect(() => {
    if (!uid) return;
    return subscribePlaces(
      (places) => setSnapshot({ uid, places, error: null }),
      (error) =>
        setSnapshot((previous) => ({ uid, places: previous.uid === uid ? previous.places : [], error })),
    );
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
```

- [ ] **Step 3: Replace `signOut` in `src/features/auth/AuthProvider.tsx`**

Add the constant above `signOut` and replace the function (imports unchanged):

```tsx
const TOKEN_CLEAR_TIMEOUT_MS = 3000;

async function signOut(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    const clearToken = setPushToken(uid, null).catch((error: unknown) =>
      console.warn('Clearing push token failed', error),
    );
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, TOKEN_CLEAR_TIMEOUT_MS));
    await Promise.race([clearToken, timeout]);
  }
  await firebaseSignOut(auth);
}
```

- [ ] **Step 4: Make `place/new` singular in `src/app/_layout.tsx`**

Replace the `place/new` screen line with:

```tsx
        <Stack.Screen
          name="place/new"
          dangerouslySingular
          options={{ presentation: 'modal', title: 'Nouveau lieu' }}
        />
```

(`dangerouslySingular` is a `Stack.Screen` prop in the installed expo-router: `node_modules/expo-router/build/layouts/stack-utils/StackScreen.d.ts`.)

- [ ] **Step 5: Cancel before first pick in `src/app/place/new.tsx`**

Replace the `PlaceSearch` return line with:

```tsx
    return <PlaceSearch onSelect={handleSelect} onCancel={values ? () => setSearching(false) : () => router.back()} />;
```

- [ ] **Step 6: Replace `src/app/place/[id].tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { deletePlace, placeExists, updatePlace } from '@/features/places/api';
import { PlaceForm } from '@/features/places/PlaceForm';
import { usePlace, usePlaces } from '@/features/places/PlacesProvider';
import type { Place, PlaceInput } from '@/features/places/types';
import type { PlaceDetails } from '@/features/search/googlePlaces';
import { PlaceSearch } from '@/features/search/PlaceSearch';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, spacing } from '@/theme';

type LookupState = 'checking' | 'missing' | 'error';

function toInput(place: Place, markDone: boolean): PlaceInput {
  return {
    name: place.name,
    category: place.category,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    googlePlaceId: place.googlePlaceId,
    status: markDone ? 'done' : place.status,
    rating: place.rating,
    comment: place.comment,
  };
}

export default function PlaceDetailScreen() {
  const { id, done } = useLocalSearchParams<{ id: string; done?: string }>();
  const place = usePlace(id);
  const { loading } = usePlaces();
  const { usersById } = useUsers();
  const [edited, setEdited] = useState<PlaceInput | null>(null);
  const [searching, setSearching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lookup, setLookup] = useState<LookupState>('checking');
  const found = place !== undefined;

  useEffect(() => {
    setLookup('checking');
    if (found || loading || deleting) return;
    let cancelled = false;
    placeExists(id)
      .then((exists) => {
        if (!cancelled && !exists) setLookup('missing');
      })
      .catch(() => {
        if (!cancelled) setLookup('error');
      });
    return () => {
      cancelled = true;
    };
  }, [found, loading, deleting, id]);

  if (deleting) {
    return <CenteredMessage loading text="Suppression…" />;
  }

  if (!place) {
    if (lookup === 'missing') {
      return <CenteredMessage text="Ce lieu n’existe plus" />;
    }
    if (lookup === 'error') {
      return <CenteredMessage text="Impossible de charger ce lieu" />;
    }
    return <CenteredMessage loading text="Chargement…" />;
  }

  const placeId = place.id;
  const values = edited ?? toInput(place, done === '1');

  function handleLocationSelect(details: PlaceDetails) {
    setEdited({
      ...values,
      address: details.address,
      lat: details.lat,
      lng: details.lng,
      googlePlaceId: details.googlePlaceId,
    });
    setSearching(false);
  }

  async function handleSubmit(input: PlaceInput) {
    await updatePlace(placeId, input);
    router.back();
  }

  function confirmDelete() {
    Alert.alert('Supprimer ce lieu ?', `${values.name} sera supprimé pour vous deux.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deletePlace(placeId);
            router.back();
          } catch {
            setDeleting(false);
            Alert.alert('Oups', 'Suppression impossible, réessaie.');
          }
        },
      },
    ]);
  }

  if (searching) {
    return <PlaceSearch onSelect={handleLocationSelect} onCancel={() => setSearching(false)} />;
  }

  const author = usersById[place.createdBy]?.displayName;
  const createdOn = place.createdAt.toDate().toLocaleDateString('fr-FR');

  return (
    <>
      <Stack.Screen options={{ title: place.name }} />
      <PlaceForm
        values={values}
        onChange={(patch) => setEdited({ ...values, ...patch })}
        onChangeLocation={() => setSearching(true)}
        onSubmit={handleSubmit}
        submitLabel="Enregistrer"
        footer={
          <View style={styles.footer}>
            <Text style={styles.meta}>{author ? `Ajouté par ${author} le ${createdOn}` : `Ajouté le ${createdOn}`}</Text>
            <Pressable style={styles.deleteButton} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteText}>Supprimer</Text>
            </Pressable>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed. If tsc rejects `dangerouslySingular` as a JSX prop, move it into `options` only if the installed `StackScreen.d.ts` / native-stack options type declares it there; otherwise report DONE_WITH_CONCERNS.

- [ ] **Step 8: Commit**

```bash
git add src/features/places/api.ts src/features/places/PlacesProvider.tsx src/features/auth/AuthProvider.tsx src/app/_layout.tsx src/app/place/new.tsx "src/app/place/[id].tsx" tsconfig.json
git status
git commit -m "$(cat <<'EOF'
fix: address v1 final review findings

- detail screen checks existence before saying a place is gone
- places provider reports loading on first render after login
- logout no longer hangs offline
- single new-place modal on double tap
- cancel button on new-place search

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

`git status` after commit: `firestore.rules` must still be modified and unstaged.

---

### Task 2: "Moi aussi" — shared wishes

**Files:**
- Create: `src/features/places/wishes.ts`, `src/features/places/WishHeart.tsx`, `src/components/ToggleChip.tsx`
- Modify: `src/theme.ts`, `src/features/places/types.ts`, `src/features/places/api.ts`, `src/features/places/grouping.ts`, `src/features/places/PlaceRow.tsx`, `src/app/(tabs)/index.tsx`, `src/app/place/[id].tsx`, `firestore.rules`

**Interfaces:**
- Consumes: Task 1 `[id].tsx` and `api.ts`; `useAuth()` (`user: User | null`), `useUsers()` (`usersById`), `SegmentedControl`, `CenteredMessage`, `Fab`
- Produces:
  - `colors.heart` (`'#E11D48'`)
  - `Place.likedBy: string[]`
  - `setLiked(id: string, liked: boolean): Promise<void>` in `@/features/places/api`
  - `isLikedBy(place: Place, uid: string): boolean`, `isSharedWish(place: Place): boolean` in `@/features/places/wishes`
  - `WishHeart({ place: Place; myUid: string; size?: number })` in `@/features/places/WishHeart`
  - `ToggleChip({ label: string; icon: IoniconName; selected: boolean; onPress: () => void; selectedColor?: string })` in `@/components/ToggleChip`
  - `groupPlacesByCategory(places: readonly Place[], filter: StatusFilter, sharedOnly: boolean): PlaceSection[]`
  - `PlaceRow` gains required prop `myUid: string`

- [ ] **Step 1: Add heart color to `src/theme.ts`**

Add `heart: '#E11D48',` to `colors` right after `star: '#F59E0B',`.

- [ ] **Step 2: Add `likedBy` to `Place` in `src/features/places/types.ts`**

Add `likedBy: string[];` to the `Place` type right after `comment: string | null;`. `PlaceInput` stays unchanged (its `Pick` list does not include `likedBy`).

- [ ] **Step 3: Update `src/features/places/api.ts`**

1. Add `arrayRemove` and `arrayUnion` to the `firebase/firestore` import list (alphabetical).
2. In `createPlace`, add `likedBy: [],` to the written object right after `createdBy: uid,`.
3. Replace the mapping inside `subscribePlaces` so old docs get `likedBy: []`:

```ts
      onData(
        snapshot.docs.map((document) => {
          const data = document.data({ serverTimestamps: 'estimate' }) as Omit<Place, 'id'>;
          return { ...data, id: document.id, likedBy: Array.isArray(data.likedBy) ? data.likedBy : [] };
        }),
      );
```

4. Append:

```ts
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
```

- [ ] **Step 4: Create `src/features/places/wishes.ts`**

```ts
import type { Place } from '@/features/places/types';

export function isLikedBy(place: Place, uid: string): boolean {
  return place.likedBy.includes(uid);
}

export function isSharedWish(place: Place): boolean {
  return place.likedBy.some((uid) => uid !== place.createdBy);
}
```

- [ ] **Step 5: Create `src/features/places/WishHeart.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, View } from 'react-native';

import { setLiked } from '@/features/places/api';
import type { Place } from '@/features/places/types';
import { isLikedBy, isSharedWish } from '@/features/places/wishes';
import { colors } from '@/theme';

type Props = {
  place: Place;
  myUid: string;
  size?: number;
};

export function WishHeart({ place, myUid, size = 20 }: Props) {
  if (place.status !== 'todo') {
    return null;
  }

  if (place.createdBy === myUid) {
    if (!isSharedWish(place)) {
      return null;
    }
    return (
      <View accessibilityLabel="Envie partagée">
        <Ionicons name="heart" size={size} color={colors.heart} />
      </View>
    );
  }

  const liked = isLikedBy(place, myUid);

  function toggle() {
    setLiked(place.id, !liked).catch(() => Alert.alert('Oups', 'Impossible de mettre à jour, réessaie.'));
  }

  return (
    <Pressable onPress={toggle} hitSlop={8} accessibilityLabel={liked ? 'Retirer mon envie' : 'Moi aussi'}>
      <Ionicons name={liked ? 'heart' : 'heart-outline'} size={size} color={colors.heart} />
    </Pressable>
  );
}
```

- [ ] **Step 6: Create `src/components/ToggleChip.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
  selectedColor?: string;
};

export function ToggleChip({ label, icon, selected, onPress, selectedColor = colors.primary }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && { backgroundColor: selectedColor, borderColor: selectedColor }]}
    >
      <Ionicons name={icon} size={16} color={selected ? colors.surface : colors.text} />
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.text,
    fontWeight: '500',
  },
  labelSelected: {
    color: colors.surface,
  },
});
```

- [ ] **Step 7: Replace `src/features/places/grouping.ts`**

```ts
import { CATEGORIES, type CategoryDef } from '@/features/places/categories';
import type { Place, PlaceStatus } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';

export type StatusFilter = 'all' | PlaceStatus;

export type PlaceSection = {
  category: CategoryDef;
  data: Place[];
};

export function groupPlacesByCategory(
  places: readonly Place[],
  filter: StatusFilter,
  sharedOnly: boolean,
): PlaceSection[] {
  const visible = places.filter(
    (place) => (filter === 'all' || place.status === filter) && (!sharedOnly || isSharedWish(place)),
  );
  return CATEGORIES.map((category) => ({
    category,
    data: visible
      .filter((place) => place.category === category.key)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  })).filter((section) => section.data.length > 0);
}
```

- [ ] **Step 8: Replace `src/features/places/PlaceRow.tsx`**

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { StatusBadge } from '@/components/StatusBadge';
import type { Place } from '@/features/places/types';
import { WishHeart } from '@/features/places/WishHeart';
import { colors, radius, spacing } from '@/theme';

type Props = {
  place: Place;
  myUid: string;
  addedBy: string | undefined;
  onPress: () => void;
  onPressStatus: () => void;
};

export function PlaceRow({ place, myUid, addedBy, onPress, onPressStatus }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {addedBy ? `Ajouté par ${addedBy}` : place.address}
        </Text>
      </View>
      <WishHeart place={place} myUid={myUid} />
      <View style={styles.side}>
        <StatusBadge status={place.status} onPress={onPressStatus} />
        {place.status === 'done' && place.rating !== null ? <RatingStars value={place.rating} size={12} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  side: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});
```

- [ ] **Step 9: Replace `src/app/(tabs)/index.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { Fab } from '@/components/Fab';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ToggleChip } from '@/components/ToggleChip';
import { useAuth } from '@/features/auth/AuthProvider';
import { groupPlacesByCategory, type PlaceSection, type StatusFilter } from '@/features/places/grouping';
import { PlaceRow } from '@/features/places/PlaceRow';
import { usePlaces } from '@/features/places/PlacesProvider';
import type { Place } from '@/features/places/types';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, spacing } from '@/theme';

const FILTER_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'todo', label: 'À faire' },
  { value: 'done', label: 'Fait' },
];

function openPlace(id: string, markDone: boolean) {
  router.push({ pathname: '/place/[id]', params: markDone ? { id, done: '1' } : { id } });
}

export default function PlacesListScreen() {
  const { user } = useAuth();
  const { places, loading, error } = usePlaces();
  const { usersById } = useUsers();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sharedOnly, setSharedOnly] = useState(false);
  const sections = useMemo(
    () => groupPlacesByCategory(places, filter, sharedOnly),
    [places, filter, sharedOnly],
  );

  if (!user) {
    return null;
  }

  const myUid = user.uid;

  function renderContent() {
    if (loading) {
      return <CenteredMessage loading text="Chargement…" />;
    }
    if (error) {
      return <CenteredMessage text="Impossible de charger les lieux" />;
    }
    if (sections.length === 0) {
      if (sharedOnly) {
        return <CenteredMessage text="Pas encore d’envie commune ici" />;
      }
      return (
        <CenteredMessage
          text={filter === 'all' ? 'Aucun lieu pour l’instant. Ajoute le premier !' : 'Aucun lieu ici'}
        />
      );
    }
    return (
      <SectionList<Place, PlaceSection>
        sections={sections}
        keyExtractor={(place) => place.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Ionicons name={section.category.icon} size={16} color={colors.textMuted} />
            <Text style={styles.sectionTitle}>{section.category.label}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <PlaceRow
            place={item}
            myUid={myUid}
            addedBy={usersById[item.createdBy]?.displayName}
            onPress={() => openPlace(item.id, false)}
            onPressStatus={() => openPlace(item.id, item.status === 'todo')}
          />
        )}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filter}>
        <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        <View style={styles.chipRow}>
          <ToggleChip
            label="Envie à deux"
            icon="heart"
            selected={sharedOnly}
            onPress={() => setSharedOnly((value) => !value)}
            selectedColor={colors.heart}
          />
        </View>
      </View>
      {renderContent()}
      <Fab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filter: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 96,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
```

- [ ] **Step 10: Add the heart row to `src/app/place/[id].tsx`**

Starting from the Task 1 version of the file:

1. Add imports:

```tsx
import { useAuth } from '@/features/auth/AuthProvider';
import { WishHeart } from '@/features/places/WishHeart';
import { isSharedWish } from '@/features/places/wishes';
```

2. Add `const { user } = useAuth();` as the first line of `PlaceDetailScreen` (above `useLocalSearchParams`).

3. Right after `const createdOn = ...`, add:

```tsx
  const wishLabel =
    place.status !== 'todo' || !user
      ? null
      : isSharedWish(place)
        ? 'Envie partagée'
        : place.createdBy === user.uid
          ? null
          : 'Moi aussi';
```

4. In the `footer` `View`, insert as its first child:

```tsx
            {wishLabel && user ? (
              <View style={styles.wishRow}>
                <WishHeart place={place} myUid={user.uid} size={24} />
                <Text style={styles.wishText}>{wishLabel}</Text>
              </View>
            ) : null}
```

5. Add to `styles`:

```tsx
  wishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wishText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
```

- [ ] **Step 11: Update `firestore.rules`**

The working tree already contains the user's real UIDs on the `isMember()` line — keep that line exactly as it is. Make only these two edits inside `isValidPlace(data)`:

1. Add `'likedBy'` to the `hasOnly([...])` list, so the list ends with `'createdBy', 'createdAt', 'updatedAt', 'likedBy'`.
2. Add this condition right after the `data.comment` line:

```
        && (!('likedBy' in data) || (data.likedBy is list && data.likedBy.size() <= 2))
```

- [ ] **Step 12: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed.

- [ ] **Step 13: Commit**

```bash
git add src/theme.ts src/features/places/types.ts src/features/places/api.ts src/features/places/wishes.ts src/features/places/WishHeart.tsx src/components/ToggleChip.tsx src/features/places/grouping.ts src/features/places/PlaceRow.tsx "src/app/(tabs)/index.tsx" "src/app/place/[id].tsx" firestore.rules
git status
git commit -m "$(cat <<'EOF'
feat: moi aussi hearts and shared wish filter

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 3: "On fait quoi ce soir ?" random picker

**Files:**
- Create: `src/features/places/random.ts`, `src/app/place/random.tsx`
- Modify: `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `usePlaces`, `useUsers`, `CATEGORIES`, `CATEGORY_BY_KEY`, `CategoryKey`, `Place`, `isSharedWish` (Task 2), `ToggleChip` (Task 2), `colors.heart` (Task 2), theme tokens
- Produces:
  - `RandomFilters = { categories: readonly CategoryKey[]; sharedOnly: boolean }`, `randomCandidates(places: readonly Place[], filters: RandomFilters): Place[]`, `pickRandom(candidates: readonly Place[], excludeId: string | null): Place | null` in `@/features/places/random`
  - route `/place/random` (modal, singular)

- [ ] **Step 1: Create `src/features/places/random.ts`**

```ts
import type { CategoryKey, Place } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';

export type RandomFilters = {
  categories: readonly CategoryKey[];
  sharedOnly: boolean;
};

export function randomCandidates(places: readonly Place[], filters: RandomFilters): Place[] {
  return places.filter(
    (place) =>
      place.status === 'todo' &&
      (filters.categories.length === 0 || filters.categories.includes(place.category)) &&
      (!filters.sharedOnly || isSharedWish(place)),
  );
}

export function pickRandom(candidates: readonly Place[], excludeId: string | null): Place | null {
  const pool = candidates.length > 1 ? candidates.filter((place) => place.id !== excludeId) : candidates;
  if (pool.length === 0) {
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
```

- [ ] **Step 2: Create `src/app/place/random.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ToggleChip } from '@/components/ToggleChip';
import { CATEGORIES, CATEGORY_BY_KEY } from '@/features/places/categories';
import { usePlaces } from '@/features/places/PlacesProvider';
import { pickRandom, randomCandidates } from '@/features/places/random';
import type { CategoryKey } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, radius, spacing } from '@/theme';

export default function RandomPlaceScreen() {
  const { places, loading } = usePlaces();
  const { usersById } = useUsers();
  const [categories, setCategories] = useState<CategoryKey[]>([]);
  const [sharedOnly, setSharedOnly] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const candidates = useMemo(
    () => randomCandidates(places, { categories, sharedOnly }),
    [places, categories, sharedOnly],
  );
  const picked = candidates.find((place) => place.id === pickedId) ?? null;

  function draw() {
    setPickedId(pickRandom(candidates, pickedId)?.id ?? null);
  }

  function toggleCategory(key: CategoryKey) {
    setCategories((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  function renderResult() {
    if (loading) {
      return <ActivityIndicator style={styles.loader} color={colors.textMuted} />;
    }
    if (candidates.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucun lieu ne correspond</Text>
          <Text style={styles.emptyText}>Élargis les filtres ou ajoute de nouvelles idées.</Text>
        </View>
      );
    }
    if (!picked) {
      return (
        <Pressable style={({ pressed }) => [styles.button, styles.drawButton, pressed && styles.pressed]} onPress={draw}>
          <Ionicons name="dice-outline" size={22} color={colors.surface} />
          <Text style={styles.buttonText}>Tirer au sort</Text>
        </Pressable>
      );
    }

    const category = CATEGORY_BY_KEY[picked.category];
    const author = usersById[picked.createdBy]?.displayName;
    const selectedId = picked.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name={category.icon} size={18} color={colors.textMuted} />
          <Text style={styles.cardCategory}>{category.label}</Text>
          {isSharedWish(picked) ? <Ionicons name="heart" size={16} color={colors.heart} /> : null}
        </View>
        <Text style={styles.cardName}>{picked.name}</Text>
        <Text style={styles.cardAddress}>{picked.address}</Text>
        {author ? <Text style={styles.cardMeta}>Ajouté par {author}</Text> : null}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              candidates.length < 2 && styles.disabled,
              pressed && styles.pressed,
            ]}
            onPress={draw}
            disabled={candidates.length < 2}
          >
            <Text style={styles.secondaryButtonText}>Un autre</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: selectedId } })}
          >
            <Text style={styles.buttonText}>Voir le lieu</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Catégories</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((category) => (
          <ToggleChip
            key={category.key}
            label={category.label}
            icon={category.icon}
            selected={categories.includes(category.key)}
            onPress={() => toggleCategory(category.key)}
          />
        ))}
      </View>
      <Text style={styles.hint}>Aucune sélection = toutes les catégories</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Seulement nos envies communes</Text>
        <Switch
          value={sharedOnly}
          onValueChange={setSharedOnly}
          trackColor={{ false: colors.border, true: colors.heart }}
        />
      </View>

      {renderResult()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  switchLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  loader: {
    marginTop: spacing.xl * 2,
  },
  empty: {
    marginTop: spacing.xl * 2,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardCategory: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  cardAddress: {
    fontSize: 15,
    color: colors.textMuted,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  drawButton: {
    marginTop: spacing.xl,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
});
```

- [ ] **Step 3: Register the modal in `src/app/_layout.tsx`**

Inside the logged-in `Stack.Protected`, after the `place/[id]` screen, add:

```tsx
        <Stack.Screen
          name="place/random"
          dangerouslySingular
          options={{ presentation: 'modal', title: 'On fait quoi ce soir ?' }}
        />
```

- [ ] **Step 4: Add the dice header button in `src/app/(tabs)/_layout.tsx`**

1. Change the expo-router import to `import { router, Tabs } from 'expo-router';`.
2. Add to `screenOptions`, right before `headerRight`:

```tsx
        headerLeft: () => (
          <Pressable
            onPress={() => router.push('/place/random')}
            hitSlop={8}
            style={{ marginLeft: spacing.lg }}
            accessibilityLabel="On fait quoi ce soir ?"
          >
            <Ionicons name="dice-outline" size={22} color={colors.text} />
          </Pressable>
        ),
```

If `dice-outline` is not in the installed Ionicons glyph map, use `shuffle` in both files and report it.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/features/places/random.ts src/app/place/random.tsx src/app/_layout.tsx "src/app/(tabs)/_layout.tsx"
git status
git commit -m "$(cat <<'EOF'
feat: random tonight picker with category and shared wish filters

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 4: "Découverte" mode — well-rated Paris places from Google

**Files:**
- Modify: `src/features/search/googlePlaces.ts` (export two existing symbols)
- Create: `src/features/search/discovery.ts`, `src/features/places/pickerStyles.ts`, `src/features/places/IdeasPanel.tsx`, `src/features/search/DiscoveryPanel.tsx`
- Modify (full replace): `src/app/place/random.tsx`

**Interfaces:**
- Consumes: `buildHeaders(fieldMask?: string): Record<string, string>` and `BASE_URL` from `@/features/search/googlePlaces` (existing, made exported here); `createPlace(input: PlaceInput): Promise<string>`; `notifyPartner(place: Pick<Place, 'id' | 'name' | 'category'>, users: readonly AppUser[], myUid: string): Promise<void>`; `suggestCategory(primaryType, types)`; `CATEGORIES`, `CATEGORY_BY_KEY`; `useAuth`, `usePlaces`, `useUsers`; `pickRandom`, `randomCandidates`, `isSharedWish`, `ToggleChip`, `SegmentedControl`; theme tokens
- Produces:
  - `@/features/search/discovery`: `DiscoveryCategory = Exclude<CategoryKey, 'autre'>`, `DISCOVERY_CATEGORY_KEYS: readonly DiscoveryCategory[]`, `DiscoveredPlace`, `discoverPlace(categories: readonly DiscoveryCategory[], excludedIds: ReadonlySet<string>): Promise<DiscoveredPlace | null>`, `discoveredCategory(place: DiscoveredPlace): CategoryKey`
  - `pickerStyles` (StyleSheet) from `@/features/places/pickerStyles`
  - `IdeasPanel()` from `@/features/places/IdeasPanel`, `DiscoveryPanel()` from `@/features/search/DiscoveryPanel`

- [ ] **Step 1: Export helpers in `src/features/search/googlePlaces.ts`**

Change `const BASE_URL = ...` to `export const BASE_URL = ...` and `function buildHeaders(` to `export function buildHeaders(`. Nothing else changes.

- [ ] **Step 2: Create `src/features/search/discovery.ts`**

```ts
import { suggestCategory } from '@/features/places/categories';
import type { CategoryKey } from '@/features/places/types';
import { BASE_URL, buildHeaders } from '@/features/search/googlePlaces';

export type DiscoveryCategory = Exclude<CategoryKey, 'autre'>;

export type DiscoveredPlace = {
  googlePlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  userRatingCount: number;
  googleMapsUri: string | null;
  primaryType: string | null;
  types: string[];
};

type LatLng = { latitude: number; longitude: number };

type NearbyResponse = {
  places?: {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    location?: LatLng;
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    primaryType?: string;
    types?: string[];
  }[];
};

export const DISCOVERY_CATEGORY_KEYS: readonly DiscoveryCategory[] = ['resto', 'bar', 'cafe', 'activite', 'culture'];

const DISCOVERY_TYPES: Record<DiscoveryCategory, readonly string[]> = {
  resto: ['restaurant'],
  bar: ['bar', 'wine_bar', 'pub', 'cocktail_bar'],
  cafe: ['cafe', 'coffee_shop', 'tea_house'],
  activite: ['amusement_center', 'bowling_alley', 'spa', 'karaoke', 'park'],
  culture: ['museum', 'art_gallery', 'performing_arts_theater', 'movie_theater', 'concert_hall', 'opera_house'],
};

const ARRONDISSEMENT_CENTERS: readonly LatLng[] = [
  { latitude: 48.8625, longitude: 2.3364 },
  { latitude: 48.8683, longitude: 2.3428 },
  { latitude: 48.863, longitude: 2.3601 },
  { latitude: 48.8543, longitude: 2.3576 },
  { latitude: 48.8445, longitude: 2.3497 },
  { latitude: 48.8491, longitude: 2.3326 },
  { latitude: 48.8562, longitude: 2.3121 },
  { latitude: 48.8727, longitude: 2.3125 },
  { latitude: 48.877, longitude: 2.3375 },
  { latitude: 48.8761, longitude: 2.3607 },
  { latitude: 48.8591, longitude: 2.3799 },
  { latitude: 48.8409, longitude: 2.3876 },
  { latitude: 48.8283, longitude: 2.3622 },
  { latitude: 48.8292, longitude: 2.3266 },
  { latitude: 48.8401, longitude: 2.2931 },
  { latitude: 48.8637, longitude: 2.2769 },
  { latitude: 48.8873, longitude: 2.3067 },
  { latitude: 48.8925, longitude: 2.3484 },
  { latitude: 48.8871, longitude: 2.3847 },
  { latitude: 48.8634, longitude: 2.4011 },
];

const SEARCH_RADIUS_METERS = 1500;
const MIN_RATING = 4.3;
const MIN_RATING_COUNT = 150;
const MAX_ATTEMPTS = 3;
const NEARBY_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.primaryType',
  'places.types',
].join(',');

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function typesFor(categories: readonly DiscoveryCategory[]): string[] {
  const selected = categories.length > 0 ? categories : DISCOVERY_CATEGORY_KEYS;
  return [...new Set(selected.flatMap((category) => DISCOVERY_TYPES[category]))];
}

async function searchNearby(center: LatLng, includedTypes: readonly string[]): Promise<DiscoveredPlace[]> {
  const response = await fetch(`${BASE_URL}/places:searchNearby`, {
    method: 'POST',
    headers: buildHeaders(NEARBY_FIELD_MASK),
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      rankPreference: 'POPULARITY',
      languageCode: 'fr',
      regionCode: 'fr',
      locationRestriction: { circle: { center, radius: SEARCH_RADIUS_METERS } },
    }),
  });
  if (!response.ok) {
    throw new Error(`Places nearby search failed: ${response.status}`);
  }
  const json = (await response.json()) as NearbyResponse;
  return (json.places ?? []).flatMap((place) => {
    if (!place.location || place.rating === undefined || place.userRatingCount === undefined) {
      return [];
    }
    return [
      {
        googlePlaceId: place.id,
        name: place.displayName?.text ?? '',
        address: place.formattedAddress ?? '',
        lat: place.location.latitude,
        lng: place.location.longitude,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        googleMapsUri: place.googleMapsUri ?? null,
        primaryType: place.primaryType ?? null,
        types: place.types ?? [],
      },
    ];
  });
}

export async function discoverPlace(
  categories: readonly DiscoveryCategory[],
  excludedIds: ReadonlySet<string>,
): Promise<DiscoveredPlace | null> {
  const includedTypes = typesFor(categories);
  for (const center of shuffled(ARRONDISSEMENT_CENTERS).slice(0, MAX_ATTEMPTS)) {
    const candidates = (await searchNearby(center, includedTypes)).filter(
      (place) =>
        place.rating >= MIN_RATING &&
        place.userRatingCount >= MIN_RATING_COUNT &&
        !excludedIds.has(place.googlePlaceId),
    );
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }
  return null;
}

export function discoveredCategory(place: DiscoveredPlace): CategoryKey {
  const candidates = place.primaryType ? [place.primaryType, ...place.types] : place.types;
  for (const type of candidates) {
    const match = DISCOVERY_CATEGORY_KEYS.find((key) => DISCOVERY_TYPES[key].includes(type));
    if (match) {
      return match;
    }
  }
  return suggestCategory(place.primaryType, place.types);
}
```

- [ ] **Step 3: Create `src/features/places/pickerStyles.ts`**

```ts
import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme';

export const pickerStyles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  loader: {
    marginTop: spacing.xl * 2,
  },
  empty: {
    marginTop: spacing.xl * 2,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardCategory: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  cardAddress: {
    fontSize: 15,
    color: colors.textMuted,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  drawButton: {
    marginTop: spacing.xl,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
});
```

- [ ] **Step 4: Create `src/features/places/IdeasPanel.tsx`** (Task 3 picker moved out of the route, same behavior)

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ToggleChip } from '@/components/ToggleChip';
import { CATEGORIES, CATEGORY_BY_KEY } from '@/features/places/categories';
import { pickerStyles } from '@/features/places/pickerStyles';
import { usePlaces } from '@/features/places/PlacesProvider';
import { pickRandom, randomCandidates } from '@/features/places/random';
import type { CategoryKey } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, radius, spacing } from '@/theme';

export function IdeasPanel() {
  const { places, loading } = usePlaces();
  const { usersById } = useUsers();
  const [categories, setCategories] = useState<CategoryKey[]>([]);
  const [sharedOnly, setSharedOnly] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const candidates = useMemo(
    () => randomCandidates(places, { categories, sharedOnly }),
    [places, categories, sharedOnly],
  );
  const picked = candidates.find((place) => place.id === pickedId) ?? null;

  function draw() {
    setPickedId(pickRandom(candidates, pickedId)?.id ?? null);
  }

  function toggleCategory(key: CategoryKey) {
    setCategories((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  function renderResult() {
    if (loading) {
      return <ActivityIndicator style={pickerStyles.loader} color={colors.textMuted} />;
    }
    if (candidates.length === 0) {
      return (
        <View style={pickerStyles.empty}>
          <Text style={pickerStyles.emptyTitle}>Aucun lieu ne correspond</Text>
          <Text style={pickerStyles.emptyText}>Élargis les filtres ou ajoute de nouvelles idées.</Text>
        </View>
      );
    }
    if (!picked) {
      return (
        <Pressable
          style={({ pressed }) => [pickerStyles.button, pickerStyles.drawButton, pressed && pickerStyles.pressed]}
          onPress={draw}
        >
          <Ionicons name="dice-outline" size={22} color={colors.surface} />
          <Text style={pickerStyles.buttonText}>Tirer au sort</Text>
        </Pressable>
      );
    }

    const category = CATEGORY_BY_KEY[picked.category];
    const author = usersById[picked.createdBy]?.displayName;
    const selectedId = picked.id;

    return (
      <View style={pickerStyles.card}>
        <View style={pickerStyles.cardHeader}>
          <Ionicons name={category.icon} size={18} color={colors.textMuted} />
          <Text style={pickerStyles.cardCategory}>{category.label}</Text>
          {isSharedWish(picked) ? <Ionicons name="heart" size={16} color={colors.heart} /> : null}
        </View>
        <Text style={pickerStyles.cardName}>{picked.name}</Text>
        <Text style={pickerStyles.cardAddress}>{picked.address}</Text>
        {author ? <Text style={pickerStyles.cardMeta}>Ajouté par {author}</Text> : null}
        <View style={pickerStyles.actions}>
          <Pressable
            style={({ pressed }) => [
              pickerStyles.button,
              pickerStyles.secondaryButton,
              candidates.length < 2 && pickerStyles.disabled,
              pressed && pickerStyles.pressed,
            ]}
            onPress={draw}
            disabled={candidates.length < 2}
          >
            <Text style={pickerStyles.secondaryButtonText}>Un autre</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [pickerStyles.button, pressed && pickerStyles.pressed]}
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: selectedId } })}
          >
            <Text style={pickerStyles.buttonText}>Voir le lieu</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={pickerStyles.label}>Catégories</Text>
      <View style={pickerStyles.chips}>
        {CATEGORIES.map((category) => (
          <ToggleChip
            key={category.key}
            label={category.label}
            icon={category.icon}
            selected={categories.includes(category.key)}
            onPress={() => toggleCategory(category.key)}
          />
        ))}
      </View>
      <Text style={pickerStyles.hint}>Aucune sélection = toutes les catégories</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Seulement nos envies communes</Text>
        <Switch
          value={sharedOnly}
          onValueChange={setSharedOnly}
          trackColor={{ false: colors.border, true: colors.heart }}
        />
      </View>

      {renderResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  switchLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
});
```

- [ ] **Step 5: Create `src/features/search/DiscoveryPanel.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ToggleChip } from '@/components/ToggleChip';
import { useAuth } from '@/features/auth/AuthProvider';
import { createPlace } from '@/features/places/api';
import { CATEGORY_BY_KEY } from '@/features/places/categories';
import { pickerStyles } from '@/features/places/pickerStyles';
import { usePlaces } from '@/features/places/PlacesProvider';
import type { PlaceInput } from '@/features/places/types';
import { notifyPartner } from '@/features/push/notifyPartner';
import {
  DISCOVERY_CATEGORY_KEYS,
  type DiscoveredPlace,
  type DiscoveryCategory,
  discoveredCategory,
  discoverPlace,
} from '@/features/search/discovery';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, spacing } from '@/theme';

type AddState = 'idle' | 'adding' | 'added';

const ADD_LABELS: Record<AddState, string> = {
  idle: 'Ajouter à nos idées',
  adding: 'Ajout…',
  added: 'Ajouté',
};

function formatRating(place: DiscoveredPlace): string {
  const rating = place.rating.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `★ ${rating} · ${place.userRatingCount.toLocaleString('fr-FR')} avis`;
}

function openInGoogleMaps(uri: string) {
  Linking.openURL(uri).catch(() => Alert.alert('Oups', 'Impossible d’ouvrir Google Maps.'));
}

export function DiscoveryPanel() {
  const { user } = useAuth();
  const { places } = usePlaces();
  const { users } = useUsers();
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [result, setResult] = useState<DiscoveredPlace | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [addState, setAddState] = useState<AddState>('idle');
  const proposedIds = useRef(new Set<string>());

  const knownIds = useMemo(
    () => new Set(places.flatMap((place) => (place.googlePlaceId ? [place.googlePlaceId] : []))),
    [places],
  );

  function toggleCategory(key: DiscoveryCategory) {
    setCategories((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  async function discover() {
    setSearching(true);
    setNotFound(false);
    try {
      const found = await discoverPlace(categories, new Set([...knownIds, ...proposedIds.current]));
      if (found) {
        proposedIds.current.add(found.googlePlaceId);
        setAddState('idle');
      }
      setResult(found);
      setNotFound(found === null);
    } catch {
      Alert.alert('Oups', 'Recherche indisponible, réessaie.');
    } finally {
      setSearching(false);
    }
  }

  async function addToIdeas(place: DiscoveredPlace) {
    if (!user) return;
    setAddState('adding');
    const input: PlaceInput = {
      name: place.name,
      category: discoveredCategory(place),
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      googlePlaceId: place.googlePlaceId,
      status: 'todo',
      rating: null,
      comment: null,
    };
    try {
      const id = await createPlace(input);
      void notifyPartner({ id, name: input.name, category: input.category }, users, user.uid);
      setAddState('added');
    } catch {
      setAddState('idle');
      Alert.alert('Oups', 'Ajout impossible, réessaie.');
    }
  }

  function renderResult() {
    if (searching && !result) {
      return <ActivityIndicator style={pickerStyles.loader} color={colors.textMuted} />;
    }
    if (!result) {
      return (
        <>
          {notFound ? (
            <View style={pickerStyles.empty}>
              <Text style={pickerStyles.emptyTitle}>Rien trouvé</Text>
              <Text style={pickerStyles.emptyText}>Réessaie ou change de catégorie.</Text>
            </View>
          ) : null}
          <Pressable
            style={({ pressed }) => [pickerStyles.button, pickerStyles.drawButton, pressed && pickerStyles.pressed]}
            onPress={discover}
          >
            <Ionicons name="sparkles-outline" size={22} color={colors.surface} />
            <Text style={pickerStyles.buttonText}>Découvrir</Text>
          </Pressable>
        </>
      );
    }

    const category = CATEGORY_BY_KEY[discoveredCategory(result)];
    const mapsUri = result.googleMapsUri;
    const current = result;

    return (
      <View style={pickerStyles.card}>
        <View style={pickerStyles.cardHeader}>
          <Ionicons name={category.icon} size={18} color={colors.textMuted} />
          <Text style={pickerStyles.cardCategory}>{category.label}</Text>
        </View>
        <Text style={pickerStyles.cardName}>{result.name}</Text>
        <Text style={pickerStyles.cardAddress}>{result.address}</Text>
        <Text style={pickerStyles.cardMeta}>{formatRating(result)}</Text>
        {mapsUri ? (
          <Pressable onPress={() => openInGoogleMaps(mapsUri)} hitSlop={8}>
            <Text style={styles.link}>Voir sur Google Maps</Text>
          </Pressable>
        ) : null}
        <View style={pickerStyles.actions}>
          <Pressable
            style={({ pressed }) => [
              pickerStyles.button,
              pickerStyles.secondaryButton,
              searching && pickerStyles.disabled,
              pressed && pickerStyles.pressed,
            ]}
            onPress={discover}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={pickerStyles.secondaryButtonText}>Un autre</Text>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              pickerStyles.button,
              addState !== 'idle' && pickerStyles.disabled,
              pressed && pickerStyles.pressed,
            ]}
            onPress={() => addToIdeas(current)}
            disabled={addState !== 'idle'}
          >
            <Text style={pickerStyles.buttonText}>{ADD_LABELS[addState]}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={pickerStyles.label}>Catégories</Text>
      <View style={pickerStyles.chips}>
        {DISCOVERY_CATEGORY_KEYS.map((key) => (
          <ToggleChip
            key={key}
            label={CATEGORY_BY_KEY[key].label}
            icon={CATEGORY_BY_KEY[key].icon}
            selected={categories.includes(key)}
            onPress={() => toggleCategory(key)}
          />
        ))}
      </View>
      <Text style={pickerStyles.hint}>Aucune sélection = toutes les catégories · lieux bien notés dans Paris</Text>

      {renderResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
```

- [ ] **Step 6: Replace `src/app/place/random.tsx`**

```tsx
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SegmentedControl } from '@/components/SegmentedControl';
import { IdeasPanel } from '@/features/places/IdeasPanel';
import { DiscoveryPanel } from '@/features/search/DiscoveryPanel';
import { colors, spacing } from '@/theme';

type Mode = 'ideas' | 'discovery';

const MODE_OPTIONS: readonly { value: Mode; label: string }[] = [
  { value: 'ideas', label: 'Nos idées' },
  { value: 'discovery', label: 'Découverte' },
];

export default function RandomPlaceScreen() {
  const [mode, setMode] = useState<Mode>('ideas');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.mode}>
        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={setMode} />
      </View>
      {mode === 'ideas' ? <IdeasPanel /> : <DiscoveryPanel />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  mode: {
    marginBottom: spacing.xl,
  },
});
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed. If `sparkles-outline` is not in the installed Ionicons glyph map, use `search` and report it. Do not call the Google API.

- [ ] **Step 8: Commit**

```bash
git add src/features/search/googlePlaces.ts src/features/search/discovery.ts src/features/places/pickerStyles.ts src/features/places/IdeasPanel.tsx src/features/search/DiscoveryPanel.tsx src/app/place/random.tsx
git status
git commit -m "$(cat <<'EOF'
feat: discovery mode suggesting well-rated Paris places

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

## Manual steps (user)

1. After Task 2: Firestore console → Rules → paste the committed `firestore.rules` → Publish (required before hearts can be saved).
2. Reload the app (shake → Reload, or `r` in the Metro terminal). No native rebuild needed.
3. Test on two phones: A adds a place → B taps the heart → A sees the filled heart; "Envie à deux" filter; dice button → filters → "Tirer au sort" → "Un autre" → "Voir le lieu".
