import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  DimensionValue,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName, HotelOption } from '../types/travel';
import { fetchHotelsApi } from '../services/api';

const { width } = Dimensions.get('window');

interface HotelListingsScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectHotel: (hotel: HotelOption) => void;
}

const HOTELS_DATA: HotelOption[] = [
  {
    id: 'park-hyatt',
    name: 'Park Hyatt Tokyo',
    stars: 5,
    ratingScore: 9.4,
    ratingLabel: 'Exceptional',
    reviewCount: 1420,
    neighborhood: 'Shinjuku',
    distance: '1.2 km to Central Station',
    pricePerNight: 28500,
    totalPrice: 199500,
    cancellationText: 'Free cancellation until Oct 12',
    breakfastIncluded: true,
    image:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=700&auto=format&fit=crop&q=80',
    tags: ['Free High-speed Wi-Fi', 'Indoor Sky Pool', 'Club Spa'],
    lat: 35.6852,
    lng: 139.691,
  },
  {
    id: 'gracery-shinjuku',
    name: 'Hotel Gracery Shinjuku',
    stars: 4,
    ratingScore: 8.9,
    ratingLabel: 'Excellent',
    reviewCount: 2150,
    neighborhood: 'Kabukicho, Shinjuku',
    distance: '500m to Station',
    pricePerNight: 14900,
    totalPrice: 104300,
    cancellationText: 'Free cancellation until Oct 13',
    breakfastIncluded: true,
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700&auto=format&fit=crop&q=80',
    tags: ['Godzilla Terrace', 'Japanese Breakfast', 'Free Wi-Fi'],
    lat: 35.6953,
    lng: 139.702,
  },
  {
    id: 'aman-tokyo',
    name: 'Aman Tokyo',
    stars: 5,
    ratingScore: 9.8,
    ratingLabel: 'Flawless',
    reviewCount: 890,
    neighborhood: 'Otemachi',
    distance: '200m to Station',
    pricePerNight: 68000,
    totalPrice: 476000,
    cancellationText: 'Flexible cancellation',
    breakfastIncluded: true,
    image:
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=700&auto=format&fit=crop&q=80',
    tags: ['Traditional Onsen', 'Panoramic Fuji View', 'Michelin Dining'],
    lat: 35.6881,
    lng: 139.764,
  },
  {
    id: 'cerulean-tower',
    name: 'Cerulean Tower Tokyu Hotel',
    stars: 5,
    ratingScore: 9.1,
    ratingLabel: 'Exceptional',
    reviewCount: 1780,
    neighborhood: 'Shibuya',
    distance: '300m to Shibuya Crossing',
    pricePerNight: 21500,
    totalPrice: 150500,
    cancellationText: 'Free cancellation until Oct 14',
    breakfastIncluded: false,
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&auto=format&fit=crop&q=80',
    tags: ['Shibuya Skyline Bar', 'Fitness Center', 'High-speed Wi-Fi'],
    lat: 35.6565,
    lng: 139.699,
  },
];

export const HotelListingsScreen: React.FC<HotelListingsScreenProps> = ({
  onNavigate,
  onSelectHotel,
}) => {
  const [hotels, setHotels] = useState<HotelOption[]>(HOTELS_DATA);
  const [isMapView, setIsMapView] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('free-cancel');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedMapHotel, setSelectedMapHotel] = useState<HotelOption>(HOTELS_DATA[0]);

  useEffect(() => {
    fetchHotelsApi(HOTELS_DATA).then((data) => {
      if (data && data.length > 0) {
        setHotels(data);
        setSelectedMapHotel(data[0]);
      }
    });
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBook = (hotel: HotelOption) => {
    onSelectHotel(hotel);
    onNavigate('checkout');
  };

  return (
    <View style={styles.container}>
      {/* Sticky Top Capsule & Map Toggle */}
      <View style={styles.stickyFilterBar}>
        <View style={styles.searchCapsuleRow}>
          <TouchableOpacity
            style={styles.searchCapsule}
            onPress={() => onNavigate('explore')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="location-on" size={18} color={Colors.primary} />
            <View style={styles.capsuleTextCol}>
              <Text style={styles.capsuleCity}>Tokyo, Japan</Text>
              <Text style={styles.capsuleMeta}>Oct 15–22 · 2 Guests</Text>
            </View>
            <MaterialIcons name="tune" size={16} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapToggleBtn, isMapView && styles.mapToggleBtnActive]}
            onPress={() => setIsMapView(!isMapView)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={isMapView ? 'view-list' : 'map'}
              size={16}
              color="#ffffff"
            />
            <Text style={styles.mapToggleText}>{isMapView ? 'List' : 'Map'}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'free-cancel' && styles.filterPillActive,
            ]}
            onPress={() =>
              setActiveFilter(activeFilter === 'free-cancel' ? '' : 'free-cancel')
            }
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'free-cancel' && styles.filterPillTextActive,
              ]}
            >
              Free Cancellation
            </Text>
            {activeFilter === 'free-cancel' && (
              <MaterialIcons name="close" size={14} color="#ffffff" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'stars' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'stars' ? '' : 'stars')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="star" size={13} color={Colors.secondary} />
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'stars' && styles.filterPillTextActive,
              ]}
            >
              4★ & 5★
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'breakfast' && styles.filterPillActive,
            ]}
            onPress={() =>
              setActiveFilter(activeFilter === 'breakfast' ? '' : 'breakfast')
            }
            activeOpacity={0.7}
          >
            <MaterialIcons name="restaurant" size={13} color={Colors.tertiary} />
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'breakfast' && styles.filterPillTextActive,
              ]}
            >
              Breakfast Included
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
            <Text style={styles.filterPillText}>Shinjuku / Shibuya</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
            <Text style={styles.filterPillText}>Under ₹20,000/night</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content: List View or Map View */}
      {!isMapView ? (
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollListContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Results Count & Sort Header */}
          <View style={styles.resultsHeader}>
            <View style={styles.resultsCountRow}>
              <Text style={styles.resultsCountBold}>328 Stays</Text>
              <Text style={styles.resultsCountCity}>in Tokyo</Text>
            </View>
            <TouchableOpacity style={styles.sortBtn} activeOpacity={0.7}>
              <MaterialIcons name="swap-vert" size={16} color={Colors.primary} />
              <Text style={styles.sortBtnText}>Recommended</Text>
            </TouchableOpacity>
          </View>

          {/* Hotel Cards Feed */}
          {hotels.map((hotel) => {
            const isFav = !!favorites[hotel.id];
            return (
              <View key={hotel.id} style={styles.hotelCard}>
                {/* Image Aspect ratio container */}
                <View style={styles.hotelImgContainer}>
                  <Image source={{ uri: hotel.image }} style={styles.hotelImg} />

                  {/* Gradient Scrim */}
                  <View style={styles.imgGradientScrim} />

                  {/* Top Status Tags */}
                  <View style={styles.statusTagGroup}>
                    <View style={styles.luxuryTag}>
                      <MaterialIcons name="star" size={12} color={Colors.secondary} />
                      <Text style={styles.luxuryTagText}>{hotel.stars}★ Luxury</Text>
                    </View>
                    {hotel.breakfastIncluded && (
                      <View style={styles.breakfastTag}>
                        <Text style={styles.breakfastTagText}>Breakfast Included</Text>
                      </View>
                    )}
                  </View>

                  {/* Wishlist Heart Button */}
                  <TouchableOpacity
                    style={styles.wishlistBtn}
                    onPress={() => toggleFavorite(hotel.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={isFav ? 'favorite' : 'favorite-border'}
                      size={18}
                      color={isFav ? Colors.error : Colors.onSurface}
                    />
                  </TouchableOpacity>

                  {/* Carousel Page Dots */}
                  <View style={styles.carouselDots}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                </View>

                {/* Hotel Details Content */}
                <View style={styles.cardDetails}>
                  <View style={styles.titleRatingRow}>
                    <View style={styles.titleCol}>
                      <Text style={styles.hotelName} numberOfLines={1}>
                        {hotel.name}
                      </Text>
                      <View style={styles.locationRow}>
                        <MaterialIcons name="near-me" size={13} color={Colors.primary} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {hotel.neighborhood} · {hotel.distance}
                        </Text>
                      </View>
                    </View>

                    {/* Rating Badge */}
                    <View style={styles.ratingCol}>
                      <View style={styles.ratingScoreRow}>
                        <Text style={styles.ratingLabelText}>{hotel.ratingLabel}</Text>
                        <View style={styles.scoreBadge}>
                          <Text style={styles.scoreText}>{hotel.ratingScore}</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewCountText}>
                        {hotel.reviewCount} reviews
                      </Text>
                    </View>
                  </View>

                  {/* Amenity Micro Tags */}
                  <View style={styles.amenitiesRow}>
                    {hotel.tags.map((tag, idx) => (
                      <View key={idx} style={styles.amenityChip}>
                        <MaterialIcons
                          name={
                            idx === 0 ? 'wifi' : idx === 1 ? 'pool' : 'spa'
                          }
                          size={12}
                          color={Colors.onSurfaceVariant}
                        />
                        <Text style={styles.amenityText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Cancellation Pill */}
                  <View style={styles.cancellationRow}>
                    <MaterialIcons name="check-circle" size={14} color={Colors.tertiary} />
                    <Text style={styles.cancellationText}>{hotel.cancellationText}</Text>
                  </View>

                  {/* Price & Book CTA */}
                  <View style={styles.priceActionRow}>
                    <View>
                      <View style={styles.nightPriceRow}>
                        <Text style={styles.nightPrice}>{formatINR(hotel.pricePerNight)}</Text>
                        <Text style={styles.nightLabel}>/ night</Text>
                      </View>
                      <Text style={styles.totalPriceNote}>
                        {formatINR(hotel.totalPrice)} total (7 nights, incl. taxes)
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.viewRoomsBtn}
                      onPress={() => handleBook(hotel)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewRoomsText}>View Rooms</Text>
                      <MaterialIcons name="arrow-forward" size={15} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        /* Interactive Map Preview Mode */
        <View style={styles.mapContainer}>
          {/* Stylized Simulated Map Visual */}
          <View style={styles.mapCanvas}>
            <View style={styles.mapRoad1} />
            <View style={styles.mapRoad2} />
            <View style={styles.mapParkArea} />
            <View style={styles.mapRiverArea} />

            {/* Hotel Pins on Map */}
            {hotels.map((h, i) => {
              const isSelected = selectedMapHotel.id === h.id;
              const positions: Array<{ top: DimensionValue; left: DimensionValue }> = [
                { top: '28%', left: '32%' },
                { top: '44%', left: '55%' },
                { top: '35%', left: '72%' },
                { top: '60%', left: '38%' },
              ];
              const pos = positions[i % positions.length];

              return (
                <TouchableOpacity
                  key={h.id}
                  style={[
                    styles.mapPin,
                    pos,
                    isSelected && styles.mapPinSelected,
                  ]}
                  onPress={() => setSelectedMapHotel(h)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.mapPinPrice,
                      isSelected && styles.mapPinPriceSelected,
                    ]}
                  >
                    {formatINR(h.pricePerNight)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Docked Hotel Card Preview at bottom of Map */}
          <View style={styles.mapFloatingCard}>
            <View style={styles.mapCardRow}>
              <Image
                source={{ uri: selectedMapHotel.image }}
                style={styles.mapCardThumbnail}
              />
              <View style={styles.mapCardMeta}>
                <View style={styles.mapCardRatingRow}>
                  <Text style={styles.mapCardTitle} numberOfLines={1}>
                    {selectedMapHotel.name}
                  </Text>
                  <View style={styles.mapScorePill}>
                    <Text style={styles.mapScoreText}>{selectedMapHotel.ratingScore}</Text>
                  </View>
                </View>
                <Text style={styles.mapCardSub}>
                  {selectedMapHotel.neighborhood} · {selectedMapHotel.distance}
                </Text>
                <View style={styles.mapCardPriceRow}>
                  <Text style={styles.mapCardNight}>
                    {formatINR(selectedMapHotel.pricePerNight)}{' '}
                    <Text style={{ fontSize: 11, fontWeight: 'normal', color: Colors.onSurfaceVariant }}>
                      /night
                    </Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.mapCardBookBtn}
                    onPress={() => handleBook(selectedMapHotel)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.mapCardBookText}>Select Room</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  stickyFilterBar: {
    backgroundColor: 'rgba(250, 248, 255, 0.96)',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 80, 125, 0.08)',
    ...Shadows.sm,
  },
  searchCapsuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  capsuleTextCol: {
    flex: 1,
  },
  capsuleCity: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  capsuleMeta: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  mapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  mapToggleBtnActive: {
    backgroundColor: Colors.tertiary,
  },
  mapToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  filterPillsScroll: {
    paddingVertical: Spacing.xs + 2,
    gap: Spacing.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryContainer,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollList: {
    flex: 1,
  },
  scrollListContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: Spacing.sm,
  },
  resultsCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  resultsCountBold: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  resultsCountCity: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  hotelCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  hotelImgContainer: {
    width: '100%',
    height: 190,
    backgroundColor: Colors.surfaceContainerHigh,
    position: 'relative',
  },
  hotelImg: {
    width: '100%',
    height: '100%',
  },
  imgGradientScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  statusTagGroup: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  luxuryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  luxuryTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  breakfastTag: {
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  breakfastTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onTertiaryFixed,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: '#ffffff',
  },
  cardDetails: {
    padding: Spacing.md,
  },
  titleRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  locationText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  ratingCol: {
    alignItems: 'flex-end',
  },
  ratingScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  scoreBadge: {
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  reviewCountText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  amenityText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  cancellationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs + 2,
  },
  cancellationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.tertiary,
  },
  priceActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerLow,
  },
  nightPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  nightPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.onSurface,
  },
  nightLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  totalPriceNote: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  viewRoomsBtn: {
    backgroundColor: Colors.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  viewRoomsText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#e6ebef',
    position: 'relative',
  },
  mapRoad1: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: '#ffffff',
  },
  mapRoad2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 20,
    backgroundColor: '#ffffff',
  },
  mapParkArea: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: 140,
    height: 100,
    backgroundColor: '#d8ead8',
    borderRadius: 16,
  },
  mapRiverArea: {
    position: 'absolute',
    bottom: '25%',
    right: 0,
    width: 180,
    height: 60,
    backgroundColor: '#cde4f7',
    borderTopLeftRadius: 30,
  },
  mapPin: {
    position: 'absolute',
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
    ...Shadows.md,
  },
  mapPinSelected: {
    backgroundColor: Colors.primaryContainer,
    borderColor: '#ffffff',
  },
  mapPinPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  mapPinPriceSelected: {
    color: '#ffffff',
  },
  mapFloatingCard: {
    position: 'absolute',
    bottom: 20,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm + 2,
    ...Shadows.lg,
  },
  mapCardRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mapCardThumbnail: {
    width: 85,
    height: 85,
    borderRadius: BorderRadius.lg,
  },
  mapCardMeta: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mapCardRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onSurface,
    flex: 1,
  },
  mapScorePill: {
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mapScoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  mapCardSub: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  mapCardPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  mapCardNight: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  mapCardBookBtn: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  mapCardBookText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
