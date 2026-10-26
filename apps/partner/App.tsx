import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from './src/theme/theme';
import {
  ScreenName,
  PartnerPropertyData,
  HotelRoomData,
  PartnerBookingData,
} from './src/types/partner';
import {
  PartnerAuthProvider,
  usePartnerAuth,
} from './src/context/PartnerAuthContext';
import { PartnerHeader } from './src/components/PartnerHeader';
import { PartnerAuthScreen } from './src/screens/PartnerAuthScreen';
import { PartnerDashboardScreen } from './src/screens/PartnerDashboardScreen';
import { PartnerPropertiesScreen } from './src/screens/PartnerPropertiesScreen';
import { PropertyDetailScreen } from './src/screens/PropertyDetailScreen';
import { CreateEditPropertyScreen } from './src/screens/CreateEditPropertyScreen';
import { ManageRoomsScreen } from './src/screens/ManageRoomsScreen';
import { InventoryCalendarScreen } from './src/screens/InventoryCalendarScreen';
import { PartnerBookingsScreen } from './src/screens/PartnerBookingsScreen';
import { PartnerProfileScreen } from './src/screens/PartnerProfileScreen';

function PartnerMainApp() {
  const { isAuthenticated, isLoading } = usePartnerAuth();

  const [currentScreen, setCurrentScreen] = useState<ScreenName>('dashboard');
  const [previousScreen, setPreviousScreen] = useState<ScreenName>('dashboard');

  // Selected item states across screens
  const [selectedProperty, setSelectedProperty] = useState<PartnerPropertyData | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoomData | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<PartnerBookingData | null>(null);

  const navigateTo = (screen: ScreenName) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
  };

  const handleGoBack = () => {
    if (currentScreen === 'property_detail' || currentScreen === 'create_property' || currentScreen === 'edit_property') {
      setCurrentScreen('properties');
    } else if (currentScreen === 'rooms' || currentScreen === 'inventory_calendar') {
      if (selectedProperty) {
        setCurrentScreen('property_detail');
      } else {
        setCurrentScreen('properties');
      }
    } else {
      setCurrentScreen('dashboard');
    }
  };

  const canGoBack =
    currentScreen === 'property_detail' ||
    currentScreen === 'create_property' ||
    currentScreen === 'edit_property' ||
    currentScreen === 'rooms' ||
    currentScreen === 'inventory_calendar';

  if (!isAuthenticated && !isLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar style="light" />
          <PartnerHeader
            currentScreen="auth"
            canGoBack={false}
            onNavigate={navigateTo}
          />
          <PartnerAuthScreen onSuccess={() => setCurrentScreen('dashboard')} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        {/* Global Partner Header */}
        <PartnerHeader
          currentScreen={currentScreen}
          canGoBack={canGoBack}
          onNavigateBack={handleGoBack}
          onNavigate={navigateTo}
        />

        {/* Main Content Screen */}
        <View style={styles.content}>
          {currentScreen === 'dashboard' && (
            <PartnerDashboardScreen
              onNavigate={navigateTo}
              onSelectProperty={(prop) => {
                setSelectedProperty(prop);
                navigateTo('property_detail');
              }}
              onSelectBooking={(booking) => {
                setSelectedBooking(booking);
                navigateTo('bookings');
              }}
            />
          )}

          {currentScreen === 'properties' && (
            <PartnerPropertiesScreen
              onNavigate={navigateTo}
              onSelectProperty={(prop) => {
                setSelectedProperty(prop);
                navigateTo('property_detail');
              }}
              onEditProperty={(prop) => {
                setSelectedProperty(prop);
                navigateTo('edit_property');
              }}
              onManageRooms={(prop) => {
                setSelectedProperty(prop);
                navigateTo('rooms');
              }}
            />
          )}

          {currentScreen === 'property_detail' && selectedProperty && (
            <PropertyDetailScreen
              propertyId={selectedProperty.id}
              onEditProperty={(prop) => {
                setSelectedProperty(prop);
                navigateTo('edit_property');
              }}
              onManageRooms={(prop) => {
                setSelectedProperty(prop);
                navigateTo('rooms');
              }}
              onManageInventory={(prop) => {
                setSelectedProperty(prop);
                setSelectedRoom(prop.rooms?.[0] || null);
                navigateTo('inventory_calendar');
              }}
              onBack={handleGoBack}
            />
          )}

          {currentScreen === 'create_property' && (
            <CreateEditPropertyScreen
              onSuccess={(saved) => {
                setSelectedProperty(saved);
                navigateTo('property_detail');
              }}
              onCancel={handleGoBack}
            />
          )}

          {currentScreen === 'edit_property' && selectedProperty && (
            <CreateEditPropertyScreen
              property={selectedProperty}
              onSuccess={(saved) => {
                setSelectedProperty(saved);
                navigateTo('property_detail');
              }}
              onCancel={handleGoBack}
            />
          )}

          {currentScreen === 'rooms' && selectedProperty && (
            <ManageRoomsScreen
              property={selectedProperty}
              onOpenInventory={(prop, room) => {
                setSelectedProperty(prop);
                setSelectedRoom(room || null);
                navigateTo('inventory_calendar');
              }}
              onBack={handleGoBack}
            />
          )}

          {currentScreen === 'inventory_calendar' && (
            <InventoryCalendarScreen
              initialProperty={selectedProperty || undefined}
              initialRoom={selectedRoom || undefined}
              onBack={handleGoBack}
            />
          )}

          {currentScreen === 'bookings' && (
            <PartnerBookingsScreen
              initialBooking={selectedBooking || undefined}
            />
          )}

          {currentScreen === 'profile' && (
            <PartnerProfileScreen
              onLogout={() => setCurrentScreen('dashboard')}
            />
          )}
        </View>

        {/* Operational Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'dashboard' && styles.navItemActive]}
            onPress={() => navigateTo('dashboard')}
          >
            <MaterialIcons
              name="dashboard"
              size={22}
              color={currentScreen === 'dashboard' ? Colors.secondary : Colors.onSurfaceSubtle}
            />
            <Text
              style={[
                styles.navLabel,
                currentScreen === 'dashboard' && styles.navLabelActive,
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              (currentScreen === 'properties' ||
                currentScreen === 'property_detail' ||
                currentScreen === 'create_property' ||
                currentScreen === 'edit_property' ||
                currentScreen === 'rooms') &&
                styles.navItemActive,
            ]}
            onPress={() => navigateTo('properties')}
          >
            <MaterialIcons
              name="apartment"
              size={22}
              color={
                currentScreen === 'properties' ||
                currentScreen === 'property_detail' ||
                currentScreen === 'create_property' ||
                currentScreen === 'edit_property' ||
                currentScreen === 'rooms'
                  ? Colors.secondary
                  : Colors.onSurfaceSubtle
              }
            />
            <Text
              style={[
                styles.navLabel,
                (currentScreen === 'properties' ||
                  currentScreen === 'property_detail' ||
                  currentScreen === 'create_property' ||
                  currentScreen === 'edit_property' ||
                  currentScreen === 'rooms') &&
                  styles.navLabelActive,
              ]}
            >
              Listings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'bookings' && styles.navItemActive]}
            onPress={() => navigateTo('bookings')}
          >
            <MaterialIcons
              name="book-online"
              size={22}
              color={currentScreen === 'bookings' ? Colors.secondary : Colors.onSurfaceSubtle}
            />
            <Text
              style={[
                styles.navLabel,
                currentScreen === 'bookings' && styles.navLabelActive,
              ]}
            >
              Bookings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'inventory_calendar' && styles.navItemActive]}
            onPress={() => navigateTo('inventory_calendar')}
          >
            <MaterialIcons
              name="event-available"
              size={22}
              color={currentScreen === 'inventory_calendar' ? Colors.secondary : Colors.onSurfaceSubtle}
            />
            <Text
              style={[
                styles.navLabel,
                currentScreen === 'inventory_calendar' && styles.navLabelActive,
              ]}
            >
              Inventory
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'profile' && styles.navItemActive]}
            onPress={() => navigateTo('profile')}
          >
            <MaterialIcons
              name="person"
              size={22}
              color={currentScreen === 'profile' ? Colors.secondary : Colors.onSurfaceSubtle}
            />
            <Text
              style={[
                styles.navLabel,
                currentScreen === 'profile' && styles.navLabelActive,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <PartnerAuthProvider>
      <PartnerMainApp />
    </PartnerAuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    ...Shadows.md,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
  },
  navItemActive: {},
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceSubtle,
    marginTop: 2,
  },
  navLabelActive: {
    color: Colors.secondary,
    fontWeight: 'bold',
  },
});
