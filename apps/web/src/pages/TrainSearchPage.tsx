import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchTrainsApi } from '../services/api';
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

export const TrainSearchPage: React.FC<TrainSearchPageProps> = ({
  onNavigate,
  onInitiateCheckout,
  fromCity = 'Delhi',
  toCity = 'Mumbai',
}) => {
  const [selectedQuota, setSelectedQuota] = useState('General');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(4500);
  const [trainTypeFilter, setTrainTypeFilter] = useState<'ALL' | 'VANDE_BHARAT' | 'RAJDHANI' | 'SUPERFAST'>('ALL');
  const [acOnly, setAcOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'EARLIEST' | 'DURATION' | 'PRICE'>('EARLIEST');

  const defaultTrains: TrainItem[] = useMemo(() => [
    {
      id: 'train-vb-20172',
      name: 'Vande Bharat Express',
      number: '20172',
      type: 'VANDE_BHARAT',
      typeBadge: 'VANDE BHARAT SPECIAL',
      typeColor: 'bg-[#005cab]',
      depTime: '06:00',
      depStation: 'NDLS (New Delhi)',
      arrTime: '14:05',
      arrStation: 'BOM (Mumbai Central)',
      duration: '08h 05m',
      durationMinutes: 485,
      runsOn: ['M', 'T', 'W', 'T', 'F', 'S'],
      classes: [
        { code: 'CC', name: 'AC Chair Car', price: 1750, status: 'AVAILABLE - 42', statusColor: 'text-[#1A7F37]' },
        { code: 'EC', name: 'Exec. Chair Car', price: 3350, status: 'AVAILABLE - 12', statusColor: 'text-[#1A7F37]' },
      ],
      pantry: true,
      freeCancel: true,
    },
    {
      id: 'train-raj-12952',
      name: 'Mumbai Rajdhani Express',
      number: '12952',
      type: 'RAJDHANI',
      typeBadge: 'PREMIUM SUPERFAST',
      typeColor: 'bg-[#bb0017]',
      depTime: '16:55',
      depStation: 'NDLS (New Delhi)',
      arrTime: '08:35',
      arrStation: 'MMCT (Mumbai Central)',
      duration: '15h 40m',
      durationMinutes: 940,
      runsOn: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      classes: [
        { code: '3A', name: '3rd AC', price: 2150, status: 'AVAILABLE - 28', statusColor: 'text-[#1A7F37]' },
        { code: '2A', name: '2nd AC', price: 3050, status: 'AVAILABLE - 8', statusColor: 'text-[#1A7F37]' },
        { code: '1A', name: '1st AC', price: 4850, status: 'WL 4', statusColor: 'text-amber-600' },
      ],
      pantry: true,
      freeCancel: true,
    },
    {
      id: 'train-aug-12954',
      name: 'August Kranti Tejas Rajdhani',
      number: '12954',
      type: 'RAJDHANI',
      typeBadge: 'TEJAS SMART COACH',
      typeColor: 'bg-[#f4511e]',
      depTime: '17:15',
      depStation: 'NZM (H. Nizamuddin)',
      arrTime: '10:05',
      arrStation: 'MMCT (Mumbai Central)',
      duration: '16h 50m',
      durationMinutes: 1010,
      runsOn: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      classes: [
        { code: '3A', name: '3rd AC', price: 2150, status: 'AVAILABLE - 16', statusColor: 'text-[#1A7F37]' },
        { code: '2A', name: '2nd AC', price: 3050, status: 'AVAILABLE - 4', statusColor: 'text-[#1A7F37]' },
        { code: '1A', name: '1st AC', price: 4850, status: 'AVAILABLE - 2', statusColor: 'text-[#1A7F37]' },
      ],
      pantry: true,
      freeCancel: true,
    },
    {
      id: 'train-garib-12215',
      name: 'Delhi Mumbai Garib Rath',
      number: '12215',
      type: 'SUPERFAST',
      typeBadge: 'BUDGET AC EXPRESS',
      typeColor: 'bg-[#1A7F37]',
      depTime: '09:20',
      depStation: 'DEE (Delhi S. Rohilla)',
      arrTime: '07:35',
      arrStation: 'BDTS (Bandra Terminus)',
      duration: '22h 15m',
      durationMinutes: 1335,
      runsOn: ['M', 'T', 'T', 'S'],
      classes: [
        { code: '3A', name: 'AC 3 Economy', price: 1050, status: 'AVAILABLE - 84', statusColor: 'text-[#1A7F37]' },
      ],
      pantry: true,
      freeCancel: false,
    },
  ], []);

  // Backend query
  const { data: backendTrains } = useQuery({
    queryKey: ['trainsSearch', fromCity, toCity],
    queryFn: () => searchTrainsApi({ from_city: fromCity, to_city: toCity }),
    staleTime: 60000,
  });

  // Filtered trains
  const filteredTrains = useMemo(() => {
    let list: TrainItem[] = (backendTrains && backendTrains.length > 0) ? (backendTrains as any as TrainItem[]) : [...defaultTrains];

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
  }, [backendTrains, defaultTrains, trainTypeFilter, selectedClass, acOnly, availableOnly, maxPrice, sortBy]);

  const handleBookTrainClass = (train: TrainItem, cls: TrainClass) => {
    const item: WebCheckoutItem = {
      serviceType: 'TRAIN',
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

            {/* Train Cards */}
            {filteredTrains.map((train) => (
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
            ))}
          </main>
        </div>
      </div>
    </div>
  );
};
