/**
 * Design System Constants
 * Color tokens, spacing, typography, and component patterns
 * Based on "Institutional Prestige" design system
 */

export const COLORS = {
  primary: '#af0f24',
  'primary-container': '#d32f39',
  'on-primary': '#ffffff',
  'on-primary-container': '#fff2f0',

  secondary: '#5f5e5e',
  'secondary-container': '#e2dfde',
  'on-secondary': '#ffffff',
  'on-secondary-container': '#636262',

  surface: '#f9f9f9',
  'surface-bright': '#f9f9f9',
  'surface-dim': '#dadada',
  'surface-container': '#eeeeee',
  'surface-container-low': '#f3f3f3',
  'surface-container-high': '#e8e8e8',
  'surface-container-highest': '#e2e2e2',
  'surface-container-lowest': '#ffffff',
  'on-surface': '#1a1c1c',

  outline: '#8f6f6c',
  'outline-variant': '#e4beba',

  error: '#ba1a1a',
  'error-container': '#ffdad6',

  success: '#d4edda',
  warning: '#fff3cd',
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

export const BORDER_RADIUS = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '8px',
  full: '12px',
} as const;

export const TYPOGRAPHY = {
  headline: {
    family: 'Manrope',
    weights: {
      normal: 700,
      bold: 800,
    },
  },
  body: {
    family: 'Inter',
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
} as const;

export const SHADOWS = {
  subtle: '0px -4px 32px rgba(175, 15, 36, 0.04)',
  md: '0px 4px 16px rgba(0, 0, 0, 0.08)',
  lg: '0px 8px 24px rgba(0, 0, 0, 0.12)',
} as const;

export const BREAKPOINTS = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px',
} as const;

export const NAVIGATION_ITEMS = {
  student: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'id', label: 'ID', icon: 'badge' },
    { id: 'certificates', label: 'Certificates', icon: 'verified' },
    { id: 'news', label: 'News', icon: 'newspaper' },
    { id: 'perks', label: 'Perks', icon: 'sell' },
  ],
} as const;

export const CATEGORY_COLORS = {
  'editorial': '#af0f24',
  'campus-life': '#af0f24',
  'academics': '#af0f24',
  'events': '#af0f24',
  'official': '#af0f24',
  'historical': '#5f5e5e',
  'software': '#af0f24',
  'food-drink': '#af0f24',
  'transport': '#af0f24',
  'tech': '#af0f24',
} as const;

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;
