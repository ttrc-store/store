/**
 * @ttrc/ui-tokens
 * Brand design tokens for TTRC Store — Purple + White Design System.
 * All values are plain TypeScript so they can be consumed by both web and mobile platforms.
 * The web app also defines matching CSS custom properties in globals.css.
 */

// ─── Colors (White + Red System per AGENTS.md) ────────────────────────────────

export const colors = {
  // Brand Red Palette
  primaryRed: '#E3132A',
  primaryDarkRed: '#B80F21',
  deepRed: '#B80F21',
  lightRed: '#E3132A',
  softRed: '#FDECEE',
  veryLightRed: '#FDECEE',
  redTint: '#FDECEE',

  // Neutrals & Surfaces
  white: '#FFFFFF',
  offWhite: '#F7F7F8',
  ink: '#14141A',
  richBlack: '#14141A',
  darkGray: '#374151',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',

  // Core Theme Aliases
  red: '#E3132A',
  redHover: '#B80F21',
  redLight: '#E3132A',
  redSoft: '#FDECEE',
  redBg: '#FDECEE',
  redTintBg: '#FDECEE',

  // Compatibility Aliases (Aliased to Red System)
  primaryPurple: '#E3132A',
  primaryDarkPurple: '#B80F21',
  deepPurple: '#B80F21',
  lightPurple: '#E3132A',
  softPurple: '#FDECEE',
  veryLightPurple: '#FDECEE',
  purpleTint: '#FDECEE',
  purple: '#E3132A',
  purpleHover: '#B80F21',
  purpleLight: '#E3132A',
  purpleSoft: '#FDECEE',
  purpleBg: '#FDECEE',
  purpleTintBg: '#FDECEE',

  // Semantic Status Colors
  success: '#16A34A',
  warning: '#D97706',
  danger: '#E3132A',
  info: '#2563EB',
} as const;

export type ColorToken = keyof typeof colors;

// ─── Typography ──────────────────────────────────────────────────────────────

export const fonts = {
  display: 'Space Grotesk, Rajdhani, Exo 2, system-ui, sans-serif',
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

// ─── Spacing ─────────────────────────────────────────────────────────────────

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

// ─── Border Radii ────────────────────────────────────────────────────────────

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

// ─── Shadows / Glows ─────────────────────────────────────────────────────────

export const shadows = {
  glowPurple: '0 0 15px rgba(109, 40, 217, 0.35)',
  glowPurpleSm: '0 0 8px rgba(109, 40, 217, 0.25)',
  card: '0 1px 3px rgba(0, 0, 0, 0.05)',
  elevated: '0 10px 25px -5px rgba(109, 40, 217, 0.1)',
} as const;
