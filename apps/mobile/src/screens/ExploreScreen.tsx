import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName, CategoryMode, DestinationCard } from '../types/travel';

const { width } = Dimensions.get('window');

interface ExploreScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectDestination?: (dest: DestinationCard) => void;
}

const POPULAR_ESCAPES: DestinationCard[] = [
  {
    id: 'tokyo',
    city: 'Tokyo',
    country: 'Japan',
    flightType: 'Nonstop available',
    price: 64890,
    weather: '21°C Mild',
    tag: 'Flash Deal',
    tagType: 'flash',
    image:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'paris',
    city: 'Paris',
    country: 'France',
    flightType: '1 stop available',
    price: 42200,
    weather: '17°C Fresh',
    tag: 'Autumn Foliage',
    tagType: 'seasonal',
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'bali',
    city: 'Bali',
    country: 'Indonesia',
    flightType: 'Tropical Retreat',
    price: 34450,
    weather: '29°C Warm',
    tag: 'Resort Included',
    tagType: 'resort',
    image:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'rome',
    city: 'Rome',
    country: 'Italy',
    flightType: 'Direct routes',
    price: 48500,
    weather: '24°C Sunny',
    tag: 'Culinary Season',
    tagType: 'seasonal',
    image:
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80',
  },
];

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onNavigate,
  onSelectDestination,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryMode>('flights');
  const [originCode, setOriginCode] = useState('SFO');
  const [originCity, setOriginCity] = useState('San Francisco, United States');
  const [destCode, setDestCode] = useState('HND');
  const [destCity, setDestCity] = useState('Tokyo Haneda, Japan');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const swapAnim = useState(new Animated.Value(0))[0];

  const handleSwapRoutes = () => {
    Animated.sequence([
      Animated.timing(swapAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(swapAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();

    const tempCode = originCode;
    const tempCity = originCity;
    setOriginCode(destCode);
    setOriginCity(destCity);
    setDestCode(tempCode);
    setDestCity(tempCity);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const spin = swapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Wanderlust Mode Greeting */}
      <View style={styles.heroSection}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.eyebrow}>Wanderlust Mode</Text>
            <Text style={styles.headline}>Where to next, Alex?</Text>
          </View>
          <View style={styles.ecoBadge}>
            <MaterialIcons name="eco" size={14} color={Colors.tertiary} />
            <Text style={styles.ecoText}>Eco Pilot</Text>
          </View>
        </View>

        {/* Category Mode Pills */}
        <View style={styles.categoryPillsWrapper}>
          <TouchableOpacity
            style={[
              styles.categoryPill,
              activeCategory === 'flights' && styles.categoryPillActive,
            ]}
            onPress={() => setActiveCategory('flights')}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="flight"
              size={16}
              color={activeCategory === 'flights' ? Colors.primary : Colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.categoryText,
                activeCategory === 'flights' && styles.categoryTextActive,
              ]}
            >
              Flights
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryPill,
              activeCategory === 'hotels' && styles.categoryPillActive,
            ]}
            onPress={() => setActiveCategory('hotels')}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="hotel"
              size={16}
              color={activeCategory === 'hotels' ? Colors.primary : Colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.categoryText,
                activeCategory === 'hotels' && styles.categoryTextActive,
              ]}
            >
              Hotels
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryPill,
              activeCategory === 'packages' && styles.categoryPillActive,
            ]}
            onPress={() => setActiveCategory('packages')}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="inventory-2"
              size={16}
              color={activeCategory === 'packages' ? Colors.primary : Colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.categoryText,
                activeCategory === 'packages' && styles.categoryTextActive,
              ]}
            >
              Packages
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Compact Mobile Booking Card */}
      <View style={styles.bookingCard}>
        <View style={styles.routeContainer}>
          {/* Origin */}
          <View style={styles.routeSegment}>
            <View style={styles.routeIconWrapper}>
              <MaterialIcons name="flight-takeoff" size={18} color={Colors.primary} />
            </View>
            <View style={styles.routeInfo}>
              <View style={styles.codeRow}>
                <Text style={styles.routeCode}>{originCode}</Text>
                <Text style={styles.routeLabel}>Origin</Text>
              </View>
              <Text style={styles.routeCity} numberOfLines={1}>
                {originCity}
              </Text>
            </View>
          </View>

          {/* Swap Floating Button */}
          <TouchableOpacity
            style={styles.swapBtn}
            onPress={handleSwapRoutes}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialIcons name="swap-vert" size={20} color={Colors.primary} />
            </Animated.View>
          </TouchableOpacity>

          {/* Destination */}
          <View style={styles.routeSegment}>
            <View style={[styles.routeIconWrapper, styles.destIconWrapper]}>
              <MaterialIcons name="flight-land" size={18} color={Colors.secondary} />
            </View>
            <View style={styles.routeInfo}>
              <View style={styles.codeRow}>
                <Text style={styles.routeCode}>{destCode}</Text>
                <Text style={[styles.routeLabel, { color: Colors.secondary }]}>
                  Destination
                </Text>
              </View>
              <Text style={styles.routeCity} numberOfLines={1}>
                {destCity}
              </Text>
            </View>
          </View>
        </View>

        {/* Date & Travelers Selectors */}
        <View style={styles.selectorsGrid}>
          <TouchableOpacity style={styles.selectorTile} activeOpacity={0.7}>
            <MaterialIcons name="calendar-month" size={18} color={Colors.primary} />
            <View style={styles.selectorMeta}>
              <Text style={styles.selectorLabel}>Dates</Text>
              <Text style={styles.selectorValue}>Oct 14 - 24</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.selectorTile} activeOpacity={0.7}>
            <MaterialIcons name="person" size={18} color={Colors.primary} />
            <View style={styles.selectorMeta}>
              <Text style={styles.selectorLabel}>Travelers</Text>
              <Text style={styles.selectorValue}>1 Adult, Econ</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Primary CTA Button */}
        <TouchableOpacity
          style={styles.findDealsBtn}
          onPress={() => onNavigate(activeCategory === 'hotels' ? 'hotels' : 'flights')}
          activeOpacity={0.85}
        >
          <Text style={styles.findDealsText}>Find Best Deals</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Live Fare Watch Banner */}
      <View style={styles.fareDropCard}>
        <View style={styles.fareLeft}>
          <View style={styles.fareIconBadge}>
            <MaterialIcons name="trending-down" size={20} color={Colors.tertiary} />
          </View>
          <View style={styles.fareDetails}>
            <View style={styles.fareTagRow}>
              <View style={styles.fareDropPill}>
                <Text style={styles.fareDropPillText}>Fare Drop</Text>
              </View>
              <Text style={styles.fareSavings}>Save up to ₹12,500</Text>
            </View>
            <Text style={styles.fareDescription} numberOfLines={1}>
              Tokyo flights at 3-week lowest right now
            </Text>
          </View>
        </View>

        {/* Sparkline Visual */}
        <View style={styles.sparklineContainer}>
          <Svg width={56} height={24} viewBox="0 0 64 28">
            <Path
              d="M2 18L16 14L30 20L44 8L62 3"
              stroke="#007167"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Circle cx={62} cy={3} r={3} fill="#007167" />
          </Svg>
          <Text style={styles.sparklineLabel}>-18% vs avg</Text>
        </View>
      </View>

      {/* Recent Searches */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Inquiries</Text>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={styles.recentClear}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentScroll}
        >
          <TouchableOpacity
            style={styles.recentChip}
            onPress={() => {
              setOriginCode('SFO');
              setDestCode('HND');
              onNavigate('flights');
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="history" size={15} color={Colors.onSurfaceVariant} />
            <Text style={styles.recentRoute}>SFO → HND</Text>
            <Text style={styles.recentDate}>· Oct 14</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recentChip}
            onPress={() => {
              setOriginCode('LAX');
              setDestCode('CDG');
              onNavigate('flights');
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="history" size={15} color={Colors.onSurfaceVariant} />
            <Text style={styles.recentRoute}>LAX → CDG</Text>
            <Text style={styles.recentDate}>· Nov 02</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recentChip}
            onPress={() => {
              setOriginCode('JFK');
              setDestCode('FCO');
              onNavigate('flights');
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="history" size={15} color={Colors.onSurfaceVariant} />
            <Text style={styles.recentRoute}>JFK → FCO</Text>
            <Text style={styles.recentDate}>· Dec 19</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Popular Escapes Carousel */}
      <View style={styles.escapesSection}>
        <View style={styles.escapesHeader}>
          <View>
            <Text style={styles.escapesTitle}>Popular Escapes</Text>
            <Text style={styles.escapesSubtitle}>
              Top curated getaways tailored to your travel style
            </Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('flights')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.escapesScroll}
        >
          {POPULAR_ESCAPES.map((item) => {
            const isFav = !!favorites[item.id];
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.escapeCard}
                onPress={() => {
                  setDestCode(item.city === 'Tokyo' ? 'HND' : item.city.slice(0, 3).toUpperCase());
                  setDestCity(`${item.city}, ${item.country}`);
                  if (onSelectDestination) onSelectDestination(item);
                  onNavigate('flights');
                }}
                activeOpacity={0.9}
              >
                <View style={styles.escapeImgWrapper}>
                  <Image source={{ uri: item.image }} style={styles.escapeImg} />
                  <View style={styles.weatherTag}>
                    <MaterialIcons name="wb-sunny" size={12} color={Colors.secondary} />
                    <Text style={styles.weatherText}>{item.weather}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavorite(item.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={isFav ? 'favorite' : 'favorite-border'}
                      size={16}
                      color={isFav ? Colors.error : Colors.onSurface}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.escapeMeta}>
                  <View style={styles.escapeTopRow}>
                    <View>
                      <Text style={styles.escapeCity}>{item.city}</Text>
                      <Text style={styles.escapeCountry}>
                        {item.country} · {item.flightType}
                      </Text>
                    </View>
                    <View style={styles.escapePriceBlock}>
                      <Text style={styles.fromLabel}>from</Text>
                      <Text style={styles.escapePrice}>{formatINR(item.price)}</Text>
                    </View>
                  </View>

                  <View style={styles.escapeFooter}>
                    <View style={styles.flashBadge}>
                      <MaterialIcons name="bolt" size={13} color={Colors.tertiary} />
                      <Text style={styles.flashText}>{item.tag}</Text>
                    </View>

                    <View style={styles.viewFlightsRow}>
                      <Text style={styles.viewFlightsText}>View flights</Text>
                      <MaterialIcons name="chevron-right" size={14} color={Colors.primary} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Bundle & Save 25% Promo Banner */}
      <TouchableOpacity
        style={styles.promoBanner}
        onPress={() => onNavigate('checkout')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#071a3d', '#0c2d6b', '#143d8a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.promoGradient}
        >
          <View style={styles.promoContent}>
            <View style={styles.promoTagRow}>
              <View style={styles.saveTag}>
                <Text style={styles.saveTagText}>SAVE 25%</Text>
              </View>
              <Text style={styles.promoLimited}>Limited Period</Text>
            </View>
            <Text style={styles.promoTitle}>Bundle Flight + Hotel</Text>
            <Text style={styles.promoDesc} numberOfLines={2}>
              Unlock secret rates and free airport transfer when booked together.
            </Text>
          </View>

          <View style={styles.promoArrowBtn}>
            <MaterialIcons name="arrow-forward" size={20} color={Colors.primary} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Travel Perks */}
      <View style={styles.perksRow}>
        <View style={styles.perkCard}>
          <View style={styles.perkIconWrapper}>
            <MaterialIcons name="verified" size={18} color={Colors.primary} />
          </View>
          <View style={styles.perkTextGroup}>
            <Text style={styles.perkTitle} numberOfLines={1}>
              Price Guarantee
            </Text>
            <Text style={styles.perkSub} numberOfLines={1}>
              We match any fare
            </Text>
          </View>
        </View>

        <View style={styles.perkCard}>
          <View style={[styles.perkIconWrapper, { backgroundColor: Colors.tertiaryFixed }]}>
            <MaterialIcons name="support-agent" size={18} color={Colors.tertiary} />
          </View>
          <View style={styles.perkTextGroup}>
            <Text style={styles.perkTitle} numberOfLines={1}>
              24/7 Concierge
            </Text>
            <Text style={styles.perkSub} numberOfLines={1}>
              Live agent assist
            </Text>
          </View>
        </View>
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
  heroSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    marginTop: 2,
  },
  ecoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  ecoText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  categoryPillsWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.full,
    padding: 3,
    maxWidth: 320,
    ...Shadows.sm,
  },
  categoryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
  },
  categoryPillActive: {
    backgroundColor: Colors.surfaceContainerLowest,
    ...Shadows.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  categoryTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  bookingCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.md,
    position: 'relative',
  },
  routeContainer: {
    position: 'relative',
    gap: Spacing.xs,
  },
  routeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
  },
  routeIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 80, 125, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destIconWrapper: {
    backgroundColor: 'rgba(253, 118, 26, 0.15)',
  },
  routeInfo: {
    flex: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeCode: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  routeCity: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  swapBtn: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    zIndex: 10,
  },
  selectorsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  selectorTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  selectorMeta: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  selectorValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 1,
  },
  findDealsBtn: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.md,
  },
  findDealsText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  fareDropCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  fareLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  fareIconBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 86, 79, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fareDetails: {
    flex: 1,
  },
  fareTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareDropPill: {
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  fareDropPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  fareSavings: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.tertiary,
  },
  fareDescription: {
    fontSize: 11,
    color: Colors.onSurface,
    marginTop: 2,
  },
  sparklineContainer: {
    alignItems: 'flex-end',
  },
  sparklineLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  recentSection: {
    marginTop: Spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  recentTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  recentClear: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  recentScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  recentRoute: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  recentDate: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  escapesSection: {
    marginTop: Spacing.lg,
  },
  escapesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  escapesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  escapesSubtitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  escapesScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  escapeCard: {
    width: 250,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  escapeImgWrapper: {
    height: 135,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  escapeImg: {
    width: '100%',
    height: '100%',
  },
  weatherTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  weatherText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  escapeMeta: {
    padding: Spacing.sm + 4,
  },
  escapeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  escapeCity: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  escapeCountry: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  escapePriceBlock: {
    alignItems: 'flex-end',
  },
  fromLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  escapePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  escapeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  flashText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.tertiary,
  },
  viewFlightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewFlightsText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  promoBanner: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  promoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  promoContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  promoTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveTag: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  saveTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  promoLimited: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryFixed,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  promoDesc: {
    fontSize: 11,
    color: Colors.primaryFixedDim,
    marginTop: 2,
    lineHeight: 16,
  },
  promoArrowBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  perksRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  perkCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  perkIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  perkTextGroup: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  perkSub: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
});
