import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useWishlist, MobileWishlistItem } from '../context/WishlistContext';
import { Colors, Shadows, formatINR } from '../theme/theme';
import { TripBookingState, ScreenName, HotelOption, FlightOption } from '../types/travel';

const { height } = Dimensions.get('window');

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiateBooking?: (booking: TripBookingState) => void;
  onNavigate?: (screen: ScreenName) => void;
  onSelectHotel?: (hotel: HotelOption) => void;
  onSelectFlight?: (flight: FlightOption) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  onInitiateBooking,
  onNavigate,
  onSelectHotel,
  onSelectFlight,
}) => {
  const { wishlist, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();

  const handleOpenItem = (item: MobileWishlistItem) => {
    onClose();

    if (item.category === 'HOTEL' || item.category === 'VILLA') {
      if (onSelectHotel) {
        onSelectHotel({
          id: item.id,
          name: item.title,
          stars: 5,
          ratingScore: item.rating || 4.8,
          ratingLabel: 'Exceptional',
          reviewCount: 340,
          neighborhood: item.location.split('·')[0].trim(),
          distance: item.location.includes('·') ? item.location.split('·')[1].trim() : 'Prime City Location',
          pricePerNight: item.price,
          totalPrice: item.price * 2,
          cancellationText: 'Free cancellation up to 24 hrs before check-in',
          breakfastIncluded: true,
          image: item.image,
          tags: ['LUXE STAY', 'VERIFIED AMENITIES', 'SWIMMING POOL'],
          lat: 15.525,
          lng: 73.766,
        });
      }
      if (onNavigate) {
        onNavigate('hotels');
      }
      return;
    }

    if (item.category === 'FLIGHT') {
      if (onSelectFlight) {
        onSelectFlight({
          id: item.id,
          airline: item.title.includes('Flight') ? item.title : `${item.title} Air`,
          flightCode: 'SSJ-340',
          aircraft: 'Airbus A321neo',
          originCode: 'DEL',
          originTerminal: 'Terminal 3',
          departureTime: '08:30 AM',
          destCode: 'GOI',
          destTerminal: 'Terminal 1',
          arrivalTime: '11:00 AM',
          duration: '2h 30m',
          isNextDay: false,
          stopsText: 'Non-stop',
          isDirect: true,
          price: item.price,
          perks: ['Free carry-on', 'Snack box', 'USB power'],
        });
      }
      if (onNavigate) {
        onNavigate('flights');
      }
      return;
    }

    // Default to initiating booking for packages, buses, trains, cabs
    handleBookItem(item);
  };

  const handleBookItem = (item: MobileWishlistItem) => {
    onClose();
    if (onInitiateBooking) {
      let serviceType: TripBookingState['serviceType'] = 'HOTEL';
      if (item.category === 'FLIGHT') serviceType = 'FLIGHT';
      else if (item.category === 'PACKAGE') serviceType = 'PACKAGE';
      else if (item.category === 'VILLA') serviceType = 'VILLA';
      else if (item.category === 'TOUR') serviceType = 'TOUR';
      else if (item.category === 'TRAIN') serviceType = 'TRAIN';
      else if (item.category === 'CAB') serviceType = 'CAB';
      else if (item.category === 'BUS') serviceType = 'BUS';

      onInitiateBooking({
        serviceType,
        originCode: 'DEL',
        originCity: 'New Delhi, India',
        destCode: 'GOI',
        destCity: item.location,
        datesText: 'Nov 04 - Nov 08, 2026',
        travelersText: '2 Guests, Deluxe',
        seat: '12B',
        hasInsurance: true,
        travelerName: '',
        dob: '',
        passportNumber: '',
        frequentFlyer: '',
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.heartCircle}>
                <MaterialIcons name="favorite" size={18} color="#e11d48" />
              </View>
              <View>
                <View style={styles.titleWithBadge}>
                  <Text style={styles.headerTitle}>My Wishlist &amp; Liked</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{wishlistCount}</Text>
                  </View>
                </View>
                <Text style={styles.headerSubtitle}>Saved stays, villas &amp; holiday escapes</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={20} color="#707785" />
            </TouchableOpacity>
          </View>

          {/* List Content */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {wishlist.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <MaterialIcons name="favorite-border" size={36} color="#fda4af" />
                </View>
                <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
                <Text style={styles.emptySub}>
                  Tap the heart icon on any hotel, villa, or package to save your favorite stays here.
                </Text>
                <TouchableOpacity
                  style={styles.exploreBtn}
                  onPress={() => {
                    onClose();
                    if (onNavigate) onNavigate('explore');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exploreBtnText}>Explore Travel Deals</Text>
                </TouchableOpacity>
              </View>
            ) : (
              wishlist.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => handleOpenItem(item)}
                  activeOpacity={0.88}
                >
                  <Image source={{ uri: item.image }} style={styles.cardImage} />
                  
                  {item.badge && (
                    <View style={styles.cardBadge}>
                      <Text style={styles.cardBadgeText}>{item.badge}</Text>
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <View style={styles.cardCategoryRow}>
                      <Text style={styles.cardCategory}>{item.category}</Text>
                      {item.rating && (
                        <View style={styles.ratingBadge}>
                          <MaterialIcons name="star" size={12} color="#f59e0b" />
                          <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>

                    <View style={styles.locationRow}>
                      <MaterialIcons name="location-on" size={12} color="#707785" />
                      <Text style={styles.cardLocation} numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>

                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.priceLabel}>Starting from</Text>
                        <Text style={styles.priceValue}>{formatINR(item.price)}</Text>
                      </View>

                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            removeFromWishlist(item.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="delete-outline" size={18} color="#94a3b8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.bookBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenItem(item);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.bookBtnText}>
                            {item.category === 'HOTEL' || item.category === 'VILLA'
                              ? 'Open Hotel'
                              : item.category === 'FLIGHT'
                              ? 'Open Flight'
                              : 'Open & Book'}
                          </Text>
                          <MaterialIcons name="arrow-forward" size={13} color="#ffffff" style={{ marginLeft: 3 }} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Bottom Bar */}
          {wishlist.length > 0 && (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                onPress={clearWishlist}
                activeOpacity={0.7}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
              <Text style={styles.totalItemsText}>
                {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    minHeight: 380,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heartCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  countBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardImage: {
    width: 100,
    height: '100%',
    minHeight: 110,
    backgroundColor: '#cbd5e1',
  },
  cardBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  cardCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCategory: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0284c7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  cardLocation: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  priceLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtn: {
    backgroundColor: '#008cff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    ...Shadows.sm,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e11d48',
  },
  totalItemsText: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  exploreBtn: {
    backgroundColor: '#008cff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    ...Shadows.sm,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
