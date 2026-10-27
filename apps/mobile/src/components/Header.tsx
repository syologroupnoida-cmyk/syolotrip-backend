import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Shadows } from '../theme/theme';
import { ScreenName } from '../types/travel';

interface HeaderProps {
  currentScreen: ScreenName;
  onNavigateBack?: () => void;
  canGoBack?: boolean;
  onPressHamburger?: () => void;
  onPressNotifications?: () => void;
  unreadCount?: number;
}

const SCREEN_TITLES: Record<ScreenName, { title: string; subtitle: string }> = {
  explore: { title: 'SS JOURNEY', subtitle: 'Explore · Book · Travel' },
  flights: { title: 'Flights Search', subtitle: 'Live Airline Rates' },
  hotels: { title: 'Hotels & Stays', subtitle: 'Verified Luxury Stays' },
  trains: { title: 'Trains (IRCTC)', subtitle: 'Authorized Train Tickets' },
  buses: { title: 'Bus Booking', subtitle: 'Intercity AC Sleepers' },
  cabs: { title: 'Cabs & Transfers', subtitle: 'Airport & City Travel' },
  packages: { title: 'Holiday Packages', subtitle: 'Handcrafted Itineraries' },
  checkout: { title: 'Secure Checkout', subtitle: 'Confirm & Pay' },
  trips: { title: 'My Trips', subtitle: 'Bookings & Boarding Passes' },
  profile: { title: 'My Account', subtitle: 'Profile & Settings' },
};

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigateBack,
  canGoBack = false,
  onPressHamburger,
  onPressNotifications,
  unreadCount = 2,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left: Back Button (when canGoBack) OR Hamburger Menu Icon (on explore/root) */}
        <View style={styles.leftGroup}>
          {canGoBack && onNavigateBack ? (
            <TouchableOpacity
              onPress={onNavigateBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Go back"
            >
              <MaterialIcons name="arrow-back" size={22} color="#005cab" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onPressHamburger}
              style={styles.hamburgerButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Open menu"
            >
              <MaterialIcons name="menu" size={26} color="#005cab" />
            </TouchableOpacity>
          )}

          {/* Screen Title or Original SS Journey Branding */}
          <View style={styles.brandRow}>
            {canGoBack ? (
              <View style={styles.titleColumn}>
                <Text style={styles.brandTitle} numberOfLines={1}>
                  {SCREEN_TITLES[currentScreen]?.title || 'SS JOURNEY'}
                </Text>
                <Text style={styles.brandSubtitle} numberOfLines={1}>
                  {SCREEN_TITLES[currentScreen]?.subtitle || 'Explore · Book · Travel'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.logoWrapper}>
                  <Image
                    source={require('../../assets/ss-journey-emblem.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.titleColumn}>
                  <Text style={styles.brandTitle}>SYOLO TRIPS</Text>
                  <Text style={styles.brandSubtitle} numberOfLines={1}>
                    Explore Beyond!
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Right: Notification Bell Icon */}
        <View style={styles.rightGroup}>
          <TouchableOpacity
            onPress={onPressNotifications}
            style={styles.notificationButton}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="notifications-none" size={24} color="#005cab" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E7EBF0',
    ...Shadows.sm,
    zIndex: 100,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hamburgerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 92, 171, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoWrapper: {
    width: 30,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleColumn: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#071426',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#f28c1c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 92, 171, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#eb2026',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
});
export default Header;
