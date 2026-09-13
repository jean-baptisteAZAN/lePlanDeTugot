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
