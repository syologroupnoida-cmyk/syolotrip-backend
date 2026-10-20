import React, { useState } from 'react';
import { 
  Search, Calendar, MapPin, 
  Users, ArrowRight, ShieldCheck, Tag, Sparkles, CheckCircle2 
} from 'lucide-react';

interface HomePageProps {
  activeTab: 'flights' | 'hotels' | 'buses' | 'packages';
  setActiveTab: (tab: 'flights' | 'hotels' | 'buses' | 'packages') => void;
}

export const HomePage: React.FC<HomePageProps> = () => {
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [fromLocation] = useState('New Delhi (DEL)');
  const [toLocation] = useState('Mumbai (BOM)');

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative pt-6 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-brand-900 via-brand-800 to-slate-900 text-white rounded-b-[40px] shadow-2xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-accent-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-brand-200 border border-white/15 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent-orange" />
              <span>Next-Gen Travel Engine • Sprint 1 Foundation</span>
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Where to next? Discover Your Journey.
            </h1>
            <p className="text-base text-slate-300">
              Explore flights, handpicked resorts, intercity bus routes, and curated holiday packages.
            </p>
          </div>

          {/* MakeMyTrip Inspired Floating Search Container */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-800 shadow-float border border-slate-100">
            {/* Search Type Sub-Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setTripType('oneway')}
                  className={`flex items-center gap-2 text-sm font-semibold transition ${
                    tripType === 'oneway' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    tripType === 'oneway' ? 'border-brand-600' : 'border-slate-300'
                  }`}>
                    {tripType === 'oneway' && <span className="w-2 h-2 rounded-full bg-brand-600" />}
                  </span>
                  One Way
                </button>
                <button
                  type="button"
                  onClick={() => setTripType('roundtrip')}
                  className={`flex items-center gap-2 text-sm font-semibold transition ${
                    tripType === 'roundtrip' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    tripType === 'roundtrip' ? 'border-brand-600' : 'border-slate-300'
                  }`}>
                    {tripType === 'roundtrip' && <span className="w-2 h-2 rounded-full bg-brand-600" />}
                  </span>
                  Round Trip
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Book International & Domestic Fares
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-6">
              {/* Origin */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>From</span>
                </div>
                <div className="mt-1 font-bold text-lg text-slate-900 group-hover:text-brand-700 transition-colors">
                  {fromLocation.split(' ')[0]}
                </div>
                <div className="text-xs text-slate-500 truncate">{fromLocation}</div>
              </div>

              {/* Destination */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-accent-orange" />
                  <span>To</span>
                </div>
                <div className="mt-1 font-bold text-lg text-slate-900 group-hover:text-brand-700 transition-colors">
                  {toLocation.split(' ')[0]}
                </div>
                <div className="text-xs text-slate-500 truncate">{toLocation}</div>
              </div>

              {/* Date */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>Departure</span>
                </div>
                <div className="mt-1 font-bold text-lg text-slate-900 group-hover:text-brand-700 transition-colors">
                  20 Oct 2026
                </div>
                <div className="text-xs text-slate-500">Tuesday</div>
              </div>

              {/* Travellers / Class */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <Users className="w-3.5 h-3.5 text-brand-600" />
                  <span>Travellers & Class</span>
                </div>
                <div className="mt-1 font-bold text-lg text-slate-900 group-hover:text-brand-700 transition-colors">
                  1 Traveller
                </div>
                <div className="text-xs text-slate-500">Economy Class</div>
              </div>
            </div>

            {/* Search Action Button */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className="px-12 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-extrabold text-lg shadow-lg shadow-brand-600/30 hover:shadow-brand-600/40 transform hover:-translate-y-0.5 transition-all flex items-center gap-3"
              >
                <Search className="w-5 h-5" />
                <span>SEARCH FLIGHTS</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Deterministic Mock Inventory</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Clean provider adapter pattern ensuring seamless migration to production GDS/supplier APIs in Phase 2.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Server-Side Price Integrity</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                All fare quotes and fee breakdowns are validated server-side to prevent duplicate or tampered checkouts.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Simulated Safe Checkout</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                End-to-end booking verification, automated confirmation references, and instant simulated cancellation workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Popular Getaways</h2>
            <p className="text-sm text-slate-500 mt-0.5">Top trending destinations with simulated inventory</p>
          </div>
          <button className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { city: 'Goa', country: 'India', price: '₹4,499', tag: 'Beaches & Nightlife', imageBg: 'from-amber-600 to-orange-700' },
            { city: 'Dubai', country: 'UAE', price: '₹14,999', tag: 'Luxury & Skyline', imageBg: 'from-indigo-600 to-blue-800' },
            { city: 'Manali', country: 'India', price: '₹3,299', tag: 'Mountains & Treks', imageBg: 'from-emerald-700 to-teal-900' },
            { city: 'Bangkok', country: 'Thailand', price: '₹12,450', tag: 'Culture & Shopping', imageBg: 'from-rose-600 to-pink-800' },
          ].map((dest, i) => (
            <div
              key={i}
              className="group relative rounded-2xl overflow-hidden shadow-card card-hover-effect border border-slate-200/80 bg-white"
            >
              <div className={`h-44 bg-gradient-to-tr ${dest.imageBg} relative p-4 flex flex-col justify-between text-white`}>
                <span className="self-start text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md">
                  {dest.tag}
                </span>
                <div>
                  <h4 className="text-2xl font-black">{dest.city}</h4>
                  <p className="text-xs text-white/80">{dest.country}</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Starting from</span>
                  <div className="text-lg font-black text-brand-700">{dest.price}</div>
                </div>
                <button className="px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-700 font-bold text-xs transition-colors">
                  View Offers
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
