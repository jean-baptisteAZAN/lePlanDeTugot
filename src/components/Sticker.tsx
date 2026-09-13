import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, spacing, stroke } from '@/theme';

export type StickerTone = 'mint' | 'lemon' | 'tangerine' | 'cobalt';

export const STICKER_TONE_COLORS: Record<StickerTone, string> = {
  mint: colors.mint,
  lemon: colors.lemon,
  tangerine: colors.tangerine,
  cobalt: colors.cobalt,
};

const SELECTED_TEXT: Record<StickerTone, string> = {
  mint: colors.ink,
  lemon: colors.ink,
  tangerine: colors.ink,
  cobalt: colors.surface,
};

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: StickerTone;
  icon?: ComponentProps<typeof Ionicons>['name'];
  tilt?: number;
};

export function stickerTilt(index: number): number {
  return index % 2 === 0 ? -2 : 2;
}

export function Sticker({ label, selected, onPress, tone = 'mint', icon, tilt = 0 }: Props) {
  const textColor = selected ? SELECTED_TEXT[tone] : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.sticker,
        { transform: [{ rotate: `${tilt}deg` }] },
        selected && { backgroundColor: STICKER_TONE_COLORS[tone] },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={15} color={textColor} /> : null}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sticker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: stroke,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
});
