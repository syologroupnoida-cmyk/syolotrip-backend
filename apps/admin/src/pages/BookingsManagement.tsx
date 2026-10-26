import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, Search, Filter, RefreshCw, CheckCircle, Clock, XCircle, AlertCircle, Check, X, RotateCcw } from 'lucide-react';
import { getAdminBookings, updateAdminBookingStatus } from '../services/api';

export const BookingsManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminBookings', statusFilter],
    queryFn: () => getAdminBookings(statusFilter ? { status: statusFilter } : undefined),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAdminBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
    },
  });


  const bookings = data?.items || [];

  const filteredBookings = bookings.filter((b: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const ref = (b.booking_reference || b.bookingReference || b.id || '').toLowerCase();
    const email = (b.contact_email || b.contactEmail || '').toLowerCase();
    const phone = (b.contact_phone || b.contactPhone || '').toLowerCase();
    return ref.includes(term) || email.includes(term) || phone.includes(term);
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" />
          Confirmed
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    }
    if (s === 'REFUNDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <RotateCcw className="w-3 h-3" />
          Refunded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
        <AlertCircle className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-400" />
            Bookings & Orders
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management and inspection of customer reservations and payments.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search reference, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          {[
            { label: 'All', value: '' },
            { label: 'Confirmed', value: 'CONFIRMED' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Cancelled', value: 'CANCELLED' },
            { label: 'Refunded', value: 'REFUNDED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Booking Ref</th>
                <th className="px-5 py-3.5">Service</th>
                <th className="px-5 py-3.5">Customer Contact</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading bookings from backend...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No bookings found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b: any) => {
                  const ref = b.booking_reference || b.bookingReference || b.id;
                  const service = b.service_type || b.serviceType || 'TRAVEL';
                  const email = b.contact_email || b.contactEmail || 'N/A';
                  const phone = b.contact_phone || b.contactPhone || '';
                  const total = b.price_breakdown?.total_amount ?? b.priceBreakdown?.totalAmount ?? 0;
                  const currency = b.price_breakdown?.currency || b.priceBreakdown?.currency || 'INR';
                  const date = b.created_at || b.createdAt ? new Date(b.created_at || b.createdAt).toLocaleString() : 'N/A';
                  const currentStatus = (b.status || '').toUpperCase();

                  return (
                    <tr key={b.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-5 py-4 font-mono font-bold text-white">
                        {ref}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                          {service}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-white">{email}</div>
                        {phone && <div className="text-[11px] text-slate-500">{phone}</div>}
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">
                        ₹{Number(total).toLocaleString()}
                        <span className="text-[10px] text-slate-500 ml-1">{currency}</span>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(b.status)}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {date}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {currentStatus !== 'CONFIRMED' && currentStatus !== 'REFUNDED' && (
                            <button
                              onClick={() => statusMutation.mutate({ id: b.id, status: 'CONFIRMED' })}
                              disabled={statusMutation.isPending}
                              title="Mark Confirmed"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Confirm</span>
                            </button>
                          )}
                          {currentStatus !== 'CANCELLED' && currentStatus !== 'REFUNDED' && (
                            <button
                              onClick={() => statusMutation.mutate({ id: b.id, status: 'CANCELLED' })}
                              disabled={statusMutation.isPending}
                              title="Mark Cancelled"
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Cancel</span>
                            </button>
                          )}
                          {currentStatus === 'CANCELLED' && (
                            <button
                              onClick={() => statusMutation.mutate({ id: b.id, status: 'REFUNDED' })}
                              disabled={statusMutation.isPending}
                              title="Process & Record Refund"
                              className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Refund</span>
                            </button>
                          )}
                          {currentStatus === 'REFUNDED' && (
                            <span className="text-[11px] font-semibold text-purple-400/90 font-mono">
                              Settled ✓
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
