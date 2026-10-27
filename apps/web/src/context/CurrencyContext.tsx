import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
  country: string;
  flag: string;
  rate: number; // Multiplier from INR base
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    label: 'India (INR ₹)',
    country: 'India',
    flag: '🇮🇳',
    rate: 1.0,
    locale: 'en-IN',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'United States (USD $)',
    country: 'United States',
    flag: '🇺🇸',
    rate: 0.0118,
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'Europe (EUR €)',
    country: 'European Union',
    flag: '🇪🇺',
    rate: 0.0109,
    locale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    label: 'United Kingdom (GBP £)',
    country: 'United Kingdom',
    flag: '🇬🇧',
    rate: 0.0093,
    locale: 'en-GB',
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    label: 'UAE (AED د.إ)',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    rate: 0.0433,
    locale: 'en-AE',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    label: 'Singapore (SGD S$)',
    country: 'Singapore',
    flag: '🇸🇬',
    rate: 0.0156,
    locale: 'en-SG',
  },
};

const STORAGE_KEY = 'ss_currency';

// Module-level current currency for synchronous utility calls outside React components
let activeCurrencyGlobal: CurrencyCode = 'INR';

try {
  const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode;
  if (saved && CURRENCIES[saved]) {
    activeCurrencyGlobal = saved;
  }
} catch {
  // Safe fallback if localStorage is unavailable
}

/**
 * Format an INR-based amount to any chosen currency (or the globally active currency).
 */
export function formatPrice(amountInINR: number, overrideCurrency?: CurrencyCode): string {
  const targetCode = overrideCurrency || activeCurrencyGlobal;
  const info = CURRENCIES[targetCode] || CURRENCIES.INR;
  
  if (isNaN(amountInINR) || amountInINR === 0) {
    return `${info.symbol}0`;
  }

  const converted = amountInINR * info.rate;

  if (info.code === 'INR') {
    return `${info.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
  }

  if (info.code === 'AED') {
    return `${info.symbol}${Math.round(converted).toLocaleString('en-AE')}`;
  }

  // USD, EUR, GBP, SGD: display 2 decimal places if needed or clean integer
  const hasDecimals = converted % 1 !== 0;
  return `${info.symbol}${converted.toLocaleString(info.locale, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Convert numeric amount from INR base to target currency numeric value.
 */
export function convertPrice(amountInINR: number, overrideCurrency?: CurrencyCode): number {
  const targetCode = overrideCurrency || activeCurrencyGlobal;
  const info = CURRENCIES[targetCode] || CURRENCIES.INR;
  return Number((amountInINR * info.rate).toFixed(2));
}

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyInfo: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amountInINR: number, overrideCurrency?: CurrencyCode) => string;
  convertPrice: (amountInINR: number, overrideCurrency?: CurrencyCode) => number;
  currencies: Record<CurrencyCode, CurrencyInfo>;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'INR',
  currencyInfo: CURRENCIES.INR,
  setCurrency: () => {},
  formatPrice,
  convertPrice,
  currencies: CURRENCIES,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as CurrencyCode;
      if (stored && CURRENCIES[stored]) {
        return stored;
      }
    } catch {
      // fallback
    }
    return 'INR';
  });

  const setCurrency = (code: CurrencyCode) => {
    if (!CURRENCIES[code]) return;
    setCurrencyState(code);
    activeCurrencyGlobal = code;
    try {
      localStorage.setItem(STORAGE_KEY, code);
      // Dispatch storage event so all tabs or listeners stay synced
      window.dispatchEvent(new Event('ss_currency_change'));
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    activeCurrencyGlobal = currency;
  }, [currency]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as CurrencyCode;
        if (stored && CURRENCIES[stored] && stored !== currency) {
          setCurrencyState(stored);
          activeCurrencyGlobal = stored;
        }
      } catch {
        // fallback
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('ss_currency_change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('ss_currency_change', handleSync);
    };
  }, [currency]);

  const value: CurrencyContextType = {
    currency,
    currencyInfo: CURRENCIES[currency] || CURRENCIES.INR,
    setCurrency,
    formatPrice: (amt, code) => formatPrice(amt, code || currency),
    convertPrice: (amt, code) => convertPrice(amt, code || currency),
    currencies: CURRENCIES,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => useContext(CurrencyContext);
