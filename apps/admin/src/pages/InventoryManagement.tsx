import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plane, Hotel, Bus, Compass, Plus, RefreshCw, MapPin 
} from 'lucide-react';
import { 
  getAdminFlights, getAdminHotels, getAdminBuses, 
  getAdminPackages, createAdminFlight 
} from '../services/api';

interface InventoryManagementProps {
  type: 'flights' | 'hotels' | 'buses' | 'packages';
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ type }) => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
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

  const { data: buses, isLoading: busesLoading, refetch: refetchBuses } = useQuery({
    queryKey: ['adminBuses'],
    queryFn: getAdminBuses,
    enabled: type === 'buses',
  });

  const { data: packages, isLoading: packagesLoading, refetch: refetchPackages } = useQuery({
    queryKey: ['adminPackages'],
    queryFn: getAdminPackages,
    enabled: type === 'packages',
  });

  const createFlightMutation = useMutation({
    mutationFn: createAdminFlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFlights'] });
      setShowAddModal(false);
    },
  });

  const isLoading = flightsLoading || hotelsLoading || busesLoading || packagesLoading;

  const handleRefresh = () => {
    if (type === 'flights') refetchFlights();
    if (type === 'hotels') refetchHotels();
    if (type === 'buses') refetchBuses();
    if (type === 'packages') refetchPackages();
  };

  const titles = {
    flights: { name: 'Flight Inventory', icon: Plane, desc: 'Manage airline routes, pricing and seat availability.' },
    hotels: { name: 'Hotel Properties', icon: Hotel, desc: 'Manage registered hotels, room types, and rates.' },
    buses: { name: 'Bus Routes & Schedules', icon: Bus, desc: 'Manage intercity bus operators and seat configurations.' },
    packages: { name: 'Holiday Packages', icon: Compass, desc: 'Curate dynamic holiday packages with multi-day itineraries.' },
  };

  const currentInfo = titles[type] || titles.flights;
  const CurrentIcon = currentInfo.icon;

  return (
    <div className="space-y-6">
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
          {type === 'flights' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Flight</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Content Feed */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          Loading {type} from inventory...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {type === 'flights' &&
            (flights || []).map((f: any) => (
              <div key={f.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{f.airline}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {f.flight_number || f.flightNumber}
                  </span>
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

          {type === 'hotels' &&
            (hotels || []).map((h: any) => (
              <div key={h.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{h.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    ★ {h.star_rating || h.starRating} Stars
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  {h.city}, {h.country}
                </p>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Starting from</span>
                  <span className="font-bold text-white">₹{(h.starting_price || h.startingPrice || 0).toLocaleString()}/night</span>
                </div>
              </div>
            ))}

          {type === 'buses' &&
            (buses || []).map((b: any) => (
              <div key={b.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{b.operator_name || b.operatorName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    {b.bus_type || b.busType}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>{b.from_city || b.fromCity}</span>
                  <span>➔</span>
                  <span>{b.to_city || b.toCity}</span>
                </div>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{b.available_seats_count || b.availableSeatsCount} seats</span>
                  <span className="font-bold text-white">₹{(b.base_fare || b.baseFare || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}

          {type === 'packages' &&
            (packages || []).map((p: any) => (
              <div key={p.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{p.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-400">
                    {p.duration_days || p.durationDays}D / {p.duration_nights || p.durationNights}N
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{p.overview}</p>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Per person</span>
                  <span className="font-bold text-white">₹{(p.price_per_person || p.pricePerPerson || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add Flight Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Flight Listing</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => createFlightMutation.mutate(newFlight)}
                disabled={createFlightMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {createFlightMutation.isPending ? 'Saving...' : 'Save Flight'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
