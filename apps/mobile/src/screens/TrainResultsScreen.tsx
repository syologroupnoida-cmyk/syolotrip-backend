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
import { ScreenName, TrainOption } from '../types/travel';
import { fetchTrainsApi } from '../services/api';

interface TrainResultsScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectTrain: (train: TrainOption) => void;
}

export const TrainResultsScreen: React.FC<TrainResultsScreenProps> = ({
  onNavigate,
  onSelectTrain,
}) => {
  const [trains, setTrains] = useState<TrainOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<'recommended' | 'cheapest' | 'fastest'>('recommended');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const loadTrains = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchTrainsApi();
      setTrains(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to live train schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrains();
  }, []);

  const filteredTrains = trains
    .filter((t) => {
      if (selectedClass !== 'all' && t.trainClass !== selectedClass) return false;
      return true;
    })
    .sort((a, b) => {
      if (activeSort === 'cheapest') return a.price - b.price;
      if (activeSort === 'fastest') return a.duration.localeCompare(b.duration);
      return 0;
    });

  const handleSelect = (train: TrainOption) => {
    onSelectTrain(train);
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
            <View style={styles.stationCodes}>
              <MaterialIcons name="train" size={18} color={Colors.primary} />
              <Text style={styles.stationCodeText}>NDLS</Text>
              <MaterialIcons name="arrow-forward" size={16} color={Colors.primaryContainer} />
              <Text style={styles.stationCodeText}>BOM</Text>
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
            <Text style={styles.routeMetaText}>New Delhi ➔ Mumbai Central</Text>
            <View style={styles.metaDot} />
            <Text style={styles.routeMetaText}>1 Passenger</Text>
            <View style={styles.metaDot} />
            <Text style={styles.routeMetaText}>IRCTC Verified</Text>
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
            style={[styles.filterChip, selectedClass === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedClass('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedClass === 'all' && styles.filterChipTextActive]}>
              All Classes
            </Text>
          </TouchableOpacity>

          {['1A', '2A', '3A', 'CC', 'SL'].map((cls) => (
            <TouchableOpacity
              key={cls}
              style={[styles.filterChip, selectedClass === cls && styles.filterChipActive]}
              onPress={() => setSelectedClass(cls)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedClass === cls && styles.filterChipTextActive]}>
                Class {cls}
              </Text>
            </TouchableOpacity>
          ))}
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
          <Text style={styles.loadingText}>Searching available train schedules...</Text>
        </View>
      )}

      {/* Error State */}
      {!isLoading && errorMsg && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={36} color={Colors.error} />
          <Text style={styles.errorTitle}>Unable to Load Trains</Text>
          <Text style={styles.errorSub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadTrains}>
            <Text style={styles.retryBtnText}>Retry Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && filteredTrains.length === 0 && (
        <View style={styles.centerBox}>
          <MaterialIcons name="train" size={48} color={Colors.outlineVariant} />
          <Text style={styles.emptyTitle}>No Trains Found</Text>
          <Text style={styles.emptySub}>No trains matched your selected class filter.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setSelectedClass('all')}>
            <Text style={styles.retryBtnText}>Show All Classes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Train Results List */}
      {!isLoading && !errorMsg && filteredTrains.map((train) => (
        <View key={train.id} style={styles.trainCard}>
          {/* Header Row: Train Name, Number & Type */}
          <View style={styles.trainHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.trainTitleRow}>
                <Text style={styles.trainName}>{train.trainName}</Text>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>{train.trainClass}</Text>
                </View>
              </View>
              <Text style={styles.trainNumber}>#{train.trainNumber} • {train.trainType}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={13} color="#f59e0b" />
              <Text style={styles.ratingText}>{train.rating.toFixed(1)}</Text>
            </View>
          </View>

          {/* Timing Row */}
          <View style={styles.scheduleRow}>
            <View style={styles.stationCol}>
              <Text style={styles.timeText}>{train.departureTime}</Text>
              <Text style={styles.stationCode}>{train.fromStationCode}</Text>
              <Text style={styles.stationName} numberOfLines={1}>{train.fromStationName}</Text>
            </View>

            <View style={styles.durationCol}>
              <Text style={styles.durationText}>{train.duration}</Text>
              <View style={styles.durationLineContainer}>
                <View style={styles.durationLine} />
                <MaterialIcons name="train" size={16} color={Colors.primary} style={styles.durationIcon} />
              </View>
              <Text style={styles.directLabel}>Direct Journey</Text>
            </View>

            <View style={[styles.stationCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.timeText}>{train.arrivalTime}</Text>
              <Text style={styles.stationCode}>{train.toStationCode}</Text>
              <Text style={styles.stationName} numberOfLines={1}>{train.toStationName}</Text>
            </View>
          </View>

          {/* Footer Row: Availability, Price & CTA */}
          <View style={styles.trainFooter}>
            <View>
              <View style={styles.seatsRow}>
                <View style={[
                  styles.seatsDot,
                  { backgroundColor: train.availableSeats > 10 ? '#10b981' : '#f59e0b' }
                ]} />
                <Text style={styles.seatsText}>
                  {train.availableSeats > 0
                    ? `AVL ${train.availableSeats} Seats`
                    : 'Waitlist Available'}
                </Text>
              </View>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.priceValue}>{formatINR(train.price)}</Text>
            </View>

            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => handleSelect(train)}
              activeOpacity={0.8}
            >
              <Text style={styles.selectBtnText}>Select Train</Text>
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
  stationCodes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stationCodeText: {
    fontSize: 18,
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
  trainCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  trainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  trainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trainName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  trainNumber: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  classBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
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
  stationCol: {
    width: '32%',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  stationCode: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  stationName: {
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
  directLabel: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  trainFooter: {
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
