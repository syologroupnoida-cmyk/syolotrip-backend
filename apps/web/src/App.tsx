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
  };

  const handleSearchHotels = (params: HotelSearchParams) => {
    setHotelSearchParams(params);
    setActiveScreen('hotels');
  };

  const handleInitiateCheckout = (item: WebCheckoutItem) => {
    setCheckoutItem(item);
    setActiveScreen('checkout');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-on-surface">
      {/* Global Navigation Header */}
      <Header 
        activeScreen={activeScreen} 
        setActiveScreen={setActiveScreen} 
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
            onNavigate={setActiveScreen} 
            onSearchFlights={handleSearchFlights}
            onSearchHotels={handleSearchHotels}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'flights' && (
          <FlightSearchPage 
            onNavigate={setActiveScreen} 
            searchParams={flightSearchParams}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'hotels' && (
          <HotelSearchPage 
            onNavigate={setActiveScreen} 
            searchParams={hotelSearchParams}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'trains' && (
          <TrainSearchPage 
            onNavigate={setActiveScreen} 
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'buses' && (
          <BusSearchPage 
            onNavigate={setActiveScreen} 
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'cabs' && (
          <CabSearchPage 
            onNavigate={setActiveScreen} 
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'packages' && (
          <PackageSearchPage 
            onNavigate={setActiveScreen} 
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'checkout' && (
          <BookingCheckoutPage 
            onNavigate={setActiveScreen} 
            bookingItem={checkoutItem || undefined}
            currentUser={user}
          />
        )}
        {activeScreen === 'trips' && (
          <MyTripsPage 
            onNavigate={setActiveScreen} 
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
        {activeScreen === 'list-property' && (
          <ListPropertyPage 
            onNavigate={setActiveScreen} 
          />
        )}
        {activeScreen === 'mybiz' && (
          <MyBizLandingPage 
            onNavigate={setActiveScreen} 
            user={user}
            bizContext={bizContext}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBizRegistered={handleBizRegistered}
          />
        )}
        {activeScreen === 'mybiz-dashboard' && (
          <MyBizDashboardPage 
            onNavigate={setActiveScreen} 
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
        onExplore={() => setActiveScreen('explore')}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Global Footer */}
      <Footer onNavigate={setActiveScreen} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WishlistProvider>
        <AppContent />
      </WishlistProvider>
    </QueryClientProvider>
  );
};

export default App;
