import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { SegmentedControl } from '@/components/SegmentedControl';
import { CATEGORIES } from '@/features/places/categories';
import type { PlaceInput, PlaceStatus } from '@/features/places/types';
import { normalizePlaceInput, validatePlaceInput } from '@/features/places/validation';
import { colors, radius, spacing } from '@/theme';

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
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.label}>Adresse</Text>
      <Pressable style={styles.addressRow} onPress={onChangeLocation}>
        <Ionicons name="location-outline" size={18} color={colors.textMuted} />
        <Text style={styles.address} numberOfLines={2}>
          {values.address}
        </Text>
        <Text style={styles.link}>Changer</Text>
      </Pressable>

      <Text style={styles.label}>Catégorie</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((category) => {
          const selected = category.key === values.category;
          return (
            <Pressable
              key={category.key}
              onPress={() => onChange({ category: category.key })}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Ionicons name={category.icon} size={16} color={selected ? colors.surface : colors.text} />
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category.label}</Text>
            </Pressable>
          );
        })}
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
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <Pressable
        style={[styles.submit, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </Pressable>

      {footer}
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  address: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.surface,
  },
  submit: {
    marginTop: spacing.xl * 1.5,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
