import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName, FlightOption, HotelOption } from '../types/travel';
import { SeatSelectionModal } from '../components/SeatSelectionModal';
import { BookingSuccessModal } from '../components/BookingSuccessModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CheckoutScreenProps {
  onNavigate: (screen: ScreenName) => void;
  selectedFlight?: FlightOption;
  selectedHotel?: HotelOption;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  onNavigate,
  selectedFlight,
  selectedHotel,
}) => {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState('23A');
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Form states
  const [legalName, setLegalName] = useState('Alexander Vanderbilt');
  const [dob, setDob] = useState('10 / 14 / 1988');
  const [passport, setPassport] = useState('A94821038');
  const [frequentFlyer, setFrequentFlyer] = useState('NH-Diamond Club #8892019');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'applepay' | 'upi'>('card');

  const basePrice = 168000;
  const taxes = 11200;
  const discount = 12500;
  const insurancePrice = 3999;

  const currentTotal =
    basePrice + taxes - discount + (hasInsurance ? insurancePrice : 0);

  const toggleSummary = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSummaryExpanded(!summaryExpanded);
  };

  const handleConfirmPay = () => {
    setIsSuccessModalOpen(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Tracker */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCard}>
            <View style={styles.progressLabels}>
              <Text style={styles.stepCount}>Step 2 of 3</Text>
              <Text style={styles.stepTitle}>Traveler & Payment</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
        </View>

        {/* Collapsible Trip Summary Card */}
        <View style={styles.summaryCard}>
          <TouchableOpacity
            style={styles.summaryHeader}
            onPress={toggleSummary}
            activeOpacity={0.8}
          >
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryHeaderLeft}>
                <View style={styles.luggageBadge}>
                  <MaterialIcons name="luggage" size={20} color={Colors.primary} />
                </View>
                <View>
                  <View style={styles.comboDealRow}>
                    <View style={styles.comboTag}>
                      <Text style={styles.comboTagText}>Combo Deal</Text>
                    </View>
                    <Text style={styles.comboDuration}>10 Days</Text>
                  </View>
                  <Text style={styles.tripTitle}>Tokyo Discovery</Text>
                </View>
              </View>

              <View style={styles.summaryTotalCol}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatINR(currentTotal)}</Text>
              </View>
            </View>

            <View style={styles.summarySubRow}>
              <View style={styles.summaryRoute}>
                <MaterialIcons name="flight-takeoff" size={14} color={Colors.tertiary} />
                <Text style={styles.summaryRouteText} numberOfLines={1}>
                  SFO ➔ HND • Gracery Shinjuku
                </Text>
              </View>

              <View style={styles.detailsToggle}>
                <Text style={styles.detailsToggleText}>
                  {summaryExpanded ? 'Hide' : 'Details'}
                </Text>
                <MaterialIcons
                  name={summaryExpanded ? 'expand-less' : 'expand-more'}
                  size={18}
                  color={Colors.primary}
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Expandable Drawer Details */}
          {summaryExpanded && (
            <View style={styles.drawerDetails}>
              {/* Flight snippet */}
              <View style={styles.snippetCard}>
                <MaterialIcons name="flight" size={18} color={Colors.primary} />
                <View style={styles.snippetMeta}>
                  <Text style={styles.snippetTitle}>
                    {selectedFlight ? selectedFlight.airline : 'All Nippon Airways (ANA)'}
                  </Text>
                  <Text style={styles.snippetSub}>SFO • 11:30 AM → HND • 3:20 PM (+1)</Text>
                </View>
                <View style={styles.snippetPill}>
                  <Text style={styles.snippetPillText}>Non-stop</Text>
                </View>
              </View>

              {/* Hotel snippet */}
              <View style={styles.snippetCard}>
                <MaterialIcons name="apartment" size={18} color={Colors.primary} />
                <View style={styles.snippetMeta}>
                  <Text style={styles.snippetTitle}>
                    {selectedHotel ? selectedHotel.name : 'Hotel Gracery Shinjuku'}
                  </Text>
                  <Text style={styles.snippetSub}>7 Nights • Superior Double • City View</Text>
                </View>
                <View style={[styles.snippetPill, { backgroundColor: Colors.tertiaryFixed }]}>
                  <Text style={[styles.snippetPillText, { color: Colors.onTertiaryFixed }]}>
                    Confirmed
                  </Text>
                </View>
              </View>

              {/* Price Breakdown */}
              <View style={styles.breakdownTable}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Flight & Hotel Base Bundle</Text>
                  <Text style={styles.breakdownVal}>{formatINR(basePrice)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Taxes, Security & Port Fees</Text>
                  <Text style={styles.breakdownVal}>{formatINR(taxes)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="local-activity" size={13} color={Colors.tertiary} />
                    <Text style={[styles.breakdownLabel, { color: Colors.tertiary, fontWeight: '700' }]}>
                      Promo WANDERLUST
                    </Text>
                  </View>
                  <Text style={[styles.breakdownVal, { color: Colors.tertiary, fontWeight: '700' }]}>
                    -{formatINR(discount)}
                  </Text>
                </View>
                {hasInsurance && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Travel Guard Protection</Text>
                    <Text style={styles.breakdownVal}>+{formatINR(insurancePrice)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Primary Traveler Information Section */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderLeft}>
              <MaterialIcons name="how-to-reg" size={20} color={Colors.primary} />
              <Text style={styles.formTitle}>Primary Traveler</Text>
            </View>
            <View style={styles.adultPill}>
              <Text style={styles.adultPillText}>Adult (18+)</Text>
            </View>
          </View>

          <View style={styles.inputsStack}>
            <View>
              <Text style={styles.inputLabel}>FULL LEGAL NAME</Text>
              <View style={styles.lockedInputWrapper}>
                <TextInput
                  value={legalName}
                  onChangeText={setLegalName}
                  style={styles.textInput}
                />
                <MaterialIcons
                  name="lock"
                  size={16}
                  color={Colors.onSurfaceVariant}
                  style={styles.inputIconRight}
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>DATE OF BIRTH</Text>
                <TextInput
                  value={dob}
                  onChangeText={setDob}
                  style={styles.textInput}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>PASSPORT NUMBER</Text>
                <TextInput
                  value={passport}
                  onChangeText={setPassport}
                  autoCapitalize="characters"
                  style={[styles.textInput, { fontWeight: '700', letterSpacing: 0.5 }]}
                />
              </View>
            </View>

            <View>
              <Text style={styles.inputLabel}>FREQUENT FLYER / MILEAGE PROGRAM</Text>
              <View style={styles.iconInputWrapper}>
                <MaterialIcons name="stars" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <TextInput
                  value={frequentFlyer}
                  onChangeText={setFrequentFlyer}
                  style={[styles.textInput, { flex: 1, backgroundColor: 'transparent' }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Flight Add-ons & Peace of Mind */}
        <View style={styles.addonsCard}>
          <View style={styles.addonsHeader}>
            <MaterialIcons name="tune" size={18} color={Colors.primary} />
            <Text style={styles.formTitle}>Flight Add-ons & Peace of Mind</Text>
          </View>

          {/* Seat selection row */}
          <View style={styles.seatRow}>
            <View style={styles.seatRowLeft}>
              <View style={styles.seatIconBadge}>
                <MaterialIcons name="airline-seat-recline-extra" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.seatName}>Window Seat {selectedSeat} Assigned</Text>
                <Text style={styles.seatSub}>Forward Cabin • Complimentary</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.changeSeatBtn}
              onPress={() => setIsSeatModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.changeSeatBtnText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Travel Guard Protection */}
          <TouchableOpacity
            style={styles.insuranceBox}
            onPress={() => setHasInsurance(!hasInsurance)}
            activeOpacity={0.8}
          >
            <View style={styles.checkboxWrapper}>
              <MaterialIcons
                name={hasInsurance ? 'check-box' : 'check-box-outline-blank'}
                size={22}
                color={hasInsurance ? Colors.secondaryContainer : Colors.outline}
              />
            </View>

            <View style={styles.insuranceContent}>
              <View style={styles.insuranceTagRow}>
                <Text style={styles.insuranceTitle}>Travel Guard Protection</Text>
                <View style={styles.recommendedPill}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              </View>
              <Text style={styles.insuranceDesc}>
                Covers 100% trip cancellation, medical emergency in Japan (₹10,00,000), and lost baggage reimbursement.
              </Text>
            </View>

            <Text style={styles.insurancePrice}>+{formatINR(insurancePrice)}</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.paymentCard}>
          <Text style={styles.formTitle}>Payment Method</Text>

          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOptionTile,
                paymentMethod === 'card' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('card')}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="credit-card"
                size={20}
                color={paymentMethod === 'card' ? Colors.primary : Colors.onSurfaceVariant}
              />
              <Text style={styles.paymentOptionLabel}>Visa ending 4242</Text>
              {paymentMethod === 'card' && (
                <MaterialIcons name="check-circle" size={16} color={Colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOptionTile,
                paymentMethod === 'applepay' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('applepay')}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="payment"
                size={20}
                color={paymentMethod === 'applepay' ? Colors.primary : Colors.onSurfaceVariant}
              />
              <Text style={styles.paymentOptionLabel}>Apple Pay / Google Pay</Text>
              {paymentMethod === 'applepay' && (
                <MaterialIcons name="check-circle" size={16} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Sticky Checkout Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalPrice}>{formatINR(currentTotal)}</Text>
        </View>

        <TouchableOpacity
          style={styles.confirmPayBtn}
          onPress={handleConfirmPay}
          activeOpacity={0.85}
        >
          <MaterialIcons name="lock" size={16} color="#ffffff" />
          <Text style={styles.confirmPayText}>Confirm & Pay</Text>
        </TouchableOpacity>
      </View>

      {/* Seat Selection Modal */}
      <SeatSelectionModal
        visible={isSeatModalOpen}
        currentSeat={selectedSeat}
        onSelectSeat={setSelectedSeat}
        onClose={() => setIsSeatModalOpen(false)}
      />

      {/* Booking Success Celebration Modal */}
      <BookingSuccessModal
        visible={isSuccessModalOpen}
        bookingRef="SSJ-849201"
        totalAmount={formatINR(currentTotal)}
        onDone={() => {
          setIsSuccessModalOpen(false);
          onNavigate('explore');
        }}
        onViewTrips={() => {
          setIsSuccessModalOpen(false);
          onNavigate('explore');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 110,
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    ...Shadows.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCount: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '66%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  summaryHeader: {
    padding: Spacing.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  luggageBadge: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboDealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comboTag: {
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comboTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onTertiaryFixed,
  },
  comboDuration: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  tripTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
    marginTop: 2,
  },
  summaryTotalCol: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 1,
  },
  summarySubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  summaryRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  summaryRouteText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  drawerDetails: {
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
  },
  snippetCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  snippetMeta: {
    flex: 1,
  },
  snippetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  snippetSub: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  snippetPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  snippetPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  breakdownTable: {
    paddingTop: Spacing.xs,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  breakdownVal: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  formCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  formHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  adultPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  adultPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  inputsStack: {
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.onSurface,
  },
  lockedInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIconRight: {
    position: 'absolute',
    right: 12,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
  },
  addonsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  addonsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  seatRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  seatIconBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  seatSub: {
    fontSize: 10,
    color: Colors.tertiary,
    marginTop: 1,
  },
  changeSeatBtn: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  changeSeatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  insuranceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  checkboxWrapper: {
    marginTop: 2,
  },
  insuranceContent: {
    flex: 1,
  },
  insuranceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insuranceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  recommendedPill: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSecondaryFixed,
  },
  insuranceDesc: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 3,
    lineHeight: 14,
  },
  insurancePrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondaryContainer,
  },
  paymentCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.md,
  },
  paymentOptions: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  paymentOptionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentOptionActive: {
    borderColor: Colors.primaryContainer,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  paymentOptionLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(250, 248, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 80, 125, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    ...Shadows.lg,
  },
  bottomTotalLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  bottomTotalPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  confirmPayBtn: {
    backgroundColor: Colors.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  confirmPayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
