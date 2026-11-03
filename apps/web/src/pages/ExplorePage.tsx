import React, { useState, useRef, useEffect } from 'react';
import { WebCheckoutItem } from './BookingCheckoutPage';
import { ScreenType } from '../components/Header';
import { AppDownloadBanner } from '../components/AppDownloadBanner';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';
import { 
  FlightsIsometricIcon,
  HotelsIsometricIcon,
  VillasIsometricIcon,
  HolidaysIsometricIcon,
  TrainsIsometricIcon,
  BusesIsometricIcon,
  CabsIsometricIcon,
  ToursIsometricIcon,
  VisaIsometricIcon,
  InsuranceIsometricIcon,
} from '../components/TravelCategoryIcons';
import { CalendarPickerModal } from '../components/CalendarPickerModal';
import { MapLocationSearchModal } from '../components/MapLocationSearchModal';
import { getRouteEstimateApi, RouteEstimateResult, getServiceLocationsSuggestApi, ServiceLocationSuggestion } from '../services/api';

export interface AirportOption {
  code: string;
  city: string;
  name: string;
  country: string;
}

export const popularAirports: AirportOption[] = [
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi International Airport', country: 'India' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj Intl Airport', country: 'India' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', country: 'India' },
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco International Airport', country: 'USA' },
  { code: 'HND', city: 'Tokyo', name: 'Tokyo Haneda International Airport', country: 'Japan' },
  { code: 'NYC', city: 'New York', name: 'JFK International Airport', country: 'USA' },
  { code: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'UAE' },
  { code: 'LHR', city: 'London', name: 'London Heathrow Airport', country: 'UK' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France' },
  { code: 'SIN', city: 'Singapore', name: 'Singapore Changi Airport', country: 'Singapore' },
  { code: 'DPS', city: 'Bali', name: 'Ngurah Rai International Airport', country: 'Indonesia' },
];

export interface HotelCityOption {
  city: string;
  region: string;
  country: string;
}

export const popularHotelCities: HotelCityOption[] = [
  { city: 'Paris', region: 'Île-de-France (All Areas)', country: 'France' },
  { city: 'Tokyo', region: 'Kanto Region (Ginza / Shinjuku)', country: 'Japan' },
  { city: 'Goa', region: 'South & North Goa Beachfront', country: 'India' },
  { city: 'Dubai', region: 'Downtown / Palm Jumeirah', country: 'UAE' },
  { city: 'Bali', region: 'Seminyak / Ubud / Canggu', country: 'Indonesia' },
  { city: 'London', region: 'Central / Westminster', country: 'UK' },
];

export interface FlightSearchParams {
  fromCode: string;
  fromCity: string;
  toCode: string;
  toCity: string;
  departDate?: string;
  returnDate?: string;
}

export interface HotelSearchParams {
  city: string;
  checkIn?: string;
  checkOut?: string;
  propertyType?: string;
}

export interface TrainStationOption {
  code: string;
  name: string;
  city: string;
}

export const popularTrainStations: TrainStationOption[] = [
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'Delhi' },
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
  { code: 'SBC', name: 'KSR Bengaluru', city: 'Bengaluru' },
  { code: 'MAS', name: 'Chennai Central', city: 'Chennai' },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi' },
  { code: 'AGC', name: 'Agra Cantt', city: 'Agra' },
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur' },
  { code: 'GOI', name: 'Madgaon Junction', city: 'Goa' },
];

export interface BusCityOption {
  city: string;
  point: string;
}

export const popularBusCities: BusCityOption[] = [
  { city: 'Bengaluru', point: 'Majestic / Silk Board' },
  { city: 'Goa', point: 'Panjim Bus Stand / Mapusa' },
  { city: 'Delhi', point: 'Kashmere Gate ISBT' },
  { city: 'Jaipur', point: 'Sindhi Camp Bus Stand' },
  { city: 'Mumbai', point: 'Borivali West / Dadar' },
  { city: 'Pune', point: 'Swargate / Wakad' },
  { city: 'Manali', point: 'Private Bus Stand' },
  { city: 'Chennai', point: 'Koyambedu CMBT' },
];

export interface CabCityOption {
  city: string;
  pickup: string;
  drop: string;
}

export const popularCabCities: CabCityOption[] = [
  { city: 'Delhi', pickup: 'IGI Airport Terminal 3', drop: 'Connaught Place / Central Delhi' },
  { city: 'Mumbai', pickup: 'Chhatrapati Shivaji Airport (T2)', drop: 'Bandra Kurla Complex (BKC)' },
  { city: 'Bengaluru', pickup: 'Kempegowda Intl Airport (BLR)', drop: 'Indiranagar / Koramangala' },
  { city: 'Goa', pickup: 'Dabolim / MOPA Airport', drop: 'Candolim / Calangute Beach' },
  { city: 'Dubai', pickup: 'Dubai International (DXB)', drop: 'Downtown Dubai / Palm Jumeirah' },
  { city: 'Paris', pickup: 'Charles de Gaulle Airport (CDG)', drop: 'Central Paris / Champs-Élysées' },
];

export interface HolidayOption {
  destination: string;
  title: string;
  days: string;
}

export const popularHolidayThemes: HolidayOption[] = [
  { destination: 'Kashmir', title: 'Kashmir Paradise: Dal Lake & Gulmarg', days: '5 Days / 4 Nights' },
  { destination: 'Goa', title: 'Goa Coastal Bliss: Beachfront & Cruise', days: '4 Days / 3 Nights' },
  { destination: 'Bali', title: 'Bali Bliss: Ubud Jungles & Seminyak', days: '7 Days / 6 Nights' },
  { destination: 'Kerala', title: 'Kerala Backwaters & Tea Gardens', days: '6 Days / 5 Nights' },
  { destination: 'Tokyo', title: 'Tokyo & Kyoto Discovery: Culture & Neon', days: '10 Days / 9 Nights' },
  { destination: 'Dubai', title: 'Dubai Extravaganza: Desert & Marina', days: '5 Days / 4 Nights' },
];

export interface VillaOption {
  city: string;
  location: string;
  name: string;
}

export const popularVillaDestinations: VillaOption[] = [
  { city: 'Goa', location: 'Candolim & Anjuna Beachfront', name: 'Villa Sol Candolim (4BHK Private Pool)' },
  { city: 'Bali', location: 'Seminyak & Ubud Coast', name: 'Seminyak Beachfront Pool Villa' },
  { city: 'Manali', location: 'Old Manali Apple Orchard', name: 'Whispering Pines Luxury Chalet' },
  { city: 'Lonavala', location: 'Khandala Valley View', name: 'The Cloud Estate Private Pool Villa' },
  { city: 'Dubai', location: 'Palm Jumeirah Waterfront', name: 'Royal Palm Signature Beach Villa' },
  { city: 'Jaipur', location: 'Amer & Kukas Valley', name: 'Heritage Haveli Private Pool Estate' },
  { city: 'Alibaug', location: 'Kihim & Mandwa Coastal', name: 'Sea Breeze Luxury Courtyard Villa' },
  { city: 'Shimla', location: 'Mashobra Pine Forest', name: 'The Cedar Ridge Heritage Chalet' },
];

export type ServiceCategory = 
  | 'flights' 
  | 'hotels' 
  | 'villas' 
  | 'holidays' 
  | 'trains' 
  | 'buses' 
  | 'cabs' 
  | 'tours' 
  | 'visa' 
  | 'insurance';

export interface HeroSlide {
  id: string;
  image: string;
  tagline: string;
}

export const heroSlides: HeroSlide[] = [
  {
    id: 'slide-hotel',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=85',
    tagline: 'Book the Finest Hotels & Luxury Stays with Us',
  },
  {
    id: 'slide-flight',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2000&q=85',
    tagline: 'Fly Anywhere with Guaranteed Best Airfares',
  },
  {
    id: 'slide-holiday',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85',
    tagline: 'Discover Unforgettable Holiday Packages & Tours',
  },
  {
    id: 'slide-villa',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=2000&q=85',
    tagline: 'Experience Handpicked Private Villas & Homestays',
  },
  {
    id: 'slide-train',
    image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=2000&q=85',
    tagline: 'Fast & Confirmed IRCTC Train Ticket Bookings',
  },
  {
    id: 'slide-cab',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=2000&q=85',
    tagline: 'Ride Easy with Reliable Airport & Outstation Cabs',
  },
];

interface ExplorePageProps {
  onNavigate?: (screen: ScreenType) => void;
  onSearchFlights?: (params: FlightSearchParams) => void;
  onSearchHotels?: (params: HotelSearchParams) => void;
  onSearchTrains?: (params: { fromCity: string; toCity: string; travelDate?: string }) => void;
  onSearchBuses?: (params: { 
    fromCity: string; 
    toCity: string; 
    travelDate?: string; 
    returnDate?: string; 
    seats?: string; 
    busType?: string; 
  }) => void;
  onSearchCabs?: (params: { city: string; pickup?: string; drop?: string }) => void;
  onSearchPackages?: (params: { destination: string }) => void;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ 
  onNavigate,
  onSearchFlights,
  onSearchHotels,
  onSearchTrains,
  onSearchBuses,
  onSearchCabs,
  onSearchPackages,
  onInitiateCheckout,
}) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [searchMode, setSearchMode] = useState<ServiceCategory>('flights');
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'multicity'>('oneway');
  const [specialFare, setSpecialFare] = useState('regular');
  const [offersCategory, setOffersCategory] = useState<'all' | 'flights' | 'hotels' | 'holidays' | 'trains' | 'cabs' | 'bank'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Flight search inputs
  const [originAirport, setOriginAirport] = useState<AirportOption>(popularAirports[0]); // DEL
  const [destinationAirport, setDestinationAirport] = useState<AirportOption>(popularAirports[1]); // BOM
  const [departDate, setDepartDate] = useState('2026-10-24');
  const [returnDate, setReturnDate] = useState('2026-10-31');
  const [hasReturnDate, setHasReturnDate] = useState(false);

  // Hotel search inputs
  const [hotelCity, setHotelCity] = useState<HotelCityOption>(popularHotelCities[0]); // Paris
  const [hotelCheckIn, setHotelCheckIn] = useState('2026-11-04');
  const [hotelCheckOut, setHotelCheckOut] = useState('2026-11-11');
  const [hotelGuests, setHotelGuests] = useState('1 Room, 2 Adults');

  // Train search inputs
  const [trainFromStation, setTrainFromStation] = useState<TrainStationOption>(popularTrainStations[0]); // NDLS
  const [trainToStation, setTrainToStation] = useState<TrainStationOption>(popularTrainStations[1]); // MMCT
  const [trainTravelDate, setTrainTravelDate] = useState('2026-10-24');
  const [trainClass, setTrainClass] = useState('All Classes');

  // Bus search inputs (Dedicated: From, Destination, Date of Going, Return Date, Seats & Preference)
  const [busFromCity, setBusFromCity] = useState<BusCityOption>(popularBusCities[0]); // Bengaluru
  const [busToCity, setBusToCity] = useState<BusCityOption>(popularBusCities[1]); // Goa
  const [busTravelDate, setBusTravelDate] = useState('2026-10-24');
  const [busReturnDate, setBusReturnDate] = useState('2026-10-28');
  const [hasBusReturnDate, setHasBusReturnDate] = useState(false);
  const [busSeats, setBusSeats] = useState('1 Seat');
  const [busTypePreference, setBusTypePreference] = useState('All Bus Types');

  // Cab search inputs (Dedicated: ONLY Pickup & Drop Location)
  const [cabCity, setCabCity] = useState<CabCityOption>(popularCabCities[0]); // Delhi
  const [cabPickupAddress, setCabPickupAddress] = useState(popularCabCities[0].pickup);
  const [cabDropAddress, setCabDropAddress] = useState(popularCabCities[0].drop);

  // Map Location Search Modal state
  const [mapModalState, setMapModalState] = useState<{
    isOpen: boolean;
    type: 'pickup' | 'drop';
    title: string;
  } | null>(null);

  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number } | null>({ lat: 28.5562, lon: 77.1000 });
  const [dropCoords, setDropCoords] = useState<{ lat: number; lon: number } | null>({ lat: 28.6315, lon: 77.2167 });
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimateResult | null>(null);

  // Update route estimate when coordinates change
  useEffect(() => {
    if (pickupCoords && dropCoords) {
      getRouteEstimateApi(pickupCoords.lat, pickupCoords.lon, dropCoords.lat, dropCoords.lon)
        .then((res) => {
          if (res) setRouteEstimate(res);
        })
        .catch(() => {});
    }
  }, [pickupCoords, dropCoords]);

  // Holiday search inputs
  const [holidayDestination, setHolidayDestination] = useState<HolidayOption>(popularHolidayThemes[0]); // Kashmir

  // Villa search inputs (Dedicated: ONLY Location & Check-in / Check-out Dates)
  const [villaDestination, setVillaDestination] = useState<VillaOption>(popularVillaDestinations[0]); // Goa
  const [villaCheckIn, setVillaCheckIn] = useState('2026-11-04');
  const [villaCheckOut, setVillaCheckOut] = useState('2026-11-08');

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<
    'origin' | 'destination' | 'hotel' | 'hotelGuests' | 'cabin' | 'passengers' | 
    'trainFrom' | 'trainTo' | 'trainClass' | 'busFrom' | 'busTo' | 'busSeats' | 
    'cabPickup' | 'cabDrop' | 'holiday' | 'villa' | 'visaCountry' | 'insuranceCountry' | 'tourCity' | null
  >(null);
  const [cabinClass, setCabinClass] = useState('Economy');
  const [passengerCount, setPassengerCount] = useState('1 Adult');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveSuggestions, setLiveSuggestions] = useState<ServiceLocationSuggestion[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [routeValidationError, setRouteValidationError] = useState<string | null>(null);

  // Visa & Insurance custom selection states
  const [selectedVisaCountry, setSelectedVisaCountry] = useState<{ name: string; code: string; flag: string; category: string; price: number }>({
    name: 'United Arab Emirates',
    code: 'AE',
    flag: '🇦🇪',
    category: '30-Days Express Tourist eVisa',
    price: 6499,
  });
  const [selectedInsuranceZone, setSelectedInsuranceZone] = useState<{ zone: string; maxCover: string; planName: string; price: number }>({
    zone: 'Worldwide (Includes USA, Schengen & Asia)',
    maxCover: '$250,000 USD Medical Cover',
    planName: 'Global Travel Shield Platinum',
    price: 850,
  });

  // Calendar modal state
  const [calendarModalState, setCalendarModalState] = useState<{
    isOpen: boolean;
    type: 'depart' | 'return' | 'checkIn' | 'checkOut' | 'trainDate' | 'busDate' | 'busReturnDate' | 'cabDate' | 'villaCheckIn' | 'villaCheckOut';
    title: string;
    date: string;
    minDate?: string;
  } | null>(null);

  const handleDateSelected = (newDate: string) => {
    if (!calendarModalState) return;
    const { type } = calendarModalState;
    if (type === 'depart') {
      setDepartDate(newDate);
      if (returnDate < newDate) {
        setReturnDate(newDate);
      }
    } else if (type === 'return') {
      setReturnDate(newDate);
      setHasReturnDate(true);
    } else if (type === 'checkIn') {
      setHotelCheckIn(newDate);
      if (hotelCheckOut < newDate) {
        setHotelCheckOut(newDate);
      }
    } else if (type === 'checkOut') {
      setHotelCheckOut(newDate);
    } else if (type === 'trainDate') {
      setTrainTravelDate(newDate);
    } else if (type === 'busDate') {
      setBusTravelDate(newDate);
      if (busReturnDate < newDate) {
        setBusReturnDate(newDate);
      }
    } else if (type === 'busReturnDate') {
      setBusReturnDate(newDate);
      setHasBusReturnDate(true);
    } else if (type === 'villaCheckIn') {
      setVillaCheckIn(newDate);
      if (villaCheckOut < newDate) {
        setVillaCheckOut(newDate);
      }
    } else if (type === 'villaCheckOut') {
      setVillaCheckOut(newDate);
    }
    setCalendarModalState(null);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Service-specific debounced location suggestion fetcher
  useEffect(() => {
    if (!activeDropdown) {
      setLiveSuggestions([]);
      return;
    }

    let service = '';
    if (activeDropdown === 'origin' || activeDropdown === 'destination') service = 'flights';
    else if (activeDropdown === 'hotel') service = 'hotels';
    else if (activeDropdown === 'villa') service = 'villas';
    else if (activeDropdown === 'holiday') service = 'holidays';
    else if (activeDropdown === 'trainFrom' || activeDropdown === 'trainTo') service = 'trains';
    else if (activeDropdown === 'busFrom' || activeDropdown === 'busTo') service = 'buses';
    else if (activeDropdown === 'visaCountry') service = 'visa';
    else if (activeDropdown === 'insuranceCountry') service = 'insurance';
    else if (activeDropdown === 'tourCity') service = 'tours';
    else return;

    let isMounted = true;
    setIsSearchingLocation(true);
    const timer = setTimeout(async () => {
      try {
        const results = await getServiceLocationsSuggestApi(service, searchQuery, 15);
        if (isMounted) {
          setLiveSuggestions(results);
        }
      } catch (err) {
        console.warn('Suggest error:', err);
      } finally {
        if (isMounted) setIsSearchingLocation(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeDropdown, searchQuery]);

  // Auto-advance slideshow timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handleSwapAirports = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRouteValidationError(null);
    setIsSwapping(true);
    setTimeout(() => {
      const temp = originAirport;
      setOriginAirport(destinationAirport);
      setDestinationAirport(temp);
      setIsSwapping(false);
    }, 200);
  };

  const handleSwapStations = (e: React.MouseEvent) => {
    e.stopPropagation();
    const temp = trainFromStation;
    setTrainFromStation(trainToStation);
    setTrainToStation(temp);
  };

  const handleSwapBusCities = (e: React.MouseEvent) => {
    e.stopPropagation();
    const temp = busFromCity;
    setBusFromCity(busToCity);
    setBusToCity(temp);
  };

  const handleSwapCabLocations = (e: React.MouseEvent) => {
    e.stopPropagation();
    const temp = cabPickupAddress;
    setCabPickupAddress(cabDropAddress);
    setCabDropAddress(temp);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleExecuteFlightSearch = () => {
    if (originAirport.code === destinationAirport.code) {
      setRouteValidationError('Departure and destination airports cannot be identical. Please select different airports.');
      return;
    }
    setRouteValidationError(null);
    if (onSearchFlights) {
      onSearchFlights({
        fromCode: originAirport.code,
        fromCity: originAirport.city,
        toCode: destinationAirport.code,
        toCity: destinationAirport.city,
        departDate,
        returnDate: hasReturnDate ? returnDate : undefined,
      });
    } else if (onNavigate) {
      onNavigate('flights');
    }
  };

  const handleExecuteHotelSearch = () => {
    if (onSearchHotels) {
      onSearchHotels({
        city: hotelCity.city,
        checkIn: hotelCheckIn,
        checkOut: hotelCheckOut,
      });
    } else if (onNavigate) {
      onNavigate('hotels');
    }
  };

  const handleMasterSearch = () => {
    if (searchMode === 'flights') {
      handleExecuteFlightSearch();
    } else if (searchMode === 'hotels') {
      handleExecuteHotelSearch();
    } else if (searchMode === 'villas') {
      if (onSearchHotels) {
        onSearchHotels({
          city: villaDestination.city,
          checkIn: villaCheckIn,
          checkOut: villaCheckOut,
          propertyType: 'VILLA',
        });
      } else if (onNavigate) {
        onNavigate('hotels');
      }
    } else if (searchMode === 'trains') {
      if (onSearchTrains) {
        onSearchTrains({
          fromCity: trainFromStation.city,
          toCity: trainToStation.city,
          travelDate: trainTravelDate,
        });
      } else if (onNavigate) {
        onNavigate('trains');
      }
    } else if (searchMode === 'buses') {
      if (onSearchBuses) {
        onSearchBuses({
          fromCity: busFromCity.city,
          toCity: busToCity.city,
          travelDate: busTravelDate,
          returnDate: hasBusReturnDate ? busReturnDate : undefined,
          seats: busSeats,
          busType: busTypePreference,
        });
      } else if (onNavigate) {
        onNavigate('buses');
      }
    } else if (searchMode === 'cabs') {
      if (onSearchCabs) {
        onSearchCabs({
          city: cabCity.city,
          pickup: cabPickupAddress,
          drop: cabDropAddress,
        });
      } else if (onNavigate) {
        onNavigate('cabs');
      }
    } else if (searchMode === 'holidays') {
      if (onSearchPackages) {
        onSearchPackages({
          destination: holidayDestination.destination,
        });
      } else if (onNavigate) {
        onNavigate('packages');
      }
    } else if (searchMode === 'tours') {
      handleBookAttraction({
        name: 'Burj Khalifa: At The Top (124th + 125th Floor)',
        city: 'Dubai, UAE',
        price: 3850,
      });
    } else if (searchMode === 'visa') {
      handleApplyVisa({
        country: `${selectedVisaCountry.flag} ${selectedVisaCountry.name}`,
        type: selectedVisaCountry.category,
        price: selectedVisaCountry.price,
      });
    } else if (searchMode === 'insurance') {
      handleBuyInsurance({
        planName: selectedInsuranceZone.planName,
        cover: `${selectedInsuranceZone.zone} · ${selectedInsuranceZone.maxCover}`,
        price: selectedInsuranceZone.price,
      });
    }
  };

  // Direct checkout helpers
  const handleBookTrain = (train: { name: string; from: string; to: string; price: number; class: string }) => {
    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'TRAIN',
        itemId: '3a823f7d-7480-46d2-94c2-442092bc4f2b',
        title: train.name,
        subtitle: `${train.class} · Instant PNR Confirmation`,
        routeInfo: `${train.from} → ${train.to}`,
        pricing: {
          baseAmount: train.price,
          taxes: Math.round(train.price * 0.05),
          discount: 100,
          insurance: 49,
        },
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleBookBus = (bus: { name: string; from: string; to: string; price: number }) => {
    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'BUS',
        itemId: '145c8396-2c87-4c67-bb1d-356fefb113ad',
        title: bus.name,
        subtitle: 'AC Sleeper / Seater · GPS Tracking & Live ETA',
        routeInfo: `${bus.from} → ${bus.to}`,
        pricing: {
          baseAmount: bus.price,
          taxes: Math.round(bus.price * 0.05),
          discount: 50,
          insurance: 25,
        },
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleBookCab = (cab: { name: string; pickup: string; drop: string; price: number }) => {
    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'CAB',
        itemId: 'c394fa80-9c72-4868-8a22-d91b7a624d3d',
        title: cab.name,
        subtitle: 'Dedicated Chauffeur · Tolls & Taxes Included',
        routeInfo: `${cab.pickup} → ${cab.drop}`,
        pricing: {
          baseAmount: cab.price,
          taxes: Math.round(cab.price * 0.05),
          discount: 75,
          insurance: 0,
        },
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleBookPackage = (pkg: { name: string; days: number; nights: number; price: number }) => {
    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'PACKAGE',
        itemId: '69f529cb-0a00-4b6e-bc78-b1be05991eab',
        title: pkg.name,
        subtitle: `${pkg.days} Days / ${pkg.nights} Nights · Flights + 5-Star Stay + Sightseeing`,
        pricing: {
          baseAmount: pkg.price,
          taxes: Math.round(pkg.price * 0.18),
          discount: 2500,
          insurance: 499,
        },
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleBookVilla = (villa: { name: string; location: string; price: number }) => {
    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'HOTEL',
        itemId: '7aff0578-dbe1-4cda-b3cc-4e03277bf012',
        title: villa.name,
        subtitle: 'Entire Luxury Pool Villa · 4 Bedrooms · Private Chef',
        routeInfo: villa.location,
        pricing: {
          baseAmount: villa.price,
          taxes: Math.round(villa.price * 0.12),
          discount: 1000,
          insurance: 249,
        },
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleBookAttraction = (act: { name: string; city: string; price: number }) => {
    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'ACTIVITY',
        title: act.name,
        subtitle: 'Instant Mobile Voucher · Skip-the-Line Entry · English Guide',
        routeInfo: act.city,
        pricing: {
          baseAmount: act.price,
          taxes: Math.round(act.price * 0.05),
          discount: 200,
          insurance: 0,
        },
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleApplyVisa = (visaItem: { country: string; type: string; price: number }) => {
    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'VISA',
        title: `${visaItem.country} ${visaItem.type}`,
        subtitle: '100% Online Document Upload · Dedicated Visa Officer · 99.4% Approval',
        routeInfo: `${visaItem.country} (Express 48h Processing)`,
        pricing: {
          baseAmount: visaItem.price,
          taxes: Math.round(visaItem.price * 0.18),
          discount: 500,
          insurance: 0,
        },
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleBuyInsurance = (ins: { planName: string; cover: string; price: number }) => {
    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'INSURANCE',
        title: ins.planName,
        subtitle: `${ins.cover} · Cashless Hospitalization · COVID-19 & Baggage Protection`,
        routeInfo: 'Worldwide Coverage (Single Trip)',
        pricing: {
          baseAmount: ins.price,
          taxes: Math.round(ins.price * 0.18),
          discount: 100,
          insurance: 0,
        },
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const filteredAirports = popularAirports.filter(a => 
    a.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHotelCities = popularHotelCities.filter(c =>
    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#333333] font-sans antialiased">
      {/* ── 1. DYNAMIC TRAVEL HERO SLIDESHOW WITH CHANGING IMAGES & TEXT ── */}
      <section 
        className="relative w-full h-[450px] sm:h-[490px] md:h-[530px] overflow-hidden select-none bg-slate-950"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        aria-label="Featured Travel Destinations Slideshow"
      >
        {/* Background Slides with Crossfade Animation */}
        {heroSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img 
              src={slide.image} 
              alt={slide.tagline}
              className={`w-full h-full object-cover object-center filter brightness-[0.78] contrast-105 transition-transform duration-[6000ms] ease-out ${
                idx === currentSlide ? 'scale-105' : 'scale-100'
              }`}
            />
            {/* Atmospheric gradient layers:
                - Dark top gradient ensures the transparent Header navigation is crystal-clear
                - Dark bottom gradient ensures strong contrast and seamless transition to the search console */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
            <div className="absolute inset-0 bg-radial from-transparent via-black/15 to-black/50 pointer-events-none" />
          </div>
        ))}

        {/* Foreground Content: Only the Tagline changing with each image */}
        <div className="relative z-20 h-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center pt-16 sm:pt-20 pb-16 sm:pb-20">
          <h1 
            key={`tagline-${currentSlide}`}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] animate-fadeIn max-w-4xl"
          >
            {heroSlides[currentSlide].tagline}
          </h1>
        </div>
      </section>

      {/* ── 2. SEARCH ENGINE CONSOLE PLACED BELOW THE HERO SLIDESHOW ── */}
      <main id="search-console-section" className="relative -mt-10 sm:-mt-14 md:-mt-16 z-20 pb-20 px-3 sm:px-6 lg:px-8 max-w-[1240px] mx-auto">
        {/* Category Navigation Ribbon (Floating White Pill Card) */}
        <nav 
          aria-label="Service Categories"
          className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] border border-gray-100 px-2 sm:px-6 py-2.5 mb-4 max-w-[1180px] mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-1 sm:gap-2 select-none"
        >
          {([
            { id: 'flights' as const, label: 'Flights', Icon: FlightsIsometricIcon },
            { id: 'hotels' as const, label: 'Hotels', Icon: HotelsIsometricIcon },
            { id: 'villas' as const, label: 'Villas & Homestays', Icon: VillasIsometricIcon },
            { id: 'holidays' as const, label: 'Holiday Packages', Icon: HolidaysIsometricIcon },
            { id: 'trains' as const, label: 'Trains', Icon: TrainsIsometricIcon },
            { id: 'buses' as const, label: 'Buses', Icon: BusesIsometricIcon },
            { id: 'cabs' as const, label: 'Cabs', Icon: CabsIsometricIcon },
            { id: 'tours' as const, label: 'Tours & Attractions', Icon: ToursIsometricIcon },
            { id: 'visa' as const, label: 'Visa', Icon: VisaIsometricIcon },
            { id: 'insurance' as const, label: 'Travel Insurance', Icon: InsuranceIsometricIcon },
          ]).map((item) => {
            const isActive = searchMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { setSearchMode(item.id); setActiveDropdown(null); }}
                className={`flex flex-col items-center justify-between min-w-[70px] sm:min-w-[84px] py-1 px-1 sm:px-1.5 transition-all cursor-pointer relative group ${
                  isActive 
                    ? 'text-[#008cff]' 
                    : 'text-gray-700 hover:text-[#008cff]'
                }`}
              >
                <div className="relative flex items-center justify-center h-10 w-10 mb-1">
                  <item.Icon active={isActive} className="w-9 h-9" />
                </div>
                <span className={`text-[11px] sm:text-[11.5px] leading-tight text-center max-w-[90px] ${
                  isActive ? 'font-black text-[#008cff]' : 'font-semibold text-gray-700 group-hover:text-[#008cff]'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-2.5 left-2 right-2 h-[3px] bg-[#008cff] rounded-t-full shadow-xs" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── 3. SEARCH ENGINE CONSOLE CARD ── */}
        <section 
          ref={dropdownRef}
          className="relative bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] pt-6 pb-12 px-6 lg:px-8 border border-gray-100"
        >
          {/* Radio Trip Type Bar - shown for flights */}
          {searchMode === 'flights' && (
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 text-xs font-semibold">
              <div className="flex items-center space-x-6 text-gray-700">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="trip-type" 
                    checked={tripType === 'oneway'} 
                    onChange={() => { setTripType('oneway'); setHasReturnDate(false); }} 
                    className="accent-[#008cff] w-4 h-4 cursor-pointer"
                  />
                  <span className={tripType === 'oneway' ? 'font-bold text-gray-900' : 'text-gray-600'}>One Way</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="trip-type" 
                    checked={tripType === 'roundtrip'} 
                    onChange={() => { setTripType('roundtrip'); setHasReturnDate(true); }} 
                    className="accent-[#008cff] w-4 h-4 cursor-pointer"
                  />
                  <span className={tripType === 'roundtrip' ? 'font-bold text-gray-900' : 'text-gray-600'}>Round Trip</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="trip-type" 
                    checked={tripType === 'multicity'} 
                    onChange={() => { setTripType('multicity'); setHasReturnDate(false); }} 
                    className="accent-[#008cff] w-4 h-4 cursor-pointer"
                  />
                  <span className={tripType === 'multicity' ? 'font-bold text-gray-900' : 'text-gray-600'}>Multi City</span>
                </label>
              </div>

              <div className="text-gray-500 font-medium text-xs hidden sm:flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Book Domestic &amp; International Flights with Special Student &amp; Armed Fares</span>
              </div>
            </div>
          )}

          {searchMode === 'hotels' && (
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 text-xs font-semibold">
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="font-bold text-gray-900">Book Hotels &amp; Boutique Stays</span>
                <span className="bg-blue-50 text-[#008cff] px-2 py-0.5 rounded text-[11px] font-bold">Upto 40% OFF</span>
              </div>
              <div className="text-gray-500 text-[11px] hidden sm:block">
                Free Cancellation on Select Rates
              </div>
            </div>
          )}

          {searchMode === 'villas' && (
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 text-xs font-semibold">
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="font-bold text-gray-900">Villas, Homestays &amp; Vacation Rentals</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold">Entire Home with Private Pool</span>
              </div>
              <div className="text-gray-500 text-[11px] hidden sm:block">
                Pet-Friendly &amp; Verified Hosts
              </div>
            </div>
          )}

          {searchMode === 'holidays' && (
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 text-xs font-semibold">
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="font-bold text-gray-900">Customized Holiday Packages</span>
                <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[11px] font-bold">Flights + 5-Star Hotel + Sightseeing</span>
              </div>
              <div className="text-gray-500 text-[11px] hidden sm:block">
                Zero Cost EMI Available
              </div>
            </div>
          )}

          {searchMode === 'trains' && (
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 text-xs font-semibold">
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="font-bold text-gray-900">IRCTC Authorized Train Ticket Booking</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold">Zero Gateway Charges</span>
              </div>
              <div className="text-gray-500 text-[11px] hidden sm:block">
                Live PNR &amp; Seat Availability Status
              </div>
            </div>
          )}

          {searchMode === 'buses' && (
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 text-xs font-semibold">
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="font-bold text-gray-900">Online Bus Ticket Booking</span>
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[11px] font-bold">AC Sleeper &amp; Volvo Electric</span>
              </div>
              <div className="text-gray-500 text-[11px] hidden sm:block">
                Live GPS Tracking &amp; Sanitized Fleet
              </div>
            </div>
          )}

          {searchMode === 'cabs' && (
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 text-xs font-semibold">
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="font-bold text-gray-900">Airport &amp; Outstation Cab Booking</span>
                <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[11px] font-bold">Zero Surge Pricing</span>
              </div>
              <div className="text-gray-500 text-[11px] hidden sm:block">
                Professional Chauffeurs &amp; Clean AC Cars
              </div>
            </div>
          )}

          {searchMode === 'tours' && (
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 text-xs font-semibold">
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="font-bold text-gray-900">Tours, Activities &amp; Sightseeing Attractions</span>
                <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded text-[11px] font-bold">Skip-the-Line E-Tickets</span>
              </div>
              <div className="text-gray-500 text-[11px] hidden sm:block">
                Instant Confirmation &amp; Best Price Guarantee
              </div>
            </div>
          )}

          {searchMode === 'visa' && (
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 text-xs font-semibold">
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="font-bold text-gray-900">Hassle-Free Online Tourist Visa Services</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold">99.4% Approval Rate</span>
              </div>
              <div className="text-gray-500 text-[11px] hidden sm:block">
                Dedicated Visa Expert &amp; Document Review
              </div>
            </div>
          )}

          {searchMode === 'insurance' && (
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 text-xs font-semibold">
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="font-bold text-gray-900">International &amp; Domestic Travel Insurance</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold">Embassy &amp; Schengen Compliant</span>
              </div>
              <div className="text-gray-500 text-[11px] hidden sm:block">
                Instant Policy PDF in 2 Minutes
              </div>
            </div>
          )}

          {/* ── MODE 1: FLIGHTS SEGMENTED INPUT GRID ── */}
          {searchMode === 'flights' && (
            <div className="relative grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible hover:border-blue-300 transition">
              {/* FROM Block */}
              <div 
                onClick={() => { setActiveDropdown(activeDropdown === 'origin' ? null : 'origin'); setSearchQuery(''); }}
                className="md:col-span-3 p-4 cursor-pointer hover:bg-blue-50/40 transition rounded-l-xl relative"
              >
                <span className="text-[12px] font-normal text-gray-500 block">From</span>
                <span className="text-3xl font-extrabold text-gray-900 block tracking-tight my-0.5">{originAirport.city}</span>
                <span className="text-[11px] text-gray-500 truncate block font-normal">{originAirport.code}, {originAirport.name}</span>
              </div>

              {/* Interchange Swap Button (Mobile & Desktop) */}
              <div className="absolute right-4 top-[78px] md:top-1/2 md:left-[25%] md:right-auto -translate-y-1/2 md:-translate-x-1/2 z-20">
                <button 
                  type="button" 
                  onClick={handleSwapAirports}
                  aria-label="Swap Cities"
                  className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 hover:border-blue-400 flex items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-[18px] text-[#008cff] transition-transform duration-300 ${isSwapping ? 'rotate-180' : ''}`}>
                    swap_horiz
                  </span>
                </button>
              </div>

              {/* TO Block */}
              <div 
                onClick={() => { setActiveDropdown(activeDropdown === 'destination' ? null : 'destination'); setSearchQuery(''); }}
                className="md:col-span-3 p-4 cursor-pointer hover:bg-blue-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative pl-4 md:pl-6"
              >
                <span className="text-[12px] font-normal text-gray-500 block">To</span>
                <span className="text-3xl font-extrabold text-gray-900 block tracking-tight my-0.5">{destinationAirport.city}</span>
                <span className="text-[11px] text-gray-500 truncate block font-normal">{destinationAirport.code}, {destinationAirport.name}</span>
              </div>

              {/* DEPARTURE Block */}
              <div 
                onClick={() => setCalendarModalState({
                  isOpen: true,
                  type: 'depart',
                  title: 'Select Departure Date',
                  date: departDate,
                  minDate: undefined,
                })}
                className="md:col-span-2 p-4 cursor-pointer hover:bg-blue-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative"
              >
                <div className="flex items-center space-x-1 text-gray-500">
                  <span className="text-[12px] font-normal">Departure</span>
                  <span className="material-symbols-outlined text-[14px] text-[#008cff]">calendar_today</span>
                </div>
                <div className="flex items-baseline space-x-1 my-0.5">
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {new Date(departDate).getDate()}
                  </span>
                  <span className="text-lg font-bold text-gray-800">
                    {new Date(departDate).toLocaleDateString('en-US', { month: 'short' })}'{new Date(departDate).getFullYear().toString().slice(2)}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 block font-normal">
                  {new Date(departDate).toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
              </div>

              {/* RETURN Block */}
              <div 
                onClick={() => {
                  if (!hasReturnDate) {
                    setHasReturnDate(true);
                  }
                  setCalendarModalState({
                    isOpen: true,
                    type: 'return',
                    title: 'Select Return Date',
                    date: returnDate,
                    minDate: departDate,
                  });
                }}
                className="md:col-span-2 p-4 cursor-pointer hover:bg-blue-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 flex flex-col justify-start relative"
              >
                <div className="flex items-center space-x-1 text-gray-500">
                  <span className="text-[12px] font-normal">Return</span>
                  <span className="material-symbols-outlined text-[14px] text-[#008cff]">event_repeat</span>
                </div>
                {hasReturnDate ? (
                  <>
                    <div className="flex items-baseline space-x-1 my-0.5">
                      <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {new Date(returnDate).getDate()}
                      </span>
                      <span className="text-lg font-bold text-gray-800">
                        {new Date(returnDate).toLocaleDateString('en-US', { month: 'short' })}'{new Date(returnDate).getFullYear().toString().slice(2)}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 block font-normal">
                      {new Date(returnDate).toLocaleDateString('en-US', { weekday: 'long' })}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-gray-400 mt-2 font-normal leading-tight">
                    Tap to add a return date for bigger discounts
                  </span>
                )}
              </div>

              {/* TRAVELLERS & CLASS Block */}
              <div 
                onClick={() => setActiveDropdown(activeDropdown === 'passengers' ? null : 'passengers')}
                className="md:col-span-2 p-4 cursor-pointer hover:bg-blue-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 rounded-r-xl"
              >
                <div className="flex items-center space-x-1 text-gray-500">
                  <span className="text-[12px] font-normal">Travellers &amp; Class</span>
                  <span className="material-symbols-outlined text-[14px] text-[#008cff]">expand_more</span>
                </div>
                <div className="flex items-baseline space-x-1 my-0.5">
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {passengerCount.startsWith('1') ? '1' : '2'}
                  </span>
                  <span className="text-base font-bold text-gray-800">Traveller</span>
                </div>
                <span className="text-[11px] text-gray-500 truncate block font-normal">{cabinClass}</span>
              </div>

              {/* Airport Search Dropdown Popover (Airports Only) */}
              {activeDropdown && (activeDropdown === 'origin' || activeDropdown === 'destination') && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-full z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-96 max-w-[95vw] ${
                    activeDropdown === 'origin' ? 'left-0' : 'left-0 sm:right-0 sm:left-auto'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <span className="text-xs font-bold text-gray-800">
                      Select {activeDropdown === 'origin' ? 'Departure Airport' : 'Destination Airport'}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setActiveDropdown(null)} 
                      className="text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  <div className="relative mb-3">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">flight_takeoff</span>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type city or airport code (e.g. DEL, BOM, DXB, LHR)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#008cff]"
                    />
                    {isSearchingLocation && (
                      <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-gray-400 text-[16px] animate-spin">
                        progress_activity
                      </span>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
                    {(liveSuggestions.length > 0
                      ? liveSuggestions
                      : filteredAirports.map(a => ({
                          id: `apt-${a.code}`,
                          name: a.name,
                          display_name: `${a.city} (${a.code}) — ${a.name}`,
                          secondary_description: `${a.city}, ${a.country}`,
                          city: a.city,
                          country: a.country,
                          category: 'AIRPORT' as const,
                          category_label: 'Airport',
                          code: a.code,
                        }))
                    ).map(apt => (
                      <div
                        key={apt.id || apt.code}
                        onClick={() => {
                          setRouteValidationError(null);
                          const selected: AirportOption = {
                            code: apt.code || 'DEL',
                            city: apt.city || apt.name,
                            name: apt.name,
                            country: apt.country || 'India',
                          };
                          if (activeDropdown === 'origin') setOriginAirport(selected);
                          else setDestinationAirport(selected);
                          setActiveDropdown(null);
                          setSearchQuery('');
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900">{apt.city}, {apt.country}</span>
                          <span className="text-[11px] text-gray-500 truncate max-w-[200px]">{apt.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#008cff] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {apt.code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Travellers & Cabin Class Dropdown Popover */}
              {activeDropdown === 'passengers' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full right-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72"
                >
                  <span className="text-xs font-bold text-gray-800 block mb-2">Cabin Class</span>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {['Economy', 'Premium Econ', 'Business', 'First Class'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCabinClass(c)}
                        className={`p-1.5 text-xs rounded border text-center font-medium ${
                          cabinClass === c ? 'bg-[#008cff] text-white border-[#008cff]' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-800 block mb-2">Number of Travellers</span>
                  <div className="flex flex-col gap-1">
                    {['1 Adult', '2 Adults', '2 Adults, 1 Child', 'Family (2 Adults, 2 Kids)'].map(p => (
                      <div
                        key={p}
                        onClick={() => { setPassengerCount(p); setActiveDropdown(null); }}
                        className={`p-2 rounded text-xs cursor-pointer ${passengerCount === p ? 'bg-blue-50 text-[#008cff] font-bold' : 'hover:bg-gray-50'}`}
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MODE 2: HOTELS SEARCH ── */}
          {searchMode === 'hotels' && (
            <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible hover:border-blue-300 transition relative bg-white">
              <div 
                onClick={() => setActiveDropdown(activeDropdown === 'hotel' ? null : 'hotel')}
                className="md:col-span-4 p-4 cursor-pointer hover:bg-blue-50/40 transition rounded-l-xl relative"
              >
                <div className="flex items-center space-x-1.5 text-gray-500 mb-0.5">
                  <span className="material-symbols-outlined text-[15px] text-[#008cff]">hotel</span>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">City, Location or Property</span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 block tracking-tight my-0.5">{hotelCity.city}</span>
                <span className="text-[11px] text-gray-500 truncate block font-normal">{hotelCity.region}, {hotelCity.country}</span>
              </div>
              <div 
                onClick={() => setCalendarModalState({
                  isOpen: true,
                  type: 'checkIn',
                  title: 'Select Check-in Date',
                  date: hotelCheckIn,
                  minDate: undefined,
                })}
                className="md:col-span-3 p-4 cursor-pointer hover:bg-blue-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative"
              >
                <div className="flex items-center space-x-1 text-gray-500 mb-0.5">
                  <span className="material-symbols-outlined text-[14px] text-[#008cff]">calendar_today</span>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Check-in</span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 block tracking-tight my-0.5">{hotelCheckIn}</span>
                <span className="text-[11px] text-gray-500 block font-normal">
                  {new Date(hotelCheckIn).toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
              </div>
              <div 
                onClick={() => setCalendarModalState({
                  isOpen: true,
                  type: 'checkOut',
                  title: 'Select Check-out Date',
                  date: hotelCheckOut,
                  minDate: hotelCheckIn,
                })}
                className="md:col-span-3 p-4 cursor-pointer hover:bg-blue-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative"
              >
                <div className="flex items-center space-x-1 text-gray-500 mb-0.5">
                  <span className="material-symbols-outlined text-[14px] text-[#008cff]">event_repeat</span>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Check-out</span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 block tracking-tight my-0.5">{hotelCheckOut}</span>
                <span className="text-[11px] text-gray-500 block font-normal">
                  {new Date(hotelCheckOut).toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
              </div>
              <div 
                onClick={() => setActiveDropdown(activeDropdown === 'hotelGuests' ? null : 'hotelGuests')}
                className="md:col-span-2 p-4 cursor-pointer hover:bg-blue-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 rounded-r-xl relative"
              >
                <div className="flex items-center space-x-1 text-gray-500 mb-0.5">
                  <span className="material-symbols-outlined text-[14px] text-[#008cff]">group</span>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Rooms &amp; Guests</span>
                </div>
                <span className="text-xl sm:text-2xl font-extrabold text-gray-900 block tracking-tight my-0.5">
                  {hotelGuests.split(',')[0]}
                </span>
                <span className="text-[11px] text-blue-700 font-semibold truncate block">
                  {hotelGuests.split(',')[1] || '2 Adults'}
                </span>
              </div>

              {/* Hotel Destination Popover (Worldwide Destinations Allowed) */}
              {activeDropdown === 'hotel' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-[420px] max-w-[95vw] animate-scaleIn"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-800">Select City, Destination or Landmark</span>
                    <button type="button" onClick={() => setActiveDropdown(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  <div className="relative mb-3">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">search</span>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search any destination worldwide (e.g. Paris, Manali, Tokyo, Zurich)..."
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#008cff]"
                      autoFocus
                    />
                    {isSearchingLocation && (
                      <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-gray-400 text-[16px] animate-spin">
                        progress_activity
                      </span>
                    )}
                  </div>

                  {/* Immediate Custom Destination Option */}
                  {searchQuery.trim().length > 1 && (
                    <div 
                      onClick={() => {
                        const cleanQ = searchQuery.trim();
                        setHotelCity({
                          city: cleanQ,
                          region: 'Destination Search',
                          country: 'Worldwide',
                        });
                        setActiveDropdown(null);
                        setSearchQuery('');
                      }}
                      className="mb-2 p-2 rounded-lg bg-blue-50/70 hover:bg-blue-100 border border-blue-200 cursor-pointer flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-[#008cff] text-[18px]">travel_explore</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#008cff]">Search all stays in "{searchQuery.trim()}"</span>
                          <span className="text-[10px] text-gray-500">Query available hotels in this destination</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward</span>
                    </div>
                  )}

                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Verified Destinations</span>
                  <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                    {(liveSuggestions.length > 0
                      ? liveSuggestions
                      : filteredHotelCities.map(c => ({
                          id: `hc-${c.city}`,
                          name: c.city,
                          display_name: `${c.city}, ${c.country}`,
                          secondary_description: c.region,
                          city: c.city,
                          country: c.country,
                          category: 'LOCALITY' as const,
                          category_label: 'Destination',
                        }))
                    ).map(c => (
                      <div
                        key={c.id || c.name}
                        onClick={() => {
                          setHotelCity({
                            city: c.city || c.name,
                            region: c.secondary_description || c.city || c.name,
                            country: c.country || 'Worldwide',
                          });
                          setActiveDropdown(null);
                          setSearchQuery('');
                        }}
                        className="p-2 rounded-lg hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center transition"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{c.city || c.name}, {c.country}</span>
                          <span className="text-gray-500 text-[11px] truncate max-w-[240px]">{c.secondary_description}</span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {c.category_label || 'Destination'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rooms & Guests Popover */}
              {activeDropdown === 'hotelGuests' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full right-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72 animate-scaleIn"
                >
                  <span className="text-xs font-bold text-gray-800 block mb-2">Select Rooms &amp; Guests</span>
                  <div className="flex flex-col gap-1">
                    {[
                      '1 Room, 1 Adult',
                      '1 Room, 2 Adults',
                      '1 Room, 3 Adults',
                      '2 Rooms, 4 Adults',
                      'Family Suite (2 Adults, 2 Kids)',
                    ].map((g) => (
                      <div
                        key={g}
                        onClick={() => { setHotelGuests(g); setActiveDropdown(null); }}
                        className={`p-2 rounded text-xs cursor-pointer flex items-center justify-between transition ${
                          hotelGuests === g ? 'bg-blue-50 text-[#008cff] font-bold' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span>{g}</span>
                        {hotelGuests === g && <span className="material-symbols-outlined text-[#008cff] text-sm">check</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MODE 3: TRAINS (IRCTC LIVE) ── */}
          {searchMode === 'trains' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible hover:border-emerald-300 transition relative bg-white">
                {/* From Station */}
                <div 
                  onClick={() => { setActiveDropdown(activeDropdown === 'trainFrom' ? null : 'trainFrom'); setSearchQuery(''); }}
                  className="md:col-span-4 p-4 cursor-pointer hover:bg-emerald-50/40 transition rounded-l-xl relative"
                >
                  <span className="text-[12px] font-normal text-gray-500 block">From Station</span>
                  <div className="flex items-baseline space-x-1.5 my-0.5">
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{trainFromStation.city}</span>
                    <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">({trainFromStation.code})</span>
                  </div>
                  <span className="text-[11px] text-gray-500 truncate block font-normal">{trainFromStation.name}</span>

                  {/* Swap Button */}
                  <button
                    type="button"
                    onClick={handleSwapStations}
                    className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 hover:scale-105 active:scale-95 transition cursor-pointer"
                    title="Swap stations"
                  >
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">sync_alt</span>
                  </button>
                </div>

                {/* To Station */}
                <div 
                  onClick={() => { setActiveDropdown(activeDropdown === 'trainTo' ? null : 'trainTo'); setSearchQuery(''); }}
                  className="md:col-span-3 p-4 cursor-pointer hover:bg-emerald-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative pl-4 md:pl-6"
                >
                  <span className="text-[12px] font-normal text-gray-500 block">To Station</span>
                  <div className="flex items-baseline space-x-1.5 my-0.5">
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{trainToStation.city}</span>
                    <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">({trainToStation.code})</span>
                  </div>
                  <span className="text-[11px] text-gray-500 truncate block font-normal">{trainToStation.name}</span>
                </div>

                {/* Travel Date */}
                <div 
                  onClick={() => setCalendarModalState({
                    isOpen: true,
                    type: 'trainDate',
                    title: 'Select Train Travel Date',
                    date: trainTravelDate,
                    minDate: undefined,
                  })}
                  className="md:col-span-3 p-4 cursor-pointer hover:bg-emerald-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative"
                >
                  <div className="flex items-center space-x-1 text-gray-500">
                    <span className="text-[12px] font-normal">Travel Date</span>
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">calendar_today</span>
                  </div>
                  <div className="flex items-baseline space-x-1 my-0.5">
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      {new Date(trainTravelDate).getDate()}
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {new Date(trainTravelDate).toLocaleDateString('en-US', { month: 'short' })}'{new Date(trainTravelDate).getFullYear().toString().slice(2)}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 block font-normal">
                    {new Date(trainTravelDate).toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                </div>

                {/* Travel Class */}
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'trainClass' ? null : 'trainClass')}
                  className="md:col-span-2 p-4 cursor-pointer hover:bg-emerald-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 rounded-r-xl relative"
                >
                  <div className="flex items-center space-x-1 text-gray-500">
                    <span className="text-[12px] font-normal">Class</span>
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">expand_more</span>
                  </div>
                  <span className="text-lg font-extrabold text-gray-900 block tracking-tight my-1 line-clamp-1">{trainClass}</span>
                  <span className="text-[11px] text-emerald-700 font-semibold truncate block">IRCTC Authorized</span>
                </div>

                {/* Train Class Popover */}
                {activeDropdown === 'trainClass' && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-56 animate-scaleIn"
                  >
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Select Travel Class</span>
                    <div className="flex flex-col gap-1">
                      {['All Classes', 'Exec. Chair Car (EC)', 'AC 3 Tier (3A)', 'AC 2 Tier (2A)', 'Sleeper (SL)'].map((cls) => (
                        <div 
                          key={cls}
                          onClick={() => {
                            setTrainClass(cls);
                            setActiveDropdown(null);
                          }}
                          className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition ${trainClass === cls ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          <span>{cls}</span>
                          {trainClass === cls && <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Train Station Dropdown Popover (Railway Stations Only) */}
                {activeDropdown && (activeDropdown === 'trainFrom' || activeDropdown === 'trainTo') && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-96 animate-scaleIn"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-800">
                        Select {activeDropdown === 'trainFrom' ? 'Boarding Railway Station' : 'Destination Railway Station'}
                      </span>
                      <button type="button" onClick={() => setActiveDropdown(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                    <div className="relative mb-3">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">train</span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search station name, city or IRCTC code (e.g. NDLS, MMCT, BSB)..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      {isSearchingLocation && (
                        <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-gray-400 text-[16px] animate-spin">
                          progress_activity
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Verified Railway Stations</span>
                    <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                      {(liveSuggestions.length > 0
                        ? liveSuggestions
                        : popularTrainStations.map(s => ({
                            id: `stn-${s.code}`,
                            name: s.name,
                            display_name: `${s.name} [${s.code}]`,
                            secondary_description: s.city,
                            city: s.city,
                            country: 'India',
                            category: 'STATION' as const,
                            category_label: 'Railway Station',
                            code: s.code,
                          }))
                      ).map(s => (
                        <div 
                          key={s.id || s.code}
                          onClick={() => {
                            const selected: TrainStationOption = {
                              code: s.code || s.name.slice(0, 4).toUpperCase(),
                              name: s.name,
                              city: s.city || s.name,
                            };
                            if (activeDropdown === 'trainFrom') setTrainFromStation(selected);
                            else setTrainToStation(selected);
                            setActiveDropdown(null);
                            setSearchQuery('');
                          }}
                          className="p-2 rounded-lg hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{s.name}</span>
                            <span className="text-[11px] text-gray-500">{s.city}</span>
                          </div>
                          <span className="text-xs font-mono font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            {s.code}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fast Available Train Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { name: 'Vande Bharat Express (20172)', time: '06:00 → 14:05 (8h 05m)', class: 'Executive Chair (EC)', price: 2350, seats: '42 seats left' },
                  { name: 'Rajdhani Superfast Special (12952)', time: '16:55 → 08:35 (15h 40m)', class: 'AC 3 Tier (3A)', price: 1750, seats: '88 seats left' },
                ].map((train) => (
                  <div key={train.name} className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">{train.name}</span>
                      <span className="text-[11px] text-gray-500">{train.time} · {train.class}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">{train.seats}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-extrabold text-gray-900">{formatPrice(train.price)}</span>
                      <button 
                        type="button"
                        onClick={() => handleBookTrain({ name: train.name, from: 'New Delhi', to: 'Mumbai', price: train.price, class: train.class })}
                        className="mt-1 px-3 py-1 bg-[#008cff] hover:bg-[#0075d7] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MODE 4: BUSES (Dedicated: From, Destination, Going Date, Return Date, Seats & Preference) ── */}
          {searchMode === 'buses' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible hover:border-purple-300 transition relative bg-white shadow-xs">
                {/* 1. From City */}
                <div 
                  onClick={() => { setActiveDropdown(activeDropdown === 'busFrom' ? null : 'busFrom'); setSearchQuery(''); }}
                  className="md:col-span-3 p-4 cursor-pointer hover:bg-purple-50/40 transition rounded-l-xl relative"
                >
                  <div className="flex items-center space-x-1.5 text-gray-500 mb-0.5">
                    <span className="material-symbols-outlined text-[15px] text-purple-600">directions_bus</span>
                    <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">From City</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 block tracking-tight my-0.5">{busFromCity.city}</span>
                  <span className="text-[11px] text-gray-500 truncate block font-normal">{busFromCity.point}</span>

                  {/* Swap Button */}
                  <button
                    type="button"
                    onClick={handleSwapBusCities}
                    className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-purple-50 hover:scale-105 active:scale-95 transition cursor-pointer"
                    title="Swap boarding and destination cities"
                  >
                    <span className="material-symbols-outlined text-[16px] text-purple-600">sync_alt</span>
                  </button>
                </div>

                {/* 2. Destination (Going to) */}
                <div 
                  onClick={() => { setActiveDropdown(activeDropdown === 'busTo' ? null : 'busTo'); setSearchQuery(''); }}
                  className="md:col-span-3 p-4 cursor-pointer hover:bg-purple-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative pl-4 md:pl-6"
                >
                  <div className="flex items-center space-x-1.5 text-gray-500 mb-0.5">
                    <span className="material-symbols-outlined text-[15px] text-purple-600">location_on</span>
                    <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Destination (Going to)</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 block tracking-tight my-0.5">{busToCity.city}</span>
                  <span className="text-[11px] text-gray-500 truncate block font-normal">{busToCity.point}</span>
                </div>

                {/* 3. Date of Going */}
                <div 
                  onClick={() => setCalendarModalState({
                    isOpen: true,
                    type: 'busDate',
                    title: 'Select Bus Date of Going',
                    date: busTravelDate,
                    minDate: undefined,
                  })}
                  className="md:col-span-2 p-4 cursor-pointer hover:bg-purple-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative"
                >
                  <div className="flex items-center space-x-1 text-gray-500 mb-0.5">
                    <span className="material-symbols-outlined text-[14px] text-purple-600">calendar_today</span>
                    <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Date of Going</span>
                  </div>
                  <div className="flex items-baseline space-x-1 my-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                      {new Date(busTravelDate).getDate()}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-gray-800">
                      {new Date(busTravelDate).toLocaleDateString('en-US', { month: 'short' })}'{new Date(busTravelDate).getFullYear().toString().slice(2)}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 block font-normal">
                    {new Date(busTravelDate).toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                </div>

                {/* 4. Date of Return */}
                <div 
                  onClick={() => {
                    if (!hasBusReturnDate) {
                      setHasBusReturnDate(true);
                    }
                    setCalendarModalState({
                      isOpen: true,
                      type: 'busReturnDate',
                      title: 'Select Bus Date of Return',
                      date: busReturnDate,
                      minDate: busTravelDate,
                    });
                  }}
                  className="md:col-span-2 p-4 cursor-pointer hover:bg-purple-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative flex flex-col justify-start"
                >
                  <div className="flex items-center justify-between text-gray-500 mb-0.5">
                    <div className="flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[14px] text-purple-600">event_repeat</span>
                      <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Date of Return</span>
                    </div>
                    {hasBusReturnDate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHasBusReturnDate(false);
                        }}
                        className="text-gray-400 hover:text-rose-500 text-xs p-0.5"
                        title="Remove return date"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    )}
                  </div>
                  {hasBusReturnDate ? (
                    <>
                      <div className="flex items-baseline space-x-1 my-0.5">
                        <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                          {new Date(busReturnDate).getDate()}
                        </span>
                        <span className="text-base sm:text-lg font-bold text-gray-800">
                          {new Date(busReturnDate).toLocaleDateString('en-US', { month: 'short' })}'{new Date(busReturnDate).getFullYear().toString().slice(2)}
                        </span>
                      </div>
                      <span className="text-[11px] text-purple-700 block font-semibold">
                        {new Date(busReturnDate).toLocaleDateString('en-US', { weekday: 'long' })}
                      </span>
                    </>
                  ) : (
                    <div className="mt-1">
                      <span className="text-sm font-bold text-purple-600 block">+ Add Return</span>
                      <span className="text-[11px] text-gray-400 font-normal leading-tight">
                        Save 15% on return bus
                      </span>
                    </div>
                  )}
                </div>

                {/* 5. Seats & Preference */}
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'busSeats' ? null : 'busSeats')}
                  className="md:col-span-2 p-4 cursor-pointer hover:bg-purple-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 rounded-r-xl relative"
                >
                  <div className="flex items-center space-x-1 text-gray-500 mb-0.5">
                    <span className="material-symbols-outlined text-[14px] text-purple-600">event_seat</span>
                    <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Seats &amp; Type</span>
                  </div>
                  <span className="text-2xl font-black text-gray-900 block tracking-tight my-0.5">
                    {busSeats}
                  </span>
                  <span className="text-[11px] text-purple-700 font-semibold truncate block">
                    {busTypePreference}
                  </span>
                </div>

                {/* Seats Popover */}
                {activeDropdown === 'busSeats' && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72 animate-scaleIn"
                  >
                    <span className="text-xs font-bold text-gray-800 block mb-2">Number of Seats</span>
                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                      {['1 Seat', '2 Seats', '3 Seats', '4 Seats', '6 Seats'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBusSeats(s)}
                          className={`py-1.5 text-xs rounded border text-center font-bold transition ${
                            busSeats === s ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {s.split(' ')[0]}
                        </button>
                      ))}
                    </div>

                    <span className="text-xs font-bold text-gray-800 block mb-2">Bus Preference</span>
                    <div className="flex flex-col gap-1">
                      {['All Bus Types', 'AC Sleeper (2+1)', 'Volvo Multi-Axle Electric', 'Non-AC Sleeper', 'AC Seater'].map((pref) => (
                        <div
                          key={pref}
                          onClick={() => {
                            setBusTypePreference(pref);
                            setActiveDropdown(null);
                          }}
                          className={`p-2 rounded text-xs cursor-pointer flex items-center justify-between transition ${
                            busTypePreference === pref ? 'bg-purple-50 text-purple-800 font-bold' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span>{pref}</span>
                          {busTypePreference === pref && <span className="material-symbols-outlined text-purple-600 text-sm">check</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bus City Dropdown Popover (Bus Terminals & Cities) */}
                {activeDropdown && (activeDropdown === 'busFrom' || activeDropdown === 'busTo') && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-96 animate-scaleIn"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-800">
                        Select {activeDropdown === 'busFrom' ? 'Boarding Point / City' : 'Dropping Point / Destination'}
                      </span>
                      <button type="button" onClick={() => setActiveDropdown(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                    <div className="relative mb-3">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">directions_bus</span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search bus terminal, ISBT or city (e.g. Kashmere Gate, Majestic, Borivali)..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 focus:outline-none focus:border-purple-500"
                        autoFocus
                      />
                      {isSearchingLocation && (
                        <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-gray-400 text-[16px] animate-spin">
                          progress_activity
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Verified Bus Terminals</span>
                    <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                      {(liveSuggestions.length > 0
                        ? liveSuggestions
                        : popularBusCities.map(b => ({
                            id: `bus-${b.city}`,
                            name: b.point,
                            display_name: `${b.point} · ${b.city}`,
                            secondary_description: b.city,
                            city: b.city,
                            country: 'India',
                            category: 'BUS_STOP' as const,
                            category_label: 'Bus Stand',
                          }))
                      ).map(b => (
                        <div 
                          key={b.id || b.name}
                          onClick={() => {
                            const selected: BusCityOption = {
                              city: b.city || b.name,
                              point: b.name !== b.city ? b.name : (b.secondary_description || 'Central Terminal'),
                            };
                            if (activeDropdown === 'busFrom') setBusFromCity(selected);
                            else setBusToCity(selected);
                            setActiveDropdown(null);
                            setSearchQuery('');
                          }}
                          className="p-2 rounded-lg hover:bg-purple-50 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{b.city}</span>
                            <span className="text-[11px] text-gray-500">{b.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            {b.category_label || 'Bus Terminal'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fast Available Bus Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { name: 'Zingbus Luxury AC Sleeper (2+1)', time: '21:00 → 07:30 (10h 30m)', price: 950, rating: '4.8 ★' },
                  { name: 'IntrCity SmartBus Volvo Club Class', time: '22:15 → 08:45 (10h 30m)', price: 1150, rating: '4.9 ★' },
                ].map((bus) => (
                  <div key={bus.name} className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">{bus.name}</span>
                      <span className="text-[11px] text-gray-500">{bus.time} · {bus.rating}</span>
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded mt-1 inline-block">Free Cancellation</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-extrabold text-gray-900">{formatPrice(bus.price)}</span>
                      <button 
                        type="button"
                        onClick={() => handleBookBus({ name: bus.name, from: 'Bengaluru', to: 'Goa', price: bus.price })}
                        className="mt-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                      >
                        Book Seat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MODE 5: CABS (Dedicated: ONLY Pickup & Drop Location with Map API Search) ── */}
          {searchMode === 'cabs' && (
            <div className="flex flex-col gap-3">
              <div className="relative grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible hover:border-amber-400 transition bg-white shadow-xs">
                {/* 1. Pickup Location Block */}
                <div 
                  onClick={() => setMapModalState({
                    isOpen: true,
                    type: 'pickup',
                    title: 'Select Pickup Location (Map API)',
                  })}
                  className="md:col-span-6 p-4 sm:p-5 cursor-pointer hover:bg-amber-50/40 transition rounded-l-xl relative group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5 text-gray-500">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">my_location</span>
                      <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Pickup Location</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-200 group-hover:bg-emerald-100 transition flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[12px]">map</span>
                      <span>Map API Search</span>
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-gray-900 block tracking-tight line-clamp-1 my-1">
                    {cabPickupAddress}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span className="truncate font-medium">
                      City Hub: <strong className="text-gray-800">{cabCity.city}</strong> · Tap to search live map places or GPS
                    </span>
                    {pickupCoords && (
                      <span className="text-[10px] text-emerald-700 font-mono shrink-0 ml-1 hidden sm:inline">
                        📍 {pickupCoords.lat.toFixed(3)}°, {pickupCoords.lon.toFixed(3)}°
                      </span>
                    )}
                  </div>
                </div>

                {/* Center Interchange Button (Desktop & Mobile) */}
                <div className="absolute right-4 top-[78px] md:top-1/2 md:left-1/2 md:right-auto -translate-y-1/2 md:-translate-x-1/2 z-20">
                  <button 
                    type="button" 
                    onClick={handleSwapCabLocations}
                    aria-label="Swap pickup and drop locations"
                    className="w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 hover:border-amber-400 flex items-center justify-center transition active:scale-95 cursor-pointer hover:bg-amber-50"
                  >
                    <span className="material-symbols-outlined text-[18px] text-amber-600">
                      swap_horiz
                    </span>
                  </button>
                </div>

                {/* 2. Drop Location Block */}
                <div 
                  onClick={() => setMapModalState({
                    isOpen: true,
                    type: 'drop',
                    title: 'Select Drop Location (Map API)',
                  })}
                  className="md:col-span-6 p-4 sm:p-5 cursor-pointer hover:bg-amber-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 rounded-r-xl relative pl-4 md:pl-7 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5 text-gray-500">
                      <span className="material-symbols-outlined text-[16px] text-rose-500">location_on</span>
                      <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Drop Location</span>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[10px] font-bold border border-rose-200 group-hover:bg-rose-100 transition flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[12px]">map</span>
                      <span>Map API Search</span>
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-gray-900 block tracking-tight line-clamp-1 my-1">
                    {cabDropAddress}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-emerald-600">
                    <span className="truncate font-semibold">
                      Tolls &amp; State Taxes Included · Direct Doorstep or Outstation Drop
                    </span>
                    {dropCoords && (
                      <span className="text-[10px] text-rose-600 font-mono shrink-0 ml-1 hidden sm:inline">
                        📍 {dropCoords.lat.toFixed(3)}°, {dropCoords.lon.toFixed(3)}°
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Driving Route & Distance Bar from Map API */}
              {routeEstimate && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-50/80 via-white to-blue-50/80 rounded-xl border border-amber-200/60 shadow-xs text-xs animate-fadeIn">
                  <div className="flex items-center space-x-2 text-gray-800">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">directions_car</span>
                    <span className="font-bold">
                      Calculated Road Distance: <strong className="text-emerald-700 font-extrabold">{routeEstimate.distance_km} km</strong>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>
                      Est. Driving Time: <strong className="text-blue-700 font-extrabold">~{routeEstimate.formatted_duration}</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Live Map Calculation
                    </span>
                    <span className="text-[10px] text-gray-500 hidden sm:inline">Zero Surge Guaranteed</span>
                  </div>
                </div>
              )}

              {/* Fast Available Cab Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { name: 'Airport Prime Sedan (Dzire / Etios)', time: 'Immediate Pickup · 4 seats', price: 650, badge: 'Top Rated' },
                  { name: 'Outstation Ertiga SUV (6 Seater)', time: 'Spacious luggage · AC SUV', price: 1250, badge: 'Family Choice' },
                ].map((cab) => (
                  <div key={cab.name} className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">{cab.name}</span>
                      <span className="text-[11px] text-gray-500">{cab.time}</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">{cab.badge}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-extrabold text-gray-900">{formatPrice(cab.price)}</span>
                      <button 
                        type="button"
                        onClick={() => handleBookCab({ name: cab.name, pickup: 'Delhi Airport T3', drop: 'Connaught Place', price: cab.price })}
                        className="mt-1 px-3 py-1 bg-[#f28c1c] hover:bg-[#e57a0e] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MODE 6: HOLIDAY PACKAGES ── */}
          {searchMode === 'holidays' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible hover:border-rose-300 transition relative bg-white">
                {/* Destination */}
                <div 
                  onClick={() => { setActiveDropdown(activeDropdown === 'holiday' ? null : 'holiday'); setSearchQuery(''); }}
                  className="md:col-span-5 p-4 cursor-pointer hover:bg-rose-50/40 transition rounded-l-xl relative"
                >
                  <span className="text-[12px] font-normal text-gray-500 block">Theme / Destination</span>
                  <span className="text-3xl font-extrabold text-gray-900 block tracking-tight my-0.5">{holidayDestination.destination}</span>
                  <span className="text-[11px] text-gray-500 truncate block font-normal">{holidayDestination.title}</span>
                </div>

                {/* Duration */}
                <div 
                  className="md:col-span-4 p-4 hover:bg-rose-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative"
                >
                  <span className="text-[12px] font-normal text-gray-500 block">Package Duration</span>
                  <span className="text-2xl font-extrabold text-gray-900 block tracking-tight my-0.5">{holidayDestination.days}</span>
                  <span className="text-[11px] text-gray-500 truncate block font-normal">Flights + 4/5-Star Stays + Sightseeing</span>
                </div>

                {/* Offer */}
                <div 
                  className="md:col-span-3 p-4 hover:bg-rose-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 rounded-r-xl relative"
                >
                  <span className="text-[12px] font-normal text-rose-800 block">Bundle Savings</span>
                  <span className="text-2xl font-extrabold text-[#eb2026] block tracking-tight my-0.5">Save 25% Off</span>
                  <span className="text-[11px] text-rose-700 font-semibold truncate block">Coupon SSJHOLIDAY Applied</span>
                </div>

                {/* Holiday Dropdown Popover (Holiday Regions & Destinations) */}
                {activeDropdown === 'holiday' && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-[420px] max-w-[95vw] animate-scaleIn"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-800">Select Holiday Destination or Theme</span>
                      <button type="button" onClick={() => setActiveDropdown(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                    <div className="relative mb-3">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">luggage</span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search destination, state or circuit (e.g. Kashmir, Kerala, Bali, Europe)..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 focus:outline-none focus:border-rose-500"
                        autoFocus
                      />
                      {isSearchingLocation && (
                        <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-gray-400 text-[16px] animate-spin">
                          progress_activity
                        </span>
                      )}
                    </div>

                    {/* Immediate Custom Destination Option */}
                    {searchQuery.trim().length > 1 && (
                      <div 
                        onClick={() => {
                          const cleanQ = searchQuery.trim();
                          setHolidayDestination({
                            destination: cleanQ,
                            title: `${cleanQ} Holiday Exploration Package`,
                            days: '5 Days / 4 Nights',
                          });
                          setActiveDropdown(null);
                          setSearchQuery('');
                        }}
                        className="mb-2 p-2 rounded-lg bg-rose-50/70 hover:bg-rose-100 border border-rose-200 cursor-pointer flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="material-symbols-outlined text-rose-600 text-[18px]">explore</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-rose-700">Explore holiday packages in "{searchQuery.trim()}"</span>
                            <span className="text-[10px] text-gray-500">Search all guided tours and circuits</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward</span>
                      </div>
                    )}

                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Popular Holiday Packages</span>
                    <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                      {(liveSuggestions.length > 0
                        ? liveSuggestions
                        : popularHolidayThemes.map(h => ({
                            id: `pkg-${h.destination}`,
                            name: h.destination,
                            display_name: `${h.destination} · ${h.title}`,
                            secondary_description: h.days,
                            city: h.destination,
                            country: 'India',
                            category: 'REGION' as const,
                            category_label: 'Holiday Circuit',
                          }))
                      ).map(h => (
                        <div 
                          key={h.id || h.name}
                          onClick={() => {
                            setHolidayDestination({
                              destination: h.city || h.name,
                              title: h.secondary_description || `${h.city || h.name} Special Package`,
                              days: '5 Days / 4 Nights',
                            });
                            setActiveDropdown(null);
                            setSearchQuery('');
                          }}
                          className="p-2.5 rounded-lg hover:bg-rose-50 cursor-pointer flex flex-col transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">{h.city || h.name}</span>
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                              {h.category_label || 'Package'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 mt-0.5">{h.secondary_description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fast Available Package Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { name: 'Kashmir Paradise: Srinagar, Gulmarg & Pahalgam', duration: '5D / 4N', price: 24500, highlight: 'Houseboat Stay + Gondola Ride' },
                  { name: 'Goa Coastal Bliss: Beachfront Resort & Heritage', duration: '4D / 3N', price: 16500, highlight: 'Free Breakfast & Sunset Cruise' },
                ].map((pkg) => (
                  <div key={pkg.name} className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">{pkg.name}</span>
                      <span className="text-[11px] text-gray-500">{pkg.duration} · {pkg.highlight}</span>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded mt-1 inline-block">100% Refundable</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-extrabold text-gray-900">{formatPrice(pkg.price)}</span>
                      <button 
                        type="button"
                        onClick={() => handleBookPackage({ name: pkg.name, days: 5, nights: 4, price: pkg.price })}
                        className="mt-1 px-3 py-1 bg-[#eb2026] hover:bg-[#c9181e] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                      >
                        Book Deal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MODE 7: VILLAS & RESORTS (Dedicated: Location & Dates ONLY) ── */}
          {searchMode === 'villas' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible hover:border-emerald-300 transition relative bg-white shadow-xs">
                {/* 1. Location / Resort Destination ONLY */}
                <div 
                  onClick={() => { setActiveDropdown(activeDropdown === 'villa' ? null : 'villa'); setSearchQuery(''); }}
                  className="md:col-span-6 p-4 sm:p-5 cursor-pointer hover:bg-emerald-50/40 transition rounded-l-xl relative"
                >
                  <div className="flex items-center space-x-1.5 text-gray-500 mb-1">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">holiday_village</span>
                    <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Location / Resort Destination</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 block tracking-tight my-0.5">
                    {villaDestination.city}
                  </span>
                  <span className="text-[11px] text-gray-500 truncate block font-normal">
                    {villaDestination.location} · {villaDestination.name}
                  </span>
                </div>

                {/* 2. Check-in Date ONLY */}
                <div 
                  onClick={() => setCalendarModalState({
                    isOpen: true,
                    type: 'villaCheckIn',
                    title: 'Select Villa Check-in Date',
                    date: villaCheckIn,
                    minDate: undefined,
                  })}
                  className="md:col-span-3 p-4 sm:p-5 cursor-pointer hover:bg-emerald-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 relative"
                >
                  <div className="flex items-center space-x-1.5 text-gray-500 mb-1">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">calendar_today</span>
                    <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Check-in Date</span>
                  </div>
                  <div className="flex items-baseline space-x-1 my-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                      {new Date(villaCheckIn).getDate()}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-gray-800">
                      {new Date(villaCheckIn).toLocaleDateString('en-US', { month: 'short' })}'{new Date(villaCheckIn).getFullYear().toString().slice(2)}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 block font-normal">
                    {new Date(villaCheckIn).toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                </div>

                {/* 3. Check-out Date ONLY */}
                <div 
                  onClick={() => setCalendarModalState({
                    isOpen: true,
                    type: 'villaCheckOut',
                    title: 'Select Villa Check-out Date',
                    date: villaCheckOut,
                    minDate: villaCheckIn,
                  })}
                  className="md:col-span-3 p-4 sm:p-5 cursor-pointer hover:bg-emerald-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 rounded-r-xl relative"
                >
                  <div className="flex items-center space-x-1.5 text-gray-500 mb-1">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">event_repeat</span>
                    <span className="text-[12px] font-bold uppercase tracking-wider text-gray-600">Check-out Date</span>
                  </div>
                  <div className="flex items-baseline space-x-1 my-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                      {new Date(villaCheckOut).getDate()}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-gray-800">
                      {new Date(villaCheckOut).toLocaleDateString('en-US', { month: 'short' })}'{new Date(villaCheckOut).getFullYear().toString().slice(2)}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 block font-semibold">
                    {new Date(villaCheckOut).toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                </div>

                {/* Villa Location Dropdown Popover (Worldwide Destinations & Villas) */}
                {activeDropdown === 'villa' && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-[420px] max-w-[95vw] animate-scaleIn"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-800">Select Villa Destination or Resort Location</span>
                      <button type="button" onClick={() => setActiveDropdown(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                    <div className="relative mb-3">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">holiday_village</span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search villa destination, resort or hill station (e.g. Goa, Manali, Bali)..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      {isSearchingLocation && (
                        <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-gray-400 text-[16px] animate-spin">
                          progress_activity
                        </span>
                      )}
                    </div>

                    {/* Immediate Custom Destination Option */}
                    {searchQuery.trim().length > 1 && (
                      <div 
                        onClick={() => {
                          const cleanQ = searchQuery.trim();
                          setVillaDestination({
                            city: cleanQ,
                            location: 'Entire Private Estate / Homestay',
                            name: `Handpicked Stays in ${cleanQ}`,
                          });
                          setActiveDropdown(null);
                          setSearchQuery('');
                        }}
                        className="mb-2 p-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 cursor-pointer flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]">home_work</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-emerald-700">Search villas in "{searchQuery.trim()}"</span>
                            <span className="text-[10px] text-gray-500">Query luxury villas & homestays in this area</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward</span>
                      </div>
                    )}

                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Featured Luxury Destinations</span>
                    <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
                      {(liveSuggestions.length > 0
                        ? liveSuggestions
                        : popularVillaDestinations.map(v => ({
                            id: `v-${v.name}`,
                            name: v.name,
                            display_name: `${v.city} · ${v.name}`,
                            secondary_description: v.location,
                            city: v.city,
                            country: 'India',
                            category: 'LOCALITY' as const,
                            category_label: 'Luxury Villa',
                          }))
                      ).map(v => (
                        <div 
                          key={v.id || v.name}
                          onClick={() => {
                            setVillaDestination({
                              city: v.city || v.name,
                              location: v.secondary_description || v.display_name,
                              name: v.name,
                            });
                            setActiveDropdown(null);
                            setSearchQuery('');
                          }}
                          className="p-2.5 rounded-lg hover:bg-emerald-50 cursor-pointer flex flex-col transition border border-transparent hover:border-emerald-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">{v.city || v.name}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {v.category_label || 'Private Stay'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-600 font-medium mt-0.5">{v.name}</span>
                          <span className="text-[10px] text-gray-400">{v.secondary_description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fast Available Villa Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { name: 'Villa Sol Candolim - 4BHK Private Pool Villa', location: 'Candolim, Goa · 200m from Beach', price: 14500, highlight: 'Private Pool · Chef on Demand · 4.9 ★' },
                  { name: 'Whispering Pines Luxury Chalet & Orchard', location: 'Old Manali, HP · Snow Peaks View', price: 7200, highlight: 'Fireplace · Private Lawn · 4.8 ★' },
                ].map((villa) => (
                  <div key={villa.name} className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">{villa.name}</span>
                      <span className="text-[11px] text-gray-500">{villa.location}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">{villa.highlight}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-extrabold text-gray-900">{formatPrice(villa.price)}<span className="text-[10px] text-gray-500 font-normal">/night</span></span>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist({
                              id: `villa-${villa.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                              title: villa.name,
                              category: 'VILLA',
                              location: villa.location,
                              price: villa.price,
                              rating: 4.9,
                              image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
                              badge: 'LUXURY VILLA',
                            });
                          }}
                          className="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                          title="Save to wishlist"
                        >
                          <span 
                            className={`material-symbols-outlined text-[17px] ${isWishlisted(`villa-${villa.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`) ? 'text-rose-500' : 'text-gray-400'}`}
                            style={isWishlisted(`villa-${villa.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`) ? { fontVariationSettings: "'FILL' 1" } : {}}
                          >
                            favorite
                          </span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleBookVilla({ name: villa.name, location: villa.location, price: villa.price })}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                        >
                          Book Villa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MODE 8: TOURS & ATTRACTIONS ── */}
          {searchMode === 'tours' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible p-4 bg-sky-50/40 relative">
                <div 
                  onClick={() => { setActiveDropdown(activeDropdown === 'tourCity' ? null : 'tourCity'); setSearchQuery(''); }}
                  className="md:col-span-5 cursor-pointer hover:opacity-85 transition"
                >
                  <span className="text-[12px] text-sky-800 font-bold uppercase tracking-wider block">Destination / City</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">{hotelCity.city}, {hotelCity.country}</span>
                  <span className="text-[11px] text-gray-500">Click to change destination · Theme Parks, Sightseeing, Tours</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-sky-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-sky-800 font-bold uppercase tracking-wider block">Activity Pass</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Instant E-Voucher</span>
                  <span className="text-[11px] text-gray-500">Flexible 30 Days Validity · Skip Ticket Lines</span>
                </div>
                <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-sky-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-sky-800 font-bold uppercase tracking-wider block">Experience Type</span>
                  <span className="text-2xl font-extrabold text-sky-700 block">Verified Guides</span>
                  <span className="text-[11px] text-sky-600 font-semibold">100% Guaranteed Slot</span>
                </div>

                {/* Tour City Popover */}
                {activeDropdown === 'tourCity' && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-[400px] max-w-[95vw] animate-scaleIn"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-800">Select City or Attraction</span>
                      <button type="button" onClick={() => setActiveDropdown(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                    <div className="relative mb-3">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">attractions</span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search city or sightseeing experience..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 focus:outline-none focus:border-sky-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                      {(liveSuggestions.length > 0 ? liveSuggestions : filteredHotelCities.map(c => ({
                        id: `tour-${c.city}`,
                        name: c.city,
                        display_name: `${c.city}, ${c.country}`,
                        secondary_description: `Sightseeing & Activities in ${c.city}`,
                        city: c.city,
                        country: c.country,
                        category: 'LOCALITY' as const,
                        category_label: 'Top Destination',
                      }))).map((item) => (
                        <div 
                          key={item.id || item.name}
                          onClick={() => {
                            setHotelCity({
                              city: item.city || item.name,
                              region: item.secondary_description || item.city,
                              country: item.country || 'Worldwide',
                            });
                            setActiveDropdown(null);
                            setSearchQuery('');
                          }}
                          className="p-2 rounded-lg hover:bg-sky-50 cursor-pointer flex justify-between items-center transition"
                        >
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{item.city || item.name}</span>
                            <span className="text-[11px] text-gray-500">{item.country}</span>
                          </div>
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">Experiences</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fast Available Attraction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { name: 'Burj Khalifa: At The Top (124th + 125th Floor)', city: 'Dubai, UAE', price: 3850, highlight: 'Instant Mobile Ticket · Sky Views · 4.9 ★' },
                  { name: 'Eiffel Tower Direct Summit Access & History Tour', city: 'Paris, France', price: 6200, highlight: 'Skip The Ticket Line · Art Historian Guide · 4.9 ★' },
                  { name: 'Universal Studios Singapore One-Day Pass', city: 'Sentosa, Singapore', price: 5400, highlight: 'Direct Barcode Entry · All Rides Access · 4.8 ★' },
                  { name: 'Grand Island Scuba Diving & Dolphin Cruise', city: 'Goa, India', price: 1950, highlight: 'PADI Certified Dive · Water Sports Combo · 4.8 ★' },
                ].map((act) => (
                  <div key={act.name} className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">{act.name}</span>
                      <span className="text-[11px] text-gray-500">{act.city}</span>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded mt-1 inline-block">{act.highlight}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-extrabold text-gray-900">{formatPrice(act.price)}<span className="text-[10px] text-gray-500 font-normal">/person</span></span>
                      <button 
                        type="button"
                        onClick={() => handleBookAttraction({ name: act.name, city: act.city, price: act.price })}
                        className="mt-1 px-3 py-1 bg-[#008cff] hover:bg-[#0075d7] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                      >
                        Book Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MODE 9: VISA SERVICES ── */}
          {searchMode === 'visa' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible p-4 bg-emerald-50/40 relative">
                <div 
                  onClick={() => { setActiveDropdown(activeDropdown === 'visaCountry' ? null : 'visaCountry'); setSearchQuery(''); }}
                  className="md:col-span-5 cursor-pointer hover:opacity-85 transition"
                >
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">Destination Country</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">
                    {selectedVisaCountry.flag} {selectedVisaCountry.name}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">Click to search sovereign countries (UAE, Singapore, Schengen, etc.)</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-emerald-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">Visa Category</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">{selectedVisaCountry.category}</span>
                  <span className="text-[11px] text-gray-500">100% Online · No Embassy Visit</span>
                </div>
                <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-emerald-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">Approval Rate</span>
                  <span className="text-2xl font-extrabold text-emerald-600 block">99.4% Success</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">Free Re-Application Guarantee</span>
                </div>

                {/* Visa Country Dropdown Popover */}
                {activeDropdown === 'visaCountry' && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-[420px] max-w-[95vw] animate-scaleIn"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-800">Select Destination Country (Countries Only)</span>
                      <button type="button" onClick={() => setActiveDropdown(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                    <div className="relative mb-3">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">public</span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search sovereign country (e.g. Dubai, Singapore, France, UK)..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      {isSearchingLocation && (
                        <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-gray-400 text-[16px] animate-spin">
                          progress_activity
                        </span>
                      )}
                    </div>
                    <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                      {liveSuggestions.map((c) => (
                        <div 
                          key={c.id || c.code}
                          onClick={() => {
                            setSelectedVisaCountry({
                              name: c.country || c.name,
                              code: c.code || 'AE',
                              flag: c.name.split(' ')[0] || '🌐',
                              category: c.code === 'FR' ? 'Schengen Short-Stay Tourist Visa' : c.code === 'GB' ? 'UK Standard Visitor Visa (6 Months)' : '30-Days Express Tourist eVisa',
                              price: c.code === 'FR' ? 8499 : c.code === 'GB' ? 14999 : c.code === 'SG' ? 2750 : 6499,
                            });
                            setActiveDropdown(null);
                            setSearchQuery('');
                          }}
                          className="p-2 rounded-lg hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition"
                        >
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{c.name}</span>
                            <span className="text-[11px] text-gray-500">{c.secondary_description}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">eVisa Ready</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fast Available Visa Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { country: 'Dubai (UAE)', type: '30-Days Express Tourist eVisa', speed: 'Processed in 48 Hours', price: 6499, highlight: 'Only Passport Scan & Photo Needed' },
                  { country: 'Singapore', type: '30-Days Multiple Entry eVisa (ICA Verified)', speed: 'Processed in 3 Days', price: 2750, highlight: 'Valid for 2 Years · Multiple Entry' },
                  { country: 'France (Schengen)', type: 'Schengen Tourist Visa Appointment & Concierge', speed: '12-15 Working Days', price: 8499, highlight: 'Access 27 European Countries' },
                  { country: 'United Kingdom', type: 'UK Standard 6-Month Visitor Visa File Review', speed: '15 Working Days', price: 14999, highlight: 'Biometrics Booking Assistance' },
                ].map((visaItem) => (
                  <div key={visaItem.country} className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">{visaItem.country} · {visaItem.type}</span>
                      <span className="text-[11px] text-gray-500">{visaItem.speed}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">{visaItem.highlight}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-extrabold text-gray-900">{formatPrice(visaItem.price)}</span>
                      <button 
                        type="button"
                        onClick={() => handleApplyVisa({ country: visaItem.country, type: visaItem.type, price: visaItem.price })}
                        className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MODE 10: TRAVEL INSURANCE ── */}
          {searchMode === 'insurance' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible p-4 bg-blue-50/40 relative">
                <div 
                  onClick={() => { setActiveDropdown(activeDropdown === 'insuranceCountry' ? null : 'insuranceCountry'); setSearchQuery(''); }}
                  className="md:col-span-5 cursor-pointer hover:opacity-85 transition"
                >
                  <span className="text-[12px] text-blue-800 font-bold uppercase tracking-wider block">Travel Coverage Destination</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">{selectedInsuranceZone.zone}</span>
                  <span className="text-[11px] text-blue-700 font-semibold">Click to change destination zone or country</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-blue-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-blue-800 font-bold uppercase tracking-wider block">Medical Sum Insured</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">{selectedInsuranceZone.maxCover}</span>
                  <span className="text-[11px] text-gray-500">Zero Deductibles · Cashless Hospitals Worldwide</span>
                </div>
                <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-blue-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-blue-800 font-bold uppercase tracking-wider block">Policy Delivery</span>
                  <span className="text-2xl font-extrabold text-[#008cff] block">Instant PDF</span>
                  <span className="text-[11px] text-blue-700 font-semibold">100% Embassy &amp; Visa Approved</span>
                </div>

                {/* Insurance Zone Dropdown Popover */}
                {activeDropdown === 'insuranceCountry' && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-[420px] max-w-[95vw] animate-scaleIn"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-800">Select Travel Destination Zone</span>
                      <button type="button" onClick={() => setActiveDropdown(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { zone: 'Worldwide (Includes USA, Schengen & Asia)', maxCover: '$250,000 USD Medical Cover', planName: 'Global Travel Shield Platinum', price: 850 },
                        { zone: 'Europe & Schengen Area', maxCover: '€30,000 / $250,000 (100% Embassy Approved)', planName: 'Schengen Certified Travel Shield', price: 590 },
                        { zone: 'Asia & Middle East (Dubai, Thailand, Singapore)', maxCover: '$50,000 USD Medical Cover', planName: 'Travel Shield Silver', price: 499 },
                        { zone: 'USA & Canada Ultra Comprehensive', maxCover: '$500,000 USD Medical Cover', planName: 'USA Ultra Comprehensive Shield', price: 1999 },
                      ].map((item) => (
                        <div 
                          key={item.zone}
                          onClick={() => {
                            setSelectedInsuranceZone(item);
                            setActiveDropdown(null);
                          }}
                          className="p-2.5 rounded-lg hover:bg-blue-50 cursor-pointer flex justify-between items-center transition border border-transparent hover:border-blue-200"
                        >
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{item.zone}</span>
                            <span className="text-[11px] text-gray-500">{item.maxCover}</span>
                          </div>
                          <span className="text-xs font-bold text-[#008cff] bg-blue-50 px-2 py-1 rounded">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fast Available Insurance Plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { planName: 'Global Travel Shield Platinum ($250k Cover)', cover: 'Worldwide Medical & Baggage Protection', price: 850, highlight: 'COVID-19 Cover + Baggage Loss + Flight Delay' },
                  { planName: 'Schengen Visa Travel Shield (€50,000 Cover)', cover: '100% European Embassy Approved', price: 590, highlight: 'Instant PDF for Visa Submission' },
                ].map((ins) => (
                  <div key={ins.planName} className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">{ins.planName}</span>
                      <span className="text-[11px] text-gray-500">{ins.cover}</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">{ins.highlight}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-extrabold text-gray-900">{formatPrice(ins.price)}<span className="text-[10px] text-gray-500 font-normal">/trip</span></span>
                      <button 
                        type="button"
                        onClick={() => handleBuyInsurance({ planName: ins.planName, cover: ins.cover, price: ins.price })}
                        className="mt-1 px-3 py-1 bg-[#008cff] hover:bg-[#0075d7] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                      >
                        Buy Policy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Fare Selection Row - only for Flights */}
          {searchMode === 'flights' && (
            <>
              <div className="mt-4 pt-3 flex flex-wrap items-center gap-2.5 text-xs border-t border-gray-100">
                <span className="font-bold text-gray-700 text-[11px]">Select A Special Fare:</span>
                {[
                  { id: 'regular', label: 'Regular Fares' },
                  { id: 'student', label: 'Student Fares' },
                  { id: 'senior', label: 'Senior Citizen' },
                  { id: 'forces', label: 'Armed Forces' },
                  { id: 'medical', label: 'Doctors & Nurses' },
                ].map(f => (
                  <label 
                    key={f.id}
                    onClick={() => setSpecialFare(f.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-full cursor-pointer text-[11px] transition ${
                      specialFare === f.id
                        ? 'border border-[#008cff] bg-blue-50/70 text-[#008cff] font-bold'
                        : 'border border-gray-200 hover:border-gray-300 text-gray-600 font-medium'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="special-fare" 
                      checked={specialFare === f.id} 
                      onChange={() => setSpecialFare(f.id)}
                      className="accent-[#008cff] w-3 h-3" 
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>

              {/* Trending Searches Row */}
              <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="font-bold text-gray-700 text-[11px]">Trending Searches:</span>
                  {[
                    { from: 'Delhi', to: 'Mumbai', fromCode: 'DEL', toCode: 'BOM' },
                    { from: 'Bengaluru', to: 'Goa', fromCode: 'BLR', toCode: 'DPS' },
                    { from: 'San Francisco', to: 'Tokyo', fromCode: 'SFO', toCode: 'HND' },
                  ].map(route => (
                    <button
                      key={`${route.from}-${route.to}`}
                      type="button"
                      onClick={() => {
                        const fromApt = popularAirports.find(a => a.code === route.fromCode) || popularAirports[0];
                        const toApt = popularAirports.find(a => a.code === route.toCode) || popularAirports[1];
                        setOriginAirport(fromApt);
                        setDestinationAirport(toApt);
                      }}
                      className="inline-flex items-center px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-medium transition cursor-pointer"
                    >
                      {route.from} <span className="text-[#008cff] mx-1">→</span> {route.to}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1.5 border border-gray-200 rounded-full px-3 py-1 bg-white mt-2 sm:mt-0 shadow-xs">
                  <span className="material-symbols-outlined text-[14px] text-[#008cff]">radar</span>
                  <span className="font-bold text-gray-800 text-[11px]">Flight Tracker</span>
                  <span className="bg-purple-100 text-purple-700 font-extrabold text-[8px] px-1.5 py-0.2 rounded uppercase">LIVE</span>
                </div>
              </div>
            </>
          )}

          {routeValidationError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700 animate-fadeIn">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-rose-600 text-[18px]">error</span>
                <span className="font-semibold">{routeValidationError}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setRouteValidationError(null)}
                className="text-rose-500 hover:text-rose-700 font-bold ml-3 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}


          {/* ── BIG FLOATING CENTERED GRADIENT SEARCH BUTTON ── */}
          <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 z-30 w-full max-w-[90%] sm:w-auto flex justify-center">
            <button 
              type="button"
              onClick={handleMasterSearch}
              className="w-full sm:w-auto bg-gradient-to-r from-[#53b2fe] to-[#065af3] hover:from-[#44a6f4] hover:to-[#0050e0] text-white text-sm sm:text-base font-extrabold uppercase px-6 sm:px-14 py-3 sm:py-3.5 rounded-full shadow-[0_4px_16px_rgba(0,140,255,0.45)] tracking-wider hover:brightness-105 active:scale-[0.98] transition cursor-pointer flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <span>
                {searchMode === 'flights' && 'SEARCH FLIGHTS'}
                {searchMode === 'hotels' && 'SEARCH HOTELS'}
                {searchMode === 'villas' && 'SEARCH VILLAS'}
                {searchMode === 'holidays' && 'EXPLORE PACKAGES'}
                {searchMode === 'trains' && 'SEARCH TRAINS'}
                {searchMode === 'buses' && 'SEARCH BUSES'}
                {searchMode === 'cabs' && 'SEARCH CABS'}
                {searchMode === 'tours' && 'EXPLORE ATTRACTIONS'}
                {searchMode === 'visa' && 'APPLY VISA'}
                {searchMode === 'insurance' && 'VIEW INSURANCE PLANS'}
              </span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* ── 4. PROMOTIONAL DISCOUNT BANNER ── */}
        <section className="mt-14 mb-8" aria-label="Welcome Promo Banner">
          <div className="bg-gradient-to-r from-blue-50 via-rose-50 to-amber-50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between shadow-xs gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-blue-100 flex items-center justify-center p-2 flex-shrink-0">
                <span className="material-symbols-outlined text-[#008cff] text-[28px]">redeem</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold leading-tight">Start a New, Memorable Journey with SS Journey</p>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight leading-tight">
                  Up to 25% OFF on Your 1st Booking with us
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-gray-500">Use Coupon:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode('SSJWELCOME')}
                    className="font-extrabold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200 text-[11px] hover:border-[#008cff] cursor-pointer flex items-center gap-1"
                  >
                    <span>SSJWELCOME</span>
                    <span className="material-symbols-outlined text-[13px] text-gray-400">content_copy</span>
                  </button>
                  {copiedCode === 'SSJWELCOME' && (
                    <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <button 
                type="button"
                onClick={handleMasterSearch}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#008cff] hover:bg-[#0a4bcc] text-white font-bold text-xs rounded-full shadow-xs transition whitespace-nowrap cursor-pointer"
              >
                <span>Claim Offer Now</span>
                <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── 5. SUPER OFFERS SECTION ── */}
        <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 sm:p-8 mb-8" aria-label="Super Offers">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-4">
            <div className="flex items-center space-x-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Super Offers</h2>
              <div className="hidden sm:flex items-center space-x-1.5 overflow-x-auto text-xs font-semibold no-scrollbar">
                {(['all', 'flights', 'hotels', 'holidays', 'trains', 'cabs', 'bank'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setOffersCategory(cat)}
                    className={`px-3 py-1.5 rounded-full capitalize transition cursor-pointer ${
                      offersCategory === cat 
                        ? 'bg-blue-50 text-[#008cff] font-bold border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat === 'all' ? 'All Offers' : cat}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs font-extrabold text-[#008cff] uppercase tracking-wider">
              Active Verified Deals (6)
            </span>
          </div>

          {/* Offers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Offer 1: Flights Flat 8% */}
            <article className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg transition bg-white group">
              <div className="flex space-x-4">
                <img 
                  src="https://lh3.googleusercontent.com/aida/AEtjO1Uis5Wh0S6j6qQCBNKOs9FHJYibkM5dGxlmO1HOm259BCUiDVdL8saLZpPSsPc1EmrmYFMdtbj3fDQO5-XLnGCX8ekv7HgR6IrezYn5LuT_NrkdqYLiTIVoL5Z6H3WJXmzOwmdEHXeLIAiEmFP98ZNmB0CHQoun_WZjpHM4FAK9Yv_7CCfops9oG8w0dk91-kClbekjwH5f5C77VtHgICb-2hadNl7-1d6ADqOWwrsX95nCR0AyXlyR1Ys" 
                  alt="Family Traveling at Flight Terminal" 
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition duration-300"
                />
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-[#008cff] tracking-wider uppercase bg-blue-50 px-2 py-0.5 rounded">INTL FLIGHTS</span>
                      <span className="text-[9px] text-gray-400 uppercase font-medium">T&amp;C'S APPLY</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 mt-1.5 leading-snug">Savings Alert: Get FLAT 8% OFF*</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">Book international flights with major global airlines today.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleCopyCode('SSJFLY')}
                  className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-1"
                >
                  <span>CODE: SSJFLY</span>
                  {copiedCode === 'SSJFLY' && <span className="text-emerald-600 text-[9px]">Copied</span>}
                </button>
                <button 
                  type="button"
                  onClick={handleExecuteFlightSearch}
                  className="text-xs font-black text-[#008cff] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  BOOK NOW
                </button>
              </div>
            </article>

            {/* Offer 2: Hotels Promo */}
            <article className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg transition bg-white group">
              <div className="flex space-x-4">
                <img 
                  src="https://lh3.googleusercontent.com/aida/AEtjO1UrJrpEZbh7LenpwQV6uAuuPI27RonzV-sXFIlqnlDHJvwWIyZW8B32vGNoUU2Q4DBWEC-ojckB7ANiWAHfUomVPFHghtWTMeCXlCknHQ85bj6If--xjw7a8xePxhaEj4rvUggwK7t-8FxOqRJUJ6ViONcCuqgn9F6ko1Qj2yHXkLWZfyTUptDmhBuUt97B9PaCaQdVsM46C0E3nBSVJem5qF9APA3lvNtpc9yo1rBsJQg7B731bLgLAzs" 
                  alt="Hotel Stay Promo" 
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition duration-300"
                />
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2 py-0.5 rounded">HOTELS</span>
                      <span className="text-[9px] text-gray-400 uppercase font-medium">T&amp;C'S APPLY</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 mt-1.5 leading-snug">Instant savings: Up to 25% OFF*</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">Grab 4-star &amp; 5-star verified stays with complimentary breakfast.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleCopyCode('SSJSTAY')}
                  className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-1"
                >
                  <span>CODE: SSJSTAY</span>
                  {copiedCode === 'SSJSTAY' && <span className="text-emerald-600 text-[9px]">Copied</span>}
                </button>
                <button 
                  type="button"
                  onClick={handleExecuteHotelSearch}
                  className="text-xs font-black text-[#008cff] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  BOOK NOW
                </button>
              </div>
            </article>

            {/* Offer 3: Holidays Promo */}
            <article className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg transition bg-white group">
              <div className="flex space-x-4">
                <img 
                  src="https://lh3.googleusercontent.com/aida/AEtjO1VTYbPagZqdRtQbVAJ2ECGyQPnAIFVdnzDXOlE9GOIi7KgGttsEX1WLZrlVqwHjlVxzNLDffHUlsCle8vDRIhMlTItAVnsuwVw18KwRVObLkiMM4FUG8aoaiZjEkUYwTjaq-TjTCKXxhlM9TIV5-HwAKePhl735_tGGn2xRKe2QVQAAKbwYpJDdi09km43vW2Yfvd5bulTpcVlJq02rVqj5p5AobAsiR35A-bxx53GXcwkCxZCsiehu39w" 
                  alt="Traveler on hilltop overlooking ocean" 
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition duration-300"
                />
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-purple-600 tracking-wider uppercase bg-purple-50 px-2 py-0.5 rounded">HOLIDAYS</span>
                      <span className="text-[9px] text-gray-400 uppercase font-medium">T&amp;C'S APPLY</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 mt-1.5 leading-snug">BIG SAVINGS ON PACKAGES</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">Up to 35% OFF on combined Flight + Hotel holiday packages.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleCopyCode('SSJHOLIDAY')}
                  className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-1"
                >
                  <span>CODE: SSJHOLIDAY</span>
                  {copiedCode === 'SSJHOLIDAY' && <span className="text-emerald-600 text-[9px]">Copied</span>}
                </button>
                <button 
                  type="button"
                  onClick={() => handleBookPackage({ name: 'Goa Golden Beachfront Holiday', days: 5, nights: 4, price: 18500 })}
                  className="text-xs font-black text-[#008cff] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  BOOK NOW
                </button>
              </div>
            </article>

            {/* Offer 4: Bank Cards Offer */}
            <article className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg transition bg-white group">
              <div className="flex space-x-4">
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 flex flex-col items-center justify-center text-white p-2 text-center flex-shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Bank Deal</span>
                  <span className="text-2xl font-black">15%</span>
                  <span className="text-[10px] font-semibold">Cashback</span>
                </div>
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-2 py-0.5 rounded">BANK SPECIAL</span>
                      <span className="text-[9px] text-gray-400 uppercase font-medium">T&amp;C'S APPLY</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 mt-1.5 leading-snug">Zero Convenience Fee with Major Cards</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">Enjoy seamless checkout with Visa, Mastercard &amp; Amex cards.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleCopyCode('BANKTRIP')}
                  className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-1"
                >
                  <span>CODE: BANKTRIP</span>
                  {copiedCode === 'BANKTRIP' && <span className="text-emerald-600 text-[9px]">Copied</span>}
                </button>
                <button 
                  type="button"
                  onClick={handleExecuteFlightSearch}
                  className="text-xs font-black text-[#008cff] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  BOOK NOW
                </button>
              </div>
            </article>

            {/* Offer 5: High-Speed Trains */}
            <article className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg transition bg-white group">
              <div className="flex space-x-4">
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex flex-col items-center justify-center text-white p-2 text-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">train</span>
                  <span className="text-xs font-black mt-1">VANDE</span>
                  <span className="text-[9px] font-semibold">BHARAT</span>
                </div>
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-emerald-700 tracking-wider uppercase bg-emerald-50 px-2 py-0.5 rounded">RAIL SPECIAL</span>
                      <span className="text-[9px] text-gray-400 uppercase font-medium">IRCTC</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 mt-1.5 leading-snug">Zero Cancellation Fee on Train Tickets</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">Get 100% full refund on confirmed train tickets cancelled 4h before chart.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleCopyCode('RAILFREE')}
                  className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-1"
                >
                  <span>CODE: RAILFREE</span>
                  {copiedCode === 'RAILFREE' && <span className="text-emerald-600 text-[9px]">Copied</span>}
                </button>
                <button 
                  type="button"
                  onClick={() => handleBookTrain({ name: 'Vande Bharat Express (20172)', from: 'Delhi', to: 'Varanasi', price: 1750, class: 'CC' })}
                  className="text-xs font-black text-[#008cff] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  BOOK NOW
                </button>
              </div>
            </article>

            {/* Offer 6: Outstation & Airport Cabs */}
            <article className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg transition bg-white group">
              <div className="flex space-x-4">
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white p-2 text-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">local_taxi</span>
                  <span className="text-xs font-black mt-1">AIRPORT</span>
                  <span className="text-[9px] font-semibold">CABS</span>
                </div>
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-amber-700 tracking-wider uppercase bg-amber-50 px-2 py-0.5 rounded">CAB OFFERS</span>
                      <span className="text-[9px] text-gray-400 uppercase font-medium">FIXED FARE</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 mt-1.5 leading-snug">Guaranteed On-Time Pickups or ₹500 Back</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">Book airport transfer and intercity cabs with verified top-rated drivers.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleCopyCode('CABRIDE')}
                  className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-1"
                >
                  <span>CODE: CABRIDE</span>
                  {copiedCode === 'CABRIDE' && <span className="text-emerald-600 text-[9px]">Copied</span>}
                </button>
                <button 
                  type="button"
                  onClick={() => handleBookCab({ name: 'Airport Prime Sedan', pickup: 'IGI Airport T3', drop: 'City Center', price: 650 })}
                  className="text-xs font-black text-[#008cff] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  BOOK NOW
                </button>
              </div>
            </article>
          </div>
        </section>

        {/* ── 6. HANDPICKED TRAVEL COLLECTIONS ── */}
        <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 sm:p-8 mb-8" aria-label="Collections">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Handpicked Travel Collections</h2>
              <p className="text-xs text-gray-500 mt-1">Curated destinations and exclusive travel themes loved by our travelers worldwide</p>
            </div>
            <span className="text-xs font-bold text-[#008cff] uppercase">Featured 2026 Picks</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: 'Visa-Free Escapes',
                price: 'From ₹18,500/person',
                tag: 'EASY TRAVEL',
                tagClass: 'bg-emerald-600',
                img: 'https://lh3.googleusercontent.com/aida/AEtjO1VTYbPagZqdRtQbVAJ2ECGyQPnAIFVdnzDXOlE9GOIi7KgGttsEX1WLZrlVqwHjlVxzNLDffHUlsCle8vDRIhMlTItAVnsuwVw18KwRVObLkiMM4FUG8aoaiZjEkUYwTjaq-TjTCKXxhlM9TIV5-HwAKePhl735_tGGn2xRKe2QVQAAKbwYpJDdi09km43vW2Yfvd5bulTpcVlJq02rVqj5p5AobAsiR35A-bxx53GXcwkCxZCsiehu39w',
              },
              {
                title: 'Island Escapes & Lagoons',
                price: 'From ₹32,000/person',
                tag: 'BEACHFRONT',
                tagClass: 'bg-[#008cff]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUwq_xPgxAv6lbOMiJJZW4lqUa7h9B-QuvK74MkYiNpsu1B79ZDluZj-oaAqbM8pvrTefYnteGW8drifvks_MueTPsOWZksbbjs7Z0PH5PQnTy86V8gq1-6ELukrC7Bjlu6KBx9b29WneKlGxp22sHo-AdgGzETFLM39-XqN_LQVYohTBnW2Ob6HG6ji5Tj4iLEeOKd53fKdjwADCVeLzNPf3Lxl8enIrFWO09dExH9aZkH7vD03WO',
              },
              {
                title: 'Luxury Private Villas',
                price: 'From ₹8,990/night',
                tag: 'PRIVATE CHEF',
                tagClass: 'bg-amber-600',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZL3FnIM9sWSZXOM9_7yEof5GRgScVLdrxNVjcDYZofZR3jGxmRAPXPyJqf_j7oi7BpKd-ooslPytaL2TWQsFBjz8mYSr1zkpC-oMUBWlqmLjH2U2Wy5UmzTtYt7cM-vwMgtYGNwhYNeVEAG7oMhUe0SjnDSFnvOT_ntqJWcUSh8Cgllt4m0Xof0geozpf3p7RPqig0Nls9GgAYvgg0DHIj0ugtVnHUOPtOHiJmf70NqCoT9D8KS7k',
              },
              {
                title: 'Romantic Overwater Honeymoons',
                price: 'From ₹49,990/pkg',
                tag: 'COUPLES',
                tagClass: 'bg-rose-600',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUloYo_gaPu80WDMb1Se_qsfR1vpiNdsh-18_Kwq_SzD1g9wFxd46V9A8CCjuZtjm4LfpAyhjX3TO6nIL-ySonU81chCkRP0qhjerOLEEieGReSkMLT2Up_WnDLiMh10RjInK2bCdwibDgVkqdL400KdXj0Q7-G2mQQiOdOVrh-hOAT86ycwx0w2m6O_69QSBpWEr7sKObFCfxfJAjC4F96uiTBpMqAtuPFUaxE3YTD2geijcgObU7',
              },
            ].map(col => (
              <div 
                key={col.title}
                onClick={handleExecuteFlightSearch}
                className="group relative rounded-xl overflow-hidden border border-gray-200 cursor-pointer shadow-xs hover:shadow-md transition bg-white"
              >
                <div className="h-44 bg-slate-800 relative overflow-hidden">
                  <img src={col.img} alt={col.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className={`absolute top-3 left-3 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow ${col.tagClass}`}>
                    {col.tag}
                  </span>
                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist({
                        id: `collection-${col.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                        title: col.title,
                        category: 'PACKAGE',
                        location: 'Global Curated Escape',
                        price: parseInt(col.price.replace(/[^\d]/g, '')) || 18500,
                        image: col.img,
                        badge: col.tag,
                      });
                    }}
                    className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-110 active:scale-95"
                    title={isWishlisted(`collection-${col.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <span 
                      className={`material-symbols-outlined text-[18px] transition-colors ${
                        isWishlisted(`collection-${col.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`) ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
                      }`}
                      style={isWishlisted(`collection-${col.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`) ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      favorite
                    </span>
                  </button>
                </div>
                <div className="p-4 bg-white">
                  <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-[#008cff] transition line-clamp-1">{col.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 font-semibold">{col.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── APP DOWNLOAD BANNER (SS Journey Style) ── */}
        <AppDownloadBanner />

        {/* ── 7. VALUE PROPOSITIONS / TRUST STRIP ── */}
        <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 sm:p-8 mb-8" aria-label="Why Book With Us">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900">Why Book with SS Journey?</h3>
            <p className="text-xs text-gray-500 mt-1">Trusted by over 100,000+ satisfied travelers across India and abroad</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: 'support_agent', title: '24*7 Live Travel Support', desc: 'Average call & chat response under 2 minutes', color: 'text-[#008cff]' },
              { icon: 'security', title: '100% Secure Payments', desc: 'Encrypted checkout with UPI, Cards & NetBanking', color: 'text-emerald-600' },
              { icon: 'price_check', title: 'Lowest Price Guaranteed', desc: 'Zero hidden surcharges on flights & hotels', color: 'text-[#f28c1c]' },
              { icon: 'currency_exchange', title: 'Instant Easy Refunds', desc: 'Automatic refund credits without cancellation hassle', color: 'text-purple-600' },
            ].map(p => (
              <div key={p.title} className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className={`w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center shrink-0 ${p.color}`}>
                  <span className="material-symbols-outlined text-[22px]">{p.icon}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">{p.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. TOP FLIGHT ROUTES ACCORDION DIRECTORY ── */}
        <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 sm:p-8" aria-label="Routes Directory">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#008cff] text-[22px]">connecting_airports</span>
              <h3 className="text-lg font-black text-gray-900">Popular High-Frequency Routes</h3>
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Live Fares</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Delhi to Mumbai Flights',
              'Mumbai to Bengaluru Flights',
              'Delhi to Goa Flights',
              'Bengaluru to Hyderabad Flights',
              'Delhi to Dubai Flights',
              'San Francisco to Tokyo Flights',
              'London to Delhi Flights',
              'Delhi to Varanasi Trains',
              'Bengaluru to Goa Volvo Buses',
              'Delhi Airport T3 Cabs',
            ].map(route => (
              <button
                key={route}
                type="button"
                onClick={handleExecuteFlightSearch}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-[#008cff] text-gray-700 text-xs font-medium transition cursor-pointer"
              >
                {route}
              </button>
            ))}
          </div>
        </section>

        {/* ── 8. INTERACTIVE CALENDAR POPUP MODAL ── */}
        <CalendarPickerModal
          isOpen={calendarModalState?.isOpen ?? false}
          onClose={() => setCalendarModalState(null)}
          title={calendarModalState?.title ?? 'Select Date'}
          selectedDate={calendarModalState?.date ?? departDate}
          minDate={calendarModalState?.minDate}
          onSelectDate={handleDateSelected}
        />

        {/* ── 9. MAP LOCATION SEARCH MODAL ── */}
        <MapLocationSearchModal
          isOpen={mapModalState?.isOpen ?? false}
          onClose={() => setMapModalState(null)}
          title={mapModalState?.title ?? 'Select Location (Map Search)'}
          type={mapModalState?.type ?? 'pickup'}
          currentValue={mapModalState?.type === 'pickup' ? cabPickupAddress : cabDropAddress}
          defaultCity={cabCity.city}
          onSelectLocation={(place) => {
            if (mapModalState?.type === 'pickup') {
              setCabPickupAddress(place.name);
              if (place.lat && place.lon) {
                setPickupCoords({ lat: place.lat, lon: place.lon });
              }
              if (place.city) {
                const matchedCity = popularCabCities.find(
                  c => c.city.toLowerCase() === place.city!.toLowerCase()
                );
                if (matchedCity) setCabCity(matchedCity);
              }
            } else {
              setCabDropAddress(place.name);
              if (place.lat && place.lon) {
                setDropCoords({ lat: place.lat, lon: place.lon });
              }
            }
            setMapModalState(null);
          }}
        />
      </main>
    </div>
  );
};
