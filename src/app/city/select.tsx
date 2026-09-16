import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
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
      if (router.canGoBack()) {
        router.back();
      }
    } catch (cause) {
      console.warn('City save failed', cause);
      setMode('search');
      Alert.alert('Oups', 'Impossible d’ajouter cette ville, réessaie.');
    }
  }

  const saving = mode === 'saving';

  let content;
  if (saving) {
    content = <CenteredMessage loading text="Ajout de la ville…" />;
  } else if (mode === 'search') {
    content = <CitySearch onSelect={handleSelect} onCancel={() => setMode('list')} />;
  } else {
    content = (
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

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: !saving }} />
      {content}
    </>
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
