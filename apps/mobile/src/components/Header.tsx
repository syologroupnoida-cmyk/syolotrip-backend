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
        {/* Left: Back Button (if canGoBack) + Hamburger Icon + SS Journey Logo */}
        <View style={styles.leftGroup}>
          {canGoBack && onNavigateBack ? (
            <TouchableOpacity
              onPress={onNavigateBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="arrow-back" size={22} color="#1b1c1c" />
            </TouchableOpacity>
          ) : null}

          {/* Hamburger Menu Icon */}
          <TouchableOpacity
            onPress={onPressHamburger}
            style={styles.hamburgerButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="menu" size={26} color="#005cab" />
          </TouchableOpacity>

          {/* Original SS Journey Logo Branding */}
          <View style={styles.brandRow}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/ss-journey-emblem.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.titleColumn}>
              <Text style={styles.brandTitle}>SS JOURNEY</Text>
              <Text style={styles.brandSubtitle} numberOfLines={1}>
                Explore · Book · Travel
              </Text>
            </View>
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
    width: 36,
    height: 30,
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
