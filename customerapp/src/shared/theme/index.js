/**
 * CKR House Standard Theme System
 * Unified entry point for all design tokens: colors, typography, spacing, radius, elevation.
 */
import { colors, COLORS, THEMES } from './colors';
import { typography, FONTS } from './typography';
import { space, SPACING } from './spacing';
import { radius, RADIUS } from './radius';
import { elevation } from './elevation';
import { PRODUCT_CARD_STANDARDS, GRID_STANDARDS, HEADER_STANDARDS } from './standards';

export {
  colors,
  COLORS,
  THEMES,
  typography,
  FONTS,
  space,
  SPACING,
  radius,
  RADIUS,
  elevation,
  PRODUCT_CARD_STANDARDS,
  GRID_STANDARDS,
  HEADER_STANDARDS,
};

export const theme = {
  colors,
  typography,
  space,
  radius,
  elevation,
  standards: {
    productCard: PRODUCT_CARD_STANDARDS,
    grid: GRID_STANDARDS,
    header: HEADER_STANDARDS,
  },
};

export default theme;
