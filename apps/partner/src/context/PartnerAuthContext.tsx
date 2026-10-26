import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, PartnerProfileData } from '../types/partner';
import {
  getCurrentUserApi,
  getPartnerProfileApi,
  loginPartnerApi,
  registerPartnerAccountApi,
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
  register: (payload: {
    email: string;
    full_name: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
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
  register: async () => {},
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
      setUser(u);
      if (u) {
        const p = await getPartnerProfileApi();
        setPartnerProfile(p);
      } else {
        setPartnerProfile(null);
      }
    } catch (err) {
      console.warn('[PartnerAuth] Error refreshing profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginPartnerApi(email, password);
      setUser(res.user);
      const p = await getPartnerProfileApi();
      setPartnerProfile(p);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    full_name: string;
    password: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await registerPartnerAccountApi(payload);
      setUser(res.user);
      const p = await getPartnerProfileApi();
      setPartnerProfile(p);
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
    try {
      const p = await createPartnerProfileApi(payload);
      setPartnerProfile(p);
    } finally {
      setIsLoading(false);
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
        register,
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
