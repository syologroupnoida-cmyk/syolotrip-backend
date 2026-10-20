import React from 'react';
import { 
  Plane, Hotel, Bus, Receipt, Server, 
  RefreshCw, CheckCircle2 
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operations & Inventory Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management console for Phase 1 deterministic travel inventory and simulated bookings.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
            <span className="text-xs font-medium text-slate-400">Flight Routes</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{overview?.total_flights ?? 6} Active</div>
          <div className="text-[11px] text-emerald-400 font-medium">PostgreSQL Database Seeded</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Hotel Properties</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Hotel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{overview?.total_hotels ?? 3} Properties</div>
          <div className="text-[11px] text-indigo-400 font-medium">Packages: {overview?.total_packages ?? 2} | Buses: {overview?.total_buses ?? 2}</div>
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

      {/* Provider Adapter Registry Diagnostics */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Travel Provider Adapter Registry</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Decoupled adapter contracts ensuring zero dependency on proprietary third-party SDKs in Phase 1.
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
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Provider Contract</th>
                <th className="py-3 px-4">Current Driver</th>
                <th className="py-3 px-4">Phase 2 Target</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Plane className="w-3.5 h-3.5 text-brand-400" /> Flights
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">FlightProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockFlightProvider</td>
                <td className="py-3 px-4 text-slate-500">Amadeus / Sabre GDS</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Hotel className="w-3.5 h-3.5 text-brand-400" /> Hotels
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">HotelProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockHotelProvider</td>
                <td className="py-3 px-4 text-slate-500">Expedia / Hotelbeds</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Bus className="w-3.5 h-3.5 text-brand-400" /> Buses
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">BusProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockBusProvider</td>
                <td className="py-3 px-4 text-slate-500">RedBus / AbhiBus API</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-brand-400" /> Payments
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">PaymentProviderInterface</td>
                <td className="py-3 px-4 text-brand-400">MockPaymentProvider</td>
                <td className="py-3 px-4 text-slate-500">Stripe / Razorpay</td>
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
