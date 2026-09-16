import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { useAuth } from '@/features/auth/AuthProvider';
import { placeCityId } from '@/features/cities/cities';
import { useCities } from '@/features/cities/CitiesProvider';
import { usePlaces } from '@/features/places/PlacesProvider';
import type { Place } from '@/features/places/types';
import { RecoCard } from '@/features/recos/RecoCard';
import { fetchRecoGroups, pickRecoSources, type RecoGroup } from '@/features/recos/recos';
import { colors, fonts, spacing } from '@/theme';

type LoadState = 'loading' | 'ready' | 'error';

export default function RecosScreen() {
  const { user } = useAuth();
  const { places, loading: placesLoading } = usePlaces();
  const { activeCity } = useCities();
  const [groups, setGroups] = useState<RecoGroup[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);
  const latest = useRef<{ sources: Place[]; places: Place[] }>({ sources: [], places: [] });

  const sources = useMemo(() => pickRecoSources(places, activeCity.id), [places, activeCity.id]);
  const sourceKey = sources
    .map((source) => source.id)
    .sort()
    .join('|');

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
      setGroups([]);
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
            <RecoCard
              key={reco.place.googlePlaceId}
              reco={reco}
              myUid={myUid}
              cityId={placeCityId(group.source)}
            />
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
