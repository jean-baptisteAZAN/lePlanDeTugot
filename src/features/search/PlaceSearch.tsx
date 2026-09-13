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
