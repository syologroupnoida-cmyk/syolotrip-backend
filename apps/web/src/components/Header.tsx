import React, { useState, useEffect } from 'react';
import { UserProfile } from '../services/api';

export type ScreenType = 'explore' | 'flights' | 'hotels' | 'checkout' | 'trips';

interface HeaderProps {
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;
  user?: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeScreen, 
  setActiveScreen,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Header is transparent ONLY on the explore/hero page when not scrolled down
  const isTransparent = activeScreen === 'explore' && !isScrolled;

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-40 select-none transition-all duration-300 ${
        isTransparent 
          ? 'bg-gradient-to-b from-black/35 via-black/10 to-transparent border-none text-white shadow-none' 
          : 'bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.08)] text-gray-800'
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[70px]">
          {/* ── ORIGINAL SS JOURNEY BRAND LOGO ── */}
          <div 
            onClick={() => setActiveScreen('explore')}
            className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
          >
            <div className="relative flex items-center">
              <img 
                src="/assets/ss-journey-emblem.png" 
                alt="SS Journey Logo" 
                className="h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className={`text-[18px] sm:text-[21px] font-black tracking-tight leading-tight block transition-colors ${
                  isTransparent ? 'text-white' : 'text-[#071426]'
                }`}>
                  SS JOURNEY
                </span>
                <span className="text-[9px] text-[#f28c1c] tracking-[0.2em] font-black uppercase bg-[#f28c1c]/15 px-1.5 py-0.2 rounded border border-[#f28c1c]/30">
                  GLOBAL
                </span>
              </div>
              <span className={`text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.14em] font-bold -mt-0.5 transition-colors ${
                isTransparent ? 'text-blue-100/90' : 'text-[#008cff]'
              }`}>
                Explore · Book · Travel · More
              </span>
            </div>
          </div>

          {/* ── RIGHT UTILITY BAR ── */}
          <div className={`flex items-center space-x-3 sm:space-x-5 lg:space-x-7 text-xs font-semibold transition-colors ${
            isTransparent ? 'text-white' : 'text-gray-700'
          }`}>
            {/* Introducing myBiz */}
            <div 
              onClick={() => alert('💼 myBiz by SS Journey: Complete Corporate & Business Travel Management with automated GST invoicing and employee travel policies.')}
              className={`hidden md:flex items-center space-x-2 py-1 px-2.5 rounded-lg transition cursor-pointer ${
                isTransparent ? 'hover:bg-white/15' : 'hover:bg-gray-100'
              }`}
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-[10px] text-white font-black shadow-xs">
                B
              </div>
              <div className="text-left leading-tight">
                <p className={`text-[11px] font-bold ${isTransparent ? 'text-white' : 'text-gray-900'}`}>
                  Introducing myBiz
                </p>
                <p className={`text-[9px] ${isTransparent ? 'text-white/80' : 'text-gray-500'}`}>
                  Business Travel Solution
                </p>
              </div>
            </div>

            {/* My Trips */}
            <button 
              type="button"
              onClick={() => setActiveScreen('trips')}
              className={`flex items-center space-x-2 py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
                activeScreen === 'trips'
                  ? isTransparent 
                    ? 'bg-white/20 text-white font-bold' 
                    : 'bg-blue-50 text-[#008cff] font-bold'
                  : isTransparent 
                    ? 'hover:bg-white/15 text-white/90 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${
                isTransparent ? 'text-white' : 'text-[#008cff]'
              }`}>luggage</span>
              <div className="text-left leading-tight hidden sm:block">
                <p className={`text-[11px] font-bold ${isTransparent ? 'text-white' : 'text-gray-900'}`}>
                  My Trips
                </p>
                <p className={`text-[9px] ${isTransparent ? 'text-white/80' : 'text-gray-500'}`}>
                  Manage Bookings
                </p>
              </div>
            </button>

            {/* Checkout Quick Access */}
            <button 
              type="button"
              onClick={() => setActiveScreen('checkout')}
              className={`flex items-center space-x-1.5 py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
                activeScreen === 'checkout'
                  ? isTransparent 
                    ? 'bg-white/20 text-white font-bold' 
                    : 'bg-blue-50 text-[#008cff] font-bold'
                  : isTransparent 
                    ? 'hover:bg-white/15 text-white/90 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${
                isTransparent ? 'text-white' : 'text-[#008cff]'
              }`}>shopping_cart</span>
              <span className="hidden xl:inline text-[11px] font-bold">Checkout</span>
            </button>

            {/* Country & Currency Selector */}
            <div className="relative">
              <div 
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className={`flex items-center space-x-1.5 cursor-pointer transition py-1 px-2 rounded-lg ${
                  isTransparent ? 'hover:bg-white/15' : 'hover:bg-gray-100'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${
                  isTransparent ? 'text-white' : 'text-[#008cff]'
                }`}>language</span>
                <div className="text-left leading-tight hidden sm:block">
                  <p className={`text-[9px] font-normal ${isTransparent ? 'text-white/80' : 'text-gray-500'}`}>
                    Country &amp; Currency
                  </p>
                  <div className={`flex items-center font-bold text-xs space-x-1 ${
                    isTransparent ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span>India | {currency}</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
                  </div>
                </div>
              </div>

              {isCurrencyOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-44 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 p-2 z-50 animate-fade-in"
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-2 py-1">
                    Select Currency
                  </span>
                  <div 
                    onClick={() => { setCurrency('INR'); setIsCurrencyOpen(false); }}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer ${
                      currency === 'INR' ? 'bg-blue-50 text-[#008cff] font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span>India (INR ₹)</span>
                    {currency === 'INR' && <span className="material-symbols-outlined text-[16px] text-[#008cff]">check</span>}
                  </div>
                  <div 
                    onClick={() => { setCurrency('USD'); setIsCurrencyOpen(false); }}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer ${
                      currency === 'USD' ? 'bg-blue-50 text-[#008cff] font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span>United States (USD $)</span>
                    {currency === 'USD' && <span className="material-symbols-outlined text-[16px] text-[#008cff]">check</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Login or User Account Button */}
            {user ? (
              <div className={`flex items-center border backdrop-blur-md rounded-full px-3 py-1 space-x-2 transition ${
                isTransparent 
                  ? 'bg-white/15 border-white/25 text-white' 
                  : 'bg-gray-100 border-gray-200 text-gray-800'
              }`}>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[10px] font-black text-white shadow-xs">
                  {(user.fullName || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight max-w-[100px] truncate">
                  <span className={`block text-[11px] font-bold tracking-wide truncate ${
                    isTransparent ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user.fullName || user.email.split('@')[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Logout"
                  className={`p-0.5 cursor-pointer ${isTransparent ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <span className="material-symbols-outlined text-[15px]">logout</span>
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={onOpenAuth}
                className={`flex items-center border backdrop-blur-md rounded-full px-3.5 py-1.5 transition text-left space-x-2.5 shadow-xs cursor-pointer ${
                  isTransparent 
                    ? 'bg-white/15 hover:bg-white/25 border-white/30 text-white' 
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200/80 text-gray-900'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[10px] font-black text-white shadow-xs">
                  my
                </div>
                <div className="leading-tight hidden sm:block">
                  <span className={`block text-[10px] font-bold tracking-wide ${
                    isTransparent ? 'text-white' : 'text-gray-800'
                  }`}>Login or</span>
                  <span className={`block text-[10px] font-bold tracking-wide ${
                    isTransparent ? 'text-white' : 'text-gray-800'
                  }`}>Create Account</span>
                </div>
                <span className={`material-symbols-outlined text-[16px] ${
                  isTransparent ? 'text-white' : 'text-gray-600'
                }`}>expand_more</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
