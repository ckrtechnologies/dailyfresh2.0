/**
 * CKR House Standard Radius Tokens
 * Mirrors Section 1.4 of DESIGN.md
 * sm: 8 (inputs, chips) · md: 12 (cards, buttons) · lg: 20 (sheets, modals) · full: 999 (pills, avatars)
 */

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
};

// Legacy compatibility
export const RADIUS = {
  card: 16,
  button: 12,
  input: 12,
  badge: 24,
  ...radius,
};

export default radius;
