import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { PlaceSuggestion } from '@/features/search/googlePlaces';
import { type DetailsFn, type SuggestFn, useGoogleSearch } from '@/features/search/useGoogleSearch';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

type Props<T> = {
  placeholder: string;
  selectErrorMessage: string;
  suggest: SuggestFn;
  details: DetailsFn<T>;
  onSelect: (value: T) => void;
  onCancel?: () => void;
};

export function SearchPanel<T>({ placeholder, selectErrorMessage, suggest, details, onSelect, onCancel }: Props<T>) {
  const { query, setQuery, suggestions, loading, error, select } = useGoogleSearch(suggest, details);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  async function handlePress(suggestion: PlaceSuggestion) {
    setSelectingId(suggestion.placeId);
    try {
      onSelect(await select(suggestion.placeId));
    } catch {
      Alert.alert('Oups', selectErrorMessage);
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
            placeholder={placeholder}
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
