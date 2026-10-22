import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName, FlightOption } from '../types/travel';
import { fetchFlightsApi } from '../services/api';

interface FlightResultsScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectFlight: (flight: FlightOption) => void;
}

const FLIGHTS_DATA: FlightOption[] = [
  {
    id: 'ana-107',
    airline: 'All Nippon Airways (ANA)',
    flightCode: 'Flight NH 107',
    aircraft: 'Boeing 787-9 Dreamliner',
    originCode: 'SFO',
    originTerminal: 'Terminal I',
    departureTime: '11:30 AM',
    destCode: 'HND',
    destTerminal: 'Terminal 3',
    arrivalTime: '3:20 PM',
    duration: '11h 50m',
    isNextDay: true,
    stopsText: 'Non-stop',
    isDirect: true,
    price: 64890,
    badge: 'Top Recommended',
    badgeVariant: 'recommended',
    perks: ['2 Free Checked Bags', 'High-speed Wi-Fi', 'Warm Japanese Meal'],
  },
  {
    id: 'jal-001',
    airline: 'Japan Airlines (JAL)',
    flightCode: 'Flight JL 001',
    aircraft: 'Airbus A350-1000',
    originCode: 'SFO',
    originTerminal: 'Terminal I',
    departureTime: '1:15 PM',
    destCode: 'HND',
    destTerminal: 'Terminal 3',
    arrivalTime: '4:45 PM',
    duration: '11h 30m',
    isNextDay: true,
    stopsText: 'Non-stop',
    isDirect: true,
    price: 72400,
    badge: 'Great Schedule',
    badgeVariant: 'schedule',
    perks: ['2 Free Checked Bags', 'Wi-Fi & Live TV', 'Sake & Dining'],
  },
  {
    id: 'ua-875',
    airline: 'United Airlines',
    flightCode: 'Flight UA 875',
    aircraft: 'Boeing 777-300ER',
    originCode: 'SFO',
    originTerminal: 'Terminal 3',
    departureTime: '10:45 AM',
    destCode: 'HND',
    destTerminal: 'Terminal 3',
    arrivalTime: '2:05 PM',
    duration: '11h 20m',
    isNextDay: true,
    stopsText: 'Non-stop',
    isDirect: true,
    price: 54900,
    badge: 'Budget Pick',
    badgeVariant: 'budget',
    perks: ['1 Free Carry-on', 'Seatback Entertainment', 'Standard Meal'],
  },
  {
    id: 'sq-11',
    airline: 'Singapore Airlines',
    flightCode: 'Flight SQ 11',
    aircraft: 'Boeing 777-300ER',
    originCode: 'SFO',
    originTerminal: 'Terminal I',
    departureTime: '2:30 PM',
    destCode: 'HND',
    destTerminal: 'Terminal 3',
    arrivalTime: '6:40 PM',
    duration: '12h 10m',
    isNextDay: true,
    stopsText: 'Non-stop',
    isDirect: true,
    price: 79800,
    badge: 'Luxury Comfort',
    badgeVariant: 'recommended',
    perks: ['2 Checked Bags', 'World-Class Dining', 'Extra Legroom'],
  },
];

export const FlightResultsScreen: React.FC<FlightResultsScreenProps> = ({
  onNavigate,
  onSelectFlight,
}) => {
  const [flights, setFlights] = useState<FlightOption[]>(FLIGHTS_DATA);
  const [activeSort, setActiveSort] = useState<'best' | 'cheapest' | 'fastest'>('best');
  const [nonStopOnly, setNonStopOnly] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    fetchFlightsApi(FLIGHTS_DATA).then((data) => {
      if (data && data.length > 0) {
        setFlights(data);
      }
    });
  }, []);

  const filteredFlights = flights.filter((f) => {
    if (nonStopOnly && !f.isDirect) return false;
    if (selectedFilter === 'under60k' && f.price > 60000) return false;
    return true;
  }).sort((a, b) => {
    if (activeSort === 'cheapest') return a.price - b.price;
    if (activeSort === 'fastest') return a.duration.localeCompare(b.duration);
    return 0; // default 'best'
  });

  const handleSelect = (flight: FlightOption) => {
    onSelectFlight(flight);
    onNavigate('checkout');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Search Capsule Bar */}
      <View style={styles.searchSummaryContainer}>
        <View style={styles.searchSummaryCard}>
          <View style={styles.routeHeaderRow}>
            <View style={styles.airportCodes}>
              <Text style={styles.airportCodeText}>SFO</Text>
              <MaterialIcons name="arrow-forward" size={16} color={Colors.primaryContainer} />
              <Text style={styles.airportCodeText}>HND</Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => onNavigate('explore')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="edit" size={13} color={Colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.routeMetaRow}>
            <View style={styles.routeMetaLeft}>
              <Text style={styles.routeMetaText}>Oct 14–24</Text>
              <View style={styles.metaDot} />
              <Text style={styles.routeMetaText}>1 Traveler</Text>
              <View style={styles.metaDot} />
              <Text style={styles.routeMetaText}>Economy</Text>
            </View>

            {/* Price Alerts Toggle */}
            <View style={styles.alertsToggleGroup}>
              <MaterialIcons
                name="notifications-active"
                size={14}
                color={Colors.secondaryContainer}
              />
              <Text style={styles.alertsLabel}>Alerts</Text>
              <Switch
                value={priceAlerts}
                onValueChange={setPriceAlerts}
                trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primaryContainer }}
                thumbColor="#ffffff"
                style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Filter Pills Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        <TouchableOpacity
          style={[styles.filterPill, nonStopOnly && styles.filterPillActive]}
          onPress={() => setNonStopOnly(!nonStopOnly)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterPillText, nonStopOnly && styles.filterPillTextActive]}>
            Non-stop only
          </Text>
          {nonStopOnly && (
            <MaterialIcons name="close" size={14} color="#ffffff" style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPill,
            selectedFilter === 'under60k' && styles.filterPillActive,
          ]}
          onPress={() => setSelectedFilter(selectedFilter === 'under60k' ? 'all' : 'under60k')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterPillText,
              selectedFilter === 'under60k' && styles.filterPillTextActive,
            ]}
          >
            Under ₹60,000
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
          <MaterialIcons name="wb-twilight" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.filterPillText}>Morning Dep.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
          <Text style={styles.filterPillText}>ANA & JAL</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
          <MaterialIcons name="luggage" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.filterPillText}>Baggage Included</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sort 3-Segment Selector */}
      <View style={styles.sortSection}>
        <View style={styles.sortGrid}>
          <TouchableOpacity
            style={[styles.sortTab, activeSort === 'best' && styles.sortTabActive]}
            onPress={() => setActiveSort('best')}
            activeOpacity={0.8}
          >
            <View style={styles.sortBadgeRow}>
              <MaterialIcons name="verified" size={13} color={Colors.tertiary} />
              <Text
                style={[styles.sortTagLabel, activeSort === 'best' && styles.sortTagLabelActive]}
              >
                Best
              </Text>
            </View>
            <Text style={styles.sortPrice}>₹64,890</Text>
            <Text style={styles.sortDuration}>11h 20m</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortTab, activeSort === 'cheapest' && styles.sortTabActive]}
            onPress={() => setActiveSort('cheapest')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sortTagLabel,
                activeSort === 'cheapest' && styles.sortTagLabelActive,
              ]}
            >
              Cheapest
            </Text>
            <Text style={styles.sortPrice}>₹54,900</Text>
            <Text style={styles.sortDuration}>14h 15m</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortTab, activeSort === 'fastest' && styles.sortTabActive]}
            onPress={() => setActiveSort('fastest')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sortTagLabel,
                activeSort === 'fastest' && styles.sortTagLabelActive,
              ]}
            >
              Fastest
            </Text>
            <Text style={styles.sortPrice}>₹72,400</Text>
            <Text style={styles.sortDuration}>10h 50m</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Flight Cards List */}
      <View style={styles.flightList}>
        {filteredFlights.map((flight) => {
          return (
            <View key={flight.id} style={styles.flightCard}>
              {/* Badge strip if available */}
              {flight.badge && (
                <View
                  style={[
                    styles.flightBadge,
                    flight.badgeVariant === 'recommended' && styles.badgeRecommended,
                    flight.badgeVariant === 'schedule' && styles.badgeSchedule,
                    flight.badgeVariant === 'budget' && styles.badgeBudget,
                  ]}
                >
                  <MaterialIcons
                    name={
                      flight.badgeVariant === 'recommended'
                        ? 'hotel-class'
                        : flight.badgeVariant === 'schedule'
                        ? 'schedule'
                        : 'savings'
                    }
                    size={12}
                    color={
                      flight.badgeVariant === 'schedule' ? Colors.primary : '#ffffff'
                    }
                  />
                  <Text
                    style={[
                      styles.flightBadgeText,
                      flight.badgeVariant === 'schedule' && { color: Colors.primary },
                    ]}
                  >
                    {flight.badge}
                  </Text>
                </View>
              )}

              <View style={styles.flightCardInner}>
                {/* Airline & Aircraft Header */}
                <View style={styles.airlineHeader}>
                  <View style={styles.airlineLogoBox}>
                    <MaterialIcons name="flight-takeoff" size={18} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.airlineName}>{flight.airline}</Text>
                    <Text style={styles.flightMeta}>
                      {flight.flightCode} · {flight.aircraft}
                    </Text>
                  </View>
                </View>

                {/* Departure & Arrival Timeline */}
                <View style={styles.timelineRow}>
                  {/* Departure */}
                  <View style={styles.timelinePoint}>
                    <Text style={styles.timeText}>{flight.departureTime}</Text>
                    <Text style={styles.codeText}>{flight.originCode}</Text>
                    <Text style={styles.terminalText}>{flight.originTerminal}</Text>
                  </View>

                  {/* Route Duration Connector */}
                  <View style={styles.connectorWrapper}>
                    <Text style={styles.durationText}>{flight.duration}</Text>
                    <View style={styles.connectorLineContainer}>
                      <View style={styles.connectorLine} />
                      <View style={styles.connectorDot} />
                    </View>
                    <Text style={styles.stopsText}>{flight.stopsText}</Text>
                  </View>

                  {/* Arrival */}
                  <View style={[styles.timelinePoint, { alignItems: 'flex-end' }]}>
                    <View style={styles.arrivalTimeRow}>
                      <Text style={styles.timeText}>{flight.arrivalTime}</Text>
                      {flight.isNextDay && <Text style={styles.nextDayBadge}>+1</Text>}
                    </View>
                    <Text style={styles.codeText}>{flight.destCode}</Text>
                    <Text style={styles.terminalText}>{flight.destTerminal}</Text>
                  </View>
                </View>

                {/* Amenity / Perk Pills */}
                <View style={styles.perksRow}>
                  {flight.perks.map((perk, idx) => (
                    <View key={idx} style={styles.perkChip}>
                      <MaterialIcons
                        name={
                          idx === 0 ? 'luggage' : idx === 1 ? 'wifi' : 'restaurant'
                        }
                        size={12}
                        color={idx === 0 ? Colors.tertiary : idx === 1 ? Colors.primary : Colors.secondary}
                      />
                      <Text style={styles.perkChipText}>{perk}</Text>
                    </View>
                  ))}
                </View>

                {/* Price and Select Button */}
                <View style={styles.flightFooter}>
                  <View>
                    <View style={styles.priceRow}>
                      <Text style={styles.flightPrice}>{formatINR(flight.price)}</Text>
                      <Text style={styles.roundtripLabel}>roundtrip</Text>
                    </View>
                    <Text style={styles.taxNote}>Includes taxes & carrier fees</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => handleSelect(flight)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.selectBtnText}>Select</Text>
                    <MaterialIcons name="chevron-right" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  searchSummaryContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  searchSummaryCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  airportCodes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  airportCodeText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  routeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  routeMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeMetaText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.outlineVariant,
  },
  alertsToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertsLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  filtersScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryContainer,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sortSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  sortGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    padding: 3,
    gap: 4,
  },
  sortTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
  },
  sortTabActive: {
    backgroundColor: Colors.surfaceContainerLowest,
    ...Shadows.sm,
  },
  sortBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sortTagLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  sortTagLabelActive: {
    color: Colors.primary,
  },
  sortPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
    marginTop: 2,
  },
  sortDuration: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  flightList: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  flightCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.md,
  },
  flightBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  badgeRecommended: {
    backgroundColor: Colors.tertiaryContainer,
  },
  badgeSchedule: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  badgeBudget: {
    backgroundColor: Colors.secondaryContainer,
  },
  flightBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  flightCardInner: {
    padding: Spacing.md,
    paddingTop: Spacing.md + 4,
  },
  airlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  airlineLogoBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  flightMeta: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  timelinePoint: {
    minWidth: 70,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  terminalText: {
    fontSize: 10,
    color: Colors.outline,
    marginTop: 1,
  },
  arrivalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  nextDayBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondary,
  },
  connectorWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  connectorLineContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 8,
  },
  connectorLine: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.outlineVariant,
  },
  connectorDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.tertiary,
  },
  stopsText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.tertiary,
    marginTop: 4,
  },
  perksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: Spacing.sm,
  },
  perkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  perkChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  flightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerLow,
    marginTop: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  flightPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.onSurface,
  },
  roundtripLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  taxNote: {
    fontSize: 10,
    color: Colors.tertiary,
    fontWeight: '600',
    marginTop: 1,
  },
  selectBtn: {
    backgroundColor: Colors.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  selectBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
