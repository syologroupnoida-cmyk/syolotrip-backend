import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Spacing, BorderRadius } from '../theme/theme';
import { ScreenName } from '../types/travel';
import { useWishlist } from '../context/WishlistContext';
import { WalletModal } from '../components/WalletModal';
import { getWalletBalancesMobileApi } from '../services/api';

const { width } = Dimensions.get('window');

interface MyProfileScreenProps {
  onNavigate: (screen: ScreenName) => void;
  user: any | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenWishlist: () => void;
}

export const MyProfileScreen: React.FC<MyProfileScreenProps> = ({
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  onOpenWishlist,
}) => {
  const { wishlistCount } = useWishlist();
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [country, setCountry] = useState('India');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletTotal, setWalletTotal] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      getWalletBalancesMobileApi()
        .then((b) => {
          if (b?.totalSpendable != null) {
            setWalletTotal(b.totalSpendable);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your Syolo Trips account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            onLogout();
            Alert.alert('Logged Out', 'You have been successfully logged out.');
          },
        },
      ]
    );
  };

  const handleRateUs = () => {
    Alert.alert(
      'Rate Syolo Trips ⭐⭐⭐⭐⭐',
      'Thank you for traveling with Syolo Trips! We are dedicated to providing the smoothest flights, hotels & tour bookings.',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Submit 5 Stars',
          onPress: () => {
            Alert.alert('Thank You!', 'Your rating has been recorded.');
          },
        },
      ]
    );
  };

  const handleCoTravellers = () => {
    Alert.alert(
      'Saved Co-Travellers',
      user?.fullName || user?.full_name
        ? `Primary Passenger: ${user.fullName || user.full_name}\n\nCo-travellers can be added and verified during checkout.`
        : 'No saved co-travellers found. Log in or complete a booking to save companion details.'
    );
  };

  const handleCoupons = () => {
    Alert.alert(
      'Active SS Journey Coupons',
      '• SSJWELCOME: Flat 25% OFF on 1st Hotel Booking\n• SSJFLY: ₹1,500 OFF on Domestic Flights\n• SSJSTAY: Up to ₹2,500 OFF on Luxe Stays\n• SSJHOLIDAY: 35% OFF on Complete Packages'
    );
  };

  const handleSupport = () => {
    Alert.alert(
      '24x7 SS Journey Helpline',
      'Need urgent help with your booking?\n\n• Phone: 1800-209-4455 (Toll Free)\n• Email: priority@ssjourney.com\n• Live Chat: Available 24x7 with Instant Flight Refund & Rescheduling Assistance.'
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ── TOP SECTION: LOGIN BANNER (WHEN LOGGED OUT) OR USER PROFILE CARD (WHEN LOGGED IN) ── */}
      {!user ? (
        <View style={styles.loginBannerCard}>
          <LinearGradient
            colors={['#0066FF', '#0047BA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginBannerGradient}
          >
            <View style={styles.loginBannerTopRow}>
              <View style={styles.loginAvatarCircle}>
                <MaterialIcons name="person" size={32} color="#0066FF" />
              </View>
              <View style={styles.loginBannerBadge}>
                <Text style={styles.loginBannerBadgeText}>MEMBER PERKS</Text>
              </View>
            </View>

            <Text style={styles.loginBannerTitle}>Welcome to Syolo Trips</Text>
            <Text style={styles.loginBannerSub}>
              Sign in to view your bookings, unlock flat 25% discounts & sync your liked hotels and flights.
            </Text>

            {/* Prominent Login / Sign In Button */}
            <TouchableOpacity
              style={styles.loginPrimaryButton}
              onPress={onOpenAuth}
              activeOpacity={0.88}
            >
              <Text style={styles.loginPrimaryButtonText}>LOGIN / SIGN UP</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#0066FF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.profileHeroCard}>
          <View style={styles.profileHeroHeader}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {(user.full_name || user.fullName || user.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userMetaCol}>
              <View style={styles.userNameRow}>
                <Text style={styles.userFullName} numberOfLines={1}>
                  {user.full_name || user.fullName || 'Valued Traveler'}
                </Text>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color="#0284c7" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              <Text style={styles.userTierText}>SS Journey Gold Elite Member</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── QUICK ACTION STRIP: MY TRIPS · WISHLIST · SS REWARDS ── */}
      <View style={styles.quickActionRow}>
        <TouchableOpacity
          style={styles.quickActionTile}
          onPress={() => onNavigate('trips')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#e0f2fe' }]}>
            <MaterialIcons name="luggage" size={22} color="#0284c7" />
          </View>
          <Text style={styles.quickActionTitle}>My Trips</Text>
          <Text style={styles.quickActionSub}>Bookings &amp; Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionTile}
          onPress={onOpenWishlist}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#ffe4e6' }]}>
            <MaterialIcons name="favorite" size={22} color="#e11d48" />
            {wishlistCount > 0 && (
              <View style={styles.quickHeartBadge}>
                <Text style={styles.quickHeartBadgeText}>{wishlistCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.quickActionTitle}>Wishlist</Text>
          <Text style={styles.quickActionSub}>{wishlistCount} Saved Stays</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionTile}
          onPress={() => setIsWalletOpen(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#ecfdf5' }]}>
            <MaterialIcons name="account-balance-wallet" size={22} color="#059669" />
          </View>
          <Text style={styles.quickActionTitle}>Syolo Wallet</Text>
          <Text style={[styles.quickActionSub, { color: '#059669', fontWeight: '700' }]}>
            {walletTotal != null ? `₹${walletTotal.toLocaleString('en-IN')}` : 'Dual Wallet'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── SECTION 1: TRAVEL BOOKINGS & WISHLIST ── */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionHeader}>TRAVEL &amp; BOOKINGS</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => onNavigate('trips')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#e0f2fe' }]}>
            <MaterialIcons name="flight-takeoff" size={20} color="#0066FF" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>My Bookings &amp; Trips</Text>
            <Text style={styles.menuSub}>Upcoming, completed &amp; cancelled trips</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={onOpenWishlist}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#ffe4e6' }]}>
            <MaterialIcons name="favorite-border" size={20} color="#e11d48" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>Saved Wishlist</Text>
            <Text style={styles.menuSub}>Click on liked hotels &amp; flights to open</Text>
          </View>
          <View style={styles.wishlistCountPill}>
            <Text style={styles.wishlistCountPillText}>{wishlistCount}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleCoTravellers}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#f1f5f9' }]}>
            <MaterialIcons name="group" size={20} color="#475569" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>Saved Co-Travellers</Text>
            <Text style={styles.menuSub}>Family &amp; friends for 1-click checkout</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* ── SECTION 2: OFFERS & REWARDS ── */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionHeader}>OFFERS &amp; REWARDS</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleCoupons}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#fef3c7' }]}>
            <MaterialIcons name="local-offer" size={20} color="#d97706" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>My Coupons &amp; Promo Codes</Text>
            <Text style={styles.menuSub}>SSJWELCOME, SSJFLY, SSJSTAY &amp; more</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => {
            Alert.alert(
              'Syolo Trips Rewards Club',
              'Earn 5% Syolo Coins on every flight and hotel booking. Redeem coins for instant cash discounts with zero expiration.'
            );
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#ecfdf5' }]}>
            <MaterialIcons name="stars" size={20} color="#059669" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>SS Journey Elite Club</Text>
            <Text style={styles.menuSub}>VIP airport lounge &amp; free seat selection</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* ── SECTION 3: PREFERENCES & SETTINGS ── */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionHeader}>PREFERENCES &amp; SETTINGS</Text>

        {/* Currency Switcher */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setCurrency((c) => (c === 'INR' ? 'USD' : 'INR'))}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#f1f5f9' }]}>
            <MaterialIcons name="payments" size={20} color="#475569" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>Currency</Text>
            <Text style={styles.menuSub}>Choose payment &amp; display currency</Text>
          </View>
          <View style={styles.settingBadge}>
            <Text style={styles.settingBadgeText}>{currency}</Text>
          </View>
        </TouchableOpacity>

        {/* Country Selector */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => {
            setCountry((curr) => {
              if (curr === 'India') return 'United States';
              if (curr === 'United States') return 'UAE';
              return 'India';
            });
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#f1f5f9' }]}>
            <MaterialIcons name="public" size={20} color="#475569" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>Country / Region</Text>
            <Text style={styles.menuSub}>Local travel guidelines &amp; taxes</Text>
          </View>
          <View style={styles.settingBadge}>
            <Text style={styles.settingBadgeText}>{country}</Text>
          </View>
        </TouchableOpacity>

        {/* Push Notifications Toggle */}
        <View style={styles.menuRow}>
          <View style={[styles.menuIconCircle, { backgroundColor: '#f1f5f9' }]}>
            <MaterialIcons name="notifications-active" size={20} color="#475569" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>Booking &amp; Flight Alerts</Text>
            <Text style={styles.menuSub}>Real-time gate changes &amp; fare drops</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#cbd5e1', true: '#0066FF' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* ── SECTION 4: SUPPORT & FEEDBACK ── */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionHeader}>SUPPORT &amp; LEGAL</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleSupport}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#f1f5f9' }]}>
            <MaterialIcons name="support-agent" size={20} color="#475569" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>24x7 Customer Support &amp; SOS</Text>
            <Text style={styles.menuSub}>Instant assistance for bookings &amp; refunds</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleRateUs}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#fef3c7' }]}>
            <MaterialIcons name="star" size={20} color="#d97706" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>Rate SS Journey</Text>
            <Text style={styles.menuSub}>Tell us about your experience</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => {
            Alert.alert(
              'Privacy & Terms',
              'Syolo Trips values your privacy. All payment transactions are encrypted with 256-bit SSL security and compliant with PCI-DSS standards.'
            );
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#f1f5f9' }]}>
            <MaterialIcons name="security" size={20} color="#475569" />
          </View>
          <View style={styles.menuMetaCol}>
            <Text style={styles.menuTitle}>Privacy Policy &amp; Terms</Text>
            <Text style={styles.menuSub}>Data protection &amp; refund conditions</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* ── LOGOUT BUTTON (IF LOGGED IN) ── */}
      {user && (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={20} color="#e11d48" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Log Out from Syolo Trips</Text>
        </TouchableOpacity>
      )}

      {/* Footer Branding Info */}
      <View style={styles.footerBranding}>
        <Text style={styles.footerVersion}>Syolo Trips Mobile • v1.0.0</Text>
        <Text style={styles.footerTagline}>Engineered for seamless world-class travel</Text>
      </View>

      {/* Syolo Dual Wallet Modal */}
      <WalletModal visible={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loginBannerCard: {
    margin: 14,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.md,
  },
  loginBannerGradient: {
    padding: 20,
  },
  loginBannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  loginAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  loginBannerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loginBannerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  loginBannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  loginBannerSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    lineHeight: 18,
  },
  loginPrimaryButton: {
    marginTop: 18,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.sm,
  },
  loginPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.5,
  },
  profileHeroCard: {
    margin: 14,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  profileHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  userAvatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  userMetaCol: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userFullName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  userTierText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
    marginTop: 3,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 14,
  },
  quickActionTile: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  quickHeartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#e11d48',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  quickHeartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickActionSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },
  menuSection: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  menuSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuMetaCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  wishlistCountPill: {
    backgroundColor: '#ffe4e6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  wishlistCountPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
  },
  settingBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  settingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  logoutButton: {
    marginHorizontal: 14,
    marginTop: 4,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e11d48',
  },
  footerBranding: {
    alignItems: 'center',
    marginTop: 20,
    gap: 2,
  },
  footerVersion: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  footerTagline: {
    fontSize: 10,
    color: '#cbd5e1',
  },
});
