import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchPackagesApi, getPackageDetailsApi, PackageApiResponse } from '../services/api';
import { ScreenType } from '../components/Header';
import { useCurrency } from '../context/CurrencyContext';
import { WebCheckoutItem } from './BookingCheckoutPage';

interface PackageSearchPageProps {
  onNavigate?: (screen: ScreenType) => void;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
  destinationCity?: string;
}

interface HolidayPackage {
  id: string;
  packageId?: string;
  title: string;
  destination: string;
  region: string;
  theme: string;
  nights: number;
  days: number;
  durationStr: string;
  itinerarySummary: string;
  rating: number;
  reviewsCount: number;
  images: string[];
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  placesCovered: string[];
  activities: string[];
  hotelCategory: string;
  transfers: string;
  meals: string;
  sightseeing: string;
  route?: string;
  cancellationPolicy?: string;
  hotelStars: number;
  pricePerPerson: number;
  originalPrice: number;
  discountPercent: number;
  emiStartsAt: number;
  assuredBadge: string;
  rawPackage: PackageApiResponse;
}

const mapPackageResponse = (p: PackageApiResponse): HolidayPackage => {
  const originalPrice = p.old_price && p.old_price > p.price_per_person
    ? Math.round(p.old_price)
    : Math.round(p.price_per_person * 1.15);
  const discountPercent = p.discount_percent || Math.round(((originalPrice - p.price_per_person) / originalPrice) * 100);
  const emi = Math.round(p.price_per_person / 12);

  const defaultImgs = [
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=400&q=80',
  ];
  const images = [
    p.featured_image || defaultImgs[0],
    defaultImgs[1],
    defaultImgs[2],
  ];

  return {
    id: p.id,
    packageId: p.package_id,
    title: p.title,
    destination: p.destination,
    region: p.region || 'National',
    theme: p.theme || 'Explorer',
    nights: p.duration_nights || 4,
    days: p.duration_days || 5,
    durationStr: p.duration || `${p.duration_nights || 4} Nights / ${p.duration_days || 5} Days`,
    itinerarySummary: `${p.duration_days || 5} Days / ${p.duration_nights || 4} Nights · ${p.transfers || 'All Transfers Included'}`,
    rating: p.rating || 4.85,
    reviewsCount: 380,
    images,
    inclusions: p.inclusions && p.inclusions.length > 0
      ? p.inclusions
      : ['Accommodation', 'Transfers as per itinerary', 'Daily Breakfast', 'Guided Sightseeing'],
    exclusions: p.exclusions || [],
    highlights: p.highlights && p.highlights.length > 0
      ? p.highlights
      : p.overview ? [p.overview.slice(0, 100) + '...'] : ['Verified Handcrafted Itinerary'],
    placesCovered: p.places_covered || [],
    activities: p.activities || [],
    hotelCategory: p.hotel_category || '3/4 Star (customizable)',
    transfers: p.transfers || 'Included',
    meals: p.meals || 'Breakfast',
    sightseeing: p.sightseeing || 'As per itinerary',
    route: p.route,
    cancellationPolicy: p.cancellation_policy,
    hotelStars: 4,
    pricePerPerson: Math.round(p.price_per_person),
    originalPrice,
    discountPercent,
    emiStartsAt: emi,
    assuredBadge: 'SS Holiday Assured',
    rawPackage: p,
  };
};

export const PackageSearchPage: React.FC<PackageSearchPageProps> = ({
  onNavigate,
  onInitiateCheckout,
  destinationCity = '',
}) => {
  const { formatPrice } = useCurrency();
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'National' | 'International'>('ALL');
  const [selectedTheme, setSelectedTheme] = useState<string>('ALL');
  const [maxPrice, setMaxPrice] = useState(250000);
  const [sortBy, setSortBy] = useState<'POPULAR' | 'CHEAPEST' | 'DURATION'>('POPULAR');
  const [ignoreDestinationFilter, setIgnoreDestinationFilter] = useState(false);
  const [activeDestination, setActiveDestination] = useState<string>(destinationCity || '');
  const [searchTextInput, setSearchTextInput] = useState<string>('');

  // Selected package for full day-wise itinerary modal
  const [inspectPackage, setInspectPackage] = useState<HolidayPackage | null>(null);

  // Fetch full details with day-wise itinerary when modal opens
  const { data: detailedPackage, isLoading: loadingDetails } = useQuery({
    queryKey: ['packageDetails', inspectPackage?.packageId || inspectPackage?.id],
    queryFn: () => {
      const targetId = inspectPackage?.packageId || inspectPackage?.id;
      if (!targetId) return null;
      return getPackageDetailsApi(targetId);
    },
    enabled: Boolean(inspectPackage),
    staleTime: 60000,
  });

  const cleanDestination = useMemo(() => {
    if (!activeDestination) return '';
    return activeDestination.split('&')[0].split(',')[0].trim();
  }, [activeDestination]);

  // Live Backend Query with rich filters
  const {
    data: apiPackages,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['packagesSearch', cleanDestination, selectedRegion, selectedTheme, maxPrice, sortBy, ignoreDestinationFilter],
    queryFn: () => {
      const params: any = {
        limit: 100,
      };
      if (!ignoreDestinationFilter && cleanDestination) {
        params.destination = cleanDestination;
      }
      if (selectedRegion !== 'ALL') {
        params.region = selectedRegion;
      }
      if (selectedTheme !== 'ALL') {
        params.theme = selectedTheme;
      }
      if (maxPrice < 250000) {
        params.max_price = maxPrice;
      }
      if (sortBy === 'CHEAPEST') params.sort_by = 'price_asc';
      else if (sortBy === 'DURATION') params.sort_by = 'duration_desc';
      else params.sort_by = 'popular';

      return searchPackagesApi(params);
    },
    staleTime: 30000,
  });

  // Map API response to package cards
  const livePackages = useMemo(() => {
    if (!apiPackages) return [];
    return apiPackages.map(mapPackageResponse);
  }, [apiPackages]);

  const filteredPackages = useMemo(() => {
    return livePackages.filter((pkg) => {
      if (searchTextInput) {
        const queryStr = searchTextInput.toLowerCase();
        const matchesTitle = pkg.title.toLowerCase().includes(queryStr);
        const matchesDest = pkg.destination.toLowerCase().includes(queryStr);
        const matchesRoute = pkg.route?.toLowerCase().includes(queryStr);
        if (!matchesTitle && !matchesDest && !matchesRoute) return false;
      }
      return true;
    });
  }, [livePackages, searchTextInput]);

  const handleBookPackage = (pkg: HolidayPackage) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!pkg.id || !uuidRegex.test(pkg.id)) {
      alert('Data integrity issue: Selected holiday package lacks a valid database UUID. Booking is disabled.');
      return;
    }

    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'PACKAGE',
        itemId: pkg.id,
        title: pkg.title,
        subtitle: `${pkg.days} Days / ${pkg.nights} Nights · ${pkg.itinerarySummary}`,
        routeInfo: `${pkg.destination} (${pkg.inclusions.slice(0, 3).join(', ')})`,
        pricing: {
          baseAmount: pkg.pricePerPerson,
          taxes: Math.round(pkg.pricePerPerson * 0.18),
          discount: 2500,
          insurance: 499,
        },
      });
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const DESTINATION_CHIPS = [
    { label: 'All Destinations', value: '' },
    { label: '🌴 Kerala', value: 'Kerala' },
    { label: '🏖️ Goa', value: 'Goa' },
    { label: '🏙️ Dubai', value: 'Dubai' },
    { label: '🌺 Bali', value: 'Bali' },
    { label: '🏝️ Andaman', value: 'Andaman' },
    { label: '🏔️ Himalayan', value: 'Himalayan' },
    { label: '🕌 Rajasthan', value: 'Rajasthan' },
    { label: '🐘 Thailand', value: 'Thailand' },
    { label: '🦁 Singapore', value: 'Singapore' },
    { label: '🍵 Darjeeling', value: 'Darjeeling' },
    { label: '🎈 Turkey', value: 'Turkey' },
    { label: '🇱🇰 Sri Lanka', value: 'Sri Lanka' },
    { label: '🏔️ Nepal', value: 'Nepal' },
    { label: '🇲🇾 Malaysia', value: 'Malaysia' },
  ];

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-[#191C1E] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ── TOP STICKY MODIFIER BAR (SS STITCH DESIGN) ── */}
      <section className="sticky top-16 sm:top-[70px] z-30 bg-[#005cab] text-white shadow-md">
        <div className="max-w-[1240px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-amber-300 text-2xl">luggage</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-wide">
                  {cleanDestination ? `Holidays in ${cleanDestination}` : 'Handcrafted Holiday Packages'}
                </span>
                <span className="bg-amber-400 text-gray-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  480 Verified Packages
                </span>
              </div>
              <p className="text-xs text-blue-100 flex items-center space-x-2">
                <span>Indicative Starting Prices</span>
                <span>·</span>
                <span>16 Iconic Destinations</span>
                <span>·</span>
                <span className="bg-[#1A7F37] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                  SS Holiday Guarantee
                </span>
              </p>
            </div>
          </div>

          {/* Region Tabs (National vs International) */}
          <div className="flex items-center bg-white/10 rounded-xl p-1 space-x-1">
            {[
              { id: 'ALL', label: 'All (480)' },
              { id: 'National', label: '🇮🇳 National (240)' },
              { id: 'International', label: '✈️ International (240)' },
            ].map((reg) => (
              <button
                key={reg.id}
                onClick={() => {
                  setSelectedRegion(reg.id as any);
                  setIgnoreDestinationFilter(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRegion === reg.id
                    ? 'bg-white text-[#005cab] shadow-xs'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Destination Quick Filters Strip */}
        <div className="bg-[#004785] border-t border-white/10 px-4 py-2">
          <div className="max-w-[1240px] mx-auto flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-blue-200 font-medium text-[11px] shrink-0 mr-1">Destinations:</span>
            {DESTINATION_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => {
                  setActiveDestination(chip.value);
                  setIgnoreDestinationFilter(false);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  activeDestination === chip.value
                    ? 'bg-amber-400 text-gray-900 shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING NOTICE BANNER ── */}
      <div className="bg-amber-50 border-b border-amber-200 py-2 px-4 text-xs text-amber-900">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-amber-600 text-base">info</span>
            <span>
              <strong>Pricing Transparency:</strong> Prices shown are indicative starting prices per person.
              Itineraries, hotels, transfers and meal plans can be customized upon booking.
            </span>
          </div>
          <span className="hidden md:inline font-bold text-amber-800">100% Tailored Holidays</span>
        </div>
      </div>

      {/* ── MAIN 12-COLUMN CONTENT ── */}
      <main className="max-w-[1240px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT 3-COL FILTER SIDEBAR ── */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl p-4 border border-[#E7EBF0] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-extrabold text-sm text-[#191C1E] flex items-center space-x-1.5">
                  <span className="material-symbols-outlined text-[#005cab] text-lg">tune</span>
                  <span>Filter Holidays</span>
                </h3>
                <button
                  onClick={() => {
                    setSelectedRegion('ALL');
                    setSelectedTheme('ALL');
                    setActiveDestination('');
                    setMaxPrice(250000);
                    setSearchTextInput('');
                  }}
                  className="text-xs font-bold text-[#005cab] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Keyword Search */}
              <div className="mt-4">
                <label className="text-xs font-bold text-gray-700 block mb-1">Search Route or Keyword</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTextInput}
                    onChange={(e) => setSearchTextInput(e.target.value)}
                    placeholder="e.g. Backwaters, Munnar, Beach..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-[#005cab]"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-gray-400 text-sm">
                    search
                  </span>
                </div>
              </div>

              {/* Theme Dropdown / Pills */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 block mb-2">Package Theme</label>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    'ALL',
                    'Explorer',
                    'Honeymoon',
                    'Luxury',
                    'Family',
                    'Adventure',
                    'Beach',
                    'Heritage',
                    'Nature',
                    'Budget',
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTheme(t)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        selectedTheme === t
                          ? 'bg-[#005cab] text-white shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-700">Max Starting Price / Person</span>
                  <span className="text-xs font-extrabold text-[#005cab]">{formatPrice(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="250000"
                  step="5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#005cab] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>₹15,000</span>
                  <span>₹2,50,000+</span>
                </div>
              </div>

              {/* Package Promises */}
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
                <span className="font-bold text-gray-800 block">Why SS Journey Holidays?</span>
                <div className="space-y-1.5 text-[11px] text-gray-600">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#1A7F37] font-bold">✓</span>
                    <span>16 Top Destinations Across India & World</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#1A7F37] font-bold">✓</span>
                    <span>480 Handcrafted Customizable Packages</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#1A7F37] font-bold">✓</span>
                    <span>Detailed Day-wise Itineraries & Sightseeing</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#1A7F37] font-bold">✓</span>
                    <span>Clear Inclusions & Indicative Rates</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT 9-COL PACKAGE RESULTS ── */}
          <section className="lg:col-span-9 space-y-5">
            {/* Sort Bar */}
            <div className="bg-white rounded-xl p-3 border border-[#E7EBF0] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-gray-700 font-bold">
                Showing {filteredPackages.length} Handcrafted Holiday Packages
                {selectedRegion !== 'ALL' && ` (${selectedRegion})`}
              </span>

              <div className="flex items-center space-x-2">
                <span className="text-gray-500 font-medium">Sort by:</span>
                {[
                  { id: 'POPULAR', label: 'Recommended' },
                  { id: 'CHEAPEST', label: 'Lowest Price' },
                  { id: 'DURATION', label: 'Duration' },
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

            {/* Ignore Destination Banner */}
            {ignoreDestinationFilter && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <span>Showing all handcrafted holiday packages across all destinations.</span>
                <button
                  type="button"
                  onClick={() => setIgnoreDestinationFilter(false)}
                  className="font-bold text-[#005cab] hover:underline"
                >
                  Filter to {activeDestination}
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-xl p-12 text-center border border-[#E7EBF0] shadow-xs flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#005cab] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-base font-bold text-gray-800">Searching Handcrafted Holiday Packages...</p>
                <p className="text-xs text-gray-500 mt-1">Connecting to live itineraries for {activeDestination || 'all destinations'}</p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-red-50 rounded-xl p-8 text-center border border-red-200 shadow-xs">
                <p className="text-base font-bold text-red-700">Unable to Fetch Holiday Packages</p>
                <p className="text-xs text-red-600 mt-1">{(error as any)?.message || 'An error occurred while connecting to the package service.'}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Retry Search
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && filteredPackages.length === 0 && (
              <div className="bg-white rounded-xl p-10 text-center border border-[#E7EBF0]">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">luggage</span>
                <p className="font-extrabold text-base text-gray-800">
                  No holiday packages currently found for {activeDestination || 'the selected criteria'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  We are constantly expanding our curated holiday inventory. You can explore our featured packages in Kerala, Dubai, Bali, and Goa.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMaxPrice(250000);
                      setSelectedRegion('ALL');
                      setSelectedTheme('ALL');
                      setActiveDestination('');
                      setSearchTextInput('');
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDestination('');
                      setIgnoreDestinationFilter(true);
                    }}
                    className="px-4 py-2 bg-[#005cab] hover:bg-[#0A58CA] text-white text-xs font-bold rounded-lg shadow-xs transition"
                  >
                    View All 480 Holiday Packages
                  </button>
                </div>
              </div>
            )}

            {/* Package Cards List */}
            {!isLoading && !isError && filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-xl border border-[#E7EBF0] hover:border-[#005cab] hover:shadow-lg transition overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-12">
                  {/* Left Column: Image & Badges */}
                  <div className="md:col-span-5 relative p-4 flex flex-col justify-between">
                    <div className="relative h-48 rounded-xl overflow-hidden shadow-xs mb-2">
                      <img
                        src={pkg.images[0]}
                        alt={pkg.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        {pkg.theme}
                      </span>
                      {pkg.discountPercent > 0 && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          {pkg.discountPercent}% OFF
                        </span>
                      )}
                      <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {pkg.durationStr}
                      </span>
                      <span className="absolute bottom-2 right-2 bg-blue-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        {pkg.region}
                      </span>
                    </div>

                    {/* Route Info */}
                    {pkg.route && (
                      <div className="text-[11px] text-gray-600 bg-gray-50 rounded-lg p-2 border border-gray-100">
                        <span className="font-bold text-gray-800 block">Route:</span>
                        <span className="line-clamp-1">{pkg.route}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Details & Pricing */}
                  <div className="md:col-span-7 p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100">
                    <div>
                      {/* Rating & Category */}
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-[#1A7F37] text-white text-xs font-black px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                          <span>{pkg.rating}</span>
                          <span className="text-[10px]">★</span>
                        </span>
                        <span className="text-xs text-gray-500">({pkg.reviewsCount} reviews)</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {pkg.hotelCategory}
                        </span>
                      </div>

                      <h4 className="font-black text-lg text-gray-900 leading-snug">{pkg.title}</h4>
                      <p className="text-xs font-bold text-[#005cab] mt-1">{pkg.itinerarySummary}</p>

                      {/* Inclusions Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {pkg.inclusions.slice(0, 4).map((inc, i) => (
                          <span key={i} className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <span className="text-[#1A7F37]">✓</span>
                            <span>{inc}</span>
                          </span>
                        ))}
                      </div>

                      {/* Highlights */}
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <span className="text-[11px] font-bold text-gray-800 block mb-1">Highlights:</span>
                        <p className="text-[11px] text-gray-600 line-clamp-2">
                          {pkg.highlights.join(' · ')}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Pricing & Action */}
                    <div className="pt-4 mt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-baseline space-x-1.5">
                          {pkg.originalPrice > pkg.pricePerPerson && (
                            <span className="text-xs text-gray-400 line-through">{formatPrice(pkg.originalPrice)}</span>
                          )}
                          <span className="text-2xl font-black text-gray-900">{formatPrice(pkg.pricePerPerson)}</span>
                          <span className="text-[11px] text-gray-500 font-normal">/ person*</span>
                        </div>
                        <span className="text-[10px] text-gray-500 block">
                          *Indicative starting price. Customizable package.
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setInspectPackage(pkg)}
                          className="px-4 py-2 border border-[#005cab] text-[#005cab] hover:bg-blue-50 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          View Itinerary
                        </button>
                        <button
                          onClick={() => handleBookPackage(pkg)}
                          className="px-5 py-2 bg-gradient-to-r from-[#005cab] to-[#008cff] hover:brightness-105 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm transition cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* ── DAY-WISE ITINERARY & DETAILS MODAL ── */}
      {inspectPackage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-start justify-between z-10">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold bg-blue-100 text-[#005cab] px-2 py-0.5 rounded">
                    {inspectPackage.packageId || 'Package'}
                  </span>
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {inspectPackage.durationStr}
                  </span>
                  <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {inspectPackage.region}
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mt-2">{inspectPackage.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Route: {inspectPackage.route || inspectPackage.destination}</p>
              </div>
              <button
                onClick={() => setInspectPackage(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Image & Key Amenities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <img
                  src={inspectPackage.images[0]}
                  alt={inspectPackage.title}
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div className="space-y-2 bg-gray-50 p-4 rounded-xl text-xs">
                  <h4 className="font-bold text-gray-800">Package Inclusions Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                    <div>
                      <span className="font-semibold block text-gray-800">Hotel Category:</span>
                      <span>{inspectPackage.hotelCategory}</span>
                    </div>
                    <div>
                      <span className="font-semibold block text-gray-800">Transfers:</span>
                      <span>{inspectPackage.transfers}</span>
                    </div>
                    <div>
                      <span className="font-semibold block text-gray-800">Meal Plan:</span>
                      <span>{inspectPackage.meals}</span>
                    </div>
                    <div>
                      <span className="font-semibold block text-gray-800">Sightseeing:</span>
                      <span>{inspectPackage.sightseeing}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day-Wise Itinerary */}
              <div>
                <h4 className="font-extrabold text-base text-gray-900 mb-3 flex items-center space-x-2">
                  <span className="material-symbols-outlined text-[#005cab]">calendar_month</span>
                  <span>Day-Wise Travel Itinerary</span>
                </h4>

                {loadingDetails ? (
                  <div className="p-8 text-center text-gray-500 text-xs">Loading day-wise itinerary...</div>
                ) : detailedPackage?.itineraries && detailedPackage.itineraries.length > 0 ? (
                  <div className="space-y-3">
                    {detailedPackage.itineraries.map((day) => (
                      <div key={day.day_number} className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="bg-[#005cab] text-white text-[11px] font-black px-2 py-0.5 rounded">
                            Day {day.day_number}
                          </span>
                          <span className="font-bold text-xs text-gray-900">{day.destination || inspectPackage.destination}</span>
                        </div>
                        <p className="text-xs text-gray-700 pl-1">{day.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-600 whitespace-pre-line">
                    {inspectPackage.rawPackage.day_wise_itinerary_text || inspectPackage.rawPackage.overview}
                  </div>
                )}
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-green-50/60 rounded-xl border border-green-200">
                  <h5 className="font-bold text-green-900 mb-2">Package Inclusions</h5>
                  <ul className="space-y-1 text-green-800 list-disc list-inside text-[11px]">
                    {inspectPackage.inclusions.map((inc, i) => (
                      <li key={i}>{inc}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-red-50/60 rounded-xl border border-red-200">
                  <h5 className="font-bold text-red-900 mb-2">Package Exclusions</h5>
                  <ul className="space-y-1 text-red-800 list-disc list-inside text-[11px]">
                    {inspectPackage.exclusions.length > 0 ? (
                      inspectPackage.exclusions.map((exc, i) => <li key={i}>{exc}</li>)
                    ) : (
                      <li>Airfare/train fare unless specified, personal expenses, optional activities.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Cancellation Policy */}
              {inspectPackage.cancellationPolicy && (
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
                  <span className="font-bold block text-gray-900 mb-1">Cancellation Policy:</span>
                  <span>{inspectPackage.cancellationPolicy}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 px-6 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-500 block">Indicative Starting Price</span>
                <span className="text-2xl font-black text-gray-900">{formatPrice(inspectPackage.pricePerPerson)}</span>
                <span className="text-xs text-gray-500"> / person</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setInspectPackage(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleBookPackage(inspectPackage);
                    setInspectPackage(null);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#005cab] to-[#008cff] text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm hover:brightness-105 transition cursor-pointer"
                >
                  Book This Package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
