import React, { useState } from 'react';
import { ScreenType } from '../components/Header';
import { UserProfile, registerMyBizApi, MyBizContext, MyBizCompany } from '../services/api';

interface MyBizLandingPageProps {
  onNavigate: (screen: ScreenType) => void;
  user: UserProfile | null;
  bizContext: MyBizContext | null;
  onOpenAuth: () => void;
  onBizRegistered: (company: MyBizCompany) => void;
}

export const MyBizLandingPage: React.FC<MyBizLandingPageProps> = ({
  onNavigate,
  user,
  bizContext,
  onOpenAuth,
  onBizRegistered,
}) => {
  const [showRegModal, setShowRegModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [industry, setIndustry] = useState('Technology & IT');
  const [employeeRange, setEmployeeRange] = useState('11-50');
  const [billingAddress, setBillingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [website, setWebsite] = useState('');

  const handleStartRegistration = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setShowRegModal(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMsg('Company name is required');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const company = await registerMyBizApi({
        company_name: companyName.trim(),
        gstin: gstin.trim().toUpperCase() || undefined,
        pan: pan.trim().toUpperCase() || undefined,
        industry,
        employee_count_range: employeeRange,
        billing_address: billingAddress.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        website: website.trim() || undefined,
      });
      onBizRegistered(company);
      setShowRegModal(false);
      onNavigate('mybiz-dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Registration failed';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a192f] via-[#0d233e] to-[#071322] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1240px] mx-auto relative z-10">
          {/* Breadcrumb / badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-400/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>MakeMyTrip myBiz Feature Parity &bull; Corporate Travel Engine</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/30">
                  B
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    my<span className="text-amber-400">Biz</span>
                  </h2>
                  <p className="text-xs text-slate-300 uppercase tracking-widest font-bold">
                    By SS Journey &bull; Smart Business Travel
                  </p>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Corporate travel made <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-100">
                  effortless, compliant & savings-driven
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Unlock exclusive corporate flight & hotel fares, automated GST invoices for 100% input tax credit (ITC), customized employee travel policies, and transparent multi-tier approvals.
              </p>

              {/* Key Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-2xl font-black text-amber-400">Up to 25%</p>
                  <p className="text-xs text-slate-300 mt-0.5">Corporate Travel Savings</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-2xl font-black text-emerald-400">100% ITC</p>
                  <p className="text-xs text-slate-300 mt-0.5">Assured GST Invoices</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-2xl font-black text-sky-400">2-Min</p>
                  <p className="text-xs text-slate-300 mt-0.5">Instant Self-Onboarding</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                {bizContext?.is_biz_user ? (
                  <button
                    onClick={() => onNavigate('mybiz-dashboard')}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition transform hover:-translate-y-0.5 flex items-center space-x-2"
                  >
                    <span>Open myBiz Dashboard</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleStartRegistration}
                    className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition transform hover:-translate-y-0.5 flex items-center space-x-2"
                  >
                    <span>Register Business Account &bull; Free</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}

                <button
                  onClick={() => {
                    const el = document.getElementById('mybiz-features');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition"
                >
                  Explore All Features
                </button>
              </div>
            </div>

            {/* Right Card / Visual Showcase */}
            <div className="lg:col-span-5">
              <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/60 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Corporate Suite</span>
                  </div>
                  <span className="text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    Zero Setup Fee
                  </span>
                </div>

                <div className="mt-5 space-y-3.5">
                  <div className="flex items-start space-x-3.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-sm font-black">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">GST Invoicing & Input Tax Credit</p>
                      <p className="text-xs text-slate-400 mt-0.5">Claim up to 18% GST credit on every employee hotel & airfare booking automatically.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-sm font-black">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Custom Travel Policy Guardrails</p>
                      <p className="text-xs text-slate-400 mt-0.5">Define price caps for flights, 3-star/4-star limits for hotels, and advance booking days.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-sm font-black">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Approval Workflows</p>
                      <p className="text-xs text-slate-400 mt-0.5">Employees submit itineraries; line managers or travel admins approve or reject with 1 click.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-sm font-black">
                      4
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Centralized Trip Reports & Invoices</p>
                      <p className="text-xs text-slate-400 mt-0.5">Export finance-ready MIS reports and consolidated invoice packs with GST tax breakups.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Ready to join your company?</span>
                  <button
                    onClick={handleStartRegistration}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
                  >
                    Start in 2 minutes &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON STRIP ── */}
      <section className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="pt-2 md:pt-0">
            <p className="text-2xl font-black text-slate-900">50,000+</p>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Businesses Registered</p>
          </div>
          <div className="pt-2 md:pt-0">
            <p className="text-2xl font-black text-blue-600">18% GST</p>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Avg. Input Tax Credit Recovered</p>
          </div>
          <div className="pt-2 md:pt-0">
            <p className="text-2xl font-black text-emerald-600">Free Flexi</p>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Cancellation & Rescheduling Perks</p>
          </div>
          <div className="pt-2 md:pt-0">
            <p className="text-2xl font-black text-amber-600">100%</p>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Policy Compliance Guarantee</p>
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES GRID (EXACT MYBIZ CAPABILITIES) ── */}
      <section id="mybiz-features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
            Features & Capabilities
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Everything your company needs to control business travel
          </h3>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">
            Engineered to replicate MakeMyTrip myBiz exact business account suite for SMEs, startups, and large enterprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Guaranteed GST Invoicing</h4>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Attach company GSTIN & billing address across all airline and hotel bookings. Instant access to GST compliant tax invoices with CGST/SGST/IGST breakdown.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Custom Travel Policies</h4>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Set spending limits per service (flights, hotels, cabs, buses). Prevent out-of-policy bookings with automated system alerts or forced approval routing.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Manager Approval Hierarchy</h4>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Employees can create trip requests with estimated budget & travel dates. Approvers receive instant notifications to approve or reject with comments.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Employee Role Management</h4>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Add corporate staff with designated roles: Business Admin, Travel Approver, or Employee. Assign departments and designations for fine-grained policy rules.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Detailed Spend Analytics</h4>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Comprehensive analytics dashboard showing total expenditure, average booking ticket size, month-on-month trends, and breakdown across departments.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Corporate Fares & Special Benefits</h4>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Search results indicate corporate-rate availability with free seat selection, low cancellation penalties, and complimentary corporate flight meals.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS 3-STEP BANNER ── */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto">
          <h3 className="text-center text-2xl font-black text-slate-900 mb-10">
            How myBiz Works for Your Organization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-amber-500/20">
                1
              </div>
              <h4 className="font-bold text-base text-slate-900">Register Your Business</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                Enter your company name, GSTIN, and corporate address in under 2 minutes. Free with zero commitment.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-600/20">
                2
              </div>
              <h4 className="font-bold text-base text-slate-900">Add Staff & Configure Policies</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                Invite team members, assign approvers, and set budget limits for flights, hotels, and local transit.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-600/20">
                3
              </div>
              <h4 className="font-bold text-base text-slate-900">Book & Reclaim GST Credits</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                Employees book compliant travel. Invoices are automatically gathered into your central finance dashboard.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleStartRegistration}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition transform hover:-translate-y-0.5"
            >
              Get Started with myBiz Now
            </button>
          </div>
        </div>
      </section>

      {/* ── REGISTRATION MODAL ── */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 my-8">
            <div className="sticky top-0 bg-gradient-to-r from-[#0a192f] to-[#112d4e] text-white px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                  B
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Register Company for myBiz</h3>
                  <p className="text-[11px] text-slate-300">Fast 2-minute business setup</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Company / Legal Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Technologies Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company GSTIN <span className="text-slate-400 font-normal">(for GST Invoicing)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full text-sm uppercase px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company PAN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    className="w-full text-sm uppercase px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="Technology & IT">Technology & IT</option>
                    <option value="Consulting & Advisory">Consulting & Advisory</option>
                    <option value="Manufacturing & Retail">Manufacturing & Retail</option>
                    <option value="Finance & Banking">Finance & Banking</option>
                    <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee Count</label>
                  <select
                    value={employeeRange}
                    onChange={(e) => setEmployeeRange(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="1-10">1 - 10 employees</option>
                    <option value="11-50">11 - 50 employees</option>
                    <option value="51-200">51 - 200 employees</option>
                    <option value="201-500">201 - 500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Billing Address <span className="text-slate-400 font-normal">(appears on GST invoices)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Street address, building, floor"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Website</label>
                <input
                  type="text"
                  placeholder="https://acme.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Business Account...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
