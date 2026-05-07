export const THEMES = {
  tomorrow_morning: {
    primary: '#7A0C0E',     // Midnight Maroon
    secondary: '#991B1B',   // Red-800
    background: '#FFF5F5',  // Very Light Red
    card: '#FFFFFF',
    text: '#450A0A',        // Deepest Maroon
    textLight: '#7F1D1D',   // Dark Red
    accent: '#B91C1C',      // Alert Red
    border: '#FEE2E2',
    badge: '#FEF2F2',
    statusBar: 'light-content',
  },
  tomorrow_evening: {
    primary: '#064E3B',     // Dark Forest Green
    secondary: '#065F46',   // Deep Teal/Green
    background: '#ECFDF5',  // Keep Light Green Tint
    card: '#FFFFFF',
    text: '#064E3B',        // Deepest Green
    textLight: '#059669',   // Dark Green
    accent: '#10B981',      // Emerald Accent
    border: '#D1FAE5',
    badge: '#ECFDF5',
    statusBar: 'light-content',
  },
  all: { 
    primary: '#1F2937',     // Gray-800 (Default)
    secondary: '#4B5563',   // Gray-600
    background: '#F9FAFB',  // Gray-50
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    accent: '#3B82F6',
    border: '#E5E7EB',
    badge: '#F3F4F6',
    statusBar: 'dark-content',
  },
  express: {
    primary: '#6B21A8',     // Royal Purple
    secondary: '#7E22CE',   // Purple-700
    background: '#FAF5FF',  // Light Purple Tint
    card: '#FFFFFF',
    text: '#3B0764',        // Deepest Purple
    textLight: '#581C87',   // Dark Purple
    accent: '#A855F7',      // Bright Purple
    border: '#F3E8FF',
    badge: '#FAF5FF',
    statusBar: 'light-content',
  },
};

export const COLORS = {
  ...THEMES.all,
  white: '#FFFFFF',
  dark: '#000000', // Absolute black for maximum sharpness
  gray: '#4B5563', // Slightly darker gray for better legibility
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  card: 16,
  button: 12,
  input: 12,
  badge: 24,
};

export const FONTS = {
  bold: 'System', // Using system fonts to ensure legibility and mismatch avoidance
  regular: 'System',
  medium: 'System',
};
