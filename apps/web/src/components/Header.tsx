import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, MyBizContext } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

export type ScreenType = 'explore' | 'flights' | 'hotels' | 'trains' | 'buses' | 'cabs' | 'packages' | 'checkout' | 'trips' | 'list-property' | 'mybiz' | 'mybiz-dashboard';

interface HeaderProps {
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;
  user?: UserProfile | null;
  bizContext?: MyBizContext | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenWishlist?: () => void;
  wishlistCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeScreen, 
  setActiveScreen,
  user,
  bizContext,
  onOpenAuth,
  onLogout,
  onOpenWishlist,
  wishlistCount = 0,
}) => {
  const { currency, setCurrency, currencyInfo, currencies } = useCurrency();
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close currency dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(e.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };
    if (isCurrencyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCurrencyOpen]);

  // Header is transparent ONLY on the explore/hero page when not scrolled down
  const isTransparent = activeScreen === 'explore' && !isScrolled;

  const handleMobileNav = (screen: ScreenType) => {
    setActiveScreen(screen);
    setIsMobileMenuOpen(false);
  };

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
          {/* Mobile Back to Explore Button when on inner section */}
          {activeScreen !== 'explore' && (
            <button
              type="button"
              onClick={() => setActiveScreen('explore')}
              aria-label="Back to Explore"
              className={`md:hidden flex items-center justify-center w-8 h-8 rounded-full mr-1.5 transition cursor-pointer shrink-0 ${
                isTransparent 
                  ? 'bg-white/20 text-white hover:bg-white/30' 
                  : 'bg-blue-50 text-[#008cff] hover:bg-blue-100'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          )}

          {/* ── SYOLO TRIPS BRAND LOGO ── */}
          <div 
            onClick={() => setActiveScreen('explore')}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group select-none shrink-0"
          >
            <div className="relative flex items-center">
              <img 
                src="/assets/syolo-trips-logo.png" 
                alt="Syolo Trips Logo" 
                className="h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1">
                <span className={`text-[18px] sm:text-[21px] font-black tracking-tight leading-tight block transition-colors ${
                  isTransparent ? 'text-white' : 'text-[#071426]'
                }`}>
                  <span className="text-[#00aeef]">SYOLO</span> <span className="text-[#ff9900]">TRIPS</span>
                </span>
              </div>
              <span className={`text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.14em] font-bold -mt-0.5 transition-colors ${
                isTransparent ? 'text-blue-100/90' : 'text-[#00aeef]'
              }`}>
                Explore Beyond!
              </span>
            </div>
          </div>

          {/* ── RIGHT UTILITY BAR ── */}
          <div className={`flex items-center space-x-2 sm:space-x-4 lg:space-x-5 text-xs font-semibold transition-colors ${
            isTransparent ? 'text-white' : 'text-gray-700'
          }`}>
            {/* Introducing myBiz / myBiz Dashboard */}
            <button 
              type="button"
              onClick={() => setActiveScreen(bizContext?.is_biz_user ? 'mybiz-dashboard' : 'mybiz')}
              className={`hidden md:flex items-center space-x-2 py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
                activeScreen === 'mybiz' || activeScreen === 'mybiz-dashboard'
                  ? isTransparent
                    ? 'bg-white/20 ring-1 ring-amber-400/50 shadow-xs'
                    : 'bg-amber-50 text-amber-900 ring-1 ring-amber-300 shadow-xs'
                  : isTransparent 
                    ? 'hover:bg-white/15' 
                    : 'hover:bg-gray-100'
              }`}
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-[10px] text-white font-black shadow-xs shrink-0">
                B
              </div>
              <div className="text-left leading-tight">
                <p className={`text-[11px] font-bold ${
                  activeScreen === 'mybiz' || activeScreen === 'mybiz-dashboard'
                    ? isTransparent ? 'text-amber-300' : 'text-amber-800'
                    : isTransparent ? 'text-white' : 'text-gray-900'
                }`}>
                  {bizContext?.is_biz_user ? 'myBiz Dashboard' : 'Introducing myBiz'}
                </p>
                <p className={`text-[9px] ${isTransparent ? 'text-white/80' : 'text-gray-500'}`}>
                  {bizContext?.is_biz_user
                    ? bizContext.company_name || 'Business Account'
                    : 'Business Travel Solution'}
                </p>
              </div>
            </button>

            {/* List Your Property */}
            <button
              type="button"
              onClick={() => setActiveScreen('list-property')}
              className={`hidden md:flex items-center space-x-1.5 sm:space-x-2 py-1.5 px-2 sm:px-2.5 rounded-lg transition cursor-pointer ${
                activeScreen === 'list-property'
                  ? isTransparent
                    ? 'bg-white/20 text-white font-bold ring-1 ring-white/30'
                    : 'bg-emerald-50 text-emerald-700 font-bold ring-1 ring-emerald-300'
                  : isTransparent
                    ? 'hover:bg-white/15 text-white/90 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
              }`}
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[13px]">apartment</span>
              </div>
              <div className="text-left leading-tight hidden lg:block">
                <div className="flex items-center space-x-1">
                  <p className={`text-[11px] font-bold ${isTransparent ? 'text-white' : 'text-gray-900'}`}>
                    List Your Property
                  </p>
                  <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-amber-400 text-amber-950">
                    Free
                  </span>
                </div>
                <p className={`text-[9px] ${isTransparent ? 'text-white/80' : 'text-gray-500'}`}>
                  Grow your business
                </p>
              </div>
              <span className="lg:hidden text-[11px] font-bold hidden sm:inline">
                List Property
              </span>
            </button>

            {/* My Trips */}
            <button 
              type="button"
              onClick={() => setActiveScreen('trips')}
              className={`hidden md:flex items-center space-x-2 py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
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

            {/* Wishlist / Liked Quick Access */}
            <button 
              type="button"
              onClick={onOpenWishlist}
              className={`relative flex items-center space-x-2 py-1.5 px-2 sm:px-2.5 rounded-lg transition cursor-pointer ${
                isTransparent 
                  ? 'hover:bg-white/15 text-white/90 hover:text-white' 
                  : 'hover:bg-rose-50 text-gray-700 hover:text-rose-600'
              }`}
              title="My Wishlist & Liked"
            >
              <div className="relative flex items-center">
                <span 
                  className={`material-symbols-outlined text-[19px] transition-colors ${
                    isTransparent ? 'text-white' : 'text-rose-500'
                  }`} 
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <div className="text-left leading-tight hidden md:block">
                <p className={`text-[11px] font-bold ${isTransparent ? 'text-white' : 'text-gray-900'}`}>
                  Wishlist
                </p>
                <p className={`text-[9px] ${isTransparent ? 'text-white/80' : 'text-gray-500'}`}>
                  {wishlistCount} Saved
                </p>
              </div>
            </button>

            {/* Checkout Quick Access */}
            <button 
              type="button"
              onClick={() => setActiveScreen('checkout')}
              className={`hidden md:flex items-center space-x-1.5 py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
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

            {/* Country & Currency Selector (Desktop) */}
            <div className="relative hidden md:block" ref={currencyMenuRef}>
              <button 
                type="button"
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className={`flex items-center space-x-1.5 cursor-pointer transition py-1 px-2 rounded-lg ${
                  isTransparent ? 'hover:bg-white/15' : 'hover:bg-gray-100'
                }`}
                title="Change display currency"
              >
                <span className={`material-symbols-outlined text-[18px] ${
                  isTransparent ? 'text-white' : 'text-[#008cff]'
                }`}>language</span>
                <div className="text-left leading-tight hidden sm:block">
                  <p className={`text-[9px] font-normal ${isTransparent ? 'text-white/80' : 'text-gray-500'}`}>
                    Currency
                  </p>
                  <div className={`flex items-center font-bold text-xs space-x-1 ${
                    isTransparent ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span>{currencyInfo.flag} {currencyInfo.code} ({currencyInfo.symbol})</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
                  </div>
                </div>
              </button>

              {isCurrencyOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 p-2 z-50 animate-fade-in"
                >
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Select Currency
                    </span>
                    <span className="text-[10px] font-semibold text-[#008cff] bg-blue-50 px-1.5 py-0.5 rounded">
                      Live Conversion
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {Object.values(currencies).map((c) => {
                      const isSelected = currency === c.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setCurrency(c.code);
                            setIsCurrencyOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                            isSelected ? 'bg-blue-50 text-[#008cff] font-bold' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{c.flag}</span>
                            <div className="text-left">
                              <span className="block leading-tight font-bold">{c.code} &bull; {c.symbol}</span>
                              <span className="block text-[10px] text-gray-400 font-normal">{c.country}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[16px] text-[#008cff]">check_circle</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Portal Button (when logged in as ADMIN) */}
            {user?.role === 'ADMIN' && (
              <a
                href="http://localhost:5174/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white font-extrabold text-[11px] hover:brightness-110 shadow-sm transition"
              >
                <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
                <span>Admin Portal</span>
              </a>
            )}

            {/* Login or User Account Button */}
            {user ? (
              <div className={`flex items-center border backdrop-blur-md rounded-full px-2.5 sm:px-3 py-1 space-x-1.5 sm:space-x-2 transition ${
                isTransparent 
                  ? 'bg-white/15 border-white/25 text-white' 
                  : 'bg-gray-100 border-gray-200 text-gray-800'
              }`}>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[10px] font-black text-white shadow-xs">
                  {(user.fullName || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight max-w-[80px] sm:max-w-[100px] truncate hidden sm:block">
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
                className={`flex items-center border backdrop-blur-md rounded-full px-2.5 sm:px-3.5 py-1.5 transition text-left space-x-1.5 sm:space-x-2.5 shadow-xs cursor-pointer ${
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
                <span className={`material-symbols-outlined text-[16px] hidden sm:inline ${
                  isTransparent ? 'text-white' : 'text-gray-600'
                }`}>expand_more</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
              className={`md:hidden flex items-center justify-center p-2 rounded-xl transition cursor-pointer ${
                isTransparent
                  ? 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── RESPONSIVE MOBILE SLIDE-OUT DRAWER ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            aria-hidden="true"
          />

          {/* Drawer Content Panel */}
          <div className="relative w-[310px] max-w-[85vw] h-full bg-white text-gray-900 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto animate-slide-left border-l border-gray-200">
            {/* Drawer Header */}
            <div>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2.5">
                  <img 
                    src="/assets/syolo-trips-logo.png" 
                    alt="Syolo Trips" 
                    className="h-8 w-auto object-contain rounded"
                  />
                  <div>
                    <span className="font-black text-sm tracking-tight text-[#071426] block">
                      <span className="text-[#00aeef]">SYOLO</span> <span className="text-[#ff9900]">TRIPS</span>
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#00aeef]">
                      Explore Beyond!
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition"
                  aria-label="Close menu"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* User Account Section */}
              <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-b border-gray-100">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-sm font-black text-white shadow-xs">
                        {(user.fullName || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="leading-tight max-w-[150px] truncate">
                        <p className="font-bold text-xs text-gray-900 truncate">
                          {user.fullName || user.email.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { onOpenAuth(); setIsMobileMenuOpen(false); }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#008cff] to-[#0A58CA] text-white font-bold text-xs text-center shadow-md flex items-center justify-center space-x-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">account_circle</span>
                    <span>Sign In or Create Account</span>
                  </button>
                )}
              </div>

              {/* Travel Services Menu */}
              <div className="p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1 block">
                  Book Services
                </span>
                <nav className="space-y-0.5">
                  {[
                    { id: 'explore' as const, label: 'Explore & Search', icon: 'explore', color: 'text-blue-500' },
                    { id: 'flights' as const, label: 'Flights', icon: 'flight', color: 'text-sky-500' },
                    { id: 'hotels' as const, label: 'Hotels & Stays', icon: 'hotel', color: 'text-indigo-500' },
                    { id: 'trains' as const, label: 'Trains (IRCTC)', icon: 'train', color: 'text-emerald-500' },
                    { id: 'buses' as const, label: 'Buses', icon: 'directions_bus', color: 'text-purple-500' },
                    { id: 'cabs' as const, label: 'Cabs & Airport Taxi', icon: 'local_taxi', color: 'text-amber-500' },
                    { id: 'packages' as const, label: 'Holiday Packages', icon: 'beach_access', color: 'text-rose-500' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMobileNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        activeScreen === item.id
                          ? 'bg-blue-50 text-[#008cff] font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`material-symbols-outlined text-[19px] ${item.color}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
                    </button>
                  ))}
                </nav>

                <div className="my-2 border-t border-gray-100" />

                {/* Corporate & Partner Options */}
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1 block">
                  Business & Hosting
                </span>
                <nav className="space-y-0.5">
                  {/* myBiz */}
                  <button
                    type="button"
                    onClick={() => handleMobileNav(bizContext?.is_biz_user ? 'mybiz-dashboard' : 'mybiz')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      activeScreen === 'mybiz' || activeScreen === 'mybiz-dashboard'
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-[10px] text-white font-black">
                        B
                      </div>
                      <span>{bizContext?.is_biz_user ? 'myBiz Dashboard' : 'Introducing myBiz'}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      Corporate
                    </span>
                  </button>

                  {/* List Your Property */}
                  <button
                    type="button"
                    onClick={() => handleMobileNav('list-property')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      activeScreen === 'list-property'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-[19px] text-emerald-600">apartment</span>
                      <span>List Your Property</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Free
                    </span>
                  </button>
                </nav>

                <div className="my-2 border-t border-gray-100" />

                {/* Account & Orders */}
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1 block">
                  My Travel Desk
                </span>
                <nav className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleMobileNav('trips')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      activeScreen === 'trips' ? 'bg-blue-50 text-[#008cff] font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-[19px] text-[#008cff]">luggage</span>
                      <span>My Trips &amp; Bookings</span>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onOpenWishlist) onOpenWishlist();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-[19px] text-rose-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                        favorite
                      </span>
                      <span>Saved &amp; Wishlist</span>
                    </div>
                    <span className="text-xs font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMobileNav('checkout')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      activeScreen === 'checkout' ? 'bg-blue-50 text-[#008cff] font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-[19px] text-[#008cff]">shopping_cart</span>
                      <span>Checkout Cart</span>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
                  </button>

                  {/* Admin Portal link for admin users */}
                  {user?.role === 'ADMIN' && (
                    <a
                      href="http://localhost:5174/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition mt-1"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="material-symbols-outlined text-[19px] text-red-600">admin_panel_settings</span>
                        <span>Open Admin Console</span>
                      </div>
                      <span className="text-[10px] font-mono text-red-500">(:5174) ↗</span>
                    </a>
                  )}
                </nav>
              </div>
            </div>

            {/* Drawer Footer with Currency Switcher */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#008cff]">language</span>
                  <span>Currency ({currencyInfo.code})</span>
                </span>
                <span className="text-[10px] font-bold text-[#008cff] bg-blue-50 px-2 py-0.5 rounded-full">
                  {currencyInfo.flag} {currencyInfo.symbol}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 bg-white border border-gray-200 rounded-xl p-1.5">
                {Object.values(currencies).map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrency(c.code)}
                      className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-bold transition ${
                        isSelected
                          ? 'bg-[#008cff] text-white shadow-xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="text-xs">{c.flag}</span>
                      <span className="leading-tight mt-0.5">{c.code} ({c.symbol})</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-gray-400 text-center">
                Prices update dynamically across all flights, hotels &amp; tours
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
