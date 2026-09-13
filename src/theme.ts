const INK = '#1C1B22';

export const colors = {
  paper: '#F3F5EF',
  surface: '#FFFFFF',
  ink: INK,
  inkMuted: 'rgba(28, 27, 34, 0.62)',
  inkFaint: 'rgba(28, 27, 34, 0.38)',
  cobalt: '#2E4BFF',
  tangerine: '#FF7A1A',
  mint: '#3DD6A0',
  lemon: '#FFE14D',
  danger: '#D92D20',
  todo: '#FF7A1A',
  done: '#2E4BFF',
} as const;

export const fonts = {
  display: 'BagelFatOne_400Regular',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
  heavy: 'DMSans_800ExtraBold',
} as const;

export const stroke = 1.5;

export const hardShadow = `3px 4px 0px ${INK}`;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;
