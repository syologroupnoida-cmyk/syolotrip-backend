import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, PartnerProfileData } from '../types/partner';
import {
  getCurrentUserApi,
  getPartnerProfileApi,
  loginPartnerApi,
  demoLoginPartnerApi,
  registerPartnerAccountApi,
  registerPartnerFlowApi,
  createPartnerProfileApi,
  setStoredToken,
} from '../services/api';

interface PartnerAuthContextType {
  user: UserProfile | null;
  partnerProfile: PartnerProfileData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  status: string;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role?: 'PARTNER') => Promise<void>;
  register: (payload: {
    email: string;
    full_name: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  registerPartnerFlow: (
    payload: {
      email: string;
      full_name: string;
      password: string;
      phone?: string;
      business_name: string;
      business_type: string;
      business_phone?: string;
      city: string;
      address?: string;
      tax_id?: string;
    },
    onStepProgress?: (step: 'ACCOUNT' | 'PROFILE') => void
  ) => Promise<{
    success: boolean;
    message: string;
    partialState?: {
      accountCreated: boolean;
      email: string;
      error: string;
    };
  }>;
  registerProfile: (payload: {
    business_name: string;
    business_type: string;
    phone?: string;
    city?: string;
    address?: string;
    tax_id?: string;
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const PartnerAuthContext = createContext<PartnerAuthContextType>({
  user: null,
  partnerProfile: null,
  isLoading: true,
  isAuthenticated: false,
  isVerified: false,
  status: 'PENDING_VERIFICATION',
  login: async () => {},
  demoLogin: async () => {},
  register: async () => {},
  registerPartnerFlow: async () => ({ success: false, message: '' }),
  registerProfile: async () => {},
  refreshProfile: async () => {},
  logout: async () => {},
});

export const PartnerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const u = await getCurrentUserApi();
      if (u) {
        setUser(u);
        const p = await getPartnerProfileApi();
        setPartnerProfile(p);
      } else {
        await setStoredToken(null);
        setUser(null);
        setPartnerProfile(null);
      }
    } catch (err) {
      console.warn('[PartnerAuth] Error refreshing profile:', err);
      await setStoredToken(null);
      setUser(null);
      setPartnerProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await loginPartnerApi(email, password);
      setUser(res.user);
      const p = await getPartnerProfileApi();
      setPartnerProfile(p);
    } catch (err) {
      await setStoredToken(null);
      setUser(null);
      setPartnerProfile(null);
      throw err;
    }
  };

  const demoLogin = async (role: 'PARTNER' = 'PARTNER') => {
    try {
      const res = await demoLoginPartnerApi(role);
      setUser(res.user);
      const p = await getPartnerProfileApi();
      setPartnerProfile(p);
    } catch (err) {
      await setStoredToken(null);
      setUser(null);
      setPartnerProfile(null);
      throw err;
    }
  };

  const register = async (payload: {
    email: string;
    full_name: string;
    password: string;
    phone?: string;
  }) => {
    try {
      await registerPartnerAccountApi(payload);
    } finally {
      await setStoredToken(null);
      setUser(null);
      setPartnerProfile(null);
    }
  };

  const registerPartnerFlow = async (
    payload: {
      email: string;
      full_name: string;
      password: string;
      phone?: string;
      business_name: string;
      business_type: string;
      business_phone?: string;
      city: string;
      address?: string;
      tax_id?: string;
    },
    onStepProgress?: (step: 'ACCOUNT' | 'PROFILE') => void
  ) => {
    try {
      return await registerPartnerFlowApi(payload, onStepProgress);
    } finally {
      await setStoredToken(null);
      setUser(null);
      setPartnerProfile(null);
    }
  };

  const registerProfile = async (payload: {
    business_name: string;
    business_type: string;
    phone?: string;
    city?: string;
    address?: string;
    tax_id?: string;
  }) => {
    try {
      const p = await createPartnerProfileApi(payload);
      setPartnerProfile(p);
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    await setStoredToken(null);
    setUser(null);
    setPartnerProfile(null);
  };

  const isAuthenticated = !!user;
  const isVerified =
    partnerProfile?.status === 'VERIFIED' ||
    partnerProfile?.status === 'APPROVED' ||
    !!partnerProfile?.is_verified;
  const status = partnerProfile?.status || 'PENDING_VERIFICATION';

  return (
    <PartnerAuthContext.Provider
      value={{
        user,
        partnerProfile,
        isLoading,
        isAuthenticated,
        isVerified,
        status,
        login,
        demoLogin,
        register,
        registerPartnerFlow,
        registerProfile,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
};

export const usePartnerAuth = () => useContext(PartnerAuthContext);
