import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Check, Copy, Sparkles, RefreshCw, Plus, Trash2, X, Power } from 'lucide-react';
import { getAdminCoupons, createAdminCoupon, updateAdminCoupon, deleteAdminCoupon } from '../services/api';

export const CouponsManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'FLAT',
    discount_value: 500,
    max_discount_amount: null as number | null,
    min_order_amount: 1500,
    service_type: 'ALL',
    description: '',
  });

  const { data: coupons, refetch, isFetching, isLoading } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: getAdminCoupons,
  });

  const createCouponMutation = useMutation({
    mutationFn: createAdminCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      setShowAddModal(false);
      setNewCoupon({
        code: '',
        discount_type: 'FLAT',
        discount_value: 500,
        max_discount_amount: null,
        min_order_amount: 1500,
        service_type: 'ALL',
        description: '',
      });
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ couponId, payload }: { couponId: string; payload: any }) =>
      updateAdminCoupon(couponId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: deleteAdminCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
    },
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    createCouponMutation.mutate({
      code: newCoupon.code.trim().toUpperCase(),
      discount_type: newCoupon.discount_type,
      discount_value: Number(newCoupon.discount_value),
      max_discount_amount: newCoupon.max_discount_amount ? Number(newCoupon.max_discount_amount) : null,
      min_order_amount: Number(newCoupon.min_order_amount),
      service_type: newCoupon.service_type,
      description: newCoupon.description,
      is_active: true,
    });
  };

  const items = coupons || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-400" />
            Offers, Coupons & Special Pricing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure database-backed platform discounts, promo codes, and special seasonal travel offers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Offer</span>
          </button>
        </div>
      </div>

      {/* Coupons Grid */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          Loading promotional offers from database...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
          No coupons configured yet. Click "Create Offer" above to seed your first platform discount.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c: any) => {
            const discountLabel = c.discount_type === 'PERCENTAGE'
              ? `${c.discount_value}% OFF${c.max_discount_amount ? ` (Up to ₹${c.max_discount_amount.toLocaleString()})` : ''}`
              : `₹${Number(c.discount_value).toLocaleString()} FLAT OFF`;

            return (
              <div
                key={c.id || c.code}
                className={`p-5 rounded-2xl bg-slate-950 border space-y-4 transition group ${
                  c.is_active ? 'border-slate-800 hover:border-brand-500/40' : 'border-slate-800/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {c.service_type || 'ALL'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCouponMutation.mutate({ couponId: c.id, payload: { is_active: !c.is_active } })}
                      title={c.is_active ? 'Deactivate coupon' : 'Activate coupon'}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer flex items-center gap-1 ${
                        c.is_active
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20'
                      }`}
                    >
                      <Power className="w-2.5 h-2.5" />
                      {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete coupon ${c.code}?`)) {
                          deleteCouponMutation.mutate(c.id);
                        }
                      }}
                      title="Delete coupon"
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Code Box */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-dashed border-slate-700 group-hover:border-brand-500/50 transition">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-mono font-black text-white text-sm tracking-wider">{c.code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(c.code)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Copy code"
                  >
                    {copiedCode === c.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-base font-extrabold text-white">{discountLabel}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{c.description || 'Verified platform discount.'}</p>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Min booking: <strong className="text-slate-300">₹{Number(c.min_order_amount || 0).toLocaleString()}</strong></span>
                  <span className="text-slate-400">Used: <strong>{c.times_used || 0} times</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-400" />
                Create New Platform Coupon
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER2026"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold tracking-wider focus:outline-none focus:border-brand-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Discount Type</label>
                  <select
                    value={newCoupon.discount_type}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="FLAT">Flat ₹ Amount</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {newCoupon.discount_type === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newCoupon.discount_value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCoupon.min_order_amount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, min_order_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional cap for %"
                    value={newCoupon.max_discount_amount || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, max_discount_amount: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Service Restriction</label>
                <select
                  value={newCoupon.service_type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, service_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="ALL">All Services</option>
                  <option value="FLIGHT">Flights Only</option>
                  <option value="HOTEL">Hotels Only</option>
                  <option value="TRAIN">Trains Only</option>
                  <option value="BUS">Buses Only</option>
                  <option value="CAB">Cabs Only</option>
                  <option value="PACKAGE">Holiday Packages Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Special festive promo for flight bookings"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCouponMutation.isPending}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {createCouponMutation.isPending ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
