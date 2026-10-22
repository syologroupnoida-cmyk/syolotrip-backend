import React from 'react';
import { useWishlist, WishlistItem } from '../context/WishlistContext';
import { WebCheckoutItem } from '../pages/BookingCheckoutPage';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
  onExplore?: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  onInitiateCheckout,
  onExplore,
}) => {
  const { wishlist, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();

  if (!isOpen) return null;

  const handleBookItem = (item: WishlistItem) => {
    onClose();
    if (onInitiateCheckout) {
      let serviceType: WebCheckoutItem['serviceType'] = 'HOTEL';
      if (item.category === 'FLIGHT') serviceType = 'FLIGHT';
      else if (item.category === 'PACKAGE') serviceType = 'PACKAGE';
      else if (item.category === 'VILLA') serviceType = 'HOTEL';
      else if (item.category === 'TOUR') serviceType = 'ACTIVITY';
      else if (item.category === 'TRAIN') serviceType = 'TRAIN';
      else if (item.category === 'BUS') serviceType = 'BUS';

      onInitiateCheckout({
        serviceType,
        itemId: item.id,
        title: item.title,
        subtitle: item.location,
        pricing: {
          baseAmount: item.price,
          taxes: Math.round(item.price * 0.08),
          discount: Math.round(item.price * 0.05),
        },
        badge: item.badge,
        dates: 'Instant Confirmation Booking',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer (Right Side) */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-blue-50/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#071426] flex items-center gap-2">
                  My Wishlist &amp; Liked
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Saved packages, villas &amp; deals for your next adventure
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {wishlist.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-300 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[32px]">favorite_border</span>
                </div>
                <h4 className="text-sm font-bold text-gray-800">Your wishlist is empty</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Tap the heart icon on any villa, package, tour, or hotel to save it here for fast booking later.
                </p>
                {onExplore && (
                  <button
                    onClick={() => {
                      onClose();
                      onExplore();
                    }}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-[#008cff] hover:bg-[#0070cc] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
                  >
                    Explore Destinations
                  </button>
                )}
              </div>
            ) : (
              wishlist.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white border border-gray-100 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all flex gap-3.5 items-center hover:border-blue-200"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.badge && (
                      <span className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[8px] font-black px-1.5 py-0.5 rounded-xs tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold text-blue-600 tracking-wider uppercase">
                        {item.category}
                      </span>
                      {item.rating && (
                        <div className="flex items-center space-x-1 text-[11px] font-extrabold text-amber-500">
                          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            star
                          </span>
                          <span>{item.rating}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-gray-900 truncate mt-0.5" title={item.title}>
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[12px] text-gray-400">location_on</span>
                      {item.location}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50">
                      <div>
                        <span className="text-[10px] text-gray-400 font-medium">Starts from</span>
                        <p className="text-xs font-black text-[#071426]">
                          ₹{item.price.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Remove */}
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>

                        {/* Book Now */}
                        <button
                          onClick={() => handleBookItem(item)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#008cff] to-[#005cab] text-white text-[11px] font-bold shadow-xs hover:brightness-110 transition cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {wishlist.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
              <button
                onClick={clearWishlist}
                className="text-xs font-semibold text-gray-400 hover:text-rose-600 transition cursor-pointer"
              >
                Clear All
              </button>
              <span className="text-[11px] text-gray-400">
                {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
