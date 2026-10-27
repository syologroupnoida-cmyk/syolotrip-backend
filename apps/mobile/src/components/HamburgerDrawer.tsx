import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';
import { useCurrency } from '../context/CurrencyContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 340);

interface HamburgerDrawerProps {
  visible: boolean;
  onClose: () => void;
  user?: any | null;
  onPressProfile: () => void;
  onPressWishlist: () => void;
  wishlistCount?: number;
  onPressTrips: () => void;
}

export const HamburgerDrawer: React.FC<HamburgerDrawerProps> = ({
  visible,
  onClose,
  user,
  onPressProfile,
  onPressWishlist,
  wishlistCount = 0,
  onPressTrips,
}) => {
  const { currency, setCurrency, currencyConfig, currencies } = useCurrency();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [country, setCountry] = useState<'India' | 'United States' | 'UAE'>('India');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [userStars, setUserStars] = useState(5);

  const cycleCountry = () => {
    setCountry((prev) => {
      if (prev === 'India') return 'United States';
      if (prev === 'United States') return 'UAE';
      return 'India';
    });
  };

  const handleRateUs = () => {
    setRatingModalVisible(true);
  };

  const submitRating = () => {
    setRatingModalVisible(false);
    Alert.alert(
      'Thank You for Rating!',
      `You gave SS Journey ${userStars} star${userStars > 1 ? 's' : ''}! We appreciate your feedback to make travel seamless.`
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.drawerContainer}>
            {/* Drawer Header & Profile Card */}
            <View style={styles.drawerHeader}>
              <View style={styles.headerTopRow}>
                <View style={styles.brandRow}>
                  <Image
                    source={require('../../assets/ss-journey-emblem.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.brandTitle}>SYOLO TRIPS</Text>
                    <Text style={styles.brandSubtitle}>Explore Beyond!</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={22} color={Colors.onSurface} />
                </TouchableOpacity>
              </View>

              {/* Profile Card Banner */}
              <TouchableOpacity
                style={styles.profileCard}
                onPress={() => {
                  onClose();
                  onPressProfile();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.avatarCircle}>
                  {user ? (
                    <Text style={styles.avatarText}>
                      {(user.full_name || user.fullName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  ) : (
                    <MaterialIcons name="person" size={24} color="#ffffff" />
                  )}
                </View>
                <View style={styles.profileMeta}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user ? (user.full_name || user.fullName) : 'Welcome, Traveler'}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user ? user.email : 'Sign in to access exclusive perks'}
                  </Text>
                  <View style={styles.profileActionTag}>
                    <Text style={styles.profileActionText}>
                      {user ? 'View Account' : 'Sign In / Register'}
                    </Text>
                    <MaterialIcons name="chevron-right" size={14} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Drawer Menu Items */}
            <ScrollView
              style={styles.scrollList}
              contentContainerStyle={styles.scrollListContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>MY TRAVEL</Text>

              {/* 1. Profile */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onPressProfile();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#e0f2fe' }]}>
                  <MaterialIcons name="person-outline" size={20} color="#0284c7" />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>Profile & Account</Text>
                  <Text style={styles.itemSubtitle}>
                    {user ? 'Manage personal info & security' : 'Sign in or register'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* 2. Wishlist */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onPressWishlist();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#ffe4e6' }]}>
                  <MaterialIcons name="favorite" size={20} color="#e11d48" />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>Wishlist</Text>
                  <Text style={styles.itemSubtitle}>Saved flights, hotels & tours</Text>
                </View>
                {wishlistCount > 0 ? (
                  <View style={styles.counterBadge}>
                    <Text style={styles.counterBadgeText}>{wishlistCount}</Text>
                  </View>
                ) : (
                  <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
                )}
              </TouchableOpacity>

              {/* 3. My Trips */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onPressTrips();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#fef3c7' }]}>
                  <MaterialIcons name="luggage" size={20} color="#d97706" />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>My Trips</Text>
                  <Text style={styles.itemSubtitle}>Manage confirmed reservations</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>PREFERENCES</Text>

              {/* 4. Currency Selector */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setCurrencyModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#ecfdf5' }]}>
                  <MaterialIcons name="monetization-on" size={20} color="#059669" />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>Currency</Text>
                  <Text style={styles.itemSubtitle}>Display prices in your currency</Text>
                </View>
                <View style={styles.togglePill}>
                  <Text style={styles.togglePillText}>{currencyConfig.flag} {currencyConfig.code} ({currencyConfig.symbol})</Text>
                  <MaterialIcons name="chevron-right" size={16} color={Colors.primary} />
                </View>
              </TouchableOpacity>

              {/* 5. Country Selector */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={cycleCountry}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#f3e8ff' }]}>
                  <MaterialIcons name="public" size={20} color="#7c3aed" />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>Country</Text>
                  <Text style={styles.itemSubtitle}>Regional pricing & airport hub</Text>
                </View>
                <View style={styles.togglePill}>
                  <Text style={styles.togglePillText}>
                    {country === 'India' ? '🇮🇳 India' : country === 'United States' ? '🇺🇸 USA' : '🇦🇪 UAE'}
                  </Text>
                  <MaterialIcons name="expand-more" size={14} color={Colors.primary} />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>FEEDBACK & SUPPORT</Text>

              {/* 6. Rate Us */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleRateUs}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#fff1f2' }]}>
                  <MaterialIcons name="star-rate" size={20} color="#f43f5e" />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>Rate Us</Text>
                  <Text style={styles.itemSubtitle}>Share your experience with us</Text>
                </View>
                <View style={styles.starsPill}>
                  <MaterialIcons name="star" size={14} color="#f59e0b" />
                  <Text style={styles.starsPillText}>5.0</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Drawer Footer */}
            <View style={styles.drawerFooter}>
              <Text style={styles.footerBrand}>SS JOURNEY MOBILE</Text>
              <Text style={styles.footerVersion}>Version 1.0.0 (Build 58)</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interactive Rate Us Dialog */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingCard}>
            <View style={styles.ratingIconCircle}>
              <MaterialIcons name="star" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.ratingTitle}>Enjoying SS Journey?</Text>
            <Text style={styles.ratingSubtitle}>
              Tap the stars below to rate your booking experience on the app:
            </Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setUserStars(star)}
                  style={{ padding: 6 }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={star <= userStars ? 'star' : 'star-border'}
                    size={36}
                    color="#f59e0b"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.ratingBtnRow}>
              <TouchableOpacity
                style={styles.cancelRatingBtn}
                onPress={() => setRatingModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelRatingText}>Not Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitRatingBtn}
                onPress={submitRating}
                activeOpacity={0.8}
              >
                <Text style={styles.submitRatingText}>Submit Rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interactive Currency Selection Dialog */}
      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.ratingOverlay}
          activeOpacity={1}
          onPress={() => setCurrencyModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.ratingCard, { maxWidth: 360, width: '90%' }]}>
              <View style={[styles.ratingIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <MaterialIcons name="currency-exchange" size={28} color="#059669" />
              </View>
              <Text style={styles.ratingTitle}>Select Display Currency</Text>
              <Text style={styles.ratingSubtitle}>
                All flights, hotels, trains, and packages convert live with official rates.
              </Text>

              <View style={{ width: '100%', marginTop: 12, marginBottom: 16 }}>
                {Object.values(currencies).map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      onPress={() => {
                        setCurrency(c.code);
                        setCurrencyModalVisible(false);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        borderWidth: 1,
                        borderColor: isSelected ? '#008cff' : '#f1f5f9',
                        marginBottom: 6,
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, marginRight: 10 }}>{c.flag}</Text>
                        <View>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? '#005cab' : '#1e293b' }}>
                            {c.code} &bull; {c.symbol}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#64748b' }}>{c.name}</Text>
                        </View>
                      </View>
                      {isSelected ? (
                        <MaterialIcons name="check-circle" size={20} color="#008cff" />
                      ) : (
                        <MaterialIcons name="radio-button-unchecked" size={20} color="#cbd5e1" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.cancelRatingBtn, { width: '100%', alignItems: 'center' }]}
                onPress={() => setCurrencyModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelRatingText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#ffffff',
    ...Shadows.lg,
  },
  drawerHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl + 4,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 80, 125, 0.08)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 80, 125, 0.06)',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileMeta: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  userEmail: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  profileActionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  profileActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  scrollList: {
    flex: 1,
  },
  scrollListContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  itemSubtitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  counterBadge: {
    backgroundColor: '#e11d48',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  starsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  starsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 80, 125, 0.08)',
    marginVertical: Spacing.sm + 2,
  },
  drawerFooter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 80, 125, 0.08)',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  footerVersion: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  ratingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  ratingCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.lg,
  },
  ratingIconCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  ratingBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  cancelRatingBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  cancelRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  submitRatingBtn: {
    flex: 1.4,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
  },
  submitRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
