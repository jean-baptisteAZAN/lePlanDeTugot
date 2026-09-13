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
