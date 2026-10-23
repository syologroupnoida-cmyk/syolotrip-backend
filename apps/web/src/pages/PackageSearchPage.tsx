import React, { useState, useMemo } from 'react';
import { ScreenType } from '../components/Header';
import { WebCheckoutItem } from './BookingCheckoutPage';

interface PackageSearchPageProps {
  onNavigate?: (screen: ScreenType) => void;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
  destinationCity?: string;
}

interface HolidayPackage {
  id: string;
  title: string;
  destination: string;
  theme: 'BEACH' | 'HILLS' | 'INTERNATIONAL' | 'HONEYMOON' | 'HERITAGE';
  nights: number;
  days: number;
  itinerarySummary: string;
  rating: number;
  reviewsCount: number;
  images: string[];
  inclusions: string[];
  hotelStars: number;
  pricePerPerson: number;
  originalPrice: number;
  emiStartsAt: number;
  assuredBadge: string;
  highlights: string[];
}

export const PackageSearchPage: React.FC<PackageSearchPageProps> = ({
  onNavigate,
  onInitiateCheckout,
  destinationCity = 'Kerala Backwaters & Hills',
}) => {
  const [selectedTheme, setSelectedTheme] = useState<'ALL' | 'BEACH' | 'HILLS' | 'INTERNATIONAL' | 'HONEYMOON'>('ALL');
  const [flightsIncludedOnly, setFlightsIncludedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(45000);
  const [minHotelStars, setMinHotelStars] = useState(3);
  const [sortBy, setSortBy] = useState<'POPULAR' | 'CHEAPEST' | 'DURATION'>('POPULAR');

  const packages: HolidayPackage[] = useMemo(() => [
    {
      id: 'pkg-kerala-01',
      title: 'Scenic Kerala: Munnar Tea Valleys & Alleppey Houseboat',
      destination: 'Kerala, India',
      theme: 'HILLS',
      nights: 5,
      days: 6,
      itinerarySummary: '2N Munnar + 1N Thekkady + 1N Alleppey Houseboat + 1N Kochi',
      rating: 4.9,
      reviewsCount: 1840,
      images: [
        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80',
      ],
      inclusions: ['Roundtrip Flights', '4-Star Resorts', 'Private AC Sedan', 'Alleppey Deluxe Houseboat', 'Daily Breakfast & Dinner'],
      hotelStars: 4,
      pricePerPerson: 23999,
      originalPrice: 31999,
      emiStartsAt: 2000,
      assuredBadge: 'MMT Holiday Assured',
      highlights: ['Tea Garden Stroll & Factory Tour', 'Spices Plantation Walk', 'Sunset Houseboat Cruise in Vembanad Lake'],
    },
    {
      id: 'pkg-kashmir-02',
      title: 'Heaven On Earth: Srinagar, Gulmarg & Pahalgam Paradise',
      destination: 'Kashmir, India',
      theme: 'HILLS',
      nights: 5,
      days: 6,
      itinerarySummary: '2N Srinagar Dal Lake + 2N Pahalgam Valleys + 1N Gulmarg Snow',
      rating: 4.9,
      reviewsCount: 2250,
      images: [
        'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=400&q=80',
      ],
      inclusions: ['Flights Included', 'Heritage Houseboat Stay', 'Gulmarg Gondola Phase 1 Ticket', 'All Transfers', 'Breakfast & Dinner'],
      hotelStars: 4,
      pricePerPerson: 27500,
      originalPrice: 36000,
      emiStartsAt: 2290,
      assuredBadge: 'All Inclusions Guaranteed',
      highlights: ['Shikara Ride on Dal Lake', 'Betaab Valley & Aru Valley Tour', 'Gulmarg Snow Cable Car'],
    },
    {
      id: 'pkg-goa-03',
      title: 'Goa Coastal Bliss: Beachfront Resort & Sunset Catamaran',
      destination: 'Goa, India',
      theme: 'BEACH',
      nights: 3,
      days: 4,
      itinerarySummary: '3N Beachfront 5-Star Resort at Candolim Beach',
      rating: 4.8,
      reviewsCount: 3100,
      images: [
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
      ],
      inclusions: ['5-Star Beach Resort', 'Airport Transfers in AC Cab', 'Mandovi Luxury Sunset Cruise', 'Lavish Buffet Breakfast'],
      hotelStars: 5,
      pricePerPerson: 16999,
      originalPrice: 22500,
      emiStartsAt: 1415,
      assuredBadge: '5-Star Luxury Stays',
      highlights: ['Direct Beach Access', 'Complimentary Cocktails at Sunset', 'North & South Goa Sightseeing'],
    },
    {
      id: 'pkg-dubai-04',
      title: 'Dazzling Dubai & Abu Dhabi Grand Discovery',
      destination: 'Dubai & Abu Dhabi, UAE',
      theme: 'INTERNATIONAL',
      nights: 5,
      days: 6,
      itinerarySummary: '4N Dubai 4-Star Hotel + 1N Abu Dhabi Yas Island',
      rating: 4.9,
      reviewsCount: 1590,
      images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=400&q=80',
      ],
      inclusions: ['Flights & Express Tourist Visa', 'Burj Khalifa 124th Floor Entry', 'Desert Safari with BBQ Dinner', 'Dhow Marina Cruise'],
      hotelStars: 4,
      pricePerPerson: 38999,
      originalPrice: 48999,
      emiStartsAt: 3250,
      assuredBadge: 'Visa Guaranteed',
      highlights: ['At The Top Burj Khalifa', 'Dune Bashing & Belly Dance Show', 'Sheikh Zayed Grand Mosque Tour'],
    },
  ], []);

  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        if (selectedTheme !== 'ALL' && pkg.theme !== selectedTheme) return false;
        if (flightsIncludedOnly && !pkg.inclusions.some((inc) => inc.toLowerCase().includes('flight'))) return false;
        if (pkg.pricePerPerson > maxPrice) return false;
        if (pkg.hotelStars < minHotelStars) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'CHEAPEST') return a.pricePerPerson - b.pricePerPerson;
        if (sortBy === 'DURATION') return b.days - a.days;
        return b.reviewsCount - a.reviewsCount;
      });
  }, [packages, selectedTheme, flightsIncludedOnly, maxPrice, minHotelStars, sortBy]);

  const handleBookPackage = (pkg: HolidayPackage) => {
    if (onInitiateCheckout) {
      onInitiateCheckout({
        serviceType: 'PACKAGE',
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

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-[#191C1E] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ── TOP STICKY MODIFIER BAR (MMT STITCH DESIGN) ── */}
      <section className="sticky top-16 sm:top-[70px] z-30 bg-[#005cab] text-white shadow-md">
        <div className="max-w-[1240px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-amber-300 text-2xl">luggage</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-wide">{destinationCity}</span>
              </div>
              <p className="text-xs text-blue-100 flex items-center space-x-2">
                <span>Oct - Nov 2026</span>
                <span>·</span>
                <span>Customizable Itineraries</span>
                <span>·</span>
                <span className="bg-[#1A7F37] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">MMT Holiday Guarantee</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden md:inline-block text-xs bg-white/10 px-3 py-1.5 rounded-lg text-blue-100">
              ⚡ Up to 30% Off + Free Room Upgrades
            </span>
            <button
              onClick={() => onNavigate && onNavigate('explore')}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-1"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Change Destination</span>
            </button>
          </div>
        </div>

        {/* Theme Filter Strip */}
        <div className="bg-[#004785] border-t border-white/10 px-4 py-2">
          <div className="max-w-[1240px] mx-auto flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-blue-200 font-medium text-[11px] shrink-0 mr-1">Holiday Themes:</span>
            {[
              { id: 'ALL', label: 'All Packages' },
              { id: 'BEACH', label: '🏖️ Beach Escapes (Goa / Andaman)' },
              { id: 'HILLS', label: '🏔️ Hill Stations (Kashmir / Kerala)' },
              { id: 'INTERNATIONAL', label: '✈️ International (Dubai / Thailand)' },
              { id: 'HONEYMOON', label: '💍 Honeymoon Special' },
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id as any)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedTheme === theme.id
                    ? 'bg-white text-[#005cab] shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {theme.label}
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
                  <span>Filter Holidays</span>
                </h3>
                <button
                  onClick={() => {
                    setSelectedTheme('ALL');
                    setFlightsIncludedOnly(false);
                    setMaxPrice(45000);
                    setMinHotelStars(3);
                  }}
                  className="text-xs font-bold text-[#005cab] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Flights Included Filter */}
              <div className="mt-4 p-3 bg-blue-50/70 rounded-lg border border-blue-200">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flightsIncludedOnly}
                    onChange={(e) => setFlightsIncludedOnly(e.target.checked)}
                    className="accent-[#005cab] rounded"
                  />
                  <div>
                    <span className="text-xs font-black text-blue-900 block">Flights Included Only</span>
                    <span className="text-[10px] text-blue-800">Save up to 40% when booking bundled flights</span>
                  </div>
                </label>
              </div>

              {/* Hotel Star Rating */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 block mb-2">Hotel Category</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setMinHotelStars(star)}
                      className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer font-bold ${
                        minHotelStars === star
                          ? 'border-[#005cab] bg-blue-50 text-[#005cab]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {star} Star ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-700">Max Budget / Person</span>
                  <span className="text-xs font-extrabold text-[#005cab]">₹{maxPrice.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="50000"
                  step="2500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#005cab] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>₹15,000</span>
                  <span>₹50,000</span>
                </div>
              </div>

              {/* Package Promises */}
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
                <span className="font-bold text-gray-800 block">Why MakeMyTrip Holidays?</span>
                <div className="space-y-1.5 text-[11px] text-gray-600">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#1A7F37] font-bold">✓</span>
                    <span>100% Customized Itineraries</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#1A7F37] font-bold">✓</span>
                    <span>24x7 On-Trip Tour Support</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#1A7F37] font-bold">✓</span>
                    <span>Best Price & Quality Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT 9-COL PACKAGE RESULTS ── */}
          <section className="lg:col-span-9 space-y-5">
            {/* Sort Bar */}
            <div className="bg-white rounded-xl p-3 border border-[#E7EBF0] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-gray-700 font-bold">Showing {filteredPackages.length} Handcrafted Holiday Packages</span>

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

            {/* Package Cards */}
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-xl border border-[#E7EBF0] hover:border-[#005cab] hover:shadow-lg transition overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-12">
                  {/* Left Column: Image Collage */}
                  <div className="md:col-span-5 relative p-4 flex flex-col justify-between">
                    <div className="relative h-48 rounded-xl overflow-hidden shadow-xs mb-2">
                      <img
                        src={pkg.images[0]}
                        alt={pkg.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        {pkg.assuredBadge}
                      </span>
                      <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {pkg.days}D / {pkg.nights}N
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <img
                        src={pkg.images[1]}
                        alt="Preview 2"
                        className="w-full h-16 object-cover rounded-lg"
                      />
                      <img
                        src={pkg.images[2]}
                        alt="Preview 3"
                        className="w-full h-16 object-cover rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Right Column: Details & Pricing */}
                  <div className="md:col-span-7 p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100">
                    <div>
                      {/* Rating & Itinerary */}
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-[#1A7F37] text-white text-xs font-black px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                          <span>{pkg.rating}</span>
                          <span className="text-[10px]">★</span>
                        </span>
                        <span className="text-xs text-gray-500">({pkg.reviewsCount} reviews)</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {pkg.hotelStars} Star Hotel Experience
                        </span>
                      </div>

                      <h4 className="font-black text-lg text-gray-900 leading-snug">{pkg.title}</h4>
                      <p className="text-xs font-extrabold text-[#005cab] mt-1">{pkg.itinerarySummary}</p>

                      {/* Inclusions Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {pkg.inclusions.map((inc, i) => (
                          <span key={i} className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <span className="text-[#1A7F37]">✓</span>
                            <span>{inc}</span>
                          </span>
                        ))}
                      </div>

                      {/* Highlights */}
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <span className="text-[11px] font-bold text-gray-800 block mb-1">Trip Highlights:</span>
                        <ul className="text-[11px] text-gray-600 space-y-0.5 list-disc list-inside">
                          {pkg.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Pricing & Action */}
                    <div className="pt-4 mt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-xs text-gray-400 line-through">₹{pkg.originalPrice.toLocaleString('en-IN')}</span>
                          <span className="text-2xl font-black text-gray-900">₹{pkg.pricePerPerson.toLocaleString('en-IN')}</span>
                          <span className="text-[11px] text-gray-500 font-normal">/ person</span>
                        </div>
                        <span className="text-[10px] text-gray-500 block">
                          No Cost EMI starts at <strong className="text-gray-800">₹{pkg.emiStartsAt}/mo</strong>
                        </span>
                      </div>

                      <button
                        onClick={() => handleBookPackage(pkg)}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#005cab] to-[#008cff] hover:brightness-105 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm transition cursor-pointer"
                      >
                        Book Package
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};
