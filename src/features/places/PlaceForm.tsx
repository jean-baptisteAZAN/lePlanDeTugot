import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { RatingStars } from '@/components/RatingStars';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sticker, stickerTilt } from '@/components/Sticker';
import { CATEGORIES } from '@/features/places/categories';
import type { PlaceInput, PlaceStatus } from '@/features/places/types';
import { normalizePlaceInput, validatePlaceInput } from '@/features/places/validation';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

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
        placeholderTextColor={colors.inkFaint}
      />

      <Text style={styles.label}>Adresse</Text>
      <Pressable style={styles.addressRow} onPress={onChangeLocation} accessibilityRole="button">
        <Ionicons name="location-outline" size={18} color={colors.cobalt} />
        <Text style={styles.address} numberOfLines={2}>
          {values.address}
        </Text>
        <Text style={styles.link}>Changer</Text>
      </Pressable>

      <Text style={styles.label}>Catégorie</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((category, index) => (
          <Sticker
            key={category.key}
            label={category.label}
            icon={category.icon}
            tone="mint"
            tilt={stickerTilt(index)}
            selected={category.key === values.category}
            onPress={() => onChange({ category: category.key })}
          />
        ))}
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
        placeholderTextColor={colors.inkFaint}
        multiline
      />

      <Button label={submitLabel} onPress={handleSubmit} loading={submitting} style={styles.submit} />

      {footer}
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
  label: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.cobalt,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
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
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  address: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  link: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.cobalt,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  submit: {
    marginTop: spacing.xl * 1.5,
  },
});
