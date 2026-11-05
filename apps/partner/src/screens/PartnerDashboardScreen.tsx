import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName, PartnerPropertyData, PartnerBookingData } from '../types/partner';
import { usePartnerAuth } from '../context/PartnerAuthContext';
import { getPartnerPropertiesApi, getPartnerBookingsApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { VerificationBanner } from '../components/VerificationBanner';

interface PartnerDashboardScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectProperty?: (prop: PartnerPropertyData) => void;
  onSelectBooking?: (booking: PartnerBookingData) => void;
}

export const PartnerDashboardScreen: React.FC<PartnerDashboardScreenProps> = ({
  onNavigate,
  onSelectProperty,
  onSelectBooking,
}) => {
  const { partnerProfile, isVerified, refreshProfile } = usePartnerAuth();

  const [properties, setProperties] = useState<PartnerPropertyData[]>([]);
  const [bookings, setBookings] = useState<PartnerBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setFetchError(null);
    try {
      if (isVerified) {
        const [propsRes, bookingsRes] = await Promise.all([
          getPartnerPropertiesApi().catch(() => []),
          getPartnerBookingsApi().catch(() => []),
        ]);
        setProperties(propsRes);
        setBookings(bookingsRes);
      } else {
        setProperties([]);
        setBookings([]);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isVerified]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await loadDashboardData();
  };

  // Compute metrics from real backend data
  const totalProperties = properties.length;
  const approvedProperties = properties.filter((p) => p.publication_status === 'APPROVED').length;
  const pendingProperties = properties.filter((p) => p.publication_status === 'PENDING_APPROVAL').length;
  const draftProperties = properties.filter((p) => p.publication_status === 'DRAFT').length;

  const totalRooms = properties.reduce(
    (acc, p) => acc + (p.rooms?.reduce((rAcc, r) => rAcc + r.available_rooms, 0) || 0),
    0
  );

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;

  // Real financial aggregates
  const grossRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.payment_status === 'PAID')
    .reduce((acc, b) => acc + Number(b.total_amount || 0), 0);

  const commissionRate = partnerProfile?.commission_rate || 0.1; // Default platform commission
  const netEarnings = grossRevenue * (1 - commissionRate);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      {/* Verification Status Banner if pending / rejected / suspended */}
      <VerificationBanner
        partnerProfile={partnerProfile}
        onRefresh={onRefresh}
        onEditProfile={() => onNavigate('profile')}
      />

      {/* Business Hero Card */}
      <View style={styles.businessHeroCard}>
        <View style={styles.businessHeroTop}>
          <View style={styles.businessAvatar}>
            <MaterialIcons
              name={partnerProfile?.business_type === 'HOMESTAY_HOST' ? 'villa' : 'hotel'}
              size={26}
              color={Colors.secondary}
            />
          </View>
          <View style={styles.businessDetails}>
            <Text style={styles.businessTitle} numberOfLines={1}>
              {partnerProfile?.business_name || 'Hospitality Partner'}
            </Text>
            <Text style={styles.businessSubtitle}>
              {partnerProfile?.business_type === 'HOMESTAY_HOST' ? 'Homestay & Villa Host' : 'Hotelier'}
              {' · '}
              {partnerProfile?.city || 'India'}
            </Text>
          </View>
          <StatusBadge status={partnerProfile?.status || 'PENDING'} />
        </View>

        <View style={styles.businessHeroMeta}>
          <View style={styles.metaBadge}>
            <MaterialIcons name="verified-user" size={13} color={isVerified ? '#059669' : '#d97706'} />
            <Text style={[styles.metaBadgeText, { color: isVerified ? '#059669' : '#d97706' }]}>
              {isVerified ? 'Verified Partner' : 'Verification Pending'}
            </Text>
          </View>
          <View style={styles.metaBadge}>
            <MaterialIcons name="monetization-on" size={13} color={Colors.primary} />
            <Text style={styles.metaBadgeText}>
              Fee: {Math.round(commissionRate * 100)}% Standard
            </Text>
          </View>
          {partnerProfile?.tax_id ? (
            <View style={styles.metaBadge}>
              <MaterialIcons name="receipt" size={13} color={Colors.onSurfaceSubtle} />
              <Text style={styles.metaBadgeText}>GSTIN: {partnerProfile.tax_id}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Financial & Performance Metrics */}
      <Text style={styles.sectionHeader}>Performance &amp; Inventory</Text>

      {loading ? (
        <View style={styles.skeletonGrid}>
          <View style={[styles.metricCard, styles.skeletonCard]} />
          <View style={[styles.metricCard, styles.skeletonCard]} />
        </View>
      ) : (
        <>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Gross Booking GMV</Text>
                <View style={styles.metricIconWrap}>
                  <MaterialIcons name="payments" size={15} color={Colors.primary} />
                </View>
              </View>
              <Text style={styles.metricValue}>{formatINR(grossRevenue)}</Text>
              <Text style={styles.metricSub}>
                {confirmedBookings} confirmed booking{confirmedBookings === 1 ? '' : 's'}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Est. Net Payout</Text>
                <View style={[styles.metricIconWrap, { backgroundColor: '#fff7ed' }]}>
                  <MaterialIcons name="account-balance-wallet" size={15} color={Colors.secondary} />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: Colors.secondaryDark }]}>
                {formatINR(netEarnings)}
              </Text>
              <Text style={styles.metricSub}>
                After {Math.round(commissionRate * 100)}% platform commission
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Property Portfolio</Text>
                <View style={styles.metricIconWrap}>
                  <MaterialIcons name="apartment" size={15} color={Colors.primary} />
                </View>
              </View>
              <Text style={styles.metricValue}>{totalProperties}</Text>
              <Text style={styles.metricSub}>
                {approvedProperties} Live · {pendingProperties} In Review · {draftProperties} Draft
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Room Capacity</Text>
                <View style={[styles.metricIconWrap, { backgroundColor: '#eff6ff' }]}>
                  <MaterialIcons name="meeting-room" size={15} color="#2563eb" />
                </View>
              </View>
              <Text style={styles.metricValue}>{totalRooms}</Text>
              <Text style={styles.metricSub}>Total available room units</Text>
            </View>
          </View>
        </>
      )}

      {/* Operational Quick Actions */}
      <Text style={styles.sectionHeader}>Operational Tools</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigate('properties')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#e0e7ff' }]}>
            <MaterialIcons name="apartment" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Listings</Text>
          <Text style={styles.actionDesc}>Manage properties</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigate('create_property')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#ffedd5' }]}>
            <MaterialIcons name="add-business" size={20} color={Colors.secondary} />
          </View>
          <Text style={styles.actionTitle}>New Listing</Text>
          <Text style={styles.actionDesc}>Create draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigate('bookings')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#d1fae5' }]}>
            <MaterialIcons name="book-online" size={20} color={Colors.statusApproved} />
          </View>
          <Text style={styles.actionTitle}>Reservations</Text>
          <Text style={styles.actionDesc}>Guest manifests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigate('inventory_calendar')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#e0f2fe' }]}>
            <MaterialIcons name="event-available" size={20} color={Colors.info} />
          </View>
          <Text style={styles.actionTitle}>Inventory</Text>
          <Text style={styles.actionDesc}>Rates &amp; dates</Text>
        </TouchableOpacity>
      </View>

      {/* Property Showcase / Portfolio Overview */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionHeaderNoMargin}>Your Properties</Text>
        {properties.length > 0 && (
          <TouchableOpacity onPress={() => onNavigate('properties')}>
            <Text style={styles.viewAllText}>View All ({totalProperties})</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          <View style={[styles.propertyCard, styles.skeletonCard]} />
        </View>
      ) : fetchError ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={26} color={Colors.error} />
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : properties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="holiday-village" size={36} color={Colors.onSurfaceSubtle} />
          <Text style={styles.emptyTitle}>No Properties Listed</Text>
          <Text style={styles.emptyDesc}>
            {isVerified
              ? 'List your hotel, resort, or homestay to reach verified travelers across India.'
              : 'Once your partner verification is approved, your listed properties will be published.'}
          </Text>
          <TouchableOpacity
            style={styles.emptyCtaBtn}
            onPress={() => onNavigate('create_property')}
          >
            <MaterialIcons name="add" size={16} color="#ffffff" />
            <Text style={styles.emptyCtaText}>Add First Property</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.propertiesList}>
          {properties.slice(0, 3).map((prop) => (
            <TouchableOpacity
              key={prop.id}
              style={styles.propertyCard}
              onPress={() => {
                if (onSelectProperty) onSelectProperty(prop);
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri:
                    prop.featured_image ||
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
                }}
                style={styles.propertyImage}
              />
              <View style={styles.propertyInfo}>
                <View style={styles.propertyTopRow}>
                  <Text style={styles.propertyName} numberOfLines={1}>
                    {prop.name}
                  </Text>
                  <StatusBadge status={prop.publication_status} size="sm" />
                </View>
                <Text style={styles.propertyLocation}>
                  {prop.property_type} · {prop.city}, {prop.country || 'India'}
                </Text>
                <View style={styles.propertyBottomRow}>
                  <Text style={styles.propertyRoomsText}>
                    {prop.rooms?.length || 0} room type{(prop.rooms?.length || 0) === 1 ? '' : 's'}
                  </Text>
                  <Text style={styles.propertyPrice}>
                    From <Text style={styles.propertyPriceBold}>{formatINR(prop.starting_price)}</Text>/night
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Reservations Feed */}
      <View style={[styles.sectionRow, { marginTop: Spacing.lg }]}>
        <Text style={styles.sectionHeaderNoMargin}>Recent Reservations</Text>
        {bookings.length > 0 && (
          <TouchableOpacity onPress={() => onNavigate('bookings')}>
            <Text style={styles.viewAllText}>View All ({totalBookings})</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          <View style={[styles.bookingItemCard, styles.skeletonCard]} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={36} color={Colors.onSurfaceSubtle} />
          <Text style={styles.emptyTitle}>No Reservations Yet</Text>
          <Text style={styles.emptyDesc}>
            {isVerified
              ? 'Confirmed customer bookings from the Syolo Travels marketplace will appear here automatically.'
              : 'Partner profile verification by platform compliance is required before bookings can be placed.'}
          </Text>
        </View>
      ) : (
        <View style={styles.bookingsList}>
          {bookings.slice(0, 3).map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.bookingItemCard}
              onPress={() => {
                if (onSelectBooking) onSelectBooking(b);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.bookingItemHeader}>
                <View>
                  <Text style={styles.bookingRefText}>REF: {b.booking_reference}</Text>
                  <Text style={styles.bookingDateText}>
                    {new Date(b.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <StatusBadge status={b.status} size="sm" />
              </View>

              <View style={styles.bookingItemBody}>
                <Text style={styles.bookingPassengerText}>
                  Guest: {b.passengers?.[0]?.first_name || 'Traveler'} {b.passengers?.[0]?.last_name || ''}
                </Text>
                <Text style={styles.bookingItemTitle} numberOfLines={1}>
                  {b.items?.[0]?.title || 'Hotel Stay Reservation'}
                </Text>
              </View>

              <View style={styles.bookingItemFooter}>
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentBadgeText}>
                    Payment: <Text style={{ fontWeight: 'bold' }}>{b.payment_status}</Text>
                  </Text>
                </View>
                <Text style={styles.bookingAmountText}>{formatINR(Number(b.total_amount || 0))}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  businessHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  businessHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  businessAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessDetails: {
    flex: 1,
  },
  businessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  businessSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  businessHeroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLow,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    marginHorizontal: Spacing.md,
  },
  sectionHeaderNoMargin: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    marginHorizontal: Spacing.md,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  metricIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(12, 45, 107, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 10,
    color: Colors.onSurfaceSubtle,
    lineHeight: 13,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  actionDesc: {
    fontSize: 9,
    color: Colors.onSurfaceSubtle,
    marginTop: 2,
    textAlign: 'center',
  },
  propertiesList: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    flexDirection: 'row',
    ...Shadows.sm,
  },
  propertyImage: {
    width: 100,
    height: 85,
    backgroundColor: Colors.surfaceLow,
  },
  propertyInfo: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'space-between',
  },
  propertyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.onSurface,
    flex: 1,
    marginRight: 6,
  },
  propertyLocation: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  propertyBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  propertyRoomsText: {
    fontSize: 10,
    color: Colors.onSurfaceSubtle,
  },
  propertyPrice: {
    fontSize: 10,
    color: Colors.onSurfaceSubtle,
  },
  propertyPriceBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bookingsList: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  bookingItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  bookingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  bookingRefText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bookingDateText: {
    fontSize: 10,
    color: Colors.onSurfaceSubtle,
    marginTop: 1,
  },
  bookingItemBody: {
    marginVertical: Spacing.xs,
  },
  bookingPassengerText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  bookingItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    marginTop: 2,
  },
  bookingItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLow,
  },
  paymentBadge: {
    backgroundColor: Colors.surfaceLow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  paymentBadgeText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  bookingAmountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginTop: Spacing.sm,
  },
  emptyDesc: {
    fontSize: 11,
    color: Colors.onSurfaceSubtle,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 280,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    gap: 4,
  },
  emptyCtaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  skeletonGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  skeletonList: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  skeletonCard: {
    height: 85,
    backgroundColor: Colors.surfaceLow,
    opacity: 0.6,
  },
});
