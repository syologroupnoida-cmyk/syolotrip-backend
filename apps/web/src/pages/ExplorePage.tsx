import React, { useState, useRef, useEffect } from 'react';
import { WebCheckoutItem } from './BookingCheckoutPage';
import { ScreenType } from '../components/Header';
import { AppDownloadBanner } from '../components/AppDownloadBanner';
import { useWishlist } from '../context/WishlistContext';
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
}

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

interface ExplorePageProps {
  onNavigate?: (screen: ScreenType) => void;
  onSearchFlights?: (params: FlightSearchParams) => void;
  onSearchHotels?: (params: HotelSearchParams) => void;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ 
  onNavigate,
  onSearchFlights,
  onSearchHotels,
  onInitiateCheckout,
}) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
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

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<'origin' | 'destination' | 'hotel' | 'cabin' | 'passengers' | null>(null);
  const [cabinClass, setCabinClass] = useState('Economy');
  const [passengerCount, setPassengerCount] = useState('1 Adult');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [routeValidationError, setRouteValidationError] = useState<string | null>(null);

  // Calendar modal state
  const [calendarModalState, setCalendarModalState] = useState<{
    isOpen: boolean;
    type: 'depart' | 'return' | 'checkIn' | 'checkOut';
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
      handleExecuteHotelSearch();
    } else if (searchMode === 'trains') {
      if (onNavigate) {
        onNavigate('trains');
      }
    } else if (searchMode === 'buses') {
      if (onNavigate) {
        onNavigate('buses');
      }
    } else if (searchMode === 'cabs') {
      if (onNavigate) {
        onNavigate('cabs');
      }
    } else if (searchMode === 'holidays') {
      if (onNavigate) {
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
        country: 'Dubai (UAE)',
        type: '30-Days Express Tourist eVisa',
        price: 6499,
      });
    } else if (searchMode === 'insurance') {
      handleBuyInsurance({
        planName: 'Global Travel Shield Platinum ($250,000 Medical Cover)',
        cover: 'Worldwide Medical & Baggage Protection',
        price: 850,
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
      {/* ── 1. SS JOURNEY TROPICAL HERO BACKDROP ── */}
      <div className="relative w-full h-[540px] overflow-hidden select-none">
        <img 
          src="/assets/hero-bg-bright.jpg" 
          alt="Crystal Clear Sunny Tropical Beach & Azure Sky Hero Backdrop" 
          className="w-full h-full object-cover object-top filter brightness-105 contrast-105 saturate-110"
        />
        {/* Soft, bright atmospheric gradient that preserves sky clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-[#f4f6f8] pointer-events-none" />
      </div>

      {/* ── 2. MAIN FLOATING CONTAINER OVERLAY ── */}
      <main className="relative -mt-[440px] z-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto">
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

              {/* Interchange Swap Button */}
              <div className="hidden md:flex absolute left-[25%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
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

              {/* Airport Search Dropdown Popover */}
              {activeDropdown && (activeDropdown === 'origin' || activeDropdown === 'destination') && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-full z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-96 ${
                    activeDropdown === 'origin' ? 'left-0' : 'left-0 sm:right-0 sm:left-auto'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <span className="text-xs font-bold text-gray-800">
                      Select {activeDropdown === 'origin' ? 'Departure City / Airport' : 'Destination City / Airport'}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setActiveDropdown(null)} 
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  <div className="relative mb-3">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">search</span>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type city or airport code (e.g. DEL, BOM, SFO)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#008cff]"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
                    {filteredAirports.map(apt => (
                      <div
                        key={apt.code}
                        onClick={() => {
                          setRouteValidationError(null);
                          if (activeDropdown === 'origin') setOriginAirport(apt);
                          else setDestinationAirport(apt);
                          setActiveDropdown(null);
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
            <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible hover:border-blue-300 transition">
              <div 
                onClick={() => setActiveDropdown(activeDropdown === 'hotel' ? null : 'hotel')}
                className="md:col-span-5 p-4 cursor-pointer hover:bg-blue-50/40 transition rounded-l-xl relative"
              >
                <span className="text-[12px] font-normal text-gray-500 block">City, Property Name or Location</span>
                <span className="text-3xl font-extrabold text-gray-900 block tracking-tight my-0.5">{hotelCity.city}</span>
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
                <div className="flex items-center space-x-1 text-gray-500">
                  <span className="text-[12px] font-normal">Check-in</span>
                  <span className="material-symbols-outlined text-[14px] text-[#008cff]">calendar_today</span>
                </div>
                <span className="text-2xl font-extrabold text-gray-900 block tracking-tight my-0.5">{hotelCheckIn}</span>
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
                className="md:col-span-4 p-4 cursor-pointer hover:bg-blue-50/40 transition border-t md:border-t-0 md:border-l border-gray-200 rounded-r-xl relative"
              >
                <div className="flex items-center space-x-1 text-gray-500">
                  <span className="text-[12px] font-normal">Check-out</span>
                  <span className="material-symbols-outlined text-[14px] text-[#008cff]">event_repeat</span>
                </div>
                <span className="text-2xl font-extrabold text-gray-900 block tracking-tight my-0.5">{hotelCheckOut}</span>
                <span className="text-[11px] text-gray-500 block font-normal">
                  {new Date(hotelCheckOut).toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
              </div>

              {activeDropdown === 'hotel' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-full sm:w-96"
                >
                  <span className="text-xs font-bold text-gray-800 block mb-2">Select Destination</span>
                  <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                    {filteredHotelCities.map(c => (
                      <div
                        key={c.city}
                        onClick={() => { setHotelCity(c); setActiveDropdown(null); }}
                        className="p-2 rounded-lg hover:bg-blue-50 cursor-pointer text-xs flex justify-between"
                      >
                        <span className="font-bold text-gray-900">{c.city}, {c.country}</span>
                        <span className="text-gray-500">{c.region}</span>
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
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-hidden p-4 bg-emerald-50/40">
                <div className="md:col-span-4">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">From Station</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">NDLS (New Delhi)</span>
                  <span className="text-[11px] text-gray-500">Platform 1-16 · Hazrat Nizamuddin</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-emerald-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">To Station</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">MMCT (Mumbai Central)</span>
                  <span className="text-[11px] text-gray-500">Western Railway Fast Hub</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-emerald-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">Travel Class</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Executive / AC 3-Tier</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">IRCTC Authorized Partner</span>
                </div>
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
                      <span className="text-base font-extrabold text-gray-900">₹{train.price.toLocaleString('en-IN')}</span>
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

          {/* ── MODE 4: BUSES ── */}
          {searchMode === 'buses' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-hidden p-4 bg-purple-50/40">
                <div className="md:col-span-4">
                  <span className="text-[12px] text-purple-800 font-bold uppercase tracking-wider block">From City</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Bengaluru (BLR)</span>
                  <span className="text-[11px] text-gray-500">Majestic, Madiwala, Silk Board</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-purple-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-purple-800 font-bold uppercase tracking-wider block">To City</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Panaji, Goa (GOI)</span>
                  <span className="text-[11px] text-gray-500">Mapusa, Panjim KTC Bus Stand</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-purple-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-purple-800 font-bold uppercase tracking-wider block">Bus Category</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">AC Multi-Axle Sleeper</span>
                  <span className="text-[11px] text-purple-700 font-semibold">Live GPS Tracking Included</span>
                </div>
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
                      <span className="text-base font-extrabold text-gray-900">₹{bus.price.toLocaleString('en-IN')}</span>
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

          {/* ── MODE 5: CABS ── */}
          {searchMode === 'cabs' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-hidden p-4 bg-amber-50/40">
                <div className="md:col-span-4">
                  <span className="text-[12px] text-amber-800 font-bold uppercase tracking-wider block">Pickup Address</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Delhi Airport (DEL T3)</span>
                  <span className="text-[11px] text-gray-500">Terminal 3 Arrival Pillar 10</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-amber-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-amber-800 font-bold uppercase tracking-wider block">Drop Location</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Connaught Place (CP)</span>
                  <span className="text-[11px] text-gray-500">Central Delhi</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-amber-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-amber-800 font-bold uppercase tracking-wider block">Ride Type</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Sedan · Fixed Tolls</span>
                  <span className="text-[11px] text-amber-700 font-semibold">Zero Surge Guarantee</span>
                </div>
              </div>

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
                      <span className="text-base font-extrabold text-gray-900">₹{cab.price.toLocaleString('en-IN')}</span>
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
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-hidden p-4 bg-rose-50/40">
                <div className="md:col-span-4">
                  <span className="text-[12px] text-rose-800 font-bold uppercase tracking-wider block">Theme / Destination</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Kerala Backwaters &amp; Hills</span>
                  <span className="text-[11px] text-gray-500">Munnar, Thekkady, Alleppey Houseboat</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-rose-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-rose-800 font-bold uppercase tracking-wider block">Duration</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">6 Days / 5 Nights</span>
                  <span className="text-[11px] text-gray-500">Flights + 4-Star Stays + Transfers</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-rose-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-rose-800 font-bold uppercase tracking-wider block">Bundle Savings</span>
                  <span className="text-2xl font-extrabold text-[#eb2026] block">Save 25% Off</span>
                  <span className="text-[11px] text-rose-700 font-semibold">Coupon SSJHOLIDAY Applied</span>
                </div>
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
                      <span className="text-base font-extrabold text-gray-900">₹{pkg.price.toLocaleString('en-IN')}</span>
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

          {/* ── MODE 7: VILLAS & HOMESTAYS ── */}
          {searchMode === 'villas' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-hidden p-4 bg-emerald-50/40">
                <div className="md:col-span-5">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">Destination / City</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">North &amp; South Goa</span>
                  <span className="text-[11px] text-gray-500">Candolim, Anjuna, Calangute, Assagao</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-emerald-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">Check-in / Check-out</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Nov 04 - Nov 08</span>
                  <span className="text-[11px] text-gray-500">4 Nights · 4 Guests</span>
                </div>
                <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-emerald-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">Property Type</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Private Pool Villa</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">Chef &amp; Housekeeping Included</span>
                </div>
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
                      <span className="text-base font-extrabold text-gray-900">₹{villa.price.toLocaleString('en-IN')}<span className="text-[10px] text-gray-500 font-normal">/night</span></span>
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
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-hidden p-4 bg-sky-50/40">
                <div className="md:col-span-5">
                  <span className="text-[12px] text-sky-800 font-bold uppercase tracking-wider block">Destination / City</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Dubai, United Arab Emirates</span>
                  <span className="text-[11px] text-gray-500">Theme Parks, Sightseeing, Desert Safari</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-sky-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-sky-800 font-bold uppercase tracking-wider block">Activity Date</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Instant E-Voucher</span>
                  <span className="text-[11px] text-gray-500">Flexible 30 Days Validity</span>
                </div>
                <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-sky-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-sky-800 font-bold uppercase tracking-wider block">Experience Type</span>
                  <span className="text-2xl font-extrabold text-sky-700 block">Skip The Line</span>
                  <span className="text-[11px] text-sky-600 font-semibold">100% Guaranteed Entry</span>
                </div>
              </div>

              {/* Fast Available Attraction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { name: 'Burj Khalifa: At The Top (124th + 125th Floor)', city: 'Dubai, UAE', price: 3850, highlight: 'Instant Mobile Ticket · Sky Views · 4.9 ★' },
                  { name: 'Universal Studios Singapore One-Day Pass', city: 'Sentosa, Singapore', price: 5400, highlight: 'Direct Barcode Entry · All Rides Access · 4.8 ★' },
                ].map((act) => (
                  <div key={act.name} className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">{act.name}</span>
                      <span className="text-[11px] text-gray-500">{act.city}</span>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded mt-1 inline-block">{act.highlight}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-extrabold text-gray-900">₹{act.price.toLocaleString('en-IN')}<span className="text-[10px] text-gray-500 font-normal">/person</span></span>
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
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-hidden p-4 bg-emerald-50/40">
                <div className="md:col-span-5">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">Destination Country</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Dubai (United Arab Emirates)</span>
                  <span className="text-[11px] text-gray-500">Also available: Thailand, Singapore, Schengen, Vietnam</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-emerald-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">Visa Category</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">30-Days Express Tourist eVisa</span>
                  <span className="text-[11px] text-gray-500">100% Online · No Embassy Visit</span>
                </div>
                <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-emerald-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-emerald-800 font-bold uppercase tracking-wider block">Approval Rate</span>
                  <span className="text-2xl font-extrabold text-emerald-600 block">99.7% Success</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">Free Re-Application Guarantee</span>
                </div>
              </div>

              {/* Fast Available Visa Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { country: 'Dubai (UAE)', type: '30-Days Express Tourist eVisa', speed: 'Processed in 48 Hours', price: 6499, highlight: 'Only Passport Scan & Photo Needed' },
                  { country: 'Thailand', type: 'Fast-Track eVisa on Arrival', speed: 'Processed in 24 Hours', price: 2999, highlight: 'Skip Long Airport Immigration Lines' },
                ].map((visaItem) => (
                  <div key={visaItem.country} className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">{visaItem.country} · {visaItem.type}</span>
                      <span className="text-[11px] text-gray-500">{visaItem.speed}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">{visaItem.highlight}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-extrabold text-gray-900">₹{visaItem.price.toLocaleString('en-IN')}</span>
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
              <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-hidden p-4 bg-blue-50/40">
                <div className="md:col-span-5">
                  <span className="text-[12px] text-blue-800 font-bold uppercase tracking-wider block">Travel Coverage Destination</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">International (Worldwide)</span>
                  <span className="text-[11px] text-gray-500">Includes USA, Canada &amp; 27 Schengen European Countries</span>
                </div>
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-blue-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-blue-800 font-bold uppercase tracking-wider block">Medical Sum Insured</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">Up to $500,000 Cover</span>
                  <span className="text-[11px] text-gray-500">Zero Deductibles · Cashless Hospitals</span>
                </div>
                <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-blue-200 pl-0 md:pl-4">
                  <span className="text-[12px] text-blue-800 font-bold uppercase tracking-wider block">Policy Delivery</span>
                  <span className="text-2xl font-extrabold text-[#008cff] block">Instant PDF</span>
                  <span className="text-[11px] text-blue-700 font-semibold">100% Embassy &amp; Visa Approved</span>
                </div>
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
                      <span className="text-base font-extrabold text-gray-900">₹{ins.price.toLocaleString('en-IN')}<span className="text-[10px] text-gray-500 font-normal">/trip</span></span>
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
          <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 z-30">
            <button 
              type="button"
              onClick={handleMasterSearch}
              className="bg-gradient-to-r from-[#53b2fe] to-[#065af3] hover:from-[#44a6f4] hover:to-[#0050e0] text-white text-base font-extrabold uppercase px-14 py-3.5 rounded-full shadow-[0_4px_16px_rgba(0,140,255,0.45)] tracking-wider hover:brightness-105 active:scale-[0.98] transition cursor-pointer flex items-center space-x-2"
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
      </main>
    </div>
  );
};
