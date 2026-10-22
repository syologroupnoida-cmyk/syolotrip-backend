import React, { createContext, useContext, useState, useEffect } from 'react';

export interface WishlistItem {
  id: string;
  title: string;
  category: 'FLIGHT' | 'HOTEL' | 'VILLA' | 'PACKAGE' | 'TOUR' | 'TRAIN' | 'BUS';
  location: string;
  price: number;
  rating?: number;
  image: string;
  badge?: string;
  addedAt: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: Omit<WishlistItem, 'addedAt'>) => boolean;
  isWishlisted: (id: string) => boolean;
  wishlistCount: number;
  clearWishlist: () => void;
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Failed to save wishlist to localStorage', e);
    }
  }, [wishlist]);

  const addToWishlist = (item: Omit<WishlistItem, 'addedAt'>) => {
    setWishlist((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      return [{ ...item, addedAt: new Date().toISOString() }, ...prev];
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((x) => x.id !== id));
  };

  const toggleWishlist = (item: Omit<WishlistItem, 'addedAt'>): boolean => {
    let nowLiked = false;
    setWishlist((prev) => {
      const exists = prev.some((x) => x.id === item.id);
      if (exists) {
        nowLiked = false;
        return prev.filter((x) => x.id !== item.id);
      } else {
        nowLiked = true;
        return [{ ...item, addedAt: new Date().toISOString() }, ...prev];
      }
    });
    return nowLiked;
  };

  const isWishlisted = (id: string) => {
    return wishlist.some((x) => x.id === id);
  };

  const clearWishlist = () => {
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
