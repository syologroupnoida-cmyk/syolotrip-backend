import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
  clearWishlistApi,
  syncWishlistApi,
  BackendWishlistItem,
} from '../services/api';

export interface WishlistItem {
  id: string;
  title: string;
  category: 'FLIGHT' | 'HOTEL' | 'VILLA' | 'PACKAGE' | 'TOUR' | 'TRAIN' | 'BUS' | 'CAB';
  location: string;
  price: number;
  rating?: number;
  image: string;
  badge?: string;
  addedAt: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, 'addedAt'>) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  toggleWishlist: (item: Omit<WishlistItem, 'addedAt'>) => Promise<boolean>;
  isWishlisted: (id: string) => boolean;
  wishlistCount: number;
  clearWishlist: () => Promise<void>;
  isLoading: boolean;
  syncWithBackend: () => Promise<void>;
}

const STORAGE_KEY = 'ssjourney_web_wishlist_v1';

const INITIAL_WISHLIST: WishlistItem[] = [
  {
    id: 'villa-candolim-1',
    title: 'Candolim Luxury 4BHK Private Pool Villa',
    category: 'VILLA',
    location: 'North Goa, India',
    price: 14500,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    badge: 'LUXURY VILLA',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'tour-burj-1',
    title: 'Burj Khalifa: At The Top (Level 124 & 125)',
    category: 'TOUR',
    location: 'Downtown Dubai, UAE',
    price: 3850,
    rating: 4.95,
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    badge: 'TOP SELLER',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-kashmir-1',
    title: 'Heavenly Kashmir Paradise Tour (6D/5N)',
    category: 'PACKAGE',
    location: 'Srinagar & Gulmarg, India',
    price: 24999,
    rating: 4.88,
    image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=800&q=80',
    badge: 'ALL-INCLUSIVE',
    addedAt: new Date().toISOString(),
  },
];

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load wishlist from localStorage', e);
    }
    return INITIAL_WISHLIST;
  });

  const mapBackendItem = (b: BackendWishlistItem): WishlistItem => ({
    id: b.id,
    title: b.title,
    category: (b.category as any) || 'HOTEL',
    location: b.location || '',
    price: b.price || 0,
    rating: b.rating,
    image: b.image || '',
    badge: b.badge,
    addedAt: b.addedAt || b.added_at || new Date().toISOString(),
  });

  const syncWithBackend = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setIsLoading(true);
      // If we have local guest items, safely merge them to backend
      const saved = localStorage.getItem(STORAGE_KEY);
      let localItems: WishlistItem[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) localItems = parsed;
        } catch (_) {}
      }

      if (localItems.length > 0) {
        const synced = await syncWishlistApi(
          localItems.map((i) => ({
            id: i.id,
            title: i.title,
            category: i.category,
            location: i.location,
            price: i.price,
            rating: i.rating,
            image: i.image,
            badge: i.badge,
          }))
        );
        const mapped = synced.map(mapBackendItem);
        setWishlist(mapped);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      } else {
        const remote = await getWishlistApi();
        const mapped = remote.map(mapBackendItem);
        setWishlist(mapped);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Wishlist backend sync error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for login / logout events across the app
  useEffect(() => {
    syncWithBackend();

    const handleAuthChange = () => {
      syncWithBackend();
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth:login', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth:login', handleAuthChange);
    };
  }, [syncWithBackend]);

  // Persist to local storage whenever wishlist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Failed to save wishlist to localStorage', e);
    }
  }, [wishlist]);

  const addToWishlist = async (item: Omit<WishlistItem, 'addedAt'>) => {
    const fullItem: WishlistItem = { ...item, addedAt: new Date().toISOString() };
    setWishlist((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      return [fullItem, ...prev];
    });

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await addToWishlistApi({
          id: item.id,
          title: item.title,
          category: item.category,
          location: item.location,
          price: item.price,
          rating: item.rating,
          image: item.image,
          badge: item.badge,
        });
      } catch (err) {
        console.warn('Failed to persist wishlist item to backend', err);
      }
    }
  };

  const removeFromWishlist = async (id: string) => {
    setWishlist((prev) => prev.filter((x) => x.id !== id));

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await removeFromWishlistApi(id);
      } catch (err) {
        console.warn('Failed to remove wishlist item from backend', err);
      }
    }
  };

  const toggleWishlist = async (item: Omit<WishlistItem, 'addedAt'>): Promise<boolean> => {
    const exists = wishlist.some((x) => x.id === item.id);
    if (exists) {
      await removeFromWishlist(item.id);
      return false;
    } else {
      await addToWishlist(item);
      return true;
    }
  };

  const isWishlisted = (id: string) => {
    return wishlist.some((x) => x.id === id);
  };

  const clearWishlist = async () => {
    setWishlist([]);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await clearWishlistApi();
      } catch (err) {
        console.warn('Failed to clear wishlist on backend', err);
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isWishlisted,
        wishlistCount: wishlist.length,
        clearWishlist,
        isLoading,
        syncWithBackend,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
};
