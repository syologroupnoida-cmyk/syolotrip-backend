import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchBusesApi, BusApiResponse } from '../services/api';
import { ScreenType } from '../components/Header';
import { useCurrency } from '../context/CurrencyContext';
import { WebCheckoutItem } from './BookingCheckoutPage';

interface BusSearchPageProps {
  onNavigate?: (screen: ScreenType) => void;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
  fromCity?: string;
  toCity?: string;
  travelDate?: string;
  returnDate?: string;
  seats?: string;
  busType?: string;
}

interface BusOption {
  id: string;
  operator: string;
  busType: string;
  primo: boolean;
  rating: number;
  reviewsCount: number;
  depTime: string;
  depPoint: string;
  arrTime: string;
  arrPoint: string;
  duration: string;
  durationMinutes: number;
  price: number;
  originalPrice: number;
  seatsAvailable: number;
  windowSeats: number;
  amenities: string[];
  badges: string[];
  cancellation: string;
}

const mapBusResponse = (b: BusApiResponse): BusOption => {
  const durationHrs = Math.floor(b.duration_minutes / 60);
  const durationMins = b.duration_minutes % 60;
  const durationText = `${String(durationHrs).padStart(2, '0')}h ${String(durationMins).padStart(2, '0')}m`;
  const originalPrice = Math.round(b.base_fare * 1.3);

  return {
    id: b.id,
    operator: b.operator_name,
    busType: b.bus_type,
    primo: b.rating >= 4.7,
    rating: b.rating || 4.5,
    reviewsCount: 420,
    depTime: b.departure_time,
    depPoint: b.boarding_point || `${b.from_city} Boarding Point`,
    arrTime: b.arrival_time,
    arrPoint: b.dropping_point || `${b.to_city} Bus Terminal`,
    duration: durationText,
    durationMinutes: b.duration_minutes,
    price: Math.round(b.base_fare),
    originalPrice,
    seatsAvailable: b.available_seats,
    windowSeats: Math.max(1, Math.floor(b.available_seats / 3)),
    amenities: ['Live GPS Tracking', 'Blanket & Pillow', 'Charging Point', 'Emergency SOS', 'Reading Light'],
    badges: b.rating >= 4.7 ? ['SS Primo', 'On-Time Guarantee'] : ['Verified Operator'],
    cancellation: 'Free cancellation up to 6 hrs before departure',
  };
};

export const BusSearchPage: React.FC<BusSearchPageProps> = ({
  onNavigate,
  onInitiateCheckout,
  fromCity = 'Mumbai',
  toCity = 'Goa',
  travelDate,
  returnDate,
  seats,
  busType,
}) => {
  const { formatPrice } = useCurrency();
  const [operatorFilter, setOperatorFilter] = useState<'ALL' | 'ZINGBUS' | 'INTRCITY' | 'NUEGO' | 'HRTC'>('ALL');
  const [acOnly, setAcOnly] = useState(false);
  const [sleeperOnly, setSleeperOnly] = useState(false);
  const [primoOnly, setPrimoOnly] = useState(false);
  const [depTimeSlot, setDepTimeSlot] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'>('ALL');
  const [maxPrice, setMaxPrice] = useState(15000);
  const [sortBy, setSortBy] = useState<'CHEAPEST' | 'EARLIEST' | 'FASTEST' | 'RATING'>('CHEAPEST');
  const [selectedSeatBusId, setSelectedSeatBusId] = useState<string | null>(null);
  const [ignoreRouteFilter, setIgnoreRouteFilter] = useState(false);

  // Live Backend Query
  const {
    data: apiBuses,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['busesSearch', fromCity, toCity, ignoreRouteFilter],
    queryFn: () => {
      if (ignoreRouteFilter) {
        return searchBusesApi();
      }
      return searchBusesApi({ from_city: fromCity, to_city: toCity });
    },
    staleTime: 30000,
  });

  // Map API response to bus cards
  const liveBuses = useMemo(() => {
    if (!apiBuses) return [];
    return apiBuses.map(mapBusResponse);
  }, [apiBuses]);

  const filteredBuses = useMemo(() => {
    return liveBuses
      .filter((bus) => {
        if (primoOnly && !bus.primo) return false;
        if (acOnly && !bus.busType.toLowerCase().includes('ac')) return false;
        if (sleeperOnly && !bus.busType.toLowerCase().includes('sleeper')) return false;
        if (bus.price > maxPrice) return false;
        if (operatorFilter === 'ZINGBUS' && !bus.operator.toLowerCase().includes('zingbus')) return false;
        if (operatorFilter === 'INTRCITY' && !bus.operator.toLowerCase().includes('intrcity')) return false;
        if (operatorFilter === 'NUEGO' && !bus.operator.toLowerCase().includes('nuego')) return false;
        if (operatorFilter === 'HRTC' && !bus.operator.toLowerCase().includes('hrtc')) return false;
        
        const hour = parseInt(bus.depTime.split(':')[0], 10);
        if (depTimeSlot === 'MORNING' && (hour < 6 || hour >= 12)) return false;
        if (depTimeSlot === 'AFTERNOON' && (hour < 12 || hour >= 17)) return false;
        if (depTimeSlot === 'EVENING' && (hour < 17 || hour >= 21)) return false;
        if (depTimeSlot === 'NIGHT' && hour < 21) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'CHEAPEST') return a.price - b.price;
        if (sortBy === 'FASTEST') return a.durationMinutes - b.durationMinutes;
        if (sortBy === 'RATING') return b.rating - a.rating;
        return a.depTime.localeCompare(b.depTime);
      });
  }, [liveBuses, primoOnly, acOnly, sleeperOnly, maxPrice, operatorFilter, depTimeSlot, sortBy]);

  const handleBook = (bus: BusOption, seatNumber: string = 'U4 (Upper Sleeper)') => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!bus.id || !uuidRegex.test(bus.id)) {
      alert('Data integrity issue: Selected bus schedule lacks a valid database UUID. Booking is disabled.');
      return;
    }

    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'BUS',
        itemId: bus.id,
        title: `${bus.operator} - ${bus.busType}`,
        subtitle: `Seat: ${seatNumber} · ${bus.cancellation}`,
        routeInfo: `${fromCity} (${bus.depPoint}) → ${toCity} (${bus.arrPoint})`,
        details: {
          busOperator: bus.operator,
          seatNumber: seatNumber,
          departureTime: bus.depTime,
          arrivalTime: bus.arrTime,
          duration: bus.duration,
          busType: bus.busType,
        },
        pricing: {
          baseAmount: bus.price,
          taxes: Math.round(bus.price * 0.05),
          discount: 100,
          insurance: 25,
        },
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-[#191C1E] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ── TOP STICKY MODIFIER BAR (SS STITCH DESIGN) ── */}
      <section className="sticky top-16 sm:top-[70px] z-30 bg-[#005cab] text-white shadow-md">
        <div className="max-w-[1240px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-amber-300 text-2xl">directions_bus</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base tracking-wide">{fromCity}</span>
                  <span className="material-symbols-outlined text-sm text-blue-200">trending_flat</span>
                  <span className="font-extrabold text-base tracking-wide">{toCity}</span>
                </div>
                <p className="text-xs text-blue-100 flex items-center space-x-2">
                  <span>{travelDate || 'Today / Tomorrow'}{returnDate ? ` · Return: ${returnDate}` : ''}</span>
                  <span>·</span>
                  <span>{seats || '1 Seat'} {busType ? `(${busType})` : ''}</span>
                  <span>·</span>
                  <span className="bg-[#1A7F37] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">SS Primo Verified</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center bg-white/10 rounded-lg px-3 py-1.5 text-xs space-x-3">
              <span className="text-blue-100">Live Buses: <strong className="text-white">{filteredBuses.length} Available</strong></span>
              <span className="text-white/40">|</span>
              <span className="text-emerald-300 font-semibold">100% Free Cancellation on Primo</span>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('explore')}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-1"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Modify Route</span>
            </button>
          </div>
        </div>

        {/* Operator Quick Filter Strip */}
        <div className="bg-[#004785] border-t border-white/10 px-4 py-2">
          <div className="max-w-[1240px] mx-auto flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-blue-200 font-medium text-[11px] shrink-0 mr-1">Popular Operators:</span>
            {[
              { id: 'ALL', label: 'All Operators' },
              { id: 'ZINGBUS', label: '⚡ Zingbus Plus (Rating 4.8)' },
              { id: 'INTRCITY', label: '🛋️ IntrCity SmartBus (Smart Lounge)' },
              { id: 'NUEGO', label: '🌱 NueGo Green EV (Silent)' },
              { id: 'HRTC', label: '🏔️ HRTC Himgaurav (Govt)' },
            ].map((op) => (
              <button
                key={op.id}
                onClick={() => setOperatorFilter(op.id as any)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  operatorFilter === op.id
                    ? 'bg-white text-[#005cab] shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT: 12-COLUMN LAYOUT ── */}
      <main className="max-w-[1240px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT 3-COL FILTER SIDEBAR ── */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl p-4 border border-[#E7EBF0] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-extrabold text-sm text-[#191C1E] flex items-center space-x-1.5">
                  <span className="material-symbols-outlined text-[#005cab] text-lg">filter_alt</span>
                  <span>Filter Buses</span>
                </h3>
                <button
                  onClick={() => {
                    setOperatorFilter('ALL');
                    setAcOnly(false);
                    setSleeperOnly(false);
                    setPrimoOnly(false);
                    setDepTimeSlot('ALL');
                    setMaxPrice(2500);
                  }}
                  className="text-xs font-bold text-[#005cab] hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              </div>

              {/* Primo Guarantee Banner */}
              <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={primoOnly}
                    onChange={(e) => setPrimoOnly(e.target.checked)}
                    className="mt-0.5 accent-[#005cab] rounded"
                  />
                  <div>
                    <span className="text-xs font-black text-amber-900 flex items-center space-x-1">
                      <span>SS Primo Only</span>
                      <span className="bg-amber-400 text-amber-950 text-[9px] px-1 py-0.2 rounded font-black">TOP RATED</span>
                    </span>
                    <p className="text-[10px] text-amber-800 leading-tight mt-0.5">
                      On-time guarantee, certified drivers, sanitized cabins & 24x7 helpline.
                    </p>
                  </div>
                </label>
              </div>

              {/* Bus Amenities Filter */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 block mb-2">Bus Comfort & Types</span>
                <div className="space-y-2 text-xs text-gray-700">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acOnly}
                      onChange={(e) => setAcOnly(e.target.checked)}
                      className="accent-[#005cab] rounded"
                    />
                    <span>Air Conditioned (AC)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sleeperOnly}
                      onChange={(e) => setSleeperOnly(e.target.checked)}
                      className="accent-[#005cab] rounded"
                    />
                    <span>Sleeper Berths</span>
                  </label>
                </div>
              </div>

              {/* Departure Time Slots */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 block mb-2">Departure Time</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'MORNING', label: 'Morning', sub: '06:00 - 12:00', icon: 'wb_sunny' },
                    { id: 'AFTERNOON', label: 'Afternoon', sub: '12:00 - 17:00', icon: 'light_mode' },
                    { id: 'EVENING', label: 'Evening', sub: '17:00 - 21:00', icon: 'wb_twilight' },
                    { id: 'NIGHT', label: 'Night', sub: 'After 21:00', icon: 'bedtime' },
                  ].map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setDepTimeSlot(depTimeSlot === slot.id ? 'ALL' : slot.id as any)}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                        depTimeSlot === slot.id
                          ? 'border-[#005cab] bg-blue-50 text-[#005cab] font-bold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm block mb-0.5">{slot.icon}</span>
                      <span className="font-bold block text-[11px]">{slot.label}</span>
                      <span className="text-[9px] text-gray-500">{slot.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-700">Max Fare</span>
                  <span className="text-xs font-extrabold text-[#005cab]">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#005cab] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>₹500</span>
                  <span>₹3,000</span>
                </div>
              </div>
            </div>

            {/* SS Primo Trust Box */}
            <div className="bg-white rounded-xl p-4 border border-[#E7EBF0] text-xs space-y-2">
              <span className="font-bold text-gray-900 block flex items-center space-x-1">
                <span className="material-symbols-outlined text-[#1A7F37] text-sm">verified_user</span>
                <span>Why Book on SS Journey?</span>
              </span>
              <ul className="space-y-1.5 text-gray-600 text-[11px]">
                <li className="flex items-center space-x-1.5">
                  <span className="text-[#1A7F37]">✓</span>
                  <span>100% Refund on bus cancellation</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="text-[#1A7F37]">✓</span>
                  <span>Live bus tracking with shareable GPS link</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="text-[#1A7F37]">✓</span>
                  <span>Female passenger safety features</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* ── RIGHT 9-COL BUS RESULTS ── */}
          <section className="lg:col-span-9 space-y-4">
            {/* Sort Bar */}
            <div className="bg-white rounded-xl p-3 border border-[#E7EBF0] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-gray-700 font-bold">
                <span>Showing {filteredBuses.length} Buses</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500 font-normal">All departures on time</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-gray-500 font-medium">Sort by:</span>
                {[
                  { id: 'CHEAPEST', label: 'Cheapest' },
                  { id: 'EARLIEST', label: 'Departure Time' },
                  { id: 'FASTEST', label: 'Duration' },
                  { id: 'RATING', label: 'User Rating' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      sortBy === s.id
                        ? 'bg-[#005cab] text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ignore Route Banner if viewing all */}
            {ignoreRouteFilter && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <span>Showing all scheduled intercity buses across routes.</span>
                <button
                  type="button"
                  onClick={() => setIgnoreRouteFilter(false)}
                  className="font-bold text-[#005cab] hover:underline"
                >
                  Filter to {fromCity} &rarr; {toCity}
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-xl p-12 text-center border border-[#E7EBF0] shadow-xs flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#005cab] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-base font-bold text-gray-800">Searching Live Intercity Bus Schedules...</p>
                <p className="text-xs text-gray-500 mt-1">Checking live seat availability for {fromCity} &rarr; {toCity}</p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-red-50 rounded-xl p-8 text-center border border-red-200 shadow-xs">
                <p className="text-base font-bold text-red-700">Unable to Fetch Bus Schedules</p>
                <p className="text-xs text-red-600 mt-1">{(error as any)?.message || 'An error occurred while connecting to the bus service.'}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Retry Search
                </button>
              </div>
            )}

            {/* Bus Cards List / Empty State */}
            {!isLoading && !isError && filteredBuses.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center border border-[#E7EBF0]">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">directions_bus</span>
                <p className="font-extrabold text-base text-gray-800">No buses found between {fromCity} and {toCity}</p>
                <p className="text-xs text-gray-500 mt-1">Try resetting the operator, AC, or price filters or check all available buses.</p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMaxPrice(15000);
                      setOperatorFilter('ALL');
                      setAcOnly(false);
                      setSleeperOnly(false);
                      setPrimoOnly(false);
                      setDepTimeSlot('ALL');
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition"
                  >
                    Reset Filters
                  </button>
                  {!ignoreRouteFilter && (
                    <button
                      type="button"
                      onClick={() => setIgnoreRouteFilter(true)}
                      className="px-4 py-2 bg-[#005cab] hover:bg-[#0A58CA] text-white text-xs font-bold rounded-lg shadow-xs transition"
                    >
                      View All Available Buses Across Routes
                    </button>
                  )}
                </div>
              </div>
            ) : !isLoading && !isError && (
              filteredBuses.map((bus) => (
                <div
                  key={bus.id}
                  className="bg-white rounded-xl border border-[#E7EBF0] hover:border-[#005cab] hover:shadow-md transition overflow-hidden"
                >
                  <div className="p-5">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4 className="font-black text-base text-gray-900 tracking-tight">{bus.operator}</h4>
                          {bus.primo && (
                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                              Primo
                            </span>
                          )}
                          <div className="flex items-center space-x-1 bg-[#1A7F37] text-white text-xs font-extrabold px-1.5 py-0.5 rounded">
                            <span>{bus.rating}</span>
                            <span className="text-[10px]">★</span>
                          </div>
                          <span className="text-[11px] text-gray-500">({bus.reviewsCount} ratings)</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 font-medium">{bus.busType}</p>
                      </div>

                      {/* Price Section */}
                      <div className="text-right">
                        <div className="flex items-baseline space-x-1.5 justify-end">
                          <span className="text-xs text-gray-400 line-through font-normal">{formatPrice(bus.originalPrice)}</span>
                          <span className="text-2xl font-black text-gray-900">{formatPrice(bus.price)}</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-[#1A7F37] bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                          Save {formatPrice(bus.originalPrice - bus.price)} with SSJBUS
                        </span>
                      </div>
                    </div>

                    {/* Schedule & Route Row */}
                    <div className="py-4 grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                      {/* Departure */}
                      <div className="md:col-span-4">
                        <span className="text-xl font-black text-gray-900">{bus.depTime}</span>
                        <p className="text-xs font-bold text-gray-800">{fromCity}</p>
                        <p className="text-[11px] text-gray-500 truncate" title={bus.depPoint}>{bus.depPoint}</p>
                      </div>

                      {/* Duration bar */}
                      <div className="md:col-span-4 text-center">
                        <span className="text-xs font-bold text-gray-500">{bus.duration}</span>
                        <div className="relative flex items-center my-1">
                          <div className="h-[2px] w-full bg-gray-200" />
                          <span className="material-symbols-outlined absolute left-1/2 -translate-x-1/2 text-gray-400 bg-white px-1 text-sm">
                            directions_bus
                          </span>
                        </div>
                        <span className="text-[10px] text-[#1A7F37] font-semibold">1 Stop · Rest Stop at Murthal</span>
                      </div>

                      {/* Arrival */}
                      <div className="md:col-span-4 md:text-right">
                        <span className="text-xl font-black text-gray-900">{bus.arrTime}</span>
                        <p className="text-xs font-bold text-gray-800">{toCity}</p>
                        <p className="text-[11px] text-gray-500 truncate" title={bus.arrPoint}>{bus.arrPoint}</p>
                      </div>
                    </div>

                    {/* Amenities pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 pb-3">
                      {bus.amenities.map((amenity, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <span>•</span>
                          <span>{amenity}</span>
                        </span>
                      ))}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="font-extrabold text-[#005cab] bg-blue-50 px-2 py-1 rounded">
                          {bus.seatsAvailable} Seats Left ({bus.windowSeats} Window)
                        </span>
                        <span className="text-[11px] text-gray-500 hidden sm:inline">{bus.cancellation}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedSeatBusId(selectedSeatBusId === bus.id ? null : bus.id)}
                          className="px-3 py-2 border border-[#005cab] text-[#005cab] hover:bg-blue-50 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          {selectedSeatBusId === bus.id ? 'Hide Seats' : 'View Seat Layout'}
                        </button>
                        <button
                          onClick={() => handleBook(bus)}
                          className="px-5 py-2 bg-gradient-to-r from-[#005cab] to-[#008cff] hover:brightness-105 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm transition cursor-pointer"
                        >
                          Book Seat
                        </button>
                      </div>
                    </div>

                    {/* Seat Layout Drawer preview */}
                    {selectedSeatBusId === bus.id && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl animate-fadeIn">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                          <div>
                            <span className="text-xs font-extrabold text-gray-900 block">Select Your Berth / Seat</span>
                            <span className="text-[11px] text-gray-500">Upper & Lower Deck Berths Available</span>
                          </div>
                          <div className="flex items-center space-x-3 text-[11px]">
                            <span className="flex items-center space-x-1">
                              <span className="w-3 h-3 bg-white border border-gray-400 rounded-xs inline-block" />
                              <span>Available</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span className="w-3 h-3 bg-pink-100 border border-pink-400 rounded-xs inline-block" />
                              <span>Female</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span className="w-3 h-3 bg-[#1A7F37] text-white text-[8px] rounded-xs flex items-center justify-center font-bold">✓</span>
                              <span>Selected</span>
                            </span>
                          </div>
                        </div>

                        {/* Interactive Berths Grid */}
                        <div className="py-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {[
                            { no: 'L1', type: 'Lower Window', price: bus.price },
                            { no: 'L2', type: 'Lower Single', price: bus.price },
                            { no: 'L3', type: 'Lower Window', price: bus.price },
                            { no: 'U1', type: 'Upper Window', price: bus.price - 100 },
                            { no: 'U2', type: 'Upper Single', price: bus.price - 100 },
                            { no: 'U3', type: 'Upper Window', price: bus.price - 100 },
                          ].map((seat) => (
                            <button
                              key={seat.no}
                              onClick={() => handleBook(bus, `${seat.no} (${seat.type})`)}
                              className="p-2 bg-white border border-gray-300 hover:border-[#005cab] hover:bg-blue-50/50 rounded-lg text-center transition cursor-pointer shadow-xs group"
                            >
                              <span className="material-symbols-outlined text-gray-400 group-hover:text-[#005cab] text-lg block mb-0.5">single_bed</span>
                              <span className="font-black text-xs text-gray-900 group-hover:text-[#005cab] block">{seat.no}</span>
                              <span className="text-[9px] text-gray-500 block">{seat.type}</span>
                              <span className="text-[10px] font-extrabold text-[#1A7F37] block mt-1">{formatPrice(seat.price)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
