import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchCabsApi, CabApiResponse } from '../services/api';
import { ScreenType } from '../components/Header';
import { WebCheckoutItem } from './BookingCheckoutPage';

interface CabSearchPageProps {
  onNavigate?: (screen: ScreenType) => void;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
  pickupLocation?: string;
  dropLocation?: string;
}

interface CabOption {
  id: string;
  name: string;
  model: string;
  category: 'HATCHBACK' | 'SEDAN' | 'SUV' | 'PREMIUM_SUV' | 'EV';
  rating: number;
  tripsCount: number;
  passengers: number;
  luggage: number;
  price: number;
  originalPrice: number;
  fareBreakdown: string;
  image: string;
  features: string[];
  badges: string[];
  tollIncluded: boolean;
  freeCancelHours: number;
}

const mapCabResponse = (c: CabApiResponse): CabOption => {
  const originalPrice = Math.round(c.base_fare * 1.25);
  let category: 'HATCHBACK' | 'SEDAN' | 'SUV' | 'PREMIUM_SUV' | 'EV' = 'SEDAN';
  const ct = c.cab_type?.toUpperCase() || '';
  if (ct.includes('SUV')) category = 'SUV';
  else if (ct.includes('EV') || ct.includes('ELECTRIC')) category = 'EV';
  else if (ct.includes('HATCH')) category = 'HATCHBACK';

  const img = category === 'SUV'
    ? 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=80'
    : category === 'EV'
    ? 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=500&q=80'
    : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=500&q=80';

  return {
    id: c.id,
    name: `${c.city} ${c.cab_type}`,
    model: c.vehicle_model,
    category,
    rating: c.driver_rating || 4.8,
    tripsCount: 1500,
    passengers: c.capacity || 4,
    luggage: c.capacity > 4 ? 4 : 2,
    price: Math.round(c.base_fare),
    originalPrice,
    fareBreakdown: `${c.pickup_area} → ${c.drop_area} · Tolls included`,
    image: img,
    features: c.features && c.features.length > 0 ? c.features : ['Air Conditioned', 'Verified Chauffeur', 'Complimentary Water', 'Clean Sanitized Cab'],
    badges: ['MMT Assured', 'Zero Surge Guarantee'],
    tollIncluded: true,
    freeCancelHours: 1,
  };
};

export const CabSearchPage: React.FC<CabSearchPageProps> = ({
  onNavigate,
  onInitiateCheckout,
  pickupLocation = 'Delhi Airport T3 (DEL)',
  dropLocation = 'Connaught Place, Central Delhi',
}) => {
  const [tripType, setTripType] = useState<'AIRPORT' | 'OUTSTATION' | 'HOURLY'>('AIRPORT');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'SEDAN' | 'SUV' | 'EV'>('ALL');
  const [tollIncludedOnly, setTollIncludedOnly] = useState(true);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [sortBy, setSortBy] = useState<'CHEAPEST' | 'RATING' | 'POPULAR'>('POPULAR');
  const [ignoreCityFilter, setIgnoreCityFilter] = useState(false);

  const detectedCity = useMemo(() => {
    const loc = pickupLocation.toLowerCase();
    if (loc.includes('mumbai')) return 'Mumbai';
    if (loc.includes('bengaluru') || loc.includes('bangalore')) return 'Bengaluru';
    return 'Delhi';
  }, [pickupLocation]);

  // Live Backend Query
  const {
    data: apiCabs,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cabsSearch', detectedCity, ignoreCityFilter],
    queryFn: () => {
      if (ignoreCityFilter) {
        return searchCabsApi();
      }
      return searchCabsApi({ city: detectedCity });
    },
    staleTime: 30000,
  });

  // Map API response to cab cards
  const liveCabs = useMemo(() => {
    if (!apiCabs) return [];
    return apiCabs.map(mapCabResponse);
  }, [apiCabs]);

  const filteredCabs = useMemo(() => {
    return liveCabs
      .filter((cab) => {
        if (selectedCategory !== 'ALL' && cab.category !== selectedCategory) return false;
        if (tollIncludedOnly && !cab.tollIncluded) return false;
        if (cab.price > maxPrice) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'CHEAPEST') return a.price - b.price;
        if (sortBy === 'RATING') return b.rating - a.rating;
        return b.tripsCount - a.tripsCount;
      });
  }, [liveCabs, selectedCategory, tollIncludedOnly, maxPrice, sortBy]);

  const handleBookCab = (cab: CabOption) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!cab.id || !uuidRegex.test(cab.id)) {
      alert('Data integrity issue: Selected cab lacks a valid database UUID. Booking is disabled.');
      return;
    }

    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'CAB',
        itemId: cab.id,
        title: `${cab.name} (${cab.model})`,
        subtitle: `${cab.passengers} Passengers · ${cab.luggage} Bags · ${cab.fareBreakdown}`,
        routeInfo: `${pickupLocation} → ${dropLocation}`,
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

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-[#191C1E] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ── TOP STICKY MODIFIER BAR (MMT STITCH DESIGN) ── */}
      <section className="sticky top-16 sm:top-[70px] z-30 bg-[#005cab] text-white shadow-md">
        <div className="max-w-[1240px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-amber-300 text-2xl">local_taxi</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-wide">{pickupLocation}</span>
                <span className="material-symbols-outlined text-sm text-blue-200">arrow_forward</span>
                <span className="font-extrabold text-base tracking-wide">{dropLocation}</span>
              </div>
              <p className="text-xs text-blue-100 flex items-center space-x-2">
                <span>Pickup Now (Immediate)</span>
                <span>·</span>
                <span>All Tolls & Taxes Included</span>
                <span>·</span>
                <span className="bg-[#1A7F37] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">Zero Hidden Charges</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex bg-white/10 rounded-lg p-1 text-xs">
              {[
                { id: 'AIRPORT', label: 'Airport Transfer' },
                { id: 'OUTSTATION', label: 'Outstation' },
                { id: 'HOURLY', label: 'Hourly Rentals' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTripType(t.id as any)}
                  className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                    tripType === t.id ? 'bg-white text-[#005cab] shadow-xs' : 'text-blue-100 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => onNavigate && onNavigate('explore')}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Modify</span>
            </button>
          </div>
        </div>

        {/* Quick Cab Category Strip */}
        <div className="bg-[#004785] border-t border-white/10 px-4 py-2">
          <div className="max-w-[1240px] mx-auto flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-blue-200 font-medium text-[11px] shrink-0 mr-1">Vehicle Category:</span>
            {[
              { id: 'ALL', label: 'All Cabs' },
              { id: 'SEDAN', label: '🚗 Prime Sedan (Dzire / Etios)' },
              { id: 'EV', label: '⚡ Eco Electric (Silent Ride)' },
              { id: 'SUV', label: '🚙 Spacious SUV (Ertiga / Innova)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-white text-[#005cab] shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN 12-COLUMN CONTENT ── */}
      <main className="max-w-[1240px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT 3-COL FILTER SIDEBAR ── */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl p-4 border border-[#E7EBF0] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-extrabold text-sm text-[#191C1E] flex items-center space-x-1.5">
                  <span className="material-symbols-outlined text-[#005cab] text-lg">tune</span>
                  <span>Filter Cabs</span>
                </h3>
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setTollIncludedOnly(true);
                    setMaxPrice(3500);
                  }}
                  className="text-xs font-bold text-[#005cab] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Toll Guarantee Box */}
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tollIncludedOnly}
                    onChange={(e) => setTollIncludedOnly(e.target.checked)}
                    className="mt-0.5 accent-[#1A7F37] rounded"
                  />
                  <div>
                    <span className="text-xs font-black text-emerald-900 block">Tolls & Taxes Included</span>
                    <p className="text-[10px] text-emerald-800 leading-tight mt-0.5">
                      No extra toll cash needed during the journey. Driver handles all FASTag payments.
                    </p>
                  </div>
                </label>
              </div>

              {/* Price Slider */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-700">Max Fare</span>
                  <span className="text-xs font-extrabold text-[#005cab]">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="3500"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#005cab] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>₹400</span>
                  <span>₹3,500</span>
                </div>
              </div>

              {/* Guarantee bullets */}
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
                <span className="font-bold text-gray-800 block">MakeMyTrip Cab Assurance</span>
                <div className="space-y-1.5 text-[11px] text-gray-600">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#1A7F37] font-bold">✓</span>
                    <span>No Cancellation from Driver Side</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#1A7F37] font-bold">✓</span>
                    <span>Free Waiting up to 45 mins for flight delays</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#1A7F37] font-bold">✓</span>
                    <span>SOS 24x7 Safety Helpline</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT 9-COL CABS LIST ── */}
          <section className="lg:col-span-9 space-y-4">
            {/* Sort Bar */}
            <div className="bg-white rounded-xl p-3 border border-[#E7EBF0] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-gray-700 font-bold">Available Cabs for Immediate Pickup</span>

              <div className="flex items-center space-x-2">
                <span className="text-gray-500 font-medium">Sort by:</span>
                {[
                  { id: 'POPULAR', label: 'Recommended' },
                  { id: 'CHEAPEST', label: 'Lowest Price' },
                  { id: 'RATING', label: 'Driver Rating' },
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

            {/* Ignore City Banner if viewing all */}
            {ignoreCityFilter && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <span>Showing verified airport & outstation cabs across all service regions.</span>
                <button
                  type="button"
                  onClick={() => setIgnoreCityFilter(false)}
                  className="font-bold text-[#005cab] hover:underline"
                >
                  Filter to {detectedCity}
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-xl p-12 text-center border border-[#E7EBF0] shadow-xs flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#005cab] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-base font-bold text-gray-800">Checking Live Chauffeur & Cab Availability...</p>
                <p className="text-xs text-gray-500 mt-1">Connecting to live fleet for {pickupLocation}</p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-red-50 rounded-xl p-8 text-center border border-red-200 shadow-xs">
                <p className="text-base font-bold text-red-700">Unable to Fetch Cab Fleet</p>
                <p className="text-xs text-red-600 mt-1">{(error as any)?.message || 'An error occurred while connecting to the cab service.'}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Retry Search
                </button>
              </div>
            )}

            {/* Cab Cards / Empty State */}
            {!isLoading && !isError && filteredCabs.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center border border-[#E7EBF0]">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">local_taxi</span>
                <p className="font-extrabold text-base text-gray-800">No cabs available in {detectedCity} matching filters</p>
                <p className="text-xs text-gray-500 mt-1">Try resetting the vehicle category or price filters, or browse all cabs.</p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMaxPrice(15000);
                      setSelectedCategory('ALL');
                      setTollIncludedOnly(false);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition"
                  >
                    Reset Filters
                  </button>
                  {!ignoreCityFilter && (
                    <button
                      type="button"
                      onClick={() => setIgnoreCityFilter(true)}
                      className="px-4 py-2 bg-[#005cab] hover:bg-[#0A58CA] text-white text-xs font-bold rounded-lg shadow-xs transition"
                    >
                      View All Available Cabs
                    </button>
                  )}
                </div>
              </div>
            ) : !isLoading && !isError && (
              filteredCabs.map((cab) => (
              <div
                key={cab.id}
                className="bg-white rounded-xl border border-[#E7EBF0] hover:border-[#005cab] hover:shadow-md transition overflow-hidden"
              >
                <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Left Column: Car Photo + Model */}
                  <div className="md:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 mb-2">
                      <img
                        src={cab.image}
                        alt={cab.model}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded">
                        {cab.category}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-base text-gray-900">{cab.name}</h4>
                    <p className="text-xs text-gray-500">{cab.model}</p>
                  </div>

                  {/* Middle Column: Details & Inclusions */}
                  <div className="md:col-span-5 space-y-2">
                    {/* Capacity row */}
                    <div className="flex items-center space-x-4 text-xs text-gray-700">
                      <span className="flex items-center space-x-1">
                        <span className="material-symbols-outlined text-base text-[#005cab]">person</span>
                        <strong>{cab.passengers} Passengers</strong>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="material-symbols-outlined text-base text-[#005cab]">luggage</span>
                        <strong>{cab.luggage} Bags</strong>
                      </span>
                      <span className="flex items-center space-x-1 bg-emerald-50 text-[#1A7F37] font-bold px-1.5 py-0.5 rounded text-[11px]">
                        <span>{cab.rating}</span>
                        <span>★</span>
                      </span>
                    </div>

                    {/* Inclusions pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cab.features.map((f, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Free cancel & Tolls */}
                    <p className="text-[11px] text-gray-500 leading-tight">
                      <strong className="text-[#1A7F37]">All Tolls Included</strong> · Free cancellation up to {cab.freeCancelHours} hr before pickup
                    </p>
                  </div>

                  {/* Right Column: Price & Book Button */}
                  <div className="md:col-span-3 flex flex-col items-end justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                    <div className="flex items-baseline space-x-1.5 mb-0.5">
                      <span className="text-xs text-gray-400 line-through">₹{cab.originalPrice}</span>
                      <span className="text-2xl font-black text-gray-900">₹{cab.price.toLocaleString('en-IN')}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1A7F37] bg-emerald-50 px-1.5 py-0.2 rounded mb-3">
                      Total Fare (No Hidden Charges)
                    </span>

                    <button
                      onClick={() => handleBookCab(cab)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#005cab] to-[#008cff] hover:brightness-105 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm transition cursor-pointer"
                    >
                      Book Cab
                    </button>
                  </div>
                </div>
              </div>
            )))}
          </section>
        </div>
      </main>
    </div>
  );
};
