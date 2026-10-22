import React, { useState } from 'react';
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

  return (
    <header className="relative w-full z-40 bg-[#071426] border-b border-white/10 select-none shadow-md">
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
                className="h-9 sm:h-10 w-auto object-contain group-hover:scale-105 transition-all duration-300 drop-shadow-sm"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-[18px] sm:text-[21px] font-black tracking-tight text-white leading-tight block">
                  SS JOURNEY
                </span>
                <span className="text-[9px] text-[#f28c1c] tracking-[0.2em] font-black uppercase bg-[#f28c1c]/15 px-1.5 py-0.2 rounded border border-[#f28c1c]/30">
                  GLOBAL
                </span>
              </div>
              <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.14em] text-blue-200/90 font-bold -mt-0.5">
                Explore · Book · Travel · More
              </span>
            </div>
          </div>

          {/* ── RIGHT UTILITY BAR (Exact Stitch Replica) ── */}
          <div className="flex items-center space-x-3 sm:space-x-5 lg:space-x-7 text-white text-xs font-semibold">
            {/* Introducing myBiz */}
            <div 
              onClick={() => alert('💼 myBiz by SS Journey: Complete Corporate & Business Travel Management with automated GST invoicing and employee travel policies.')}
              className="hidden md:flex items-center space-x-2 py-1 px-2.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-[10px] text-white font-black shadow-xs">
                B
              </div>
              <div className="text-left leading-tight">
                <p className="text-[11px] font-bold text-white">Introducing myBiz</p>
                <p className="text-[9px] text-gray-300">Business Travel Solution</p>
              </div>
            </div>

            {/* My Trips */}
            <button 
              type="button"
              onClick={() => setActiveScreen('trips')}
              className={`flex items-center space-x-2 py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
                activeScreen === 'trips'
                  ? 'bg-white/20 text-white font-bold'
                  : 'hover:bg-white/10 text-white/90 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-white/90">luggage</span>
              <div className="text-left leading-tight hidden sm:block">
                <p className="text-[11px] font-bold text-white">My Trips</p>
                <p className="text-[9px] text-gray-300">Manage Bookings</p>
              </div>
            </button>

            {/* Checkout Quick Access */}
            <button 
              type="button"
              onClick={() => setActiveScreen('checkout')}
              className={`flex items-center space-x-1.5 py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
                activeScreen === 'checkout'
                  ? 'bg-white/20 text-white font-bold'
                  : 'hover:bg-white/10 text-white/90 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
              <span className="hidden xl:inline text-[11px] font-bold">Checkout</span>
            </button>

            {/* Country & Currency Selector */}
            <div className="relative">
              <div 
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="flex items-center space-x-1.5 cursor-pointer hover:bg-white/10 transition py-1 px-2 rounded-lg"
              >
                <span className="material-symbols-outlined text-[18px] text-white/90">language</span>
                <div className="text-left leading-tight hidden sm:block">
                  <p className="text-[9px] text-gray-300 font-normal">Country &amp; Currency</p>
                  <div className="flex items-center font-bold text-xs space-x-1">
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
                    {currency === 'INR' && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </div>
                  <div 
                    onClick={() => { setCurrency('USD'); setIsCurrencyOpen(false); }}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer ${
                      currency === 'USD' ? 'bg-blue-50 text-[#008cff] font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span>United States (USD $)</span>
                    {currency === 'USD' && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Login or User Account Button (Stitch Authentic Pill) */}
            {user ? (
              <div className="flex items-center bg-white/15 border border-white/25 backdrop-blur-md rounded-full px-3 py-1 space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[10px] font-black text-white shadow-xs">
                  {(user.fullName || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight max-w-[100px] truncate">
                  <span className="block text-[11px] font-bold text-white tracking-wide truncate">
                    {user.fullName || user.email.split('@')[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Logout"
                  className="text-white/60 hover:text-white p-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">logout</span>
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={onOpenAuth}
                className="flex items-center bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md rounded-full px-3.5 py-1.5 transition text-left space-x-2.5 shadow-xs cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[10px] font-black text-white shadow-xs">
                  my
                </div>
                <div className="leading-tight hidden sm:block">
                  <span className="block text-[10px] font-bold text-white tracking-wide">Login or</span>
                  <span className="block text-[10px] font-bold text-white tracking-wide">Create Account</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-white">expand_more</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
