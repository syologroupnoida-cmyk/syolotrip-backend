import React, { useState } from 'react';
import { ScreenType } from '../components/Header';
import { UserProfile, MyBizContext } from '../services/api';

interface BusinessLandingPageProps {
  onNavigate: (screen: ScreenType) => void;
  user: UserProfile | null;
  bizContext: MyBizContext | null;
  onOpenAuth: () => void;
}

export const BusinessLandingPage: React.FC<BusinessLandingPageProps> = ({
  onNavigate,
  user: _user,
  bizContext: _bizContext,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is Syolo Travels myBiz?',
      a: 'Syolo Travels myBiz is our enterprise business travel management platform designed specifically for corporate companies and travel agencies. It streamlines travel bookings, automated expense reporting, travel policy compliance, manager approvals, and GST input tax credit recovery from one centralized platform.',
    },
    {
      q: 'How does myBiz help us save up to 18% on GST?',
      a: 'When you book corporate travel through myBiz, all hotel, flight, train, bus, and cab invoices are issued directly with your company GSTIN and state of registration. This enables your finance department to automatically claim input tax credit (ITC) on all eligible bookings.',
    },
    {
      q: 'Can our employees book their own travel directly?',
      a: 'Yes. You can invite employees with designated roles. Employees can search and select flights and hotels within your corporate travel policy. If a booking requires manager sign-off, an automated approval request is instantly routed to their reporting manager.',
    },
    {
      q: 'How does it work for Travel Agencies and Agents?',
      a: 'Travel agencies can register under the Travel Agency account type to gain access to B2B special net fares, sub-agent management with granular permissions, custom commission and markup controls, and centralized client booking statements.',
    },
    {
      q: 'Is there a setup or annual subscription fee for myBiz?',
      a: 'No. Syolo Travels myBiz is completely free to set up and use. There are zero upfront setup fees, no software license subscriptions, and no hidden monthly platform maintenance charges.',
    },
    {
      q: 'What payment methods are supported for corporate travel?',
      a: 'We support corporate credit cards, net banking, UPI, company debit cards, and pre-funded enterprise wallets. Approved corporate accounts can also apply for credit-term billing with consolidated monthly settlement.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* ── 1. HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c1e38] via-[#0f2747] to-[#071322] text-white pt-14 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1240px] mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-400/30 px-4 py-1.5 rounded-full text-xs font-bold text-amber-300 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="tracking-wide">SYOLO TRAVELS myBiz &bull; ENTERPRISE B2B PLATFORM</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Smarter Business Travel Starts with{' '}
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                  Syolo Travels myBiz
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Manage your company's business travel, employee bookings, approvals, billing and reporting from one centralized platform. Designed for modern corporate teams and travel agencies across India.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('business-register')}
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 hover:shadow-orange-500/40 transition duration-200 cursor-pointer flex items-center space-x-2"
                >
                  <span>Get Started for Free</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('business-login')}
                  className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm tracking-wide backdrop-blur-xs transition duration-200 cursor-pointer flex items-center space-x-2"
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span>Business Login</span>
                </button>
              </div>

              {/* Trust Stats Bar */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-700/60 max-w-lg">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-400">18%</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Input Tax Credit on GST</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white">100%</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Policy Compliance</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400">24/7</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Dedicated Priority Desk</p>
                </div>
              </div>
            </div>

            {/* Right Card Mockup */}
            <div className="lg:col-span-5">
              <div className="relative bg-gradient-to-b from-slate-800/90 to-slate-900/95 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                      B
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">myBiz Command Center</h4>
                      <p className="text-[11px] text-slate-400">Corporate & Agency Dashboard</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Portal
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Bengaluru &rarr; Mumbai</p>
                        <p className="text-[10px] text-slate-400">6E-512 &bull; Sales Dept &bull; Policy Approved</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">₹4,850</span>
                  </div>

                  <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">apartment</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Taj Club Stays (Deluxe)</p>
                        <p className="text-[10px] text-slate-400">2 Nights &bull; GST Invoice Generated</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">₹14,200</span>
                  </div>

                  <div className="bg-amber-500/10 rounded-xl p-3.5 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">approval</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-200">Trip Request Pending</p>
                        <p className="text-[10px] text-amber-300/80">Engineering Team &bull; Delhi Offsite</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-900">
                      Approve
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Monthly Corporate Spend</span>
                  <span className="font-mono font-bold text-white text-sm">₹3,45,200</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TWO PILLARS: CORPORATES & AGENCIES ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black tracking-widest uppercase text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
            Tailored Experiences
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-3 tracking-tight">
            Designed for Corporates &amp; Travel Agencies Alike
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Whether managing employee travel budgets or scaling travel agency client bookings, myBiz provides specialized tooling for your exact operating model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Corporate Companies */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-amber-400/80 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 shadow-sm border border-amber-100">
                <span className="material-symbols-outlined text-[28px]">corporate_fare</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                For Corporate Companies
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Empower your HR, finance, and travel administrators to control travel expenses, automate approvals, and maintain 100% policy compliance.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Automated travel policy checks before checkout',
                  '1-Click hierarchical manager approval workflows',
                  'Departmental budgeting and spend limits',
                  'Special corporate fares with free meals and seat selection',
                  'Automated monthly consolidated GST invoices for ITC claims',
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">check_circle</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate('business-register')}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Register as Corporate</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card 2: Travel Agencies */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-blue-400/80 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <span className="material-symbols-outlined text-[28px]">travel_explore</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                For Travel Agencies &amp; Agents
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Expand your agency revenue with high-speed B2B search, multi-agent management, custom commission controls, and centralized client billing.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Sub-agent logins with role-based booking access',
                  'Dynamic markup and commission management on flights and hotels',
                  'Instant client vouchers and white-label GST tax invoices',
                  'Centralized booking history with agency-wide analytics',
                  'Bulk booking support across Flights, Hotels, Buses, Trains & Cabs',
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                    <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0">check_circle</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate('business-register')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20"
              >
                <span>Register as Travel Agency</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. UNIFIED TRAVEL SERVICES ── */}
      <section className="py-16 bg-slate-100 border-y border-slate-200">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              One Unified Inventory Across All Travel Modes
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mt-2">
              Book, manage, and settle all employee and customer travel in a single unified flow.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: 'Flights', icon: 'flight', color: 'text-sky-500', bg: 'bg-sky-50', desc: 'Corporate fares with free meals, flexible reschedule & cancellation' },
              { title: 'Hotels & Stays', icon: 'hotel', color: 'text-indigo-500', bg: 'bg-indigo-50', desc: 'Pre-negotiated corporate rates, late checkouts & breakfast included' },
              { title: 'IRCTC Trains', icon: 'train', color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Official IRCTC integration with instant PNR issuance & seat choice' },
              { title: 'Buses', icon: 'directions_bus', color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Over 50,000+ luxury Volvo & sleeper routes across India' },
              { title: 'Cabs & Airport', icon: 'local_taxi', color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Reliable airport transfers, hourly rentals & outstation cabs' },
            ].map((svc, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
                <div className={`w-12 h-12 rounded-xl ${svc.bg} ${svc.color} flex items-center justify-center mb-4`}>
                  <span className="material-symbols-outlined text-[26px]">{svc.icon}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{svc.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. KEY ENTERPRISE CAPABILITIES ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black tracking-widest uppercase text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
            Built for Scale
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-3 tracking-tight">
            Complete Control Over Corporate Travel Operations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[24px]">policy</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">Custom Travel Policies</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Define maximum flight budget caps, hotel star-rating permissions, booking window rules, and cabin class restrictions by department or seniority.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">Hierarchical Approvals</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Automate multi-tier managerial approval workflows. Travel managers receive real-time notifications with 1-click approvals right from mobile or web.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">GST-Compliant Invoices</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Receive 100% GST-compliant invoices containing your business GSTIN, PAN, and state code to seamlessly claim maximum Input Tax Credit.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. COMPARISON TABLE ── */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Why Companies Switch to Syolo Travels myBiz
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Comparing conventional unmanaged bookings vs the Syolo Travels myBiz platform.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="py-4 px-5 font-bold text-slate-400 uppercase tracking-wider">Features</th>
                  <th className="py-4 px-5 font-bold text-rose-400 uppercase tracking-wider">Unmanaged Retail Booking</th>
                  <th className="py-4 px-5 font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10">Syolo Travels myBiz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[
                  { feat: 'GST Input Tax Credit (ITC)', retail: 'Difficult to collect manual invoices', biz: '100% automated GSTIN invoices' },
                  { feat: 'Travel Policy Enforcement', retail: 'Manual expense audits after travel', biz: 'Automated pre-booking validation' },
                  { feat: 'Manager Approval Workflows', retail: 'Slow email chains & delayed bookings', biz: '1-Click instant mobile & web approvals' },
                  { feat: 'Special Corporate Fares', retail: 'Standard public retail rates', biz: 'Free meals, seats & flexible cancellation' },
                  { feat: 'Centralized Expense Analytics', retail: 'Spreadsheet reconciliation nightmare', biz: 'Real-time dashboard & automated exports' },
                  { feat: 'Dedicated Support Desk', retail: 'Standard consumer queue', biz: '24/7 dedicated priority account manager' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-5 font-semibold text-slate-200">{row.feat}</td>
                    <td className="py-3.5 px-5 text-slate-400 flex items-center space-x-2">
                      <span className="material-symbols-outlined text-[16px] text-rose-500">cancel</span>
                      <span>{row.retail}</span>
                    </td>
                    <td className="py-3.5 px-5 text-amber-300 font-medium bg-amber-500/5">
                      <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                        <span>{row.biz}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 6. FAQ SECTION ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[840px] mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-black tracking-widest uppercase text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
            Answers &amp; Clarity
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-3 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full py-4 px-6 text-left flex items-center justify-between font-bold text-sm text-slate-900 hover:text-amber-600 transition cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 text-slate-400 ${openFaq === idx ? 'rotate-180 text-amber-600' : ''}`}>
                  expand_more
                </span>
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. FINAL REGISTRATION CALL TO ACTION ── */}
      <section className="py-16 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-center px-4">
        <div className="max-w-[700px] mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Transform Your Business Travel?
          </h2>
          <p className="text-white/90 text-sm sm:text-base leading-relaxed">
            Join hundreds of forward-thinking enterprises and travel agencies across India saving time, money, and administrative effort today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('business-register')}
              className="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm tracking-wide shadow-xl transition cursor-pointer flex items-center space-x-2"
            >
              <span>Register Your Company</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('business-login')}
              className="px-8 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-sm tracking-wide transition cursor-pointer"
            >
              Sign In to myBiz
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
