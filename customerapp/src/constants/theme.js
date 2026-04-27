export const THEMES = {
  morning: {
    primary: '#CA8A04',     // Rich Golden Yellow
    secondary: '#D4A373',   // Sandy Gold
    background: '#FEFCE8',  // Very Light Yellow
    card: '#FFFFFF',
    text: '#422006',        // Dark Wood
    textLight: '#713F12',   // Brown-700
    accent: '#A16207',      // Dark Gold
    border: '#FEF08A',
    badge: '#FEF9C3',
    statusBar: 'dark-content',
  },
  afternoon: {
    primary: '#166534',     // Forest Green
    secondary: '#15803D',   // Emerald
    background: '#F0FDF4',  // Light Green Tint
    card: '#FFFFFF',
    text: '#064E3B',        // Deepest Green
    textLight: '#14532D',   // Dark Green
    accent: '#22C55E',      // Bright Green
    border: '#DCFCE7',
    badge: '#F0FDF4',
    statusBar: 'light-content',
  },
  all: { 
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
