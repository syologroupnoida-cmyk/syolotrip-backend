import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchFlightsApi } from '../services/api';

// ─── Fallback Mock Data ──────────────────────────────────
const fallbackFlights = [
  {
    id: 1,
    airline: 'Japan Airlines',
    airlineCode: 'JAL',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChy_1e2TRhqdPTL4LemJdD5k-S7yE4-UvuMNkQHQi5y4FVeWE4KJzsYxXNtNbONczY3T26uYtSycQdCbhVUssm7643tqJhXO7-j42_l5yYf0dkH9V9LYHCcPJCjyUIn8LMUrA95lVsp8wGAlmBtbNNMTCY5gYfzJrymS79IWZSYMmXHEuRiY1sWX6Qg6H__TIxzIbWXOu5g6s_iLldzntFYBCSaCSptq-ytfRGbPTzQ5VvBEsAXV20',
    departure: '08:30',
    arrival: '14:45+1',
    from: 'SFO',
    to: 'HND',
    duration: '11h 15m',
    stops: 'Non-stop',
    price: 64890,
    originalPrice: 68500,
    cabin: 'Economy',
    tags: ['Lowest Fare', 'Free Cancel'],
    aircraft: 'Boeing 787-9 Dreamliner',
    emissions: '287 kg CO₂e',
    emissionsRating: 'low',
    baggage: '2 × 23kg checked',
  },
  {
    id: 2,
    airline: 'United Airlines',
    airlineCode: 'UA',
    logo: null,
    departure: '10:15',
    arrival: '16:30+1',
    from: 'SFO',
    to: 'HND',
    duration: '11h 15m',
    stops: 'Non-stop',
    price: 66800,
    originalPrice: null,
    cabin: 'Economy',
    tags: ['Wi-Fi Included'],
    aircraft: 'Boeing 777-300ER',
    emissions: '312 kg CO₂e',
    emissionsRating: 'medium',
    baggage: '2 × 23kg checked',
  },
  {
    id: 3,
    airline: 'ANA',
    airlineCode: 'NH',
    logo: null,
    departure: '13:45',
    arrival: '17:10+1',
    from: 'SFO',
    to: 'NRT',
    duration: '10h 25m',
    stops: 'Non-stop',
    price: 69500,
    originalPrice: 75800,
    cabin: 'Economy',
    tags: ['Best Rated', 'Eco-Certified'],
    aircraft: 'Airbus A380',
    emissions: '265 kg CO₂e',
    emissionsRating: 'low',
    baggage: '2 × 23kg checked',
  },
  {
    id: 4,
    airline: 'Korean Air',
    airlineCode: 'KE',
    logo: null,
    departure: '09:00',
    arrival: '20:35+1',
    from: 'SFO',
    to: 'HND',
    duration: '14h 35m',
    stops: '1 stop · ICN (2h 15m)',
    price: 52800,
    originalPrice: null,
    cabin: 'Economy',
    tags: ['Value Pick'],
    aircraft: 'Boeing 777-200',
    emissions: '384 kg CO₂e',
    emissionsRating: 'high',
    baggage: '1 × 23kg checked',
  },
  {
    id: 5,
    airline: 'Singapore Airlines',
    airlineCode: 'SQ',
    logo: null,
    departure: '23:45',
    arrival: '12:20+2',
    from: 'SFO',
    to: 'HND',
    duration: '15h 35m',
    stops: '1 stop · SIN (3h 40m)',
    price: 58900,
    originalPrice: 64200,
    cabin: 'Economy',
    tags: ['Premium Carrier'],
    aircraft: 'Airbus A350-900',
    emissions: '340 kg CO₂e',
    emissionsRating: 'medium',
    baggage: '2 × 23kg checked',
  },
];

const sortOptions = ['Best Match', 'Lowest Price', 'Shortest Duration', 'Earliest Departure', 'Fewest Stops'];
const sidebarFilters = [
  { label: 'Stops', options: ['Non-stop', '1 Stop', '2+ Stops'] },
  { label: 'Airlines', options: ['Japan Airlines', 'United Airlines', 'ANA', 'Korean Air', 'Singapore Airlines'] },
  { label: 'Departure Time', options: ['Early Morning (00-06)', 'Morning (06-12)', 'Afternoon (12-18)', 'Evening (18-00)'] },
  { label: 'Price Range', options: ['Under ₹50,000', '₹50,000 - ₹60,000', '₹60,000 - ₹70,000', '₹70,000+'] },
];

import type { FlightSearchParams } from './ExplorePage';

interface FlightSearchPageProps {
  onNavigate?: (screen: 'explore' | 'flights' | 'hotels' | 'checkout' | 'trips') => void;
  searchParams?: FlightSearchParams;
}

// ─── Component ───────────────────────────────────────────
export const FlightSearchPage: React.FC<FlightSearchPageProps> = ({ 
  onNavigate,
  searchParams,
}) => {
  const [activeSort, setActiveSort] = useState('Best Match');
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(2);
  const [alertActive, setAlertActive] = useState(false);

  const fromCode = searchParams?.fromCode || 'SFO';
  const toCode = searchParams?.toCode || 'HND';
  const fromCity = searchParams?.fromCity || 'San Francisco';
  const toCity = searchParams?.toCity || 'Tokyo Haneda';

  const { data: apiFlights, isLoading } = useQuery({
    queryKey: ['flightsSearch', fromCode, toCode],
    queryFn: async () => {
      // 1. First try matching route
      let flights = await searchFlightsApi({ from_code: fromCode, to_code: toCode });
      // 2. If no exact match found in demo DB, fetch all available flights
      if (!flights || flights.length === 0) {
        flights = await searchFlightsApi();
      }
      return flights;
    },
  });

  const displayFlights = (apiFlights && apiFlights.length > 0)
    ? apiFlights.map((f: any) => ({
        id: f.id,
        airline: f.airline,
        airlineCode: f.airline_code,
        logo: f.logo_url || null,
        departure: f.departure_time,
        arrival: f.arrival_time,
        from: f.origin?.code || fromCode,
        to: f.destination?.code || toCode,
        duration: `${Math.floor(f.duration_minutes / 60)}h ${f.duration_minutes % 60}m`,
        stops: f.stops === 0 ? 'Non-stop' : `${f.stops} stop`,
        price: f.total_price,
        originalPrice: Math.round(f.total_price * 1.08),
        cabin: f.cabin_class === 'ECONOMY' ? 'Economy' : f.cabin_class,
        tags: f.tags?.length ? f.tags : ['Verified DB Route'],
        aircraft: f.aircraft,
        emissions: f.emissions_kg ? `${f.emissions_kg} kg CO₂e` : '285 kg CO₂e',
        emissionsRating: 'low',
        baggage: f.baggage_info || '2 × 23kg checked',
      }))
    : fallbackFlights;

  return (
    <div className="w-full bg-background">
      {/* ── Search Summary Bar ── */}
      <section className="bg-primary text-on-primary">
        <div className="max-w-[1280px] mx-auto px-gutter py-space-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-md flex-wrap">
              <div className="flex items-center gap-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="text-headline-sm font-bold">{fromCode}</span>
                  <span className="text-body-sm text-primary-fixed">{fromCity}</span>
                </div>
                <div className="flex items-center gap-space-xs text-primary-fixed">
                  <span className="material-symbols-outlined text-[20px]">flight</span>
                  <span className="w-16 h-[1px] bg-primary-fixed/40" />
                  <span className="material-symbols-outlined text-[16px]">radio_button_unchecked</span>
                  <span className="w-16 h-[1px] bg-primary-fixed/40" />
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="text-headline-sm font-bold">{toCode}</span>
                  <span className="text-body-sm text-primary-fixed">{toCity}</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs text-label-md text-primary-fixed">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>{searchParams?.departDate ? new Date(searchParams.departDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Oct 24'} {searchParams?.returnDate ? `- ${new Date(searchParams.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                <span className="mx-1">·</span>
                <span>Round Trip</span>
                <span className="mx-1">·</span>
                <span>1 Adult</span>
                <span className="mx-1">·</span>
                <span>Economy</span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate?.('explore')}
              className="flex items-center gap-space-xs bg-white/15 hover:bg-white/25 backdrop-blur-md px-space-md py-space-sm rounded-lg text-label-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Modify Search</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Fare Matrix Quick Select ── */}
      <section className="bg-surface-container-low border-b border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-gutter py-space-sm">
          <div className="flex items-center gap-space-sm overflow-x-auto">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Nearby Dates:</span>
            {[
              { date: 'Oct 12', day: 'Sun', price: '₹66,800' },
              { date: 'Oct 13', day: 'Mon', price: '₹65,400' },
              { date: 'Oct 14', day: 'Tue', price: '₹64,890' },
              { date: 'Oct 15', day: 'Wed', price: '₹65,900' },
              { date: 'Oct 16', day: 'Thu', price: '₹62,200', lowest: true },
              { date: 'Oct 17', day: 'Fri', price: '₹68,100' },
              { date: 'Oct 18', day: 'Sat', price: '₹71,500' },
            ].map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDateIndex(i)}
                className={`flex flex-col items-center px-space-sm py-space-xs rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  selectedDateIndex === i
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : d.lowest
                    ? 'bg-tertiary/10 text-tertiary border border-tertiary/30 hover:bg-tertiary/20'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30'
                }`}
              >
                <span className="text-label-sm">{d.date} · {d.day}</span>
                <span className={`text-label-lg font-bold tabular-nums ${d.lowest && selectedDateIndex !== i ? 'text-tertiary' : ''}`}>{d.price}</span>
                {d.lowest && <span className="text-[9px] text-tertiary font-bold uppercase">Lowest</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content: Sidebar + Results ── */}
      <div className="max-w-[1280px] mx-auto px-gutter py-space-lg">
        <div className="flex gap-space-lg">
          {/* ── LEFT SIDEBAR FILTERS ── */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <h3 className="text-headline-sm text-on-surface font-bold">Filters</h3>
                <button 
                  type="button"
                  onClick={() => {
                    setActiveSort('Best Match');
                    setSelectedDateIndex(2);
                    setAlertActive(false);
                  }}
                  className="text-label-md text-primary hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              </div>

              {sidebarFilters.map((filter, fi) => (
                <div key={fi} className="bg-surface-container-lowest rounded-xl p-space-md shadow-card">
                  <h4 className="text-label-lg text-on-surface font-bold mb-space-sm">{filter.label}</h4>
                  <div className="flex flex-col gap-space-xs">
                    {filter.options.map((opt, oi) => (
                      <label key={oi} className="flex items-center gap-space-sm cursor-pointer hover:text-primary transition-colors">
                        <input type="checkbox" defaultChecked={oi === 0 && fi === 0} className="accent-primary rounded w-4 h-4 cursor-pointer" />
                        <span className="text-body-sm text-on-surface-variant">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Price Alert CTA */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-space-md flex flex-col gap-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className={`material-symbols-outlined text-[20px] ${alertActive ? 'text-tertiary' : 'text-primary'}`}>
                    {alertActive ? 'check_circle' : 'notifications_active'}
                  </span>
                  <span className="text-label-lg text-primary font-bold">
                    {alertActive ? 'Price Alert Active' : 'Set Price Alert'}
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  {alertActive 
                    ? `Tracking ${fromCode} → ${toCode}. We will send you an email alert when prices drop below current fare!` 
                    : `Get notified when ${fromCode} → ${toCode} drops below your target price.`}
                </p>
                <button 
                  type="button"
                  onClick={() => setAlertActive(!alertActive)}
                  className={`w-full py-space-sm rounded-lg text-label-lg transition-colors font-bold cursor-pointer ${
                    alertActive 
                      ? 'bg-tertiary text-on-tertiary hover:bg-tertiary/90' 
                      : 'bg-primary text-on-primary hover:bg-primary-container'
                  }`}
                >
                  {alertActive ? 'Alert Subscribed ✓' : 'Create Alert'}
                </button>
              </div>
            </div>
          </aside>

          {/* ── RIGHT RESULTS ── */}
          <div className="flex-1 flex flex-col gap-space-md">
            {/* Sort Bar */}
            <div className="flex items-center justify-between flex-wrap gap-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="text-label-lg text-on-surface font-bold">{displayFlights.length} flights found</span>
                <span className="text-body-sm text-on-surface-variant">· Prices include taxes and fees</span>
              </div>
              <div className="flex items-center gap-space-xs overflow-x-auto">
                <span className="text-label-sm text-on-surface-variant">Sort:</span>
                {sortOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setActiveSort(opt)}
                    className={`text-label-md px-space-sm py-space-xs rounded-full whitespace-nowrap transition-colors ${
                      activeSort === opt
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Flight Result Cards */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 bg-surface-container-lowest rounded-xl shadow-card">
                <span className="material-symbols-outlined animate-spin text-[36px] text-primary">progress_activity</span>
                <span className="text-body-md text-on-surface font-semibold">Searching live fares for {fromCode} → {toCode}...</span>
              </div>
            ) : (
              displayFlights.map(flight => (
                <div
                  key={flight.id}
                onClick={() => setSelectedFlight(selectedFlight === flight.id ? null : flight.id)}
                className={`bg-surface-container-lowest rounded-xl overflow-hidden shadow-card card-hover cursor-pointer border transition-all ${
                  selectedFlight === flight.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                }`}
              >
                <div className="p-space-md grid grid-cols-1 lg:grid-cols-12 gap-space-md items-center">
                  {/* Airline Info */}
                  <div className="lg:col-span-2 flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                      {flight.logo ? (
                        <img src={flight.logo} alt={flight.airline} className="w-8 h-8 rounded-md object-cover" />
                      ) : (
                        <span className="text-label-lg text-primary font-bold">{flight.airlineCode}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-label-lg text-on-surface font-bold block">{flight.airline}</span>
                      <span className="text-label-sm text-on-surface-variant">{flight.aircraft}</span>
                    </div>
                  </div>

                  {/* Route Timeline */}
                  <div className="lg:col-span-5 flex items-center gap-space-md justify-center">
                    <div className="text-right">
                      <span className="text-headline-md text-on-surface font-bold tabular-nums">{flight.departure}</span>
                      <span className="text-label-lg text-on-surface font-bold block">{flight.from}</span>
                    </div>

                    {/* Route Connector */}
                    <div className="flex flex-col items-center flex-1 max-w-[200px]">
                      <span className="text-label-sm text-on-surface-variant">{flight.duration}</span>
                      <div className="w-full flex items-center gap-1 my-1">
                        <div className="h-[2px] flex-1 bg-outline-variant" />
                        <span className="material-symbols-outlined text-primary text-[16px]">flight</span>
                        <div className="h-[2px] flex-1 bg-outline-variant" />
                      </div>
                      <span className={`text-label-sm ${flight.stops === 'Non-stop' ? 'text-tertiary font-bold' : 'text-on-surface-variant'}`}>
                        {flight.stops}
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-headline-md text-on-surface font-bold tabular-nums">{flight.arrival}</span>
                      <span className="text-label-lg text-on-surface font-bold block">{flight.to}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="lg:col-span-2 flex flex-wrap gap-space-xs">
                    {(flight.tags || []).map((tag: string, ti: number) => (
                      <span
                        key={ti}
                        className={`text-label-sm px-space-sm py-0.5 rounded-full font-bold ${
                          tag === 'Lowest Fare' ? 'bg-tertiary/10 text-tertiary'
                          : tag === 'Best Rated' ? 'bg-primary/10 text-primary'
                          : tag === 'Eco-Certified' ? 'bg-tertiary/10 text-tertiary'
                          : tag === 'Value Pick' ? 'bg-secondary/10 text-secondary'
                          : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Price & Book */}
                  <div className="lg:col-span-3 flex flex-col items-end gap-space-xs border-l border-outline-variant/30 pl-space-md">
                    {flight.originalPrice && (
                      <span className="text-body-sm text-on-surface-variant line-through tabular-nums">₹{flight.originalPrice.toLocaleString('en-IN')}</span>
                    )}
                    <span className="text-headline-md text-on-surface font-bold tabular-nums">₹{flight.price.toLocaleString('en-IN')}</span>
                    <span className="text-label-sm text-on-surface-variant">per person · round trip</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.('checkout');
                      }}
                      className="w-full bg-secondary-container hover:bg-secondary text-on-secondary py-space-sm rounded-lg text-label-lg font-bold transition-all shadow-sm flex items-center justify-center gap-space-xs mt-space-xs"
                    >
                      <span>Select Flight</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedFlight === flight.id && (
                  <div className="border-t border-outline-variant/30 bg-surface-container-low/50 px-space-md py-space-sm">
                    <div className="flex items-center gap-space-lg flex-wrap text-body-sm text-on-surface-variant">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">luggage</span>
                        <span>{flight.baggage}</span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">eco</span>
                        <span className={`${flight.emissionsRating === 'low' ? 'text-tertiary' : flight.emissionsRating === 'high' ? 'text-error' : 'text-on-surface-variant'}`}>
                          {flight.emissions}
                          {flight.emissionsRating === 'low' && ' · Low emissions'}
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">airline_seat_recline_extra</span>
                        <span>{flight.cabin}</span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                        <span>{flight.aircraft}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )))}

            {/* Load More */}
            <div className="flex justify-center pt-space-md">
              <button 
                type="button"
                onClick={() => alert(`All verified flights for ${fromCode} → ${toCode} are currently displayed.`)}
                className="text-label-lg text-primary hover:text-primary-container flex items-center gap-space-xs transition-colors cursor-pointer"
              >
                <span>All {displayFlights.length} Flights Loaded ✓</span>
                <span className="material-symbols-outlined text-[18px]">done</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
