import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName, PackageOption } from '../types/travel';
import { fetchPackagesApi } from '../services/api';

interface PackageResultsScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectPackage: (pkg: PackageOption) => void;
}

export const PackageResultsScreen: React.FC<PackageResultsScreenProps> = ({
  onNavigate,
  onSelectPackage,
}) => {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<'recommended' | 'cheapest' | 'duration'>('recommended');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');

  const loadPackages = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchPackagesApi();
      setPackages(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to live holiday packages.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const filteredPackages = packages
    .filter((p) => {
      if (selectedDuration === 'all') return true;
      if (selectedDuration === 'short' && p.durationDays > 4) return false;
      if (selectedDuration === 'medium' && (p.durationDays < 5 || p.durationDays > 7)) return false;
      if (selectedDuration === 'long' && p.durationDays < 8) return false;
      return true;
    })
    .sort((a, b) => {
      if (activeSort === 'cheapest') return a.price - b.price;
      if (activeSort === 'duration') return b.durationDays - a.durationDays;
      return 0;
    });

  const handleSelect = (pkg: PackageOption) => {
    onSelectPackage(pkg);
    onNavigate('checkout');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Search Capsule Summary Bar */}
      <View style={styles.searchSummaryContainer}>
        <View style={styles.searchSummaryCard}>
          <View style={styles.routeHeaderRow}>
            <View style={styles.destRow}>
              <MaterialIcons name="card-travel" size={18} color={Colors.primary} />
              <Text style={styles.destText}>Holiday Getaways & Tours</Text>
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
            <Text style={styles.routeMetaText}>Handpicked Itineraries</Text>
            <View style={styles.metaDot} />
            <Text style={styles.routeMetaText}>Flights + Hotels + Tours</Text>
            <View style={styles.metaDot} />
            <Text style={styles.routeMetaText}>Curated Stays</Text>
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
            style={[styles.filterChip, selectedDuration === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedDuration('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedDuration === 'all' && styles.filterChipTextActive]}>
              All Packages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedDuration === 'short' && styles.filterChipActive]}
            onPress={() => setSelectedDuration('short')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedDuration === 'short' && styles.filterChipTextActive]}>
              Quick Break (2–4 Days)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedDuration === 'medium' && styles.filterChipActive]}
            onPress={() => setSelectedDuration('medium')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedDuration === 'medium' && styles.filterChipTextActive]}>
              Standard (5–7 Days)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedDuration === 'long' && styles.filterChipActive]}
            onPress={() => setSelectedDuration('long')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedDuration === 'long' && styles.filterChipTextActive]}>
              Extended (8+ Days)
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
              Curated Picks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, activeSort === 'cheapest' && styles.sortBtnActive]}
            onPress={() => setActiveSort('cheapest')}
          >
            <Text style={[styles.sortBtnText, activeSort === 'cheapest' && styles.sortBtnTextActive]}>
              Price: Low to High
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, activeSort === 'duration' && styles.sortBtnActive]}
            onPress={() => setActiveSort('duration')}
          >
            <Text style={[styles.sortBtnText, activeSort === 'duration' && styles.sortBtnTextActive]}>
              Longest Duration
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching available holiday packages...</Text>
        </View>
      )}

      {/* Error State */}
      {!isLoading && errorMsg && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={36} color={Colors.error} />
          <Text style={styles.errorTitle}>Unable to Load Packages</Text>
          <Text style={styles.errorSub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadPackages}>
            <Text style={styles.retryBtnText}>Retry Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && filteredPackages.length === 0 && (
        <View style={styles.centerBox}>
          <MaterialIcons name="beach-access" size={48} color={Colors.outlineVariant} />
          <Text style={styles.emptyTitle}>No Packages Found</Text>
          <Text style={styles.emptySub}>No holiday packages matched your selected filter.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setSelectedDuration('all')}>
            <Text style={styles.retryBtnText}>Show All Packages</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Package Results List */}
      {!isLoading && !errorMsg && filteredPackages.map((pkg) => (
        <View key={pkg.id} style={styles.pkgCard}>
          {/* Featured Image with Duration & Rating Overlay */}
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: pkg.image }}
              style={styles.pkgImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlayTop}>
              <View style={styles.durationBadge}>
                <MaterialIcons name="schedule" size={12} color="#ffffff" />
                <Text style={styles.durationBadgeText}>
                  {pkg.durationDays}D / {pkg.durationNights}N
                </Text>
              </View>
              <View style={styles.ratingBadge}>
                <MaterialIcons name="star" size={13} color="#f59e0b" />
                <Text style={styles.ratingText}>{pkg.rating.toFixed(1)}</Text>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.pkgBody}>
            <View style={styles.titleRow}>
              <Text style={styles.pkgTitle}>{pkg.title}</Text>
            </View>
            <View style={styles.destInfoRow}>
              <MaterialIcons name="place" size={14} color={Colors.primary} />
              <Text style={styles.pkgDest}>{pkg.destination}</Text>
            </View>

            {pkg.overview ? (
              <Text style={styles.pkgOverview} numberOfLines={2}>
                {pkg.overview}
              </Text>
            ) : null}

            {/* Inclusions Pills */}
            <View style={styles.inclusionsRow}>
              {pkg.inclusions.map((inc, idx) => (
                <View key={idx} style={styles.inclusionPill}>
                  <MaterialIcons name="check-circle" size={11} color="#059669" />
                  <Text style={styles.inclusionPillText}>{inc}</Text>
                </View>
              ))}
            </View>

            {/* Footer Row: Price & CTA */}
            <View style={styles.pkgFooter}>
              <View>
                <Text style={styles.priceLabel}>All-Inclusive from</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceValue}>{formatINR(pkg.price)}</Text>
                  <Text style={styles.pricePerPerson}>/ person</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => handleSelect(pkg)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectBtnText}>Select Package</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
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
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  destText: {
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
  pkgCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  imageWrapper: {
    width: '100%',
    height: 160,
    backgroundColor: '#0c1b33',
    position: 'relative',
  },
  pkgImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTop: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(12, 45, 107, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ffffff',
    ...Shadows.sm,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  pkgBody: {
    padding: Spacing.md,
  },
  titleRow: {
    marginBottom: 4,
  },
  pkgTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  destInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  pkgDest: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  pkgOverview: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  inclusionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  inclusionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  inclusionPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#166534',
  },
  pkgFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.secondary,
  },
  pricePerPerson: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
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
