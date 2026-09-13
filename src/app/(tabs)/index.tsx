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
