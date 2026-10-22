import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchHotelsApi } from '../services/api';
import { useWishlist } from '../context/WishlistContext';

// ─── Fallback Mock Data ──────────────────────────────────
const fallbackHotels = [
  {
    id: 1,
    name: 'Le Grand Hôtel du Palais Royal',
    location: '1st Arrondissement · 0.3 km to Louvre Museum',
    rating: 9.4,
    ratingLabel: 'Exceptional',
    reviews: 1284,
    price: 28200,
    originalPrice: 33400,
    perNight: true,
    stars: 5,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0E7RHXytjncZWInVu6Jq1inHh-1PungrJj2Yv_ETg17I3Vdx3cR5Z7ZTi2m4DDgb5GqvXyA7PbaAEK-uwhm2d-Q_aZ2qYCIwfI2VI1WUoRx-FDwvXPuA42b1Dp2YpYykOhxVDLALrn8zE9hAB65y3O2vcgR6qBucn3zVbsXWxhsw1W7PxBliKjK8VuZkGaANoDpBWRxSK_6WfetLziszlKj_o_2uGIPgxlJ6omW82YtShD3anwuq6',
    amenities: ['Free Breakfast', 'Pool', 'Spa', 'Wifi', 'Gym'],
    tags: ['Free Cancellation', 'Pay at Property'],
    featured: true,
  },
  {
    id: 2,
    name: 'Hôtel Plaza Athénée',
    location: 'Champs-Élysées · 0.5 km to Arc de Triomphe',
    rating: 9.1,
    ratingLabel: 'Wonderful',
    reviews: 892,
    price: 47800,
    originalPrice: null,
    perNight: true,
    stars: 5,
    img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80',
    amenities: ['Free Breakfast', 'Spa', 'Wifi', 'Concierge'],
    tags: ['Members Only Rate'],
    featured: false,
  },
  {
    id: 3,
    name: 'Citadines Saint-Germain-des-Prés',
    location: 'Saint-Germain · 0.2 km to Notre-Dame',
    rating: 8.7,
    ratingLabel: 'Excellent',
    reviews: 2156,
    price: 13850,
    originalPrice: 16100,
    perNight: true,
    stars: 4,
    img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
    amenities: ['Wifi', 'Kitchen', 'Laundry'],
    tags: ['Free Cancellation', 'Great for Families'],
    featured: false,
  },
  {
    id: 4,
    name: 'The Hoxton, Paris',
    location: 'Le Marais · 0.4 km to Place des Vosges',
    rating: 8.9,
    ratingLabel: 'Excellent',
    reviews: 1567,
    price: 18500,
    originalPrice: 21400,
    perNight: true,
    stars: 4,
    img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
    amenities: ['Restaurant', 'Bar', 'Wifi', 'Gym'],
    tags: ['Boutique', 'Design Hotel'],
    featured: false,
  },
  {
    id: 5,
    name: 'Maison Souquet',
    location: 'Montmartre · 0.3 km to Moulin Rouge',
    rating: 9.6,
    ratingLabel: 'Exceptional',
    reviews: 438,
    price: 40200,
    originalPrice: 45200,
    perNight: true,
    stars: 5,
    img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
    amenities: ['Spa', 'Pool', 'Wifi', 'Room Service'],
    tags: ['Adults Only', 'Romantic'],
    featured: false,
  },
];

const hotelFilterOptions = [
  { label: 'Star Rating', options: ['5 Stars', '4 Stars', '3 Stars', '2 Stars'] },
  { label: 'Guest Rating', options: ['Exceptional (9+)', 'Excellent (8+)', 'Very Good (7+)'] },
  { label: 'Amenities', options: ['Free Breakfast', 'Pool', 'Spa', 'Free Wifi', 'Gym', 'Restaurant'] },
  { label: 'Property Type', options: ['Hotel', 'Apartment', 'Hostel', 'Villa', 'Boutique'] },
];

const sortOptions = ['Recommended', 'Price (Low)', 'Price (High)', 'Guest Rating', 'Distance'];

import type { HotelSearchParams } from './ExplorePage';

interface HotelSearchPageProps {
  onNavigate?: (screen: 'explore' | 'flights' | 'hotels' | 'checkout' | 'trips') => void;
  searchParams?: HotelSearchParams;
}

// ─── Component ───────────────────────────────────────────
export const HotelSearchPage: React.FC<HotelSearchPageProps> = ({ 
  onNavigate,
  searchParams,
}) => {
  const [activeSort, setActiveSort] = useState('Recommended');
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [priceLimit, setPriceLimit] = useState(50000);
  const [showAllHotels, setShowAllHotels] = useState(false);

  const city = searchParams?.city || 'Paris';

  const { data: apiHotels, isLoading } = useQuery({
    queryKey: ['hotelsSearch', city],
    queryFn: async () => {
      let hotels = await searchHotelsApi({ city });
      if (!hotels || hotels.length === 0) {
        hotels = await searchHotelsApi();
      }
      return hotels;
    },
  });

  const baseHotels = (apiHotels && apiHotels.length > 0)
    ? apiHotels.map((h: any) => ({
        id: h.id,
        name: h.name,
        location: `${h.neighborhood || h.city} · ${h.address}`,
        rating: h.guest_rating || 9.0,
        ratingLabel: h.rating_label || 'Exceptional',
        reviews: h.review_count || 1200,
        price: h.starting_price,
        originalPrice: Math.round(h.starting_price * 1.15),
        perNight: true,
        stars: h.star_rating,
        img: h.featured_image,
        amenities: h.amenities?.length ? h.amenities : ['Free Breakfast', 'Wifi'],
        tags: h.tags?.length ? h.tags : ['Free Cancellation'],
        featured: h.featured,
      }))
    : fallbackHotels;

  // Filter based on selected chips & price range
  const displayHotels = baseHotels.filter(h => {
    if (h.price > priceLimit) return false;
    if (selectedChips.includes('Free Cancellation') && !h.tags.includes('Free Cancellation')) return false;
    if (selectedChips.includes('Breakfast Included') && !h.amenities.includes('Free Breakfast')) return false;
    if (selectedChips.includes('Pool') && !h.amenities.includes('Pool')) return false;
    if (selectedChips.includes('4+ Stars') && h.stars < 4) return false;
    if (selectedChips.includes('Under ₹15,000') && h.price >= 15000) return false;
    return true;
  });

  const toggleChip = (chip: string) => {
    setSelectedChips(prev => 
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  return (
    <div className="w-full bg-background">
      {/* ── Search Summary ── */}
      <section className="bg-primary text-on-primary">
        <div className="max-w-[1280px] mx-auto px-gutter py-space-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-md flex-wrap">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[24px]">location_on</span>
                <div>
                  <span className="text-headline-sm font-bold">{city}</span>
                  <span className="text-body-sm text-primary-fixed block">All Properties · Verified Availability</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs text-label-md text-primary-fixed">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>{searchParams?.checkIn ? new Date(searchParams.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Nov 04'} {searchParams?.checkOut ? `- ${new Date(searchParams.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                <span className="mx-1">·</span>
                <span>2 Guests</span>
                <span className="mx-1">·</span>
                <span>1 Room</span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate?.('explore')}
              className="flex items-center gap-space-xs bg-white/15 hover:bg-white/25 backdrop-blur-md px-space-md py-space-sm rounded-lg text-label-lg transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Modify Search</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Map Toggle & Quick Filters ── */}
      <section className="bg-surface-container-low border-b border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-gutter py-space-sm">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs overflow-x-auto">
              {['Free Cancellation', 'Breakfast Included', 'Pool', '4+ Stars', 'Under ₹15,000'].map(chip => {
                const isActive = selectedChips.includes(chip);
                return (
                  <button 
                    key={chip} 
                    type="button"
                    onClick={() => toggleChip(chip)}
                    className={`text-label-md px-space-md py-space-xs rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? 'bg-primary text-white border-primary font-bold shadow-xs' 
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    {isActive ? `✓ ${chip}` : chip}
                  </button>
                );
              })}
            </div>
            <button 
              type="button"
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-space-xs border px-space-md py-space-xs rounded-lg text-label-lg transition-colors whitespace-nowrap cursor-pointer ${
                showMap 
                  ? 'bg-primary text-white border-primary font-bold' 
                  : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Map View */}
      {showMap && (
        <section className="max-w-[1280px] mx-auto px-gutter pt-6 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">map</span>
                <h3 className="text-headline-sm font-bold text-on-surface">Interactive Map: {city} Stays</h3>
              </div>
              <button 
                onClick={() => setShowMap(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="relative h-64 bg-blue-900/10 rounded-xl overflow-hidden flex items-center justify-center border border-primary/20">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="z-10 flex flex-wrap gap-4 items-center justify-center p-4">
                {displayHotels.slice(0, 4).map(h => (
                  <div key={h.id} className="bg-surface-container-lowest shadow-float border border-primary/40 rounded-xl p-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">hotel</span>
                    <div>
                      <div className="font-bold text-label-md text-on-surface">{h.name}</div>
                      <div className="text-primary font-bold text-label-sm">₹{h.price.toLocaleString('en-IN')}/night</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Main Content: Sidebar + Hotel Results ── */}
      <div className="max-w-[1280px] mx-auto px-gutter py-space-lg">
        <div className="flex gap-space-lg">
          {/* ── LEFT SIDEBAR ── */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <h3 className="text-headline-sm text-on-surface font-bold">Filters</h3>
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedChips([]);
                    setPriceLimit(50000);
                    setActiveSort('Recommended');
                  }}
                  className="text-label-md text-primary hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              </div>

              {/* Price Range Slider */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card">
                <h4 className="text-label-lg text-on-surface font-bold mb-space-sm">Price per night</h4>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="text-body-sm text-on-surface-variant tabular-nums">₹5,000</span>
                  <span className="text-body-sm text-on-surface-variant tabular-nums font-bold text-primary">Up to ₹{priceLimit.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range" 
                  min="5000" 
                  max="50000" 
                  step="1000"
                  value={priceLimit}
                  onChange={(e) => setPriceLimit(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer" 
                />
                <p className="text-label-sm text-on-surface-variant mt-space-xs">Avg. ₹18,500/night in this area</p>
              </div>

              {hotelFilterOptions.map((filter, fi) => (
                <div key={fi} className="bg-surface-container-lowest rounded-xl p-space-md shadow-card">
                  <h4 className="text-label-lg text-on-surface font-bold mb-space-sm">{filter.label}</h4>
                  <div className="flex flex-col gap-space-xs">
                    {filter.options.map((opt, oi) => (
                      <label key={oi} className="flex items-center gap-space-sm cursor-pointer hover:text-primary transition-colors">
                        <input type="checkbox" className="accent-primary rounded w-4 h-4 cursor-pointer" />
                        <span className="text-body-sm text-on-surface-variant">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ── RIGHT RESULTS ── */}
          <div className="flex-1 flex flex-col gap-space-md">
            {/* Sort Bar */}
            <div className="flex items-center justify-between flex-wrap gap-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="text-label-lg text-on-surface font-bold">{displayHotels.length} properties found</span>
                <span className="text-body-sm text-on-surface-variant">· Prices include taxes</span>
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

            {/* Hotel Result Cards */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 bg-surface-container-lowest rounded-xl shadow-card">
                <span className="material-symbols-outlined animate-spin text-[36px] text-primary">progress_activity</span>
                <span className="text-body-md text-on-surface font-semibold">Finding properties in {city}...</span>
              </div>
            ) : (
              displayHotels.map(hotel => (
                <div key={hotel.id} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-card card-hover group flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="relative w-full md:w-80 h-60 md:h-auto flex-shrink-0 overflow-hidden">
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={hotel.img} alt={hotel.name} />
                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      toggleWishlist({
                        id: String(hotel.id),
                        title: hotel.name,
                        category: 'HOTEL',
                        location: hotel.location,
                        price: hotel.price,
                        rating: hotel.rating,
                        image: hotel.img,
                        badge: hotel.featured ? "Editor's Choice" : undefined,
                      }); 
                    }}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all shadow-md cursor-pointer hover:scale-110 active:scale-95"
                    title={isWishlisted(String(hotel.id)) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <span 
                      className={`material-symbols-outlined text-[20px] transition-colors ${isWishlisted(String(hotel.id)) ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}
                      style={isWishlisted(String(hotel.id)) ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      favorite
                    </span>
                  </button>
                  {hotel.featured && (
                    <span className="absolute top-space-sm left-space-sm bg-secondary-container text-on-secondary px-space-sm py-1 rounded-full text-label-sm font-bold">
                      Editor's Choice
                    </span>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 p-space-md flex flex-col justify-between">
                  <div className="flex flex-col gap-space-xs">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: hotel.stars }).map((_, si) => (
                        <span key={si} className="material-symbols-outlined text-secondary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                      <span className="text-label-sm text-on-surface-variant ml-space-xs">{hotel.stars}-star hotel</span>
                    </div>

                    <h3 className="text-headline-sm text-on-surface font-bold">{hotel.name}</h3>
                    <div className="flex items-center gap-space-xs text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span>{hotel.location}</span>
                    </div>

                    {/* Amenities */}
                    <div className="flex items-center gap-space-xs flex-wrap mt-space-xs">
                      {(hotel.amenities || []).map((a: string, ai: number) => (
                        <span key={ai} className="bg-surface-container text-on-surface-variant text-label-sm px-space-sm py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">
                            {a === 'Free Breakfast' ? 'restaurant' : a === 'Pool' ? 'pool' : a === 'Spa' ? 'spa' : a === 'Wifi' ? 'wifi' : a === 'Gym' ? 'fitness_center' : a === 'Kitchen' ? 'kitchen' : a === 'Laundry' ? 'local_laundry_service' : a === 'Restaurant' ? 'restaurant_menu' : a === 'Bar' ? 'local_bar' : a === 'Room Service' ? 'room_service' : a === 'Concierge' ? 'support_agent' : 'check'}
                          </span>
                          {a}
                        </span>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-space-xs flex-wrap mt-space-xs">
                      {(hotel.tags || []).map((tag: string, ti: number) => (
                        <span key={ti} className={`text-label-sm px-space-sm py-0.5 rounded-full font-bold ${
                          tag === 'Free Cancellation' ? 'bg-tertiary/10 text-tertiary'
                          : tag === 'Pay at Property' ? 'bg-primary/10 text-primary'
                          : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {tag === 'Free Cancellation' && <span className="material-symbols-outlined text-[10px] mr-0.5 align-middle">check_circle</span>}
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom: Rating + Price */}
                  <div className="flex items-end justify-between mt-space-md pt-space-sm border-t border-outline-variant/20">
                    {/* Rating */}
                    <div className="flex items-center gap-space-sm">
                      <span className="bg-tertiary text-on-tertiary px-space-sm py-space-xs rounded-lg text-label-lg font-bold tabular-nums">
                        {hotel.rating}
                      </span>
                      <div>
                        <span className="text-label-lg text-on-surface font-bold">{hotel.ratingLabel}</span>
                        <span className="text-label-sm text-on-surface-variant block">{hotel.reviews.toLocaleString()} reviews</span>
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex flex-col items-end gap-space-xs">
                      <div className="flex items-baseline gap-space-xs">
                        {hotel.originalPrice && (
                          <span className="text-body-sm text-on-surface-variant line-through tabular-nums">₹{hotel.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                        <span className="text-headline-md text-on-surface font-bold tabular-nums">₹{hotel.price.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-label-sm text-on-surface-variant">per night · incl. taxes</span>
                      <button 
                        onClick={() => onNavigate?.('checkout')}
                        className="bg-secondary-container hover:bg-secondary text-on-secondary px-space-lg py-space-sm rounded-lg text-label-lg font-bold transition-all shadow-sm flex items-center gap-space-xs"
                      >
                        <span>View Rooms</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )))}

            {/* Load More */}
            <div className="flex justify-center pt-space-md">
              <button 
                type="button"
                onClick={() => {
                  setShowAllHotels(true);
                  alert(`Showing all verified properties in ${city}. All available options are loaded.`);
                }}
                className="text-label-lg text-primary hover:text-primary-container flex items-center gap-space-xs transition-colors cursor-pointer"
              >
                <span>{showAllHotels ? 'All hotels displayed' : 'Show more hotels'}</span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
