import React, { createContext, useContext, useState } from 'react';

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
  addToWishlist: (item: Omit<MobileWishlistItem, 'addedAt'>) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: Omit<MobileWishlistItem, 'addedAt'>) => boolean;
  isWishlisted: (id: string) => boolean;
  wishlistCount: number;
  clearWishlist: () => void;
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

  const addToWishlist = (item: Omit<MobileWishlistItem, 'addedAt'>) => {
    setWishlist((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      return [{ ...item, addedAt: new Date().toISOString() }, ...prev];
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((x) => x.id !== id));
  };

  const toggleWishlist = (item: Omit<MobileWishlistItem, 'addedAt'>): boolean => {
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
