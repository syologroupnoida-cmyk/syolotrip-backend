import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from './src/components/Header';
import { BottomNavigation } from './src/components/BottomNavigation';
import { NotificationsModal } from './src/components/NotificationsModal';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { FlightResultsScreen } from './src/screens/FlightResultsScreen';
import { HotelListingsScreen } from './src/screens/HotelListingsScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { ScreenName, FlightOption, HotelOption } from './src/types/travel';
import { Colors } from './src/theme/theme';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('explore');
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | undefined>();
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | undefined>();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleNavigate = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  const handleGoBack = () => {
    if (currentScreen === 'checkout') {
      setCurrentScreen('flights');
    } else if (currentScreen === 'flights' || currentScreen === 'hotels') {
      setCurrentScreen('explore');
    } else {
      setCurrentScreen('explore');
    }
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
          onPressProfile={() => {
            // Profile action: toggle to explore or show alert
          }}
        />

        {/* Active Screen View */}
        <View style={styles.mainContent}>
          {currentScreen === 'explore' && (
            <ExploreScreen onNavigate={handleNavigate} />
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
            />
          )}
        </View>

        {/* Bottom Tabs Navigation */}
        <BottomNavigation
          currentScreen={currentScreen}
          onSelectScreen={handleNavigate}
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
