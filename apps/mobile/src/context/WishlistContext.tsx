import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getWishlistMobileApi,
  addToWishlistMobileApi,
  removeFromWishlistMobileApi,
  syncWishlistMobileApi,
  getStoredToken,
} from '../services/api';

export interface MobileWishlistItem {
  id: string;
  title: string;
  category: 'FLIGHT' | 'HOTEL' | 'VILLA' | 'PACKAGE' | 'TOUR' | 'TRAIN' | 'CAB' | 'BUS';
  location: string;
  price: number;
  rating?: number;
  image: string;
  badge?: string;
  addedAt: string;
}

interface WishlistContextType {
  wishlist: MobileWishlistItem[];
  addToWishlist: (item: Omit<MobileWishlistItem, 'addedAt'>) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  toggleWishlist: (item: Omit<MobileWishlistItem, 'addedAt'>) => Promise<boolean>;
  isWishlisted: (id: string) => boolean;
  wishlistCount: number;
  clearWishlist: () => Promise<void>;
  isLoading: boolean;
  syncWithBackend: () => Promise<void>;
}

const INITIAL_MOBILE_WISHLIST: MobileWishlistItem[] = [
  {
    id: 'hoshinoya-tokyo',
    title: 'Hoshinoya Tokyo Luxury Ryokan',
    category: 'HOTEL',
    location: 'Otemachi · 200m to Station',
    price: 68000,
    rating: 9.6,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=700&auto=format&fit=crop&q=80',
    badge: 'LUXURY 5★',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'villa-candolim-goa',
    title: 'Villa Sol Candolim - 4BHK Pool Villa',
    category: 'VILLA',
    location: 'Candolim, North Goa · Beachfront',
    price: 14500,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    badge: 'PRIVATE POOL',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'kashmir-bliss-pkg',
    title: 'Heavenly Kashmir Paradise (6D/5N)',
    category: 'PACKAGE',
    location: 'Srinagar, Gulmarg & Pahalgam',
    price: 24500,
    rating: 4.85,
    image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=800&q=80',
    badge: 'TOP HOLIDAY',
    addedAt: new Date().toISOString(),
  },
];

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<MobileWishlistItem[]>(INITIAL_MOBILE_WISHLIST);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const mapBackendItem = (b: any): MobileWishlistItem => ({
    id: b.id,
    title: b.title,
    category: b.category || 'HOTEL',
    location: b.location || '',
    price: Number(b.price) || 0,
    rating: b.rating,
    image: b.image || '',
    badge: b.badge,
    addedAt: b.addedAt || b.added_at || new Date().toISOString(),
  });

  const syncWithBackend = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      setIsLoading(true);
      const remote = await getWishlistMobileApi();
      if (remote && remote.length > 0) {
        setWishlist(remote.map(mapBackendItem));
      } else if (wishlist.length > 0) {
        // Sync initial/local items to user's backend wishlist
        const synced = await syncWishlistMobileApi(
          wishlist.map((w) => ({
            id: w.id,
            title: w.title,
            category: w.category,
            location: w.location,
            price: w.price,
            rating: w.rating,
            image: w.image,
            badge: w.badge,
          }))
        );
        if (synced && synced.length > 0) {
          setWishlist(synced.map(mapBackendItem));
        }
      }
    } catch (err) {
      console.warn('[Mobile Wishlist] Sync error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wishlist]);

  useEffect(() => {
    syncWithBackend();
  }, []);

  const addToWishlist = async (item: Omit<MobileWishlistItem, 'addedAt'>) => {
    const fullItem: MobileWishlistItem = { ...item, addedAt: new Date().toISOString() };
    setWishlist((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      return [fullItem, ...prev];
    });

    try {
      const token = await getStoredToken();
      if (token) {
        await addToWishlistMobileApi(item);
      }
    } catch (err) {
      console.warn('[Mobile Wishlist] Add error:', err);
    }
  };

  const removeFromWishlist = async (id: string) => {
    setWishlist((prev) => prev.filter((x) => x.id !== id));
    try {
      const token = await getStoredToken();
      if (token) {
        await removeFromWishlistMobileApi(id);
      }
    } catch (err) {
      console.warn('[Mobile Wishlist] Remove error:', err);
    }
  };

  const toggleWishlist = async (item: Omit<MobileWishlistItem, 'addedAt'>): Promise<boolean> => {
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
