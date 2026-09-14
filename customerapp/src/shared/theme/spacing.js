/**
 * CKR House Standard Spacing Tokens
 * Mirrors Section 1.3 of DESIGN.md
 * Scale: 4, 8, 12, 16, 20, 24, 32, 48, 64. No arbitrary values.
 */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,

  // Semantic layout defaults
  screenPadding: 16,
  cardGap: 12,
  formFieldGap: 16,
  sectionGap: 24,
};

// Legacy compatibility
export const SPACING = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

export default space;
