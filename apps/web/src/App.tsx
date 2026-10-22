import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header, ScreenType } from './components/Header';
import { Footer } from './components/Footer';
import { ExplorePage, FlightSearchParams, HotelSearchParams } from './pages/ExplorePage';
import { FlightSearchPage } from './pages/FlightSearchPage';
import { HotelSearchPage } from './pages/HotelSearchPage';
import { BookingCheckoutPage, WebCheckoutItem } from './pages/BookingCheckoutPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { AuthModal } from './components/AuthModal';
import { getCurrentUserApi, logoutApi, UserProfile } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('explore');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<WebCheckoutItem | null>(null);

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

  useEffect(() => {
    getCurrentUserApi().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
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
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-background font-sans text-on-surface">
        {/* Global Navigation Header */}
        <Header 
          activeScreen={activeScreen} 
          setActiveScreen={setActiveScreen} 
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
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
            />
          )}
          {activeScreen === 'hotels' && (
            <HotelSearchPage 
              onNavigate={setActiveScreen} 
              searchParams={hotelSearchParams}
            />
          )}
          {activeScreen === 'checkout' && (
            <BookingCheckoutPage 
              onNavigate={setActiveScreen} 
              bookingItem={checkoutItem || undefined}
            />
          )}
          {activeScreen === 'trips' && (
            <MyTripsPage 
              onNavigate={setActiveScreen} 
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}
        </main>

        {/* Auth Modal */}
        <AuthModal 
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(loggedInUser) => setUser(loggedInUser)}
        />

        {/* Global Footer */}
        <Footer onNavigate={setActiveScreen} />
      </div>
    </QueryClientProvider>
  );
};

export default App;
