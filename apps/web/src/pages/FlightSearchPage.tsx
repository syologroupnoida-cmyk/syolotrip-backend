import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchFlightsApi, FlightApiResponse } from '../services/api';
import { ScreenType } from '../components/Header';
import { FlightSearchParams } from './ExplorePage';
import { WebCheckoutItem } from './BookingCheckoutPage';

interface FlightSearchPageProps {
  onNavigate?: (screen: ScreenType) => void;
  searchParams?: FlightSearchParams;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
}

export interface FlightCardItem {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  aircraft: string;
  brandBg: string;
  depTime: string;
  depCode: string;
  depTerminal: string;
  arrTime: string;
  arrCode: string;
  arrTerminal: string;
  duration: string;
  durationMinutes: number;
  isNonStop: boolean;
  stopsText: string;
  originalPrice: number;
  price: number;
  tags: string[];
  hasFreeMeal: boolean;
  cabinBaggage: string;
  checkinBaggage: string;
  baseFare: number;
  taxes: number;
  timeSlot: 'BEFORE_6' | '6_12' | '12_18' | 'AFTER_18';
}

const mapFlightResponse = (f: FlightApiResponse, defaultFromCode: string, defaultToCode: string): FlightCardItem => {
  const depTimeStr = f.departure_time?.includes('T') ? f.departure_time.split('T')[1].slice(0, 5) : (f.departure_time || '08:00');
  const arrTimeStr = f.arrival_time?.includes('T') ? f.arrival_time.split('T')[1].slice(0, 5) : (f.arrival_time || '11:00');
  const durationHrs = Math.floor(f.duration_minutes / 60);
  const durationMins = f.duration_minutes % 60;
  const durationText = `${String(durationHrs).padStart(2, '0')}h ${String(durationMins).padStart(2, '0')}m`;

  let brandBg = 'bg-[#005cab]';
  const al = f.airline?.toLowerCase() || '';
  const code = f.airline_code?.toUpperCase() || '';
  if (code === 'AI' || al.includes('air india') && !al.includes('express')) brandBg = 'bg-[#bb0017]';
  else if (code === '6E' || al.includes('indigo')) brandBg = 'bg-[#005bab]';
  else if (code === 'QP' || al.includes('akasa')) brandBg = 'bg-[#f4511e]';
  else if (code === 'IX' || al.includes('express')) brandBg = 'bg-[#d81b60]';
  else if (code === 'SQ' || al.includes('singapore')) brandBg = 'bg-[#f5a623]';
  else if (code === 'JL' || al.includes('japan')) brandBg = 'bg-[#cc0000]';
  else if (code === 'UA' || al.includes('united')) brandBg = 'bg-[#002244]';
  else if (code === 'NH' || al.includes('ana')) brandBg = 'bg-[#104374]';

  const hour = parseInt(depTimeStr.split(':')[0] || '10', 10);
  let timeSlot: 'BEFORE_6' | '6_12' | '12_18' | 'AFTER_18' = '6_12';
  if (hour < 6) timeSlot = 'BEFORE_6';
  else if (hour >= 6 && hour < 12) timeSlot = '6_12';
  else if (hour >= 12 && hour < 18) timeSlot = '12_18';
  else timeSlot = 'AFTER_18';

  const isNonStop = f.stops === 0;
  const stopsText = isNonStop ? 'NON STOP' : `${f.stops} STOP${f.stops > 1 ? 'S' : ''}`;
  const originalPrice = Math.round(f.total_price * 1.15);

  return {
    id: f.id,
    airline: f.airline || 'Commercial Airline',
    airlineCode: f.airline_code || 'FL',
    flightNumber: f.flight_number || 'FL-000',
    aircraft: f.aircraft || 'Commercial Aircraft',
    brandBg,
    depTime: depTimeStr,
    depCode: f.origin?.code || defaultFromCode,
    depTerminal: f.origin?.name || 'Main Terminal',
    arrTime: arrTimeStr,
    arrCode: f.destination?.code || defaultToCode,
    arrTerminal: f.destination?.name || 'Main Terminal',
    duration: durationText,
    durationMinutes: f.duration_minutes || 120,
    isNonStop,
    stopsText,
    originalPrice,
    price: Math.round(f.total_price),
    baseFare: Math.round(f.base_fare),
    taxes: Math.round(f.taxes),
    tags: f.tags && f.tags.length > 0 ? f.tags : ['Guaranteed Booking'],
    hasFreeMeal: f.tags?.some(t => t.toLowerCase().includes('meal')) || f.cabin_class === 'BUSINESS',
    cabinBaggage: '7 kg',
    checkinBaggage: f.cabin_class === 'BUSINESS' ? '30 kg' : '15 kg',
    timeSlot,
  };
};

export const FlightSearchPage: React.FC<FlightSearchPageProps> = ({
  onNavigate,
  searchParams,
  onInitiateCheckout,
}) => {
  const fromCode = searchParams?.fromCode || 'DEL';
  const toCode = searchParams?.toCode || 'BLR';
  const fromCity = searchParams?.fromCity || 'Delhi';
  const toCity = searchParams?.toCity || 'Bengaluru';
  const departDate = searchParams?.departDate || '2026-10-24';

  // Filters state
  const [activeSort, setActiveSort] = useState<'CHEAPEST' | 'NONSTOP' | 'EARLIEST' | 'FASTEST'>('CHEAPEST');
  const [selectedFareDay, setSelectedFareDay] = useState(3);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [stopsFilter, setStopsFilter] = useState<'ALL' | 'NONSTOP' | '1STOP'>('ALL');
  const [timeSlotFilter, setTimeSlotFilter] = useState<'ALL' | 'BEFORE_6' | '6_12' | '12_18' | 'AFTER_18'>('ALL');
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [freeMealOnly, setFreeMealOnly] = useState(false);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  const [flightDetailTab, setFlightDetailTab] = useState<'info' | 'fare' | 'policy'>('info');
  const [zeroCancelProtection, setZeroCancelProtection] = useState(false);
  const [ignoreRouteFilter, setIgnoreRouteFilter] = useState(false);

  // 7-day fare strip data
  const fareDays = [
    { label: 'Wed, 21 Oct', price: 7250, isCheapest: false },
    { label: 'Thu, 22 Oct', price: 6850, isCheapest: false },
    { label: 'Fri, 23 Oct', price: 7100, isCheapest: false },
    { label: 'Sat, 24 Oct', price: 6499, isCheapest: true },
    { label: 'Sun, 25 Oct', price: 7800, isCheapest: false },
    { label: 'Mon, 26 Oct', price: 6200, isCheapest: false },
    { label: 'Tue, 27 Oct', price: 6990, isCheapest: false },
  ];

  // Query live backend flights
  const {
    data: apiFlights,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['flightsSearch', fromCode, toCode, ignoreRouteFilter],
    queryFn: () => {
      if (ignoreRouteFilter) {
        return searchFlightsApi();
      }
      return searchFlightsApi({ from_code: fromCode, to_code: toCode });
    },
    staleTime: 30000,
  });

  // Map API items into flight cards
  const liveFlights = useMemo(() => {
    if (!apiFlights) return [];
    return apiFlights.map((f) => mapFlightResponse(f, fromCode, toCode));
  }, [apiFlights, fromCode, toCode]);

  // Available airlines derived from live data
  const availableAirlines = useMemo(() => {
    const set = new Set<string>();
    liveFlights.forEach(f => {
      if (f.airline) set.add(f.airline);
    });
    return Array.from(set);
  }, [liveFlights]);

  // Filtered flights
  const filteredFlights = useMemo(() => {
    let list = [...liveFlights];

    // Airline filter
    if (selectedAirlines.length > 0) {
      list = list.filter((f) => selectedAirlines.includes(f.airline));
    }

    // Price filter
    list = list.filter((f) => f.price <= maxPrice);

    // Stops filter
    if (stopsFilter === 'NONSTOP') {
      list = list.filter((f) => f.isNonStop);
    } else if (stopsFilter === '1STOP') {
      list = list.filter((f) => !f.isNonStop);
    }

    // Time slot filter
    if (timeSlotFilter !== 'ALL') {
      list = list.filter((f) => f.timeSlot === timeSlotFilter);
    }

    // Free meal filter
    if (freeMealOnly) {
      list = list.filter((f) => f.hasFreeMeal);
    }

    // Sorting
    if (activeSort === 'CHEAPEST') {
      list.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'EARLIEST') {
      list.sort((a, b) => a.depTime.localeCompare(b.depTime));
    } else if (activeSort === 'FASTEST') {
      list.sort((a, b) => a.durationMinutes - b.durationMinutes);
    }

    return list;
  }, [liveFlights, selectedAirlines, maxPrice, stopsFilter, timeSlotFilter, freeMealOnly, activeSort]);

  const handleBookFlight = (flight: FlightCardItem) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!flight.id || !uuidRegex.test(flight.id)) {
      alert('Data issue: The selected flight result lacks a valid database UUID. Booking is disabled.');
      return;
    }

    const item: WebCheckoutItem = {
      serviceType: 'FLIGHT',
      itemId: flight.id,
      title: `${flight.airline} (${flight.flightNumber})`,
      subtitle: `${flight.depCode} → ${flight.arrCode} · ${flight.stopsText} (${flight.duration})`,
      routeInfo: `${fromCity} (${flight.depCode}) to ${toCity} (${flight.arrCode})`,
      pricing: {
        baseAmount: flight.baseFare,
        taxes: flight.taxes,
        discount: 300,
        insurance: zeroCancelProtection ? 399 : 0,
      },
      details: {
        flightId: flight.id,
        airline: flight.airline,
        departure: `${departDate} ${flight.depTime}`,
        arrival: `${departDate} ${flight.arrTime}`,
        cabin: 'Economy',
      },
    };

    if (onInitiateCheckout) {
      onInitiateCheckout(item);
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleResetFilters = () => {
    setMaxPrice(150000);
    setStopsFilter('ALL');
    setTimeSlotFilter('ALL');
    setSelectedAirlines([]);
    setFreeMealOnly(false);
    setIgnoreRouteFilter(false);
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-[#1b1c1c] font-sans pb-20">
      {/* ── TOP STICKY SEARCH & 7-DAY FARE STRIP (Stitch Exact Replica) ── */}
      <section className="sticky top-16 sm:top-[70px] z-30 bg-white shadow-xs border-b border-[#E7EBF0]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3">
          {/* Quick Modifier Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F2F4F8] p-3 rounded-xl border border-[#E7EBF0]">
            <div className="flex flex-wrap items-center gap-4">
              {/* Origin */}
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-full bg-[#d5e3ff] text-[#005cab] flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#1b1c1c]">
                    {fromCity} ({fromCode})
                  </span>
                  <span className="text-xs text-[#525f71]">Airport T2 / T3</span>
                </div>
              </div>

              {/* Arrow */}
              <span className="text-[#008cff] font-bold text-lg">&rarr;</span>

              {/* Destination */}
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-full bg-[#d6e4f9] text-[#0f1c2c] flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#1b1c1c]">
                    {toCity} ({toCode})
                  </span>
                  <span className="text-xs text-[#525f71]">Airport T1</span>
                </div>
              </div>

              {/* Date & Passsengers */}
              <div className="hidden lg:flex items-center space-x-6 pl-4 border-l border-gray-300">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Departure Date</span>
                  <span className="text-xs font-semibold text-gray-900">{departDate}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Passenger & Class</span>
                  <span className="text-xs font-semibold text-gray-900">1 Adult, Economy</span>
                </div>
              </div>
            </div>

            {/* Modify Search CTA */}
            <button
              onClick={() => onNavigate && onNavigate('explore')}
              className="px-4 py-2 rounded-lg bg-white hover:bg-gray-50 text-[#008cff] font-bold text-xs flex items-center space-x-1 shadow-xs border border-gray-200 transition"
            >
              <span>MODIFY SEARCH</span>
            </button>
          </div>

          {/* 7-Day Low Fare Scroll Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {fareDays.map((fd, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedFareDay(idx)}
                className={`shrink-0 flex flex-col items-center justify-center py-2 px-4 rounded-xl text-left transition-all ${
                  selectedFareDay === idx
                    ? 'bg-[#d5e3ff] text-[#001c3b] ring-2 ring-[#005cab] shadow-xs'
                    : 'bg-[#F2F4F8] hover:bg-gray-200/70 text-[#1b1c1c]'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-gray-600">{fd.label}</span>
                  {fd.isCheapest && (
                    <span className="bg-[#1A7F37] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
                      Cheapest
                    </span>
                  )}
                </div>
                <span className="text-sm font-black mt-0.5">₹{fd.price.toLocaleString('en-IN')}</span>
              </button>
            ))}

            <button
              type="button"
              className="shrink-0 flex items-center justify-center px-3 py-2 rounded-xl text-[#008cff] hover:bg-blue-50 font-bold text-xs gap-1 border border-blue-200"
            >
              <span>📅 View 30-Day Fare Matrix</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT (12-COLUMN STITCH LAYOUT) ── */}
      <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT SIDEBAR FILTERS (3 Cols) ── */}
          <aside className="lg:col-span-3 flex flex-col gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-[#E7EBF0]">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-bold text-base text-gray-900">Filters</span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#bb0017] hover:underline"
              >
                RESET ALL
              </button>
            </div>

            {/* Popular Filters */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Popular Filters
              </span>
              {[
                { label: 'Non Stop Flights', count: 18, check: stopsFilter === 'NONSTOP', toggle: () => setStopsFilter(stopsFilter === 'NONSTOP' ? 'ALL' : 'NONSTOP') },
                { label: 'Late Departures (After 6 PM)', count: 7, check: timeSlotFilter === 'AFTER_18', toggle: () => setTimeSlotFilter(timeSlotFilter === 'AFTER_18' ? 'ALL' : 'AFTER_18') },
                { label: 'IndiGo (6E)', count: 12, check: selectedAirlines.includes('IndiGo'), toggle: () => setSelectedAirlines(prev => prev.includes('IndiGo') ? prev.filter(a => a !== 'IndiGo') : [...prev, 'IndiGo']) },
                { label: 'Free Meal Included', count: 5, check: freeMealOnly, toggle: () => setFreeMealOnly(!freeMealOnly) },
              ].map((pf, i) => (
                <label key={i} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-xs">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={pf.check}
                      onChange={pf.toggle}
                      className="w-4 h-4 rounded text-[#008cff] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-gray-800">{pf.label}</span>
                  </div>
                  <span className="text-gray-400 font-medium">{pf.count}</span>
                </label>
              ))}
            </div>

            {/* Price Slider */}
            <div className="flex flex-col gap-2 p-3 bg-[#F2F4F8] rounded-xl border border-gray-200">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-600 uppercase text-[10px] tracking-wider">One Way Price</span>
                <span className="text-[#008cff] font-bold">Up to ₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="5400"
                max="18000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#008cff] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span>₹5,400</span>
                <span>₹18,000+</span>
              </div>
            </div>

            {/* Stops Filter */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stops from {fromCity}</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStopsFilter('NONSTOP')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold transition ${
                    stopsFilter === 'NONSTOP'
                      ? 'bg-[#d5e3ff] text-[#005cab] ring-1 ring-[#005cab]'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <span className="font-bold">Non Stop</span>
                  <span className="text-[11px] text-gray-500">₹6,499</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStopsFilter('1STOP')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold transition ${
                    stopsFilter === '1STOP'
                      ? 'bg-[#d5e3ff] text-[#005cab] ring-1 ring-[#005cab]'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <span className="font-bold">1 Stop</span>
                  <span className="text-[11px] text-gray-500">₹8,200+</span>
                </button>
              </div>
            </div>

            {/* Departure Time Slots */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Departure Time</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'BEFORE_6', label: 'Before 6 AM', sub: 'Early Bird', icon: '🌅' },
                  { id: '6_12', label: '6 AM - 12 PM', sub: 'Morning', icon: '☀️' },
                  { id: '12_18', label: '12 PM - 6 PM', sub: 'Afternoon', icon: '🌤️' },
                  { id: 'AFTER_18', label: 'After 6 PM', sub: 'Evening', icon: '🌙' },
                ].map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setTimeSlotFilter(timeSlotFilter === slot.id ? 'ALL' : slot.id as any)}
                    className={`flex flex-col items-center p-2 rounded-xl text-left transition ${
                      timeSlotFilter === slot.id
                        ? 'bg-[#008cff] text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <span className="text-sm">{slot.icon}</span>
                    <span className="font-bold text-[11px] mt-0.5">{slot.label}</span>
                    <span className={`text-[10px] ${timeSlotFilter === slot.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {slot.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Airlines Checkboxes with Brand Logos */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Airlines</span>
              {(availableAirlines.length > 0 ? availableAirlines : ['IndiGo', 'Air India', 'Akasa Air', 'Air India Express', 'Japan Airlines', 'United Airlines']).map((name) => {
                const checked = selectedAirlines.length === 0 || selectedAirlines.includes(name);
                const code = name.slice(0, 2).toUpperCase();
                let color = 'bg-[#005bab]';
                if (name.includes('Air India')) color = 'bg-[#bb0017]';
                else if (name.includes('Akasa')) color = 'bg-[#f4511e]';
                else if (name.includes('Japan')) color = 'bg-[#cc0000]';
                else if (name.includes('United')) color = 'bg-[#002244]';

                return (
                  <label key={name} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-xs">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (selectedAirlines.length === 0) {
                            setSelectedAirlines(availableAirlines.filter(x => x !== name));
                          } else if (selectedAirlines.includes(name)) {
                            setSelectedAirlines(selectedAirlines.filter(x => x !== name));
                          } else {
                            setSelectedAirlines([...selectedAirlines, name]);
                          }
                        }}
                        className="w-4 h-4 rounded text-[#008cff] focus:ring-0 cursor-pointer"
                      />
                      <div className={`w-5 h-5 rounded-md ${color} flex items-center justify-center text-[10px] text-white font-bold`}>
                        {code}
                      </div>
                      <span className="text-gray-800 font-medium">{name}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* MMT Assured Guarantee Box */}
            <div className="p-3.5 rounded-xl bg-[#E8F5E9] border border-emerald-200 flex flex-col gap-1">
              <div className="flex items-center space-x-1.5 text-[#1A7F37]">
                <span className="text-base">🛡️</span>
                <span className="font-bold text-xs uppercase tracking-wider">MMT Assured</span>
              </div>
              <p className="text-xs text-gray-800 leading-relaxed">
                Instant refund on flight delays over 2 hours &bull; Priority baggage tags &bull; Free flight meal on selected carriers.
              </p>
            </div>
          </aside>

          {/* ── RIGHT MAIN CONTENT (9 Cols) ── */}
          <main className="lg:col-span-9 flex flex-col gap-4">
            {/* Sorting Tabs Bar */}
            <div className="bg-white rounded-2xl p-2 shadow-xs border border-[#E7EBF0] flex items-center justify-between overflow-x-auto scrollbar-none">
              <div className="flex items-center space-x-2">
                {[
                  { id: 'CHEAPEST', title: 'CHEAPEST', subtitle: '₹6,499 • 2h 45m' },
                  { id: 'NONSTOP', title: 'NON STOP FIRST', subtitle: `${filteredFlights.filter(f => f.isNonStop).length} Flights` },
                  { id: 'EARLIEST', title: 'EARLIEST DEPARTURE', subtitle: '05:15 DEL' },
                  { id: 'FASTEST', title: 'FASTEST', subtitle: '2h 40m' },
                ].map((sort) => (
                  <button
                    key={sort.id}
                    type="button"
                    onClick={() => setActiveSort(sort.id as any)}
                    className={`px-4 py-2.5 rounded-xl flex flex-col items-start transition whitespace-nowrap ${
                      activeSort === sort.id
                        ? 'bg-[#005cab] text-white shadow-xs'
                        : 'bg-[#F2F4F8] hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">{sort.title}</span>
                    <span className="text-xs font-bold mt-0.5">{sort.subtitle}</span>
                  </button>
                ))}
              </div>
              <span className="hidden sm:inline-block text-xs text-gray-400 pr-3">Prices per adult</span>
            </div>

            {/* Zero Cancellation Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#0A58CA] text-white flex items-center justify-center font-bold text-lg shrink-0">
                  🛡️
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-gray-900">Zero Cancellation Guarantee</span>
                    <span className="bg-[#1A7F37] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Popular
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Cancel anytime up to 24 hrs prior for 100% full airline refund. Starting at only ₹399/traveller.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setZeroCancelProtection(!zeroCancelProtection)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
                  zeroCancelProtection
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#008cff] hover:bg-[#0A58CA] text-white'
                }`}
              >
                {zeroCancelProtection ? 'PROTECTION ACTIVE ✔' : 'ADD PROTECTION'}
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-xs flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#008cff] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-base font-bold text-gray-800">Searching Live Scheduled Flights...</p>
                <p className="text-xs text-gray-500 mt-1">Connecting to live flight inventory for {fromCity} ({fromCode}) &rarr; {toCity} ({toCode})</p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-red-50 rounded-2xl p-8 text-center border border-red-200 shadow-xs">
                <p className="text-base font-bold text-red-700">Unable to Fetch Live Flights</p>
                <p className="text-xs text-red-600 mt-1">{(error as any)?.message || 'An error occurred while connecting to the flight service.'}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Retry Search
                </button>
              </div>
            )}

            {/* Flight Cards List / Empty State */}
            {!isLoading && !isError && filteredFlights.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-xs">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                  ✈️
                </div>
                <p className="text-base font-bold text-gray-800">No scheduled flights match your search</p>
                <p className="text-xs text-gray-500 mt-1">
                  No flights found between {fromCity} ({fromCode}) and {toCity} ({toCode}) with the selected filters.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition"
                  >
                    Reset Filters
                  </button>
                  {!ignoreRouteFilter && (
                    <button
                      type="button"
                      onClick={() => setIgnoreRouteFilter(true)}
                      className="px-4 py-2 bg-[#008cff] hover:bg-[#0A58CA] text-white text-xs font-bold rounded-lg shadow-xs transition"
                    >
                      View All Available Flights Across Routes
                    </button>
                  )}
                </div>
              </div>
            ) : !isLoading && !isError && (
              filteredFlights.map((flight) => {
                const isExpanded = expandedFlightId === flight.id;
                return (
                  <article
                    key={flight.id}
                    className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow border border-[#E7EBF0] flex flex-col gap-4 relative overflow-hidden"
                  >
                    {/* Top Tag Badge */}
                    {flight.tags.length > 0 && (
                      <div className="absolute top-0 left-0 bg-[#1A7F37] text-white px-3 py-0.5 rounded-br-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                        <span>👍 {flight.tags[0]}</span>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                      {/* Airline Info */}
                      <div className="flex items-center space-x-3 min-w-[190px]">
                        <div className={`w-11 h-11 rounded-xl ${flight.brandBg} text-white font-black text-sm flex items-center justify-center shadow-xs`}>
                          {flight.airlineCode}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-base text-gray-900 leading-tight">{flight.airline}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{flight.flightNumber} &bull; {flight.aircraft}</span>
                        </div>
                      </div>

                      {/* Route Timings Graphic */}
                      <div className="flex items-center space-x-4 flex-1 max-w-[420px] justify-between">
                        {/* Origin */}
                        <div className="flex flex-col text-left">
                          <span className="text-xl font-black text-gray-900">{flight.depTime}</span>
                          <span className="text-sm font-bold text-gray-800">{flight.depCode}</span>
                          <span className="text-[11px] text-gray-500">{flight.depTerminal}</span>
                        </div>

                        {/* Route Indicator */}
                        <div className="flex flex-col items-center flex-1 px-2">
                          <span className="text-xs text-gray-600 font-semibold">{flight.duration}</span>
                          <div className="w-full flex items-center gap-1 my-1">
                            <div className="h-0.5 flex-1 bg-[#008cff]" />
                            <span className="text-[#008cff] text-xs">✈</span>
                            <div className="h-0.5 flex-1 bg-[#008cff]" />
                          </div>
                          <span className="text-[10px] font-bold text-[#1A7F37] uppercase">{flight.stopsText}</span>
                        </div>

                        {/* Destination */}
                        <div className="flex flex-col text-right">
                          <span className="text-xl font-black text-gray-900">{flight.arrTime}</span>
                          <span className="text-sm font-bold text-gray-800">{flight.arrCode}</span>
                          <span className="text-[11px] text-gray-500">{flight.arrTerminal}</span>
                        </div>
                      </div>

                      {/* Price & Booking Button */}
                      <div className="flex flex-col md:items-end justify-between gap-1 min-w-[160px]">
                        <div className="flex flex-col md:text-right">
                          <span className="text-xs text-gray-400 line-through">₹{flight.originalPrice.toLocaleString('en-IN')}</span>
                          <span className="text-2xl font-black text-[#005cab]">₹{flight.price.toLocaleString('en-IN')}</span>
                          <span className="text-[11px] text-gray-500">per adult</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBookFlight(flight)}
                          className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#008cff] to-[#0A58CA] hover:from-[#0A58CA] hover:to-[#005cab] text-white font-extrabold text-sm shadow-md transition transform active:scale-95 text-center"
                        >
                          BOOK NOW
                        </button>
                      </div>
                    </div>

                    {/* Bottom Amenities Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 bg-[#F2F4F8] -mx-5 -mb-5 px-5 py-2.5 rounded-b-2xl border-t border-[#E7EBF0]">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1 text-[#1A7F37] bg-[#E8F5E9] px-2 py-0.5 rounded-full font-semibold text-[11px]">
                          ✔ Free Web Check-in
                        </span>
                        <span>🎒 {flight.cabinBaggage} Cabin &bull; 🧳 {flight.checkinBaggage} Check-in</span>
                        {flight.hasFreeMeal ? (
                          <span className="text-[#005cab] font-semibold">🍽️ Free Hot Meal</span>
                        ) : (
                          <span>🍽️ Meals for purchase</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedFlightId(isExpanded ? null : flight.id)}
                        className="text-xs font-bold text-[#008cff] hover:underline flex items-center space-x-0.5"
                      >
                        <span>{isExpanded ? 'Hide Flight Details' : 'View Flight Details'}</span>
                        <span>{isExpanded ? '▲' : '▼'}</span>
                      </button>
                    </div>

                    {/* Expandable Flight Details Drawer */}
                    {isExpanded && (
                      <div className="p-4 bg-white rounded-xl border border-gray-200 mt-2 space-y-3">
                        <div className="flex items-center space-x-4 border-b border-gray-200 pb-2 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setFlightDetailTab('info')}
                            className={`pb-1 ${flightDetailTab === 'info' ? 'text-[#008cff] border-b-2 border-[#008cff]' : 'text-gray-500'}`}
                          >
                            Flight Information
                          </button>
                          <button
                            type="button"
                            onClick={() => setFlightDetailTab('fare')}
                            className={`pb-1 ${flightDetailTab === 'fare' ? 'text-[#008cff] border-b-2 border-[#008cff]' : 'text-gray-500'}`}
                          >
                            Fare Breakup
                          </button>
                          <button
                            type="button"
                            onClick={() => setFlightDetailTab('policy')}
                            className={`pb-1 ${flightDetailTab === 'policy' ? 'text-[#008cff] border-b-2 border-[#008cff]' : 'text-gray-500'}`}
                          >
                            Baggage & Cancellation Policy
                          </button>
                        </div>

                        {flightDetailTab === 'info' && (
                          <div className="text-xs text-gray-700 space-y-1">
                            <p><strong>{flight.airline} {flight.flightNumber}:</strong> Departs {flight.depCode} ({flight.depTerminal}) at {flight.depTime}. Arrives {flight.arrCode} ({flight.arrTerminal}) at {flight.arrTime}. Total flight duration {flight.duration}. Aircraft type: {flight.aircraft}.</p>
                            <p className="text-gray-500">Economy Saver Class &bull; Guaranteed Seat Confirmation.</p>
                          </div>
                        )}

                        {flightDetailTab === 'fare' && (
                          <div className="text-xs text-gray-700 space-y-1">
                            <p>Base Fare: <strong>₹{flight.baseFare.toLocaleString('en-IN')}</strong></p>
                            <p>Airline Taxes & Regulatory Fees: <strong>₹{flight.taxes.toLocaleString('en-IN')}</strong></p>
                            <p>Special Instant Discount: <strong className="text-[#1A7F37]">- ₹300</strong></p>
                            <p className="border-t border-gray-200 pt-1 font-bold text-gray-900">Total Fare: ₹{flight.price.toLocaleString('en-IN')}</p>
                          </div>
                        )}

                        {flightDetailTab === 'policy' && (
                          <div className="text-xs text-gray-700 space-y-1">
                            <p><strong>Cancellation Penalty:</strong> ₹3,000 fee applies up to 2 hours prior to departure. Non-refundable within 2 hours of departure.</p>
                            <p><strong>Date Change:</strong> Permitted with fare difference + ₹2,500 date change fee.</p>
                            <p className="text-emerald-700 font-semibold">100% full refund available if Zero Cancellation guarantee is purchased.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
