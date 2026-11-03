import React, { useState } from 'react';
import { 
  Plane, Hotel, Bus, Receipt, 
  RefreshCw, Train, Car, Compass, Users,
  Home, MapPin, FileCheck2, ShieldCheck, Database, DollarSign,
  TrendingUp, ArrowUpRight, Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAdminHealth, getAdminDashboardOverview } from '../services/api';

export const DashboardOverview: React.FC = () => {
  const [dateRange, setDateRange] = useState<string>('all');
  const [channel, setChannel] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['adminHealth'],
    queryFn: getAdminHealth,
  });

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['adminOverview', dateRange, channel, serviceFilter],
    queryFn: () => getAdminDashboardOverview({ 
      date_range: dateRange, 
      channel, 
      service: serviceFilter === 'all' ? undefined : serviceFilter 
    }),
  });

  const isLoading = healthLoading || overviewLoading;

  const handleRefresh = () => {
    refetchHealth();
    refetchOverview();
  };

  // Inventory 10 Services Configuration
  const inv = overview?.inventory_overview || {};
  const travelServices = [
    { id: 'flights', title: 'Flights', icon: Plane, active: inv.flights?.active ?? 0, total: inv.flights?.total ?? 0, desc: 'Amadeus / Sabre NDC' },
    { id: 'hotels', title: 'Hotels', icon: Hotel, active: inv.hotels?.active ?? 0, total: inv.hotels?.total ?? 0, desc: 'Expedia / Direct CRS' },
    { id: 'villas', title: 'Villas & Homestays', icon: Home, active: inv.villas?.active ?? 0, total: inv.villas?.total ?? 0, desc: 'Curated Vacation Rentals' },
    { id: 'packages', title: 'Holiday Packages', icon: Compass, active: inv.packages?.active ?? 0, total: inv.packages?.total ?? 0, desc: 'Curated 16 Destinations' },
    { id: 'trains', title: 'Train Routes', icon: Train, active: inv.trains?.active ?? 0, total: inv.trains?.total ?? 0, desc: 'IRCTC Live PNR Gateway' },
    { id: 'buses', title: 'Intercity Buses', icon: Bus, active: inv.buses?.active ?? 0, total: inv.buses?.total ?? 0, desc: 'RedBus Operator Network' },
    { id: 'cabs', title: 'Cab Fleets', icon: Car, active: inv.cabs?.active ?? 0, total: inv.cabs?.total ?? 0, desc: 'Sedan, SUV & Airport Transfer' },
    { id: 'tours', title: 'Tours & Attractions', icon: MapPin, active: inv.tours?.active ?? 0, total: inv.tours?.total ?? 0, desc: 'Guided Experiences & Tickets' },
    { id: 'visa', title: 'Visa Requirements', icon: FileCheck2, active: inv.visa?.active ?? 0, total: inv.visa?.total ?? 0, desc: '55 Country Compliance Rules' },
    { id: 'insurance', title: 'Travel Insurance', icon: ShieldCheck, active: inv.insurance?.active ?? 0, total: inv.insurance?.total ?? 0, desc: 'Domestic & Global Protection' },
  ];

  // Master Data Configuration
  const masterData = overview?.master_data_overview || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            SS Journey Enterprise Platform Control
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              API {health?.status || 'Active'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-service operations managing 10 travel verticals, database master datasets, and financial settlement.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Operations</span>
        </button>
      </div>

      {/* Global Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Filter className="w-4 h-4 text-brand-500" />
          <span>Operations Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[11px]">Timeframe:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Time</option>
              <option value="today" className="bg-slate-900">Today</option>
              <option value="week" className="bg-slate-900">Last 7 Days</option>
              <option value="month" className="bg-slate-900">Last 30 Days</option>
              <option value="year" className="bg-slate-900">This Year</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[11px]">Channel:</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Channels (B2C + B2B)</option>
              <option value="b2c" className="bg-slate-900">B2C (Direct Travelers)</option>
              <option value="b2b" className="bg-slate-900">B2B (Partner Portals)</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[11px]">Vertical:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All 10 Verticals</option>
              <option value="FLIGHT" className="bg-slate-900">Flights</option>
              <option value="HOTEL" className="bg-slate-900">Hotels</option>
              <option value="VILLA" className="bg-slate-900">Villas & Homestays</option>
              <option value="PACKAGE" className="bg-slate-900">Holiday Packages</option>
              <option value="TRAIN" className="bg-slate-900">Trains</option>
              <option value="BUS" className="bg-slate-900">Buses</option>
              <option value="CAB" className="bg-slate-900">Cabs</option>
              <option value="TOUR" className="bg-slate-900">Tours</option>
              <option value="VISA" className="bg-slate-900">Visa</option>
              <option value="INSURANCE" className="bg-slate-900">Insurance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Financial & Booking KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Confirmed GMV</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            ₹{(overview?.total_revenue ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active Confirmed Bookings</span>
          </div>
        </div>

        {/* Platform Earnings */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Platform Net Earnings</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-brand-400 tabular-nums">
            ₹{(overview?.platform_earnings ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Avg. 5.5% Service &amp; Markup Yield
          </div>
        </div>

        {/* Total Bookings */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            {overview?.total_bookings ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            <span className="text-emerald-400">{overview?.confirmed_bookings ?? 0} Confirmed</span> •{' '}
            <span className="text-amber-400">{overview?.pending_bookings ?? 0} Pending</span> •{' '}
            <span className="text-rose-400">{overview?.cancelled_bookings ?? 0} Cancelled</span>
          </div>
        </div>

        {/* Customers & Partners */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Platform Users</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            {overview?.total_customers ?? 0} Customers
          </div>
          <div className="text-[11px] text-indigo-400 font-medium">
            {overview?.total_partners ?? 0} Registered Agency Partners
          </div>
        </div>
      </div>

      {/* Financial Reconciliation & Channel Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Settlement & Escrow */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Payment &amp; Financial Settlement
              </h2>
              <p className="text-[11px] text-slate-400">PostgreSQL Live Reconciled Transaction Log</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              PAYMENTS RECONCILED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Total Collected</div>
              <div className="text-lg font-bold text-emerald-400 mt-1 tabular-nums">
                ₹{(overview?.payment_stats?.collected_amount ?? 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {overview?.payment_stats?.successful ?? 0} successful settlements
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Total Refunded</div>
              <div className="text-lg font-bold text-rose-400 mt-1 tabular-nums">
                ₹{(overview?.payment_stats?.refunded_amount ?? 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {overview?.payment_stats?.refunded ?? 0} cancellations processed
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Payment Success Rate</div>
              <div className="text-lg font-bold text-white mt-1 tabular-nums">
                {overview?.payment_stats?.total 
                  ? Math.round(((overview.payment_stats.successful || 0) / overview.payment_stats.total) * 100) 
                  : 100}%
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                {overview?.payment_stats?.total ?? 0} total transactions
              </div>
            </div>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Channel Distribution</h2>
            <p className="text-[11px] text-slate-400">B2C Direct vs B2B Partner Portal</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">B2C Consumer Web &amp; App</span>
                <span className="text-brand-400 font-bold">{overview?.b2c_bookings ?? 0} Bookings</span>
              </div>
              <div className="text-sm font-bold text-slate-200">
                ₹{(overview?.b2c_revenue ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">B2B Travel Agencies</span>
                <span className="text-indigo-400 font-bold">{overview?.b2b_bookings ?? 0} Bookings</span>
              </div>
              <div className="text-sm font-bold text-slate-200">
                ₹{(overview?.b2b_revenue ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 10 Travel Services Inventory Health Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              10 Travel Services Inventory Health
            </h2>
            <p className="text-xs text-slate-400">
              Complete inventory status across all active travel verticals
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20">
            10 / 10 Verticals Connected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {travelServices.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-brand-400 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ONLINE
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white truncate">{svc.title}</div>
                  <div className="text-sm font-extrabold text-slate-200 mt-0.5">
                    {svc.active} <span className="text-[10px] font-normal text-slate-500">/ {svc.total}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{svc.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Master Reference Datasets */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              Master Reference Discovery Datasets
            </h2>
            <p className="text-[11px] text-slate-400">
              Normalized location tables powering unified global destination search and intelligent autocomplete
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            NORMALIZED POSTGRESQL
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">Airports</div>
            <div className="text-xl font-bold text-sky-400 mt-1">{masterData.airports ?? 69}</div>
            <div className="text-[10px] text-slate-500">IATA Indexed</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">Railway Stations</div>
            <div className="text-xl font-bold text-sky-400 mt-1">{masterData.stations ?? 47}</div>
            <div className="text-[10px] text-slate-500">IRCTC Divisions</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">Bus Terminals</div>
            <div className="text-xl font-bold text-sky-400 mt-1">{masterData.terminals ?? 20}</div>
            <div className="text-[10px] text-slate-500">ISBT Terminals</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">Destinations</div>
            <div className="text-xl font-bold text-sky-400 mt-1">{masterData.destinations ?? 66}</div>
            <div className="text-[10px] text-slate-500">Global Cities</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">Countries</div>
            <div className="text-xl font-bold text-sky-400 mt-1">{masterData.countries ?? 55}</div>
            <div className="text-[10px] text-slate-500">ISO-3166 Codes</div>
          </div>
        </div>
      </div>

      {/* Recent Bookings & Transactions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bookings */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-white">Recent Customer Bookings</h2>
            <span className="text-[11px] text-slate-500">Latest 10 orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2">ID</th>
                  <th className="py-2 px-2">Service</th>
                  <th className="py-2 px-2">Amount</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {(overview?.recent_bookings || []).slice(0, 6).map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-900/50">
                    <td className="py-2 px-2 font-mono text-[11px] text-slate-400">
                      {b.id.substring(0, 8)}...
                    </td>
                    <td className="py-2 px-2 font-medium text-white">
                      {b.service_type || 'TRAVEL'}
                    </td>
                    <td className="py-2 px-2 font-semibold tabular-nums">
                      ₹{parseFloat(b.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : b.status === 'CANCELLED'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!overview?.recent_bookings || overview.recent_bookings.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No recent bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-white">Settlement Transactions</h2>
            <span className="text-[11px] text-slate-500">Payment Gateway Audit</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2">Gateway Txn</th>
                  <th className="py-2 px-2">Method</th>
                  <th className="py-2 px-2">Amount</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {(overview?.recent_transactions || []).slice(0, 6).map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-900/50">
                    <td className="py-2 px-2 font-mono text-[11px] text-slate-400">
                      {tx.gateway_transaction_id || tx.id.substring(0, 10)}
                    </td>
                    <td className="py-2 px-2 uppercase font-mono text-[11px] text-slate-300">
                      {tx.payment_method || 'CARD'}
                    </td>
                    <td className="py-2 px-2 font-semibold tabular-nums text-white">
                      ₹{parseFloat(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tx.status === 'SUCCESS' || tx.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : tx.status === 'REFUNDED'
                            ? 'bg-indigo-500/15 text-indigo-400'
                            : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!overview?.recent_transactions || overview.recent_transactions.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No recent transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
