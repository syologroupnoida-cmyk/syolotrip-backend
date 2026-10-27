import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  MobileCurrencyCode,
  CurrencyConfig,
  MOBILE_CURRENCIES,
  setGlobalMobileCurrency,
  formatPrice,
} from '../theme/theme';

const STORAGE_KEY = 'ss_mobile_currency';

interface CurrencyContextType {
  currency: MobileCurrencyCode;
  currencyConfig: CurrencyConfig;
  setCurrency: (code: MobileCurrencyCode) => Promise<void>;
  formatPrice: (amount: number, overrideCode?: MobileCurrencyCode) => string;
  currencies: Record<MobileCurrencyCode, CurrencyConfig>;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'INR',
  currencyConfig: MOBILE_CURRENCIES.INR,
  setCurrency: async () => {},
  formatPrice,
  currencies: MOBILE_CURRENCIES,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<MobileCurrencyCode>('INR');

  useEffect(() => {
    // Load stored currency preference on mount
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (saved && MOBILE_CURRENCIES[saved as MobileCurrencyCode]) {
          const code = saved as MobileCurrencyCode;
          setCurrencyState(code);
          setGlobalMobileCurrency(code);
        }
      })
      .catch(() => {
        // Fallback to default INR
      });
  }, []);

  const setCurrency = async (code: MobileCurrencyCode) => {
    if (!MOBILE_CURRENCIES[code]) return;
    setCurrencyState(code);
    setGlobalMobileCurrency(code);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, code);
    } catch {
      // Non-blocking fallback
    }
  };

  const value: CurrencyContextType = {
    currency,
    currencyConfig: MOBILE_CURRENCIES[currency] || MOBILE_CURRENCIES.INR,
    setCurrency,
    formatPrice: (amt, override) => formatPrice(amt, override || currency),
    currencies: MOBILE_CURRENCIES,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => useContext(CurrencyContext);
