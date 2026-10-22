import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/theme';
import { ScreenName } from '../types/travel';

interface HeaderProps {
  currentScreen: ScreenName;
  onNavigateBack?: () => void;
  canGoBack?: boolean;
  onPressNotifications?: () => void;
  onPressWishlist?: () => void;
  wishlistCount?: number;
  onPressProfile?: () => void;
  unreadNotificationsCount?: number;
  user?: any | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigateBack,
  canGoBack = false,
  onPressNotifications,
  onPressWishlist,
  wishlistCount = 0,
  onPressProfile,
  user,
}) => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'INR' ? 'USD' : 'INR'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left: Back button or Original SS Journey Logo */}
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

          {/* Original SS Journey Logo */}
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

        {/* Right: Currency Selector Pill + Profile Button */}
        <View style={styles.rightGroup}>
          {/* Currency Pill */}
          <TouchableOpacity
            style={styles.currencyPill}
            onPress={toggleCurrency}
            activeOpacity={0.7}
          >
            <MaterialIcons name="language" size={15} color="#005cab" />
            <Text style={styles.currencyText}>{currency}</Text>
            <MaterialIcons name="expand-more" size={15} color="#707785" />
          </TouchableOpacity>

          {/* Wishlist / Liked Trigger */}
          {onPressWishlist && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onPressWishlist}
              activeOpacity={0.7}
            >
              <MaterialIcons name="favorite" size={21} color="#e11d48" />
              {wishlistCount > 0 && (
                <View style={styles.wishlistBadge}>
                  <Text style={styles.wishlistBadgeText}>{wishlistCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Notifications Trigger */}
          {onPressNotifications && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onPressNotifications}
              activeOpacity={0.7}
            >
              <MaterialIcons name="notifications-none" size={22} color="#525f71" />
            </TouchableOpacity>
          )}

          {/* Profile Button */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onPressProfile}
            activeOpacity={0.7}
          >
            {user ? (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(user.full_name || user.fullName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.avatarCircle}>
                <MaterialIcons name="person" size={17} color="#ffffff" />
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
    paddingHorizontal: 14,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoWrapper: {
    width: 44,
    height: 32,
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
    gap: 8,
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F2F4F8',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7EBF0',
  },
  currencyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1b1c1c',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wishlistBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#e11d48',
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  wishlistBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
  },
  profileButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#005cab',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
