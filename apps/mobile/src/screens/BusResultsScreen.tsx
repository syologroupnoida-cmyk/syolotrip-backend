import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName, BusOption } from '../types/travel';
import { fetchBusesApi } from '../services/api';

interface BusResultsScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectBus: (bus: BusOption) => void;
}

export const BusResultsScreen: React.FC<BusResultsScreenProps> = ({
  onNavigate,
  onSelectBus,
}) => {
  const [buses, setBuses] = useState<BusOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<'recommended' | 'cheapest' | 'fastest'>('recommended');
  const [selectedType, setSelectedType] = useState<string>('all');

  const loadBuses = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchBusesApi();
      setBuses(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to live bus inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBuses();
  }, []);

  const filteredBuses = buses
    .filter((b) => {
      if (selectedType === 'all') return true;
      if (selectedType === 'sleeper' && !b.busType.toLowerCase().includes('sleeper')) return false;
      if (selectedType === 'ac' && !b.busType.toLowerCase().includes('ac')) return false;
      if (selectedType === 'volvo' && !b.busType.toLowerCase().includes('volvo')) return false;
      return true;
    })
    .sort((a, b) => {
      if (activeSort === 'cheapest') return a.price - b.price;
      if (activeSort === 'fastest') return a.duration.localeCompare(b.duration);
      return 0;
    });

  const handleSelect = (bus: BusOption) => {
    onSelectBus(bus);
    onNavigate('checkout');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Route Capsule Summary Bar */}
      <View style={styles.searchSummaryContainer}>
        <View style={styles.searchSummaryCard}>
          <View style={styles.routeHeaderRow}>
            <View style={styles.cityRow}>
              <MaterialIcons name="directions-bus" size={18} color={Colors.primary} />
              <Text style={styles.cityText}>New Delhi</Text>
              <MaterialIcons name="arrow-forward" size={16} color={Colors.primaryContainer} />
              <Text style={styles.cityText}>Jaipur</Text>
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
            <Text style={styles.routeMetaText}>Intercity Express</Text>
            <View style={styles.metaDot} />
            <Text style={styles.routeMetaText}>1 Passenger</Text>
            <View style={styles.metaDot} />
            <Text style={styles.routeMetaText}>Verified Operators</Text>
          </View>
        </View>
      </View>

      {/* Quick Filter & Sort Tabs */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedType('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedType === 'all' && styles.filterChipTextActive]}>
              All Buses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'sleeper' && styles.filterChipActive]}
            onPress={() => setSelectedType('sleeper')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedType === 'sleeper' && styles.filterChipTextActive]}>
              Sleeper
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'ac' && styles.filterChipActive]}
            onPress={() => setSelectedType('ac')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedType === 'ac' && styles.filterChipTextActive]}>
              AC Only
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'volvo' && styles.filterChipActive]}
            onPress={() => setSelectedType('volvo')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedType === 'volvo' && styles.filterChipTextActive]}>
              Volvo / Scania
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sort Row */}
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortBtn, activeSort === 'recommended' && styles.sortBtnActive]}
            onPress={() => setActiveSort('recommended')}
          >
            <Text style={[styles.sortBtnText, activeSort === 'recommended' && styles.sortBtnTextActive]}>
              Recommended
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, activeSort === 'cheapest' && styles.sortBtnActive]}
            onPress={() => setActiveSort('cheapest')}
          >
            <Text style={[styles.sortBtnText, activeSort === 'cheapest' && styles.sortBtnTextActive]}>
              Cheapest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, activeSort === 'fastest' && styles.sortBtnActive]}
            onPress={() => setActiveSort('fastest')}
          >
            <Text style={[styles.sortBtnText, activeSort === 'fastest' && styles.sortBtnTextActive]}>
              Fastest
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching verified bus operators...</Text>
        </View>
      )}

      {/* Error State */}
      {!isLoading && errorMsg && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={36} color={Colors.error} />
          <Text style={styles.errorTitle}>Unable to Load Buses</Text>
          <Text style={styles.errorSub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadBuses}>
            <Text style={styles.retryBtnText}>Retry Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && filteredBuses.length === 0 && (
        <View style={styles.centerBox}>
          <MaterialIcons name="directions-bus" size={48} color={Colors.outlineVariant} />
          <Text style={styles.emptyTitle}>No Buses Found</Text>
          <Text style={styles.emptySub}>No buses matched your selected filter.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setSelectedType('all')}>
            <Text style={styles.retryBtnText}>Show All Buses</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bus Results List */}
      {!isLoading && !errorMsg && filteredBuses.map((bus) => (
        <View key={bus.id} style={styles.busCard}>
          {/* Header Row: Operator & Rating */}
          <View style={styles.busHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.operatorName}>{bus.operatorName}</Text>
              <Text style={styles.busType}>{bus.busType}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={13} color="#f59e0b" />
              <Text style={styles.ratingText}>{bus.rating.toFixed(1)}</Text>
            </View>
          </View>

          {/* Schedule Row */}
          <View style={styles.scheduleRow}>
            <View style={styles.locationCol}>
              <Text style={styles.timeText}>{bus.departureTime}</Text>
              <Text style={styles.cityName}>{bus.fromCity}</Text>
              <Text style={styles.stopName} numberOfLines={1}>{bus.boardingPoint}</Text>
            </View>

            <View style={styles.durationCol}>
              <Text style={styles.durationText}>{bus.duration}</Text>
              <View style={styles.durationLineContainer}>
                <View style={styles.durationLine} />
                <MaterialIcons name="directions-bus" size={16} color={Colors.primary} style={styles.durationIcon} />
              </View>
              <Text style={styles.verifiedLabel}>GPS Tracked</Text>
            </View>

            <View style={[styles.locationCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.timeText}>{bus.arrivalTime}</Text>
              <Text style={styles.cityName}>{bus.toCity}</Text>
              <Text style={styles.stopName} numberOfLines={1}>{bus.droppingPoint}</Text>
            </View>
          </View>

          {/* Footer Row: Seats, Price & CTA */}
          <View style={styles.busFooter}>
            <View>
              <View style={styles.seatsRow}>
                <View style={[
                  styles.seatsDot,
                  { backgroundColor: bus.availableSeats > 5 ? '#10b981' : '#f59e0b' }
                ]} />
                <Text style={styles.seatsText}>
                  {bus.availableSeats > 0
                    ? `${bus.availableSeats} Seats Left`
                    : 'Sold Out'}
                </Text>
              </View>
              <Text style={styles.priceLabel}>Seat starting at</Text>
              <Text style={styles.priceValue}>{formatINR(bus.price)}</Text>
            </View>

            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => handleSelect(bus)}
              activeOpacity={0.8}
            >
              <Text style={styles.selectBtnText}>Select Bus</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  searchSummaryContainer: {
    marginBottom: Spacing.md,
  },
  searchSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cityText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  routeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  routeMetaText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.outlineVariant,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sortBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortBtnActive: {
    backgroundColor: Colors.surfaceContainerLow,
    borderColor: Colors.primary,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  sortBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  busCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  operatorName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  busType: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: '#fffbeb',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  locationCol: {
    width: '32%',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  cityName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  stopName: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  durationCol: {
    alignItems: 'center',
    width: '36%',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  durationLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
  },
  durationLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.outlineVariant,
  },
  durationIcon: {
    marginHorizontal: 2,
  },
  verifiedLabel: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  busFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  seatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  seatsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  seatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  priceLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.secondary,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 1.5,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  errorSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
});
