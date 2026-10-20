import React, { useState } from 'react';
import { UserProfile } from '../services/api';
import {
  FlightsIsometricIcon,
  HotelsIsometricIcon,
  VillasIsometricIcon,
  HolidaysIsometricIcon,
  TrainsIsometricIcon,
  BusesIsometricIcon,
  CabsIsometricIcon,
  ToursIsometricIcon,
  VisaIsometricIcon,
  ForexIsometricIcon,
  InsuranceIsometricIcon,
} from './TravelCategoryIcons';

export type ScreenType = 'explore' | 'flights' | 'hotels' | 'checkout' | 'trips' | 'admin';

interface HeaderProps {
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;
  user?: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

interface CategoryItem {
  id: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: string;
  badgeClass?: string;
  onClick: () => void;
  isActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeScreen, 
  setActiveScreen,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (activeScreen === 'hotels') return 'hotels';
    return 'flights';
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  const categories: CategoryItem[] = [
    {
      id: 'flights',
      label: 'Flights',
      isActive: activeScreen === 'flights' || (activeScreen === 'explore' && selectedCategoryId === 'flights'),
      icon: (active) => <FlightsIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('flights');
        setActiveScreen('flights');
      },
    },
    {
      id: 'hotels',
      label: 'Hotels',
      isActive: activeScreen === 'hotels' || (activeScreen === 'explore' && selectedCategoryId === 'hotels'),
      icon: (active) => <HotelsIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('hotels');
        setActiveScreen('hotels');
      },
    },
    {
      id: 'villas',
      label: 'Villas & Homestays',
      isActive: activeScreen === 'explore' && selectedCategoryId === 'villas',
      icon: (active) => <VillasIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('villas');
        setActiveScreen('hotels');
        showToast('🏡 Villas & Homestays: Discover private villas, heritage stays, and beachside cottages.');
      },
    },
    {
      id: 'holidays',
      label: 'Holiday Packages',
      badge: '-25%',
      badgeClass: 'bg-rose-500 text-white',
      isActive: activeScreen === 'explore' && selectedCategoryId === 'holidays',
      icon: (active) => <HolidaysIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('holidays');
        setActiveScreen('explore');
        showToast('🏖️ Holiday Packages: Flight + Hotel bundles at wholesale rates with up to 25% discount.');
      },
    },
    {
      id: 'trains',
      label: 'Trains',
      badge: 'Soon',
      badgeClass: 'bg-[#f28c1c] text-white',
      isActive: activeScreen === 'explore' && selectedCategoryId === 'trains',
      icon: (active) => <TrainsIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('trains');
        showToast('🚆 IRCTC Train Booking launching soon! Live PNR status, Tatkal seat prediction & zero cancellation fees.');
      },
    },
    {
      id: 'buses',
      label: 'Buses',
      badge: 'Soon',
      badgeClass: 'bg-[#f28c1c] text-white',
      isActive: activeScreen === 'explore' && selectedCategoryId === 'buses',
      icon: (active) => <BusesIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('buses');
        showToast('🚌 Intercity Bus Booking launching soon! Volvo Multi-Axle, AC Sleeper routes across 50,000+ paths.');
      },
    },
    {
      id: 'cabs',
      label: 'Cabs',
      badge: 'Soon',
      badgeClass: 'bg-[#f28c1c] text-white',
      isActive: activeScreen === 'explore' && selectedCategoryId === 'cabs',
      icon: (active) => <CabsIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('cabs');
        showToast('🚖 Airport & Outstation Cabs launching soon! Transparent fixed pricing with guaranteed on-time pickups.');
      },
    },
    {
      id: 'tours',
      label: 'Tours & Attractions',
      isActive: activeScreen === 'explore' && selectedCategoryId === 'tours',
      icon: (active) => <ToursIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('tours');
        showToast('🎈 Tours & Attractions launching soon! Skip-the-line museum tickets, adventure sports & guided tours.');
      },
    },
    {
      id: 'visa',
      label: 'Visa',
      isActive: activeScreen === 'explore' && selectedCategoryId === 'visa',
      icon: (active) => <VisaIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('visa');
        showToast('🛂 Travel Visa Services launching soon! Fast-track tourist eVisa processing for 70+ countries.');
      },
    },
    {
      id: 'forex',
      label: 'Forex Card & Currency',
      isActive: activeScreen === 'explore' && selectedCategoryId === 'forex',
      icon: (active) => <ForexIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('forex');
        showToast('💵 Forex Cards & Cash Currency launching soon! Zero markup multi-currency cards delivered to your doorstep.');
      },
    },
    {
      id: 'insurance',
      label: 'Travel Insurance',
      isActive: activeScreen === 'explore' && selectedCategoryId === 'insurance',
      icon: (active) => <InsuranceIsometricIcon active={active} className="w-10 h-10 sm:w-11 sm:h-11" />,
      onClick: () => {
        setSelectedCategoryId('insurance');
        showToast('🛡️ Comprehensive Travel Insurance launching soon! Medical emergencies, trip cancellation & lost luggage coverage.');
      },
    },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* ── TOP NAV BAR (NAVY BRAND STRIP) ── */}
      <div className="bg-gradient-to-r from-[#071a3d] via-primary to-[#143d8a] text-on-primary border-b border-white/10">
        <div className="max-w-[1340px] mx-auto px-gutter">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Brand Logo */}
            <div 
              onClick={() => setActiveScreen('explore')}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
            >
              <div className="relative">
                <img 
                  src="/assets/ss-journey-logo.jpg" 
                  alt="SS Journey Logo" 
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-cover shadow-md ring-2 ring-white/20 group-hover:ring-white/40 group-hover:scale-105 transition-all duration-300 bg-white p-0.5"
                />
                <div className="absolute inset-0 rounded-xl bg-[#f28c1c]/20 blur-md -z-10 group-hover:bg-[#f28c1c]/30 transition-colors" />
              </div>
              <div>
                <span className="text-[19px] sm:text-[22px] font-extrabold tracking-tight text-white drop-shadow-sm leading-tight block">
                  SS Journey
                </span>
                <span className="block text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.14em] text-[#f28c1c] font-bold -mt-0.5">
                  Explore · Book · Travel · More
                </span>
              </div>
            </div>

            {/* Right Action Items */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Currency & Language */}
              <div className="hidden lg:flex items-center gap-1.5 text-label-md text-blue-200 font-semibold px-2.5 py-1 rounded-lg hover:bg-white/[0.08] cursor-pointer transition-colors">
                <span>INR (₹)</span>
                <span className="text-white/30">·</span>
                <span>EN</span>
              </div>

              {/* My Trips */}
              <button 
                type="button"
                onClick={() => setActiveScreen('trips')}
                title="View Booked Trips"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-label-md sm:text-label-lg font-semibold transition-all cursor-pointer ${
                  activeScreen === 'trips'
                    ? 'bg-white text-primary shadow-sm font-bold'
                    : 'text-blue-200 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">luggage</span>
                <span className="hidden sm:inline">My Trips</span>
              </button>

              {/* Checkout / Cart */}
              <button 
                type="button"
                onClick={() => setActiveScreen('checkout')}
                title="Cart & Checkout"
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-label-md sm:text-label-lg font-semibold transition-all cursor-pointer ${
                  activeScreen === 'checkout'
                    ? 'bg-white text-primary shadow-sm font-bold'
                    : 'text-blue-200 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                <span className="hidden xl:inline">Checkout</span>
                <span className="w-2 h-2 rounded-full bg-[#f28c1c] animate-pulse" />
              </button>

              {/* User Profile or Sign In */}
              {user ? (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                  <span className="material-symbols-outlined text-[#f28c1c] text-[20px]">account_circle</span>
                  <span className="text-label-md font-bold text-white max-w-[100px] sm:max-w-[120px] truncate">
                    {user.fullName || user.email.split('@')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Sign Out"
                    className="ml-1 text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#f28c1c] hover:bg-[#e57a0e] text-white text-label-md sm:text-label-lg font-bold shadow-md shadow-[#f28c1c]/25 hover:shadow-lg hover:shadow-[#f28c1c]/30 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAKEMYTRIP-STYLE ISOMETRIC CATEGORY NAVIGATION BAR ── */}
      <nav className="bg-white border-b border-slate-200/90 shadow-xs select-none">
        <div className="max-w-[1340px] mx-auto px-gutter">
          <div className="flex items-center justify-start md:justify-center gap-5 sm:gap-7 md:gap-8 overflow-x-auto no-scrollbar py-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={cat.onClick}
                className="group relative flex flex-col items-center justify-between cursor-pointer shrink-0 pt-1 pb-1 transition-all"
              >
                {/* Isometric 3D-Style Icon Container */}
                <div className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11">
                  {cat.icon(cat.isActive)}
                  {/* Micro Badge (e.g. -25% or Soon) */}
                  {cat.badge && (
                    <span className={`absolute -top-1 -right-2 text-[8.5px] font-extrabold px-1 py-0.2 rounded-full leading-tight shadow-xs ${cat.badgeClass}`}>
                      {cat.badge}
                    </span>
                  )}
                </div>

                {/* Category Label */}
                <span 
                  className={`mt-1 text-[11px] sm:text-[12px] font-semibold text-center whitespace-nowrap transition-colors ${
                    cat.isActive 
                      ? 'text-[#0084ff] font-bold' 
                      : 'text-slate-600 group-hover:text-[#0084ff]'
                  }`}
                >
                  {cat.label}
                </span>

                {/* Active Indicator Bar Underneath */}
                <div 
                  className={`h-[3px] rounded-full w-full mt-1.5 transition-all ${
                    cat.isActive ? 'bg-[#0084ff]' : 'bg-transparent group-hover:bg-slate-200'
                  }`} 
                />
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Floating Interactive Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 bg-[#071a3d]/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-fade-in max-w-[90vw] sm:max-w-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f28c1c] animate-ping shrink-0" />
          <span className="text-body-sm font-medium flex-1">{toastMessage}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
