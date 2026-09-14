/**
 * CKR House Standard UI & Component Metrics System
 * DailyFresh Kolkata Mobile UI Standards
 * 
 * Defines the strict geometrical invariants for all product cards, grids,
 * navigation headers, and interactive action buttons to guarantee visual
 * symmetry and zero layout shift across all device screen sizes.
 */

export const PRODUCT_CARD_STANDARDS = {
  // Horizontal Carousel Cards (e.g. Home screen strips)
  HORIZONTAL_WIDTH: 160,
  HORIZONTAL_HEIGHT: 295,

  // Shared Sub-component Invariants
  IMAGE_HEIGHT: 120,
  INFO_PADDING: 8,
  UNIT_HEIGHT: 16,
  NAME_HEIGHT: 36, // Exactly 2 lines (18px line-height)
  DELIVERY_ROW_HEIGHT: 24,
  PRICE_ROW_HEIGHT: 24,
  FOOTER_HEIGHT: 34,

  // 2-Column Vertical Grid Geometry
  GRID_COL_WIDTH: '50%',
  GRID_PADDING: 6,
  CARD_BORDER_WIDTH: 1,
  CARD_BORDER_COLOR: '#F1F5F9',
};

export const GRID_STANDARDS = {
  NUM_COLUMNS: 2,
  COLUMN_WRAPPER: {
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  LIST_CONTAINER: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
};

export const HEADER_STANDARDS = {
  HEIGHT: 56,
  SEARCH_BAR_HEIGHT: 44,
  SEARCH_BAR_RADIUS: 22,
};

export default {
  PRODUCT_CARD_STANDARDS,
  GRID_STANDARDS,
  HEADER_STANDARDS,
};
