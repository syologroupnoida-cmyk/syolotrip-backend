import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';
import { ScreenName } from '../types/partner';
import { usePartnerAuth } from '../context/PartnerAuthContext';

interface PartnerHeaderProps {
  currentScreen: ScreenName;
  title?: string;
  canGoBack?: boolean;
  onNavigateBack?: () => void;
  onNavigate: (screen: ScreenName) => void;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({
  currentScreen,
  title,
  canGoBack,
  onNavigateBack,
  onNavigate,
}) => {
  const { partnerProfile, isAuthenticated } = usePartnerAuth();

  const getTitle = () => {
    if (title) return title;
    switch (currentScreen) {
      case 'dashboard':
        return partnerProfile?.business_name || 'Partner Dashboard';
      case 'properties':
        return 'Properties & Listings';
      case 'property_detail':
        return 'Property Details';
      case 'create_property':
        return 'New Property Draft';
      case 'edit_property':
        return 'Edit Property';
      case 'rooms':
        return 'Room Categories';
      case 'inventory_calendar':
        return 'Daily Inventory & Pricing';
      case 'bookings':
        return 'Guest Reservations';
      case 'profile':
        return 'Partner Profile';
      case 'auth':
        return 'Partner Portal';
      default:
        return 'Syolo Travels Partner';
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {canGoBack && onNavigateBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onNavigateBack}>
            <MaterialIcons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBadge}>
            <MaterialIcons name="business" size={18} color={Colors.secondary} />
          </View>
        )}
        <View style={styles.titleColumn}>
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>SYOLO TRAVELS</Text>
            <View style={styles.portalTag}>
              <Text style={styles.portalTagText}>PARTNER</Text>
            </View>
          </View>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {getTitle()}
          </Text>
        </View>
      </View>

      {isAuthenticated && (
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={[
              styles.navIconBtn,
              currentScreen === 'dashboard' && styles.navIconBtnActive,
            ]}
            onPress={() => onNavigate('dashboard')}
          >
            <MaterialIcons
              name="dashboard"
              size={20}
              color={currentScreen === 'dashboard' ? Colors.secondary : '#ffffff'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navIconBtn,
              currentScreen === 'profile' && styles.navIconBtnActive,
            ]}
            onPress={() => onNavigate('profile')}
          >
            <MaterialIcons
              name="account-circle"
              size={22}
              color={currentScreen === 'profile' ? Colors.secondary : '#ffffff'}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    ...Shadows.md,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(242, 140, 28, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(242, 140, 28, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleColumn: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  portalTag: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  portalTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navIconBtn: {
    padding: 6,
    borderRadius: BorderRadius.md,
  },
  navIconBtnActive: {
    backgroundColor: 'rgba(242, 140, 28, 0.15)',
  },
});
