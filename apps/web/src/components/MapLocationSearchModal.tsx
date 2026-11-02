import React, { useState, useEffect, useRef } from 'react';
import { searchPlacesApi, reverseGeocodeApi, MapPlaceResult } from '../services/api';

export interface MapLocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'pickup' | 'drop';
  currentValue?: string;
  defaultCity?: string;
  onSelectLocation: (place: { name: string; address: string; lat?: number; lon?: number; city?: string }) => void;
}

export const MapLocationSearchModal: React.FC<MapLocationSearchModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
  currentValue = '',
  defaultCity = 'Delhi',
  onSelectLocation,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MapPlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [activeCityTab, setActiveCityTab] = useState<string>(defaultCity);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setGpsError(null);
      // Fetch initial hubs for the active city
      loadInitialPlaces(activeCityTab);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeCityTab]);

  const loadInitialPlaces = async (cityName: string) => {
    setIsLoading(true);
    try {
      const places = await searchPlacesApi(cityName);
      setResults(places);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim()) {
      loadInitialPlaces(activeCityTab);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const places = await searchPlacesApi(query);
        setResults(places);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // "Use My Current Location" via Browser Geolocation API + Reverse Geocoding
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const place = await reverseGeocodeApi(latitude, longitude);

          if (place) {
            onSelectLocation({
              name: place.name,
              address: place.formatted_address,
              lat: place.lat,
              lon: place.lon,
              city: place.city,
            });
            onClose();
          } else {
            onSelectLocation({
              name: `GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              address: `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`,
              lat: latitude,
              lon: longitude,
            });
            onClose();
          }
        } catch {
          setGpsError('Could not resolve address from GPS coordinates.');
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        setIsDetectingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please allow location access in your browser or search manually.');
        } else {
          setGpsError('Unable to detect location. Please search address manually.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AIRPORT':
        return { icon: 'flight_takeoff', bg: 'bg-blue-100 text-blue-700' };
      case 'STATION':
        return { icon: 'directions_subway', bg: 'bg-emerald-100 text-emerald-700' };
      case 'HOTEL':
        return { icon: 'hotel', bg: 'bg-amber-100 text-amber-700' };
      case 'LANDMARK':
        return { icon: 'account_balance', bg: 'bg-purple-100 text-purple-700' };
      case 'LOCALITY':
        return { icon: 'location_city', bg: 'bg-cyan-100 text-cyan-700' };
      default:
        return { icon: 'pin_drop', bg: 'bg-gray-100 text-gray-700' };
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
              type === 'pickup' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {type === 'pickup' ? 'my_location' : 'location_on'}
              </span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{title}</h3>
              <p className="text-[11px] text-gray-500">
                {currentValue ? (
                  <>Current selection: <strong className="text-gray-700">{currentValue}</strong></>
                ) : (
                  'Powered by Live Map API & OpenStreetMap Places'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
              search
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search airport, train station, hotel, monument, or street address..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-[#008cff] focus:bg-white rounded-xl pl-11 pr-10 py-3 text-sm text-gray-900 outline-none transition shadow-inner"
            />
            {isLoading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <span className="inline-block w-4 h-4 border-2 border-[#008cff] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!isLoading && query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>

          {/* Quick GPS Location Bar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingGps}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#008cff] rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${isDetectingGps ? 'animate-spin' : ''}`}>
                {isDetectingGps ? 'autorenew' : 'near_me'}
              </span>
              <span>{isDetectingGps ? 'Detecting GPS Coordinates...' : 'Use My Current Location (GPS)'}</span>
            </button>

            {/* Quick City Filter Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
              {['Delhi', 'Mumbai', 'Bengaluru', 'Goa', 'Dubai', 'Paris', 'Jaipur'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setActiveCityTab(c);
                    setQuery(c);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    activeCityTab === c && !query
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* GPS Error Alert */}
          {gpsError && (
            <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2 animate-fadeIn">
              <span className="material-symbols-outlined text-amber-600 text-[16px]">warning</span>
              <span>{gpsError}</span>
            </div>
          )}
        </div>

        {/* Places Result List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 min-h-[260px] max-h-[380px]">
          {/* Custom Entered Option if Query not empty */}
          {query.trim().length > 1 && (
            <div
              onClick={() => {
                onSelectLocation({
                  name: query.trim(),
                  address: `${query.trim()}, ${activeCityTab}`,
                });
                onClose();
              }}
              className="p-3 bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200 rounded-xl cursor-pointer flex items-center justify-between transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">add_location</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block group-hover:text-[#008cff] transition">
                    Use &quot;{query.trim()}&quot;
                  </span>
                  <span className="text-[11px] text-gray-500">Select this custom entered location directly</span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#008cff] flex items-center space-x-0.5">
                <span>Select</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </span>
            </div>
          )}

          {/* Place Results */}
          {results.length > 0 ? (
            results.map((place) => {
              const { icon, bg } = getCategoryIcon(place.category);
              return (
                <div
                  key={place.id}
                  onClick={() => {
                    onSelectLocation({
                      name: place.name,
                      address: place.formatted_address,
                      lat: place.lat,
                      lon: place.lon,
                      city: place.city,
                    });
                    onClose();
                  }}
                  className="p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 cursor-pointer flex items-center justify-between transition group"
                >
                  <div className="flex items-start space-x-3 max-w-[85%]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
                      <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-gray-900 block group-hover:text-[#008cff] transition line-clamp-1">
                          {place.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 uppercase tracking-wider shrink-0">
                          {place.category_label || place.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                        {place.formatted_address}
                      </p>
                      {place.lat && place.lon && (
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                          📍 {place.lat.toFixed(4)}°, {place.lon.toFixed(4)}°
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-gray-300 group-hover:text-[#008cff] transition text-[20px]">
                    chevron_right
                  </span>
                </div>
              );
            })
          ) : !isLoading ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">map</span>
              <p className="text-xs font-medium text-gray-600">No matching map places found.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Try searching city, airport code, or popular landmark.</p>
            </div>
          ) : null}
        </div>

        {/* Modal Footer with Map Attribution */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-emerald-600 text-[15px]">verified</span>
            <span>Real-Time OpenStreetMap Geocoding Engine</span>
          </div>
          <span className="font-medium text-gray-400">Zero Surge · Verified Chauffeurs</span>
        </div>
      </div>
    </div>
  );
};
