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
import { ListPropertyPage } from './pages/ListPropertyPage';
import { VendorRegistrationPage } from './pages/VendorRegistrationPage';
import { VendorKYCPage } from './pages/VendorKYCPage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { BusinessLandingPage } from './pages/BusinessLandingPage';
import { BusinessRegistrationPage } from './pages/BusinessRegistrationPage';
import { BusinessLoginPage } from './pages/BusinessLoginPage';
import { BusinessDashboardPage } from './pages/BusinessDashboardPage';
import { CustomerDashboardPage, DashboardSubTab } from './pages/CustomerDashboardPage';
import { normalizePath } from './utils/routeContext';
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
  MyBizEmployee,
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
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  );
  const [vendorFormMode, setVendorFormMode] = useState<'register' | 'login'>('register');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bizContext, setBizContext] = useState<MyBizContext | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<WebCheckoutItem | null>(null);
  const [pendingCheckoutItem, setPendingCheckoutItem] = useState<WebCheckoutItem | null>(null);
  const [pendingScreen, setPendingScreen] = useState<ScreenType | null>(null);
  const [dashboardTab, setDashboardTab] = useState<DashboardSubTab>('overview');
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

  const [trainSearchParams, setTrainSearchParams] = useState<{
    fromCity: string;
    toCity: string;
    travelDate?: string;
  }>({
    fromCity: 'Delhi',
    toCity: 'Mumbai',
    travelDate: '2026-10-24',
  });

  const [busSearchParams, setBusSearchParams] = useState<{
    fromCity: string;
    toCity: string;
    travelDate?: string;
    returnDate?: string;
    seats?: string;
    busType?: string;
  }>({
    fromCity: 'Bengaluru',
    toCity: 'Goa',
    travelDate: '2026-10-24',
    returnDate: '2026-10-28',
    seats: '1 Seat',
    busType: 'All Bus Types',
  });

  const [cabSearchParams, setCabSearchParams] = useState<{
    city: string;
    pickup?: string;
    drop?: string;
  }>({
    city: 'Delhi',
    pickup: 'IGI Airport Terminal 3',
    drop: 'Connaught Place / Central Delhi',
  });

  const [packageSearchParams, setPackageSearchParams] = useState<{
    destination: string;
  }>({
    destination: 'Kashmir',
  });

  const getPathForScreen = (screen: ScreenType, vendorMode: 'register' | 'login' = 'register'): string => {
    switch (screen) {
      case 'explore': return '/';
      case 'flights': return '/flights';
      case 'hotels': return '/hotels';
      case 'trains': return '/trains';
      case 'buses': return '/buses';
      case 'cabs': return '/cabs';
      case 'packages': return '/packages';
      case 'checkout': return '/checkout';
      case 'trips': return '/trips';
      case 'dashboard': return '/dashboard';
      case 'wallet': return '/wallet';
      case 'list-property': return '/list-your-property';
      case 'vendor-register': return vendorMode === 'login' ? '/partner/login' : '/partner/register';
      case 'vendor-kyc': return '/partner/kyc';
      case 'vendor-dashboard': return '/partner/dashboard';
      case 'business': return '/business';
      case 'business-register': return '/business/register';
      case 'business-login': return '/business/login';
      case 'business-dashboard': return '/business/dashboard';
      case 'mybiz': return '/business';
      case 'mybiz-dashboard': return '/business/dashboard';
      default: return '/';
    }
  };

  const syncUrlState = (
    screen: ScreenType,
    fParams?: FlightSearchParams,
    hParams?: HotelSearchParams,
    replace = false,
    targetPath?: string
  ) => {
    try {
      const path = targetPath || getPathForScreen(screen, vendorFormMode);
      const sp = new URLSearchParams(window.location.search);
      sp.delete('screen');
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
      const qs = sp.toString();
      const newUrl = qs ? `${path}?${qs}` : path;
      const stateObj = { 
        screen, 
        path, 
        vendorMode: vendorFormMode,
        fParams: fParams || flightSearchParams, 
        hParams: hParams || hotelSearchParams 
      };
      if (replace) {
        window.history.replaceState(stateObj, '', newUrl);
      } else {
        window.history.pushState(stateObj, '', newUrl);
      }
    } catch {
      // Safe fallback for SSR or restricted browser contexts
    }
  };

  const parseRouteFromUrl = (pathname: string) => {
    const norm = normalizePath(pathname);
    if (norm === '/partner/login') {
      setVendorFormMode('login');
      setActiveScreen('vendor-register');
      setCurrentPath('/partner/login');
      return;
    }
    if (norm === '/partner/register') {
      setVendorFormMode('register');
      setActiveScreen('vendor-register');
      setCurrentPath('/partner/register');
      return;
    }
    if (norm === '/partner/dashboard' || norm === '/partner/properties' || norm === '/partner/profile') {
      setActiveScreen('vendor-dashboard');
      setCurrentPath('/partner/dashboard');
      return;
    }
    if (norm === '/partner/kyc') {
      setActiveScreen('vendor-kyc');
      setCurrentPath('/partner/kyc');
      return;
    }
    if (norm === '/list-your-property' || norm === '/list-property') {
      setActiveScreen('list-property');
      setCurrentPath('/list-your-property');
      return;
    }
    if (norm === '/login') {
      setActiveScreen('explore');
      setCurrentPath('/login');
      setIsAuthOpen(true);
      return;
    }
    if (norm === '/flights') { setActiveScreen('flights'); setCurrentPath('/flights'); return; }
    if (norm === '/hotels') { setActiveScreen('hotels'); setCurrentPath('/hotels'); return; }
    if (norm === '/trains') { setActiveScreen('trains'); setCurrentPath('/trains'); return; }
    if (norm === '/buses') { setActiveScreen('buses'); setCurrentPath('/buses'); return; }
    if (norm === '/cabs') { setActiveScreen('cabs'); setCurrentPath('/cabs'); return; }
    if (norm === '/packages') { setActiveScreen('packages'); setCurrentPath('/packages'); return; }
    if (norm === '/checkout') { setActiveScreen('checkout'); setCurrentPath('/checkout'); return; }
    if (norm === '/trips') { setActiveScreen('trips'); setCurrentPath('/trips'); return; }
    if (norm === '/wallet') {
      setActiveScreen('wallet');
      setDashboardTab('wallet');
      setCurrentPath('/wallet');
      return;
    }
    if (norm === '/dashboard') { setActiveScreen('dashboard'); setCurrentPath('/dashboard'); return; }
    if (norm === '/business/register') {
      setActiveScreen('business-register');
      setCurrentPath('/business/register');
      return;
    }
    if (norm === '/business/login') {
      setActiveScreen('business-login');
      setCurrentPath('/business/login');
      return;
    }
    if (norm === '/business/dashboard' || norm.startsWith('/business/')) {
      setActiveScreen('business-dashboard');
      setCurrentPath(norm);
      return;
    }
    if (norm === '/business' || norm === '/mybiz') {
      setActiveScreen('business');
      setCurrentPath('/business');
      return;
    }
    if (norm === '/mybiz-dashboard') {
      setActiveScreen('business-dashboard');
      setCurrentPath('/business/dashboard');
      return;
    }
    
    // Default fallback to home
    setActiveScreen('explore');
    setCurrentPath('/');
  };

  const navigateTo = (screen: ScreenType, vendorMode?: 'register' | 'login') => {
    // Auth Guard for private customer sections
    if ((screen === 'checkout' || screen === 'trips' || screen === 'dashboard' || screen === 'wallet') && !user) {
      setPendingScreen(screen === 'wallet' ? 'dashboard' : screen);
      if (screen === 'wallet') setDashboardTab('wallet');
      handleOpenCustomerAuth();
      return;
    }

    if (screen === 'wallet') {
      setDashboardTab('wallet');
      setActiveScreen('dashboard');
      setCurrentPath('/wallet');
      syncUrlState('dashboard', undefined, undefined, false, '/wallet');
      return;
    }

    // Role Guard for protected vendor sections
    if ((screen === 'vendor-dashboard' || screen === 'vendor-kyc') && user && user.role === 'CUSTOMER') {
      alert('Your logged-in account is a Customer account. Please sign in or register with your Property Partner credentials to access the Extranet.');
      navigateTo('vendor-register', 'login');
      return;
    }

    if (screen === 'vendor-register' && vendorMode) {
      setVendorFormMode(vendorMode);
    }

    const mode = vendorMode || vendorFormMode;
    const newPath = getPathForScreen(screen, mode);
    setCurrentPath(newPath);
    setActiveScreen(screen);
    syncUrlState(screen, flightSearchParams, hotelSearchParams, false, newPath);
  };

  const handleOpenCustomerAuth = () => {
    try {
      window.history.pushState({ screen: activeScreen, auth: true }, '', '/login');
      setCurrentPath('/login');
    } catch {}
    setIsAuthOpen(true);
  };

  const handlePartnerLogin = () => {
    navigateTo('vendor-register', 'login');
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
    if (currentPath === '/login') {
      const prevPath = getPathForScreen(activeScreen, vendorFormMode);
      try {
        window.history.replaceState({ screen: activeScreen }, '', prevPath);
        setCurrentPath(prevPath);
      } catch {}
    }
  };

  const handleNavigateDashboardTab = (tab: DashboardSubTab) => {
    setDashboardTab(tab);
    if (!user) {
      setPendingScreen(tab === 'wallet' ? 'wallet' : 'dashboard');
      handleOpenCustomerAuth();
      return;
    }
    setActiveScreen('dashboard');
    const path = tab === 'wallet' ? '/wallet' : tab === 'trips' ? '/trips' : '/dashboard';
    setCurrentPath(path);
    syncUrlState('dashboard', undefined, undefined, false, path);
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
        const path = window.location.pathname;
        if (path && path !== '/') {
          parseRouteFromUrl(path);
          return;
        }
        const sp = new URLSearchParams(window.location.search);
        const scr = sp.get('screen') as ScreenType | null;
        if (scr) {
          setActiveScreen(scr);
          setCurrentPath(getPathForScreen(scr));
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
        } else {
          setActiveScreen('explore');
          setCurrentPath('/');
        }
      } catch {
        // Safe fallback
      }
    };

    parseUrl();

    // 2. Handle Browser Back / Forward buttons
    const handlePopState = (e: PopStateEvent) => {
      const path = window.location.pathname;
      if (path && path !== '/') {
        parseRouteFromUrl(path);
        return;
      }
      if (e.state && e.state.screen) {
        setActiveScreen(e.state.screen);
        if (e.state.path) setCurrentPath(e.state.path);
        if (e.state.vendorMode) setVendorFormMode(e.state.vendorMode);
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
    if (currentPath.startsWith('/partner')) {
      navigateTo('vendor-register', 'login');
    }
  };

  const handleAuthSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    fetchBizContext();

    // Resume preserved intent after successful login
    if (pendingCheckoutItem) {
      const item = pendingCheckoutItem;
      setPendingCheckoutItem(null);
      setCheckoutItem(item);
      setActiveScreen('checkout');
      syncUrlState('checkout', undefined, undefined, false);
    } else if (pendingScreen) {
      const scr = pendingScreen;
      setPendingScreen(null);
      setActiveScreen(scr);
      syncUrlState(scr, undefined, undefined, false);
    }
  };

  const handleBizRegistered = (company: MyBizCompany) => {
    setBizContext({
      is_biz_user: true,
      company_id: company.id,
      company_name: company.name,
      biz_role: 'BIZ_ADMIN',
    });
    fetchBizContext();
  };

  const handleBizLoginSuccess = (
    loggedInUser: UserProfile,
    company: MyBizCompany,
    employee: MyBizEmployee
  ) => {
    setUser(loggedInUser);
    setBizContext({
      is_biz_user: true,
      company_id: company.id,
      company_name: company.name,
      biz_role: employee.role as any,
    });
    fetchBizContext();
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

  const handleSearchTrains = (params: { fromCity: string; toCity: string; travelDate?: string }) => {
    setTrainSearchParams(params);
    setActiveScreen('trains');
  };

  const handleSearchBuses = (params: { 
    fromCity: string; 
    toCity: string; 
    travelDate?: string; 
    returnDate?: string; 
    seats?: string; 
    busType?: string; 
  }) => {
    setBusSearchParams(params);
    setActiveScreen('buses');
  };

  const handleSearchCabs = (params: { city: string; pickup?: string; drop?: string }) => {
    setCabSearchParams(params);
    setActiveScreen('cabs');
  };

  const handleSearchPackages = (params: { destination: string }) => {
    setPackageSearchParams(params);
    setActiveScreen('packages');
  };

  const handleInitiateCheckout = (item: WebCheckoutItem) => {
    // Auth Guard: Guest user cannot checkout directly; preserve item and prompt auth
    if (!user) {
      setPendingCheckoutItem(item);
      setIsAuthOpen(true);
      return;
    }
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
        currentPath={currentPath}
        user={user}
        bizContext={bizContext}
        onOpenAuth={handleOpenCustomerAuth}
        onPartnerLogin={handlePartnerLogin}
        onBusinessLogin={() => navigateTo('business-login')}
        onLogout={handleLogout}
        onOpenWishlist={() => {
          if (!user) {
            setPendingScreen('dashboard');
            setDashboardTab('wishlist');
            handleOpenCustomerAuth();
          } else {
            handleNavigateDashboardTab('wishlist');
          }
        }}
        wishlistCount={wishlistCount}
        onNavigateDashboardTab={handleNavigateDashboardTab}
      />

      {/* Active Screen View */}
      <main className={`flex-1 ${activeScreen !== 'explore' ? 'pt-16 sm:pt-[70px]' : ''}`}>
        {activeScreen === 'explore' && (
          <ExplorePage 
            onNavigate={navigateTo} 
            onSearchFlights={handleSearchFlights}
            onSearchHotels={handleSearchHotels}
            onSearchTrains={handleSearchTrains}
            onSearchBuses={handleSearchBuses}
            onSearchCabs={handleSearchCabs}
            onSearchPackages={handleSearchPackages}
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
            fromCity={trainSearchParams.fromCity}
            toCity={trainSearchParams.toCity}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'buses' && (
          <BusSearchPage 
            onNavigate={navigateTo} 
            fromCity={busSearchParams.fromCity}
            toCity={busSearchParams.toCity}
            travelDate={busSearchParams.travelDate}
            returnDate={busSearchParams.returnDate}
            seats={busSearchParams.seats}
            busType={busSearchParams.busType}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'cabs' && (
          <CabSearchPage 
            onNavigate={navigateTo} 
            city={cabSearchParams.city}
            pickupLocation={cabSearchParams.pickup}
            dropLocation={cabSearchParams.drop}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}
        {activeScreen === 'packages' && (
          <PackageSearchPage 
            onNavigate={navigateTo} 
            destinationCity={packageSearchParams.destination}
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
        {(activeScreen === 'dashboard' || activeScreen === 'trips' || activeScreen === 'wallet') && (
          <CustomerDashboardPage 
            onNavigate={navigateTo} 
            onInitiateCheckout={handleInitiateCheckout}
            onOpenAuth={handleOpenCustomerAuth}
            initialTab={activeScreen === 'trips' ? 'trips' : activeScreen === 'wallet' ? 'wallet' : dashboardTab}
            currentUser={user}
            onLogout={handleLogout}
          />
        )}
        {activeScreen === 'list-property' && (
          <ListPropertyPage 
            onNavigate={navigateTo} 
          />
        )}
        {activeScreen === 'vendor-register' && (
          <VendorRegistrationPage 
            onNavigate={navigateTo} 
            onLoginSuccess={(u) => setUser(u)}
            initialMode={vendorFormMode}
          />
        )}
        {activeScreen === 'vendor-kyc' && (
          <VendorKYCPage 
            onNavigate={navigateTo} 
          />
        )}
        {activeScreen === 'vendor-dashboard' && (
          <VendorDashboardPage 
            onNavigate={navigateTo} 
            onLogout={handleLogout}
          />
        )}
        {(activeScreen === 'business' || activeScreen === 'mybiz') && (
          <BusinessLandingPage 
            onNavigate={navigateTo} 
            user={user}
            bizContext={bizContext}
            onOpenAuth={handleOpenCustomerAuth}
          />
        )}
        {activeScreen === 'business-register' && (
          <BusinessRegistrationPage
            onNavigate={navigateTo}
            onBizRegistered={(company) => {
              handleBizRegistered(company);
              fetchBizContext();
            }}
          />
        )}
        {activeScreen === 'business-login' && (
          <BusinessLoginPage
            onNavigate={navigateTo}
            onBizLoginSuccess={handleBizLoginSuccess}
          />
        )}
        {(activeScreen === 'business-dashboard' || activeScreen === 'mybiz-dashboard') && (
          <BusinessDashboardPage 
            onNavigate={navigateTo} 
            user={user}
            bizContext={bizContext}
            onOpenAuth={() => navigateTo('business-login')}
            initialTab={currentPath?.replace('/business/', '')}
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
        onClose={handleCloseAuth}
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
