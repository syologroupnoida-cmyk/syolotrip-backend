import React, { useState, useRef, useEffect } from 'react';

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
  { code: 'NRT', city: 'Tokyo', name: 'Tokyo Narita International Airport', country: 'Japan' },
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

// ─── Mock Data ───────────────────────────────────────────
const recentRoutes = [
  { from: 'DEL', to: 'TYO', dates: 'Oct 24 - Oct 31 · Roundtrip', price: '₹64,890', trend: '-₹3,500 dropped', trendIcon: 'trending_down', trendColor: 'text-tertiary' },
  { from: 'BOM', to: 'LON', dates: 'Nov 02 - Nov 09 · Non-stop', price: '₹41,200', trend: 'Best Price', trendIcon: 'price_check', trendColor: 'text-tertiary' },
  { from: 'BLR', to: 'DPS', dates: 'Dec 10 - Dec 24 · 1 Stop', price: '₹69,450', trend: '+₹1,500 rising', trendIcon: 'trending_up', trendColor: 'text-secondary-container' },
  { from: 'DEL', to: 'DXB', dates: 'Oct 30 - Nov 07 · Non-stop', price: '₹22,800', trend: '3 seats left', trendIcon: 'alarm', trendColor: 'text-tertiary' },
];

const destinations = [
  {
    city: 'Tokyo', country: 'Japan', flightPrice: '₹64,890', stayPrice: '₹11,650', flightTime: '8h 45m direct',
    weather: '21°C · Crisp Autumn', weatherIcon: 'wb_sunny', badge: 'High Season Deal', airportCode: 'HND',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2jUhherf7iNYB2EbUj1tQ9IVVdNm121gohGxr2B2KliLzjDV_cNfB9TDvPJVTnRe5qWZaJy7vnuFZqTvvtCG-dRU7RioHFvnSrLU3cR-PthnyHWznHhe0UP6SlgUCyo9wdAfuAC5VWDDsJHsVzSHtPsbDPeQbLHdPUQRXu2QsWBEdxb51JyFm2fI6LB3d_rorqy69Zj61ikED5GmwSe71TP2fLhJtF5i_BFPfHRpUJaPmGxBPm5Pc',
    large: true,
  },
  {
    city: 'Paris', country: 'France', flightPrice: '₹42,200', stayPrice: '₹13,800', flightTime: '9h 30m direct',
    weather: '16°C · Mild', weatherIcon: 'cloud', badge: null, airportCode: 'CDG',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0E7RHXytjncZWInVu6Jq1inHh-1PungrJj2Yv_ETg17I3Vdx3cR5Z7ZTi2m4DDgb5GqvXyA7PbaAEK-uwhm2d-Q_aZ2qYCIwfI2VI1WUoRx-FDwvXPuA42b1Dp2YpYykOhxVDLALrn8zE9hAB65y3O2vcgR6qBucn3zVbsXWxhsw1W7PxBliKjK8VuZkGaANoDpBWRxSK_6WfetLziszlKj_o_2uGIPgxlJ6omW82YtShD3anwuq6',
    large: false,
  },
  {
    city: 'Bali', country: 'Indonesia', flightPrice: '₹34,450', stayPrice: '₹6,990', flightTime: null,
    weather: '29°C · Tropical', weatherIcon: 'sunny', badge: null, airportCode: 'DPS',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABdRp7_viwFFEjk8QX9KySx437QTek4nJEiWLyP7kiHvY75KRMDNlequ0fxmbBOPZvR-Bj1igm66x9OcWXoRD3LhuJYXzhiJNg70VaWA3KQ-3nNi70FNPYYd6PCstToyHFTT0GvZno9pcc4zWpQ5dptSgyCBsCRXIzqBMfbKjA7IBRPDwZMPecEm6-zhzenCRUuxLBnIMoE0RpwroU_9yGLkVNqqVkr8JbDrK4HHph5CJECcUPmwIj',
    large: false,
  },
  {
    city: 'Dubai', country: 'UAE', flightPrice: '₹22,800', stayPrice: '₹9,450', flightTime: null,
    weather: '28°C · Pleasant', weatherIcon: 'wb_sunny', badge: null, airportCode: 'DXB',
    img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    large: false,
  },
  {
    city: 'Santorini', country: 'Greece', flightPrice: '₹51,100', stayPrice: '₹16,050', flightTime: null,
    weather: '24°C · Sunny', weatherIcon: 'wb_sunny', badge: 'Editors Pick', airportCode: 'CDG',
    img: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80',
    large: false,
  },
];

const filterPills = ['All Trending', 'Asia-Pacific', 'Europe', 'Americas', 'Tropical'];

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

interface ExplorePageProps {
  onNavigate?: (screen: 'explore' | 'flights' | 'hotels' | 'checkout' | 'trips') => void;
  onSearchFlights?: (params: FlightSearchParams) => void;
  onSearchHotels?: (params: HotelSearchParams) => void;
}

// ─── Component ───────────────────────────────────────────
export const ExplorePage: React.FC<ExplorePageProps> = ({ 
  onNavigate,
  onSearchFlights,
  onSearchHotels,
}) => {
  const [searchMode, setSearchMode] = useState<'flights' | 'hotels' | 'bundles' | 'trains' | 'buses' | 'cabs'>('flights');
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway' | 'multicity'>('roundtrip');
  const [activeFilter, setActiveFilter] = useState('All Trending');

  // Flight search state
  const [originAirport, setOriginAirport] = useState<AirportOption>(popularAirports[3]); // SFO
  const [destinationAirport, setDestinationAirport] = useState<AirportOption>(popularAirports[4]); // HND
  const [departDate, setDepartDate] = useState('2026-10-24');
  const [returnDate, setReturnDate] = useState('2026-10-31');

  // Hotel search state
  const [hotelCity, setHotelCity] = useState<HotelCityOption>(popularHotelCities[0]); // Paris
  const [hotelCheckIn, setHotelCheckIn] = useState('2026-11-04');
  const [hotelCheckOut, setHotelCheckOut] = useState('2026-11-11');

  // Dropdown UI states
  const [activeDropdown, setActiveDropdown] = useState<'origin' | 'destination' | 'hotel' | 'cabin' | 'passengers' | null>(null);
  const [cabinClass, setCabinClass] = useState('Economy');
  const [passengerCount, setPassengerCount] = useState('1 Adult');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
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
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 300);
    const temp = originAirport;
    setOriginAirport(destinationAirport);
    setDestinationAirport(temp);
  };

  const handleExecuteFlightSearch = () => {
    const params: FlightSearchParams = {
      fromCode: originAirport.code,
      fromCity: originAirport.city,
      toCode: destinationAirport.code,
      toCity: destinationAirport.city,
      departDate,
      returnDate: tripType === 'roundtrip' ? returnDate : undefined,
    };
    if (onSearchFlights) {
      onSearchFlights(params);
    } else {
      onNavigate?.('flights');
    }
  };

  const handleExecuteHotelSearch = () => {
    const params: HotelSearchParams = {
      city: hotelCity.city,
      checkIn: hotelCheckIn,
      checkOut: hotelCheckOut,
    };
    if (onSearchHotels) {
      onSearchHotels(params);
    } else {
      onNavigate?.('hotels');
    }
  };

  const filteredAirports = popularAirports.filter(a => 
    a.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHotelCities = popularHotelCities.filter(h =>
    h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* ── HERO CONSOLE & INSPIRATION ── */}
      <section className="relative z-20 w-full bg-primary pb-space-xl">
        {/* Atmospheric Flight Path SVG */}
        <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
          <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1440 600">
            <path className="text-tertiary-fixed" d="M-100 200 C300 50, 700 450, 1100 120 C1300 -40, 1500 80, 1600 150" stroke="currentColor" strokeDasharray="8 8" strokeWidth="2" />
            <path className="text-secondary-fixed" d="M100 550 C450 300, 850 500, 1300 250" stroke="currentColor" strokeDasharray="6 6" strokeWidth="1.5" />
            <circle className="fill-tertiary-fixed animate-pulse" cx="1100" cy="120" r="5" />
            <circle className="fill-secondary-fixed" cx="300" cy="50" r="4" />
          </svg>
        </div>

        <div className="relative max-w-[1280px] mx-auto px-gutter pt-space-lg flex flex-col gap-space-lg">
          {/* Hero Text + Metric Badges */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-md">
            <div className="max-w-2xl flex flex-col gap-space-xs">
              {/* <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs bg-white/[0.15] backdrop-blur-md rounded-full w-fit">
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping" />
                <span className="text-label-sm uppercase tracking-wider text-primary-fixed">Winter & Spring Fare Matrix Active</span>
              </div> */}
              <h1 className="text-display-hero text-surface-container-lowest tracking-tight">
                Where do you want to <span className="text-secondary-fixed-dim">wander</span> next?
              </h1>
              <p className="text-body-lg text-primary-fixed max-w-xl">
                Real-time algorithmic routing, unlocked private inventory, and seamless bundles tailored for intentional wanderers.
              </p>
            </div>

            {/* Metric Badges */}
            <div className="hidden lg:flex items-center gap-space-md bg-white/[0.1] backdrop-blur-md px-space-md py-space-sm rounded-xl">
              <div className="flex flex-col">
                <span className="text-headline-sm text-surface-container-lowest">840+</span>
                <span className="text-label-sm text-primary-fixed">Airlines Indexed</span>
              </div>
              <div className="w-[1px] h-8 bg-white/20" />
              <div className="flex flex-col">
                <span className="text-headline-sm text-surface-container-lowest">1.2M+</span>
                <span className="text-label-sm text-primary-fixed">Boutique Stays</span>
              </div>
              <div className="w-[1px] h-8 bg-white/20" />
              <div className="flex flex-col">
                <span className="text-headline-sm text-secondary-fixed-dim">₹0</span>
                <span className="text-label-sm text-primary-fixed">Hidden Surcharges</span>
              </div>
            </div>
          </div>

          {/* ── BOOKING ENGINE CONSOLE ── */}
          <div ref={dropdownRef} className="w-full bg-surface-container-lowest rounded-xl shadow-float p-space-md md:p-space-lg flex flex-col gap-space-md relative z-30">
            {/* Mode Tabs + Trip Types */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-sm">
              <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-xl w-fit flex-wrap">
                {(
                  [
                    { id: 'flights', label: 'Flights', icon: 'flight_takeoff', badge: undefined, badgeClass: '' },
                    { id: 'hotels', label: 'Hotels', icon: 'hotel', badge: undefined, badgeClass: '' },
                    { id: 'bundles', label: 'Flight + Hotel', icon: 'travel', badge: '-25%', badgeClass: 'bg-secondary text-on-secondary' },
                    { id: 'trains', label: 'Trains', icon: 'train', badge: 'Soon', badgeClass: 'bg-[#f28c1c] text-white' },
                    { id: 'buses', label: 'Buses', icon: 'directions_bus', badge: 'Soon', badgeClass: 'bg-[#f28c1c] text-white' },
                    { id: 'cabs', label: 'Cabs', icon: 'local_taxi', badge: 'Soon', badgeClass: 'bg-[#f28c1c] text-white' },
                  ] as const
                ).map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => { setSearchMode(mode.id); setActiveDropdown(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md sm:text-label-lg font-semibold transition-all cursor-pointer ${
                      searchMode === mode.id ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{mode.icon}</span>
                    <span>{mode.label}</span>
                    {mode.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${mode.badgeClass}`}>
                        {mode.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Trip Type sub-options (flights only) */}
              {searchMode === 'flights' && (
                <div className="flex items-center gap-space-sm flex-wrap">
                  <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-lg">
                    {(['roundtrip', 'oneway', 'multicity'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTripType(t)}
                        className={`px-space-xs py-0.5 rounded text-label-md cursor-pointer ${tripType === t ? 'text-primary font-bold bg-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
                      >
                        {t === 'roundtrip' ? 'Round Trip' : t === 'oneway' ? 'One Way' : 'Multi-City'}
                      </button>
                    ))}
                  </div>
                  <div className="h-4 w-[1px] bg-outline-variant hidden sm:block" />
                  <div className="flex items-center gap-space-xs relative">
                    {/* Cabin Class Button */}
                    <button 
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === 'cabin' ? null : 'cabin')}
                      className="flex items-center gap-1 text-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/30"
                    >
                      <span className="material-symbols-outlined text-[16px]">airline_seat_recline_normal</span>
                      <span>{cabinClass}</span>
                      <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </button>

                    {/* Passenger Count Button */}
                    <button 
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === 'passengers' ? null : 'passengers')}
                      className="flex items-center gap-1 text-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/30"
                    >
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      <span>{passengerCount}</span>
                      <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </button>

                    {/* Cabin Dropdown */}
                    {activeDropdown === 'cabin' && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 p-2 z-50 animate-fade-in">
                        {['Economy', 'Premium Economy', 'Business Class', 'First Class'].map(c => (
                          <div
                            key={c}
                            onClick={() => { setCabinClass(c); setActiveDropdown(null); }}
                            className={`p-2 rounded-lg text-label-md cursor-pointer transition-colors ${
                              cabinClass === c ? 'bg-primary text-white font-bold' : 'hover:bg-surface-container text-on-surface'
                            }`}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Passengers Dropdown */}
                    {activeDropdown === 'passengers' && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 p-2 z-50 animate-fade-in">
                        {['1 Adult', '2 Adults', '2 Adults + 1 Child', 'Family (2 Adults, 2 Kids)'].map(p => (
                          <div
                            key={p}
                            onClick={() => { setPassengerCount(p); setActiveDropdown(null); }}
                            className={`p-2 rounded-lg text-label-md cursor-pointer transition-colors ${
                              passengerCount === p ? 'bg-primary text-white font-bold' : 'hover:bg-surface-container text-on-surface'
                            }`}
                          >
                            {p}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── FLIGHT SEARCH FIELDS ── */}
            {searchMode === 'flights' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-xs relative">
                {/* Origin & Destination */}
                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-space-xs relative">
                  {/* Origin Box */}
                  <div 
                    onClick={() => {
                      setActiveDropdown(activeDropdown === 'origin' ? null : 'origin');
                      setSearchQuery('');
                    }}
                    className={`bg-surface-container-low hover:bg-surface-container-high transition-all p-space-sm rounded-lg flex flex-col justify-center cursor-pointer border ${
                      activeDropdown === 'origin' ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">flight_takeoff</span>
                        <span className="text-label-sm uppercase tracking-wider font-semibold">Departure From</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_drop_down</span>
                    </div>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="text-headline-sm text-on-surface font-extrabold">{originAirport.code}</span>
                      <span className="text-body-sm text-on-surface-variant truncate font-medium">{originAirport.city}, {originAirport.country}</span>
                    </div>
                  </div>

                  {/* Swap button */}
                  <button 
                    type="button"
                    onClick={handleSwapAirports}
                    title="Swap Origin and Destination"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface-container-lowest shadow-md border border-outline-variant/30 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-20 cursor-pointer hidden sm:flex"
                  >
                    <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isSwapping ? 'rotate-180' : ''}`}>
                      swap_horiz
                    </span>
                  </button>

                  {/* Destination Box */}
                  <div 
                    onClick={() => {
                      setActiveDropdown(activeDropdown === 'destination' ? null : 'destination');
                      setSearchQuery('');
                    }}
                    className={`bg-surface-container-low hover:bg-surface-container-high transition-all p-space-sm rounded-lg flex flex-col justify-center cursor-pointer border ${
                      activeDropdown === 'destination' ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-secondary">flight_land</span>
                        <span className="text-label-sm uppercase tracking-wider font-semibold">Destination</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_drop_down</span>
                    </div>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="text-headline-sm text-on-surface font-extrabold">{destinationAirport.code}</span>
                      <span className="text-body-sm text-on-surface-variant truncate font-medium">{destinationAirport.city}, {destinationAirport.country}</span>
                    </div>
                  </div>

                  {/* ── DROPDOWN POPOVER FOR AIRPORTS ── */}
                  {activeDropdown && (activeDropdown === 'origin' || activeDropdown === 'destination') && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute top-full z-50 mt-2 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 p-4 w-full sm:w-96 ${
                        activeDropdown === 'origin' ? 'left-0' : 'left-0 sm:right-0 sm:left-auto'
                      } animate-fade-in`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
                        <span className="text-label-md font-bold text-on-surface">
                          Select {activeDropdown === 'origin' ? 'Departure City / Airport' : 'Destination City / Airport'}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setActiveDropdown(null)}
                          className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>

                      {/* Search Input inside popover */}
                      <div className="relative mb-3">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">search</span>
                        <input
                          type="text"
                          autoFocus
                          placeholder="Type city or airport code (e.g. DEL, SFO, Tokyo)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg pl-9 pr-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Airport list */}
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {filteredAirports.length === 0 ? (
                          <div className="p-4 text-center text-body-sm text-on-surface-variant">
                            No airports found matching "{searchQuery}"
                          </div>
                        ) : (
                          filteredAirports.map(airport => (
                            <div
                              key={airport.code}
                              onClick={() => {
                                if (activeDropdown === 'origin') {
                                  setOriginAirport(airport);
                                } else {
                                  setDestinationAirport(airport);
                                }
                                setActiveDropdown(null);
                              }}
                              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-10 h-8 rounded bg-primary/10 text-primary font-bold flex items-center justify-center text-label-md">
                                  {airport.code}
                                </span>
                                <div>
                                  <div className="text-label-lg font-bold text-on-surface">{airport.city}</div>
                                  <div className="text-body-sm text-on-surface-variant truncate max-w-[200px]">{airport.name}</div>
                                </div>
                              </div>
                              <span className="text-label-sm text-on-surface-variant font-medium">{airport.country}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="lg:col-span-4 grid grid-cols-2 gap-space-xs">
                  {/* Depart Date */}
                  <div className="bg-surface-container-low hover:bg-surface-container-high transition-colors p-space-sm rounded-lg flex flex-col justify-center relative cursor-pointer group">
                    <div className="flex items-center gap-space-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      <span className="text-label-sm uppercase tracking-wider font-semibold">Depart</span>
                    </div>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="text-headline-sm text-on-surface font-semibold">
                        {new Date(departDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">
                        {new Date(departDate).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                    <input 
                      type="date" 
                      value={departDate}
                      onChange={(e) => setDepartDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>

                  {/* Return Date */}
                  <div className="bg-surface-container-low hover:bg-surface-container-high transition-colors p-space-sm rounded-lg flex flex-col justify-center relative cursor-pointer group">
                    <div className="flex items-center gap-space-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">event_repeat</span>
                      <span className="text-label-sm uppercase tracking-wider font-semibold">Return</span>
                    </div>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="text-headline-sm text-on-surface font-semibold">
                        {new Date(returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">
                        {new Date(returnDate).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                    <input 
                      type="date" 
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>

                {/* Search CTA */}
                <div className="lg:col-span-3 flex">
                  <button 
                    type="button"
                    onClick={handleExecuteFlightSearch}
                    className="w-full bg-[#f28c1c] hover:bg-[#e57a0e] text-white p-space-md rounded-lg text-headline-sm flex items-center justify-center gap-space-sm transition-all shadow-md group cursor-pointer font-bold"
                  >
                    <span>Search Flights</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── HOTEL SEARCH FIELDS ── */}
            {searchMode === 'hotels' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-xs relative">
                {/* Destination or Property Box */}
                <div className="lg:col-span-5 relative">
                  <div 
                    onClick={() => {
                      setActiveDropdown(activeDropdown === 'hotel' ? null : 'hotel');
                      setSearchQuery('');
                    }}
                    className={`w-full bg-surface-container-low hover:bg-surface-container-high transition-all p-space-sm rounded-lg flex flex-col justify-center cursor-pointer border ${
                      activeDropdown === 'hotel' ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                        <span className="text-label-sm uppercase tracking-wider font-semibold">Destination or City</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_drop_down</span>
                    </div>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="text-headline-sm text-on-surface font-extrabold">{hotelCity.city}, {hotelCity.country}</span>
                      <span className="text-body-sm text-on-surface-variant truncate font-medium">{hotelCity.region}</span>
                    </div>
                  </div>

                  {/* Hotel city dropdown popover */}
                  {activeDropdown === 'hotel' && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-full left-0 z-50 mt-2 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 p-4 w-full sm:w-96 animate-fade-in"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
                        <span className="text-label-md font-bold text-on-surface">Select Destination City</span>
                        <button 
                          type="button"
                          onClick={() => setActiveDropdown(null)}
                          className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>

                      <div className="relative mb-3">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">search</span>
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search city or destination..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg pl-9 pr-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {filteredHotelCities.length === 0 ? (
                          <div className="p-4 text-center text-body-sm text-on-surface-variant">
                            No destinations found matching "{searchQuery}"
                          </div>
                        ) : (
                          filteredHotelCities.map(h => (
                            <div
                              key={h.city}
                              onClick={() => {
                                setHotelCity(h);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-[22px]">hotel</span>
                                <div>
                                  <div className="text-label-lg font-bold text-on-surface">{h.city}</div>
                                  <div className="text-body-sm text-on-surface-variant">{h.region}</div>
                                </div>
                              </div>
                              <span className="text-label-sm text-on-surface-variant font-medium">{h.country}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="lg:col-span-4 grid grid-cols-2 gap-space-xs">
                  <div className="bg-surface-container-low hover:bg-surface-container-high transition-colors p-space-sm rounded-lg flex flex-col justify-center relative cursor-pointer group">
                    <div className="flex items-center gap-space-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      <span className="text-label-sm uppercase tracking-wider font-semibold">Check-in</span>
                    </div>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="text-headline-sm text-on-surface font-semibold">
                        {new Date(hotelCheckIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">
                        {new Date(hotelCheckIn).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                    <input 
                      type="date" 
                      value={hotelCheckIn}
                      onChange={(e) => setHotelCheckIn(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <div className="bg-surface-container-low hover:bg-surface-container-high transition-colors p-space-sm rounded-lg flex flex-col justify-center relative cursor-pointer group">
                    <div className="flex items-center gap-space-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      <span className="text-label-sm uppercase tracking-wider font-semibold">Check-out</span>
                    </div>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="text-headline-sm text-on-surface font-semibold">
                        {new Date(hotelCheckOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">
                        {new Date(hotelCheckOut).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                    <input 
                      type="date" 
                      value={hotelCheckOut}
                      onChange={(e) => setHotelCheckOut(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>

                {/* Hotel Search CTA */}
                <div className="lg:col-span-3 flex">
                  <button 
                    type="button"
                    onClick={handleExecuteHotelSearch}
                    className="w-full bg-[#f28c1c] hover:bg-[#e57a0e] text-white p-space-md rounded-lg text-headline-sm flex items-center justify-center gap-space-sm transition-all shadow-md group cursor-pointer font-bold"
                  >
                    <span>Find Stays</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── BUNDLE SEARCH FIELDS ── */}
            {searchMode === 'bundles' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-xs">
                <div 
                  onClick={() => { setSearchMode('flights'); setActiveDropdown('origin'); }}
                  className="lg:col-span-4 bg-surface-container-low hover:bg-surface-container-high transition-colors p-space-sm rounded-lg flex flex-col justify-center cursor-pointer"
                >
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">flight_takeoff</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">From</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-extrabold">{originAirport.code}</span>
                    <span className="text-body-sm text-on-surface-variant">{originAirport.city}</span>
                  </div>
                </div>
                <div 
                  onClick={() => { setSearchMode('flights'); setActiveDropdown('destination'); }}
                  className="lg:col-span-4 bg-surface-container-low hover:bg-surface-container-high transition-colors p-space-sm rounded-lg flex flex-col justify-center cursor-pointer"
                >
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">Destination</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-extrabold">{destinationAirport.city}, {destinationAirport.country}</span>
                  </div>
                </div>
                <div className="lg:col-span-4 flex">
                  <button 
                    type="button"
                    onClick={() => onNavigate?.('checkout')}
                    className="w-full bg-[#f28c1c] hover:bg-[#e57a0e] text-white p-space-md rounded-lg text-headline-sm flex items-center justify-center gap-space-sm transition-all shadow-md group cursor-pointer font-bold"
                  >
                    <span>Find Bundles</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── TRAIN SEARCH FIELDS (COMING SOON) ── */}
            {searchMode === 'trains' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-xs animate-fade-in">
                <div className="lg:col-span-3 bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-center">
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">train</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">From Station</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-extrabold">NDLS</span>
                    <span className="text-body-sm text-on-surface-variant">New Delhi</span>
                  </div>
                </div>
                <div className="lg:col-span-3 bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-center">
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">directions_railway</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">To Station</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-extrabold">BCT</span>
                    <span className="text-body-sm text-on-surface-variant">Mumbai Central</span>
                  </div>
                </div>
                <div className="lg:col-span-3 bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-center">
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">Travel Date</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-semibold">Tomorrow</span>
                    <span className="text-body-sm text-on-surface-variant">AC 3-Tier · General</span>
                  </div>
                </div>
                <div className="lg:col-span-3 flex">
                  <button 
                    type="button"
                    onClick={() => alert('🚄 IRCTC Rail & High-Speed Train booking is launching soon! Real-time PNR, Tatkal fare alerts & seat predictions in development.')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-space-md rounded-lg text-headline-sm flex items-center justify-center gap-space-sm transition-all shadow-md group cursor-pointer font-bold"
                  >
                    <span>Check Trains</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── BUS SEARCH FIELDS (COMING SOON) ── */}
            {searchMode === 'buses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-xs animate-fade-in">
                <div className="lg:col-span-3 bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-center">
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-purple-600">directions_bus</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">From City</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-extrabold">BLR</span>
                    <span className="text-body-sm text-on-surface-variant">Bengaluru</span>
                  </div>
                </div>
                <div className="lg:col-span-3 bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-center">
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-purple-600">location_on</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">To City</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-extrabold">GOI</span>
                    <span className="text-body-sm text-on-surface-variant">Panaji, Goa</span>
                  </div>
                </div>
                <div className="lg:col-span-3 bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-center">
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">Depart Date</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-semibold">Tonight</span>
                    <span className="text-body-sm text-on-surface-variant">AC Multi-Axle Volvo</span>
                  </div>
                </div>
                <div className="lg:col-span-3 flex">
                  <button 
                    type="button"
                    onClick={() => alert('🚌 Intercity Bus Booking is launching soon! Over 50,000 routes connecting AC Sleeper & Volvo luxury buses.')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white p-space-md rounded-lg text-headline-sm flex items-center justify-center gap-space-sm transition-all shadow-md group cursor-pointer font-bold"
                  >
                    <span>Find Buses</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── CAB SEARCH FIELDS (COMING SOON) ── */}
            {searchMode === 'cabs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-xs animate-fade-in">
                <div className="lg:col-span-3 bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-center">
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">local_taxi</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">Pickup Location</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-extrabold">DEL T3</span>
                    <span className="text-body-sm text-on-surface-variant">IGI Airport</span>
                  </div>
                </div>
                <div className="lg:col-span-3 bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-center">
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">pin_drop</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">Drop Location</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-extrabold">CP</span>
                    <span className="text-body-sm text-on-surface-variant">Connaught Place</span>
                  </div>
                </div>
                <div className="lg:col-span-3 bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-center">
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span className="text-label-sm uppercase tracking-wider font-semibold">Pickup Time</span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="text-headline-sm text-on-surface font-semibold">Now</span>
                    <span className="text-body-sm text-on-surface-variant">Sedan · Fixed Fare</span>
                  </div>
                </div>
                <div className="lg:col-span-3 flex">
                  <button 
                    type="button"
                    onClick={() => alert('🚖 Airport & Outstation Cabs are launching soon! Transparent fixed fares with guaranteed on-time pickups.')}
                    className="w-full bg-[#f28c1c] hover:bg-[#e57a0e] text-white p-space-md rounded-lg text-headline-sm flex items-center justify-center gap-space-sm transition-all shadow-md group cursor-pointer font-bold"
                  >
                    <span>Reserve Cab</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Filters */}
            <div className="flex items-center justify-between flex-wrap gap-space-sm pt-space-xs text-on-surface-variant text-label-sm">
              <div className="flex items-center gap-space-md flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-on-surface">
                  <input type="checkbox" defaultChecked className="accent-primary rounded" />
                  <span>Direct flights only</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-on-surface">
                  <input type="checkbox" className="accent-primary rounded" />
                  <span>Include nearby regional hubs</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-on-surface">
                  <input type="checkbox" defaultChecked className="accent-primary rounded" />
                  <span>Free cancellation eligible</span>
                </label>
              </div>
              <div className="flex items-center gap-space-xs text-tertiary">
                <span className="material-symbols-outlined text-[16px]">insights</span>
                <span>Predictive fare tracker: <strong className="text-on-surface">Book within 4 days for lowest tier</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RECENT SEARCHES & LIVE FARE TICKER ── */}
      <section className="relative z-10 w-full bg-surface-container-low py-space-md shadow-card">
        <div className="max-w-[1280px] mx-auto px-gutter">
          <div className="flex items-center justify-between mb-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">history</span>
              <span className="text-label-lg text-on-surface font-bold uppercase tracking-wider">Your Route Watchlist & Recent Queries</span>
            </div>
            <button 
              type="button" 
              onClick={() => alert('Recent search history cleared')}
              className="text-label-md text-primary hover:underline cursor-pointer"
            >
              Clear History
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
            {recentRoutes.map((r, i) => (
              <div 
                key={i} 
                onClick={() => {
                  const orig = popularAirports.find(a => a.code === r.from) || popularAirports[0];
                  const dest = popularAirports.find(a => a.code === (r.to === 'TYO' ? 'HND' : r.to === 'LON' ? 'LHR' : r.to)) || popularAirports[4];
                  setOriginAirport(orig);
                  setDestinationAirport(dest);
                  if (onSearchFlights) {
                    onSearchFlights({
                      fromCode: orig.code,
                      fromCity: orig.city,
                      toCode: dest.code,
                      toCity: dest.city,
                    });
                  } else {
                    onNavigate?.('flights');
                  }
                }}
                className="bg-surface-container-lowest p-space-sm rounded-lg shadow-card flex items-center justify-between card-hover cursor-pointer border border-transparent hover:border-primary/30 transition-all"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-label-lg font-bold text-on-surface">
                    <span>{r.from}</span>
                    <span className="material-symbols-outlined text-[14px] text-outline">arrow_forward</span>
                    <span>{r.to}</span>
                  </div>
                  <span className="text-body-sm text-on-surface-variant">{r.dates}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-label-lg text-primary font-bold tabular-nums">from {r.price}</span>
                  <span className={`text-label-sm ${r.trendColor} flex items-center gap-0.5`}>
                    <span className="material-symbols-outlined text-[12px]">{r.trendIcon}</span>
                    {r.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMOTIONAL BUNDLE SPOTLIGHT ── */}
      <section className="max-w-[1280px] mx-auto px-gutter py-space-xl w-full">
        <div className="bg-gradient-to-r from-primary-container via-primary to-primary text-on-primary rounded-xl overflow-hidden p-space-lg md:p-space-xl relative shadow-float">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-white/5 pointer-events-none blur-3xl" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            <div className="lg:col-span-8 flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="bg-secondary-container text-on-secondary px-space-sm py-0.5 rounded-full text-label-sm font-bold uppercase tracking-wider">
                  Exclusive Package Discount
                </span>
                <span className="bg-white/20 backdrop-blur-md px-space-sm py-0.5 rounded-full text-label-sm text-tertiary-fixed">
                  Flash Deal: Ends in 18h 42m
                </span>
              </div>
              <h2 className="text-headline-xl text-surface-container-lowest tracking-tight">
                Unlock up to 25% savings by bundling Flights & Stays together.
              </h2>
              <p className="text-body-lg text-primary-fixed max-w-xl">
                Airlines and luxury resorts release wholesale packaging rates not available anywhere else. One checkout, one confirmed itinerary, zero stress.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md pt-space-xs">
                {[
                  { icon: 'verified', label: 'Guaranteed At-Cost Transfers' },
                  { icon: 'room_service', label: 'Complimentary Room Upgrades' },
                  { icon: 'savings', label: 'Avg. ₹31,500 Saved / Couple' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">{p.icon}</span>
                    <span className="text-label-md text-surface-container-lowest">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center">
              <div className="bg-white/[0.1] backdrop-blur-md p-space-md rounded-xl flex flex-col gap-space-sm w-full max-w-sm">
                <span className="text-label-sm uppercase tracking-wider text-primary-fixed">Featured Package Drop</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-headline-sm text-surface-container-lowest font-bold">Kyoto Heritage Stay</span>
                  <span className="text-headline-md text-secondary-fixed-dim font-bold tabular-nums">₹1,18,500 <span className="text-label-sm text-white/70 font-normal">total</span></span>
                </div>
                <span className="text-body-sm text-primary-fixed">Non-stop SFO-KIX + 5 nights Machiya Villa</span>
                <button 
                  onClick={() => onNavigate?.('checkout')}
                  className="w-full mt-space-xs bg-surface-container-lowest text-primary text-headline-sm py-space-sm rounded-lg hover:bg-surface-container-high transition-colors shadow font-bold cursor-pointer"
                >
                  Explore Bundle Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── POPULAR DESTINATIONS GRID ── */}
      <section className="max-w-[1280px] mx-auto px-gutter py-space-lg w-full flex flex-col gap-space-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div className="flex flex-col gap-space-xs">
            <span className="text-label-sm uppercase tracking-wider text-primary font-bold">Trending Itineraries</span>
            <h2 className="text-headline-xl text-on-surface tracking-tight">Handpicked Global Escapes</h2>
            <p className="text-body-md text-on-surface-variant">Live fares and verified hotel rates updated 6 minutes ago based on departing airports.</p>
          </div>
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
            {filterPills.map(pill => (
              <button
                key={pill}
                onClick={() => setActiveFilter(pill)}
                className={`text-label-md px-space-md py-space-xs rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === pill
                    ? 'bg-primary text-on-primary font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* 5-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-md">
          {destinations.filter(d => {
            if (activeFilter === 'All Trending') return true;
            if (activeFilter === 'Asia-Pacific') return ['Tokyo', 'Bali'].includes(d.city);
            if (activeFilter === 'Europe') return ['Paris', 'Santorini'].includes(d.city);
            if (activeFilter === 'Americas') return ['New York', 'San Francisco'].includes(d.city);
            if (activeFilter === 'Tropical') return ['Bali', 'Dubai'].includes(d.city);
            return true;
          }).map((d, i) => (
            <div
              key={i}
              onClick={() => {
                const targetAirport = popularAirports.find(a => a.code === d.airportCode) || popularAirports[4];
                setDestinationAirport(targetAirport);
                if (onSearchFlights) {
                  onSearchFlights({
                    fromCode: originAirport.code,
                    fromCity: originAirport.city,
                    toCode: targetAirport.code,
                    toCity: d.city,
                  });
                } else {
                  onNavigate?.('flights');
                }
              }}
              className={`${
                i === 0 ? 'lg:col-span-7' : i === 1 ? 'lg:col-span-5' : 'lg:col-span-4'
              } bg-surface-container-lowest rounded-xl overflow-hidden shadow-card card-hover group flex flex-col cursor-pointer border border-transparent hover:border-primary/30 transition-all`}
            >
              <div className={`relative ${i < 2 ? 'h-72' : 'h-60'} w-full overflow-hidden`}>
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={d.img} alt={d.city} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute top-space-md left-space-md flex items-center gap-space-xs">
                  <span className="bg-white/90 backdrop-blur-md px-space-sm py-1 rounded-full text-label-sm text-on-surface flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-[14px] text-tertiary">{d.weatherIcon}</span>
                    {d.weather}
                  </span>
                  {d.badge && (
                    <span className="bg-tertiary text-on-tertiary px-space-sm py-1 rounded-full text-label-sm font-bold">
                      {d.badge}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-space-md left-space-md right-space-md flex justify-between items-end">
                  <div>
                    <span className="text-label-sm uppercase tracking-wider text-surface-container-highest">{d.country}</span>
                    <h3 className="text-headline-lg text-surface-container-lowest font-bold">{d.city}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-label-sm text-surface-container-highest block">Flights from</span>
                    <span className="text-headline-md text-secondary-fixed font-bold tabular-nums">{d.flightPrice}</span>
                  </div>
                </div>
              </div>
              <div className="p-space-md flex items-center justify-between bg-surface-container-lowest">
                <div className="flex items-center gap-space-md">
                  <div>
                    <span className="text-label-sm text-on-surface-variant block">{d.flightTime ? 'Stays from' : (d.city === 'Bali' ? 'Villas from' : 'Hotels from')}</span>
                    <span className="text-label-lg font-bold text-on-surface tabular-nums">{d.stayPrice}<span className="font-normal text-on-surface-variant">/night</span></span>
                  </div>
                  {d.flightTime && (
                    <>
                      <div className="w-[1px] h-6 bg-surface-container-high" />
                      <div>
                        <span className="text-label-sm text-on-surface-variant block">Flight Time</span>
                        <span className="text-label-lg font-bold text-on-surface">{d.flightTime}</span>
                      </div>
                    </>
                  )}
                </div>
                <button className={`${d.flightTime ? 'bg-primary hover:bg-primary-container text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-primary'} text-label-lg px-space-md py-space-xs rounded-lg transition-colors flex items-center gap-1 font-bold`}>
                  <span>{d.flightTime ? 'Explore City' : 'Explore'}</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY BOOKMYTRIP SECTION ── */}
      <section className="max-w-[1280px] mx-auto px-gutter py-space-xl w-full">
        <div className="text-center mb-space-lg">
          <span className="text-label-sm uppercase tracking-wider text-primary font-bold">Why SS Journey</span>
          <h2 className="text-headline-xl text-on-surface tracking-tight mt-space-xs">Travel with confidence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {[
            { icon: 'shield', title: 'Transparent Pricing', desc: 'No hidden fees, no bait-and-switch. The fare you see is the fare you pay, always in INR (₹).' },
            { icon: 'speed', title: 'Real-time Availability', desc: 'Live inventory from 840+ airlines and 1.2M+ properties — updated directly with verified routes.' },
            { icon: 'lock', title: 'Secure Booking', desc: 'PCI-DSS Level 1 compliant demo simulation and payment processing with end-to-end encryption.' },
          ].map((f, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-card card-hover flex flex-col gap-space-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">{f.icon}</span>
              </div>
              <h3 className="text-headline-sm text-on-surface font-bold">{f.title}</h3>
              <p className="text-body-md text-on-surface-variant">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
