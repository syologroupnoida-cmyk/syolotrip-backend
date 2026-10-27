import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from './src/components/Header';
import { HamburgerDrawer } from './src/components/HamburgerDrawer';
import { NotificationsModal } from './src/components/NotificationsModal';
import { AuthModal } from './src/components/AuthModal';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { FlightResultsScreen } from './src/screens/FlightResultsScreen';
import { HotelListingsScreen } from './src/screens/HotelListingsScreen';
import { TrainResultsScreen } from './src/screens/TrainResultsScreen';
import { BusResultsScreen } from './src/screens/BusResultsScreen';
import { CabResultsScreen } from './src/screens/CabResultsScreen';
import { PackageResultsScreen } from './src/screens/PackageResultsScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { MyTripsScreen } from './src/screens/MyTripsScreen';
import { MyProfileScreen } from './src/screens/MyProfileScreen';
import {
  ScreenName,
  FlightOption,
  HotelOption,
  TrainOption,
  BusOption,
  CabOption,
  PackageOption,
  TripBookingState,
} from './src/types/travel';
import { getCurrentUserMobileApi } from './src/services/api';
import { Colors } from './src/theme/theme';
import { WishlistProvider, useWishlist } from './src/context/WishlistContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { WishlistModal } from './src/components/WishlistModal';

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('explore');
  const [previousScreen, setPreviousScreen] = useState<ScreenName>('explore');
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | undefined>();
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | undefined>();
  const [selectedTrain, setSelectedTrain] = useState<TrainOption | undefined>();
  const [selectedBus, setSelectedBus] = useState<BusOption | undefined>();
  const [selectedCab, setSelectedCab] = useState<CabOption | undefined>();
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | undefined>();
  const [bookingState, setBookingState] = useState<TripBookingState | undefined>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    getCurrentUserMobileApi().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  const handleNavigate = (screen: ScreenName) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
  };

  const handleGoBack = () => {
    if (currentScreen === 'checkout') {
      setCurrentScreen(previousScreen || 'explore');
    } else {
      setCurrentScreen('explore');
    }
  };

  const handleInitiateBooking = (state: TripBookingState) => {
    setBookingState(state);
    setPreviousScreen(currentScreen);
    setCurrentScreen('checkout');
  };

  const canGoBack = currentScreen !== 'explore';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        {/* Global App Header with Left Hamburger & Right Notification Bell */}
        <Header
          currentScreen={currentScreen}
          canGoBack={canGoBack}
          onNavigateBack={handleGoBack}
          onPressHamburger={() => setIsDrawerOpen(true)}
          onPressNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* Active Screen View */}
        <View style={styles.mainContent}>
          {currentScreen === 'explore' && (
            <ExploreScreen 
              onNavigate={handleNavigate} 
              onInitiateBooking={handleInitiateBooking}
            />
          )}

          {currentScreen === 'flights' && (
            <FlightResultsScreen
              onNavigate={handleNavigate}
              onSelectFlight={(flight) => {
                setSelectedFlight(flight);
                setSelectedHotel(undefined);
                setSelectedTrain(undefined);
                setSelectedBus(undefined);
                setSelectedCab(undefined);
                setSelectedPackage(undefined);
              }}
            />
          )}

          {currentScreen === 'hotels' && (
            <HotelListingsScreen
              onNavigate={handleNavigate}
              onSelectHotel={(hotel) => {
                setSelectedHotel(hotel);
                setSelectedFlight(undefined);
                setSelectedTrain(undefined);
                setSelectedBus(undefined);
                setSelectedCab(undefined);
                setSelectedPackage(undefined);
              }}
            />
          )}

          {currentScreen === 'trains' && (
            <TrainResultsScreen
              onNavigate={handleNavigate}
              onSelectTrain={(train) => {
                setSelectedTrain(train);
                setSelectedFlight(undefined);
                setSelectedHotel(undefined);
                setSelectedBus(undefined);
                setSelectedCab(undefined);
                setSelectedPackage(undefined);
                setBookingState({
                  serviceType: 'TRAIN',
                  originCode: train.fromStationCode,
                  originCity: train.fromStationName,
                  destCode: train.toStationCode,
                  destCity: train.toStationName,
                  datesText: 'Flexible Journey Date',
                  travelersText: `1 Passenger, Class ${train.trainClass}`,
                  seat: 'Confirmed Berth',
                  hasInsurance: true,
                  travelerName: '',
                  dob: '',
                  passportNumber: '',
                  frequentFlyer: '',
                  selectedTrain: train,
                });
              }}
            />
          )}

          {currentScreen === 'buses' && (
            <BusResultsScreen
              onNavigate={handleNavigate}
              onSelectBus={(bus) => {
                setSelectedBus(bus);
                setSelectedFlight(undefined);
                setSelectedHotel(undefined);
                setSelectedTrain(undefined);
                setSelectedCab(undefined);
                setSelectedPackage(undefined);
                setBookingState({
                  serviceType: 'BUS',
                  originCode: 'BUS-DEP',
                  originCity: bus.fromCity,
                  destCode: 'BUS-ARR',
                  destCity: bus.toCity,
                  datesText: 'Today / Tomorrow',
                  travelersText: `1 Passenger, ${bus.busType}`,
                  seat: 'Reserved Seat',
                  hasInsurance: true,
                  travelerName: '',
                  dob: '',
                  passportNumber: '',
                  frequentFlyer: '',
                  selectedBus: bus,
                });
              }}
            />
          )}

          {currentScreen === 'cabs' && (
            <CabResultsScreen
              onNavigate={handleNavigate}
              onSelectCab={(cab) => {
                setSelectedCab(cab);
                setSelectedFlight(undefined);
                setSelectedHotel(undefined);
                setSelectedTrain(undefined);
                setSelectedBus(undefined);
                setSelectedPackage(undefined);
                setBookingState({
                  serviceType: 'CAB',
                  originCode: 'CAB-PICK',
                  originCity: cab.pickupArea,
                  destCode: 'CAB-DROP',
                  destCity: cab.dropArea,
                  datesText: 'Immediate Pickup',
                  travelersText: `${cab.capacity} Passengers Max`,
                  seat: 'Standard',
                  hasInsurance: false,
                  travelerName: '',
                  dob: '',
                  passportNumber: '',
                  frequentFlyer: '',
                  selectedCab: cab,
                });
              }}
            />
          )}

          {currentScreen === 'packages' && (
            <PackageResultsScreen
              onNavigate={handleNavigate}
              onSelectPackage={(pkg) => {
                setSelectedPackage(pkg);
                setSelectedFlight(undefined);
                setSelectedHotel(undefined);
                setSelectedTrain(undefined);
                setSelectedBus(undefined);
                setSelectedCab(undefined);
                setBookingState({
                  serviceType: 'PACKAGE',
                  originCode: 'PKG-ORG',
                  originCity: 'New Delhi',
                  destCode: 'PKG-DEST',
                  destCity: pkg.destination,
                  datesText: `${pkg.durationDays}D / ${pkg.durationNights}N`,
                  travelersText: '1 Traveler, All-Inclusive',
                  seat: 'Standard',
                  hasInsurance: true,
                  travelerName: '',
                  dob: '',
                  passportNumber: '',
                  frequentFlyer: '',
                  selectedPackage: pkg,
                });
              }}
            />
          )}

          {currentScreen === 'checkout' && (
            <CheckoutScreen
              onNavigate={handleNavigate}
              selectedFlight={selectedFlight}
              selectedHotel={selectedHotel}
              selectedTrain={selectedTrain}
              selectedBus={selectedBus}
              selectedCab={selectedCab}
              selectedPackage={selectedPackage}
              bookingState={bookingState}
            />
          )}

          {currentScreen === 'trips' && (
            <MyTripsScreen
              onNavigate={handleNavigate}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {currentScreen === 'profile' && (
            <MyProfileScreen
              onNavigate={handleNavigate}
              user={user}
              onOpenAuth={() => setIsAuthOpen(true)}
              onLogout={() => setUser(null)}
              onOpenWishlist={() => setIsWishlistOpen(true)}
            />
          )}
        </View>

        {/* Hamburger Side Drawer Menu */}
        <HamburgerDrawer
          visible={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          user={user}
          onPressProfile={() => setCurrentScreen('profile')}
          onPressWishlist={() => setIsWishlistOpen(true)}
          wishlistCount={wishlistCount}
          onPressTrips={() => setCurrentScreen('trips')}
        />

        {/* Wishlist / Liked Modal Sheet */}
        <WishlistModal
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          onInitiateBooking={handleInitiateBooking}
          onNavigate={handleNavigate}
          onSelectHotel={(hotel) => setSelectedHotel(hotel)}
          onSelectFlight={(flight) => setSelectedFlight(flight)}
        />

        {/* Customer Auth Modal */}
        <AuthModal
          visible={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          user={user}
          onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
          onLogout={() => setUser(null)}
          onNavigateToTrips={() => setCurrentScreen('trips')}
        />

        {/* Notifications Modal Sheet */}
        <NotificationsModal
          visible={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <WishlistProvider>
        <MainApp />
      </WishlistProvider>
    </CurrencyProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071a3d',
  },
  mainContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
