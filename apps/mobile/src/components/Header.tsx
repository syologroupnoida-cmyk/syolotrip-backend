import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';
import { ScreenName } from '../types/travel';

interface HeaderProps {
  currentScreen: ScreenName;
  onNavigateBack?: () => void;
  canGoBack?: boolean;
  onPressNotifications?: () => void;
  onPressProfile?: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigateBack,
  canGoBack = false,
  onPressNotifications,
  onPressProfile,
  unreadNotificationsCount = 2,
}) => {
  const getScreenSubtitle = () => {
    switch (currentScreen) {
      case 'explore':
        return 'Explore · Book · Travel · More';
      case 'flights':
        return 'Flight Booking & Deals';
      case 'hotels':
        return 'Hotel Stays & Resorts';
      case 'checkout':
        return 'Secure Checkout Flow';
      case 'trips':
        return 'My Travel Itinerary';
      default:
        return 'Explore · Book · Travel · More';
    }
  };

  return (
    <LinearGradient
      colors={['#071a3d', '#0c2d6b', '#143d8a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.leftGroup}>
          {canGoBack && onNavigateBack && (
            <TouchableOpacity
              onPress={onNavigateBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>
          )}

          {/* Official SS Journey Logo */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/ss-journey-logo.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.titleColumn}>
            <Text style={styles.brandTitle}>SS Journey</Text>
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {getScreenSubtitle()}
            </Text>
          </View>
        </View>

        {/* Right action items */}
        <View style={styles.rightGroup}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onPressNotifications}
            activeOpacity={0.7}
          >
            <MaterialIcons name="notifications-none" size={22} color="#ffffff" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={onPressProfile}
            activeOpacity={0.7}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              }}
              style={styles.profileAvatar}
            />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    ...Shadows.md,
    zIndex: 100,
  },
  content: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  logoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(242, 140, 28, 0.6)',
    padding: 1,
    ...Shadows.sm,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  titleColumn: {
    justifyContent: 'center',
    flex: 1,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.brandOrange,
    letterSpacing: 0.3,
    marginTop: -1,
    textTransform: 'uppercase',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandOrange,
    borderWidth: 1.5,
    borderColor: '#071a3d',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.brandOrange,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
});
