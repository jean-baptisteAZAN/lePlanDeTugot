import { StyleSheet } from 'react-native';

import { colors, fonts, hardShadow, radius, spacing, stroke } from '@/theme';

export const pickerStyles = StyleSheet.create({
  label: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.cobalt,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
  loader: {
    marginTop: spacing.xl * 2,
  },
  empty: {
    marginTop: spacing.xl * 2,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  drawButton: {
    marginTop: spacing.xl,
  },
  ticket: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: stroke,
    borderColor: colors.ink,
    boxShadow: hardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardCategory: {
    flex: 1,
    fontFamily: fonts.heavy,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.tangerine,
  },
  cardName: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 30,
    color: colors.ink,
  },
  cardAddress: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.inkMuted,
  },
  cardMeta: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  link: {
    marginTop: spacing.xs,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.cobalt,
    textDecorationLine: 'underline',
  },
  plusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.lemon,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: 6,
    transform: [{ rotate: '4deg' }],
  },
  plusTagText: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  action: {
    flex: 1,
  },
});
