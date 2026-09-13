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
