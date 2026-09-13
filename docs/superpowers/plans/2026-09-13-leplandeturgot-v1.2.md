# Le Plan de Turgot v1.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the whole app the "Carnet à tampons" art direction, add a one-time animated intro before login, and add a "Recos" tab suggesting well-rated places similar to the couple's 5-star places.

**Architecture:** Same Expo SDK 57 / expo-router app as v1.1 (`docs/superpowers/plans/2026-09-13-leplandeturgot-v1.1.md`). Tasks 1–3 are presentation-only: a new token set in `src/theme.ts`, fonts loaded with `@expo-google-fonts` + `useFonts` in the root layout, and a small set of shared components (Button, Sticker, Stamp, PlusOne, TicketHeader, StampCollage) that every screen is rebuilt on. Task 4 adds an `intro` route gated by `Stack.Protected` and an AsyncStorage flag. Task 5 reuses the Nearby Search client from `discovery.ts` for a computed-on-open Recos tab. JavaScript only — no native rebuild.

**Tech Stack:** Expo SDK 57, React Native 0.86 (new architecture, `boxShadow` style), React 19.2, TypeScript 6 strict, expo-router 57 (Tabs, Stack.Protected), `@expo-google-fonts/bagel-fat-one`, `@expo-google-fonts/dm-sans`, React Native `Animated` + `AccessibilityInfo`, `@react-native-async-storage/async-storage` 2.2, Firebase JS SDK Firestore, Google Places API (New) Nearby Search.

**Spec:** No spec file — design approved in chat on 2026-09-13 (DA mockup "B · Carnet à tampons", gen 2, in the session scratchpad `turgot-looks.html`; intro and Recos designs presented and approved in chat). The "Design summary" below is the spec.

## Global Constraints

- Platform: iOS only.
- New dependencies allowed ONLY: `@expo-google-fonts/bagel-fat-one` and `@expo-google-fonts/dm-sans`, installed with `npx expo install` (Task 1). No other dependency changes.
- No native changes: do not touch `ios/`, `app.json`, `eas.json`, `firestore.rules`; do not run `expo prebuild`, `pod install` or `expo run`.
- Never read, touch or stage `*.p8`, `.env.local`, `.superpowers/`.
- AGENTS.md: "Expo HAS CHANGED" — for any Expo API not spelled out in this plan, read https://docs.expo.dev/versions/v57.0.0/ before writing code.
- No automated tests of any kind (user decision).
- Verification for every task: `npx tsc --noEmit` passes AND `npx expo export --platform ios --output-dir .expo/export-check` succeeds.
- Routes live in `src/app/`. Everything else in `src/`. Import alias `@/*` → `src/*`.
- All UI copy in French (informal "tu", typographic apostrophe `’`). Code identifiers in English.
- Tasks 1–3 change presentation only: keep every existing behavior, handler, guard and all existing French copy except the approved wording changes listed in the Design summary.
- With custom fonts, set `fontFamily` from `fonts` in `@/theme` and never set `fontWeight` on the same text.
- Default to no code comments; one short line only when the why is non-obvious.
- No emojis in code or UI copy (the `★` glyph is allowed, it is already used).
- Stage files by explicit path only (never `git add -A` / `git add .`).
- Commit trailers: `Co-Authored-By: <implementer model name> <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT`.

## Design summary

**Art direction "Carnet à tampons"** (gen-2 mockup B): a sticker-and-stamp outing notebook.
- Palette: paper `#F3F5EF`, ink `#1C1B22`, cobalt `#2E4BFF`, tangerine `#FF7A1A`, mint `#3DD6A0`, lemon `#FFE14D`, white surfaces `#FFFFFF`. Muted ink `rgba(28,27,34,0.62)`, faint ink `rgba(28,27,34,0.38)`, danger `#D92D20`.
- Type: Bagel Fat One (`BagelFatOne_400Regular`) for titles, section headers, stamps, buttons, segmented control, tab labels; DM Sans (400/500/700/800) for text.
- Shapes: 1.5 px ink outlines, 10 px radius, hard offset shadow `3px 4px 0px ink` on primary buttons, FAB and tickets; stickers slightly tilted (±2°).
- Components: primary button lemon / secondary white / danger white with red outline; filter chips are tilted stickers (selected = tone fill); places are tickets with a perforation and a stub; the stub holds a **Stamp** (done = rotated cobalt double-ring "FAIT n/5", to-do = dashed faint circle "à tamponner"); the tangerine FAB is tilted −8°; tab bar labels in Bagel with lemon active background; headers on paper with Bagel titles.
- "Moi aussi" heart becomes a **"+1"** sticker (lemon when on, faint outline when off; creator sees a static lemon "+1" only when shared).
- Approved wording changes: list chip "Envie à deux" → **"Les deux partants"**; detail label "Envie partagée" → **"Partants tous les deux"** ("Moi aussi" unchanged). "+1" accessibility labels: "Moi aussi" / "Retirer mon +1".
- Login: stamp collage (cobalt "PARIS / TOUS ARRONDISSEMENTS" round stamp, tangerine "À FAIRE" rectangle stamp, mint "+1" pill) above the Bagel title with a lemon offset text shadow.
- Map: pins to-do tangerine, done cobalt; legend as two tilted white stickers with colored dots.
- "Ce soir ?" modal: cards are tickets with a "Billet pour ce soir" / "Billet découverte" header and a barcode; a shared idea shows a lemon "+1" tag.

**Intro (first open)**
- Route `intro`, shown once per device before anything else (before login), remembered in AsyncStorage key `intro:v1:seen` (value `'1'`).
- Steps: the 7 sentences, then a features step, then "C’est parti" → marks seen → login (or the tabs if already logged in).
  1. « Bon, Blandine. » 2. « On a un gros problème. » 3. « Trop de trucs à faire… » 4. « …mais un temps imparti. » 5. « Et, de mon côté, une capacité à oublier assez conséquente quand même. » 6. « Donc j’ai réfléchi. » 7. « Et voici la solution que j’ai trouvée : »
  - Features step: app name "Le Plan de Turgot" + sticker lines: "Nos lieux, à faire et déjà faits", "La carte de Paris avec tout dessus", "« Moi aussi » quand on est partants", "« On fait quoi ce soir ? »", "Des recos inspirées de nos 5 étoiles".
- Each step lands like a stamp (scale 1.7 → 1, rotate −9° → −2°, fade in) with RN `Animated`; if iOS Reduce Motion is on (`AccessibilityInfo.isReduceMotionEnabled` + `reduceMotionChanged`), no animation.
- Footer: "Passer" (marks seen), progress dots styled as stamps, "Suivant". Stamp collage above the first sentence only.
- Login screen gets a "Revoir l’intro" link that shows the intro again (in memory; finishing marks seen again).

**Recos (3rd tab)**
- Tabs: Liste / Carte / **Recos**.
- Sources: the 5 most recently updated places with status `done`, rating 5 and a category other than `autre`.
- For each source: Google Nearby Search centered on the source, radius 1500 m, on its category's types (same types as Découverte), `rankPreference: POPULARITY`; keep rating ≥ 4.3 and ≥ 100 reviews; exclude places already in the app (`googlePlaceId`), places already suggested for an earlier source, and the source itself; 3 per source.
- UI: one block per source "Parce que vous avez adoré" + source name, then up to 3 ticket cards: category, "à 600 m" distance from the source, name, address, "★ 4,6 · 1 234 avis"; buttons "À faire" (creates a `todo` place + partner push → "Ajout…" → "Ajouté") and "Google Maps" (opens `googleMapsUri`).
- Computed on tab mount, again when the set of source ids changes, and on pull-to-refresh. Nothing stored, no dismiss.
- No source: "Mets 5 étoiles à un lieu pour avoir des recos dans le même genre". While computing: "On cherche des lieux dans le même genre…". No result: "Pas de nouvelle reco pour l’instant. Tire vers le bas pour réessayer." All requests failed: "Recos indisponibles. Tire vers le bas pour réessayer."

## APIs checked for this plan

- `@expo-google-fonts/*` 0.4.x (inspected installed `@expo-google-fonts/material-symbols` 0.4.47 and the published `dm-sans@0.4.2` / `bagel-fat-one@0.4.0` file lists): per-weight subpath exports (`@expo-google-fonts/dm-sans/400Regular`, `…/500Medium`, `…/700Bold`, `…/800ExtraBold`, `@expo-google-fonts/bagel-fat-one/400Regular`) and `…/useFonts` returning `[loaded, error]`; font family name = the exported constant name. Expo SDK 57 font docs: `useFonts` returns `[loaded, error]`; return `null` until `loaded || error`. Native `ExpoFont` is already in the iOS build (`ios/Podfile.lock`).
- expo-router 57 bundled typings: Tabs options `tabBarStyle`, `tabBarLabelStyle`, `tabBarActiveTintColor`, `tabBarInactiveTintColor`, `tabBarActiveBackgroundColor`, `sceneStyle`, `headerStyle`, `headerShadowVisible`, `headerTitleStyle`, `headerTintColor`, `headerLeft`, `headerRight`; native-stack `headerTitleStyle` accepts `fontFamily`/`fontSize`/`color`.
- React Native 0.86 typings: `boxShadow?: string | BoxShadowValue[]`; `AccessibilityInfo.isReduceMotionEnabled(): Promise<boolean>`.

## File structure (changes)

```
package.json, package-lock.json                modify (T1): two font packages
src/theme.ts                                   replace (T1, T3)
src/lib/useAppFonts.ts                         create (T1)
src/app/_layout.tsx                            replace (T1, T4)
src/components/Button.tsx                      create (T1)
src/components/Sticker.tsx                     create (T1)
src/components/Stamp.tsx                       create (T1)
src/features/places/PlusOne.tsx                create (T1)
src/components/SegmentedControl.tsx            replace (T1)
src/components/RatingStars.tsx                 replace (T1)
src/components/Fab.tsx                         replace (T1)
src/components/CenteredMessage.tsx             replace (T1)
src/features/places/PlaceRow.tsx               replace (T1)
src/components/StatusBadge.tsx                 delete (T1) — superseded by Stamp
src/components/StampCollage.tsx                create (T2)
src/app/(tabs)/_layout.tsx                     replace (T2)
src/app/(tabs)/index.tsx                       replace (T2)
src/app/(tabs)/map.tsx                         replace (T2)
src/app/(tabs)/recos.tsx                       create placeholder (T2), replace (T5)
src/app/login.tsx                              replace (T2), modify (T4)
src/components/TicketHeader.tsx                create (T3)
src/features/search/discoveredPlace.ts         create (T3)
src/features/places/pickerStyles.ts            replace (T3)
src/features/places/IdeasPanel.tsx             replace (T3)
src/features/search/DiscoveryPanel.tsx         replace (T3)
src/app/place/random.tsx                       replace (T3)
src/features/places/PlaceForm.tsx              replace (T3)
src/features/search/PlaceSearch.tsx            replace (T3)
src/app/place/[id].tsx                         replace (T3)
src/components/ToggleChip.tsx                  delete (T3)
src/features/places/WishHeart.tsx              delete (T3)
src/features/intro/IntroProvider.tsx           create (T4)
src/features/intro/slides.ts                   create (T4)
src/features/intro/useStampEntrance.ts         create (T4)
src/app/intro.tsx                              create (T4)
src/features/search/discovery.ts               modify (T5)
src/features/recos/recos.ts                    create (T5)
src/features/recos/RecoCard.tsx                create (T5)
```

---

### Task 1: Theme tokens, fonts, base components

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npx expo install`)
- Replace: `src/theme.ts`, `src/app/_layout.tsx`, `src/components/SegmentedControl.tsx`, `src/components/RatingStars.tsx`, `src/components/Fab.tsx`, `src/components/CenteredMessage.tsx`, `src/features/places/PlaceRow.tsx`
- Create: `src/lib/useAppFonts.ts`, `src/components/Button.tsx`, `src/components/Sticker.tsx`, `src/components/Stamp.tsx`, `src/features/places/PlusOne.tsx`
- Delete: `src/components/StatusBadge.tsx` (only used by `PlaceRow`, which switches to `Stamp`)

**Interfaces:**
- Consumes: `Place`, `PlaceStatus`, `Rating` (`@/features/places/types`); `setLiked(id: string, liked: boolean): Promise<void>` (`@/features/places/api`); `isLikedBy(place, uid)`, `isSharedWish(place)` (`@/features/places/wishes`); `useAuth`, `UsersProvider`, `PlacesProvider`, `usePushSetup` (unchanged)
- Produces:
  - `@/theme`: `colors` with new keys `paper`, `surface`, `ink`, `inkMuted`, `inkFaint`, `cobalt`, `tangerine`, `mint`, `lemon`, `danger`, `todo` (= tangerine), `done` (= cobalt), plus TEMPORARY legacy aliases `background`, `text`, `textMuted`, `border`, `primary`, `todoSoft`, `doneSoft`, `star`, `heart` (removed at the end of Task 3); `fonts` = `{ display, regular, medium, bold, heavy }`; `stroke` = 1.5; `hardShadow` = `'3px 4px 0px #1C1B22'`; `spacing` = `{ xs 4, sm 8, md 12, lg 16, xl 24 }`; `radius` = `{ sm 6, md 10, lg 14 }`
  - `useAppFonts(): boolean` (`@/lib/useAppFonts`)
  - `Button({ label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; icon?: IoniconName; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> })`
  - `Sticker({ label: string; selected: boolean; onPress: () => void; tone?: StickerTone; icon?: IoniconName; tilt?: number })`, `type StickerTone = 'mint' | 'lemon' | 'tangerine' | 'cobalt'`, `stickerTilt(index: number): number`, `STICKER_TONE_COLORS: Record<StickerTone, string>`
  - `Stamp({ status: PlaceStatus; rating: Rating | null; onPress?: () => void; size?: number })`
  - `PlusOne({ place: Place; myUid: string; size?: 'sm' | 'lg' })` (`@/features/places/PlusOne`)
  - `SegmentedControl`, `RatingStars`, `Fab`, `CenteredMessage`, `PlaceRow` keep their exact props

- [ ] **Step 1: Install the two font packages**

```bash
npx expo install @expo-google-fonts/bagel-fat-one @expo-google-fonts/dm-sans
```

Expected: both added to `package.json` dependencies. If `npx expo install` also offers to add `expo-font`, decline or leave it out — `expo-font` is already provided by `expo`.

- [ ] **Step 2: Replace `src/theme.ts`**

```ts
const INK = '#1C1B22';

export const colors = {
  paper: '#F3F5EF',
  surface: '#FFFFFF',
  ink: INK,
  inkMuted: 'rgba(28, 27, 34, 0.62)',
  inkFaint: 'rgba(28, 27, 34, 0.38)',
  cobalt: '#2E4BFF',
  tangerine: '#FF7A1A',
  mint: '#3DD6A0',
  lemon: '#FFE14D',
  danger: '#D92D20',
  todo: '#FF7A1A',
  done: '#2E4BFF',
  background: '#F3F5EF',
  text: INK,
  textMuted: 'rgba(28, 27, 34, 0.62)',
  border: 'rgba(28, 27, 34, 0.38)',
  primary: '#2E4BFF',
  todoSoft: '#FFFFFF',
  doneSoft: '#FFFFFF',
  star: '#FF7A1A',
  heart: '#FF7A1A',
} as const;

export const fonts = {
  display: 'BagelFatOne_400Regular',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
  heavy: 'DMSans_800ExtraBold',
} as const;

export const stroke = 1.5;

export const hardShadow = `3px 4px 0px ${INK}`;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;
```

- [ ] **Step 3: Create `src/lib/useAppFonts.ts`**

```ts
import { BagelFatOne_400Regular } from '@expo-google-fonts/bagel-fat-one/400Regular';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans/800ExtraBold';
import { useFonts } from '@expo-google-fonts/dm-sans/useFonts';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    BagelFatOne_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });
  return loaded || error !== null;
}
```

If tsc cannot resolve a subpath import, import the same symbols from the package root instead (e.g. `import { BagelFatOne_400Regular } from '@expo-google-fonts/bagel-fat-one'`, `import { useFonts, DMSans_400Regular, … } from '@expo-google-fonts/dm-sans'`) and report it.

- [ ] **Step 4: Replace `src/app/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { CenteredMessage } from '@/components/CenteredMessage';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
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

function RootNavigator() {
  usePushSetup();
  const { user, initializing } = useAuth();

  if (initializing) {
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
      <Stack.Protected guard={!loggedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={loggedIn}>
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
      </Stack.Protected>
    </Stack>
  );
}
```

- [ ] **Step 5: Create `src/components/Button.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, fonts, hardShadow, radius, spacing, stroke } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: colors.ink,
  secondary: colors.ink,
  danger: colors.danger,
};

export function Button({ label, onPress, variant = 'primary', icon, loading = false, disabled = false, style }: Props) {
  const inactive = disabled || loading;
  const textColor = TEXT_COLOR[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.base, styles[variant], inactive && styles.inactive, pressed && styles.pressed, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: stroke,
    borderColor: colors.ink,
  },
  primary: {
    backgroundColor: colors.lemon,
    boxShadow: hardShadow,
  },
  secondary: {
    backgroundColor: colors.surface,
  },
  danger: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
  },
  inactive: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 16,
    textAlign: 'center',
  },
});
```

If tsc rejects `boxShadow` in `StyleSheet.create`, replace it with `shadowColor: colors.ink, shadowOffset: { width: 3, height: 4 }, shadowOpacity: 1, shadowRadius: 0` and report it.

- [ ] **Step 6: Create `src/components/Sticker.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, spacing, stroke } from '@/theme';

export type StickerTone = 'mint' | 'lemon' | 'tangerine' | 'cobalt';

export const STICKER_TONE_COLORS: Record<StickerTone, string> = {
  mint: colors.mint,
  lemon: colors.lemon,
  tangerine: colors.tangerine,
  cobalt: colors.cobalt,
};

const SELECTED_TEXT: Record<StickerTone, string> = {
  mint: colors.ink,
  lemon: colors.ink,
  tangerine: colors.ink,
  cobalt: colors.surface,
};

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: StickerTone;
  icon?: ComponentProps<typeof Ionicons>['name'];
  tilt?: number;
};

export function stickerTilt(index: number): number {
  return index % 2 === 0 ? -2 : 2;
}

export function Sticker({ label, selected, onPress, tone = 'mint', icon, tilt = 0 }: Props) {
  const textColor = selected ? SELECTED_TEXT[tone] : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.sticker,
        { transform: [{ rotate: `${tilt}deg` }] },
        selected && { backgroundColor: STICKER_TONE_COLORS[tone] },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={15} color={textColor} /> : null}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sticker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: stroke,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
});
```

- [ ] **Step 7: Create `src/components/Stamp.tsx`**

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlaceStatus, Rating } from '@/features/places/types';
import { colors, fonts } from '@/theme';

type Props = {
  status: PlaceStatus;
  rating: Rating | null;
  onPress?: () => void;
  size?: number;
};

export function Stamp({ status, rating, onPress, size = 50 }: Props) {
  const done = status === 'done';
  const label = done ? (rating ? `Fait, noté ${rating} sur 5` : 'Fait') : 'À faire';
  const circle = { width: size, height: size, borderRadius: size / 2 };

  const stamp = done ? (
    <View style={[styles.done, circle]}>
      <View style={[styles.innerRing, { borderRadius: (size - 6) / 2 }]} />
      <Text style={styles.doneText}>FAIT</Text>
      {rating ? <Text style={styles.doneRating}>{rating}/5</Text> : null}
    </View>
  ) : (
    <View style={[styles.todo, circle]}>
      <Text style={styles.todoText}>{'à\ntamponner'}</Text>
    </View>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label}>
        {stamp}
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}>
      {stamp}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  done: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cobalt,
    transform: [{ rotate: '-12deg' }],
  },
  innerRing: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 1,
    borderColor: colors.cobalt,
  },
  doneText: {
    fontFamily: fonts.display,
    fontSize: 11,
    lineHeight: 13,
    color: colors.cobalt,
  },
  doneRating: {
    fontFamily: fonts.display,
    fontSize: 10,
    lineHeight: 12,
    color: colors.cobalt,
  },
  todo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.inkFaint,
  },
  todoText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    lineHeight: 10,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});
```

- [ ] **Step 8: Create `src/features/places/PlusOne.tsx`** (same logic as `WishHeart`, new look)

```tsx
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { setLiked } from '@/features/places/api';
import type { Place } from '@/features/places/types';
import { isLikedBy, isSharedWish } from '@/features/places/wishes';
import { colors, fonts, stroke } from '@/theme';

type Props = {
  place: Place;
  myUid: string;
  size?: 'sm' | 'lg';
};

export function PlusOne({ place, myUid, size = 'sm' }: Props) {
  if (place.status !== 'todo') {
    return null;
  }

  const sizeStyle = size === 'lg' ? styles.lg : styles.sm;
  const textSizeStyle = size === 'lg' ? styles.textLg : styles.textSm;

  if (place.createdBy === myUid) {
    if (!isSharedWish(place)) {
      return null;
    }
    return (
      <View style={[styles.tag, sizeStyle, styles.on]} accessible accessibilityLabel="Partants tous les deux">
        <Text style={[styles.text, textSizeStyle]}>+1</Text>
      </View>
    );
  }

  const liked = isLikedBy(place, myUid);

  function toggle() {
    setLiked(place.id, !liked).catch(() => Alert.alert('Oups', 'Impossible de mettre à jour, réessaie.'));
  }

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: liked }}
      accessibilityLabel={liked ? 'Retirer mon +1' : 'Moi aussi'}
      style={({ pressed }) => [styles.tag, sizeStyle, liked ? styles.on : styles.off, pressed && styles.pressed]}
    >
      <Text style={[styles.text, textSizeStyle, !liked && styles.textOff]}>+1</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: 6,
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    transform: [{ rotate: '6deg' }],
  },
  lg: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    transform: [{ rotate: '-4deg' }],
  },
  on: {
    backgroundColor: colors.lemon,
  },
  off: {
    backgroundColor: colors.surface,
    borderColor: colors.inkFaint,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontFamily: fonts.display,
    color: colors.ink,
  },
  textSm: {
    fontSize: 11,
  },
  textLg: {
    fontSize: 20,
  },
  textOff: {
    color: colors.inkFaint,
  },
});
```

- [ ] **Step 9: Replace `src/components/SegmentedControl.tsx`**

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing, stroke } from '@/theme';

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
            accessibilityRole="button"
            accessibilityState={{ selected }}
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
    gap: 3,
    padding: 3,
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md - 3,
  },
  segmentSelected: {
    backgroundColor: colors.mint,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.inkMuted,
  },
  labelSelected: {
    color: colors.ink,
  },
});
```

- [ ] **Step 10: Replace `src/components/RatingStars.tsx`**

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
        const filled = value !== null && star <= value;
        const icon = (
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? colors.tangerine : colors.inkFaint}
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

- [ ] **Step 11: Replace `src/components/Fab.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { colors, hardShadow, spacing } from '@/theme';

export function Fab() {
  return (
    <Pressable
      accessibilityLabel="Ajouter un lieu"
      accessibilityRole="button"
      onPress={() => router.push('/place/new')}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Ionicons name="add" size={32} color={colors.surface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: colors.tangerine,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: hardShadow,
    transform: [{ rotate: '-8deg' }],
  },
  pressed: {
    transform: [{ rotate: '-8deg' }, { scale: 0.94 }],
  },
});
```

- [ ] **Step 12: Replace `src/components/CenteredMessage.tsx`**

```tsx
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

type Props = {
  text: string;
  loading?: boolean;
};

export function CenteredMessage({ text, loading = false }: Props) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={colors.ink} /> : null}
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
    backgroundColor: colors.paper,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
```

- [ ] **Step 13: Replace `src/features/places/PlaceRow.tsx`** (ticket with stub)

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { Stamp } from '@/components/Stamp';
import { PlusOne } from '@/features/places/PlusOne';
import type { Place } from '@/features/places/types';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

const PERFORATION = [0, 1, 2, 3, 4, 5, 6, 7];

type Props = {
  place: Place;
  myUid: string;
  addedBy: string | undefined;
  onPress: () => void;
  onPressStatus: () => void;
};

export function PlaceRow({ place, myUid, addedBy, onPress, onPressStatus }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ticket, pressed && styles.pressed]}>
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {addedBy ? `Ajouté par ${addedBy}` : place.address}
        </Text>
        {place.status === 'done' && place.rating !== null ? (
          <RatingStars value={place.rating} size={12} />
        ) : (
          <PlusOne place={place} myUid={myUid} />
        )}
      </View>
      <View style={styles.perforation}>
        {PERFORATION.map((hole) => (
          <View key={hole} style={styles.hole} />
        ))}
      </View>
      <View style={styles.stub}>
        <Stamp status={place.status} rating={place.rating} onPress={onPressStatus} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ticket: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: stroke,
    borderColor: colors.ink,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  name: {
    fontFamily: fonts.heavy,
    fontSize: 16,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  perforation: {
    width: 2,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 6,
  },
  hole: {
    width: 1.5,
    height: 5,
    borderRadius: 1,
    backgroundColor: colors.inkFaint,
  },
  stub: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
```

- [ ] **Step 14: Delete `src/components/StatusBadge.tsx`**

```bash
git rm src/components/StatusBadge.tsx
```

Then confirm no import remains: `grep -rn "StatusBadge" src` → no output.

- [ ] **Step 15: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed (other screens still compile through the legacy color aliases).

- [ ] **Step 16: Commit**

```bash
git add package.json package-lock.json src/theme.ts src/lib/useAppFonts.ts src/app/_layout.tsx src/components/Button.tsx src/components/Sticker.tsx src/components/Stamp.tsx src/features/places/PlusOne.tsx src/components/SegmentedControl.tsx src/components/RatingStars.tsx src/components/Fab.tsx src/components/CenteredMessage.tsx src/features/places/PlaceRow.tsx src/components/StatusBadge.tsx
git status
git commit -m "$(cat <<'EOF'
feat: carnet a tampons theme, fonts and base components

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 2: List, tabs, map, login

**Files:**
- Create: `src/components/StampCollage.tsx`, `src/app/(tabs)/recos.tsx` (placeholder, replaced in Task 5)
- Replace: `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/map.tsx`, `src/app/login.tsx`

**Interfaces:**
- Consumes (Task 1): `colors`, `fonts`, `stroke`, `spacing`, `radius`, `Button`, `Sticker`, `SegmentedControl`, `CenteredMessage`, `Fab`, `PlaceRow`; existing `useAuth`, `usePlaces`, `useUsers`, `groupPlacesByCategory(places, filter, sharedOnly)`, `PlaceSection`, `StatusFilter`
- Produces:
  - `StampCollage()` (`@/components/StampCollage`) — decorative, no props (reused by Task 4)
  - Tabs `index` ("Liste"), `map` ("Carte"), `recos` ("Recos")
  - `src/app/login.tsx` default export with the `Button` "Se connecter" as the last element of the `KeyboardAvoidingView` (Task 4 inserts a link after it)

- [ ] **Step 1: Create `src/components/StampCollage.tsx`**

```tsx
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, stroke } from '@/theme';

export function StampCollage() {
  return (
    <View style={styles.canvas} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.parisStamp}>
        <View style={styles.parisInner} />
        <Text style={styles.parisText}>PARIS</Text>
        <Text style={styles.parisSub}>TOUS ARRONDISSEMENTS</Text>
      </View>
      <View style={styles.todoStamp}>
        <Text style={styles.todoText}>À FAIRE</Text>
      </View>
      <View style={styles.plusSticker}>
        <Text style={styles.plusText}>+1</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: 250,
    height: 132,
    alignSelf: 'center',
  },
  parisStamp: {
    position: 'absolute',
    left: 8,
    top: 10,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: colors.cobalt,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
  },
  parisInner: {
    position: 'absolute',
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: colors.cobalt,
  },
  parisText: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.cobalt,
  },
  parisSub: {
    fontFamily: fonts.heavy,
    fontSize: 6.5,
    letterSpacing: 0.3,
    color: colors.cobalt,
  },
  todoStamp: {
    position: 'absolute',
    right: 6,
    top: 18,
    borderWidth: 3,
    borderColor: colors.tangerine,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 8,
    transform: [{ rotate: '8deg' }],
  },
  todoText: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.tangerine,
  },
  plusSticker: {
    position: 'absolute',
    right: 22,
    bottom: 8,
    backgroundColor: colors.mint,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 4,
    transform: [{ rotate: '-5deg' }],
  },
  plusText: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
  },
});
```

- [ ] **Step 2: Replace `src/app/(tabs)/_layout.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { colors, fonts, spacing, stroke } from '@/theme';

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
        sceneStyle: { backgroundColor: colors.paper },
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
        tabBarStyle: { backgroundColor: colors.paper, borderTopWidth: stroke, borderTopColor: colors.ink },
        tabBarLabelStyle: { fontFamily: fonts.display, fontSize: 12 },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarActiveBackgroundColor: colors.lemon,
        headerLeft: () => (
          <Pressable
            onPress={() => router.push('/place/random')}
            hitSlop={8}
            style={styles.dice}
            accessibilityRole="button"
            accessibilityLabel="On fait quoi ce soir ?"
          >
            <Ionicons name="dice-outline" size={20} color={colors.ink} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={confirmSignOut}
            hitSlop={8}
            style={styles.logout}
            accessibilityRole="button"
            accessibilityLabel="Se déconnecter"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.ink} />
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
      <Tabs.Screen
        name="recos"
        options={{
          title: 'Recos',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dice: {
    marginLeft: spacing.lg,
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lemon,
    borderWidth: stroke,
    borderColor: colors.ink,
    transform: [{ rotate: '6deg' }],
  },
  logout: {
    marginRight: spacing.lg,
  },
});
```

- [ ] **Step 3: Create placeholder `src/app/(tabs)/recos.tsx`**

```tsx
import { CenteredMessage } from '@/components/CenteredMessage';

export default function RecosScreen() {
  return <CenteredMessage text="Les recos arrivent bientôt" />;
}
```

- [ ] **Step 4: Replace `src/app/(tabs)/index.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { Fab } from '@/components/Fab';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sticker } from '@/components/Sticker';
import { useAuth } from '@/features/auth/AuthProvider';
import { groupPlacesByCategory, type PlaceSection, type StatusFilter } from '@/features/places/grouping';
import { PlaceRow } from '@/features/places/PlaceRow';
import { usePlaces } from '@/features/places/PlacesProvider';
import type { Place } from '@/features/places/types';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, fonts, spacing } from '@/theme';

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
            <Ionicons name={section.category.icon} size={18} color={colors.cobalt} />
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
          <Sticker
            label="Les deux partants"
            tone="lemon"
            tilt={-2}
            selected={sharedOnly}
            onPress={() => setSharedOnly((value) => !value)}
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
    backgroundColor: colors.paper,
  },
  filter: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 110,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.cobalt,
  },
  sectionCount: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.inkMuted,
  },
});
```

- [ ] **Step 5: Replace `src/app/(tabs)/map.tsx`**

```tsx
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Fab } from '@/components/Fab';
import { usePlaces } from '@/features/places/PlacesProvider';
import type { Place } from '@/features/places/types';
import { colors, fonts, spacing, stroke } from '@/theme';

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

- [ ] **Step 6: Replace `src/app/login.tsx`**

```tsx
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StampCollage } from '@/components/StampCollage';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

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
        <StampCollage />
        <Text style={styles.title}>Le Plan de Turgot</Text>
        <Text style={styles.subtitle}>Nos lieux à Paris</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.inkFaint}
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
          placeholderTextColor={colors.inkFaint}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Se connecter"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
          style={styles.submit}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.ink,
    textAlign: 'center',
    textShadowColor: colors.lemon,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
  },
  error: {
    fontFamily: fonts.bold,
    color: colors.danger,
    textAlign: 'center',
  },
  submit: {
    marginTop: spacing.sm,
  },
});
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed. `grep -rn "ToggleChip" "src/app/(tabs)"` → no output.

- [ ] **Step 8: Commit**

```bash
git add src/components/StampCollage.tsx "src/app/(tabs)/_layout.tsx" "src/app/(tabs)/index.tsx" "src/app/(tabs)/map.tsx" "src/app/(tabs)/recos.tsx" src/app/login.tsx
git status
git commit -m "$(cat <<'EOF'
feat: restyle list, tabs, map and login as a stamp notebook

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 3: Forms, detail, search, "Ce soir ?" modal; remove legacy tokens

**Files:**
- Create: `src/components/TicketHeader.tsx`, `src/features/search/discoveredPlace.ts`
- Replace: `src/features/places/pickerStyles.ts`, `src/features/places/IdeasPanel.tsx`, `src/features/search/DiscoveryPanel.tsx`, `src/app/place/random.tsx`, `src/features/places/PlaceForm.tsx`, `src/features/search/PlaceSearch.tsx`, `src/app/place/[id].tsx`, `src/theme.ts`
- Delete: `src/components/ToggleChip.tsx`, `src/features/places/WishHeart.tsx`
- Unchanged: `src/app/place/new.tsx` (no styles of its own)

**Interfaces:**
- Consumes (Tasks 1–2): `Button`, `Sticker`, `stickerTilt`, `SegmentedControl`, `RatingStars`, `CenteredMessage`, `PlusOne`, theme tokens; existing `DISCOVERY_CATEGORY_KEYS`, `DiscoveredPlace`, `DiscoveryCategory`, `discoveredCategory`, `discoverPlace` (`@/features/search/discovery`), `normalizePlaceInput`, `validatePlaceInput`, `createPlace`, `updatePlace`, `deletePlace`, `placeExists`, `notifyPartner`, `usePlaceSearch`, `randomCandidates`, `pickRandom`, `isSharedWish`
- Produces:
  - `TicketHeader({ label: string })` (`@/components/TicketHeader`)
  - `@/features/search/discoveredPlace`: `formatRating(place: Pick<DiscoveredPlace, 'rating' | 'userRatingCount'>): string`, `openInGoogleMaps(uri: string): void`, `discoveredPlaceInput(place: DiscoveredPlace): PlaceInput` (normalized)
  - `pickerStyles` keys: `label`, `chips`, `hint`, `loader`, `empty`, `emptyTitle`, `emptyText`, `drawButton`, `ticket`, `cardHeader`, `cardCategory`, `cardName`, `cardAddress`, `cardMeta`, `link`, `plusTag`, `plusTagText`, `actions`, `action`
  - `@/theme` without legacy aliases (keys: `paper`, `surface`, `ink`, `inkMuted`, `inkFaint`, `cobalt`, `tangerine`, `mint`, `lemon`, `danger`, `todo`, `done`)

- [ ] **Step 1: Create `src/components/TicketHeader.tsx`**

```tsx
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing, stroke } from '@/theme';

const BARS = [2, 1, 3, 1, 2, 2, 1, 3, 1, 2];

export function TicketHeader({ label }: { label: string }) {
  return (
    <View style={styles.top}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barcode} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {BARS.map((width, index) => (
          <View key={index} style={[styles.bar, { width }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
    borderBottomWidth: stroke,
    borderBottomColor: colors.inkFaint,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.cobalt,
  },
  barcode: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 2,
    height: 16,
  },
  bar: {
    backgroundColor: colors.ink,
  },
});
```

- [ ] **Step 2: Create `src/features/search/discoveredPlace.ts`**

```ts
import { Alert, Linking } from 'react-native';

import type { PlaceInput } from '@/features/places/types';
import { normalizePlaceInput } from '@/features/places/validation';
import { type DiscoveredPlace, discoveredCategory } from '@/features/search/discovery';

export function formatRating(place: Pick<DiscoveredPlace, 'rating' | 'userRatingCount'>): string {
  const rating = place.rating.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `★ ${rating} · ${place.userRatingCount.toLocaleString('fr-FR')} avis`;
}

export function openInGoogleMaps(uri: string): void {
  Linking.openURL(uri).catch(() => Alert.alert('Oups', 'Impossible d’ouvrir Google Maps.'));
}

export function discoveredPlaceInput(place: DiscoveredPlace): PlaceInput {
  return normalizePlaceInput({
    name: place.name,
    category: discoveredCategory(place),
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    googlePlaceId: place.googlePlaceId,
    status: 'todo',
    rating: null,
    comment: null,
  });
}
```

- [ ] **Step 3: Replace `src/features/places/pickerStyles.ts`**

```ts
import { StyleSheet } from 'react-native';

import { colors, fonts, hardShadow, radius, spacing, stroke } from '@/theme';

export const pickerStyles = StyleSheet.create({
  label: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.cobalt,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
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
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  drawButton: {
    marginTop: spacing.xl,
  },
  ticket: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: stroke,
    borderColor: colors.ink,
    boxShadow: hardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardCategory: {
    flex: 1,
    fontFamily: fonts.heavy,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.tangerine,
  },
  cardName: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 30,
    color: colors.ink,
  },
  cardAddress: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.inkMuted,
  },
  cardMeta: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  link: {
    marginTop: spacing.xs,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.cobalt,
    textDecorationLine: 'underline',
  },
  plusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.lemon,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: 6,
    transform: [{ rotate: '4deg' }],
  },
  plusTagText: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  action: {
    flex: 1,
  },
});
```

- [ ] **Step 4: Replace `src/features/places/IdeasPanel.tsx`** (same logic)

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Sticker, stickerTilt } from '@/components/Sticker';
import { TicketHeader } from '@/components/TicketHeader';
import { CATEGORIES, CATEGORY_BY_KEY } from '@/features/places/categories';
import { pickerStyles } from '@/features/places/pickerStyles';
import { usePlaces } from '@/features/places/PlacesProvider';
import { pickRandom, randomCandidates } from '@/features/places/random';
import type { CategoryKey } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

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
      return <ActivityIndicator style={pickerStyles.loader} color={colors.ink} />;
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
      return <Button label="Tirer au sort" icon="dice-outline" onPress={draw} style={pickerStyles.drawButton} />;
    }

    const category = CATEGORY_BY_KEY[picked.category];
    const author = usersById[picked.createdBy]?.displayName;
    const selectedId = picked.id;

    return (
      <View style={pickerStyles.ticket}>
        <TicketHeader label="Billet pour ce soir" />
        <View style={pickerStyles.cardHeader}>
          <Ionicons name={category.icon} size={18} color={colors.tangerine} />
          <Text style={pickerStyles.cardCategory}>{category.label}</Text>
          {isSharedWish(picked) ? (
            <View style={pickerStyles.plusTag} accessible accessibilityLabel="Partants tous les deux">
              <Text style={pickerStyles.plusTagText}>+1</Text>
            </View>
          ) : null}
        </View>
        <Text style={pickerStyles.cardName}>{picked.name}</Text>
        <Text style={pickerStyles.cardAddress}>{picked.address}</Text>
        {author ? <Text style={pickerStyles.cardMeta}>Ajouté par {author}</Text> : null}
        <View style={pickerStyles.actions}>
          <Button
            label="Un autre"
            variant="secondary"
            onPress={draw}
            disabled={candidates.length < 2}
            style={pickerStyles.action}
          />
          <Button
            label="Voir le lieu"
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: selectedId } })}
            style={pickerStyles.action}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={pickerStyles.label}>Catégories</Text>
      <View style={pickerStyles.chips}>
        {CATEGORIES.map((category, index) => (
          <Sticker
            key={category.key}
            label={category.label}
            icon={category.icon}
            tone="mint"
            tilt={stickerTilt(index)}
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
          trackColor={{ false: colors.inkFaint, true: colors.mint }}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: stroke,
    borderColor: colors.ink,
  },
  switchLabel: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
});
```

- [ ] **Step 5: Replace `src/features/search/DiscoveryPanel.tsx`** (same logic, including `busy`)

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Sticker, stickerTilt } from '@/components/Sticker';
import { TicketHeader } from '@/components/TicketHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { createPlace } from '@/features/places/api';
import { CATEGORY_BY_KEY } from '@/features/places/categories';
import { pickerStyles } from '@/features/places/pickerStyles';
import { usePlaces } from '@/features/places/PlacesProvider';
import { validatePlaceInput } from '@/features/places/validation';
import { notifyPartner } from '@/features/push/notifyPartner';
import { discoveredPlaceInput, formatRating, openInGoogleMaps } from '@/features/search/discoveredPlace';
import {
  DISCOVERY_CATEGORY_KEYS,
  type DiscoveredPlace,
  type DiscoveryCategory,
  discoveredCategory,
  discoverPlace,
} from '@/features/search/discovery';
import { useUsers } from '@/features/users/UsersProvider';
import { colors } from '@/theme';

type AddState = 'idle' | 'adding' | 'added';

const ADD_LABELS: Record<AddState, string> = {
  idle: 'Ajouter à nos idées',
  adding: 'Ajout…',
  added: 'Ajouté',
};

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
  const busy = searching || addState === 'adding';

  const knownIds = useMemo(
    () => new Set(places.flatMap((place) => (place.googlePlaceId ? [place.googlePlaceId] : []))),
    [places],
  );

  function toggleCategory(key: DiscoveryCategory) {
    setCategories((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  async function discover() {
    if (busy) return;
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
    if (!user || busy) return;
    const input = discoveredPlaceInput(place);
    const problem = validatePlaceInput(input);
    if (problem) {
      Alert.alert('Oups', problem);
      return;
    }
    setAddState('adding');
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
      return <ActivityIndicator style={pickerStyles.loader} color={colors.ink} />;
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
          <Button label="Découvrir" icon="sparkles-outline" onPress={discover} style={pickerStyles.drawButton} />
        </>
      );
    }

    const category = CATEGORY_BY_KEY[discoveredCategory(result)];
    const mapsUri = result.googleMapsUri;
    const current = result;

    return (
      <View style={pickerStyles.ticket}>
        <TicketHeader label="Billet découverte" />
        <View style={pickerStyles.cardHeader}>
          <Ionicons name={category.icon} size={18} color={colors.tangerine} />
          <Text style={pickerStyles.cardCategory}>{category.label}</Text>
        </View>
        <Text style={pickerStyles.cardName}>{result.name}</Text>
        <Text style={pickerStyles.cardAddress}>{result.address}</Text>
        <Text style={pickerStyles.cardMeta}>{formatRating(result)}</Text>
        {mapsUri ? (
          <Pressable onPress={() => openInGoogleMaps(mapsUri)} hitSlop={8} accessibilityRole="link">
            <Text style={pickerStyles.link}>Voir sur Google Maps</Text>
          </Pressable>
        ) : null}
        <View style={pickerStyles.actions}>
          <Button
            label="Un autre"
            variant="secondary"
            onPress={discover}
            loading={searching}
            disabled={busy}
            style={pickerStyles.action}
          />
          <Button
            label={ADD_LABELS[addState]}
            onPress={() => addToIdeas(current)}
            disabled={addState !== 'idle' || searching}
            style={pickerStyles.action}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={pickerStyles.label}>Catégories</Text>
      <View style={pickerStyles.chips}>
        {DISCOVERY_CATEGORY_KEYS.map((key, index) => (
          <Sticker
            key={key}
            label={CATEGORY_BY_KEY[key].label}
            icon={CATEGORY_BY_KEY[key].icon}
            tone="mint"
            tilt={stickerTilt(index)}
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
    backgroundColor: colors.paper,
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

- [ ] **Step 7: Replace `src/features/places/PlaceForm.tsx`** (same logic)

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { RatingStars } from '@/components/RatingStars';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sticker, stickerTilt } from '@/components/Sticker';
import { CATEGORIES } from '@/features/places/categories';
import type { PlaceInput, PlaceStatus } from '@/features/places/types';
import { normalizePlaceInput, validatePlaceInput } from '@/features/places/validation';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

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
        placeholderTextColor={colors.inkFaint}
      />

      <Text style={styles.label}>Adresse</Text>
      <Pressable style={styles.addressRow} onPress={onChangeLocation} accessibilityRole="button">
        <Ionicons name="location-outline" size={18} color={colors.cobalt} />
        <Text style={styles.address} numberOfLines={2}>
          {values.address}
        </Text>
        <Text style={styles.link}>Changer</Text>
      </Pressable>

      <Text style={styles.label}>Catégorie</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((category, index) => (
          <Sticker
            key={category.key}
            label={category.label}
            icon={category.icon}
            tone="mint"
            tilt={stickerTilt(index)}
            selected={category.key === values.category}
            onPress={() => onChange({ category: category.key })}
          />
        ))}
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
        placeholderTextColor={colors.inkFaint}
        multiline
      />

      <Button label={submitLabel} onPress={handleSubmit} loading={submitting} style={styles.submit} />

      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.cobalt,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
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
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  address: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  link: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.cobalt,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  submit: {
    marginTop: spacing.xl * 1.5,
  },
});
```

- [ ] **Step 8: Replace `src/features/search/PlaceSearch.tsx`** (same logic)

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { PlaceDetails, PlaceSuggestion } from '@/features/search/googlePlaces';
import { usePlaceSearch } from '@/features/search/usePlaceSearch';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

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
          <Ionicons name="search" size={18} color={colors.inkMuted} />
          <TextInput
            style={styles.input}
            autoFocus
            placeholder="Nom ou adresse (ex : Le Comptoir)"
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

- [ ] **Step 9: Replace `src/app/place/[id].tsx`** (same logic; "+1" and approved labels)

```tsx
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CenteredMessage } from '@/components/CenteredMessage';
import { useAuth } from '@/features/auth/AuthProvider';
import { deletePlace, placeExists, updatePlace } from '@/features/places/api';
import { PlaceForm } from '@/features/places/PlaceForm';
import { usePlace, usePlaces } from '@/features/places/PlacesProvider';
import { PlusOne } from '@/features/places/PlusOne';
import type { Place, PlaceInput } from '@/features/places/types';
import { isSharedWish } from '@/features/places/wishes';
import type { PlaceDetails } from '@/features/search/googlePlaces';
import { PlaceSearch } from '@/features/search/PlaceSearch';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, fonts, spacing } from '@/theme';

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
  const { user } = useAuth();
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
  const wishLabel =
    place.status !== 'todo' || values.status !== 'todo' || !user
      ? null
      : isSharedWish(place)
        ? 'Partants tous les deux'
        : place.createdBy === user.uid
          ? null
          : 'Moi aussi';

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
            {wishLabel && user ? (
              <View style={styles.wishRow}>
                <PlusOne place={place} myUid={user.uid} size="lg" />
                <Text style={styles.wishText}>{wishLabel}</Text>
              </View>
            ) : null}
            <Text style={styles.meta}>{author ? `Ajouté par ${author} le ${createdOn}` : `Ajouté le ${createdOn}`}</Text>
            <Button
              label="Supprimer"
              icon="trash-outline"
              variant="danger"
              onPress={confirmDelete}
              style={styles.deleteButton}
            />
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
  wishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  wishText: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  deleteButton: {
    alignSelf: 'stretch',
  },
});
```

- [ ] **Step 10: Delete the superseded components**

```bash
git rm src/components/ToggleChip.tsx src/features/places/WishHeart.tsx
grep -rn "ToggleChip\|WishHeart" src
```

Expected: the grep prints nothing.

- [ ] **Step 11: Remove the legacy aliases — replace `src/theme.ts`**

```ts
const INK = '#1C1B22';

export const colors = {
  paper: '#F3F5EF',
  surface: '#FFFFFF',
  ink: INK,
  inkMuted: 'rgba(28, 27, 34, 0.62)',
  inkFaint: 'rgba(28, 27, 34, 0.38)',
  cobalt: '#2E4BFF',
  tangerine: '#FF7A1A',
  mint: '#3DD6A0',
  lemon: '#FFE14D',
  danger: '#D92D20',
  todo: '#FF7A1A',
  done: '#2E4BFF',
} as const;

export const fonts = {
  display: 'BagelFatOne_400Regular',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
  heavy: 'DMSans_800ExtraBold',
} as const;

export const stroke = 1.5;

export const hardShadow = `3px 4px 0px ${INK}`;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;
```

Then: `grep -rnE "colors\.(background|textMuted|text|border|primary|todoSoft|doneSoft|star|heart)\b" src` → no output, and `grep -rn "fontWeight" src` → no output.

- [ ] **Step 12: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed.

- [ ] **Step 13: Commit**

```bash
git add src/components/TicketHeader.tsx src/features/search/discoveredPlace.ts src/features/places/pickerStyles.ts src/features/places/IdeasPanel.tsx src/features/search/DiscoveryPanel.tsx src/app/place/random.tsx src/features/places/PlaceForm.tsx src/features/search/PlaceSearch.tsx "src/app/place/[id].tsx" src/theme.ts src/components/ToggleChip.tsx src/features/places/WishHeart.tsx
git status
git commit -m "$(cat <<'EOF'
feat: restyle forms, detail, search and tonight modal; drop legacy tokens

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 4: First-open intro

**Files:**
- Create: `src/features/intro/IntroProvider.tsx`, `src/features/intro/slides.ts`, `src/features/intro/useStampEntrance.ts`, `src/app/intro.tsx`
- Replace: `src/app/_layout.tsx`
- Modify: `src/app/login.tsx`

**Interfaces:**
- Consumes (Tasks 1–3): `Button`, `StampCollage`, `CenteredMessage`, `STICKER_TONE_COLORS`, `StickerTone`, theme tokens, `useAppFonts`; AsyncStorage default export `getItem(key): Promise<string | null>`, `setItem(key, value): Promise<void>`
- Produces:
  - `IntroProvider`, `useIntro(): { seen: boolean | null; finish: () => void; replay: () => void }` (`@/features/intro/IntroProvider`)
  - `INTRO_SENTENCES: readonly string[]`, `INTRO_FEATURES: readonly { label: string; tone: StickerTone }[]` (`@/features/intro/slides`)
  - `useStampEntrance(trigger: number)` → animated style `{ opacity, transform }` (`@/features/intro/useStampEntrance`)
  - route `intro`

- [ ] **Step 1: Create `src/features/intro/IntroProvider.tsx`**

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const INTRO_SEEN_KEY = 'intro:v1:seen';

type IntroState = {
  seen: boolean | null;
  finish: () => void;
  replay: () => void;
};

const IntroContext = createContext<IntroState | null>(null);

export function IntroProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(INTRO_SEEN_KEY)
      .then((value) => setSeen(value === '1'))
      .catch(() => setSeen(false));
  }, []);

  const finish = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(INTRO_SEEN_KEY, '1').catch((error: unknown) => console.warn('Saving intro state failed', error));
  }, []);

  const replay = useCallback(() => setSeen(false), []);

  const value = useMemo<IntroState>(() => ({ seen, finish, replay }), [seen, finish, replay]);

  return <IntroContext value={value}>{children}</IntroContext>;
}

export function useIntro(): IntroState {
  const value = useContext(IntroContext);
  if (!value) {
    throw new Error('useIntro must be used inside IntroProvider');
  }
  return value;
}
```

- [ ] **Step 2: Create `src/features/intro/slides.ts`**

```ts
import type { StickerTone } from '@/components/Sticker';

export const INTRO_SENTENCES: readonly string[] = [
  'Bon, Blandine.',
  'On a un gros problème.',
  'Trop de trucs à faire…',
  '…mais un temps imparti.',
  'Et, de mon côté, une capacité à oublier assez conséquente quand même.',
  'Donc j’ai réfléchi.',
  'Et voici la solution que j’ai trouvée :',
];

export const INTRO_FEATURES: readonly { label: string; tone: StickerTone }[] = [
  { label: 'Nos lieux, à faire et déjà faits', tone: 'mint' },
  { label: 'La carte de Paris avec tout dessus', tone: 'lemon' },
  { label: '« Moi aussi » quand on est partants', tone: 'tangerine' },
  { label: '« On fait quoi ce soir ? »', tone: 'cobalt' },
  { label: 'Des recos inspirées de nos 5 étoiles', tone: 'mint' },
];
```

- [ ] **Step 3: Create `src/features/intro/useStampEntrance.ts`**

```ts
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

export function useStampEntrance(trigger: number) {
  const progress = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    }).start();
  }, [trigger, reduceMotion, progress]);

  return {
    opacity: progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
    transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1.7, 1] }) },
      { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-9deg', '-2deg'] }) },
    ],
  };
}
```

- [ ] **Step 4: Create `src/app/intro.tsx`**

```tsx
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StampCollage } from '@/components/StampCollage';
import { STICKER_TONE_COLORS } from '@/components/Sticker';
import { useIntro } from '@/features/intro/IntroProvider';
import { INTRO_FEATURES, INTRO_SENTENCES } from '@/features/intro/slides';
import { useStampEntrance } from '@/features/intro/useStampEntrance';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

const TOTAL_STEPS = INTRO_SENTENCES.length + 1;
const STEP_INDEXES = Array.from({ length: TOTAL_STEPS }, (_, index) => index);

export default function IntroScreen() {
  const { finish } = useIntro();
  const [step, setStep] = useState(0);
  const stampStyle = useStampEntrance(step);
  const isFeatures = step === INTRO_SENTENCES.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>{step === 0 ? <StampCollage /> : null}</View>

      <View style={styles.body}>
        <Animated.View style={stampStyle}>
          {isFeatures ? (
            <View style={styles.features}>
              <Text style={styles.appName}>Le Plan de Turgot</Text>
              {INTRO_FEATURES.map((feature) => (
                <View key={feature.label} style={styles.feature}>
                  <View style={[styles.featureDot, { backgroundColor: STICKER_TONE_COLORS[feature.tone] }]} />
                  <Text style={styles.featureText}>{feature.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.sentence} accessibilityLiveRegion="polite">
              {INTRO_SENTENCES[step]}
            </Text>
          )}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        {isFeatures ? (
          <Button label="C’est parti" onPress={finish} />
        ) : (
          <View style={styles.nav}>
            <Pressable onPress={finish} hitSlop={12} accessibilityRole="button">
              <Text style={styles.skip}>Passer</Text>
            </Pressable>
            <View style={styles.dots} accessible accessibilityLabel={`Étape ${step + 1} sur ${TOTAL_STEPS}`}>
              {STEP_INDEXES.map((index) => (
                <View key={index} style={[styles.dot, index < step && styles.dotDone, index === step && styles.dotCurrent]} />
              ))}
            </View>
            <Pressable
              onPress={() => setStep((current) => current + 1)}
              style={({ pressed }) => [styles.next, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.nextText}>Suivant</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  top: {
    height: 170,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  sentence: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
  },
  features: {
    gap: spacing.md,
  },
  appName: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.cobalt,
    marginBottom: spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
  },
  featureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: stroke,
    borderColor: colors.ink,
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.inkMuted,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: stroke,
    borderColor: colors.ink,
  },
  dotDone: {
    backgroundColor: colors.ink,
  },
  dotCurrent: {
    backgroundColor: colors.tangerine,
  },
  next: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.85,
  },
  nextText: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.surface,
  },
});
```

- [ ] **Step 5: Replace `src/app/_layout.tsx`** (intro gate)

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { CenteredMessage } from '@/components/CenteredMessage';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
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
            <RootNavigator />
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

  if (initializing || seen === null) {
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
      </Stack.Protected>
    </Stack>
  );
}
```

- [ ] **Step 6: Add "Revoir l’intro" to `src/app/login.tsx`**

1. Change the react-native import to `import { KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput } from 'react-native';`.
2. Add `import { useIntro } from '@/features/intro/IntroProvider';` after the `useAuth` import.
3. Add `const { replay } = useIntro();` right after `const { signIn } = useAuth();`.
4. Insert right after the `<Button … label="Se connecter" … />` element (still inside `KeyboardAvoidingView`):

```tsx
        <Pressable onPress={replay} hitSlop={8} accessibilityRole="button" style={styles.replay}>
          <Text style={styles.replayText}>Revoir l’intro</Text>
        </Pressable>
```

5. Add to `styles`:

```tsx
  replay: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  replayText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.cobalt,
    textDecorationLine: 'underline',
  },
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed. If tsc rejects `AccessibilityInfo.addEventListener('reduceMotionChanged', …)`, check `node_modules/react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo.d.ts` for the event name and report it.

- [ ] **Step 8: Commit**

```bash
git add src/features/intro/IntroProvider.tsx src/features/intro/slides.ts src/features/intro/useStampEntrance.ts src/app/intro.tsx src/app/_layout.tsx src/app/login.tsx
git status
git commit -m "$(cat <<'EOF'
feat: stamped first-open intro with replay link

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

### Task 5: Recos tab

**Files:**
- Modify: `src/features/search/discovery.ts`
- Create: `src/features/recos/recos.ts`, `src/features/recos/RecoCard.tsx`
- Replace: `src/app/(tabs)/recos.tsx`

**Interfaces:**
- Consumes (Tasks 1–3): `Button`, `CenteredMessage`, theme tokens, `formatRating`, `openInGoogleMaps`, `discoveredPlaceInput` (`@/features/search/discoveredPlace`); existing `usePlaces`, `useUsers`, `useAuth`, `createPlace`, `validatePlaceInput`, `notifyPartner`, `CATEGORY_BY_KEY`, `discoveredCategory`, `DiscoveredPlace`
- Produces:
  - `@/features/search/discovery` additionally exports `type LatLng`, `isDiscoveryCategory(category: CategoryKey): category is DiscoveryCategory`, `categoryTypes(category: DiscoveryCategory): readonly string[]`, `searchNearby(center: LatLng, includedTypes: readonly string[], radius?: number): Promise<DiscoveredPlace[]>` (behavior of `discoverPlace` unchanged)
  - `@/features/recos/recos`: `type Reco = { place: DiscoveredPlace; distanceMeters: number }`, `type RecoGroup = { source: Place; recos: Reco[] }`, `pickRecoSources(places: readonly Place[]): Place[]`, `distanceMeters(from: LatLng, to: LatLng): number`, `formatDistance(meters: number): string`, `fetchRecoGroups(sources: readonly Place[], knownIds: ReadonlySet<string>): Promise<RecoGroup[]>`
  - `RecoCard({ reco: Reco; myUid: string })` (`@/features/recos/RecoCard`)

- [ ] **Step 1: Export the reusable search pieces in `src/features/search/discovery.ts`**

1. Change `type LatLng = { latitude: number; longitude: number };` to `export type LatLng = { latitude: number; longitude: number };`.
2. Right after the `DISCOVERY_TYPES` constant, add:

```ts
export function isDiscoveryCategory(category: CategoryKey): category is DiscoveryCategory {
  return category !== 'autre';
}

export function categoryTypes(category: DiscoveryCategory): readonly string[] {
  return DISCOVERY_TYPES[category];
}
```

3. Change the `searchNearby` signature line from
   `async function searchNearby(center: LatLng, includedTypes: readonly string[]): Promise<DiscoveredPlace[]> {`
   to
   `export async function searchNearby(center: LatLng, includedTypes: readonly string[], radius = SEARCH_RADIUS_METERS): Promise<DiscoveredPlace[]> {`
4. Inside `searchNearby`, change `locationRestriction: { circle: { center, radius: SEARCH_RADIUS_METERS } },` to `locationRestriction: { circle: { center, radius } },`.

Nothing else in the file changes.

- [ ] **Step 2: Create `src/features/recos/recos.ts`**

```ts
import type { Place } from '@/features/places/types';
import {
  categoryTypes,
  type DiscoveredPlace,
  isDiscoveryCategory,
  type LatLng,
  searchNearby,
} from '@/features/search/discovery';

const MAX_SOURCES = 5;
const RECOS_PER_SOURCE = 3;
const RECO_RADIUS_METERS = 1500;
const MIN_RATING = 4.3;
const MIN_RATING_COUNT = 100;
const SAME_PLACE_METERS = 25;
const EARTH_RADIUS_METERS = 6371000;

export type Reco = {
  place: DiscoveredPlace;
  distanceMeters: number;
};

export type RecoGroup = {
  source: Place;
  recos: Reco[];
};

export function pickRecoSources(places: readonly Place[]): Place[] {
  return places
    .filter((place) => place.status === 'done' && place.rating === 5 && isDiscoveryCategory(place.category))
    .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis())
    .slice(0, MAX_SOURCES);
}

export function distanceMeters(from: LatLng, to: LatLng): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `à ${Math.max(50, Math.round(meters / 50) * 50)} m`;
  }
  return `à ${(meters / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}

export async function fetchRecoGroups(
  sources: readonly Place[],
  knownIds: ReadonlySet<string>,
): Promise<RecoGroup[]> {
  const results = await Promise.allSettled(
    sources.map((source) =>
      isDiscoveryCategory(source.category)
        ? searchNearby(
            { latitude: source.lat, longitude: source.lng },
            categoryTypes(source.category),
            RECO_RADIUS_METERS,
          )
        : Promise.resolve<DiscoveredPlace[]>([]),
    ),
  );

  if (results.length > 0 && results.every((result) => result.status === 'rejected')) {
    throw new Error('Recos unavailable');
  }

  const taken = new Set(knownIds);
  const groups: RecoGroup[] = [];

  sources.forEach((source, index) => {
    const result = results[index];
    if (result.status !== 'fulfilled') {
      return;
    }
    const center = { latitude: source.lat, longitude: source.lng };
    const recos = result.value
      .map((place) => ({ place, distanceMeters: distanceMeters(center, { latitude: place.lat, longitude: place.lng }) }))
      .filter(
        (reco) =>
          reco.place.rating >= MIN_RATING &&
          reco.place.userRatingCount >= MIN_RATING_COUNT &&
          reco.distanceMeters > SAME_PLACE_METERS &&
          !taken.has(reco.place.googlePlaceId),
      )
      .slice(0, RECOS_PER_SOURCE);
    recos.forEach((reco) => taken.add(reco.place.googlePlaceId));
    if (recos.length > 0) {
      groups.push({ source, recos });
    }
  });

  return groups;
}
```

- [ ] **Step 3: Create `src/features/recos/RecoCard.tsx`**

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { createPlace } from '@/features/places/api';
import { CATEGORY_BY_KEY } from '@/features/places/categories';
import { validatePlaceInput } from '@/features/places/validation';
import { notifyPartner } from '@/features/push/notifyPartner';
import { formatDistance, type Reco } from '@/features/recos/recos';
import { discoveredPlaceInput, formatRating, openInGoogleMaps } from '@/features/search/discoveredPlace';
import { discoveredCategory } from '@/features/search/discovery';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, fonts, hardShadow, radius, spacing, stroke } from '@/theme';

type AddState = 'idle' | 'adding' | 'added';

const ADD_LABELS: Record<AddState, string> = {
  idle: 'À faire',
  adding: 'Ajout…',
  added: 'Ajouté',
};

type Props = {
  reco: Reco;
  myUid: string;
};

export function RecoCard({ reco, myUid }: Props) {
  const { users } = useUsers();
  const [addState, setAddState] = useState<AddState>('idle');
  const { place } = reco;
  const category = CATEGORY_BY_KEY[discoveredCategory(place)];
  const mapsUri = place.googleMapsUri;

  async function addToTodo() {
    if (addState !== 'idle') return;
    const input = discoveredPlaceInput(place);
    const problem = validatePlaceInput(input);
    if (problem) {
      Alert.alert('Oups', problem);
      return;
    }
    setAddState('adding');
    try {
      const id = await createPlace(input);
      void notifyPartner({ id, name: input.name, category: input.category }, users, myUid);
      setAddState('added');
    } catch {
      setAddState('idle');
      Alert.alert('Oups', 'Ajout impossible, réessaie.');
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={category.icon} size={16} color={colors.tangerine} />
        <Text style={styles.category}>{category.label}</Text>
        <Text style={styles.distance}>{formatDistance(reco.distanceMeters)}</Text>
      </View>
      <Text style={styles.name}>{place.name}</Text>
      <Text style={styles.address} numberOfLines={2}>
        {place.address}
      </Text>
      <Text style={styles.rating}>{formatRating(place)}</Text>
      <View style={styles.actions}>
        <Button
          label={ADD_LABELS[addState]}
          onPress={addToTodo}
          loading={addState === 'adding'}
          disabled={addState === 'added'}
          style={styles.action}
        />
        {mapsUri ? (
          <Button
            label="Google Maps"
            variant="secondary"
            icon="map-outline"
            onPress={() => openInGoogleMaps(mapsUri)}
            style={styles.action}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: stroke,
    borderColor: colors.ink,
    boxShadow: hardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  category: {
    flex: 1,
    fontFamily: fonts.heavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.tangerine,
  },
  distance: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.cobalt,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 25,
    color: colors.ink,
  },
  address: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.inkMuted,
  },
  rating: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  action: {
    flex: 1,
  },
});
```

- [ ] **Step 4: Replace `src/app/(tabs)/recos.tsx`**

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePlaces } from '@/features/places/PlacesProvider';
import type { Place } from '@/features/places/types';
import { RecoCard } from '@/features/recos/RecoCard';
import { fetchRecoGroups, pickRecoSources, type RecoGroup } from '@/features/recos/recos';
import { colors, fonts, spacing } from '@/theme';

type LoadState = 'loading' | 'ready' | 'error';

export default function RecosScreen() {
  const { user } = useAuth();
  const { places, loading: placesLoading } = usePlaces();
  const [groups, setGroups] = useState<RecoGroup[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);
  const latest = useRef<{ sources: Place[]; places: Place[] }>({ sources: [], places: [] });

  const sources = useMemo(() => pickRecoSources(places), [places]);
  const sourceKey = sources.map((source) => source.id).join('|');

  useEffect(() => {
    latest.current = { sources, places };
  });

  const load = useCallback(async (isRefresh: boolean) => {
    const { sources: currentSources, places: currentPlaces } = latest.current;
    const id = requestId.current + 1;
    requestId.current = id;

    if (currentSources.length === 0) {
      setGroups([]);
      setLoadState('ready');
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadState('loading');
    }

    const knownIds = new Set(currentPlaces.flatMap((place) => (place.googlePlaceId ? [place.googlePlaceId] : [])));
    try {
      const next = await fetchRecoGroups(currentSources, knownIds);
      if (requestId.current !== id) return;
      setGroups(next);
      setLoadState('ready');
    } catch {
      if (requestId.current !== id) return;
      setLoadState('error');
    } finally {
      if (requestId.current === id) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (placesLoading) return;
    void load(false);
  }, [placesLoading, sourceKey, load]);

  if (!user) {
    return null;
  }

  const myUid = user.uid;

  if (placesLoading) {
    return <CenteredMessage loading text="Chargement…" />;
  }

  if (sources.length === 0) {
    return <CenteredMessage text="Mets 5 étoiles à un lieu pour avoir des recos dans le même genre" />;
  }

  if (loadState === 'loading') {
    return <CenteredMessage loading text="On cherche des lieux dans le même genre…" />;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ink} />}
    >
      {loadState === 'error' ? (
        <Text style={styles.message}>Recos indisponibles. Tire vers le bas pour réessayer.</Text>
      ) : null}
      {loadState === 'ready' && groups.length === 0 ? (
        <Text style={styles.message}>Pas de nouvelle reco pour l’instant. Tire vers le bas pour réessayer.</Text>
      ) : null}
      {groups.map((group) => (
        <View key={group.source.id} style={styles.group}>
          <Text style={styles.because}>Parce que vous avez adoré</Text>
          <Text style={styles.sourceName}>{group.source.name}</Text>
          {group.recos.map((reco) => (
            <RecoCard key={reco.place.googlePlaceId} reco={reco} myUid={myUid} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  message: {
    marginTop: spacing.xl,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  group: {
    marginBottom: spacing.xl,
  },
  because: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  sourceName: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.cobalt,
  },
});
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir .expo/export-check
```

Expected: both succeed. Do not call the Google API.

- [ ] **Step 6: Commit**

```bash
git add src/features/search/discovery.ts src/features/recos/recos.ts src/features/recos/RecoCard.tsx "src/app/(tabs)/recos.tsx"
git status
git commit -m "$(cat <<'EOF'
feat: recos tab suggesting places similar to 5-star ones

Co-Authored-By: <implementer model name> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015rchfifkpwEqh7Q8UBBgMT
EOF
)"
```

---

## Manual steps (user)

1. After Task 1: stop Metro and restart with a cleared cache so the new font packages are bundled: `npx expo start --clear`, then reload the app. No native rebuild.
2. After Task 4: the intro shows on the first launch after the update on each phone. To see it again, log out and tap "Revoir l’intro" on the login screen (or delete and reinstall the app).
3. Recos: give 5 stars to at least one "Fait" place in a category other than "Autre", then open the Recos tab. Each open or pull-to-refresh calls Google Nearby Search once per source (up to 5): keep the daily quota on Places API (New) set in Google Cloud.
4. TestFlight: archive a new build in Xcode (Build number +1) once all five tasks are reviewed.
