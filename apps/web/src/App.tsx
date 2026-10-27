import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header, ScreenType } from './components/Header';
import { Footer } from './components/Footer';
import { ExplorePage, FlightSearchParams, HotelSearchParams } from './pages/ExplorePage';
import { FlightSearchPage } from './pages/FlightSearchPage';
import { HotelSearchPage } from './pages/HotelSearchPage';
import { TrainSearchPage } from './pages/TrainSearchPage';
import { BusSearchPage } from './pages/BusSearchPage';
import { CabSearchPage } from './pages/CabSearchPage';
import { PackageSearchPage } from './pages/PackageSearchPage';
import { BookingCheckoutPage, WebCheckoutItem } from './pages/BookingCheckoutPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { ListPropertyPage } from './pages/ListPropertyPage';
import { MyBizLandingPage } from './pages/MyBizLandingPage';
import { MyBizDashboardPage } from './pages/MyBizDashboardPage';
import { AuthModal } from './components/AuthModal';
import { WishlistModal } from './components/WishlistModal';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { CurrencyProvider } from './context/CurrencyContext';
import {
  getCurrentUserApi,
  logoutApi,
  UserProfile,
  getMyBizContextApi,
  MyBizContext,
  MyBizCompany,
} from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('explore');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bizContext, setBizContext] = useState<MyBizContext | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<WebCheckoutItem | null>(null);
  const { wishlistCount } = useWishlist();

  // Search parameters passed from ExplorePage to search pages
  const [flightSearchParams, setFlightSearchParams] = useState<FlightSearchParams>({
    fromCode: 'SFO',
    fromCity: 'San Francisco',
    toCode: 'HND',
    toCity: 'Tokyo Haneda',
    departDate: '2026-10-24',
    returnDate: '2026-10-31',
  });

  const [hotelSearchParams, setHotelSearchParams] = useState<HotelSearchParams>({
    city: 'Paris',
    checkIn: '2026-11-04',
    checkOut: '2026-11-11',
  });

  const syncUrlState = (
    screen: ScreenType,
    fParams?: FlightSearchParams,
    hParams?: HotelSearchParams,
    replace = false
  ) => {
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set('screen', screen);
      if (screen === 'flights') {
        const p = fParams || flightSearchParams;
        if (p.fromCode) sp.set('fromCode', p.fromCode);
        if (p.fromCity) sp.set('fromCity', p.fromCity);
        if (p.toCode) sp.set('toCode', p.toCode);
        if (p.toCity) sp.set('toCity', p.toCity);
        if (p.departDate) sp.set('departDate', p.departDate);
        if (p.returnDate) sp.set('returnDate', p.returnDate);
      } else if (screen === 'hotels') {
        const p = hParams || hotelSearchParams;
        if (p.city) sp.set('city', p.city);
        if (p.checkIn) sp.set('checkIn', p.checkIn);
        if (p.checkOut) sp.set('checkOut', p.checkOut);
      }
      const newUrl = `${window.location.pathname}?${sp.toString()}`;
      const stateObj = { screen, fParams: fParams || flightSearchParams, hParams: hParams || hotelSearchParams };
      if (replace) {
        window.history.replaceState(stateObj, '', newUrl);
      } else {
        window.history.pushState(stateObj, '', newUrl);
      }
    } catch {
      // Safe fallback for SSR or restricted browser contexts
    }
  };

  const navigateTo = (screen: ScreenType) => {
    setActiveScreen(screen);
    syncUrlState(screen, flightSearchParams, hotelSearchParams, false);
  };

  const fetchBizContext = async () => {
    try {
      const ctx = await getMyBizContextApi();
      if (ctx) setBizContext(ctx);
    } catch {
      setBizContext(null);
    }
  };

  useEffect(() => {
    getCurrentUserApi().then((u) => {
      if (u) {
        setUser(u);
        fetchBizContext();
      }
    });

    // 1. Initial parse of URL on mount
    const parseUrl = () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const scr = sp.get('screen') as ScreenType | null;
        if (scr) {
          setActiveScreen(scr);
          if (scr === 'flights') {
            const fromCode = sp.get('fromCode');
            const toCode = sp.get('toCode');
            if (fromCode || toCode) {
              setFlightSearchParams((prev) => ({
                ...prev,
                fromCode: fromCode || prev.fromCode,
                fromCity: sp.get('fromCity') || prev.fromCity,
                toCode: toCode || prev.toCode,
                toCity: sp.get('toCity') || prev.toCity,
                departDate: sp.get('departDate') || prev.departDate,
                returnDate: sp.get('returnDate') || prev.returnDate,
              }));
            }
          } else if (scr === 'hotels') {
            const city = sp.get('city');
            if (city) {
              setHotelSearchParams((prev) => ({
                ...prev,
                city: city || prev.city,
                checkIn: sp.get('checkIn') || prev.checkIn,
                checkOut: sp.get('checkOut') || prev.checkOut,
              }));
            }
          }
        }
      } catch {
        // Safe fallback
      }
    };

    parseUrl();

    // 2. Handle Browser Back / Forward buttons
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.screen) {
        setActiveScreen(e.state.screen);
        if (e.state.fParams) setFlightSearchParams(e.state.fParams);
        if (e.state.hParams) setHotelSearchParams(e.state.hParams);
      } else {
        parseUrl();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setBizContext(null);
  };

  const handleAuthSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    fetchBizContext();
  };

  const handleBizRegistered = (company: MyBizCompany) => {
    setBizContext({
      is_biz_user: true,
      company_id: company.id,
      company_name: company.name,
      biz_role: 'BIZ_ADMIN',
    });
  };

  const handleSearchFlights = (params: FlightSearchParams) => {
    setFlightSearchParams(params);
    setActiveScreen('flights');
    syncUrlState('flights', params, undefined, false);
  };

  const handleSearchHotels = (params: HotelSearchParams) => {
    setHotelSearchParams(params);
    setActiveScreen('hotels');
    syncUrlState('hotels', undefined, params, false);
  };

  const handleInitiateCheckout = (item: WebCheckoutItem) => {
    setCheckoutItem(item);
    setActiveScreen('checkout');
    syncUrlState('checkout', undefined, undefined, false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-on-surface">
      {/* Global Navigation Header */}
      <Header 
        activeScreen={activeScreen} 
        setActiveScreen={navigateTo} 
        user={user}
        bizContext={bizContext}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        wishlistCount={wishlistCount}
      />

      {/* Active Screen View */}
      <main className={`flex-1 ${activeScreen !== 'explore' ? 'pt-16 sm:pt-[70px]' : ''}`}>
        {activeScreen === 'explore' && (
          <ExplorePage 
            onNavigate={navigateTo} 
            onSearchFlights={handleSearchFlights}
            onSearchHotels={handleSearchHotels}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'flights' && (
          <FlightSearchPage 
            onNavigate={navigateTo} 
            searchParams={flightSearchParams}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'hotels' && (
          <HotelSearchPage 
            onNavigate={navigateTo} 
            searchParams={hotelSearchParams}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'trains' && (
          <TrainSearchPage 
            onNavigate={navigateTo} 
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'buses' && (
          <BusSearchPage 
            onNavigate={navigateTo} 
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'cabs' && (
          <CabSearchPage 
            onNavigate={navigateTo} 
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'packages' && (
          <PackageSearchPage 
            onNavigate={navigateTo} 
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'checkout' && (
          <BookingCheckoutPage 
            onNavigate={navigateTo} 
            bookingItem={checkoutItem || undefined}
            currentUser={user}
          />
        )}
        {activeScreen === 'trips' && (
          <MyTripsPage 
            onNavigate={navigateTo} 
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
        {activeScreen === 'list-property' && (
          <ListPropertyPage 
            onNavigate={navigateTo} 
          />
        )}
        {activeScreen === 'mybiz' && (
          <MyBizLandingPage 
            onNavigate={navigateTo} 
            user={user}
            bizContext={bizContext}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBizRegistered={handleBizRegistered}
          />
        )}
        {activeScreen === 'mybiz-dashboard' && (
          <MyBizDashboardPage 
            onNavigate={navigateTo} 
            user={user}
            bizContext={bizContext}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
      </main>

      {/* Wishlist / Liked Drawer Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        onInitiateCheckout={handleInitiateCheckout}
        onExplore={() => navigateTo('explore')}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Global Footer */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <WishlistProvider>
          <AppContent />
        </WishlistProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
};

export default App;
