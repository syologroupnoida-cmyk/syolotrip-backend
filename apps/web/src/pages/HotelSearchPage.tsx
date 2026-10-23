import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchHotelsApi } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { ScreenType } from '../components/Header';
import { HotelSearchParams } from './ExplorePage';
import { WebCheckoutItem } from './BookingCheckoutPage';

interface HotelSearchPageProps {
  onNavigate?: (screen: ScreenType) => void;
  searchParams?: HotelSearchParams;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
}

export interface PropertyItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  ratingCategory: string;
  propertyType: string;
  mainImg: string;
  thumb1: string;
  thumb2: string;
  badge: string;
  badgeBg: string;
  features: string[];
  description: string;
  cancellation: string;
  originalPrice: number;
  price: number;
  taxes: number;
  amenities: string[];
}

export const HotelSearchPage: React.FC<HotelSearchPageProps> = ({
  onNavigate,
  searchParams,
  onInitiateCheckout,
}) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const city = searchParams?.city || 'Mumbai & Escapes';
  const checkIn = searchParams?.checkIn || '2026-10-24';
  const checkOut = searchParams?.checkOut || '2026-10-26';

  // Filters state
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string | null>('Private Pool');
  const [propertyTypes, setPropertyTypes] = useState<string[]>(['Entire Villa', 'Private Cottages', 'Luxury Farmhouse']);
  const [maxPrice, setMaxPrice] = useState(35000);
  const [minRating, setMinRating] = useState<number | null>(4.0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Private Pool']);
  const [sortBy, setSortBy] = useState('Popularity');

  // Stitch Mock Villas / Hotels Dataset
  const defaultProperties: PropertyItem[] = useMemo(() => [
    {
      id: 'villa-glass-house-lonavala',
      name: 'The Glass House by Vista Rooms - 4 BHK Private Pool Villa',
      location: 'Lonavala • 1.8 km from Tungarli Lake',
      rating: 4.8,
      reviews: 248,
      ratingCategory: 'Exceptional',
      propertyType: 'Entire Villa',
      mainImg: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
      thumb1: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80',
      thumb2: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80',
      badge: 'MMT VERIFIED LUXE',
      badgeBg: 'bg-[#1A7F37]',
      features: ['Private Heated Pool', 'Care-taker on site', 'Mountain View', 'Lawn with Bonfire & BBQ'],
      description: 'Accommodates up to 10 guests • 4 King Bedrooms • Full Kitchen with Chef Service • High-speed Starlink WiFi',
      cancellation: 'Free Cancellation till 22 Oct',
      originalPrice: 24000,
      price: 18500,
      taxes: 2400,
      amenities: ['Private Pool', 'Wi-Fi', 'Kitchen', 'AC', 'Lawn', 'BBQ', 'Power Backup'],
    },
    {
      id: 'villa-sea-breeze-alibaug',
      name: 'SaffronStays Sea Breeze Villa - Waterfront 3 BHK',
      location: 'Alibaug • 200m from Awas Beach',
      rating: 4.7,
      reviews: 182,
      ratingCategory: 'Exceptional',
      propertyType: 'Entire Villa',
      mainImg: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      thumb1: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80',
      thumb2: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80',
      badge: 'WATERFRONT',
      badgeBg: 'bg-[#0A58CA]',
      features: ['Direct Beach Access', 'Cook Available', 'Pet Friendly', 'Private Jacuzzi'],
      description: 'Fresh coastal seafood prepared by seasoned in-house cook • Private lawn with hammock • Ideal for family getaways',
      cancellation: 'Free Cancellation available',
      originalPrice: 19500,
      price: 15200,
      taxes: 1850,
      amenities: ['Private Pool', 'Wi-Fi', 'Cook', 'Beachfront', 'AC', 'Pet Friendly'],
    },
    {
      id: 'villa-bougainvillea-karjat',
      name: 'Bougainvillea Farmstay & Cottages',
      location: 'Karjat Hills • 12 km from Station',
      rating: 4.6,
      reviews: 310,
      ratingCategory: 'Very Good',
      propertyType: 'Luxury Farmhouse',
      mainImg: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
      thumb1: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
      thumb2: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
      badge: 'TOP RATED HOMESTAY',
      badgeBg: 'bg-[#1A7F37]',
      features: ['Organic Farm Tour', 'Plunge Pool', 'Farm-to-Table Meals', 'River Access'],
      description: 'Homecooked authentic Maharashtrian meals included • Forest trails • Pet-friendly • 2 Independent Cottages',
      cancellation: 'Special Offer: Meals Included',
      originalPrice: 9800,
      price: 7800,
      taxes: 950,
      amenities: ['Private Pool', 'Kitchen', 'Lawn', 'Pet Friendly'],
    },
    {
      id: 'villa-royal-palms-mumbai',
      name: 'Royal Palms Penthouse & Terrace Villa',
      location: 'Goregaon East, Mumbai Suburbs • Close to Film City',
      rating: 4.4,
      reviews: 95,
      ratingCategory: 'Very Good',
      propertyType: 'Heritage Bungalow',
      mainImg: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
      thumb1: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80',
      thumb2: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=400&q=80',
      badge: 'CITY GETAWAY',
      badgeBg: 'bg-[#525f71]',
      features: ['City Skyline View', 'Parties Allowed', 'Terrace Bar & Plunge Tub', 'Open Sundeck'],
      description: 'Ideal for celebrations, birthdays & friends get-together • Accommodates 8 guests • 3 BHK • Music allowed outdoors',
      cancellation: 'Free Cancellation till 24 hrs',
      originalPrice: 16000,
      price: 12500,
      taxes: 1500,
      amenities: ['Private Pool', 'Wi-Fi', 'AC', 'Parties Allowed', 'Bar'],
    },
  ], []);

  // Backend query fallback
  const { data: backendHotels } = useQuery({
    queryKey: ['hotelsSearch', city],
    queryFn: () => searchHotelsApi({ city }),
    staleTime: 60000,
  });

  // Filtered properties
  const filteredProperties = useMemo(() => {
    let list: PropertyItem[] = (backendHotels && backendHotels.length > 0) ? (backendHotels as any as PropertyItem[]) : [...defaultProperties];

    // Quick filter
    if (selectedQuickFilter === 'Private Pool') {
      list = list.filter((p) => p.amenities.includes('Private Pool'));
    } else if (selectedQuickFilter === 'Pet Friendly') {
      list = list.filter((p) => p.features.some((f: string) => f.includes('Pet')));
    } else if (selectedQuickFilter === 'Entire Villa') {
      list = list.filter((p) => p.propertyType === 'Entire Villa');
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      list = list.filter((p) => selectedAmenities.some((a) => p.amenities.includes(a)));
    }

    // Property type
    if (propertyTypes.length > 0) {
      list = list.filter((p) => propertyTypes.includes(p.propertyType));
    }

    // Price
    list = list.filter((p) => p.price <= maxPrice);

    // Rating
    if (minRating) {
      list = list.filter((p) => p.rating >= minRating);
    }

    // Sorting
    if (sortBy === 'Price: Low to High') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Top Rated Villas') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [defaultProperties, selectedQuickFilter, propertyTypes, maxPrice, minRating, sortBy]);

  const handleBookProperty = (prop: typeof defaultProperties[0]) => {
    const item: WebCheckoutItem = {
      serviceType: 'HOTEL',
      title: prop.name,
      subtitle: `${prop.location} · ${prop.propertyType}`,
      routeInfo: `Check-in: ${checkIn} | Check-out: ${checkOut} (2 Nights)`,
      pricing: {
        baseAmount: prop.price * 2,
        taxes: prop.taxes * 2,
        discount: 1000,
        insurance: 199,
      },
      details: {
        hotelId: prop.id,
        roomType: 'Entire Villa / 4 BHK',
        guests: '4 Guests',
      },
    };

    if (onInitiateCheckout) {
      onInitiateCheckout(item);
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-[#1b1c1c] font-sans pb-20">
      {/* ── TOP STICKY SEARCH MODIFIER BAR (Stitch Exact Replica) ── */}
      <section className="sticky top-16 sm:top-[70px] z-30 bg-white shadow-xs border-b border-[#E7EBF0]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F2F4F8] p-3 rounded-xl border border-[#E7EBF0]">
            {/* City / Destination */}
            <div className="flex items-center space-x-2.5 flex-1 min-w-[220px]">
              <span className="text-xl text-[#008cff]">🏡</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">City / Region</span>
                <span className="text-sm font-bold text-gray-900 truncate">
                  {city} (Lonavala, Alibaug, Karjat)
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-300 hidden md:block" />

            {/* Dates */}
            <div className="flex items-center space-x-2.5 flex-1 min-w-[200px]">
              <span className="text-xl text-[#008cff]">📅</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dates (2 Nights)</span>
                <span className="text-xs font-bold text-gray-900">
                  {checkIn} - {checkOut}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-300 hidden md:block" />

            {/* Guests & Rooms */}
            <div className="flex items-center space-x-2.5 flex-1 min-w-[180px]">
              <span className="text-xl text-[#008cff]">👥</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Guests & Stays</span>
                <span className="text-xs font-bold text-gray-900">
                  4 Guests, 1 Villa / Cottage
                </span>
              </div>
            </div>

            {/* Update Search Button */}
            <button
              onClick={() => onNavigate && onNavigate('explore')}
              className="bg-[#005cab] hover:bg-[#0A58CA] text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm transition active:scale-95 whitespace-nowrap"
            >
              UPDATE SEARCH
            </button>
          </div>

          {/* Quick Filter Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Quick:</span>
            {[
              { id: 'Private Pool', icon: '🏊‍♂️', label: 'Private Pool' },
              { id: 'Entire Villa', icon: '🏡', label: 'Entire Villa' },
              { id: 'Pet Friendly', icon: '🐾', label: 'Pet Friendly' },
              { id: 'Caretaker', icon: '👨‍🍳', label: 'Caretaker on-site' },
              { id: 'Cook Available', icon: '🍳', label: 'Cook Available' },
              { id: 'Beachfront', icon: '🌊', label: 'Beachfront / Lakeview' },
              { id: 'Free Cancel', icon: '✔', label: 'Free Cancellation' },
            ].map((qp) => {
              const active = selectedQuickFilter === qp.id;
              return (
                <button
                  key={qp.id}
                  type="button"
                  onClick={() => setSelectedQuickFilter(active ? null : qp.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? 'bg-[#005cab] text-white shadow-xs'
                      : 'bg-[#F2F4F8] hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <span>{qp.icon}</span>
                  <span>{qp.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT (12-COLUMN STITCH LAYOUT) ── */}
      <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT FILTERS SIDEBAR (3 Cols) ── */}
          <aside className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#E7EBF0] flex flex-col gap-5 sticky top-52">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-bold text-base text-gray-900">Filters</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedQuickFilter(null);
                  setPropertyTypes(['Entire Villa', 'Private Cottages']);
                  setMaxPrice(35000);
                  setMinRating(null);
                }}
                className="text-xs font-bold text-[#008cff] hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Property Type */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Property Type</span>
              {[
                { name: 'Entire Villa', count: 142 },
                { name: 'Private Cottages', count: 58 },
                { name: 'Luxury Farmhouse', count: 34 },
                { name: 'Heritage Bungalow', count: 19 },
              ].map((pt) => {
                const checked = propertyTypes.includes(pt.name);
                return (
                  <label key={pt.name} className="flex items-center justify-between text-xs text-gray-800 hover:text-black cursor-pointer py-0.5">
                    <span className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setPropertyTypes(prev => checked ? prev.filter(x => x !== pt.name) : [...prev, pt.name]);
                        }}
                        className="rounded text-[#008cff] h-4 w-4"
                      />
                      <span>{pt.name}</span>
                    </span>
                    <span className="text-gray-400">{pt.count}</span>
                  </label>
                );
              })}
            </div>

            {/* Price Per Night */}
            <div className="flex flex-col gap-2 p-3 bg-[#F2F4F8] rounded-xl border border-gray-200">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-600 uppercase text-[10px] tracking-wider">Price per night</span>
                <span className="text-[#008cff] font-bold">Up to ₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="4500"
                max="45000"
                step="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#008cff] cursor-pointer h-1.5 bg-gray-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                <span>₹4,500</span>
                <span>₹45,000+</span>
              </div>
            </div>

            {/* Guest Ratings */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Guest Ratings</span>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {[
                  { label: '4.5+ Exceptional', min: 4.5, count: 98 },
                  { label: '4.0+ Very Good', min: 4.0, count: 144 },
                  { label: '3.5+ Good', min: 3.5, count: 172 },
                ].map((gr) => (
                  <button
                    key={gr.label}
                    type="button"
                    onClick={() => setMinRating(minRating === gr.min ? null : gr.min)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left transition ${
                      minRating === gr.min
                        ? 'bg-[#d5e3ff] text-[#001c3b] ring-1 ring-[#005cab]'
                        : 'bg-[#F2F4F8] hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <span className="font-semibold">{gr.label}</span>
                    <span className="bg-[#1A7F37] text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
                      {gr.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Key Amenities */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Key Amenities</span>
              {[
                'Private Swimming Pool',
                'Wi-Fi & Work Desk',
                'Kitchen / Cook on call',
                'Air Conditioning (All Rooms)',
                'Lawn / Private Garden',
                'BBQ Facility',
                '100% Power Backup',
              ].map((am) => (
                <label key={am} className="flex items-center space-x-2 text-xs text-gray-800 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(am)}
                    onChange={() => {
                      setSelectedAmenities(prev =>
                        prev.includes(am) ? prev.filter(a => a !== am) : [...prev, am]
                      );
                    }}
                    className="rounded text-[#008cff] h-4 w-4"
                  />
                  <span>{am}</span>
                </label>
              ))}
            </div>

            {/* House Rules */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">House Rules</span>
              {[
                'Couples Friendly',
                'Pets Allowed',
                'Bachelor Parties Allowed',
                'Smoking Allowed Outdoors',
              ].map((rule) => (
                <label key={rule} className="flex items-center space-x-2 text-xs text-gray-800 cursor-pointer py-0.5">
                  <input type="checkbox" className="rounded text-[#008cff] h-4 w-4" />
                  <span>{rule}</span>
                </label>
              ))}
            </div>
          </aside>

          {/* ── RIGHT LISTINGS CONTENT (9 Cols) ── */}
          <main className="lg:col-span-9 flex flex-col gap-4">
            {/* Header & Sorting */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-[#E7EBF0]">
              <div>
                <h1 className="text-lg font-black text-gray-900 leading-tight">
                  Homestays & Villas in {city}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {filteredProperties.length} curated luxury holiday properties available
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 font-semibold whitespace-nowrap">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#F2F4F8] text-gray-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none border border-gray-200"
                >
                  <option value="Popularity">Popularity</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Top Rated Villas">Top Rated Villas</option>
                </select>
              </div>
            </div>

            {/* Luxe Collection Signature Guarantee Banner */}
            <div className="bg-gradient-to-r from-[#005cab] to-[#0A58CA] rounded-2xl p-5 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  👑
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                    Signature Guarantee
                  </span>
                  <h2 className="text-base font-bold text-white">
                    MMT Homestays Luxe Collection
                  </h2>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Handpicked luxury private stays with 100% verified amenities & private pools
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="hidden sm:inline-block bg-white text-[#005cab] px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition shadow-xs shrink-0"
              >
                Explore Luxe
              </button>
            </div>

            {/* Properties List */}
            {filteredProperties.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-xs">
                <p className="text-base font-bold text-gray-800">No properties match your filters</p>
                <p className="text-xs text-gray-500 mt-1">Try increasing max budget or clearing filters.</p>
              </div>
            ) : (
              filteredProperties.map((prop) => {
                const wishlisted = isWishlisted(prop.id);
                return (
                  <article
                    key={prop.id}
                    className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col md:flex-row gap-5 border border-[#E7EBF0]"
                  >
                    {/* Image Collage (3 Images) */}
                    <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-2">
                      <div className="relative h-48 w-full rounded-xl overflow-hidden shadow-xs">
                        <img
                          src={prop.mainImg}
                          alt={prop.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                        <span className={`absolute top-2.5 left-2.5 ${prop.badgeBg} text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider`}>
                          {prop.badge}
                        </span>

                        {/* Heart Wishlist Trigger */}
                        <button
                          type="button"
                          onClick={() => toggleWishlist({
                            id: prop.id,
                            category: 'HOTEL',
                            title: prop.name,
                            location: prop.location,
                            price: prop.price,
                            image: prop.mainImg,
                            rating: prop.rating,
                          })}
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition cursor-pointer"
                        >
                          <span className={`text-base ${wishlisted ? 'text-rose-500' : 'text-white'}`}>
                            {wishlisted ? '❤️' : '🤍'}
                          </span>
                        </button>
                      </div>

                      {/* 2 Thumbnails */}
                      <div className="grid grid-cols-2 gap-2 h-16">
                        <img
                          src={prop.thumb1}
                          alt="Interior view"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <img
                          src={prop.thumb2}
                          alt="Bedroom view"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Villa Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold text-gray-900 hover:text-[#008cff] cursor-pointer transition">
                              {prop.name}
                            </h3>
                            <div className="flex items-center space-x-1 text-gray-500 text-xs mt-0.5">
                              <span className="text-[#008cff]">📍</span>
                              <span>{prop.location}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 bg-[#E8F5E9] px-2 py-1 rounded-xl shrink-0">
                            <div className="flex flex-col text-right">
                              <span className="text-xs font-black text-[#1A7F37]">{prop.rating} / 5</span>
                              <span className="text-[10px] text-[#1A7F37] font-semibold">{prop.reviews} Reviews</span>
                            </div>
                          </div>
                        </div>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {prop.features.map((feat: string, i: number) => (
                            <span key={i} className="bg-[#F2F4F8] text-gray-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                              {feat}
                            </span>
                          ))}
                        </div>

                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {prop.description}
                        </p>
                      </div>

                      {/* Price & CTA */}
                      <div className="flex items-end justify-between pt-3 mt-2 border-t border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#1A7F37] font-bold">
                            ✔ {prop.cancellation}
                          </span>
                          <div className="flex items-baseline space-x-1.5 mt-0.5">
                            <span className="text-xs text-gray-400 line-through">₹{prop.originalPrice.toLocaleString('en-IN')}</span>
                            <span className="text-2xl font-black text-gray-900">₹{prop.price.toLocaleString('en-IN')}</span>
                            <span className="text-xs text-gray-500 font-semibold">/ night</span>
                          </div>
                          <span className="text-[10px] text-gray-400">+ ₹{prop.taxes.toLocaleString('en-IN')} taxes & fees</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleBookProperty(prop)}
                          className="bg-[#005cab] hover:bg-[#0A58CA] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition transform active:scale-95"
                        >
                          VIEW VILLA & ROOMS
                        </button>
                      </div>
                    </div>
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
