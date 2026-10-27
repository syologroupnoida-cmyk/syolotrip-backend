// SS Journey Brand Theme — Exactly matching Web & Brand Identity

export const Colors = {
  // Primary = Deep Navy Blue (from SS Journey logo & header)
  primary: '#0c2d6b',
  primaryContainer: '#143d8a',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#d4e3ff',
  primaryFixed: '#d4e3ff',
  primaryFixedDim: '#a4c8ff',
  onPrimaryFixed: '#001d3d',
  onPrimaryFixedVariant: '#0a2760',

  // Secondary = SS Journey Vibrant Orange / Amber Accent (swoosh & CTA conversion)
  secondary: '#c05d00',
  secondaryContainer: '#f28c1c',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#4a2200',
  secondaryFixed: '#ffdcc4',
  secondaryFixedDim: '#ffb77c',
  onSecondaryFixed: '#2d1200',
  onSecondaryFixedVariant: '#944800',

  // Tertiary = Royal Blue (gradient highlights)
  tertiary: '#1a6fb5',
  tertiaryContainer: '#2988d4',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#d0e8ff',
  tertiaryFixed: '#d0e8ff',
  tertiaryFixedDim: '#96c9f7',
  onTertiaryFixed: '#001e36',
  onTertiaryFixedVariant: '#0f5a99',

  // Brand Gradients and specific Navy steps
  brandNavyDark: '#071a3d',
  brandNavyMid: '#0c2d6b',
  brandNavyLight: '#143d8a',
  brandOrange: '#f28c1c',

  // Surfaces – cool-tinted to complement navy
  background: '#f7f9ff',
  surface: '#f7f9ff',
  surfaceBright: '#f7f9ff',
  surfaceDim: '#cdd5ea',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f4ff',
  surfaceContainer: '#e8edfb',
  surfaceContainerHigh: '#dfe6f7',
  surfaceContainerHighest: '#d5dff2',

  // Text & Neutral Tones
  onSurface: '#0c1b33',
  onSurfaceVariant: '#3a4456',
  onBackground: '#0c1b33',
  inverseSurface: '#1a2640',
  inverseOnSurface: '#edf0ff',
  inversePrimary: '#a4c8ff',

  // Borders & Outlines
  outline: '#667590',
  outlineVariant: '#b4c0d6',

  // Feedback & Status
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',
  success: '#059669',
  warning: '#f59e0b',
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#071a3d',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#071a3d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#071a3d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

export type MobileCurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';

export interface CurrencyConfig {
  code: MobileCurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rate: number;
  locale: string;
}

export const MOBILE_CURRENCIES: Record<MobileCurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 1.0, locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 0.0118, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.0109, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.0093, locale: 'en-GB' },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', flag: '🇦🇪', rate: 0.0433, locale: 'en-AE' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', rate: 0.0156, locale: 'en-SG' },
};

let activeMobileCurrency: MobileCurrencyCode = 'INR';

export const setGlobalMobileCurrency = (code: MobileCurrencyCode) => {
  if (MOBILE_CURRENCIES[code]) {
    activeMobileCurrency = code;
  }
};

export const getGlobalMobileCurrency = (): MobileCurrencyCode => activeMobileCurrency;

export const formatPrice = (val: number, overrideCode?: MobileCurrencyCode): string => {
  const code = overrideCode || activeMobileCurrency;
  const cfg = MOBILE_CURRENCIES[code] || MOBILE_CURRENCIES.INR;
  if (isNaN(val) || val === 0) return `${cfg.symbol}0`;
  const converted = val * cfg.rate;
  if (cfg.code === 'INR' || cfg.code === 'AED') {
    return `${cfg.symbol}${Math.round(converted).toLocaleString(cfg.locale)}`;
  }
  const hasDecimals = converted % 1 !== 0;
  return `${cfg.symbol}${converted.toLocaleString(cfg.locale, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

export const formatINR = (val: number): string => {
  return formatPrice(val);
};
