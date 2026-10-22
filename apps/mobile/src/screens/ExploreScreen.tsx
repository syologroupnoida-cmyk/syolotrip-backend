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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName, CategoryMode, TripBookingState } from '../types/travel';

const { width } = Dimensions.get('window');

interface ExploreScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onInitiateBooking?: (booking: TripBookingState) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onNavigate,
  onInitiateBooking,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryMode>('flights');
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'multicity'>('oneway');
  const [originCode, setOriginCode] = useState('DEL');
  const [originCity, setOriginCity] = useState('New Delhi, India');
  const [destCode, setDestCode] = useState('BOM');
  const [destCity, setDestCity] = useState('Mumbai, India');
  const [specialFare, setSpecialFare] = useState('regular');
  const [offersTab, setOffersTab] = useState<'all' | 'flights' | 'hotels' | 'holidays' | 'trains'>('all');

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

  const handleSearchPress = () => {
    if (activeCategory === 'hotels') {
      onNavigate('hotels');
    } else if (activeCategory === 'flights') {
      onNavigate('flights');
    } else if (activeCategory === 'villas') {
      handleBookItem('VILLA', 'Candolim Luxury 4BHK Private Pool Villa', 14500);
    } else if (activeCategory === 'packages') {
      handleBookItem('PACKAGE', 'Goa Beachfront & Heritage Holiday (5D/4N)', 18500);
    } else if (activeCategory === 'trains') {
      handleBookItem('TRAIN', 'Vande Bharat Express (20172)', 1750);
    } else if (activeCategory === 'buses') {
      handleBookItem('BUS', 'Zingbus Luxury Multi-Axle Volvo AC', 950);
    } else if (activeCategory === 'cabs') {
      handleBookItem('CAB', 'Airport Prime Sedan (IGI T3)', 650);
    } else if (activeCategory === 'tours') {
      handleBookItem('TOUR', 'Burj Khalifa At The Top - Fast Track Level 124 & 125', 3850);
    } else if (activeCategory === 'visa') {
      handleBookItem('VISA', 'Dubai Express 30-Day Tourist E-Visa', 6499);
    } else if (activeCategory === 'insurance') {
      handleBookItem('INSURANCE', 'International Travel Shield - $500k Coverage', 1299);
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
      datesText: 'Oct 24 - Oct 31, 2026',
      travelersText: '1 Traveler, Economy',
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. TROPICAL SKY HERO BACKDROP ── */}
      <View style={styles.heroWrapper}>
        <ImageBackground
          source={require('../../assets/hero-bg-bright.jpg')}
          style={styles.heroBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,40,90,0.25)', 'transparent', '#fbf9f8']}
            style={styles.heroGradient}
          >
            {/* Top Micro Badges */}
            <View style={styles.heroTopRow}>
              <View style={styles.dealsPill}>
                <MaterialIcons name="travel-explore" size={14} color="#005cab" />
                <Text style={styles.dealsPillText}>Explore Global Deals</Text>
              </View>
              <View style={styles.specialPill}>
                <MaterialIcons name="local-fire-department" size={13} color="#ffffff" />
                <Text style={styles.specialPillText}>SPECIALS</Text>
              </View>
            </View>

            {/* Hero Wanderlust Copy */}
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Where to next?</Text>
              <Text style={styles.heroSubtitle}>
                Book cheap domestic &amp; international travel
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>

      {/* ── 2. CATEGORY NAV PILLS CAROUSEL (Floating) ── */}
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

      {/* ── 3. SEARCH ENGINE CONSOLE WIDGET CARD (Stitch Replica) ── */}
      <View style={styles.searchCard}>
        {/* Trip Mode Radio Bar */}
        <View style={styles.tripTypeRow}>
          {(['oneway', 'roundtrip', 'multicity'] as const).map((mode) => {
            const isSelected = tripType === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.tripTypeTab,
                  isSelected && styles.tripTypeTabSelected,
                ]}
                onPress={() => setTripType(mode)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.tripTypeText,
                    isSelected && styles.tripTypeTextSelected,
                  ]}
                >
                  {mode === 'oneway' ? 'One Way' : mode === 'roundtrip' ? 'Round Trip' : 'Multi City'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FROM & TO Segment with Centered Swap Icon */}
        <View style={styles.routeContainer}>
          {/* FROM Input */}
          <TouchableOpacity
            style={styles.routeBox}
            onPress={() => {
              if (originCode === 'DEL') {
                setOriginCode('SFO');
                setOriginCity('San Francisco, USA');
              } else {
                setOriginCode('DEL');
                setOriginCity('New Delhi, India');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.routeMeta}>
              <Text style={styles.routeLabel}>FROM</Text>
              <View style={styles.codeRow}>
                <Text style={styles.airportCode}>{originCode}</Text>
                <Text style={styles.cityName} numberOfLines={1}>{originCity.split(',')[0]}</Text>
              </View>
              <Text style={styles.subAirport} numberOfLines={1}>{originCity}</Text>
            </View>
            <MaterialIcons name="flight-takeoff" size={20} color="#707785" />
          </TouchableOpacity>

          {/* Swap Floating Button */}
          <View style={styles.swapDivider}>
            <View style={styles.dividerLine} />
            <TouchableOpacity
              style={styles.swapFab}
              onPress={handleSwapRoutes}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <MaterialIcons name="sync-alt" size={18} color="#005cab" />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* TO Input */}
          <TouchableOpacity
            style={styles.routeBox}
            onPress={() => {
              if (destCode === 'BOM') {
                setDestCode('HND');
                setDestCity('Tokyo Haneda, Japan');
              } else {
                setDestCode('BOM');
                setDestCity('Mumbai, India');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.routeMeta}>
              <Text style={styles.routeLabel}>TO</Text>
              <View style={styles.codeRow}>
                <Text style={styles.airportCode}>{destCode}</Text>
                <Text style={styles.cityName} numberOfLines={1}>{destCity.split(',')[0]}</Text>
              </View>
              <Text style={styles.subAirport} numberOfLines={1}>{destCity}</Text>
            </View>
            <MaterialIcons name="flight-land" size={20} color="#707785" />
          </TouchableOpacity>
        </View>

        {/* Departure & Return Grid */}
        <View style={styles.dateGrid}>
          <TouchableOpacity style={styles.dateCell} activeOpacity={0.8}>
            <Text style={styles.routeLabel}>DEPARTURE DATE</Text>
            <View style={styles.dateNumberRow}>
              <Text style={styles.dateDayNumber}>24</Text>
              <Text style={styles.dateMonth}>Oct'26</Text>
            </View>
            <Text style={styles.dateDayName}>Saturday</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dateCell} activeOpacity={0.8}>
            <View style={styles.returnHeader}>
              <MaterialIcons name="add-circle" size={14} color="#005cab" />
              <Text style={[styles.routeLabel, { color: '#005cab' }]}>RETURN DATE</Text>
            </View>
            <Text style={styles.returnPrompt}>Tap to add return for bigger savings</Text>
          </TouchableOpacity>
        </View>

        {/* Travellers & Class */}
        <TouchableOpacity style={styles.travellersBox} activeOpacity={0.8}>
          <View>
            <Text style={styles.routeLabel}>TRAVELLERS &amp; CLASS</Text>
            <View style={styles.travellersValueRow}>
              <Text style={styles.travellersCount}>1 Traveller</Text>
              <Text style={styles.travellersClass}>• Economy / Premium</Text>
            </View>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={14} color="#707785" />
        </TouchableOpacity>

        {/* Special Fares Selection */}
        <View style={styles.specialFaresSection}>
          <View style={styles.specialFaresHeader}>
            <Text style={styles.specialFaresTitle}>Special Fares (Optional):</Text>
            <Text style={styles.savingsTag}>Extra Savings Active</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialFaresRow}
          >
            {[
              { id: 'regular', label: 'Regular Fares' },
              { id: 'student', label: 'Student Fares' },
              { id: 'senior', label: 'Senior Citizen' },
              { id: 'armed', label: 'Armed Forces' },
              { id: 'medical', label: 'Doctors & Nurses' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.fareChip,
                  specialFare === f.id && styles.fareChipSelected,
                ]}
                onPress={() => setSpecialFare(f.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.fareChipText,
                    specialFare === f.id && styles.fareChipTextSelected,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending shortcuts */}
        <View style={styles.trendingRow}>
          <Text style={styles.trendingLabel}>Trending:</Text>
          <TouchableOpacity
            style={styles.trendingChip}
            onPress={() => {
              setOriginCode('DEL');
              setDestCode('BOM');
            }}
          >
            <Text style={styles.trendingChipText}>DEL → BOM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.trendingChip}
            onPress={() => {
              setOriginCode('SFO');
              setDestCode('HND');
            }}
          >
            <Text style={styles.trendingChipText}>SFO → HND</Text>
          </TouchableOpacity>
        </View>

        {/* Big Vibrant Gradient Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#008cff', '#005cab']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.searchButtonGradient}
          >
            <MaterialIcons name="search" size={20} color="#ffffff" />
            <Text style={styles.searchButtonText}>
              {activeCategory === 'flights' ? 'SEARCH FLIGHTS' :
               activeCategory === 'hotels' ? 'SEARCH HOTELS' :
               activeCategory === 'villas' ? 'SEARCH VILLAS' :
               activeCategory === 'trains' ? 'BOOK TRAIN' :
               activeCategory === 'buses' ? 'BOOK BUS' :
               activeCategory === 'cabs' ? 'RESERVE CAB' :
               activeCategory === 'tours' ? 'EXPLORE TOURS' :
               activeCategory === 'visa' ? 'APPLY VISA' :
               activeCategory === 'insurance' ? 'VIEW INSURANCE PLANS' : 'EXPLORE PACKAGES'}
            </Text>
          </LinearGradient>
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
              Use code <Text style={styles.welcomeCodeBold}>MMTWELCOME</Text> at checkout
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
                <Text style={styles.dealCodeText}>CODE: MMTFLY</Text>
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
                <Text style={styles.dealCodeText}>CODE: MMTSTAY</Text>
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
                <Text style={styles.dealCodeText}>CODE: MMTHOLIDAY</Text>
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

      {/* ── 6. HANDPICKED TRAVEL COLLECTIONS (2x2 Grid) ── */}
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

      {/* ── 7. VALUE PROPOSITIONS STRIP ── */}
      <View style={styles.trustSection}>
        <Text style={styles.trustTitle}>Why Book with SS Journey?</Text>
        <Text style={styles.trustSubtitle}>
          Trusted by over 500,000+ happy travelers across India &amp; abroad
        </Text>
        <View style={styles.trustGrid}>
          {[
            { icon: 'support-agent' as const, title: '24*7 Support', sub: 'Response under 2 min' },
            { icon: 'security' as const, title: 'Secure Pay', sub: 'UPI, Cards & NetBanking' },
            { icon: 'price-check' as const, title: 'Lowest Fares', sub: 'Zero hidden surcharges' },
            { icon: 'sync' as const, title: 'Easy Refunds', sub: 'Instant cancellation credits' },
          ].map((item) => (
            <View key={item.title} style={styles.trustItem}>
              <View style={styles.trustIconCircle}>
                <MaterialIcons name={item.icon} size={18} color="#005cab" />
              </View>
              <View style={styles.trustMeta}>
                <Text style={styles.trustItemTitle}>{item.title}</Text>
                <Text style={styles.trustItemSub}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
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
  categoryCarouselWrapper: {
    marginTop: -22,
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
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: '#E7EBF0',
    gap: 10,
  },
  tripTypeRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F8',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  tripTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tripTypeTabSelected: {
    backgroundColor: '#ffffff',
    ...Shadows.sm,
  },
  radioCircle: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#707785',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#005cab',
  },
  radioInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#005cab',
  },
  tripTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#525f71',
  },
  tripTypeTextSelected: {
    color: '#005cab',
    fontWeight: '700',
  },
  routeContainer: {
    backgroundColor: '#F2F4F8',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    position: 'relative',
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeMeta: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#707785',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 1,
  },
  airportCode: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1b1c1c',
  },
  cityName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b1c1c',
    flex: 1,
  },
  subAirport: {
    fontSize: 11,
    color: '#707785',
    marginTop: 1,
  },
  swapDivider: {
    position: 'relative',
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#c0c7d6',
  },
  swapFab: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E7EBF0',
  },
  dateGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  dateCell: {
    flex: 1,
    backgroundColor: '#F2F4F8',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
  },
  dateNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  dateDayNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1b1c1c',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b1c1c',
  },
  dateDayName: {
    fontSize: 10,
    color: '#707785',
    marginTop: 1,
  },
  returnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  returnPrompt: {
    fontSize: 10,
    color: '#707785',
    marginTop: 3,
    lineHeight: 13,
  },
  travellersBox: {
    backgroundColor: '#F2F4F8',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  travellersValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  travellersCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b1c1c',
  },
  travellersClass: {
    fontSize: 11,
    color: '#707785',
  },
  specialFaresSection: {
    gap: 6,
    paddingTop: 2,
  },
  specialFaresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specialFaresTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#525f71',
    textTransform: 'uppercase',
  },
  savingsTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1A7F37',
  },
  specialFaresRow: {
    gap: 6,
  },
  fareChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F2F4F8',
  },
  fareChipSelected: {
    backgroundColor: '#d3e1f6',
  },
  fareChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#525f71',
  },
  fareChipTextSelected: {
    color: '#005cab',
    fontWeight: '700',
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  trendingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#707785',
  },
  trendingChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F2F4F8',
    borderRadius: 6,
  },
  trendingChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1b1c1c',
  },
  searchButton: {
    marginTop: 4,
    borderRadius: 12,
    overflow: 'hidden',
    ...Shadows.md,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.8,
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
  trustSection: {
    marginTop: 18,
    marginHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E7EBF0',
    gap: 8,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1b1c1c',
    textAlign: 'center',
  },
  trustSubtitle: {
    fontSize: 10,
    color: '#707785',
    textAlign: 'center',
    marginBottom: 4,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustItem: {
    width: (width - 60) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F4F8',
    padding: 8,
    borderRadius: 8,
  },
  trustIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustMeta: {
    flex: 1,
  },
  trustItemTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1b1c1c',
  },
  trustItemSub: {
    fontSize: 8,
    color: '#707785',
  },
});
