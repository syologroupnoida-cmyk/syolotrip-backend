import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Search, RefreshCw, CheckCircle, XCircle, 
  Mail, Phone, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { getAdminCustomers, updateAdminCustomerStatus } from '../services/api';

export const CustomersManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Modal states
  const [suspendModalCustomer, setSuspendModalCustomer] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Query customers
  const { data: customers, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminCustomers', searchTerm, statusFilter],
    queryFn: () => getAdminCustomers({
      search: searchTerm || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
  });

  // Suspend / Activate Mutation
  const statusMutation = useMutation({
    mutationFn: ({ customerId, is_active, reason }: { customerId: string; is_active: boolean; reason?: string }) =>
      updateAdminCustomerStatus(customerId, { is_active, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] });
      setSuspendModalCustomer(null);
      setSuspendReason('');
    },
  });

  const list = customers || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            Customers &amp; Traveler Profiles
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Oversee registered travelers, manage account standing, view lifetime booking expenditure, and enforce suspensions.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="text-slate-500 text-[11px] font-medium mr-1">Status:</span>
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                statusFilter === s
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s === 'ALL' ? 'All Customers' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-500" />
            <p className="text-xs">Loading customer accounts from PostgreSQL...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-500/80 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No Customers Found</div>
            <p className="text-xs text-slate-500">No customer profiles match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Orders &amp; Spend</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {list.map((c: any) => {
                  const isActive = c.is_active !== false;
                  return (
                    <tr key={c.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs uppercase">
                            {c.full_name ? c.full_name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {c.full_name || 'Traveler'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ID: {c.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white tabular-nums">
                          ₹{parseFloat(c.total_spent || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-brand-400 font-medium">
                          {c.total_bookings || 0} completed bookings
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSuspendModalCustomer(c);
                            setSuspendReason('');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            isActive
                              ? 'border-rose-500/30 text-rose-400 hover:bg-rose-950/40'
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                        >
                          {isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspend / Reactivate Modal */}
      {suspendModalCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                suspendModalCustomer.is_active !== false 
                  ? 'bg-rose-500/10 text-rose-400' 
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {suspendModalCustomer.is_active !== false ? 'Suspend Customer Account' : 'Reactivate Customer Account'}
                </h3>
                <p className="text-xs text-slate-400">{suspendModalCustomer.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              {suspendModalCustomer.is_active !== false
                ? 'Suspending this customer prevents future logins and booking creations. All active bookings remain preserved in PostgreSQL.'
                : 'Reactivating this customer will restore their booking permissions and portal access immediately.'}
            </p>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase">
                Administrative Audit Reason
              </label>
              <textarea
                rows={3}
                placeholder="Reason for suspension or reactivation (required for audit logging)..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSuspendModalCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={statusMutation.isPending || (suspendModalCustomer.is_active !== false && !suspendReason.trim())}
                onClick={() => {
                  const newStatus = suspendModalCustomer.is_active === false;
                  statusMutation.mutate({
                    customerId: suspendModalCustomer.id,
                    is_active: newStatus,
                    reason: suspendReason.trim() || undefined,
                  });
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer ${
                  suspendModalCustomer.is_active !== false
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {statusMutation.isPending ? 'Updating...' : suspendModalCustomer.is_active !== false ? 'Confirm Suspension' : 'Reactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
