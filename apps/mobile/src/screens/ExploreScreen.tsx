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
  ImageBackground,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName, CategoryMode, TripBookingState } from '../types/travel';
import { useWishlist } from '../context/WishlistContext';
import {
  fetchTrainsApi,
  fetchBusesApi,
  fetchCabsApi,
  fetchPackagesApi,
} from '../services/api';
import { CalendarModal } from '../components/CalendarModal';

const { width } = Dimensions.get('window');

interface ExploreScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onInitiateBooking?: (booking: TripBookingState) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onNavigate,
  onInitiateBooking,
}) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [activeCategory, setActiveCategory] = useState<CategoryMode>('flights');
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'multicity'>('oneway');
  const [originCode, setOriginCode] = useState('DEL');
  const [originCity, setOriginCity] = useState('Delhi');
  const [destCode, setDestCode] = useState('GOI');
  const [destCity, setDestCity] = useState('Goa');
  const [departureDate, setDepartureDate] = useState('15 Oct 2026');
  const [departureDay, setDepartureDay] = useState('Wed');
  const [returnDate, setReturnDate] = useState('22 Oct 2026');
  const [returnDay, setReturnDay] = useState('Wed');
  const [travellersText, setTravellersText] = useState('2 Adults, 1 Child');
  const [travelClass, setTravelClass] = useState('Economy');
  const [specialFare, setSpecialFare] = useState('regular');
  const [offersTab, setOffersTab] = useState<'all' | 'flights' | 'hotels' | 'holidays' | 'trains'>('all');

  const [calendarModalState, setCalendarModalState] = useState<{
    visible: boolean;
    type: 'departure' | 'return';
    title: string;
    initialDate: string;
    minDate?: string;
  } | null>(null);

  const handleMobileDateSelected = (formattedDate: string, dayOfWeek: string, _isoDate: string) => {
    if (!calendarModalState) return;
    if (calendarModalState.type === 'departure') {
      setDepartureDate(formattedDate);
      setDepartureDay(dayOfWeek);
    } else {
      setReturnDate(formattedDate);
      setReturnDay(dayOfWeek);
      setTripType('roundtrip');
    }
    setCalendarModalState(null);
  };

  const swapAnim = useState(new Animated.Value(0))[0];

  const handleSwapRoutes = () => {
    Animated.sequence([
      Animated.timing(swapAnim, {
        toValue: 1,
        duration: 220,
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

  const handleSearchPress = async () => {
    if (activeCategory === 'hotels') {
      onNavigate('hotels');
      return;
    }
    if (activeCategory === 'flights') {
      onNavigate('flights');
      return;
    }

    try {
      if (activeCategory === 'trains') {
        const trains = await fetchTrainsApi();
        if (trains && trains.length > 0) {
          const t = trains[0];
          if (onInitiateBooking) {
            onInitiateBooking({
              serviceType: 'TRAIN',
              originCode: t.fromStationCode,
              originCity: t.fromStationName,
              destCode: t.toStationCode,
              destCity: t.toStationName,
              datesText: 'Oct 24 - Oct 31, 2026',
              travelersText: '1 Traveler, Executive Class',
              seat: 'B4-21',
              hasInsurance: true,
              travelerName: 'Alexander Vanderbilt',
              dob: '10/14/1988',
              passportNumber: 'A94821038',
              frequentFlyer: 'IRCTC-PREMIUM',
              selectedTrain: t,
            });
          }
          onNavigate('checkout');
          return;
        } else {
          Alert.alert('No Trains Available', 'No live train inventory found at this time.');
          return;
        }
      }

      if (activeCategory === 'buses') {
        const buses = await fetchBusesApi();
        if (buses && buses.length > 0) {
          const b = buses[0];
          if (onInitiateBooking) {
            onInitiateBooking({
              serviceType: 'BUS',
              originCode: 'DEL',
              originCity: b.fromCity,
              destCode: 'BOM',
              destCity: b.toCity,
              datesText: 'Oct 24 - Oct 31, 2026',
              travelersText: '1 Traveler, Sleeper',
              seat: 'L4',
              hasInsurance: true,
              travelerName: 'Alexander Vanderbilt',
              dob: '10/14/1988',
              passportNumber: 'A94821038',
              frequentFlyer: 'SSJ-BUS',
              selectedBus: b,
            });
          }
          onNavigate('checkout');
          return;
        } else {
          Alert.alert('No Buses Available', 'No live bus inventory found at this time.');
          return;
        }
      }

      if (activeCategory === 'cabs') {
        const cabs = await fetchCabsApi();
        if (cabs && cabs.length > 0) {
          const c = cabs[0];
          if (onInitiateBooking) {
            onInitiateBooking({
              serviceType: 'CAB',
              originCode: 'DEL',
              originCity: c.pickupArea,
              destCode: 'BOM',
              destCity: c.dropArea,
              datesText: 'Immediate Pickup',
              travelersText: `${c.capacity} Passengers Max`,
              seat: 'Standard',
              hasInsurance: false,
              travelerName: 'Alexander Vanderbilt',
              dob: '10/14/1988',
              passportNumber: 'A94821038',
              frequentFlyer: 'CAB-PRIME',
              selectedCab: c,
            });
          }
          onNavigate('checkout');
          return;
        } else {
          Alert.alert('No Cabs Available', 'No live cabs found in this service area.');
          return;
        }
      }

      if (activeCategory === 'packages') {
        const pkgs = await fetchPackagesApi();
        if (pkgs && pkgs.length > 0) {
          const p = pkgs[0];
          if (onInitiateBooking) {
            onInitiateBooking({
              serviceType: 'PACKAGE',
              originCode: 'DEL',
              originCity: 'New Delhi',
              destCode: 'GOA',
              destCity: p.destination,
              datesText: `${p.durationDays} Days / ${p.durationNights} Nights`,
              travelersText: '2 Travelers, All-Inclusive',
              seat: 'Standard',
              hasInsurance: true,
              travelerName: 'Alexander Vanderbilt',
              dob: '10/14/1988',
              passportNumber: 'A94821038',
              frequentFlyer: 'SSJ-HOLIDAY',
              selectedPackage: p,
            });
          }
          onNavigate('checkout');
          return;
        } else {
          Alert.alert('No Packages Available', 'No live holiday packages found matching this request.');
          return;
        }
      }

      // Default or other services: navigate to flights
      onNavigate('flights');
    } catch (err: any) {
      Alert.alert('Search Failed', err.message || 'Unable to connect to live inventory.');
    }
  };

  const handleBookItem = (
    serviceType: 'FLIGHT' | 'HOTEL' | 'BUS' | 'PACKAGE' | 'TRAIN' | 'CAB' | 'VILLA' | 'TOUR' | 'VISA' | 'INSURANCE',
    title: string,
    price: number
  ) => {
    const booking: TripBookingState = {
      serviceType,
      originCode,
      originCity,
      destCode,
      destCity,
      datesText: tripType === 'roundtrip' ? `${departureDate} - ${returnDate}` : `${departureDate}`,
      travelersText: `${travellersText}, ${travelClass}`,
      seat: '12B',
      hasInsurance: true,
      travelerName: 'Alexander Vanderbilt',
      dob: '10/14/1988',
      passportNumber: 'A94821038',
      frequentFlyer: 'SSJ-ELITE',
      selectedFlight: serviceType === 'FLIGHT' ? {
        id: 'flight-del-bom',
        airline: 'IndiGo Airlines',
        flightCode: '6E-2041',
        aircraft: 'Airbus A321neo',
        originCode,
        originTerminal: 'Terminal 3',
        departureTime: '08:00 AM',
        destCode,
        destTerminal: 'Terminal 2',
        arrivalTime: '10:15 AM',
        duration: '2h 15m',
        isNextDay: false,
        stopsText: 'Non-stop',
        isDirect: true,
        price,
        perks: ['Free carry-on', 'Snack box', 'USB power'],
      } : undefined,
    };

    if (onInitiateBooking) {
      onInitiateBooking(booking);
    } else {
      onNavigate('checkout');
    }
  };

  const spin = swapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#fbf9f8' }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      {/* ── SEARCH TAP CAPSULE (Just below header) ── */}
      <View style={styles.topSearchTapWrapper}>
        <TouchableOpacity
          style={styles.topSearchTapBar}
          onPress={handleSearchPress}
          activeOpacity={0.85}
        >
          <View style={styles.topSearchIconCircle}>
            <MaterialIcons name="search" size={20} color="#ffffff" />
          </View>
          <View style={styles.topSearchTextCol}>
            <Text style={styles.topSearchTitle} numberOfLines={1}>
              {activeCategory === 'hotels'
                ? 'Where to stay? Search luxury hotels'
                : activeCategory === 'flights'
                ? 'Where to fly? Search verified flights'
                : activeCategory === 'trains'
                ? 'Search Vande Bharat & Express Trains'
                : activeCategory === 'buses'
                ? 'Search Volvo AC & Sleeper Buses'
                : activeCategory === 'cabs'
                ? 'Book Prime Airport & City Cabs'
                : activeCategory === 'packages'
                ? 'Explore Holiday Packages & Getaways'
                : 'Where to? Search flights, hotels & stays'}
            </Text>
            <Text style={styles.topSearchSubtitle} numberOfLines={1}>
              {originCity} ➔ {destCity} · {departureDate} · Tap to Search
            </Text>
          </View>
          <View style={styles.topSearchActionBadge}>
            <MaterialIcons name="arrow-forward" size={16} color="#005cab" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── 1. CATEGORY NAV PILLS CAROUSEL ── */}
      <View style={styles.categoryCarouselWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryCarousel}
        >
          {([
            { id: 'flights' as const, label: 'Flights', icon: 'flight-takeoff' as const },
            { id: 'hotels' as const, label: 'Hotels', icon: 'hotel' as const },
            { id: 'villas' as const, label: 'Villas & Homestays', icon: 'holiday-village' as const },
            { id: 'packages' as const, label: 'Holiday Packages', icon: 'beach-access' as const, badge: '-25%' },
            { id: 'trains' as const, label: 'Trains', icon: 'train' as const },
            { id: 'buses' as const, label: 'Buses', icon: 'directions-bus' as const },
            { id: 'cabs' as const, label: 'Cabs', icon: 'local-taxi' as const },
            { id: 'tours' as const, label: 'Tours & Attractions', icon: 'attractions' as const },
            { id: 'visa' as const, label: 'Visa', icon: 'card-membership' as const },
            { id: 'insurance' as const, label: 'Travel Insurance', icon: 'security' as const },
          ]).map((item) => {
            const isActive = activeCategory === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                ]}
                onPress={() => setActiveCategory(item.id)}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name={item.icon}
                  size={18}
                  color={isActive ? '#ffffff' : '#005cab'}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                {item.badge && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 3. SEARCH ENGINE CONSOLE WIDGET CARD (Exact Pixel-Perfect Screenshot Replica) ── */}
      <View style={styles.searchCard}>
        {/* Top Row: Trip Mode Radio Buttons */}
        <View style={styles.radioRow}>
          {([
            { id: 'oneway' as const, label: 'One way' },
            { id: 'roundtrip' as const, label: 'Round trip' },
            { id: 'multicity' as const, label: 'Multi-city' },
          ]).map((tab) => {
            const isSelected = tripType === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.radioOption}
                onPress={() => setTripType(tab.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioCircleDot} />}
                </View>
                <Text style={[styles.radioOptionText, isSelected && styles.radioOptionTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Row 2: FROM & TO Segment with Centered Swap Icon */}
        <View style={styles.routeRowWrapper}>
          {/* FROM tile */}
          <TouchableOpacity
            style={styles.routeTile}
            onPress={() => {
              if (originCode === 'DEL') {
                setOriginCode('BOM');
                setOriginCity('Mumbai');
              } else {
                setOriginCode('DEL');
                setOriginCity('Delhi');
              }
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="flight-takeoff" size={24} color="#0066FF" style={styles.tileIcon} />
            <View style={styles.tileCol}>
              <Text style={styles.tileLabel}>From</Text>
              <Text style={styles.tileMainText} numberOfLines={1}>{originCity}</Text>
              <Text style={styles.tileSubText}>{originCode}</Text>
            </View>
          </TouchableOpacity>

          {/* Center Swap Button */}
          <TouchableOpacity
            style={styles.centerSwapFab}
            onPress={handleSwapRoutes}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialIcons name="sync-alt" size={18} color="#0F172A" />
            </Animated.View>
          </TouchableOpacity>

          {/* TO tile */}
          <TouchableOpacity
            style={styles.routeTile}
            onPress={() => {
              if (destCode === 'GOI') {
                setDestCode('BLR');
                setDestCity('Bengaluru');
              } else {
                setDestCode('GOI');
                setDestCity('Goa');
              }
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="flight-land" size={24} color="#0066FF" style={styles.tileIcon} />
            <View style={styles.tileCol}>
              <Text style={styles.tileLabel}>To</Text>
              <Text style={styles.tileMainText} numberOfLines={1}>{destCity}</Text>
              <Text style={styles.tileSubText}>{destCode}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Row 3: Departure & Return Grid */}
        <View style={styles.datesRow}>
          {/* Departure tile */}
          <TouchableOpacity
            style={styles.dateTile}
            onPress={() => setCalendarModalState({
              visible: true,
              type: 'departure',
              title: 'Select Departure Date',
              initialDate: departureDate,
            })}
            activeOpacity={0.8}
          >
            <MaterialIcons name="calendar-today" size={22} color="#0066FF" style={styles.tileIcon} />
            <View style={styles.tileCol}>
              <Text style={styles.tileLabel}>Departure</Text>
              <Text style={styles.tileDateMainText}>{departureDate}</Text>
              <Text style={styles.tileSubText}>{departureDay}</Text>
            </View>
          </TouchableOpacity>

          {/* Return tile */}
          <TouchableOpacity
            style={[styles.dateTile, tripType === 'oneway' && styles.dateTileDimmed]}
            onPress={() => {
              if (tripType === 'oneway') {
                setTripType('roundtrip');
              }
              setCalendarModalState({
                visible: true,
                type: 'return',
                title: 'Select Return Date',
                initialDate: returnDate,
                minDate: departureDate,
              });
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="calendar-today" size={22} color="#0066FF" style={styles.tileIcon} />
            <View style={styles.tileCol}>
              <Text style={styles.tileLabel}>Return</Text>
              <Text style={styles.tileDateMainText}>{returnDate}</Text>
              <Text style={styles.tileSubText}>{returnDay}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Row 4: Travellers & Class Full Width Box */}
        <TouchableOpacity
          style={styles.travellersTile}
          onPress={() => {
            if (travellersText === '2 Adults, 1 Child') {
              setTravellersText('1 Adult');
              setTravelClass('Economy');
            } else if (travellersText === '1 Adult') {
              setTravellersText('2 Adults');
              setTravelClass('Premium Economy');
            } else {
              setTravellersText('2 Adults, 1 Child');
              setTravelClass('Economy');
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.travellersLeft}>
            <MaterialIcons name="person-outline" size={26} color="#0066FF" style={styles.tileIcon} />
            <View style={styles.tileCol}>
              <Text style={styles.tileLabel}>Travellers & Class</Text>
              <Text style={styles.tileMainText}>{travellersText}</Text>
              <Text style={styles.tileSubText}>{travelClass}</Text>
            </View>
          </View>
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#0F172A" />
        </TouchableOpacity>

        {/* Row 5: Solid Royal Blue Search Flights Button */}
        <TouchableOpacity
          style={styles.searchFlightsBtn}
          onPress={handleSearchPress}
          activeOpacity={0.88}
        >
          <MaterialIcons name="search" size={22} color="#ffffff" style={styles.searchBtnIcon} />
          <Text style={styles.searchFlightsBtnText}>Search Flights</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4. FIRST BOOKING WELCOME BANNER ── */}
      <View style={styles.welcomeBanner}>
        <LinearGradient
          colors={['#0a58ca', '#005cab']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.welcomeBannerGradient}
        >
          <View style={styles.welcomeLeft}>
            <View style={styles.welcomeBadge}>
              <Text style={styles.welcomeBadgeText}>NEW USER PERK</Text>
            </View>
            <Text style={styles.welcomeTitle}>Up to 25% OFF on Your 1st Booking</Text>
            <Text style={styles.welcomeCode}>
              Use code <Text style={styles.welcomeCodeBold}>SSJWELCOME</Text> at checkout
            </Text>
          </View>
          <TouchableOpacity
            style={styles.welcomeClaimBtn}
            onPress={handleSearchPress}
            activeOpacity={0.8}
          >
            <Text style={styles.welcomeClaimText}>Claim</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* ── 4. POPULAR SEARCHES ── */}
      <View style={styles.popularSearchesSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="trending-up" size={20} color="#005cab" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Popular Searches</Text>
          </View>
          <Text style={{ fontSize: 11, color: '#707785', fontWeight: '500' }}>Updated Today</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.popularScroll}
        >
          {[
            { id: 'ps-1', from: 'DEL', fromCity: 'New Delhi', to: 'BOM', toCity: 'Mumbai', cat: 'flights' as const, label: 'Delhi ➔ Mumbai', fare: 'From ₹4,290', badge: 'TRENDING' },
            { id: 'ps-2', from: 'DEL', fromCity: 'New Delhi', to: 'GOI', toCity: 'Goa', cat: 'flights' as const, label: 'Delhi ➔ Goa', fare: 'From ₹4,890', badge: 'BEACH' },
            { id: 'ps-3', from: 'BOM', fromCity: 'Mumbai', to: 'DXB', toCity: 'Dubai', cat: 'flights' as const, label: 'Mumbai ➔ Dubai', fare: 'From ₹11,990', badge: 'POPULAR' },
            { id: 'ps-4', from: 'NDLS', fromCity: 'New Delhi', to: 'BSB', toCity: 'Varanasi', cat: 'trains' as const, label: 'Vande Bharat Express', fare: 'From ₹1,750', badge: 'TRAIN' },
            { id: 'ps-5', from: 'DEL', fromCity: 'New Delhi', to: 'JAI', toCity: 'Jaipur', cat: 'cabs' as const, label: 'Delhi ➔ Jaipur Prime', fare: 'From ₹2,499', badge: 'WEEKEND' },
            { id: 'ps-6', from: 'BLR', fromCity: 'Bengaluru', to: 'COK', toCity: 'Kochi', cat: 'hotels' as const, label: 'Kerala Backwater Resorts', fare: 'From ₹6,500', badge: 'STAYS' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.popularCard}
              onPress={() => {
                setOriginCode(item.from);
                setOriginCity(item.fromCity);
                setDestCode(item.to);
                setDestCity(item.toCity);
                setActiveCategory(item.cat);
                if (item.cat === 'flights') {
                  onNavigate('flights');
                } else if (item.cat === 'hotels') {
                  onNavigate('hotels');
                } else {
                  handleSearchPress();
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.popularTopRow}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>{item.badge}</Text>
                </View>
                <MaterialIcons name="north-east" size={14} color="#005cab" />
              </View>
              <Text style={styles.popularRouteText}>{item.label}</Text>
              <Text style={styles.popularFareText}>{item.fare}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── 5. SUPER OFFERS SECTION (Horizontal Carousel) ── */}
      <View style={styles.offersSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Super Offers</Text>
            <View style={styles.saveBigBadge}>
              <Text style={styles.saveBigText}>SAVE BIG</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => onNavigate('flights')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Offers Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersTabRow}
        >
          {(['all', 'flights', 'hotels', 'holidays', 'trains'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.offersTab,
                offersTab === tab && styles.offersTabActive,
              ]}
              onPress={() => setOffersTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.offersTabText,
                  offersTab === tab && styles.offersTabTextActive,
                ]}
              >
                {tab === 'all' ? 'All Offers' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Horizontal Deals Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dealsCarousel}
        >
          {/* Deal 1: Flights */}
          <View style={styles.dealCard}>
            <View style={styles.dealImageWrapper}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida/AEtjO1Uis5Wh0S6j6qQCBNKOs9FHJYibkM5dGxlmO1HOm259BCUiDVdL8saLZpPSsPc1EmrmYFMdtbj3fDQO5-XLnGCX8ekv7HgR6IrezYn5LuT_NrkdqYLiTIVoL5Z6H3WJXmzOwmdEHXeLIAiEmFP98ZNmB0CHQoun_WZjpHM4FAK9Yv_7CCfops9oG8w0dk91-kClbekjwH5f5C77VtHgICb-2hadNl7-1d6ADqOWwrsX95nCR0AyXlyR1Ys',
                }}
                style={styles.dealImage}
              />
              <View style={styles.dealCategoryTag}>
                <Text style={styles.dealCategoryText}>FLIGHTS</Text>
              </View>
              <View style={styles.dealDiscountTag}>
                <Text style={styles.dealDiscountText}>FLAT 8% OFF</Text>
              </View>
            </View>
            <Text style={styles.dealTitle} numberOfLines={1}>
              Savings Alert: Get FLAT 8% OFF*
            </Text>
            <Text style={styles.dealSubtitle} numberOfLines={2}>
              Book domestic and international flights starting from top cities.
            </Text>
            <View style={styles.dealFooter}>
              <View style={styles.dealCodeBadge}>
                <Text style={styles.dealCodeText}>CODE: SSJFLY</Text>
              </View>
              <TouchableOpacity
                onPress={() => onNavigate('flights')}
                activeOpacity={0.7}
              >
                <Text style={styles.dealBookNow}>BOOK NOW</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Deal 2: Hotels */}
          <View style={styles.dealCard}>
            <View style={styles.dealImageWrapper}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida/AEtjO1UrJrpEZbh7LenpwQV6uAuuPI27RonzV-sXFIlqnlDHJvwWIyZW8B32vGNoUU2Q4DBWEC-ojckB7ANiWAHfUomVPFHghtWTMeCXlCknHQ85bj6If--xjw7a8xePxhaEj4rvUggwK7t-8FxOqRJUJ6ViONcCuqgn9F6ko1Qj2yHXkLWZfyTUptDmhBuUt97B9PaCaQdVsM46C0E3nBSVJem5qF9APA3lvNtpc9yo1rBsJQg7B731bLgLAzs',
                }}
                style={styles.dealImage}
              />
              <View style={[styles.dealCategoryTag, { backgroundColor: '#0a58ca' }]}>
                <Text style={styles.dealCategoryText}>HOTELS</Text>
              </View>
              <View style={styles.dealDiscountTag}>
                <Text style={styles.dealDiscountText}>UP TO 25% OFF</Text>
              </View>
            </View>
            <Text style={styles.dealTitle} numberOfLines={1}>
              Instant savings: Up to 25% OFF*
            </Text>
            <Text style={styles.dealSubtitle} numberOfLines={2}>
              Complimentary breakfast and free cancellation across top luxury stays.
            </Text>
            <View style={styles.dealFooter}>
              <View style={styles.dealCodeBadge}>
                <Text style={styles.dealCodeText}>CODE: SSJSTAY</Text>
              </View>
              <TouchableOpacity
                onPress={() => onNavigate('hotels')}
                activeOpacity={0.7}
              >
                <Text style={styles.dealBookNow}>BOOK NOW</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Deal 3: Holidays */}
          <View style={styles.dealCard}>
            <View style={styles.dealImageWrapper}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida/AEtjO1VTYbPagZqdRtQbVAJ2ECGyQPnAIFVdnzDXOlE9GOIi7KgGttsEX1WLZrlVqwHjlVxzNLDffHUlsCle8vDRIhMlTItAVnsuwVw18KwRVObLkiMM4FUG8aoaiZjEkUYwTjaq-TjTCKXxhlM9TIV5-HwAKePhl735_tGGn2xRKe2QVQAAKbwYpJDdi09km43vW2Yfvd5bulTpcVlJq02rVqj5p5AobAsiR35A-bxx53GXcwkCxZCsiehu39w',
                }}
                style={styles.dealImage}
              />
              <View style={[styles.dealCategoryTag, { backgroundColor: '#1A7F37' }]}>
                <Text style={styles.dealCategoryText}>HOLIDAYS</Text>
              </View>
              <View style={styles.dealDiscountTag}>
                <Text style={styles.dealDiscountText}>35% OFF</Text>
              </View>
            </View>
            <Text style={styles.dealTitle} numberOfLines={1}>
              BIG SAVINGS ON HOLIDAYS
            </Text>
            <Text style={styles.dealSubtitle} numberOfLines={2}>
              Curated all-inclusive packages to Goa, Kerala, Kashmir &amp; Dubai.
            </Text>
            <View style={styles.dealFooter}>
              <View style={styles.dealCodeBadge}>
                <Text style={styles.dealCodeText}>CODE: SSJHOLIDAY</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleBookItem('PACKAGE', 'Goa Beachfront & Heritage Package', 18500)}
                activeOpacity={0.7}
              >
                <Text style={styles.dealBookNow}>BOOK NOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── 6. SPONSORED ADS & BANK SPECIALS ── */}
      <View style={styles.adsSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="campaign" size={20} color="#b45309" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Partner Specials &amp; Bank Offers</Text>
            <View style={styles.adPillBadge}>
              <Text style={styles.adPillText}>AD</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.adsScroll}
        >
          {[
            {
              id: 'ad-1',
              bank: 'HDFC BANK EXCLUSIVE',
              title: 'Flat ₹2,500 Instant Cashback',
              desc: 'On domestic & international flights booked with HDFC Credit Cards.',
              code: 'HDFCFEST',
              colors: ['#0f2b5c', '#1a4980'] as const,
              tag: 'SPONSORED',
            },
            {
              id: 'ad-2',
              bank: 'ICICI BANK REWARDS',
              title: 'Up to 20% Off Luxury Resorts',
              desc: 'Applicable on verified Taj, Marriott & Oberoi beach properties.',
              code: 'ICICISTAY',
              colors: ['#7c1d1d', '#991b1b'] as const,
              tag: 'FEATURED',
            },
            {
              id: 'ad-3',
              bank: 'AXIS BANK EDGE',
              title: 'Zero Convenience Fee',
              desc: 'Save 100% on ticketing and platform fee on express trains & buses.',
              code: 'AXISZERO',
              colors: ['#4a044e', '#701a75'] as const,
              tag: 'EXCLUSIVE',
            },
          ].map((ad) => (
            <LinearGradient
              key={ad.id}
              colors={ad.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.adBannerCard}
            >
              <View style={styles.adCardTop}>
                <Text style={styles.adBankName}>{ad.bank}</Text>
                <View style={styles.adTagPill}>
                  <Text style={styles.adTagPillText}>{ad.tag}</Text>
                </View>
              </View>
              <Text style={styles.adCardTitle}>{ad.title}</Text>
              <Text style={styles.adCardDesc}>{ad.desc}</Text>
              <View style={styles.adCardBottom}>
                <View style={styles.adCodePill}>
                  <Text style={styles.adCodeText}>CODE: {ad.code}</Text>
                </View>
                <TouchableOpacity
                  style={styles.adClaimBtn}
                  onPress={() => {
                    Alert.alert(
                      'Promo Code Copied!',
                      `Code "${ad.code}" has been copied. Use it during checkout to claim this special offer.`
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.adClaimText}>Claim Offer</Text>
                  <MaterialIcons name="content-copy" size={13} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ))}
        </ScrollView>
      </View>

      {/* ── 7. BEST FOR YOU (RECOMMENDED TRAVEL) ── */}
      <View style={styles.bestForYouSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="auto-awesome" size={20} color="#7c3aed" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Best for You</Text>
            <View style={styles.curatedBadge}>
              <Text style={styles.curatedBadgeText}>CURATED</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => onNavigate('hotels')}>
            <Text style={styles.viewAllText}>Explore More</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bestForYouSub}>Handpicked selections tailored to top traveler preferences</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bestForYouScroll}
        >
          {[
            {
              id: 'bfy-hotel-1',
              category: 'HOTEL',
              title: 'Taj Exotica Resort & Spa, Goa',
              location: 'Benaulim Beach, South Goa',
              rating: 4.9,
              reviews: '2.4k',
              price: 14500,
              priceUnit: '/night',
              badge: '5★ Luxury Beachfront',
              image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&auto=format&fit=crop&q=80',
              actionType: 'hotels',
            },
            {
              id: 'bfy-flight-1',
              category: 'FLIGHT',
              title: 'Air India Non-stop Prime',
              location: 'DEL ➔ BOM · 07:15 AM · A321neo',
              rating: 4.8,
              reviews: '1.9k',
              price: 4650,
              priceUnit: 'total',
              badge: 'Hot Meal Included',
              image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=700&auto=format&fit=crop&q=80',
              actionType: 'flights',
            },
            {
              id: 'bfy-package-1',
              category: 'PACKAGE',
              title: 'Kashmir Valley & Gulmarg Escape',
              location: '5 Days / 4 Nights · Houseboat & Gondola',
              rating: 4.9,
              reviews: '870',
              price: 21990,
              priceUnit: 'per person',
              badge: 'All Meals & Tours',
              image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=700&auto=format&fit=crop&q=80',
              actionType: 'packages',
            },
            {
              id: 'bfy-train-1',
              category: 'TRAIN',
              title: 'Vande Bharat Express (20172)',
              location: 'New Delhi ➔ Varanasi (8h 00m)',
              rating: 4.9,
              reviews: '3.5k',
              price: 1750,
              priceUnit: 'per seat',
              badge: 'Executive Chair Car',
              image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=700&auto=format&fit=crop&q=80',
              actionType: 'trains',
            },
          ].map((item) => {
            const isFav = isWishlisted(item.id);
            return (
              <View key={item.id} style={styles.bestForYouCard}>
                <View style={styles.bfyImageWrapper}>
                  <Image source={{ uri: item.image }} style={styles.bfyImage} />
                  <View style={styles.bfyBadgePill}>
                    <Text style={styles.bfyBadgeText}>{item.badge}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bfyHeartBtn}
                    onPress={() =>
                      toggleWishlist({
                        id: item.id,
                        title: item.title,
                        category: item.category as any,
                        location: item.location,
                        price: item.price,
                        image: item.image,
                        rating: item.rating,
                        badge: item.badge,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={isFav ? 'favorite' : 'favorite-border'}
                      size={16}
                      color={isFav ? '#e11d48' : '#ffffff'}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.bfyContent}>
                  <View style={styles.bfyRatingRow}>
                    <View style={styles.bfyScoreBadge}>
                      <MaterialIcons name="star" size={12} color="#ffffff" />
                      <Text style={styles.bfyScoreText}>{item.rating}</Text>
                    </View>
                    <Text style={styles.bfyReviewsText}>({item.reviews})</Text>
                  </View>
                  <Text style={styles.bfyTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.bfyLocation} numberOfLines={1}>
                    {item.location}
                  </Text>

                  <View style={styles.bfyPriceRow}>
                    <View>
                      <Text style={styles.bfyPrice}>{formatINR(item.price)}</Text>
                      <Text style={styles.bfyPriceUnit}>{item.priceUnit}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.bfyActionBtn}
                      onPress={() => {
                        if (item.actionType === 'flights') {
                          onNavigate('flights');
                        } else if (item.actionType === 'hotels') {
                          onNavigate('hotels');
                        } else if (item.actionType === 'packages') {
                          handleBookItem('PACKAGE', item.title, item.price);
                        } else {
                          handleSearchPress();
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bfyActionText}>Book</Text>
                      <MaterialIcons name="arrow-forward" size={13} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 8. HANDPICKED TRAVEL COLLECTIONS (2x2 Grid) ── */}
      <View style={styles.collectionsSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Handpicked Collections</Text>
            <Text style={styles.collectionsSubtitle}>Curated styles tailored for wanderers</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('flights')}>
            <Text style={styles.viewAllText}>Explore All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.collectionsGrid}>
          {[
            {
              title: 'Island Escapes',
              price: 'From ₹18,500/pkg',
              badge: 'VISA-FREE',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUwq_xPgxAv6lbOMiJJZW4lqUa7h9B-QuvK74MkYiNpsu1B79ZDluZj-oaAqbM8pvrTefYnteGW8drifvks_MueTPsOWZksbbjs7Z0PH5PQnTy86V8gq1-6ELukrC7Bjlu6KBx9b29WneKlGxp22sHo-AdgGzETFLM39-XqN_LQVYohTBnW2Ob6HG6ji5Tj4iLEeOKd53fKdjwADCVeLzNPf3Lxl8enIrFWO09dExH9aZkH7vD03WO',
            },
            {
              title: 'Beach Resorts',
              price: 'From ₹6,490/night',
              badge: 'BEACHFRONT',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZL3FnIM9sWSZXOM9_7yEof5GRgScVLdrxNVjcDYZofZR3jGxmRAPXPyJqf_j7oi7BpKd-ooslPytaL2TWQsFBjz8mYSr1zkpC-oMUBWlqmLjH2U2Wy5UmzTtYt7cM-vwMgtYGNwhYNeVEAG7oMhUe0SjnDSFnvOT_ntqJWcUSh8Cgllt4m0Xof0geozpf3p7RPqig0Nls9GgAYvgg0DHIj0ugtVnHUOPtOHiJmf70NqCoT9D8KS7k',
            },
            {
              title: 'Honeymoon Trips',
              price: 'From ₹34,990/pkg',
              badge: 'COUPLES',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUloYo_gaPu80WDMb1Se_qsfR1vpiNdsh-18_Kwq_SzD1g9wFxd46V9A8CCjuZtjm4LfpAyhjX3TO6nIL-ySonU81chCkRP0qhjerOLEEieGReSkMLT2Up_WnDLiMh10RjInK2bCdwibDgVkqdL400KdXj0Q7-G2mQQiOdOVrh-hOAT86ycwx0w2m6O_69QSBpWEr7sKObFCfxfJAjC4F96uiTBpMqAtuPFUaxE3YTD2geijcgObU7',
            },
            {
              title: 'Villa Retreats',
              price: 'From ₹8,990/night',
              badge: 'PRIVATE POOL',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDa6xP2ZAQX9Scr3kpAwkl3lP-GVVshoimgaBM7nuIWRHyJsAuApEfzzEAJB5WyRgAbrxeTa1m6ClAYLt15WLdo14qrdyDpS95LLc_J2iPB2evzatqze7yUAxYethrCSd6a0pYEj3k9aaGP5HH_BdJpwdOqb2P1uXMUzuFG0QHx315qo8W7U3VW4zdFBz22xG_h5GTG2GwERo8AmWiR_nfQM3gOKD2nIIcotM1Y4QTiaFrqKLa60X4-',
            },
          ].map((col) => (
            <TouchableOpacity
              key={col.title}
              style={styles.collectionTile}
              onPress={() => onNavigate('flights')}
              activeOpacity={0.8}
            >
              <View style={styles.collectionImageContainer}>
                <Image source={{ uri: col.img }} style={styles.collectionImage} />
                <View style={styles.collectionBadge}>
                  <Text style={styles.collectionBadgeText}>{col.badge}</Text>
                </View>

                {/* Wishlist Heart Button */}
                <TouchableOpacity
                  style={styles.collectionHeartBtn}
                  onPress={(e) => {
                    toggleWishlist({
                      id: `m-col-${col.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                      title: col.title,
                      category: 'PACKAGE',
                      location: 'Curated Theme Escape',
                      price: parseInt(col.price.replace(/[^\d]/g, '')) || 18500,
                      image: col.img,
                      badge: col.badge,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={isWishlisted(`m-col-${col.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`) ? 'favorite' : 'favorite-border'}
                    size={15}
                    color={isWishlisted(`m-col-${col.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`) ? '#e11d48' : '#ffffff'}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.collectionMeta}>
                <Text style={styles.collectionTitle} numberOfLines={1}>
                  {col.title}
                </Text>
                <Text style={styles.collectionPrice}>{col.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

    </ScrollView>

    {/* ── INTERACTIVE MOBILE CALENDAR POPUP MODAL ── */}
    <CalendarModal
      visible={calendarModalState?.visible ?? false}
      onClose={() => setCalendarModalState(null)}
      title={calendarModalState?.title ?? 'Select Date'}
      initialDate={calendarModalState?.initialDate ?? departureDate}
      minDate={calendarModalState?.minDate}
      onSelectDate={handleMobileDateSelected}
    />
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbf9f8',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroWrapper: {
    width: '100%',
    height: 190,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    ...Shadows.sm,
  },
  dealsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#005cab',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#e41d27',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  specialPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  heroCopy: {
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    fontWeight: '500',
  },
  topSearchTapWrapper: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  topSearchTapBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E7EBF0',
    ...Shadows.md,
  },
  topSearchIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#005cab',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSearchTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  topSearchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071426',
    letterSpacing: -0.2,
  },
  topSearchSubtitle: {
    fontSize: 10.5,
    color: '#707785',
    marginTop: 2,
    fontWeight: '500',
  },
  topSearchActionBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 92, 171, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  categoryCarouselWrapper: {
    marginTop: 8,
    marginBottom: 4,
    zIndex: 10,
  },
  categoryCarousel: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E7EBF0',
  },
  categoryPillActive: {
    backgroundColor: '#005cab',
    borderColor: '#005cab',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#525f71',
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  categoryBadge: {
    backgroundColor: '#e41d27',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  searchCard: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    ...Shadows.md,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B0BAC9',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#0066FF',
    backgroundColor: '#0066FF',
  },
  radioCircleDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ffffff',
  },
  radioOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  radioOptionTextActive: {
    fontWeight: '700',
    color: '#0F172A',
  },
  routeRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    gap: 10,
  },
  routeTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    minHeight: 68,
  },
  centerSwapFab: {
    position: 'absolute',
    left: '50%',
    marginLeft: -17,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Shadows.sm,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  dateTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    minHeight: 68,
  },
  dateTileDimmed: {
    opacity: 0.65,
  },
  tileIcon: {
    marginRight: 10,
  },
  tileCol: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 1,
  },
  tileMainText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  tileDateMainText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  tileSubText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  travellersTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    marginTop: 10,
    minHeight: 68,
  },
  travellersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchFlightsBtn: {
    marginTop: 14,
    backgroundColor: '#0066FF',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBtnIcon: {
    marginRight: 8,
  },
  searchFlightsBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  welcomeBanner: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  welcomeBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  welcomeLeft: {
    flex: 1,
    paddingRight: 8,
  },
  welcomeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A7F37',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
  },
  welcomeBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  welcomeCode: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  welcomeCodeBold: {
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  welcomeClaimBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    ...Shadows.sm,
  },
  welcomeClaimText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#005cab',
  },
  offersSection: {
    marginTop: 18,
    gap: 8,
  },
  sectionHeader: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1b1c1c',
  },
  saveBigBadge: {
    backgroundColor: '#e41d27',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  saveBigText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#005cab',
  },
  offersTabRow: {
    paddingHorizontal: 12,
    gap: 6,
  },
  offersTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E7EBF0',
  },
  offersTabActive: {
    backgroundColor: '#005cab',
    borderColor: '#005cab',
  },
  offersTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#525f71',
  },
  offersTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dealsCarousel: {
    paddingHorizontal: 12,
    gap: 10,
    paddingBottom: 4,
  },
  dealCard: {
    width: 250,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E7EBF0',
    gap: 4,
  },
  dealImageWrapper: {
    width: '100%',
    height: 105,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 4,
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  dealCategoryTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#bb0017',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dealCategoryText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
  },
  dealDiscountTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dealDiscountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1A7F37',
  },
  dealTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1b1c1c',
  },
  dealSubtitle: {
    fontSize: 10,
    color: '#707785',
    lineHeight: 13,
  },
  dealFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#efeded',
    marginTop: 4,
  },
  dealCodeBadge: {
    backgroundColor: '#F2F4F8',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dealCodeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1b1c1c',
  },
  dealBookNow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#005cab',
    letterSpacing: 0.5,
  },
  collectionsSection: {
    marginTop: 18,
    gap: 8,
  },
  collectionsSubtitle: {
    fontSize: 10,
    color: '#707785',
  },
  collectionsGrid: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  collectionTile: {
    width: (width - 32) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E7EBF0',
  },
  collectionImageContainer: {
    width: '100%',
    height: 90,
    position: 'relative',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  collectionBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  collectionBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
  },
  collectionHeartBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  collectionMeta: {
    padding: 8,
  },
  collectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1b1c1c',
  },
  collectionPrice: {
    fontSize: 10,
    color: '#707785',
    marginTop: 1,
  },
  // Popular Searches Styles
  popularSearchesSection: {
    marginTop: 14,
    marginBottom: 4,
  },
  popularScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  popularCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E7EBF0',
    ...Shadows.sm,
    minWidth: 155,
  },
  popularTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  popularBadge: {
    backgroundColor: 'rgba(0, 92, 171, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#005cab',
    letterSpacing: 0.4,
  },
  popularRouteText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#071426',
    letterSpacing: -0.2,
  },
  popularFareText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#059669',
    marginTop: 3,
  },

  // Ads & Bank Specials Styles
  adsSection: {
    marginTop: 18,
    marginBottom: 4,
  },
  adPillBadge: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  adPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#b45309',
  },
  adsScroll: {
    paddingHorizontal: 12,
    gap: 10,
  },
  adBannerCard: {
    width: 280,
    borderRadius: 16,
    padding: 14,
    ...Shadows.md,
  },
  adCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  adBankName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.8,
  },
  adTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adTagPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  adCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  adCardDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
    lineHeight: 15,
  },
  adCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  adCodePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  adCodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  adClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#005cab',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  adClaimText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Best For You Styles
  bestForYouSection: {
    marginTop: 18,
    marginBottom: 4,
  },
  curatedBadge: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  curatedBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#7c3aed',
  },
  bestForYouSub: {
    fontSize: 10.5,
    color: '#707785',
    paddingHorizontal: 12,
    marginTop: -2,
    marginBottom: 10,
  },
  bestForYouScroll: {
    paddingHorizontal: 12,
    gap: 12,
  },
  bestForYouCard: {
    width: 210,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7EBF0',
    ...Shadows.sm,
  },
  bfyImageWrapper: {
    width: '100%',
    height: 115,
    position: 'relative',
  },
  bfyImage: {
    width: '100%',
    height: '100%',
  },
  bfyBadgePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bfyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  bfyHeartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bfyContent: {
    padding: 10,
  },
  bfyRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bfyScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bfyScoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  bfyReviewsText: {
    fontSize: 10,
    color: '#707785',
  },
  bfyTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#071426',
    letterSpacing: -0.2,
  },
  bfyLocation: {
    fontSize: 10,
    color: '#707785',
    marginTop: 2,
  },
  bfyPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F8',
  },
  bfyPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#005cab',
  },
  bfyPriceUnit: {
    fontSize: 8.5,
    color: '#707785',
  },
  bfyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#005cab',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  bfyActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
});
