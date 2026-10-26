import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { PartnerBookingData } from '../types/partner';
import { getPartnerBookingsApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { usePartnerAuth } from '../context/PartnerAuthContext';
import { VerificationBanner } from '../components/VerificationBanner';

interface PartnerBookingsScreenProps {
  initialBooking?: PartnerBookingData;
}

export const PartnerBookingsScreen: React.FC<PartnerBookingsScreenProps> = ({
  initialBooking,
}) => {
  const { partnerProfile, isVerified, refreshProfile } = usePartnerAuth();

  const [bookings, setBookings] = useState<PartnerBookingData[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PartnerBookingData | null>(
    initialBooking || null
  );

  const fetchBookings = async () => {
    try {
      if (isVerified) {
        const data = await getPartnerBookingsApi();
        setBookings(data);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.warn('[PartnerBookings] Fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [isVerified]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await fetchBookings();
  };

  const filteredBookings =
    filter === 'ALL' ? bookings : bookings.filter((b) => b.status === filter);

  const commissionRate = partnerProfile?.commission_rate || 0.1;

  return (
    <View style={styles.container}>
      <VerificationBanner partnerProfile={partnerProfile} onRefresh={onRefresh} />

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'ALL', label: 'All Reservations' },
            { key: 'CONFIRMED', label: 'Confirmed' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'CANCELLED', label: 'Cancelled / Refunded' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, filter === tab.key && styles.filterChipActive]}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === tab.key && styles.filterChipTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!isVerified ? (
          <View style={styles.lockedCard}>
            <MaterialIcons name="lock" size={32} color={Colors.statusPending} />
            <Text style={styles.lockedTitle}>Reservation Manifest Locked</Text>
            <Text style={styles.lockedDesc}>
              Partner account approval is required to view guest booking manifests.
            </Text>
          </View>
        ) : loading ? (
          <ActivityIndicator style={{ marginTop: Spacing.xl }} color={Colors.primary} />
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="receipt-long" size={36} color={Colors.onSurfaceSubtle} />
            <Text style={styles.emptyTitle}>No reservations found</Text>
            <Text style={styles.emptyDesc}>
              {filter === 'ALL'
                ? 'Your properties do not have any guest bookings yet.'
                : `No reservations with status ${filter}.`}
            </Text>
          </View>
        ) : (
          filteredBookings.map((b) => {
            const guestName =
              b.passengers && b.passengers.length > 0
                ? `${b.passengers[0].first_name} ${b.passengers[0].last_name}`
                : 'Guest Traveler';

            const gross = Number(b.total_amount || 0);
            const net = gross * (1 - commissionRate);

            return (
              <TouchableOpacity
                key={b.id}
                style={styles.bookingCard}
                onPress={() => setSelectedBooking(b)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.refText}>REF: {b.booking_reference}</Text>
                    <Text style={styles.dateSub}>
                      Booked on {new Date(b.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <StatusBadge status={b.status} size="sm" />
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.guestRow}>
                    <MaterialIcons name="person" size={16} color={Colors.primary} />
                    <Text style={styles.guestName}>{guestName}</Text>
                    {b.passengers && b.passengers.length > 1 && (
                      <Text style={styles.partyText}>+{b.passengers.length - 1} more</Text>
                    )}
                  </View>

                  <Text style={styles.itemTitle}>{b.items?.[0]?.title || 'Property Reservation'}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.paymentStatusText}>
                      Payment: <Text style={{ fontWeight: 'bold' }}>{b.payment_status}</Text>
                    </Text>
                    <Text style={styles.netPayoutSub}>
                      Net Payout: {formatINR(net)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.grossAmountText}>{formatINR(gross)}</Text>
                    <Text style={styles.viewManifestText}>View Details ➔</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Reservation Manifest</Text>
                  <Text style={styles.modalRef}>REF: {selectedBooking.booking_reference}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedBooking(null)}>
                  <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: Spacing.md }}>
                {/* Status Box */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>RESERVATION STATUS</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Booking Status</Text>
                    <StatusBadge status={selectedBooking.status} size="sm" />
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Status</Text>
                    <StatusBadge status={selectedBooking.payment_status} size="sm" />
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Booking Date</Text>
                    <Text style={styles.detailVal}>
                      {new Date(selectedBooking.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Guest Manifest */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>PASSENGER / GUEST MANIFEST</Text>
                  {selectedBooking.passengers && selectedBooking.passengers.length > 0 ? (
                    selectedBooking.passengers.map((p, idx) => (
                      <View key={idx} style={styles.passengerRow}>
                        <MaterialIcons name="person" size={14} color={Colors.primary} />
                        <Text style={styles.passengerName}>
                          {p.title || 'Guest'} {p.first_name} {p.last_name}
                        </Text>
                        <Text style={styles.passengerType}>{p.passenger_type || 'Adult'}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.detailVal}>Primary Account Guest</Text>
                  )}
                </View>

                {/* Reserved Items */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>RESERVED ACCOMMODATION</Text>
                  {selectedBooking.items?.map((item, idx) => (
                    <View key={idx} style={{ marginBottom: 4 }}>
                      <Text style={styles.itemMainTitle}>{item.title}</Text>
                      <Text style={styles.itemSubDesc}>
                        Qty: {item.quantity} · Rate: {formatINR(item.unit_price)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Financial Breakdown */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>FINANCIAL &amp; PAYOUT RECONCILIATION</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gross Booking Total</Text>
                    <Text style={styles.detailVal}>{formatINR(Number(selectedBooking.total_amount || 0))}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Platform Commission ({Math.round(commissionRate * 100)}%)</Text>
                    <Text style={[styles.detailVal, { color: Colors.error }]}>
                      - {formatINR(Number(selectedBooking.total_amount || 0) * commissionRate)}
                    </Text>
                  </View>
                  <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, paddingTop: 6, marginTop: 4 }]}>
                    <Text style={[styles.detailLabel, { fontWeight: 'bold' }]}>Net Partner Settlement</Text>
                    <Text style={[styles.detailVal, { color: Colors.statusApproved, fontWeight: 'bold', fontSize: 15 }]}>
                      {formatINR(Number(selectedBooking.total_amount || 0) * (1 - commissionRate))}
                    </Text>
                  </View>
                </View>

                {/* Platform Notice */}
                <View style={styles.platformNotice}>
                  <MaterialIcons name="verified-user" size={14} color={Colors.info} />
                  <Text style={styles.platformNoticeText}>
                    Financial settlement is reconciled and remitted to your verified business account according to standard cycle rules.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setSelectedBooking(null)}
                >
                  <Text style={styles.doneBtnText}>Close Manifest</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingVertical: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLow,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLow,
    paddingBottom: Spacing.xs,
  },
  refText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  dateSub: {
    fontSize: 10,
    color: Colors.onSurfaceSubtle,
    marginTop: 1,
  },
  cardBody: {
    paddingVertical: Spacing.sm,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  guestName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  partyText: {
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  itemTitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLow,
    paddingTop: Spacing.xs + 2,
  },
  paymentStatusText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  netPayoutSub: {
    fontSize: 10.5,
    color: Colors.statusApproved,
    fontWeight: '600',
    marginTop: 1,
  },
  grossAmountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  viewManifestText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: 'bold',
    marginTop: 1,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  emptyDesc: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  lockedCard: {
    backgroundColor: '#fffbeb',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
  },
  lockedDesc: {
    fontSize: 11,
    color: '#78350f',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLow,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  modalRef: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  modalSection: {
    backgroundColor: Colors.surfaceLow,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  detailVal: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  passengerName: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: Colors.onSurface,
    flex: 1,
  },
  passengerType: {
    fontSize: 10,
    color: Colors.onSurfaceSubtle,
  },
  itemMainTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  itemSubDesc: {
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  platformNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.sm,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  platformNoticeText: {
    fontSize: 10,
    color: Colors.info,
    flex: 1,
    lineHeight: 14,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
