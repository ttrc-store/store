/**
 * @ttrc/ui-tokens
 * Brand design tokens for TTRC Store — Master Violet & Deep Purple Visual System.
 * All values are plain TypeScript so they can be consumed across all packages.
 */

export const colors = {
  // Master TTRC Store Purple Visual System
  primaryViolet: '#844AFB',
  deepPurple: '#6721F2',
  darkNavyPurple: '#1E0D45',
  black: '#050507',
  offWhite: '#FDFDFD',
  lightLavender: '#EEE8FA',
  softLavender: '#AF87F8',
  neutralGray: '#6D6A6A',
  white: '#FFFFFF',

  // Core Theme Aliases
  primary: '#844AFB',
  primaryHover: '#6721F2',
  primaryDark: '#6721F2',
  primaryLight: '#EEE8FA',
  primarySoft: '#AF87F8',

  // Legacy Compatibility Aliases (Aliased to Purple Palette)
  primaryRed: '#844AFB',
  primaryDarkRed: '#6721F2',
  deepRed: '#6721F2',
  lightRed: '#AF87F8',
  softRed: '#EEE8FA',
  veryLightRed: '#EEE8FA',
  redTint: '#EEE8FA',
  red: '#844AFB',
  redHover: '#6721F2',
  redLight: '#AF87F8',
  redSoft: '#EEE8FA',
  redBg: '#EEE8FA',
  redTintBg: '#EEE8FA',
  primaryPurple: '#844AFB',
  primaryDarkPurple: '#6721F2',
  purple: '#844AFB',
  purpleHover: '#6721F2',
  purpleLight: '#AF87F8',
  purpleSoft: '#EEE8FA',
  purpleBg: '#EEE8FA',
  purpleTintBg: '#EEE8FA',

  // Semantic Status Colors
  success: '#16A34A',
  warning: '#D97706',
  danger: '#EF4444',
  info: '#2563EB',
} as const;

export type ColorToken = keyof typeof colors;

export const fonts = {
  display: 'Space Grotesk, system-ui, sans-serif',
  body: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
  mono: 'Space Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
} as const;

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const shadows = {
  glowPurple: '0 0 15px rgba(132, 74, 251, 0.35)',
  glowPurpleSm: '0 0 8px rgba(132, 74, 251, 0.25)',
  card: '0 1px 3px rgba(0, 0, 0, 0.05)',
  elevated: '0 10px 25px -5px rgba(132, 74, 251, 0.1)',
} as const;
