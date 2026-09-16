import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { Fab } from '@/components/Fab';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sticker } from '@/components/Sticker';
import { useAuth } from '@/features/auth/AuthProvider';
import { placeCityId } from '@/features/cities/cities';
import { useCities } from '@/features/cities/CitiesProvider';
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
  const { activeCity } = useCities();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sharedOnly, setSharedOnly] = useState(false);
  const sections = useMemo(
    () =>
      groupPlacesByCategory(
        places.filter((place) => placeCityId(place) === activeCity.id),
        filter,
        sharedOnly,
      ),
    [places, activeCity.id, filter, sharedOnly],
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
