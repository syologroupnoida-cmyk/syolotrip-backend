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
import { ScreenName, CabOption } from '../types/travel';
import { fetchCabsApi } from '../services/api';

interface CabResultsScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectCab: (cab: CabOption) => void;
}

export const CabResultsScreen: React.FC<CabResultsScreenProps> = ({
  onNavigate,
  onSelectCab,
}) => {
  const [cabs, setCabs] = useState<CabOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<'recommended' | 'cheapest' | 'fastest'>('recommended');
  const [selectedType, setSelectedType] = useState<string>('all');

  const loadCabs = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchCabsApi();
      setCabs(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to live cab network.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCabs();
  }, []);

  const filteredCabs = cabs
    .filter((c) => {
      if (selectedType === 'all') return true;
      if (selectedType === 'sedan' && !c.cabType.toLowerCase().includes('sedan')) return false;
      if (selectedType === 'suv' && !c.cabType.toLowerCase().includes('suv')) return false;
      if (selectedType === 'prime' && !c.cabType.toLowerCase().includes('prime')) return false;
      return true;
    })
    .sort((a, b) => {
      if (activeSort === 'cheapest') return a.price - b.price;
      if (activeSort === 'fastest') return a.etaMinutes - b.etaMinutes;
      return 0;
    });

  const handleSelect = (cab: CabOption) => {
    onSelectCab(cab);
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
              <MaterialIcons name="local-taxi" size={18} color={Colors.primary} />
              <Text style={styles.cityText}>Airport Pickup ➔ Hotel</Text>
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
            <Text style={styles.routeMetaText}>Immediate Dispatch</Text>
            <View style={styles.metaDot} />
            <Text style={styles.routeMetaText}>Sanitized Fleet</Text>
            <View style={styles.metaDot} />
            <Text style={styles.routeMetaText}>Guaranteed Pricing</Text>
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
              All Cabs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'sedan' && styles.filterChipActive]}
            onPress={() => setSelectedType('sedan')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedType === 'sedan' && styles.filterChipTextActive]}>
              Sedan (4 Seater)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'suv' && styles.filterChipActive]}
            onPress={() => setSelectedType('suv')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedType === 'suv' && styles.filterChipTextActive]}>
              SUV (6 Seater)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'prime' && styles.filterChipActive]}
            onPress={() => setSelectedType('prime')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedType === 'prime' && styles.filterChipTextActive]}>
              Prime Executive
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
              Fastest Pickup
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Locating nearby available cabs...</Text>
        </View>
      )}

      {/* Error State */}
      {!isLoading && errorMsg && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={36} color={Colors.error} />
          <Text style={styles.errorTitle}>Unable to Load Cabs</Text>
          <Text style={styles.errorSub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadCabs}>
            <Text style={styles.retryBtnText}>Retry Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && filteredCabs.length === 0 && (
        <View style={styles.centerBox}>
          <MaterialIcons name="local-taxi" size={48} color={Colors.outlineVariant} />
          <Text style={styles.emptyTitle}>No Cabs Found</Text>
          <Text style={styles.emptySub}>No cabs matched your selected category filter.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setSelectedType('all')}>
            <Text style={styles.retryBtnText}>Show All Cabs</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cab Results List */}
      {!isLoading && !errorMsg && filteredCabs.map((cab) => (
        <View key={cab.id} style={styles.cabCard}>
          {/* Header Row: Vehicle Model & Rating */}
          <View style={styles.cabHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.cabTitleRow}>
                <Text style={styles.vehicleModel}>{cab.vehicleModel}</Text>
                <View style={styles.cabTypeBadge}>
                  <Text style={styles.cabTypeBadgeText}>{cab.cabType}</Text>
                </View>
              </View>
              <Text style={styles.driverInfo}>Driver: {cab.driverName} • {cab.city}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={13} color="#f59e0b" />
              <Text style={styles.ratingText}>{cab.driverRating.toFixed(1)}</Text>
            </View>
          </View>

          {/* Details Row: ETA, Capacity & Features */}
          <View style={styles.detailsRow}>
            <View style={styles.etaContainer}>
              <MaterialIcons name="access-time" size={15} color={Colors.primary} />
              <Text style={styles.etaText}>Pickup in {cab.etaMinutes} mins</Text>
            </View>
            <View style={styles.capacityContainer}>
              <MaterialIcons name="people" size={15} color={Colors.onSurfaceVariant} />
              <Text style={styles.capacityText}>{cab.capacity} Seats</Text>
            </View>
          </View>

          {/* Features Pills */}
          <View style={styles.featuresRow}>
            {cab.features.map((feature, idx) => (
              <View key={idx} style={styles.featurePill}>
                <MaterialIcons name="check" size={12} color="#059669" />
                <Text style={styles.featurePillText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Footer Row: Route Details, Price & CTA */}
          <View style={styles.cabFooter}>
            <View>
              <Text style={styles.routeAreas} numberOfLines={1}>
                {cab.pickupArea} ➔ {cab.dropArea}
              </Text>
              <Text style={styles.priceLabel}>Fixed Fare</Text>
              <Text style={styles.priceValue}>{formatINR(cab.price)}</Text>
            </View>

            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => handleSelect(cab)}
              activeOpacity={0.8}
            >
              <Text style={styles.selectBtnText}>Select Cab</Text>
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
  cabCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  cabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  vehicleModel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  cabTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  cabTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  driverInfo: {
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
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLow,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: Spacing.sm,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#166534',
  },
  cabFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  routeAreas: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    maxWidth: 160,
    marginBottom: 2,
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
