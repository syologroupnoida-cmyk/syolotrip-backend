import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plane, Hotel, Bus, Compass, Train, Car, Plus, RefreshCw, MapPin, Trash2,
  CheckCircle2, Clock, Edit3, X
} from 'lucide-react';
import { 
  getAdminFlights, getAdminHotels, getAdminBuses, 
  getAdminPackages, getAdminTrains, getAdminCabs,
  createAdminFlight, createAdminHotel, createAdminBus,
  createAdminTrain, createAdminCab, createAdminPackage,
  deleteAdminInventoryItem, updateAdminInventoryItem,
  getAdminPendingProperties, approveAdminProperty, rejectAdminProperty,
  updateAdminPackageStatus, bulkUpdateAdminPackageStatus
} from '../services/api';


interface InventoryManagementProps {
  type: 'flights' | 'hotels' | 'trains' | 'buses' | 'cabs' | 'packages';
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ type }) => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [hotelSubTab, setHotelSubTab] = useState<'published' | 'pending'>('published');
  const [packageStatusFilter, setPackageStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [packageRegionFilter, setPackageRegionFilter] = useState<'ALL' | 'National' | 'International'>('ALL');
  const [packageSearch, setPackageSearch] = useState('');
  const [inspectAdminPackage, setInspectAdminPackage] = useState<any | null>(null);

  // New Flight state

  const [newFlight, setNewFlight] = useState({
    airline: 'Air India',
    airline_code: 'AI',
    flight_number: 'AI-302',
    aircraft: 'Airbus A321neo',
    origin_code: 'DEL',
    origin_name: 'Indira Gandhi International Airport',
    origin_city: 'New Delhi',
    origin_country: 'India',
    destination_code: 'BOM',
    destination_name: 'Chhatrapati Shivaji Maharaj International Airport',
    destination_city: 'Mumbai',
    destination_country: 'India',
    departure_time: '14:30',
    arrival_time: '16:45',
    duration_minutes: 135,
    stops: 0,
    cabin_class: 'ECONOMY',
    available_seats: 120,
    base_fare: 4500,
    taxes: 850,
    total_price: 5350,
    currency: 'INR',
  });

  // New Hotel state
  const [newHotel, setNewHotel] = useState({
    name: 'The Oberoi Grand Palace',
    property_type: 'HOTEL',
    star_rating: 5,
    user_rating: 4.8,
    address: 'Nariman Point, Marine Drive',
    city: 'Mumbai',
    country: 'India',
    starting_price: 8500,
    overview: 'Luxury 5-star seaside hotel offering panoramic views and premier amenities.',
  });

  // New Train state
  const [newTrain, setNewTrain] = useState({
    train_number: '20172',
    train_name: 'Vande Bharat Express',
    train_type: 'Vande Bharat Special',
    from_city: 'Delhi',
    from_station_code: 'NDLS',
    from_station_name: 'New Delhi Railway Station',
    to_city: 'Mumbai',
    to_station_code: 'MMCT',
    to_station_name: 'Mumbai Central',
    departure_time: '06:00',
    arrival_time: '14:05',
    duration_minutes: 485,
    train_class: 'AC Chair Car (CC)',
    available_seats: 42,
    base_fare: 1750,
  });

  // New Bus state
  const [newBus, setNewBus] = useState({
    operator_name: 'Zingbus Platinum',
    bus_type: 'Volvo AC Multi-Axle Sleeper (2+1)',
    from_city: 'Delhi',
    to_city: 'Jaipur',
    boarding_point: 'ISBT Kashmere Gate',
    dropping_point: 'Sindhi Camp',
    departure_time: '22:30',
    arrival_time: '04:45',
    duration_minutes: 375,
    available_seats: 32,
    base_fare: 899,
  });

  // New Cab state
  const [newCab, setNewCab] = useState({
    cab_type: 'Sedan',
    vehicle_model: 'Maruti Suzuki Dzire',
    city: 'Delhi',
    pickup_area: 'Delhi Airport T3',
    drop_area: 'Connaught Place Central',
    driver_name: 'Rajesh Kumar (Gold Badge)',
    driver_rating: 4.9,
    capacity: 4,
    base_fare: 649,
  });

  // New Holiday Package state
  const [newPackage, setNewPackage] = useState({
    title: 'Mesmerizing Kashmir Holiday',
    destination: 'Kashmir',
    duration_days: 5,
    duration_nights: 4,
    price_per_person: 19999,
    overview: 'Explore Dal Lake Shikara rides, Gulmarg snow valleys, and luxury stays.',
  });

  // Queries
  const { data: flights, isLoading: flightsLoading, refetch: refetchFlights } = useQuery({
    queryKey: ['adminFlights'],
    queryFn: getAdminFlights,
    enabled: type === 'flights',
  });

  const { data: hotels, isLoading: hotelsLoading, refetch: refetchHotels } = useQuery({
    queryKey: ['adminHotels'],
    queryFn: getAdminHotels,
    enabled: type === 'hotels',
  });

  const { data: pendingProperties, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['adminPendingProperties'],
    queryFn: getAdminPendingProperties,
    enabled: type === 'hotels',
  });

  const approvePropertyMutation = useMutation({
    mutationFn: approveAdminProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPendingProperties'] });
      queryClient.invalidateQueries({ queryKey: ['adminHotels'] });
    },
  });

  const rejectPropertyMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectAdminProperty(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPendingProperties'] });
      queryClient.invalidateQueries({ queryKey: ['adminHotels'] });
    },
  });


  const { data: trainsData, isLoading: trainsLoading, refetch: refetchTrains } = useQuery({
    queryKey: ['adminTrains'],
    queryFn: getAdminTrains,
    enabled: type === 'trains',
  });

  const { data: buses, isLoading: busesLoading, refetch: refetchBuses } = useQuery({
    queryKey: ['adminBuses'],
    queryFn: getAdminBuses,
    enabled: type === 'buses',
  });

  const { data: cabsData, isLoading: cabsLoading, refetch: refetchCabs } = useQuery({
    queryKey: ['adminCabs'],
    queryFn: getAdminCabs,
    enabled: type === 'cabs',
  });

  const { data: packages, isLoading: packagesLoading, refetch: refetchPackages } = useQuery({
    queryKey: ['adminPackages', packageStatusFilter, packageRegionFilter, packageSearch],
    queryFn: () =>
      getAdminPackages({
        status: packageStatusFilter !== 'ALL' ? packageStatusFilter : undefined,
        region: packageRegionFilter !== 'ALL' ? packageRegionFilter : undefined,
        search: packageSearch || undefined,
      }),
    enabled: type === 'packages',
  });

  const togglePackageStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAdminPackageStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPackages'] });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: (status: string) => bulkUpdateAdminPackageStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPackages'] });
    },
  });

  // Mutations
  const createFlightMutation = useMutation({
    mutationFn: createAdminFlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFlights'] });
      setShowAddModal(false);
    },
  });

  const createHotelMutation = useMutation({
    mutationFn: createAdminHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHotels'] });
      setShowAddModal(false);
    },
  });

  const createTrainMutation = useMutation({
    mutationFn: createAdminTrain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTrains'] });
      setShowAddModal(false);
    },
  });

  const createBusMutation = useMutation({
    mutationFn: createAdminBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBuses'] });
      setShowAddModal(false);
    },
  });

  const createCabMutation = useMutation({
    mutationFn: createAdminCab,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCabs'] });
      setShowAddModal(false);
    },
  });

  const createPackageMutation = useMutation({
    mutationFn: createAdminPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPackages'] });
      setShowAddModal(false);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ itemType, itemId }: { itemType: string; itemId: string }) =>
      deleteAdminInventoryItem(itemType, itemId),
    onSuccess: () => {
      handleRefresh();
    },
  });

  const [editItem, setEditItem] = useState<{
    id: string;
    type: string;
    title: string;
    price: number;
    available_capacity: number;
    is_active: boolean;
  } | null>(null);

  const updateItemMutation = useMutation({
    mutationFn: ({ itemType, itemId, payload }: { itemType: string; itemId: string; payload: any }) =>
      updateAdminInventoryItem(itemType, itemId, payload),
    onSuccess: () => {
      handleRefresh();
      setEditItem(null);
    },
  });

  const handleOpenEdit = (
    id: string,
    itemType: string,
    title: string,
    price: number,
    available_capacity: number,
    is_active: boolean = true
  ) => {
    setEditItem({
      id,
      type: itemType,
      title,
      price: Number(price) || 0,
      available_capacity: Number(available_capacity) || 0,
      is_active,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    let payload: Record<string, any> = {
      is_active: editItem.is_active,
    };

    if (editItem.type === 'flights') {
      payload.total_price = Number(editItem.price);
      payload.available_seats = Number(editItem.available_capacity);
    } else if (editItem.type === 'hotels') {
      payload.starting_price = Number(editItem.price);
    } else if (editItem.type === 'trains') {
      payload.base_fare = Number(editItem.price);
      payload.available_seats = Number(editItem.available_capacity);
    } else if (editItem.type === 'buses') {
      payload.base_fare = Number(editItem.price);
      payload.available_seats = Number(editItem.available_capacity);
    } else if (editItem.type === 'cabs') {
      payload.base_fare = Number(editItem.price);
      payload.capacity = Number(editItem.available_capacity);
    } else if (editItem.type === 'packages') {
      payload.price_per_person = Number(editItem.price);
      payload.available_capacity = Number(editItem.available_capacity);
    }

    updateItemMutation.mutate({
      itemType: editItem.type,
      itemId: editItem.id,
      payload,
    });
  };

  const isLoading = flightsLoading || hotelsLoading || pendingLoading || trainsLoading || busesLoading || cabsLoading || packagesLoading;

  const handleRefresh = () => {
    if (type === 'flights') refetchFlights();
    if (type === 'hotels') {
      refetchHotels();
      refetchPending();
    }
    if (type === 'trains') refetchTrains();
    if (type === 'buses') refetchBuses();
    if (type === 'cabs') refetchCabs();
    if (type === 'packages') refetchPackages();
  };

  const titles = {
    flights: { name: 'Flight Inventory', icon: Plane, desc: 'Manage airline routes, pricing, and seat availability.' },
    hotels: { name: 'Hotel & Homestay Properties', icon: Hotel, desc: 'Manage registered luxury stays, room categories, and tariffs.' },
    trains: { name: 'Train Routes & Schedules', icon: Train, desc: 'IRCTC authorized trains, live seat statuses, and class fares.' },
    buses: { name: 'Bus Routes & Sleeper Coaches', icon: Bus, desc: 'Manage intercity bus operators, sleeper berths, and live GPS fleets.' },
    cabs: { name: 'Cab & Chauffeur Fleets', icon: Car, desc: 'Airport transfers, outstation sedans, SUVs, and green EVs.' },
    packages: { name: 'Holiday Packages', icon: Compass, desc: 'Curate dynamic holiday packages with multi-day itineraries.' },
  };

  const currentInfo = titles[type] || titles.flights;
  const CurrentIcon = currentInfo.icon;

  const flightList = Array.isArray(flights) ? flights : (flights as any)?.items || [];
  const hotelList = Array.isArray(hotels) ? hotels : (hotels as any)?.items || [];
  const trainList = Array.isArray(trainsData) ? trainsData : (trainsData as any)?.items || [];
  const busList = Array.isArray(buses) ? buses : (buses as any)?.items || [];
  const cabList = Array.isArray(cabsData) ? cabsData : (cabsData as any)?.items || [];
  const packageList = Array.isArray(packages) ? packages : (packages as any)?.items || [];

  const handleDelete = (id: string) => {
    if (window.confirm(`Are you sure you want to remove this item from the active ${type} catalog?`)) {
      deleteItemMutation.mutate({ itemType: type, itemId: id });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CurrentIcon className="w-6 h-6 text-brand-400" />
            {currentInfo.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">{currentInfo.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add {type === 'flights' ? 'Flight' : type === 'hotels' ? 'Hotel' : type === 'trains' ? 'Train' : type === 'buses' ? 'Bus' : type === 'cabs' ? 'Cab' : 'Package'}</span>
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Subtab for Hotels (Published vs Partner Approvals Queue) */}
      {type === 'hotels' && (
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 w-fit">
          <button
            onClick={() => setHotelSubTab('published')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              hotelSubTab === 'published'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Published Inventory ({hotelList.length})
          </button>
          <button
            onClick={() => setHotelSubTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              hotelSubTab === 'pending'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Partner Approvals Queue</span>
            {pendingProperties && pendingProperties.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500 text-slate-950 font-bold animate-pulse">
                {pendingProperties.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Control Strip for Holiday Packages */}
      {type === 'packages' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Region:</span>
              {[
                { id: 'ALL', label: 'All Regions' },
                { id: 'National', label: '🇮🇳 National (Domestic)' },
                { id: 'International', label: '✈️ International' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setPackageRegionFilter(r.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    packageRegionFilter === r.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {r.label}
                </button>
              ))}

              <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

              <span className="text-slate-400 font-semibold">Status:</span>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'PUBLISHED', label: 'Published' },
                { id: 'DRAFT', label: 'Draft' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setPackageStatusFilter(s.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    packageStatusFilter === s.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Publish all packages in catalog?')) {
                    bulkStatusMutation.mutate('PUBLISHED');
                  }
                }}
                disabled={bulkStatusMutation.isPending}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
              >
                Approve & Publish All
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Set all packages to Draft?')) {
                    bulkStatusMutation.mutate('DRAFT');
                  }
                }}
                disabled={bulkStatusMutation.isPending}
                className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
              >
                Revert All to Draft
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
            <input
              type="text"
              value={packageSearch}
              onChange={(e) => setPackageSearch(e.target.value)}
              placeholder="Search by package title, destination, or package ID (e.g. TZ-NAT-KERA-01)..."
              className="w-full sm:max-w-md px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-brand-500"
            />
            <span className="text-xs text-slate-400">
              Showing <strong className="text-white">{packageList.length}</strong> packages
            </span>
          </div>
        </div>
      )}

      {/* Content Feed */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          Loading {type} from inventory...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* FLIGHTS */}
          {type === 'flights' &&
            flightList.map((f: any) => (
              <div key={f.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-brand-500/40 transition group">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{f.airline}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {f.flight_number || f.flightNumber}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(f.id, 'flights', `${f.airline} (${f.flight_number || f.flightNumber})`, f.total_price || f.totalPrice, f.available_seats || 100, f.is_active ?? true)}
                      title="Edit flight"
                      className="text-slate-500 hover:text-brand-400 p-1 rounded-md hover:bg-slate-900 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      title="Delete flight"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-slate-900 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-base">{f.origin?.code || f.origin_code}</div>
                    <div className="text-[11px]">{f.origin?.city || f.origin_city}</div>
                  </div>
                  <div className="text-center">
                    <Plane className="w-4 h-4 text-brand-400 mx-auto" />
                    <span className="text-[10px] text-slate-500">{f.duration_minutes}m</span>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <div className="font-bold text-white text-base">{f.destination?.code || f.destination_code}</div>
                    <div className="text-[11px]">{f.destination?.city || f.destination_city}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{f.available_seats || f.availableSeats || 100} seats left</span>
                  <span className="font-bold text-white">₹{(f.total_price || f.totalPrice || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}

          {/* HOTELS - PARTNER PENDING APPROVALS QUEUE */}
          {type === 'hotels' && hotelSubTab === 'pending' && (
            <>
              {(!pendingProperties || pendingProperties.length === 0) ? (
                <div className="col-span-full p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-bold text-white">No listings currently awaiting review</p>
                  <p className="text-xs text-slate-500">When partners submit hotel or homestay listings, they will appear here for review and one-click publishing.</p>
                </div>
              ) : (
                pendingProperties.map((p: any) => (
                  <div key={p.id} className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4 hover:border-amber-500/60 transition shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                            {p.property_type || 'HOTEL'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">★ {p.star_rating} Stars</span>
                        </div>
                        <h3 className="font-bold text-white text-sm">{p.name}</h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {p.rooms_count} Rooms
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        <span>{p.address}, {p.city}</span>
                      </p>
                      {p.partner && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-0.5">
                          <span className="text-slate-500 block">Submitted by Partner:</span>
                          <span className="font-semibold text-slate-200">{p.partner.business_name} ({p.partner.business_type})</span>
                          {p.partner.phone && <span className="text-slate-400 block">📞 {p.partner.phone}</span>}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Base Price:</span>
                        <span className="font-bold text-white text-sm">₹{p.starting_price?.toLocaleString()}/night</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const reason = window.prompt("Enter rejection reason for partner:", "Listing details require clarification.");
                            if (reason !== null) {
                              rejectPropertyMutation.mutate({ id: p.id, reason });
                            }
                          }}
                          disabled={rejectPropertyMutation.isPending}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approvePropertyMutation.mutate(p.id)}
                          disabled={approvePropertyMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Publish</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* HOTELS - LIVE PUBLISHED */}
          {type === 'hotels' && hotelSubTab === 'published' &&
            hotelList.map((h: any) => (
              <div key={h.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-brand-500/40 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 uppercase">
                        {h.property_type || h.propertyType || 'HOTEL'}
                      </span>
                      {h.partner_id && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Partner
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-white text-sm">{h.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      ★ {h.star_rating || h.starRating} Stars
                    </span>
                    <button
                      onClick={() => handleOpenEdit(h.id, 'hotels', h.name, h.starting_price || h.startingPrice, 10, h.is_active ?? true)}
                      title="Edit hotel"
                      className="text-slate-500 hover:text-brand-400 p-1 rounded-md hover:bg-slate-900 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(h.id)}
                      title="Delete property"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-slate-900 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  {h.city}, {h.country || 'India'}
                </p>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Starting from</span>
                  <span className="font-bold text-white">₹{(h.starting_price || h.startingPrice || 0).toLocaleString()}/night</span>
                </div>
              </div>
            ))}


          {/* TRAINS */}
          {type === 'trains' &&
            trainList.map((t: any) => (
              <div key={t.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-brand-500/40 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm block">{t.train_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">#{t.train_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {t.train_type}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(t.id, 'trains', `${t.train_name} (#${t.train_number})`, t.base_fare, t.available_seats, t.is_active ?? true)}
                      title="Edit train"
                      className="text-slate-500 hover:text-brand-400 p-1 rounded-md hover:bg-slate-900 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      title="Delete train"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-slate-900 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{t.from_city}</span>
                  <span className="text-brand-400">➔</span>
                  <span>{t.to_city}</span>
                </div>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold">{t.available_seats} seats confirmed</span>
                  <span className="font-bold text-white">₹{t.base_fare?.toLocaleString()}</span>
                </div>
              </div>
            ))}

          {/* BUSES */}
          {type === 'buses' &&
            busList.map((b: any) => (
              <div key={b.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-brand-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{b.operator_name || b.operatorName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {b.bus_type || b.busType}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(b.id, 'buses', `${b.operator_name || b.operatorName} (${b.bus_type || b.busType})`, b.base_fare || b.baseFare, b.available_seats_count || b.available_seats || 30, b.is_active ?? true)}
                      title="Edit bus"
                      className="text-slate-500 hover:text-brand-400 p-1 rounded-md hover:bg-slate-900 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      title="Delete bus"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-slate-900 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>{b.from_city || b.fromCity}</span>
                  <span>➔</span>
                  <span>{b.to_city || b.toCity}</span>
                </div>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{b.available_seats_count || b.availableSeatsCount || b.available_seats || 30} seats left</span>
                  <span className="font-bold text-white">₹{(b.base_fare || b.baseFare || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}

          {/* CABS */}
          {type === 'cabs' &&
            cabList.map((c: any) => (
              <div key={c.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-brand-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{c.vehicle_model}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {c.cab_type}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(c.id, 'cabs', `${c.cab_type} - ${c.vehicle_model}`, c.base_fare, c.capacity, c.is_active ?? true)}
                      title="Edit cab"
                      className="text-slate-500 hover:text-brand-400 p-1 rounded-md hover:bg-slate-900 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Delete cab"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-slate-900 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>City: <strong className="text-slate-200">{c.city}</strong></div>
                  <div>Driver: <span className="text-slate-300">{c.driver_name} ({c.driver_rating} ★)</span></div>
                </div>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{c.capacity} Passengers max</span>
                  <span className="font-bold text-white">₹{c.base_fare?.toLocaleString()}</span>
                </div>
              </div>
            ))}

          {/* PACKAGES */}
          {type === 'packages' &&
            packageList.map((p: any) => {
              const isPublished = p.publication_status === 'PUBLISHED';
              return (
                <div key={p.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-brand-500/40 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {p.package_id && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                            {p.package_id}
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-semibold">
                          {p.duration || `${p.duration_days}D / ${p.duration_nights}N`}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">
                          {p.region || 'National'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {p.publication_status || 'DRAFT'}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm leading-snug">{p.title}</h4>
                      <p className="text-xs text-brand-400 mt-0.5">📍 {p.destination} · {p.theme || 'Explorer'}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setInspectAdminPackage(p)}
                        title="Inspect Package Details"
                        className="text-slate-400 hover:text-blue-400 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          togglePackageStatusMutation.mutate({
                            id: p.id,
                            status: isPublished ? 'DRAFT' : 'PUBLISHED',
                          })
                        }
                        title={isPublished ? 'Switch to Draft' : 'Publish to Live Catalog'}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          isPublished
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isPublished ? 'Make Draft' : 'Publish'}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(p.id, 'packages', p.title, p.price_per_person || p.pricePerPerson, p.available_capacity || 20, p.is_active ?? true)}
                        title="Edit price/capacity"
                        className="text-slate-400 hover:text-brand-400 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(p.id)}
                        title="Delete package"
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {p.route && (
                    <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-900">
                      <strong className="text-slate-300">Route: </strong>
                      <span>{p.route}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Indicative Rate:</span>
                    <div className="text-right">
                      <span className="font-bold text-white text-sm">₹{(p.price_per_person || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 block">per person</span>
                    </div>
                  </div>
                </div>
              );
            })}

        </div>
      )}

      {/* Add Flight Modal */}
      {showAddModal && type === 'flights' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Flight Listing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Airline</label>
                <input
                  type="text"
                  value={newFlight.airline}
                  onChange={(e) => setNewFlight({ ...newFlight, airline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Flight Number</label>
                <input
                  type="text"
                  value={newFlight.flight_number}
                  onChange={(e) => setNewFlight({ ...newFlight, flight_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Origin Code</label>
                <input
                  type="text"
                  value={newFlight.origin_code}
                  onChange={(e) => setNewFlight({ ...newFlight, origin_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Destination Code</label>
                <input
                  type="text"
                  value={newFlight.destination_code}
                  onChange={(e) => setNewFlight({ ...newFlight, destination_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Base Fare (₹)</label>
                <input
                  type="number"
                  value={newFlight.base_fare}
                  onChange={(e) => {
                    const base = Number(e.target.value);
                    const taxes = Math.round(base * 0.18);
                    setNewFlight({ ...newFlight, base_fare: base, taxes, total_price: base + taxes });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Total Price (₹)</label>
                <input
                  type="number"
                  value={newFlight.total_price}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createFlightMutation.mutate(newFlight)}
                disabled={createFlightMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
              >
                {createFlightMutation.isPending ? 'Saving...' : 'Save Flight'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Hotel Modal */}
      {showAddModal && type === 'hotels' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Hotel Property</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">Hotel Name</label>
                <input
                  type="text"
                  value={newHotel.name}
                  onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  value={newHotel.city}
                  onChange={(e) => setNewHotel({ ...newHotel, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Star Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newHotel.star_rating}
                  onChange={(e) => setNewHotel({ ...newHotel, star_rating: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Starting Price (₹/night)</label>
                <input
                  type="number"
                  value={newHotel.starting_price}
                  onChange={(e) => setNewHotel({ ...newHotel, starting_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Address / Landmark</label>
                <input
                  type="text"
                  value={newHotel.address}
                  onChange={(e) => setNewHotel({ ...newHotel, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createHotelMutation.mutate(newHotel)}
                disabled={createHotelMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
              >
                {createHotelMutation.isPending ? 'Saving...' : 'Save Property'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Train Modal */}
      {showAddModal && type === 'trains' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Train Route</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Train Number</label>
                <input
                  type="text"
                  value={newTrain.train_number}
                  onChange={(e) => setNewTrain({ ...newTrain, train_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Train Name</label>
                <input
                  type="text"
                  value={newTrain.train_name}
                  onChange={(e) => setNewTrain({ ...newTrain, train_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">From City</label>
                <input
                  type="text"
                  value={newTrain.from_city}
                  onChange={(e) => setNewTrain({ ...newTrain, from_city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">To City</label>
                <input
                  type="text"
                  value={newTrain.to_city}
                  onChange={(e) => setNewTrain({ ...newTrain, to_city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Base Fare (₹)</label>
                <input
                  type="number"
                  value={newTrain.base_fare}
                  onChange={(e) => setNewTrain({ ...newTrain, base_fare: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Available Seats</label>
                <input
                  type="number"
                  value={newTrain.available_seats}
                  onChange={(e) => setNewTrain({ ...newTrain, available_seats: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createTrainMutation.mutate(newTrain)}
                disabled={createTrainMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
              >
                {createTrainMutation.isPending ? 'Saving...' : 'Save Train'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bus Modal */}
      {showAddModal && type === 'buses' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Bus Route</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Operator Name</label>
                <input
                  type="text"
                  value={newBus.operator_name}
                  onChange={(e) => setNewBus({ ...newBus, operator_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Bus Type</label>
                <input
                  type="text"
                  value={newBus.bus_type}
                  onChange={(e) => setNewBus({ ...newBus, bus_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">From City</label>
                <input
                  type="text"
                  value={newBus.from_city}
                  onChange={(e) => setNewBus({ ...newBus, from_city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">To City</label>
                <input
                  type="text"
                  value={newBus.to_city}
                  onChange={(e) => setNewBus({ ...newBus, to_city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Base Fare (₹)</label>
                <input
                  type="number"
                  value={newBus.base_fare}
                  onChange={(e) => setNewBus({ ...newBus, base_fare: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Available Seats</label>
                <input
                  type="number"
                  value={newBus.available_seats}
                  onChange={(e) => setNewBus({ ...newBus, available_seats: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createBusMutation.mutate(newBus)}
                disabled={createBusMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
              >
                {createBusMutation.isPending ? 'Saving...' : 'Save Bus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Cab Modal */}
      {showAddModal && type === 'cabs' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Cab Vehicle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Vehicle Model</label>
                <input
                  type="text"
                  value={newCab.vehicle_model}
                  onChange={(e) => setNewCab({ ...newCab, vehicle_model: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Cab Type</label>
                <select
                  value={newCab.cab_type}
                  onChange={(e) => setNewCab({ ...newCab, cab_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="Sedan">Prime Sedan</option>
                  <option value="SUV">Spacious SUV</option>
                  <option value="EV">Eco Electric (Green)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  value={newCab.city}
                  onChange={(e) => setNewCab({ ...newCab, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Base Fare (₹)</label>
                <input
                  type="number"
                  value={newCab.base_fare}
                  onChange={(e) => setNewCab({ ...newCab, base_fare: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createCabMutation.mutate(newCab)}
                disabled={createCabMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
              >
                {createCabMutation.isPending ? 'Saving...' : 'Save Cab'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showAddModal && type === 'packages' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Holiday Package</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">Package Title</label>
                <input
                  type="text"
                  value={newPackage.title}
                  onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Destination</label>
                <input
                  type="text"
                  value={newPackage.destination}
                  onChange={(e) => setNewPackage({ ...newPackage, destination: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Price Per Person (₹)</label>
                <input
                  type="number"
                  value={newPackage.price_per_person}
                  onChange={(e) => setNewPackage({ ...newPackage, price_per_person: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Duration Days</label>
                <input
                  type="number"
                  value={newPackage.duration_days}
                  onChange={(e) => setNewPackage({ ...newPackage, duration_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Duration Nights</label>
                <input
                  type="number"
                  value={newPackage.duration_nights}
                  onChange={(e) => setNewPackage({ ...newPackage, duration_nights: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createPackageMutation.mutate(newPackage)}
                disabled={createPackageMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
              >
                {createPackageMutation.isPending ? 'Saving...' : 'Save Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inventory Item Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setEditItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">
              Edit {editItem.type.slice(0, -1).toUpperCase()}
            </h3>
            <p className="text-xs text-slate-400 mb-5 font-mono truncate">{editItem.title}</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {editItem.type === 'packages' ? 'Price Per Person (₹)' : editItem.type === 'hotels' ? 'Starting Price / Night (₹)' : 'Price / Base Fare (₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editItem.price}
                  onChange={(e) => setEditItem({ ...editItem, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {editItem.type !== 'hotels' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {editItem.type === 'cabs' ? 'Passenger Capacity' : 'Available Seats / Slots'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editItem.available_capacity}
                    onChange={(e) => setEditItem({ ...editItem, available_capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="edit-is-active"
                  checked={editItem.is_active}
                  onChange={(e) => setEditItem({ ...editItem, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="edit-is-active" className="text-sm text-slate-200 cursor-pointer">
                  Item is Active (Visible in customer search)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateItemMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
                >
                  {updateItemMutation.isPending ? 'Saving...' : 'Update Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Inspect Package Modal */}
      {inspectAdminPackage && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-brand-400 font-bold block">{inspectAdminPackage.package_id}</span>
                <h3 className="text-lg font-bold text-white mt-1">{inspectAdminPackage.title}</h3>
                <p className="text-xs text-slate-400">Destination: {inspectAdminPackage.destination} · {inspectAdminPackage.region}</p>
              </div>
              <button
                onClick={() => setInspectAdminPackage(null)}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Route & Duration:</span>
                <span className="text-slate-200">{inspectAdminPackage.route || 'Direct'} ({inspectAdminPackage.duration})</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Overview:</span>
                <p className="text-slate-300 leading-relaxed">{inspectAdminPackage.overview}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">Indicative Rate:</span>
                  <span className="text-lg font-bold text-white">₹{inspectAdminPackage.price_per_person?.toLocaleString()}</span>
                  <span className="text-slate-500 text-[10px] block">per person</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">Publication Status:</span>
                  <span className={`font-bold ${inspectAdminPackage.publication_status === 'PUBLISHED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {inspectAdminPackage.publication_status || 'DRAFT'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  const newStatus = inspectAdminPackage.publication_status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
                  togglePackageStatusMutation.mutate({ id: inspectAdminPackage.id, status: newStatus });
                  setInspectAdminPackage(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${
                  inspectAdminPackage.publication_status === 'PUBLISHED'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {inspectAdminPackage.publication_status === 'PUBLISHED' ? 'Revert to Draft' : 'Publish to Catalog'}
              </button>
              <button
                onClick={() => setInspectAdminPackage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
