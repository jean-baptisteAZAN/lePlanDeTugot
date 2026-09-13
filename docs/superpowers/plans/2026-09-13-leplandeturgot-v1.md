# Le Plan de Turgot v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** iOS app for exactly 2 users (a couple, one of whom is in Paris one week per month) to log Paris places to do / already done, see them as a categorized list and on a map, and get a push when the other adds a place.

**Architecture:** Expo SDK 57 app with expo-router (file routes under `src/app`). Firebase JS SDK for Auth (email/password, 2 manually created accounts) and Firestore (real-time `places` + `users` collections, security via rules allowlisting the 2 UIDs). Google Places API (New) over REST for place search. `react-native-maps` (Apple Maps) for the map. `expo-notifications` + Expo Push API called directly from the client for pushes (no server).

**Tech Stack:** Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6 (strict), expo-router, firebase ≥12, @react-native-async-storage/async-storage, react-native-maps, expo-notifications, expo-device, expo-constants, expo-crypto, @expo/vector-icons (Ionicons).

**Spec:** No spec file — design approved in chat on 2026-09-13. Decisions are summarized in "Design summary" below; that section is the spec.

## Global Constraints

- Platform: iOS only. No Android/web work.
- Install dependencies ONLY with `npx expo install <pkg>` (picks SDK 57-compatible versions). Never `npm install <pkg>` for runtime deps.
- AGENTS.md: "Expo HAS CHANGED" — for any Expo API not spelled out in this plan, read https://docs.expo.dev/versions/v57.0.0/ before writing code.
- No automated tests of any kind (user decision). Do not add jest, testing-library, or emulator tooling.
- Verification for every task: `npx tsc --noEmit` passes AND `npx expo export --platform ios --output-dir .expo/export-check` succeeds.
- Routes live in `src/app/`. Everything else in `src/`. Import alias `@/*` → `src/*`.
- All UI copy in French. Code identifiers in English.
- Default to no code comments; one short line only when the why is non-obvious.
- Env vars: `EXPO_PUBLIC_*` in `.env.local` (already gitignored via `.env*.local`), always read with static `process.env.EXPO_PUBLIC_X` access.
- Firestore collection and field names are exactly as in "Data model" below.
- iOS bundle identifier: `com.jbazan.leplandeturgot`.
- No emojis in code or UI copy.

## Design summary

**Auth:** login screen (email + password), no sign-up, no password reset. Session persisted. Logout button in tab header with confirmation.

**Categories (fixed enum):** `resto` Resto, `bar` Bar, `cafe` Café, `activite` Activité, `culture` Culture, `autre` Autre.

**Place:** name, category, address, lat/lng, googlePlaceId, status `todo` | `done`, rating 1–5 (place rating only, required when done, null when todo), optional comment, createdBy, createdAt, updatedAt. Both users can create/edit/delete every place.

**List tab:** SectionList grouped by category (fixed order above), filter Tous / À faire / Fait, row shows name, "Ajouté par X", status badge, stars. Tap row → detail/edit. Tap a "À faire" badge → detail with status pre-set to done.

**Map tab:** Apple Maps centered on Paris, one pin per place, pin color by status, callout with name + stars; tap callout → detail. No categories on the map.

**Floating (+) button** on both tabs → create modal: search Google Places → pick → form prefilled (name, address, coords, suggested category) → save.

**Detail modal:** same form prefilled, change address via search, save, delete with confirmation, "Ajouté par X le JJ/MM/AAAA".

**Push:** after login ask permission, store Expo push token on `users/{uid}`; clear it on logout. After a successful create, client sends Expo push to the other user: title "Nouveau lieu", body "{displayName} a ajouté {name} ({category label})", data `{ placeId }`. Push failure never blocks creation. Tapping the notification opens the place detail.

**Distribution:** TestFlight only (internal testers), never released on the App Store.

## Data model (Firestore)

```
users/{uid}    { displayName: string, expoPushToken: string | null }      // created manually in console
places/{id}    { name: string, category: CategoryKey, address: string, lat: number, lng: number,
                 googlePlaceId: string | null, status: 'todo' | 'done', rating: 1..5 | null,
                 comment: string | null, createdBy: string, createdAt: Timestamp, updatedAt: Timestamp }
```

## File structure

```
app.json                                  modify: scheme, bundleIdentifier, plugins
package.json                              modify: main = expo-router/entry, typecheck script
tsconfig.json                             modify: @/* paths
.env.example                              create: env var names
firestore.rules                           create: security rules (pasted into console by user)
App.tsx, index.ts                         delete
src/theme.ts                              colors / spacing / radius tokens
src/lib/env.ts                            typed required env vars
src/lib/firebase.ts                       firebase app, auth (RN persistence), db
src/features/auth/AuthProvider.tsx        AuthProvider, useAuth
src/features/users/api.ts                 AppUser, subscribeUsers, setPushToken
src/features/users/UsersProvider.tsx      UsersProvider, useUsers
src/features/places/types.ts              CategoryKey, PlaceStatus, Rating, Place, PlaceInput
src/features/places/categories.ts         CATEGORY_BY_KEY, CATEGORIES, suggestCategory
src/features/places/api.ts                createPlace, updatePlace, deletePlace, subscribePlaces
src/features/places/PlacesProvider.tsx    PlacesProvider, usePlaces, usePlace
src/features/places/grouping.ts           StatusFilter, PlaceSection, groupPlacesByCategory
src/features/places/validation.ts         normalizePlaceInput, validatePlaceInput
src/features/places/PlaceRow.tsx          list row
src/features/places/PlaceForm.tsx         controlled create/edit form
src/features/search/googlePlaces.ts       Places API (New) REST client
src/features/search/usePlaceSearch.ts     debounced autocomplete hook
src/features/search/PlaceSearch.tsx       search input + suggestions list
src/features/push/register.ts             notification handler + registerForPushToken
src/features/push/usePushSetup.ts         token sync + notification tap routing
src/features/push/notifyPartner.ts        send Expo push to the other user
src/components/Fab.tsx                    floating (+) button
src/components/RatingStars.tsx            display / input stars
src/components/StatusBadge.tsx            À faire / Fait pill
src/components/SegmentedControl.tsx       generic segmented control
src/components/CenteredMessage.tsx        loading / empty / error message
src/app/_layout.tsx                       providers + protected Stack
src/app/login.tsx                         login screen
src/app/(tabs)/_layout.tsx                Liste / Carte tabs + logout
src/app/(tabs)/index.tsx                  list screen
src/app/(tabs)/map.tsx                    map screen
src/app/place/new.tsx                     create modal
src/app/place/[id].tsx                    detail / edit / delete modal
```

---

### Task 1: Scaffold expo-router, dependencies, config, theme, env

**Files:**
- Delete: `App.tsx`, `index.ts`
- Modify: `package.json`, `app.json`, `tsconfig.json`
- Create: `.env.example`, `src/lib/env.ts`, `src/theme.ts`, `src/app/_layout.tsx`, `src/app/index.tsx` (temporary, removed in Task 2)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `env` from `@/lib/env`: `{ firebase: { apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string }; googlePlacesApiKey: string }`
  - `colors`, `spacing`, `radius` from `@/theme` (keys listed in code below)

- [ ] **Step 1: Install dependencies**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar firebase @react-native-async-storage/async-storage react-native-maps expo-notifications expo-device expo-dev-client expo-crypto @expo/vector-icons
```

Expected: completes without peer-dependency errors. Check `package.json` shows `firebase` at `^12.x` or higher.

- [ ] **Step 2: Update `package.json` entry and scripts**

Set `"main"` to `"expo-router/entry"` and add a `typecheck` script. Resulting top of file (keep the dependency lists that `expo install` wrote):

```json
{
  "name": "leplandeturgot",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "typecheck": "tsc --noEmit"
  },
  "private": true
}
```

(Remove the `android` and `web` scripts — iOS only. `ios` now runs a dev build, not Expo Go.)

- [ ] **Step 3: Replace `app.json`**

`expo install` may have already added some plugins; the final file must be exactly:

```json
{
  "expo": {
    "name": "lePlanDeTurgot",
    "slug": "lePlanDeTurgot",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "leplandeturgot",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.jbazan.leplandeturgot",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "plugins": ["expo-router", "expo-notifications"]
  }
}
```

If `expo install` added other plugin entries (e.g. `expo-dev-client`), keep them in the `plugins` array.

- [ ] **Step 4: Replace `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "expo-env.d.ts"]
}
```

- [ ] **Step 5: Delete the blank-template entry files**

```bash
git rm App.tsx index.ts
```

- [ ] **Step 6: Create `src/theme.ts`**

```ts
export const colors = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  text: '#1F1B16',
  textMuted: '#7A7068',
  border: '#E8E1D8',
  primary: '#C2410C',
  todo: '#2563EB',
  todoSoft: '#DBEAFE',
  done: '#15803D',
  doneSoft: '#DCFCE7',
  danger: '#B91C1C',
  star: '#F59E0B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
} as const;
```

- [ ] **Step 7: Create `src/lib/env.ts`**

```ts
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

export const env = {
  firebase: {
    apiKey: required('EXPO_PUBLIC_FIREBASE_API_KEY', process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
    authDomain: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: required('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: required(
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    ),
    appId: required('EXPO_PUBLIC_FIREBASE_APP_ID', process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
  },
  googlePlacesApiKey: required('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY', process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY),
};
```

- [ ] **Step 8: Create `.env.example`**

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=
```

- [ ] **Step 9: Create temporary root layout and index route**

`src/app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
```

`src/app/index.tsx`:

```tsx
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Le Plan de Turgot</Text>
    </View>
  );
}
```

- [ ] **Step 10: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: tsc prints nothing and exits 0; export ends with an "Exported" summary and no resolution errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
chore: scaffold expo-router app with deps, theme and env

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

Check `git status` output before committing: no `.env.local`, no `ios/`, no `.expo/`.

---

### Task 2: Firebase init, auth provider, login, protected navigation

**Files:**
- Create: `src/lib/firebase.ts`, `src/features/auth/AuthProvider.tsx`, `src/app/login.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx` (temporary shell, replaced in Task 4)
- Modify: `src/app/_layout.tsx` (full replace)
- Delete: `src/app/index.tsx`

**Interfaces:**
- Consumes: `env` (`@/lib/env`), `colors`, `spacing`, `radius` (`@/theme`)
- Produces:
  - `firebaseApp`, `auth: Auth`, `db: Firestore` from `@/lib/firebase`
  - `AuthProvider` component and `useAuth(): { user: User | null; initializing: boolean; signIn(email: string, password: string): Promise<void>; signOut(): Promise<void> }` from `@/features/auth/AuthProvider`
  - Root `Stack` declares screens `login`, `(tabs)`, `place/new` (modal), `place/[id]` (modal). The `place/*` routes are created in Tasks 5–6; until then expo-router logs a dev warning, which is expected.

- [ ] **Step 1: Create `src/lib/firebase.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { env } from '@/lib/env';

// Fast refresh re-evaluates this module; initializeAuth throws if called twice.
const isFirstInit = getApps().length === 0;

export const firebaseApp = isFirstInit ? initializeApp(env.firebase) : getApp();

export const auth: Auth = isFirstInit
  ? initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);
```

If `npx tsc --noEmit` later reports `Module '"firebase/auth"' has no exported member 'getReactNativePersistence'`, change only the auth import line to:

```ts
import { type Auth, getAuth, getReactNativePersistence, initializeAuth } from '@firebase/auth';
```

(`@firebase/auth` is installed transitively by `firebase` and exposes React Native typings through the `react-native` export condition that `expo/tsconfig.base` enables.)

- [ ] **Step 2: Create `src/features/auth/AuthProvider.tsx`**

```tsx
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';

type AuthState = {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setInitializing(false);
      }),
    [],
  );

  return <AuthContext value={{ user, initializing, signIn, signOut }}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
```

- [ ] **Step 3: Create `src/app/login.tsx`**

```tsx
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/AuthProvider';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch {
      setError('Email ou mot de passe incorrect');
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <Text style={styles.title}>Le Plan de Turgot</Text>
        <Text style={styles.subtitle}>Nos lieux à Paris</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
```

- [ ] **Step 4: Create temporary tabs shell**

`src/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return <Tabs />;
}
```

`src/app/(tabs)/index.tsx`:

```tsx
import { Button, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';

export default function HomeShell() {
  const { user, signOut } = useAuth();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text>Connecté : {user?.email}</Text>
      <Button title="Se déconnecter" onPress={signOut} />
    </View>
  );
}
```

- [ ] **Step 5: Delete temporary index route and replace root layout**

```bash
git rm src/app/index.tsx
```

`src/app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { CenteredMessage } from '@/components/CenteredMessage';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <CenteredMessage loading text="" />;
  }

  const loggedIn = user !== null;

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!loggedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={loggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="place/new" options={{ presentation: 'modal', title: 'Nouveau lieu' }} />
        <Stack.Screen name="place/[id]" options={{ presentation: 'modal', title: 'Lieu' }} />
      </Stack.Protected>
    </Stack>
  );
}
```

- [ ] **Step 6: Create `src/components/CenteredMessage.tsx`** (used by root layout now, by screens later)

```tsx
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

type Props = {
  text: string;
  loading?: boolean;
};

export function CenteredMessage({ text, loading = false }: Props) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={colors.textMuted} /> : null}
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
});
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed. If tsc fails on `getReactNativePersistence`, apply the fallback import from Step 1 and re-run.

- [ ] **Step 8: Commit**

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
feat: firebase auth with login screen and protected routes

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 3: Places + users data layer and Firestore rules

**Files:**
- Create: `src/features/places/types.ts`, `src/features/places/categories.ts`, `src/features/places/api.ts`, `src/features/places/PlacesProvider.tsx`, `src/features/users/api.ts`, `src/features/users/UsersProvider.tsx`, `firestore.rules`
- Modify: `src/app/_layout.tsx` (wrap providers)

**Interfaces:**
- Consumes: `auth`, `db` (`@/lib/firebase`), `useAuth` (`@/features/auth/AuthProvider`)
- Produces:
  - `@/features/places/types`: `CategoryKey = 'resto' | 'bar' | 'cafe' | 'activite' | 'culture' | 'autre'`, `PlaceStatus = 'todo' | 'done'`, `Rating = 1 | 2 | 3 | 4 | 5`, `Place`, `PlaceInput`
  - `@/features/places/categories`: `CategoryDef = { key: CategoryKey; label: string; icon: IoniconName }`, `CATEGORY_BY_KEY: Record<CategoryKey, CategoryDef>`, `CATEGORIES: readonly CategoryDef[]`, `suggestCategory(primaryType: string | null, types: readonly string[]): CategoryKey`
  - `@/features/places/api`: `createPlace(input: PlaceInput): Promise<string>`, `updatePlace(id: string, input: PlaceInput): Promise<void>`, `deletePlace(id: string): Promise<void>`, `subscribePlaces(onData: (places: Place[]) => void, onError: (error: Error) => void): Unsubscribe`
  - `@/features/places/PlacesProvider`: `PlacesProvider`, `usePlaces(): { places: Place[]; loading: boolean; error: Error | null }`, `usePlace(id: string | undefined): Place | undefined`
  - `@/features/users/api`: `AppUser = { id: string; displayName: string; expoPushToken: string | null }`, `subscribeUsers(onData: (users: AppUser[]) => void, onError: (error: Error) => void): Unsubscribe`, `setPushToken(uid: string, token: string | null): Promise<void>`
  - `@/features/users/UsersProvider`: `UsersProvider`, `useUsers(): { users: AppUser[]; usersById: Record<string, AppUser> }`

- [ ] **Step 1: Create `src/features/places/types.ts`**

```ts
import type { Timestamp } from 'firebase/firestore';

export type CategoryKey = 'resto' | 'bar' | 'cafe' | 'activite' | 'culture' | 'autre';

export type PlaceStatus = 'todo' | 'done';

export type Rating = 1 | 2 | 3 | 4 | 5;

export type Place = {
  id: string;
  name: string;
  category: CategoryKey;
  address: string;
  lat: number;
  lng: number;
  googlePlaceId: string | null;
  status: PlaceStatus;
  rating: Rating | null;
  comment: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type PlaceInput = Pick<
  Place,
  'name' | 'category' | 'address' | 'lat' | 'lng' | 'googlePlaceId' | 'status' | 'rating' | 'comment'
>;
```

- [ ] **Step 2: Create `src/features/places/categories.ts`**

```ts
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { CategoryKey } from '@/features/places/types';

export type CategoryDef = {
  key: CategoryKey;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const CATEGORY_BY_KEY: Record<CategoryKey, CategoryDef> = {
  resto: { key: 'resto', label: 'Resto', icon: 'restaurant-outline' },
  bar: { key: 'bar', label: 'Bar', icon: 'wine-outline' },
  cafe: { key: 'cafe', label: 'Café', icon: 'cafe-outline' },
  activite: { key: 'activite', label: 'Activité', icon: 'bicycle-outline' },
  culture: { key: 'culture', label: 'Culture', icon: 'color-palette-outline' },
  autre: { key: 'autre', label: 'Autre', icon: 'ellipsis-horizontal-circle-outline' },
};

export const CATEGORIES: readonly CategoryDef[] = Object.values(CATEGORY_BY_KEY);

const BAR_TYPES = new Set(['bar', 'pub', 'wine_bar', 'cocktail_bar', 'night_club', 'bar_and_grill']);
const CAFE_TYPES = new Set(['cafe', 'coffee_shop', 'bakery', 'tea_house', 'cat_cafe']);
const CULTURE_TYPES = new Set([
  'museum',
  'art_gallery',
  'movie_theater',
  'performing_arts_theater',
  'cultural_center',
  'historical_landmark',
  'library',
  'concert_hall',
  'opera_house',
]);
const ACTIVITE_TYPES = new Set([
  'park',
  'amusement_park',
  'bowling_alley',
  'spa',
  'tourist_attraction',
  'zoo',
  'aquarium',
  'gym',
  'escape_room',
  'karaoke',
]);

function categoryForType(type: string): CategoryKey | null {
  if (BAR_TYPES.has(type)) return 'bar';
  if (CAFE_TYPES.has(type)) return 'cafe';
  if (type === 'restaurant' || type.endsWith('_restaurant')) return 'resto';
  if (CULTURE_TYPES.has(type)) return 'culture';
  if (ACTIVITE_TYPES.has(type)) return 'activite';
  return null;
}

export function suggestCategory(primaryType: string | null, types: readonly string[]): CategoryKey {
  const candidates = primaryType ? [primaryType, ...types] : types;
  for (const type of candidates) {
    const category = categoryForType(type);
    if (category) return category;
  }
  return 'autre';
}
```

- [ ] **Step 3: Create `src/features/places/api.ts`**

```ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

export async function createPlace(input: PlaceInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Not authenticated');
  }
  const ref = await addDoc(placesCollection, {
    ...input,
    createdBy: uid,
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

export function subscribePlaces(
  onData: (places: Place[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(placesCollection, orderBy('createdAt', 'desc')),
    (snapshot) => {
      onData(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data({ serverTimestamps: 'estimate' }) as Omit<Place, 'id'>),
        })),
      );
    },
    onError,
  );
}
```

- [ ] **Step 4: Create `src/features/places/PlacesProvider.tsx`**

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
```

- [ ] **Step 5: Create `src/features/users/api.ts`**

```ts
import { collection, doc, onSnapshot, type Unsubscribe, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';

export type AppUser = {
  id: string;
  displayName: string;
  expoPushToken: string | null;
};

export function subscribeUsers(
  onData: (users: AppUser[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      onData(
        snapshot.docs.map((document) => {
          const data = document.data();
          return {
            id: document.id,
            displayName: typeof data.displayName === 'string' ? data.displayName : 'Inconnu',
            expoPushToken: typeof data.expoPushToken === 'string' ? data.expoPushToken : null,
          };
        }),
      );
    },
    onError,
  );
}

export async function setPushToken(uid: string, token: string | null): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { expoPushToken: token });
}
```

- [ ] **Step 6: Create `src/features/users/UsersProvider.tsx`**

```tsx
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { type AppUser, subscribeUsers } from '@/features/users/api';

type UsersState = {
  users: AppUser[];
  usersById: Record<string, AppUser>;
};

const UsersContext = createContext<UsersState | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (!uid) {
      setUsers([]);
      return;
    }
    return subscribeUsers(setUsers, (error) => console.warn('Users subscription failed', error));
  }, [uid]);

  const value = useMemo<UsersState>(
    () => ({ users, usersById: Object.fromEntries(users.map((appUser) => [appUser.id, appUser])) }),
    [users],
  );

  return <UsersContext value={value}>{children}</UsersContext>;
}

export function useUsers(): UsersState {
  const value = useContext(UsersContext);
  if (!value) {
    throw new Error('useUsers must be used inside UsersProvider');
  }
  return value;
}
```

- [ ] **Step 7: Wrap providers in `src/app/_layout.tsx`**

Replace the `RootLayout` function and add the two imports; `RootNavigator` stays unchanged:

```tsx
import { PlacesProvider } from '@/features/places/PlacesProvider';
import { UsersProvider } from '@/features/users/UsersProvider';
```

```tsx
export default function RootLayout() {
  return (
    <AuthProvider>
      <UsersProvider>
        <PlacesProvider>
          <RootNavigator />
        </PlacesProvider>
      </UsersProvider>
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
```

- [ ] **Step 8: Create `firestore.rules`**

The user replaces `UID_USER_1` / `UID_USER_2` with the real Auth UIDs before publishing (see Manual setup).

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isMember() {
      return request.auth != null
        && request.auth.uid in ['UID_USER_1', 'UID_USER_2'];
    }

    function isValidPlace(data) {
      return data.keys().hasOnly([
          'name', 'category', 'address', 'lat', 'lng', 'googlePlaceId',
          'status', 'rating', 'comment', 'createdBy', 'createdAt', 'updatedAt'
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
        && data.createdBy is string
        && data.updatedAt == request.time;
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

- [ ] **Step 9: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed.

- [ ] **Step 10: Commit**

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
feat: firestore data layer for places and users with security rules

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 4: Tabs layout, shared components, list screen

**Files:**
- Create: `src/components/Fab.tsx`, `src/components/RatingStars.tsx`, `src/components/StatusBadge.tsx`, `src/components/SegmentedControl.tsx`, `src/features/places/grouping.ts`, `src/features/places/PlaceRow.tsx`, `src/app/(tabs)/map.tsx` (temporary, replaced in Task 7)
- Modify (full replace): `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `usePlaces` (`@/features/places/PlacesProvider`), `useUsers` (`@/features/users/UsersProvider`), `useAuth`, `CATEGORIES`, `CategoryDef`, `Place`, `PlaceStatus`, `Rating`, `CenteredMessage`, theme tokens
- Produces:
  - `Fab()` — absolute-positioned (+) button, pushes `/place/new`
  - `RatingStars({ value: Rating | null; onChange?: (value: Rating) => void; size?: number })`
  - `StatusBadge({ status: PlaceStatus; onPress?: () => void })`
  - `SegmentedControl<T extends string>({ options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void })`
  - `@/features/places/grouping`: `StatusFilter = 'all' | PlaceStatus`, `PlaceSection = { category: CategoryDef; data: Place[] }`, `groupPlacesByCategory(places: readonly Place[], filter: StatusFilter): PlaceSection[]`
  - `PlaceRow({ place: Place; addedBy: string | undefined; onPress: () => void; onPressStatus: () => void })`
  - Navigation to detail: `router.push({ pathname: '/place/[id]', params: { id } })`, with `done: '1'` param to pre-set status to done

- [ ] **Step 1: Create `src/components/Fab.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { colors, spacing } from '@/theme';

export function Fab() {
  return (
    <Pressable
      accessibilityLabel="Ajouter un lieu"
      onPress={() => router.push('/place/new')}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Ionicons name="add" size={30} color={colors.surface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
```

- [ ] **Step 2: Create `src/components/RatingStars.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Rating } from '@/features/places/types';
import { colors } from '@/theme';

const VALUES: readonly Rating[] = [1, 2, 3, 4, 5];

type Props = {
  value: Rating | null;
  onChange?: (value: Rating) => void;
  size?: number;
};

export function RatingStars({ value, onChange, size = 16 }: Props) {
  return (
    <View style={styles.row}>
      {VALUES.map((star) => {
        const icon = (
          <Ionicons
            name={value !== null && star <= value ? 'star' : 'star-outline'}
            size={size}
            color={colors.star}
          />
        );
        if (!onChange) {
          return <View key={star}>{icon}</View>;
        }
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={6}
            accessibilityLabel={`${star} étoile${star > 1 ? 's' : ''}`}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
});
```

- [ ] **Step 3: Create `src/components/StatusBadge.tsx`**

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlaceStatus } from '@/features/places/types';
import { colors, radius, spacing } from '@/theme';

type Props = {
  status: PlaceStatus;
  onPress?: () => void;
};

export function StatusBadge({ status, onPress }: Props) {
  const done = status === 'done';
  const badge = (
    <View style={[styles.badge, { backgroundColor: done ? colors.doneSoft : colors.todoSoft }]}>
      <Text style={[styles.text, { color: done ? colors.done : colors.todo }]}>{done ? 'Fait' : 'À faire'}</Text>
    </View>
  );
  if (!onPress) {
    return badge;
  }
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {badge}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
```

- [ ] **Step 4: Create `src/components/SegmentedControl.tsx`**

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    padding: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm - 2,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  labelSelected: {
    color: colors.text,
    fontWeight: '600',
  },
});
```

- [ ] **Step 5: Create `src/features/places/grouping.ts`**

```ts
import { CATEGORIES, type CategoryDef } from '@/features/places/categories';
import type { Place, PlaceStatus } from '@/features/places/types';

export type StatusFilter = 'all' | PlaceStatus;

export type PlaceSection = {
  category: CategoryDef;
  data: Place[];
};

export function groupPlacesByCategory(places: readonly Place[], filter: StatusFilter): PlaceSection[] {
  const visible = filter === 'all' ? places : places.filter((place) => place.status === filter);
  return CATEGORIES.map((category) => ({
    category,
    data: visible
      .filter((place) => place.category === category.key)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  })).filter((section) => section.data.length > 0);
}
```

- [ ] **Step 6: Create `src/features/places/PlaceRow.tsx`**

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { StatusBadge } from '@/components/StatusBadge';
import type { Place } from '@/features/places/types';
import { colors, radius, spacing } from '@/theme';

type Props = {
  place: Place;
  addedBy: string | undefined;
  onPress: () => void;
  onPressStatus: () => void;
};

export function PlaceRow({ place, addedBy, onPress, onPressStatus }: Props) {
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

- [ ] **Step 7: Replace `src/app/(tabs)/_layout.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Alert, Pressable } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { colors, spacing } from '@/theme';

export default function TabsLayout() {
  const { signOut } = useAuth();

  function confirmSignOut() {
    Alert.alert('Déconnexion', 'Tu veux te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerRight: () => (
          <Pressable
            onPress={confirmSignOut}
            hitSlop={8}
            style={{ marginRight: spacing.lg }}
            accessibilityLabel="Se déconnecter"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.text} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Liste',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Carte',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 8: Replace `src/app/(tabs)/index.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { Fab } from '@/components/Fab';
import { SegmentedControl } from '@/components/SegmentedControl';
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
  const { places, loading, error } = usePlaces();
  const { usersById } = useUsers();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const sections = useMemo(() => groupPlacesByCategory(places, filter), [places, filter]);

  function renderContent() {
    if (loading) {
      return <CenteredMessage loading text="Chargement…" />;
    }
    if (error) {
      return <CenteredMessage text="Impossible de charger les lieux" />;
    }
    if (sections.length === 0) {
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
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

- [ ] **Step 9: Create temporary `src/app/(tabs)/map.tsx`**

```tsx
import { View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { Fab } from '@/components/Fab';

export default function MapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <CenteredMessage text="Carte bientôt disponible" />
      <Fab />
    </View>
  );
}
```

- [ ] **Step 10: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed. If tsc rejects `headerStyle` or `headerRight` on `Tabs` `screenOptions`, check https://docs.expo.dev/router/advanced/tabs/ for the SDK 57 option names and adjust only those keys.

- [ ] **Step 11: Commit**

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
feat: tabs with categorized places list and floating add button

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 5: Google Places search, place form, create screen

**Files:**
- Create: `src/features/search/googlePlaces.ts`, `src/features/search/usePlaceSearch.ts`, `src/features/search/PlaceSearch.tsx`, `src/features/places/validation.ts`, `src/features/places/PlaceForm.tsx`, `src/app/place/new.tsx`

**Interfaces:**
- Consumes: `env.googlePlacesApiKey`, `createPlace`, `suggestCategory`, `CATEGORIES`, `PlaceInput`, `Rating`, `PlaceStatus`, `RatingStars`, `SegmentedControl`, theme tokens
- Produces:
  - `@/features/search/googlePlaces`: `PlaceSuggestion = { placeId: string; mainText: string; secondaryText: string }`, `PlaceDetails = { googlePlaceId: string; name: string; address: string; lat: number; lng: number; primaryType: string | null; types: string[] }`, `newSessionToken(): string`, `autocomplete(input: string, sessionToken: string, signal?: AbortSignal): Promise<PlaceSuggestion[]>`, `getPlaceDetails(placeId: string, sessionToken: string): Promise<PlaceDetails>`
  - `usePlaceSearch(): { query: string; setQuery: (q: string) => void; suggestions: PlaceSuggestion[]; loading: boolean; error: string | null; select: (placeId: string) => Promise<PlaceDetails> }`
  - `PlaceSearch({ onSelect: (details: PlaceDetails) => void; onCancel?: () => void })`
  - `@/features/places/validation`: `normalizePlaceInput(input: PlaceInput): PlaceInput`, `validatePlaceInput(input: PlaceInput): string | null`
  - `PlaceForm({ values: PlaceInput; onChange: (patch: Partial<PlaceInput>) => void; onChangeLocation: () => void; onSubmit: (input: PlaceInput) => Promise<void>; submitLabel: string; footer?: ReactNode })` — normalizes + validates, then calls `onSubmit` with the normalized input; shows an Alert on validation or submit failure
  - `src/app/place/new.tsx` default export `NewPlaceScreen` with a `handleSubmit(input: PlaceInput)` function (Task 8 edits it)

- [ ] **Step 1: Create `src/features/search/googlePlaces.ts`**

```ts
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';

import { env } from '@/lib/env';

const BASE_URL = 'https://places.googleapis.com/v1';
const PARIS_CENTER = { latitude: 48.8566, longitude: 2.3522 };
const DETAILS_FIELD_MASK = 'id,displayName,formattedAddress,location,types,primaryType';

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

export function newSessionToken(): string {
  return Crypto.randomUUID();
}

function buildHeaders(fieldMask?: string): Record<string, string> {
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

export async function autocomplete(
  input: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const response = await fetch(`${BASE_URL}/places:autocomplete`, {
    method: 'POST',
    signal,
    headers: buildHeaders(),
    body: JSON.stringify({
      input,
      sessionToken,
      languageCode: 'fr',
      includedRegionCodes: ['fr'],
      locationBias: { circle: { center: PARIS_CENTER, radius: 15000 } },
    }),
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

export async function getPlaceDetails(placeId: string, sessionToken: string): Promise<PlaceDetails> {
  const url =
    `${BASE_URL}/places/${encodeURIComponent(placeId)}` +
    `?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=fr`;
  const response = await fetch(url, { headers: buildHeaders(DETAILS_FIELD_MASK) });
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
```

- [ ] **Step 2: Create `src/features/search/usePlaceSearch.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  autocomplete,
  getPlaceDetails,
  newSessionToken,
  type PlaceDetails,
  type PlaceSuggestion,
} from '@/features/search/googlePlaces';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function usePlaceSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionToken = useRef(newSessionToken());

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
      autocomplete(input, sessionToken.current, controller.signal)
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

  const select = useCallback(async (placeId: string): Promise<PlaceDetails> => {
    const details = await getPlaceDetails(placeId, sessionToken.current);
    sessionToken.current = newSessionToken();
    return details;
  }, []);

  return { query, setQuery, suggestions, loading, error, select };
}
```

- [ ] **Step 3: Create `src/features/search/PlaceSearch.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { PlaceDetails, PlaceSuggestion } from '@/features/search/googlePlaces';
import { usePlaceSearch } from '@/features/search/usePlaceSearch';
import { colors, radius, spacing } from '@/theme';

type Props = {
  onSelect: (details: PlaceDetails) => void;
  onCancel?: () => void;
};

export function PlaceSearch({ onSelect, onCancel }: Props) {
  const { query, setQuery, suggestions, loading, error, select } = usePlaceSearch();
  const [selectingId, setSelectingId] = useState<string | null>(null);

  async function handlePress(suggestion: PlaceSuggestion) {
    setSelectingId(suggestion.placeId);
    try {
      onSelect(await select(suggestion.placeId));
    } catch {
      Alert.alert('Oups', 'Impossible de récupérer ce lieu, réessaie.');
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.inputRow}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            autoFocus
            placeholder="Nom ou adresse (ex : Le Comptoir)"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {loading ? <ActivityIndicator size="small" color={colors.textMuted} /> : null}
        </View>
        {onCancel ? (
          <Pressable onPress={onCancel} hitSlop={8}>
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
            {selectingId === item.placeId ? <ActivityIndicator size="small" color={colors.textMuted} /> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  cancel: {
    color: colors.primary,
    fontSize: 16,
  },
  error: {
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.6,
  },
  suggestionText: {
    flex: 1,
    gap: 2,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  secondaryText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
```

- [ ] **Step 4: Create `src/features/places/validation.ts`**

```ts
import type { PlaceInput } from '@/features/places/types';

export function normalizePlaceInput(input: PlaceInput): PlaceInput {
  const comment = input.comment?.trim() ?? '';
  return {
    ...input,
    name: input.name.trim(),
    comment: comment.length > 0 ? comment : null,
    rating: input.status === 'done' ? input.rating : null,
  };
}

export function validatePlaceInput(input: PlaceInput): string | null {
  if (input.name.length === 0) return 'Le nom est obligatoire';
  if (input.name.length > 200) return 'Le nom est trop long';
  if (input.status === 'done' && input.rating === null) return 'Donne une note au lieu';
  if (input.comment !== null && input.comment.length > 2000) return 'Le commentaire est trop long';
  return null;
}
```

- [ ] **Step 5: Create `src/features/places/PlaceForm.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { SegmentedControl } from '@/components/SegmentedControl';
import { CATEGORIES } from '@/features/places/categories';
import type { PlaceInput, PlaceStatus } from '@/features/places/types';
import { normalizePlaceInput, validatePlaceInput } from '@/features/places/validation';
import { colors, radius, spacing } from '@/theme';

const STATUS_OPTIONS: readonly { value: PlaceStatus; label: string }[] = [
  { value: 'todo', label: 'À faire' },
  { value: 'done', label: 'Fait' },
];

type Props = {
  values: PlaceInput;
  onChange: (patch: Partial<PlaceInput>) => void;
  onChangeLocation: () => void;
  onSubmit: (input: PlaceInput) => Promise<void>;
  submitLabel: string;
  footer?: ReactNode;
};

export function PlaceForm({ values, onChange, onChangeLocation, onSubmit, submitLabel, footer }: Props) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const input = normalizePlaceInput(values);
    const problem = validatePlaceInput(input);
    if (problem) {
      Alert.alert('Presque !', problem);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch {
      Alert.alert('Oups', 'Enregistrement impossible, réessaie.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        value={values.name}
        onChangeText={(name) => onChange({ name })}
        placeholder="Nom du lieu"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.label}>Adresse</Text>
      <Pressable style={styles.addressRow} onPress={onChangeLocation}>
        <Ionicons name="location-outline" size={18} color={colors.textMuted} />
        <Text style={styles.address} numberOfLines={2}>
          {values.address}
        </Text>
        <Text style={styles.link}>Changer</Text>
      </Pressable>

      <Text style={styles.label}>Catégorie</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((category) => {
          const selected = category.key === values.category;
          return (
            <Pressable
              key={category.key}
              onPress={() => onChange({ category: category.key })}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Ionicons name={category.icon} size={16} color={selected ? colors.surface : colors.text} />
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Statut</Text>
      <SegmentedControl options={STATUS_OPTIONS} value={values.status} onChange={(status) => onChange({ status })} />

      {values.status === 'done' ? (
        <>
          <Text style={styles.label}>Note du lieu</Text>
          <RatingStars value={values.rating} onChange={(rating) => onChange({ rating })} size={32} />
        </>
      ) : null}

      <Text style={styles.label}>Commentaire</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={values.comment ?? ''}
        onChangeText={(comment) => onChange({ comment })}
        placeholder="Optionnel"
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <Pressable
        style={[styles.submit, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </Pressable>

      {footer}
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
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  address: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
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
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.surface,
  },
  submit: {
    marginTop: spacing.xl * 1.5,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
```

- [ ] **Step 6: Create `src/app/place/new.tsx`**

```tsx
import { router } from 'expo-router';
import { useState } from 'react';

import { createPlace } from '@/features/places/api';
import { suggestCategory } from '@/features/places/categories';
import { PlaceForm } from '@/features/places/PlaceForm';
import type { PlaceInput } from '@/features/places/types';
import type { PlaceDetails } from '@/features/search/googlePlaces';
import { PlaceSearch } from '@/features/search/PlaceSearch';

export default function NewPlaceScreen() {
  const [values, setValues] = useState<PlaceInput | null>(null);
  const [searching, setSearching] = useState(true);

  function handleSelect(details: PlaceDetails) {
    setValues((previous) => ({
      name: details.name,
      category: suggestCategory(details.primaryType, details.types),
      address: details.address,
      lat: details.lat,
      lng: details.lng,
      googlePlaceId: details.googlePlaceId,
      status: previous?.status ?? 'todo',
      rating: previous?.rating ?? null,
      comment: previous?.comment ?? null,
    }));
    setSearching(false);
  }

  async function handleSubmit(input: PlaceInput) {
    await createPlace(input);
    router.back();
  }

  if (searching || !values) {
    return <PlaceSearch onSelect={handleSelect} onCancel={values ? () => setSearching(false) : undefined} />;
  }

  return (
    <PlaceForm
      values={values}
      onChange={(patch) => setValues({ ...values, ...patch })}
      onChangeLocation={() => setSearching(true)}
      onSubmit={handleSubmit}
      submitLabel="Ajouter"
    />
  );
}
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed.

- [ ] **Step 8: Commit**

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
feat: create place via google places search and form

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 6: Place detail — edit and delete

**Files:**
- Create: `src/app/place/[id].tsx`

**Interfaces:**
- Consumes: `usePlace`, `usePlaces`, `useUsers`, `updatePlace`, `deletePlace`, `PlaceForm`, `PlaceSearch`, `PlaceDetails`, `Place`, `PlaceInput`, `CenteredMessage`, theme tokens
- Produces: route `/place/[id]` accepting params `id: string` and optional `done: '1'` (pre-sets status to `done` when the place is `todo`)

- [ ] **Step 1: Create `src/app/place/[id].tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { deletePlace, updatePlace } from '@/features/places/api';
import { PlaceForm } from '@/features/places/PlaceForm';
import { usePlace, usePlaces } from '@/features/places/PlacesProvider';
import type { Place, PlaceInput } from '@/features/places/types';
import type { PlaceDetails } from '@/features/search/googlePlaces';
import { PlaceSearch } from '@/features/search/PlaceSearch';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, spacing } from '@/theme';

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

  if (deleting) {
    return <CenteredMessage loading text="Suppression…" />;
  }

  if (!place) {
    return <CenteredMessage loading={loading} text={loading ? 'Chargement…' : 'Ce lieu n’existe plus'} />;
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

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
feat: place detail screen with edit and delete

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 7: Map screen

**Files:**
- Modify (full replace): `src/app/(tabs)/map.tsx`

**Interfaces:**
- Consumes: `usePlaces`, `Place`, `Fab`, theme tokens, route `/place/[id]`
- Produces: nothing new

- [ ] **Step 1: Replace `src/app/(tabs)/map.tsx`**

```tsx
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Fab } from '@/components/Fab';
import { usePlaces } from '@/features/places/PlacesProvider';
import type { Place } from '@/features/places/types';
import { colors, radius, spacing } from '@/theme';

const PARIS_REGION = {
  latitude: 48.8566,
  longitude: 2.3422,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

function describe(place: Place): string {
  if (place.status === 'todo') {
    return 'À faire';
  }
  const rating = place.rating ?? 0;
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
}

export default function MapScreen() {
  const { places } = usePlaces();

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={PARIS_REGION}>
        {places.map((place) => (
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
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.todo }]} />
          <Text style={styles.legendText}>À faire</Text>
        </View>
        <View style={styles.legendItem}>
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
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: colors.text,
  },
});
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed. If tsc rejects `onCalloutPress` or `pinColor`, check the installed `react-native-maps` types in `node_modules/react-native-maps` for the Marker prop names and adjust only those props.

- [ ] **Step 3: Commit**

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
feat: map tab with status-colored place pins

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 8: Push notifications

**Files:**
- Create: `src/features/push/register.ts`, `src/features/push/usePushSetup.ts`, `src/features/push/notifyPartner.ts`
- Modify: `src/app/_layout.tsx` (call `usePushSetup`), `src/features/auth/AuthProvider.tsx` (clear token on sign-out), `src/app/place/new.tsx` (notify after create)

**Interfaces:**
- Consumes: `setPushToken`, `AppUser`, `useUsers`, `useAuth`, `auth` (`@/lib/firebase`), `CATEGORY_BY_KEY`, `Place`, `createPlace` (returns new id)
- Produces:
  - `registerForPushToken(): Promise<string | null>`
  - `usePushSetup(): void`
  - `notifyPartner(place: Pick<Place, 'id' | 'name' | 'category'>, users: readonly AppUser[], myUid: string): Promise<void>` (never throws)

- [ ] **Step 1: Create `src/features/push/register.ts`**

```ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isGranted(permissions: Notifications.NotificationPermissionsStatus): boolean {
  const status = permissions.ios?.status;
  return (
    status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

export async function registerForPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }
  let granted = isGranted(await Notifications.getPermissionsAsync());
  if (!granted) {
    granted = isGranted(
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      }),
    );
  }
  if (!granted) {
    return null;
  }
  const projectId: unknown = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof projectId !== 'string') {
    console.warn('Missing EAS projectId: run `eas init`');
    return null;
  }
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}
```

- [ ] **Step 2: Create `src/features/push/usePushSetup.ts`**

```ts
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { registerForPushToken } from '@/features/push/register';
import { setPushToken } from '@/features/users/api';

export function usePushSetup(): void {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!uid) return;
    registerForPushToken()
      .then((token) => (token ? setPushToken(uid, token) : undefined))
      .catch((error: unknown) => console.warn('Push registration failed', error));
  }, [uid]);

  useEffect(() => {
    if (!uid || !lastResponse) return;
    const placeId = lastResponse.notification.request.content.data?.placeId;
    Notifications.clearLastNotificationResponse();
    if (typeof placeId === 'string') {
      router.push({ pathname: '/place/[id]', params: { id: placeId } });
    }
  }, [uid, lastResponse]);
}
```

- [ ] **Step 3: Create `src/features/push/notifyPartner.ts`**

```ts
import { CATEGORY_BY_KEY } from '@/features/places/categories';
import type { Place } from '@/features/places/types';
import type { AppUser } from '@/features/users/api';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function notifyPartner(
  place: Pick<Place, 'id' | 'name' | 'category'>,
  users: readonly AppUser[],
  myUid: string,
): Promise<void> {
  try {
    const me = users.find((appUser) => appUser.id === myUid);
    const partner = users.find((appUser) => appUser.id !== myUid);
    if (!partner?.expoPushToken) return;

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: partner.expoPushToken,
        title: 'Nouveau lieu',
        body: `${me?.displayName ?? 'Quelqu’un'} a ajouté ${place.name} (${CATEGORY_BY_KEY[place.category].label})`,
        sound: 'default',
        data: { placeId: place.id },
      }),
    });
    if (!response.ok) {
      console.warn('Expo push failed', response.status, await response.text());
    }
  } catch (error) {
    console.warn('notifyPartner failed', error);
  }
}
```

- [ ] **Step 4: Call `usePushSetup` in `src/app/_layout.tsx`**

Add the import and call the hook as the first line of `RootNavigator` (before any early return):

```tsx
import { usePushSetup } from '@/features/push/usePushSetup';
```

```tsx
function RootNavigator() {
  usePushSetup();
  const { user, initializing } = useAuth();
  // ...rest unchanged
```

- [ ] **Step 5: Clear push token on sign-out in `src/features/auth/AuthProvider.tsx`**

Add the import and replace the module-level `signOut` function:

```tsx
import { setPushToken } from '@/features/users/api';
```

```tsx
async function signOut(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    await setPushToken(uid, null).catch((error: unknown) => console.warn('Clearing push token failed', error));
  }
  await firebaseSignOut(auth);
}
```

- [ ] **Step 6: Notify partner after create in `src/app/place/new.tsx`**

Add imports:

```tsx
import { useAuth } from '@/features/auth/AuthProvider';
import { notifyPartner } from '@/features/push/notifyPartner';
import { useUsers } from '@/features/users/UsersProvider';
```

Add hooks at the top of `NewPlaceScreen` (before the existing `useState` calls):

```tsx
  const { user } = useAuth();
  const { users } = useUsers();
```

Replace `handleSubmit`:

```tsx
  async function handleSubmit(input: PlaceInput) {
    const id = await createPlace(input);
    if (user) {
      void notifyPartner({ id, name: input.name, category: input.category }, users, user.uid);
    }
    router.back();
  }
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed.

- [ ] **Step 8: Commit**

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
feat: push notification to partner when a place is added

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

## Manual setup and first run (done by the user, not by subagents)

**1. Firebase console**
1. Project settings → Your apps → add **Web** app → copy config values into `.env.local` (copy of `.env.example`).
2. Authentication → Sign-in method → enable **Email/Password**. Users → add both accounts. Copy both **User UIDs**.
3. Firestore Database → Create database → production mode → region `europe-west9 (Paris)`.
4. Firestore → Data → collection `users` → one document per UID (document ID = UID): `displayName` (string, e.g. "JB"), `expoPushToken` (null).
5. In `firestore.rules`, replace `UID_USER_1` / `UID_USER_2` with the two UIDs → paste into Firestore → Rules → Publish. Commit the updated file.

**2. Google Places key (separate Google Cloud project, keeps Firebase on the free Spark plan)**
1. Google Cloud console → new project → attach billing account.
2. APIs & Services → enable **Places API (New)**.
3. Credentials → Create API key → Application restrictions: **iOS apps**, bundle ID `com.jbazan.leplandeturgot` → API restrictions: **Places API (New)** only.
4. Put it in `.env.local` as `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`.

**3. Expo / EAS**
1. `npx eas-cli@latest login` then `npx eas-cli@latest init` → adds `extra.eas.projectId` to `app.json` → commit.
2. `npx eas-cli@latest credentials -p ios` → set up the **Push Notifications key** (APNs) for `com.jbazan.leplandeturgot` with your Apple Developer account.

**4. Run on your iPhone (development)**
1. Plug in iPhone, then `npx expo run:ios --device` (generates `ios/`, builds with Xcode, installs). Select your Apple team in Xcode signing if prompted.
2. Log in, accept notifications, add a place, check the list, map, edit, delete.

**5. TestFlight (no App Store release)**
1. `npx eas-cli@latest build:configure` (creates `eas.json`).
2. `.env.local` is not uploaded to EAS Build: create each `EXPO_PUBLIC_*` variable for the production environment with `npx eas-cli@latest env:create --environment production --visibility plaintext`.
3. `npx eas-cli@latest build -p ios --profile production`.
4. `npx eas-cli@latest submit -p ios --latest` — this only uploads the build to App Store Connect so TestFlight can use it; never click "Submit for Review" for the App Store.
5. App Store Connect → Users and Access → invite your date's Apple ID (minimal role, e.g. Marketing) → TestFlight → Internal Testing group → add her. Internal testers need no Apple beta review. She installs the TestFlight app and accepts the invite. Builds expire after 90 days: rebuild + resubmit to refresh.
6. End-to-end check on two iPhones: A adds a place → B receives "Nouveau lieu" push → tap opens the place.
