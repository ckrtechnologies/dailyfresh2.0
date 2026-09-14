/**
 * CKR House Standard Color Tokens
 * Mirrors Section 1.1 of DESIGN.md
 * Never use raw hex codes directly in screen styles.
 */

// Delivery Slot Specific Themes (Active contextual branding)
export const THEMES = {
  tomorrow_morning: {
    primary: '#7A0C0E',     // Midnight Maroon
    primaryPressed: '#5C090B',
    secondary: '#991B1B',   // Red-800
    background: '#FFF5F5',  // Very Light Red
    surface: '#FFFFFF',
    surfaceAlt: '#FEE2E2',
    textPrimary: '#450A0A', // Deepest Maroon
    textSecondary: '#7F1D1D',
    textDisabled: '#B91C1C80',
    textOnPrimary: '#FFFFFF',
    border: '#FEE2E2',
    badge: '#FEF2F2',
    statusBar: 'light-content',
    accent: '#B91C1C',
  },
  tomorrow: {
    primary: '#7A0C0E',
    primaryPressed: '#5C090B',
    secondary: '#991B1B',
    background: '#FFF5F5',
    surface: '#FFFFFF',
    surfaceAlt: '#FEE2E2',
    textPrimary: '#450A0A',
    textSecondary: '#7F1D1D',
    textDisabled: '#B91C1C80',
    textOnPrimary: '#FFFFFF',
    border: '#FEE2E2',
    badge: '#FEF2F2',
    statusBar: 'light-content',
    accent: '#B91C1C',
  },
  tomorrow_evening: {
    primary: '#064E3B',     // Dark Forest Green
    primaryPressed: '#04382B',
    secondary: '#065F46',   // Deep Teal/Green
    background: '#ECFDF5',  // Keep Light Green Tint
    surface: '#FFFFFF',
    surfaceAlt: '#D1FAE5',
    textPrimary: '#064E3B', // Deepest Green
    textSecondary: '#059669',
    textDisabled: '#05966980',
    textOnPrimary: '#FFFFFF',
    border: '#D1FAE5',
    badge: '#ECFDF5',
    statusBar: 'light-content',
    accent: '#10B981',
  },
  all: { 
    primary: '#1F2937',     // Gray-800 (Default)
    primaryPressed: '#111827',
    secondary: '#4B5563',   // Gray-600
    background: '#F9FAFB',  // Gray-50
    surface: '#FFFFFF',
    surfaceAlt: '#F3F4F6',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textDisabled: '#9CA3AF',
    textOnPrimary: '#FFFFFF',
    border: '#E5E7EB',
    badge: '#F3F4F6',
    statusBar: 'dark-content',
    accent: '#3B82F6',
  },
  express: {
    primary: '#6B21A8',     // Royal Purple
    primaryPressed: '#581C87',
    secondary: '#7E22CE',   // Purple-700
    background: '#FAF5FF',  // Light Purple Tint
    surface: '#FFFFFF',
    surfaceAlt: '#F3E8FF',
    textPrimary: '#3B0764', // Deepest Purple
    textSecondary: '#581C87',
    textDisabled: '#7E22CE80',
    textOnPrimary: '#FFFFFF',
    border: '#F3E8FF',
    badge: '#FAF5FF',
    statusBar: 'light-content',
    accent: '#A855F7',
  },
};

// Global Semantic Color Tokens (CKR Standard)
export const colors = {
  // Brand
  primary: '#7A0C0E',
  primaryPressed: '#5C090B',
  secondary: '#991B1B',
  accent: '#10B981',

  // Surfaces & Backgrounds
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',

  // Typography
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Semantic Status Tints
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  info: '#3B82F6',
  infoBg: '#EFF6FF',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',

  // Legacy compatibility tokens
  white: '#FFFFFF',
  dark: '#111827',
  gray: '#4B5563',
  lightGray: '#F3F4F6',
};

// Backward-compatible export
export const COLORS = {
  ...THEMES.all,
  ...colors,
};

export default colors;
