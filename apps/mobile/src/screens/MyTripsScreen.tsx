import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName } from '../types/travel';
import { getMyTripsMobileApi, cancelBookingMobileApi, getCurrentUserMobileApi } from '../services/api';

interface MyTripsScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onOpenAuth: () => void;
}

export const MyTripsScreen: React.FC<MyTripsScreenProps> = ({ onNavigate, onOpenAuth }) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED'>('ALL');
  const [user, setUser] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUserMobileApi();
      setUser(currentUser);
      const data = await getMyTripsMobileApi();
      setTrips(data);
    } catch (err) {
      console.warn('Failed to load trips', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this booking? This will release reserved seats and initiate refund processing.',
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBookingMobileApi(bookingId, 'Customer cancellation via mobile app');
              Alert.alert('Booking Cancelled', 'Your reservation status has been updated to CANCELLED.');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to cancel booking at this time.');
            }
          },
        },
      ]
    );
  };

  const filteredTrips = trips.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return (t.status || '').toUpperCase() === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED') {
      return (
        <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
          <MaterialIcons name="check-circle" size={13} color="#10b981" />
          <Text style={[styles.badgeText, { color: '#10b981' }]}>Confirmed</Text>
        </View>
      );
    }
    if (s === 'PENDING') {
      return (
        <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
          <MaterialIcons name="schedule" size={13} color="#f59e0b" />
          <Text style={[styles.badgeText, { color: '#f59e0b' }]}>Pending</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
        <MaterialIcons name="cancel" size={13} color="#ef4444" />
        <Text style={[styles.badgeText, { color: '#ef4444' }]}>Cancelled</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
          {(['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterPill, statusFilter === tab && styles.filterPillActive]}
              onPress={() => setStatusFilter(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, statusFilter === tab && styles.filterPillTextActive]}>
                {tab === 'ALL' ? 'All Itineraries' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your reservations...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Header Banner */}
          <View style={styles.bannerCard}>
            <View>
              <Text style={styles.bannerTitle}>My Travel Trips</Text>
              <Text style={styles.bannerSub}>
                {user ? `Welcome back, ${user.full_name || user.fullName || user.email}` : 'Signed in as Guest Traveler'}
              </Text>
            </View>
            {!user && (
              <TouchableOpacity style={styles.signInBtn} onPress={onOpenAuth} activeOpacity={0.8}>
                <Text style={styles.signInBtnText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Trips List */}
          {filteredTrips.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="flight-takeoff" size={48} color={Colors.onSurfaceVariant} />
              <Text style={styles.emptyTitle}>No Itineraries Found</Text>
              <Text style={styles.emptyDesc}>
                You don't have any bookings matching this status. Explore upcoming flights and luxury resorts now.
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => onNavigate('explore')}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreBtnText}>Explore Destinations</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTrips.map((trip) => {
              const serviceType = (trip.service_type || '').toUpperCase();
              const isFlight = serviceType === 'FLIGHT';
              const isHotel = serviceType === 'HOTEL';
              const isTrain = serviceType === 'TRAIN';
              const isBus = serviceType === 'BUS';
              const isCab = serviceType === 'CAB';
              const isPackage = serviceType === 'PACKAGE';
              const details = trip.details_snapshot || {};
              const items = Array.isArray(trip.items) ? trip.items : [];
              const firstItem = items[0] || {};
              const totalAmount = Number(trip.total_amount ?? trip.price_breakdown?.total_amount ?? 0);
              const isCancelled = (trip.status || '').toUpperCase() === 'CANCELLED';

              const serviceIconName: any = isFlight
                ? 'flight'
                : isHotel
                ? 'hotel'
                : isTrain
                ? 'train'
                : isBus
                ? 'directions-bus'
                : isCab
                ? 'local-taxi'
                : isPackage
                ? 'beach-access'
                : 'luggage';

              return (
                <View key={trip.id} style={styles.tripCard}>
                  {/* Card Header */}
                  <View style={styles.tripCardHeader}>
                    <View style={styles.serviceRow}>
                      <View style={styles.serviceIconCircle}>
                        <MaterialIcons
                          name={serviceIconName}
                          size={16}
                          color={Colors.primary}
                        />
                      </View>
                      <View>
                        <Text style={styles.bookingRefText}>REF: {trip.booking_reference}</Text>
                        <Text style={styles.serviceTypeText}>{serviceType} RESERVATION</Text>
                      </View>
                    </View>
                    {getStatusBadge(trip.status)}
                  </View>

                  {/* Card Body */}
                  <View style={styles.tripCardBody}>
                    {isFlight ? (
                      <View style={styles.flightSummary}>
                        <Text style={styles.itemTitle}>{details.airline || firstItem.title || 'Scheduled Flight'}</Text>
                        <View style={styles.flightRouteRow}>
                          <Text style={styles.airportCode}>{details.origin?.code || 'DEL'}</Text>
                          <MaterialIcons name="arrow-forward" size={16} color={Colors.primary} />
                          <Text style={styles.airportCode}>{details.destination?.code || 'BOM'}</Text>
                        </View>
                        <Text style={styles.itemMeta}>Flight {details.flight_number || 'AI 102'} · Non-stop</Text>
                      </View>
                    ) : isHotel ? (
                      <View style={styles.hotelSummary}>
                        <Text style={styles.itemTitle}>{details.hotel_name || firstItem.title || 'Verified Hotel Stay'}</Text>
                        <Text style={styles.itemMeta}>
                          {details.city || 'Central City'} · {details.room_type || 'Deluxe Room'}
                        </Text>
                        <Text style={styles.itemSub}>{details.nights || 1} Night(s) Confirmed</Text>
                      </View>
                    ) : isTrain ? (
                      <View style={styles.hotelSummary}>
                        <Text style={styles.itemTitle}>{details.train_name || firstItem.title || 'Express Train'}</Text>
                        <Text style={styles.itemMeta}>
                          {details.from_station || 'Origin'} ➔ {details.to_station || 'Destination'}
                        </Text>
                        <Text style={styles.itemSub}>Class: {details.train_class || 'Executive'}</Text>
                      </View>
                    ) : isBus ? (
                      <View style={styles.hotelSummary}>
                        <Text style={styles.itemTitle}>{details.operator_name || firstItem.title || 'Intercity Bus'}</Text>
                        <Text style={styles.itemMeta}>
                          {details.from_city || 'Origin'} ➔ {details.to_city || 'Destination'}
                        </Text>
                        <Text style={styles.itemSub}>{details.bus_type || 'AC Sleeper'}</Text>
                      </View>
                    ) : isCab ? (
                      <View style={styles.hotelSummary}>
                        <Text style={styles.itemTitle}>{details.car_model || firstItem.title || 'Dedicated Cab'}</Text>
                        <Text style={styles.itemMeta}>
                          {details.pickup_area || 'Pickup Point'} ➔ {details.drop_area || 'Drop Point'}
                        </Text>
                        <Text style={styles.itemSub}>Driver Assigned on Dispatch</Text>
                      </View>
                    ) : (
                      <View style={styles.hotelSummary}>
                        <Text style={styles.itemTitle}>{details.package_title || firstItem.title || 'Holiday Package'}</Text>
                        <Text style={styles.itemMeta}>
                          {details.destination || 'Vacation Destination'}
                        </Text>
                        <Text style={styles.itemSub}>All-Inclusive Experience</Text>
                      </View>
                    )}
                  </View>

                  {/* Card Footer */}
                  <View style={styles.tripCardFooter}>
                    <View>
                      <Text style={styles.totalLabel}>Total Price</Text>
                      <Text style={styles.totalPrice}>{formatINR(totalAmount)}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={styles.ticketBtn}
                        onPress={() => setSelectedTicket(trip)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="confirmation-number" size={13} color="#0066FF" />
                        <Text style={styles.ticketBtnText}>E-Ticket</Text>
                      </TouchableOpacity>

                      {!isCancelled && (
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => handleCancelBooking(trip.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── Mobile E-Ticket Modal ── */}
      {selectedTicket && (
        <Modal
          visible={!!selectedTicket}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>SS Journey E-Ticket Voucher</Text>
                  <Text style={styles.modalSub}>
                    REF: <Text style={{ color: '#0066FF', fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedTicket.booking_reference}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedTicket(null)}
                  style={styles.modalCloseBtn}
                >
                  <MaterialIcons name="close" size={20} color={Colors.onSurface} />
                </TouchableOpacity>
              </View>

              {/* Disclaimer Notice */}
              <View style={styles.disclaimerBox}>
                <MaterialIcons name="info" size={15} color="#f59e0b" style={{ marginTop: 1 }} />
                <Text style={styles.disclaimerText}>
                  Demonstration Voucher: Issued by SS Journey travel platform for reservation confirmation. Reflects internal verified database record. Not a live carrier boarding pass.
                </Text>
              </View>

              {/* Scrollable details */}
              <ScrollView style={{ padding: Spacing.md }} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>RESERVATION DETAILS</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Service</Text>
                    <Text style={styles.detailVal}>{selectedTicket.service_type || 'TRAVEL'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={styles.detailVal}>{selectedTicket.status}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Booking Date</Text>
                    <Text style={styles.detailVal}>{new Date(selectedTicket.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>

                {selectedTicket.passengers && selectedTicket.passengers.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>PASSENGER MANIFEST</Text>
                    {selectedTicket.passengers.map((p: any, idx: number) => (
                      <View key={idx} style={styles.detailRow}>
                        <Text style={styles.detailVal}>{p.title || 'Mr'} {p.first_name} {p.last_name}</Text>
                        <Text style={styles.detailLabel}>Seat Assigned at Gate</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>PAYMENT BREAKDOWN</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Base Amount</Text>
                    <Text style={styles.detailVal}>{formatINR(Number(selectedTicket.base_amount || 0))}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Taxes & Fees</Text>
                    <Text style={styles.detailVal}>{formatINR(Number(selectedTicket.taxes_amount || 0))}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 6, marginTop: 4 }]}>
                    <Text style={[styles.detailVal, { fontWeight: 'bold' }]}>Total Paid (Demo)</Text>
                    <Text style={[styles.detailVal, { color: '#0066FF', fontWeight: 'bold', fontSize: 16 }]}>
                      {formatINR(Number(selectedTicket.total_amount || 0))}
                    </Text>
                  </View>
                </View>

                {/* Simulated PNR Barcode */}
                <View style={styles.barcodeBox}>
                  <Text style={styles.barcodeText}>||||| | |||| ||| ||||| ||||||| | |||</Text>
                  <Text style={styles.barcodeSub}>
                    PNR: {selectedTicket.id ? selectedTicket.id.replace(/-/g, '').slice(0, 12).toUpperCase() : 'SSJ-DEMO'}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setSelectedTicket(null)}
                >
                  <Text style={styles.modalDoneBtnText}>Close E-Ticket</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: Colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: Spacing.sm,
  },
  filterPills: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 110,
    gap: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Shadows.sm,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  bannerSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  signInBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  signInBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  exploreBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  exploreBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tripCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  serviceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 61, 138, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingRefText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  serviceTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tripCardBody: {
    padding: Spacing.md,
  },
  flightSummary: {
    gap: 4,
  },
  flightRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: 4,
  },
  airportCode: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.onSurface,
  },
  hotelSummary: {
    gap: 2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  itemSub: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  tripCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  ticketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.4)',
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
  },
  ticketBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    color: '#fbbf24',
    lineHeight: 14,
  },
  detailSection: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailSectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
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
  barcodeBox: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#000000',
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
  },
  barcodeText: {
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 4,
    color: '#ffffff',
  },
  barcodeSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  modalFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalDoneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

