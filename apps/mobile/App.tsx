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
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { MyTripsScreen } from './src/screens/MyTripsScreen';
import { MyProfileScreen } from './src/screens/MyProfileScreen';
import { ScreenName, FlightOption, HotelOption, TripBookingState } from './src/types/travel';
import { getCurrentUserMobileApi } from './src/services/api';
import { Colors } from './src/theme/theme';
import { WishlistProvider, useWishlist } from './src/context/WishlistContext';
import { WishlistModal } from './src/components/WishlistModal';

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('explore');
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | undefined>();
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | undefined>();
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
    setCurrentScreen(screen);
  };

  const handleGoBack = () => {
    if (currentScreen === 'checkout') {
      setCurrentScreen('flights');
    } else if (currentScreen === 'flights' || currentScreen === 'hotels' || currentScreen === 'trips' || currentScreen === 'profile') {
      setCurrentScreen('explore');
    } else {
      setCurrentScreen('explore');
    }
  };

  const handleInitiateBooking = (state: TripBookingState) => {
    setBookingState(state);
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
              onSelectFlight={(flight) => setSelectedFlight(flight)}
            />
          )}

          {currentScreen === 'hotels' && (
            <HotelListingsScreen
              onNavigate={handleNavigate}
              onSelectHotel={(hotel) => setSelectedHotel(hotel)}
            />
          )}

          {currentScreen === 'checkout' && (
            <CheckoutScreen
              onNavigate={handleNavigate}
              selectedFlight={selectedFlight}
              selectedHotel={selectedHotel}
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
    <WishlistProvider>
      <MainApp />
    </WishlistProvider>
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
