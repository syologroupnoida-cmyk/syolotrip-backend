import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag, Check, Copy, Sparkles, RefreshCw } from 'lucide-react';
import { getAdminCoupons } from '../services/api';

export const CouponsManagement: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: coupons, refetch, isFetching } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: getAdminCoupons,
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const defaultCoupons = [
    { code: 'MMTFLIGHT', discount: '₹1,250 FLAT OFF', min_order: 5000, service: 'FLIGHT', status: 'ACTIVE', desc: 'Instant savings on all domestic & international flight bookings.' },
    { code: 'MMTHOTEL', discount: '25% OFF (Up to ₹2,500)', min_order: 3000, service: 'HOTEL', status: 'ACTIVE', desc: 'Valid across handpicked luxury villas, 5-star & boutique properties.' },
    { code: 'MMTHOLIDAY', discount: '₹2,500 FLAT OFF', min_order: 15000, service: 'PACKAGE', status: 'ACTIVE', desc: 'Applicable on complete flight + stay + sightseeing holiday bundles.' },
    { code: 'MMTTRAIN', discount: 'Zero Booking Fee', min_order: 800, service: 'TRAIN', status: 'ACTIVE', desc: '100% gateway charges waived on IRCTC confirmed tickets.' },
    { code: 'MMTBUS', discount: '₹200 Instant Off', min_order: 700, service: 'BUS', status: 'ACTIVE', desc: 'Valid on Zingbus, IntrCity, NueGo EV, and all Primo luxury sleeper coaches.' },
    { code: 'MMTCAB', discount: '₹100 Toll Cashback', min_order: 500, service: 'CAB', status: 'ACTIVE', desc: 'Flat discount on airport transfers and outstation sedan rides.' },
    { code: 'MYBIZCORP', discount: 'Corporate 10% Extra', min_order: 10000, service: 'MYBIZ', status: 'ACTIVE', desc: 'Special tariff for corporate employees and business accounts with GST input.' },
  ];

  const items = coupons && coupons.length > 0 ? coupons : defaultCoupons;

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
            Configure platform discounts, promo codes, and special seasonal travel offers.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Offers</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c: any) => (
          <div
            key={c.code}
            className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 hover:border-brand-500/40 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {c.service}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {c.status}
              </span>
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
              <div className="text-base font-extrabold text-white">{c.discount}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{c.desc || 'Special promotional tariff code.'}</p>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
              <span>Min booking: <strong className="text-slate-300">₹{c.min_order?.toLocaleString?.() || c.min_order}</strong></span>
              <span className="text-brand-400 font-semibold">Active in Engine</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
