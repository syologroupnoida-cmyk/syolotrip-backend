import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from './src/components/Header';
import { BottomNavigation } from './src/components/BottomNavigation';
import { NotificationsModal } from './src/components/NotificationsModal';
import { AuthModal } from './src/components/AuthModal';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { FlightResultsScreen } from './src/screens/FlightResultsScreen';
import { HotelListingsScreen } from './src/screens/HotelListingsScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { MyTripsScreen } from './src/screens/MyTripsScreen';
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
    } else if (currentScreen === 'flights' || currentScreen === 'hotels' || currentScreen === 'trips') {
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

        {/* Global App Header matching Stitch */}
        <Header
          currentScreen={currentScreen}
          canGoBack={canGoBack}
          onNavigateBack={handleGoBack}
          onPressNotifications={() => setIsNotificationsOpen(true)}
          onPressWishlist={() => setIsWishlistOpen(true)}
          wishlistCount={wishlistCount}
          onPressProfile={() => setIsAuthOpen(true)}
          user={user}
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
        </View>

        {/* Bottom Tabs Navigation */}
        <BottomNavigation
          currentScreen={currentScreen}
          onSelectScreen={handleNavigate}
        />

        {/* Wishlist / Liked Modal Sheet */}
        <WishlistModal
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          onInitiateBooking={handleInitiateBooking}
          onNavigate={handleNavigate}
        />

        {/* Customer Auth Modal */}
        <AuthModal
          visible={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          user={user}
          onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
          onLogout={() => setUser(null)}
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
