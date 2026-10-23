import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchTrainsApi, TrainApiResponse } from '../services/api';
import { ScreenType } from '../components/Header';
import { WebCheckoutItem } from './BookingCheckoutPage';

interface TrainSearchPageProps {
  onNavigate?: (screen: ScreenType) => void;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
  fromCity?: string;
  toCity?: string;
}

export interface TrainClass {
  code: string;
  name: string;
  price: number;
  status: string;
  statusColor: string;
}

export interface TrainItem {
  id: string;
  name: string;
  number: string;
  type: string;
  typeBadge: string;
  typeColor: string;
  depTime: string;
  depStation: string;
  arrTime: string;
  arrStation: string;
  duration: string;
  durationMinutes: number;
  runsOn: string[];
  classes: TrainClass[];
  pantry: boolean;
  freeCancel: boolean;
}

const mapTrainResponse = (t: TrainApiResponse): TrainItem => {
  const durationHrs = Math.floor(t.duration_minutes / 60);
  const durationMins = t.duration_minutes % 60;
  const durationText = `${String(durationHrs).padStart(2, '0')}h ${String(durationMins).padStart(2, '0')}m`;

  let typeColor = 'bg-[#005cab]';
  let typeBadge = 'SUPERFAST SPECIAL';
  let type = 'SUPERFAST';
  const nameLower = t.train_name.toLowerCase();
  if (nameLower.includes('vande')) {
    typeColor = 'bg-[#005cab]';
    typeBadge = 'VANDE BHARAT SPECIAL';
    type = 'VANDE_BHARAT';
  } else if (nameLower.includes('rajdhani')) {
    typeColor = 'bg-[#bb0017]';
    typeBadge = 'PREMIUM SUPERFAST';
    type = 'RAJDHANI';
  } else if (nameLower.includes('shatabdi')) {
    typeColor = 'bg-[#0A58CA]';
    typeBadge = 'SHATABDI EXPRESS';
    type = 'SUPERFAST';
  }

  const basePrice = Math.round(t.base_fare);
  const trainClasses: TrainClass[] = [
    {
      code: 'CC',
      name: t.train_class || 'AC Chair Car',
      price: basePrice,
      status: `AVAILABLE - ${t.available_seats}`,
      statusColor: 'text-[#1A7F37]',
    },
    {
      code: 'EC',
      name: 'Exec. Chair Car',
      price: Math.round(basePrice * 1.6),
      status: `AVAILABLE - ${Math.max(4, Math.floor(t.available_seats / 4))}`,
      statusColor: 'text-[#1A7F37]',
    },
  ];

  return {
    id: t.id,
    name: t.train_name,
    number: t.train_number,
    type,
    typeBadge,
    typeColor,
    depTime: t.departure_time,
    depStation: `${t.from_station_code} (${t.from_station_name})`,
    arrTime: t.arrival_time,
    arrStation: `${t.to_station_code} (${t.to_station_name})`,
    duration: durationText,
    durationMinutes: t.duration_minutes,
    runsOn: ['M', 'T', 'W', 'T', 'F', 'S'],
    classes: trainClasses,
    pantry: true,
    freeCancel: true,
  };
};

export const TrainSearchPage: React.FC<TrainSearchPageProps> = ({
  onNavigate,
  onInitiateCheckout,
  fromCity = 'Delhi',
  toCity = 'Mumbai',
}) => {
  const [selectedQuota, setSelectedQuota] = useState('General');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [trainTypeFilter, setTrainTypeFilter] = useState<'ALL' | 'VANDE_BHARAT' | 'RAJDHANI' | 'SUPERFAST'>('ALL');
  const [acOnly, setAcOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'EARLIEST' | 'DURATION' | 'PRICE'>('EARLIEST');
  const [ignoreRouteFilter, setIgnoreRouteFilter] = useState(false);

  // Live Backend query
  const {
    data: apiTrains,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trainsSearch', fromCity, toCity, ignoreRouteFilter],
    queryFn: () => {
      if (ignoreRouteFilter) {
        return searchTrainsApi();
      }
      return searchTrainsApi({ from_city: fromCity, to_city: toCity });
    },
    staleTime: 30000,
  });

  // Map API response to train cards
  const liveTrains = useMemo(() => {
    if (!apiTrains) return [];
    return apiTrains.map(mapTrainResponse);
  }, [apiTrains]);

  // Filtered trains
  const filteredTrains = useMemo(() => {
    let list: TrainItem[] = [...liveTrains];

    if (trainTypeFilter !== 'ALL') {
      list = list.filter((t) => t.type === trainTypeFilter);
    }

    if (selectedClass) {
      list = list.filter((t) => t.classes.some((c) => c.code === selectedClass));
    }

    if (acOnly) {
      list = list.filter((t) => t.classes.some((c) => !c.code.includes('SL')));
    }

    if (availableOnly) {
      list = list.filter((t) => t.classes.some((c) => c.status.includes('AVAILABLE')));
    }

    list = list.filter((t) => t.classes.some((c) => c.price <= maxPrice));

    if (sortBy === 'DURATION') {
      list.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (sortBy === 'PRICE') {
      list.sort((a, b) => a.classes[0].price - b.classes[0].price);
    } else {
      list.sort((a, b) => a.depTime.localeCompare(b.depTime));
    }

    return list;
  }, [liveTrains, trainTypeFilter, selectedClass, acOnly, availableOnly, maxPrice, sortBy]);

  const handleBookTrainClass = (train: TrainItem, cls: TrainClass) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!train.id || !uuidRegex.test(train.id)) {
      alert('Data integrity issue: Selected train schedule lacks a valid database UUID. Booking is disabled.');
      return;
    }

    const item: WebCheckoutItem = {
      serviceType: 'TRAIN',
      itemId: train.id,
      title: `${train.name} (${train.number})`,
      subtitle: `${cls.name} (${cls.code}) · Quota: ${selectedQuota} · ${cls.status}`,
      routeInfo: `${train.depStation} → ${train.arrStation} (${train.depTime} - ${train.arrTime})`,
      pricing: {
        baseAmount: cls.price,
        taxes: Math.round(cls.price * 0.05),
        discount: 100,
        insurance: 49,
      },
      details: {
        trainNumber: train.number,
        classCode: cls.code,
        quota: selectedQuota,
        departure: train.depTime,
        arrival: train.arrTime,
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
      {/* ── TOP STICKY SEARCH MODIFIER BAR ── */}
      <section className="sticky top-16 sm:top-[70px] z-30 bg-white shadow-xs border-b border-[#E7EBF0]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F2F4F8] p-3 rounded-xl border border-[#E7EBF0]">
            <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
              <span className="text-xl text-[#008cff]">🚆</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stations</span>
                <span className="text-sm font-bold text-gray-900 truncate">
                  {fromCity} (NDLS) &rarr; {toCity} (BOM/MMCT)
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-300 hidden md:block" />

            <div className="flex items-center space-x-3 flex-1 min-w-[180px]">
              <span className="text-xl text-[#008cff]">📅</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Travel Date</span>
                <span className="text-xs font-bold text-gray-900">Sat, 24 Oct 2026</span>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-300 hidden md:block" />

            <div className="flex items-center space-x-3 flex-1 min-w-[180px]">
              <span className="text-xl text-[#008cff]">🎟️</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quota</span>
                <select
                  value={selectedQuota}
                  onChange={(e) => setSelectedQuota(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                >
                  <option value="General">General Quota</option>
                  <option value="Tatkal">Tatkal Quota</option>
                  <option value="Ladies">Ladies Quota</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('explore')}
              className="bg-[#005cab] hover:bg-[#0A58CA] text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm transition active:scale-95 whitespace-nowrap"
            >
              MODIFY SEARCH
            </button>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Quick:</span>
            {[
              { id: 'ALL', label: 'All Trains' },
              { id: 'VANDE_BHARAT', label: '⚡ Vande Bharat' },
              { id: 'RAJDHANI', label: '👑 Rajdhani Express' },
              { id: 'SUPERFAST', label: '🚄 Superfast' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setTrainTypeFilter(pill.id as any)}
                className={`px-3 py-1.5 rounded-full font-semibold transition whitespace-nowrap ${
                  trainTypeFilter === pill.id
                    ? 'bg-[#005cab] text-white shadow-xs'
                    : 'bg-[#F2F4F8] hover:bg-gray-200 text-gray-800'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12-COLUMN STITCH LAYOUT ── */}
      <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT SIDEBAR FILTERS (3 Cols) ── */}
          <aside className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#E7EBF0] flex flex-col gap-5 sticky top-52">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-bold text-base text-gray-900">Filters</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedClass(null);
                  setTrainTypeFilter('ALL');
                  setAvailableOnly(false);
                }}
                className="text-xs font-bold text-[#008cff] hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Quick Availability Toggles */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Seat Availability</span>
              <label className="flex items-center space-x-2 text-xs text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="rounded text-[#008cff] h-4 w-4"
                />
                <span className="font-semibold text-emerald-700">Show Available Berths Only</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acOnly}
                  onChange={(e) => setAcOnly(e.target.checked)}
                  className="rounded text-[#008cff] h-4 w-4"
                />
                <span>AC Coaches Only</span>
              </label>
            </div>

            {/* Coach Class Selectors */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Coach Classes</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['1A', '2A', '3A', 'CC', 'EC', 'SL'].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(selectedClass === cls ? null : cls)}
                    className={`py-2 px-3 rounded-xl font-bold transition ${
                      selectedClass === cls
                        ? 'bg-[#d5e3ff] text-[#005cab] ring-1 ring-[#005cab]'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div className="flex flex-col gap-1 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">Max Fare</span>
                <span className="font-extrabold text-[#005cab]">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#005cab] cursor-pointer"
              />
            </div>

            {/* IRCTC Authorized Partner Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 flex flex-col gap-1.5">
              <div className="flex items-center space-x-2 text-amber-800">
                <span className="text-lg">🛡️</span>
                <span className="font-bold text-xs uppercase tracking-wider">IRCTC Authorized Partner</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                100% Guaranteed PNR generation &bull; Instant Tatkal booking confirmation &bull; Zero cancellation fee option available.
              </p>
            </div>
          </aside>

          {/* ── RIGHT TRAIN LISTINGS (9 Cols) ── */}
          <main className="lg:col-span-9 flex flex-col gap-4">
            {/* Sorting Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-[#E7EBF0]">
              <div>
                <h1 className="text-lg font-black text-gray-900 leading-tight">
                  Trains: {fromCity} to {toCity}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {filteredTrains.length} direct trains found &bull; Live IRCTC berth status
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 font-semibold whitespace-nowrap">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#F2F4F8] text-gray-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none border border-gray-200"
                >
                  <option value="EARLIEST">Earliest Departure</option>
                  <option value="DURATION">Fastest Duration</option>
                  <option value="PRICE">Lowest Fare</option>
                </select>
              </div>
            </div>

            {/* Ignore Route Banner if viewing all */}
            {ignoreRouteFilter && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <span>Showing all scheduled trains across all rail routes.</span>
                <button
                  type="button"
                  onClick={() => setIgnoreRouteFilter(false)}
                  className="font-bold text-[#008cff] hover:underline"
                >
                  Filter to {fromCity} &rarr; {toCity}
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-xs flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#008cff] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-base font-bold text-gray-800">Checking Live Train Schedules & Berths...</p>
                <p className="text-xs text-gray-500 mt-1">Connecting to live railway database for {fromCity} &rarr; {toCity}</p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-red-50 rounded-2xl p-8 text-center border border-red-200 shadow-xs">
                <p className="text-base font-bold text-red-700">Unable to Fetch Train Schedules</p>
                <p className="text-xs text-red-600 mt-1">{(error as any)?.message || 'An error occurred while connecting to the train service.'}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Retry Search
                </button>
              </div>
            )}

            {/* Train Cards / Empty State */}
            {!isLoading && !isError && filteredTrains.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-xs">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                  🚆
                </div>
                <p className="text-base font-bold text-gray-800">No direct trains found between {fromCity} and {toCity}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Try adjusting filters or check all available express trains on our network.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMaxPrice(15000);
                      setSelectedClass(null);
                      setTrainTypeFilter('ALL');
                      setAcOnly(false);
                      setAvailableOnly(false);
                    }}
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
                      View All Available Trains Across Routes
                    </button>
                  )}
                </div>
              </div>
            ) : !isLoading && !isError && (
              filteredTrains.map((train) => (
              <article
                key={train.id}
                className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow border border-[#E7EBF0] flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className={`text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${train.typeColor}`}>
                      {train.typeBadge}
                    </span>
                    <span className="text-xs font-bold text-gray-500">Train #{train.number}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-gray-500">
                    <span>Runs on:</span>
                    <span className="font-mono font-bold text-gray-800">{train.runsOn.join(' ')}</span>
                  </div>
                </div>

                {/* Train Name & Route */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{train.name}</h3>
                    <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                      <span>🍴 Pantry Car Available</span>
                      <span>✔ Free Cancellation Option</span>
                    </div>
                  </div>

                  {/* Route Timeline */}
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col text-left">
                      <span className="text-lg font-black text-gray-900">{train.depTime}</span>
                      <span className="text-xs font-semibold text-gray-700">{train.depStation}</span>
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <span className="text-[11px] font-semibold text-gray-500">{train.duration}</span>
                      <div className="w-20 sm:w-24 h-0.5 bg-gray-300 my-1 relative">
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">🚆</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">DIRECT</span>
                    </div>

                    <div className="flex flex-col text-right">
                      <span className="text-lg font-black text-gray-900">{train.arrTime}</span>
                      <span className="text-xs font-semibold text-gray-700">{train.arrStation}</span>
                    </div>
                  </div>
                </div>

                {/* Class Availability Boxes Strip */}
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">
                    Select Coach Class & Confirm Berth
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {train.classes.map((cls: TrainClass) => (
                      <div
                        key={cls.code}
                        className="p-3 rounded-xl border border-gray-200 hover:border-[#008cff] bg-gray-50/50 hover:bg-blue-50/40 transition flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">{cls.name} ({cls.code})</span>
                          <span className="text-xs font-black text-gray-900">₹{cls.price.toLocaleString('en-IN')}</span>
                        </div>
                        <span className={`text-xs font-black ${cls.statusColor}`}>
                          {cls.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleBookTrainClass(train, cls)}
                          className="w-full py-1.5 rounded-lg bg-[#005cab] hover:bg-[#0A58CA] text-white font-bold text-xs shadow-xs transition"
                        >
                          BOOK {cls.code}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            )))}
          </main>
        </div>
      </div>
    </div>
  );
};
