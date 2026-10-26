import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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

  // Compute metrics from actual database-returned arrays
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

  const grossRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.payment_status === 'PAID')
    .reduce((acc, b) => acc + Number(b.total_amount || 0), 0);

  const commissionRate = partnerProfile?.commission_rate || 0.1; // Default 10% platform commission
  const netEarnings = grossRevenue * (1 - commissionRate);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Verification Status Banner if pending / rejected */}
      <VerificationBanner
        partnerProfile={partnerProfile}
        onRefresh={onRefresh}
        onEditProfile={() => onNavigate('profile')}
      />

      {/* Business Info Header Card */}
      <View style={styles.businessCard}>
        <View style={styles.businessRow}>
          <View>
            <Text style={styles.businessName}>
              {partnerProfile?.business_name || 'Hospitality Partner'}
            </Text>
            <Text style={styles.businessType}>
              {partnerProfile?.business_type === 'HOMESTAY_HOST' ? 'Homestay & Villa Host' : 'Hotelier'} · {partnerProfile?.city || 'India'}
            </Text>
          </View>
          <StatusBadge status={partnerProfile?.status || 'PENDING'} />
        </View>

        <View style={styles.commissionRow}>
          <MaterialIcons name="monetization-on" size={14} color={Colors.secondary} />
          <Text style={styles.commissionText}>
            Platform Commission: {Math.round(commissionRate * 100)}% · Payout terms: Standard settlement
          </Text>
        </View>
      </View>

      {/* Metrics Row 1: Financial & Bookings */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Gross Bookings</Text>
            <MaterialIcons name="payments" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.metricValue}>{formatINR(grossRevenue)}</Text>
          <Text style={styles.metricSub}>{confirmedBookings} Confirmed reservation(s)</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Est. Net Payout</Text>
            <MaterialIcons name="account-balance-wallet" size={16} color={Colors.secondary} />
          </View>
          <Text style={[styles.metricValue, { color: Colors.secondaryDark }]}>
            {formatINR(netEarnings)}
          </Text>
          <Text style={styles.metricSub}>After platform commission</Text>
        </View>
      </View>

      {/* Metrics Row 2: Property & Inventory */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Properties</Text>
            <MaterialIcons name="holiday-village" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.metricValue}>{totalProperties}</Text>
          <Text style={styles.metricSub}>
            {approvedProperties} Live · {pendingProperties} In Review · {draftProperties} Draft
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Room Capacity</Text>
            <MaterialIcons name="meeting-room" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.metricValue}>{totalRooms}</Text>
          <Text style={styles.metricSub}>Active rooms across listings</Text>
        </View>
      </View>

      {/* Quick Action Navigation Grid */}
      <Text style={styles.sectionHeader}>Operational Tools</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigate('properties')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(12, 45, 107, 0.1)' }]}>
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
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(242, 140, 28, 0.1)' }]}>
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
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
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
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(2, 132, 199, 0.1)' }]}>
            <MaterialIcons name="event-available" size={20} color={Colors.info} />
          </View>
          <Text style={styles.actionTitle}>Inventory</Text>
          <Text style={styles.actionDesc}>Daily pricing</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Reservations Feed */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionHeader}>Recent Reservations</Text>
        <TouchableOpacity onPress={() => onNavigate('bookings')}>
          <Text style={styles.viewAllText}>View All ({totalBookings})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: Spacing.lg }} color={Colors.primary} />
      ) : fetchError ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="warning" size={24} color={Colors.error} />
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={32} color={Colors.onSurfaceSubtle} />
          <Text style={styles.emptyTitle}>No reservations yet</Text>
          <Text style={styles.emptyDesc}>
            {isVerified
              ? 'New reservations from SS Journey travelers will appear here in real-time.'
              : 'Listing approval by platform administration is required before bookings can be accepted.'}
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
                    Booked on {new Date(b.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <StatusBadge status={b.status} size="sm" />
              </View>

              <View style={styles.bookingItemBody}>
                <Text style={styles.bookingPassengerText}>
                  Guest: {b.passengers?.[0]?.first_name || 'Traveler'} {b.passengers?.[0]?.last_name || ''}
                </Text>
                <Text style={styles.bookingItemTitle}>
                  {b.items?.[0]?.title || 'Hotel Stay Reservation'}
                </Text>
              </View>

              <View style={styles.bookingItemFooter}>
                <Text style={styles.bookingPaymentText}>
                  Payment: <Text style={{ fontWeight: 'bold' }}>{b.payment_status}</Text>
                </Text>
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
  businessCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  businessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  businessType: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  commissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLow,
  },
  commissionText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
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
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 9.5,
    color: Colors.onSurfaceSubtle,
    lineHeight: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md + 4,
    marginBottom: Spacing.xs,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginTop: Spacing.md + 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    textAlign: 'center',
    ...Shadows.sm,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginTop: 1,
    textAlign: 'center',
  },
  bookingsList: {
    marginHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLow,
    paddingBottom: Spacing.xs,
  },
  bookingRefText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  bookingDateText: {
    fontSize: 10,
    color: Colors.onSurfaceSubtle,
    marginTop: 1,
  },
  bookingItemBody: {
    paddingVertical: Spacing.xs + 2,
  },
  bookingPassengerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bookingItemTitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  bookingItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLow,
    paddingTop: Spacing.xs,
  },
  bookingPaymentText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  bookingAmountText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  emptyContainer: {
    marginHorizontal: Spacing.md,
    backgroundColor: '#ffffff',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 16,
  },
  errorContainer: {
    marginHorizontal: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: '#fef2f2',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: 11,
    color: Colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
