// SS Journey Partner Brand Theme — Executive Hospitality B2B Palette

export const Colors = {
  // Primary = Deep Navy Blue (Brand Identity)
  primary: '#0c2d6b',
  primaryDark: '#071a3d',
  primaryContainer: '#143d8a',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#d4e3ff',

  // Secondary = SS Journey Vibrant Amber / Orange Accent (Conversion & Badges)
  secondary: '#f28c1c',
  secondaryDark: '#c05d00',
  secondaryContainer: '#ffedd5',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#7c2d12',

  // Surfaces – Professional clean hospitality interface
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceLow: '#f1f5f9',
  surfaceContainer: '#ffffff',
  surfaceContainerHigh: '#e2e8f0',
  surfaceBorder: 'rgba(12, 45, 107, 0.08)',

  // Typography
  onSurface: '#0f172a',
  onSurfaceVariant: '#475569',
  onSurfaceSubtle: '#94a3b8',

  // Functional Status Badges
  statusApproved: '#059669',
  statusApprovedBg: '#ecfdf5',
  statusPending: '#d97706',
  statusPendingBg: '#fffbeb',
  statusRejected: '#dc2626',
  statusRejectedBg: '#fef2f2',
  statusDraft: '#64748b',
  statusDraftBg: '#f8fafc',
  statusSuspended: '#991b1b',
  statusSuspendedBg: '#fef2f2',

  // Alerts
  error: '#dc2626',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#0284c7',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0c2d6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0c2d6b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const formatINR = (amount: number): string => {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
};
