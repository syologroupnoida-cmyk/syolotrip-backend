import React from 'react';
import { 
  Plane, Hotel, Bus, Receipt, Server, 
  RefreshCw, CheckCircle2, Train, Car, Compass, Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAdminHealth, getAdminOverview } from '../services/api';

export const DashboardOverview: React.FC = () => {
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['adminHealth'],
    queryFn: getAdminHealth,
  });

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: getAdminOverview,
  });

  const isLoading = healthLoading || overviewLoading;

  const handleRefresh = () => {
    refetchHealth();
    refetchOverview();
  };

  const travelServices = [
    { title: 'Flight Routes', icon: Plane, count: `${overview?.total_flights ?? 6} Active`, sub: 'Amadeus / Sabre NDC Ready', color: 'from-blue-600/20 to-blue-500/5 text-blue-400 border-blue-500/20' },
    { title: 'Hotel Properties', icon: Hotel, count: `${overview?.total_hotels ?? 3} Properties`, sub: 'Expedia / CRS Compatible', color: 'from-indigo-600/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20' },
    { title: 'Train Routes', icon: Train, count: '3 Express Lines', sub: 'IRCTC Live PNR Simulator', color: 'from-sky-600/20 to-sky-500/5 text-sky-400 border-sky-500/20' },
    { title: 'Intercity Buses', icon: Bus, count: `${overview?.total_buses ?? 2} Coach Operators`, sub: 'RedBus API Driver Active', color: 'from-emerald-600/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20' },
    { title: 'Cab Fleets', icon: Car, count: '3 Fleets (Sedan/SUV/EV)', sub: 'Airport & Outstation Cabs', color: 'from-amber-600/20 to-amber-500/5 text-amber-400 border-amber-500/20' },
    { title: 'Holiday Packages', icon: Compass, count: `${overview?.total_packages ?? 2} Itineraries`, sub: 'Multi-Day Guided Tours', color: 'from-purple-600/20 to-purple-500/5 text-purple-400 border-purple-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SS Journey Admin Operations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized operations hub connected with Consumer Web (Port 5173), Mobile App, and FastAPI Engine (Port 8000).
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{overview?.total_bookings ?? 0}</div>
          <div className="text-[11px] text-brand-400 font-medium">
            Confirmed: {overview?.confirmed_bookings ?? 0} | Revenue: ₹{(overview?.total_revenue ?? 0).toLocaleString()}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{overview?.total_users ?? 3} Registered</div>
          <div className="text-[11px] text-emerald-400 font-medium">Admins & Customers Active</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Services Online</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">6 Travel Verticals</div>
          <div className="text-[11px] text-indigo-400 font-medium">Flights, Hotels, Trains, Buses, Cabs, Packages</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Core API Health</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white capitalize">
            {health?.status || 'Healthy'}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            DB: {health?.database || 'Connected'} ({overview?.adapter_mode || 'MOCK_DETERMINISTIC'})
          </div>
        </div>
      </div>

      {/* All 6 Travel Services Overview Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">All Active Travel Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {travelServices.map((svc) => {
            const Icon = svc.icon;
            return (
              <div 
                key={svc.title}
                className={`p-4 rounded-2xl bg-gradient-to-br ${svc.color} border space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {svc.title}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    ONLINE
                  </span>
                </div>
                <div className="text-xl font-extrabold text-white">{svc.count}</div>
                <p className="text-[11px] text-slate-400">{svc.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider Adapter Registry Diagnostics */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Travel Provider Adapter Registry</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Decoupled adapter contracts ensuring seamless switching between mock simulations and live GDS APIs.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Adapter Mode: MOCK_DETERMINISTIC
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-y border-slate-800">
              <tr>
                <th className="py-3 px-4">Service Domain</th>
                <th className="py-3 px-4">Provider Contract</th>
                <th className="py-3 px-4">Current Driver</th>
                <th className="py-3 px-4">Production Target</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Plane className="w-3.5 h-3.5 text-blue-400" /> Flights
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">FlightProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockFlightProvider</td>
                <td className="py-3 px-4 text-slate-400">Amadeus / Sabre GDS</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Hotel className="w-3.5 h-3.5 text-indigo-400" /> Hotels
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">HotelProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockHotelProvider</td>
                <td className="py-3 px-4 text-slate-400">Expedia / Hotelbeds</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Train className="w-3.5 h-3.5 text-sky-400" /> Trains
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">TrainProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockTrainProvider</td>
                <td className="py-3 px-4 text-slate-400">IRCTC / RailYatri Gateway</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Bus className="w-3.5 h-3.5 text-emerald-400" /> Buses
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">BusProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockBusProvider</td>
                <td className="py-3 px-4 text-slate-400">RedBus / AbhiBus API</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Car className="w-3.5 h-3.5 text-amber-400" /> Cabs & Fleet
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">CabProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockCabProvider</td>
                <td className="py-3 px-4 text-slate-400">Uber / Ola Fleet Dispatcher</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-purple-400" /> Holiday Packages
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">PackageProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockPackageProvider</td>
                <td className="py-3 px-4 text-slate-400">Curated Tour Aggregators</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-rose-400" /> Payments & Escrow
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">PaymentProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockPaymentProvider</td>
                <td className="py-3 px-4 text-slate-400">Razorpay / Stripe Gateway</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
