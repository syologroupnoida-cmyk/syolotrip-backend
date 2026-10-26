import React, { useState, useEffect } from 'react';
import { ScreenType } from '../components/Header';
import { 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Headphones, 
  Percent, 
  Wallet, 
  Camera, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Users, 
  Globe2, 
  Star, 
  Calendar, 
  Smartphone, 
  PhoneCall,
  AlertCircle,
  Clock,
  Lock,
} from 'lucide-react';
import {
  registerPartnerApi,
  getPartnerProfileApi,
  getCurrentUserApi,
  registerApi,
  loginApi,
  PartnerProfileData,
  PartnerRegisterPayload,
} from '../services/api';
import type { UserProfile } from '@traveler/contracts';

interface ListPropertyPageProps {
  onNavigate: (screen: ScreenType) => void;
}

type PropertyType = 'Hotel' | 'Homestay / Villa' | 'Guest House' | 'Resort' | 'Apartment';

export const ListPropertyPage: React.FC<ListPropertyPageProps> = ({ onNavigate }) => {
  // Authentication & Partner Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [_partnerProfile, setPartnerProfile] = useState<PartnerProfileData | null>(null);

  // Form State
  const [formMode, setFormMode] = useState<'register' | 'login'>('register');
  const [propertyType, setPropertyType] = useState<PropertyType>('Hotel');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [roomsCount, setRoomsCount] = useState('1 - 5');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Status & Messaging State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<PartnerProfileData | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Check authenticated session and existing partner status on mount
  useEffect(() => {
    getCurrentUserApi().then((user) => {
      if (user) {
        setCurrentUser(user);
        setFullName(user.fullName || (user as any).full_name || '');
        setEmail(user.email || '');
        if (user.phone) setPhone(user.phone.replace(/\D/g, ''));

        // Check if user already has a partner profile
        getPartnerProfileApi()
          .then((profile) => {
            if (profile) {
              setPartnerProfile(profile);
              setSuccessData(profile);
              setRegistrationSuccess(true);
            }
          })
          .catch(() => {
            // No partner profile registered yet
          });
      }
    });
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!currentUser && (!password || password.length < 6)) {
      setErrorMessage('Please create an account password (minimum 6 characters) to manage your Partner Extranet.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Authenticate user if not already logged in
      if (!currentUser) {
        try {
          const authRes = await registerApi({
            email: email.trim(),
            full_name: fullName.trim(),
            password,
            phone: cleanPhone,
          });
          if (authRes.user) {
            setCurrentUser(authRes.user);
          }
        } catch (authErr: any) {
          const detail = authErr.response?.data?.detail;
          if (typeof detail === 'string' && (detail.toLowerCase().includes('already') || detail.toLowerCase().includes('exists'))) {
            // Attempt auto-login with existing credentials
            try {
              const loginRes = await loginApi(email.trim(), password);
              if (loginRes.user) {
                setCurrentUser(loginRes.user);
              }
            } catch {
              throw new Error('An account already exists with this email address. Please enter your existing account password or switch to Partner Login.');
            }
          } else {
            throw new Error(detail || 'Unable to create partner user account. Please check your details.');
          }
        }
      }

      // 2. Submit Partner Registration payload to live backend
      const businessType = (propertyType === 'Homestay / Villa' || propertyType === 'Apartment')
        ? 'HOMESTAY_HOST'
        : 'HOTELIER';

      const payload: PartnerRegisterPayload = {
        business_name: fullName.trim(),
        business_type: businessType,
        phone: cleanPhone,
        city: city.trim(),
        address: address.trim() || `${city.trim()} (${roomsCount} units)`,
        tax_id: taxId.trim() || undefined,
      };

      const result = await registerPartnerApi(payload);
      setSuccessData(result);
      setPartnerProfile(result);
      setRegistrationSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let msg = err.message || 'Partner registration failed. Please review your inputs.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d: any) => d.msg || d).join(', ');
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await loginApi(loginEmail.trim(), loginPassword);
      if (res.user) {
        setCurrentUser(res.user);
        try {
          const profile = await getPartnerProfileApi();
          setSuccessData(profile);
          setPartnerProfile(profile);
          setRegistrationSuccess(true);
        } catch {
          // Logged in user without partner profile
          setFormMode('register');
          setFullName(res.user.fullName || (res.user as any).full_name || '');
          setEmail(res.user.email || '');
          if (res.user.phone) setPhone(res.user.phone.replace(/\D/g, ''));
          setErrorMessage('Login successful! Please complete your property registration details below.');
        }
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setErrorMessage(typeof detail === 'string' ? detail : 'Invalid partner credentials. Please check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-500 selection:text-white">
      {/* ── SUB-BANNER / HELPLINE STRIP ── */}
      {/* <div className="bg-[#071426] border-b border-white/10 text-white/90 text-xs py-2 px-4 select-none">
        <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Partner Extranet
            </span>
            <span className="text-gray-300 hidden sm:inline">
              Welcome to <strong>SS Journey Connect</strong> — Official Partner Portal
            </span>
          </div>
          <div className="flex items-center space-x-6 text-gray-300">
            <a href="tel:18001234567" className="flex items-center space-x-1.5 hover:text-white transition">
              <PhoneCall className="w-3.5 h-3.5 text-[#008cff]" />
              <span>Partner Support: <strong className="text-white">1800 123 4567</strong></span>
            </a>
            <button 
              onClick={() => onNavigate('explore')}
              className="text-xs text-blue-300 hover:text-white transition font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>Back to Travel Site</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div> */}

      {/* ── 1. HERO & REGISTRATION SECTION ── */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[640px] flex items-center py-12 lg:py-16">
        {/* Background Image with Rich Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/partner-hero-bg.jpg" 
            alt="Luxury Hotel Partner Hero" 
            className="w-full h-full object-cover object-center scale-105 animate-fade-in transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/60" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-950/40 to-slate-950/90" />
        </div>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  SS Journey Connect · Partner Onboarding
                </span>
              </div> */}

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
                List your Hotel, Guest House &amp; Homestay for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Free</span> &amp; grow your business
              </h1>
{/* 
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Connect with India's fastest growing travel platform. Showcase your rooms to over <strong>10+ Crore verified travelers</strong> across 150+ countries with guaranteed payouts and 24x7 host support.
              </p> */}

              {/* Trust Metrics Pill Strip
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-amber-400">10 Cr+</div>
                  <div className="text-[11px] text-slate-300 font-medium">Happy Travelers</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">50,000+</div>
                  <div className="text-[11px] text-slate-300 font-medium">Listed Properties</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-cyan-400">150+</div>
                  <div className="text-[11px] text-slate-300 font-medium">Countries</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-rose-400">4.8 ★</div>
                  <div className="text-[11px] text-slate-300 font-medium">Host Rating</div>
                </div>
              </div> */}

              {/* Guarantees checklist */}
             {/* <div className="space-y-2.5 pt-2 text-sm text-slate-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span><strong>0% Commission</strong> on all bookings for your first 30 days</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div >
                  <span>Direct express bank settlements on guest check-in</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Free professional HD photoshoot &amp; listing creation assistance</span>
                </div>
              </div> */}
            </div>

            {/* Right Form Card Column */}
            <div className="lg:col-span-5">
              <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-7 backdrop-blur-lg relative">
                
                {registrationSuccess ? (
                  <div className="text-center py-6 space-y-4 animate-fade-in">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-2">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Status: {successData?.status || 'PENDING'}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                        Registration Successfully Submitted!
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Application Reference: <strong className="text-slate-800 font-mono">{successData?.id || 'SSJ-PARTNER-PENDING'}</strong>
                      </p>
                    </div>

                    {/* Application Details Summary */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs text-slate-700 space-y-1.5">
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500 font-medium">Business / Property:</span>
                        <strong className="text-slate-900">{successData?.business_name || fullName}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500 font-medium">Category:</span>
                        <span className="font-semibold text-slate-800">
                          {successData?.business_type === 'HOMESTAY_HOST' ? 'Homestay / Villa Host' : 'Hotelier / Resort'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500 font-medium">Location:</span>
                        <span className="font-semibold text-slate-800">{successData?.city || city || 'India'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Compliance Verification:</span>
                        <span className="font-bold text-amber-700">
                          {successData?.is_verified ? 'Verified & Active' : 'Under Administrative Review'}
                        </span>
                      </div>
                    </div>

                    {/* Clarification on Review & Publication Workflow */}
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-left text-xs text-amber-950 space-y-2">
                      <p className="font-bold flex items-center gap-1.5 text-amber-900">
                        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                        Important: Verification &amp; Property Listing Workflow
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed text-[11px]">
                        <li>
                          Your registration has been stored in the platform database with status <strong>PENDING</strong>.
                        </li>
                        <li>
                          Per SS Journey compliance rules, new partners must be verified by platform administration before rooms and properties can be published live for public booking.
                        </li>
                        <li>
                          Once verified, you can access the Partner Extranet to add room tiers, set live rates, and submit properties for final admin publication.
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        onClick={() => {
                          setRegistrationSuccess(false);
                          setSuccessData(null);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition"
                      >
                        Register Another Property
                      </button>
                      <button
                        onClick={() => onNavigate('explore')}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                      >
                        Back to Travel Site
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Form Mode Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setFormMode('register');
                          setErrorMessage(null);
                        }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          formMode === 'register' 
                            ? 'bg-white text-slate-900 shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Register Property (Free)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormMode('login');
                          setErrorMessage(null);
                        }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          formMode === 'login' 
                            ? 'bg-white text-slate-900 shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Partner Login
                      </button>
                    </div>

                    {/* Authenticated User Status Strip */}
                    {currentUser && (
                      <div className="mb-3.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-[11px] text-blue-900">
                        <span className="truncate">
                          Signed in as: <strong>{currentUser.email}</strong>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded ml-2 shrink-0">
                          {currentUser.role}
                        </span>
                      </div>
                    )}

                    {/* Backend Error Banner */}
                    {errorMessage && (
                      <div className="mb-3.5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold">{errorMessage}</p>
                        </div>
                      </div>
                    )}

                    <div className="mb-3">
                      <h3 className="text-lg font-black text-slate-900">
                        {formMode === 'register' ? 'Sign up & List Your Property' : 'Welcome Back, Partner'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {formMode === 'register' 
                          ? 'Register directly on the official SS Journey Partner Network.' 
                          : 'Access your Partner Extranet and management dashboard.'}
                      </p>
                    </div>

                    {formMode === 'register' ? (
                      <form onSubmit={handleRegisterSubmit} className="space-y-3">
                        {/* Property Type Selection */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Property Category
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['Hotel', 'Homestay / Villa', 'Resort', 'Guest House', 'Apartment'] as PropertyType[]).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setPropertyType(type)}
                                className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg border text-center transition truncate ${
                                  propertyType === type
                                    ? 'bg-blue-50 border-[#008cff] text-[#008cff] font-bold shadow-xs'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Host / Owner Name */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Owner / Property Business Name *
                          </label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Vikramaditya Rathore / Royal Retreats"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                        </div>

                        {/* Mobile Number */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Mobile Number (10 Digits) *
                          </label>
                          <div className="flex rounded-xl border border-slate-300 focus-within:border-[#008cff] focus-within:ring-2 focus-within:ring-blue-100 transition overflow-hidden">
                            <span className="bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600 border-r border-slate-200 flex items-center gap-1.5">
                              <span>🇮🇳</span> +91
                            </span>
                            <input 
                              type="tel" 
                              required
                              maxLength={10}
                              placeholder="9876543210"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                              className="w-full text-xs px-3 py-2.5 outline-none font-medium"
                            />
                          </div>
                        </div>

                        {/* Email & City Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Email Address *
                            </label>
                            <input 
                              type="email" 
                              required
                              placeholder="partner@hotel.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-blue-100 outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              City / Location *
                            </label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. Goa, Jaipur"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-blue-100 outline-none transition"
                            />
                          </div>
                        </div>

                        {/* Password field if unauthenticated */}
                        {!currentUser && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                              <span>Create Extranet Password *</span>
                              <span className="text-[10px] text-slate-400 font-normal">Min 6 characters</span>
                            </label>
                            <div className="relative">
                              <input 
                                type="password" 
                                required
                                minLength={6}
                                placeholder="Choose a secure password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-blue-100 outline-none transition"
                              />
                              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                            </div>
                          </div>
                        )}

                        {/* Address & Tax ID Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Address / Locality
                            </label>
                            <input 
                              type="text" 
                              placeholder="Beach Road, Calangute"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-blue-100 outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              GSTIN / Tax ID (Optional)
                            </label>
                            <input 
                              type="text" 
                              placeholder="e.g. 29AAAAA0000A1Z5"
                              value={taxId}
                              onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-blue-100 outline-none transition uppercase"
                            />
                          </div>
                        </div>

                        {/* Room Count */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Total Number of Rooms / Units
                          </label>
                          <select 
                            value={roomsCount}
                            onChange={(e) => setRoomsCount(e.target.value)}
                            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
                          >
                            <option value="1 - 5">1 - 5 Rooms (Homestay / Boutique)</option>
                            <option value="6 - 20">6 - 20 Rooms (Boutique Hotel / B&amp;B)</option>
                            <option value="21 - 50">21 - 50 Rooms (Mid-scale Hotel)</option>
                            <option value="50+">50+ Rooms (Luxury Hotel &amp; Resort)</option>
                          </select>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-black text-sm uppercase tracking-wide shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all flex items-center justify-center space-x-2 mt-3 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Submitting to Partner Registry...</span>
                            </span>
                          ) : (
                            <>
                              <span>Submit Partner Application</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* Partner Login Form */
                      <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Partner Registered Email *
                          </label>
                          <input 
                            type="email" 
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="partner@hotel.com"
                            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Password *
                          </label>
                          <input 
                            type="password" 
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Enter your extranet password"
                            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-black text-sm uppercase tracking-wide shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Authenticating Partner...</span>
                            </span>
                          ) : (
                            <>
                              <span>Login to Partner Extranet</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    <p className="text-[10px] text-slate-400 text-center mt-3">
                      By proceeding, you agree to SS Journey's <span className="underline cursor-pointer">Partner Terms of Service</span> and <span className="underline cursor-pointer">Compliance Verification Policy</span>.
                    </p>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. TOP VALUE STRIP (3 CARDS) ── */}
      <section className="relative z-20 -mt-8 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-xl border border-slate-200/80 flex items-start space-x-4 hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200">
              <Percent className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-base">0% Commission for 30 Days</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Keep 100% of your earnings for the first month. Zero hidden fees, zero activation charges.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xl border border-slate-200/80 flex items-start space-x-4 hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <Wallet className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-base">Instant Direct Payouts</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Direct bank settlement upon guest check-in via automated NEFT/RTGS. Guaranteed on time.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xl border border-slate-200/80 flex items-start space-x-4 hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
              <Camera className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-base">Free HD Photoshoot &amp; Setup</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Complimentary professional photo session and dedicated onboarding manager to set up rooms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. WHY PARTNER WITH SS JOURNEY (6 GRID CARDS) ── */}
      <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-[#008cff] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            HOST BENEFITS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Why Partner with SS Journey Group?
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Accelerate your room bookings, optimize occupancy rates, and enjoy seamless hotel management tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#008cff] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Reach Millions of Travelers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Showcase your property to leisure and business travelers searching for hotels, villas, and packages across India and internationally.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Direct Control Over Pricing &amp; Inventory</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You determine your room prices, weekend surges, seasonal rates, cancellation policies, and minimum length of stay with one click.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Smart Channel Manager Sync</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seamlessly 2-way sync inventory with Airbnb, Booking.com, Agoda, and Staah to eliminate overbooking and double-bookings.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Verified Quality Guests</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every guest undergoes mobile OTP verification and government ID validation, protecting your property against fraudulent bookings.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Dedicated 24x7 Partner Support</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get an assigned personal relationship manager, phone support, and WhatsApp helpdesk to assist with rate optimization and disputes.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Percent className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Zero Upfront Investment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              100% free registration without monthly subscription fees. You only pay a minimal success fee when confirmed guests complete their stay.
            </p>
          </div>

        </div>
      </section>

      {/* ── 4. LIST IN 3 SIMPLE STEPS ── */}
      <section className="py-16 bg-gradient-to-b from-white to-blue-50/50 border-y border-slate-200/80">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-black uppercase tracking-widest text-[#008cff] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            SIMPLE ONBOARDING
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            List Your Property in 3 Simple Steps
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            From registration to your very first booking in less than 24 hours.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 relative">
            
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200 relative text-left hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white font-black text-xl flex items-center justify-center mb-5 shadow-md shadow-orange-500/30">
                1
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Sign up with Basic Details</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Share your property location, room categories, contact details, and tax details (GST if applicable).
              </p>
              <div className="text-[11px] font-bold text-orange-600 flex items-center gap-1">
                <span>⏱ Takes 2 minutes</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200 relative text-left hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center mb-5 shadow-md shadow-blue-600/30">
                2
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Set Photos &amp; Tariffs</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Upload room photos, configure amenities (WiFi, pool, breakfast), and set your nightly prices and cancellation policies.
              </p>
              <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                <span>📸 Free photoshoot included</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200 relative text-left hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mb-5 shadow-md shadow-emerald-600/30">
                3
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Go Live &amp; Get Bookings</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Our team quickly verifies your listing, publishes it live across SS Journey, and guests begin booking immediately.
              </p>
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <span>🚀 Instant visibility</span>
              </div>
            </div>

          </div>

          <div className="mt-10">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 transition cursor-pointer"
            >
              Register Your Property Now
            </button>
          </div>
        </div>
      </section>

      {/* ── 5. ALL PROPERTY TYPES ARE WELCOME ── */}
      <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#008cff] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              ACCOMMODATION TYPES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              All Property Types are Welcome
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From boutique heritage hotels to peaceful mountain homestays and beach villas.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 mt-4 md:mt-0">
            50,000+ properties currently hosted
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition group">
            <div className="h-44 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80" 
                alt="Hotels & Resorts" 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                Hotels
              </span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-sm text-slate-900">Hotels &amp; Resorts</h4>
              <p className="text-[11px] text-slate-500 mt-1">Luxury, boutique &amp; business hotels</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition group">
            <div className="h-44 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80" 
                alt="Homestays & Villas" 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <span className="absolute top-3 left-3 bg-emerald-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                Homestays
              </span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-sm text-slate-900">Homestays &amp; Villas</h4>
              <p className="text-[11px] text-slate-500 mt-1">Private villas, cottages &amp; farmstays</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition group">
            <div className="h-44 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80" 
                alt="Guest Houses" 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <span className="absolute top-3 left-3 bg-amber-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                Guest Houses
              </span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-sm text-slate-900">Guest Houses &amp; B&amp;Bs</h4>
              <p className="text-[11px] text-slate-500 mt-1">Cozy budget stays &amp; local lodges</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition group">
            <div className="h-44 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80" 
                alt="Apartments" 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <span className="absolute top-3 left-3 bg-purple-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                Apartments
              </span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-sm text-slate-900">Serviced Apartments</h4>
              <p className="text-[11px] text-slate-500 mt-1">Studio flats &amp; extended stay homes</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition group">
            <div className="h-44 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80" 
                alt="Hostels & Camps" 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <span className="absolute top-3 left-3 bg-blue-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                Hostels
              </span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-sm text-slate-900">Hostels &amp; Glamping</h4>
              <p className="text-[11px] text-slate-500 mt-1">Backpackers, tents &amp; treehouses</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 6. EXTRANET APP & TECH PREVIEW ── */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
                POWERFUL MANAGEMENT TECH
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Connect Extranet: Built for Your Property's Growth
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Manage your reservations, rates, and guest communication seamlessly from anywhere in the world with the SS Journey Connect mobile &amp; web extranet app.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-[#008cff] flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Instant Booking Alerts on Mobile</h4>
                    <p className="text-xs text-slate-400">Receive instant push notifications and WhatsApp alerts for new bookings and cancellations.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Dynamic Surge &amp; Rate Optimizer</h4>
                    <p className="text-xs text-slate-400">Smart pricing algorithm suggests optimal rates for weekends, holidays, and high-demand dates.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Direct Guest Chat &amp; Special Requests</h4>
                    <p className="text-xs text-slate-400">Connect with arriving guests for early check-in, dietary preferences, and airport pick-up coordination.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Extranet UI Mockup */}
            <div className="lg:col-span-6">
              <div className="bg-slate-950 rounded-2xl border border-slate-700 p-5 shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-slate-400 ml-2">SS Journey Partner Dashboard</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                    LIVE STATUS: 92% OCCUPIED
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-medium">Today's Revenue</p>
                    <p className="text-lg font-black text-emerald-400">₹48,250</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-medium">Active Bookings</p>
                    <p className="text-lg font-black text-white">14 Rooms</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-medium">Guest Rating</p>
                    <p className="text-lg font-black text-amber-400">4.92 ★</p>
                  </div>
                </div>

                {/* Simulated Recent Bookings Table */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400 text-[10px] font-bold border-b border-slate-800 pb-1">
                    <span>GUEST</span>
                    <span>ROOM TYPE</span>
                    <span>DATES</span>
                    <span>PAYMENT</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <div>
                      <p className="font-bold text-white">Aarav Sharma</p>
                      <p className="text-[10px] text-slate-400">Delhi · 2 Adults</p>
                    </div>
                    <span className="text-slate-300">Deluxe Ocean Suite</span>
                    <span className="text-slate-400">Oct 24 - 28</span>
                    <span className="text-emerald-400 font-bold">₹18,400 (Paid)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <div>
                      <p className="font-bold text-white">Meera Patel</p>
                      <p className="text-[10px] text-slate-400">Mumbai · 3 Guests</p>
                    </div>
                    <span className="text-slate-300">Executive Villa</span>
                    <span className="text-slate-400">Oct 25 - 27</span>
                    <span className="text-emerald-400 font-bold">₹24,800 (Paid)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <div>
                      <p className="font-bold text-white">Rohit Nair</p>
                      <p className="text-[10px] text-slate-400">Bengaluru · 2 Guests</p>
                    </div>
                    <span className="text-slate-300">Premium Garden Room</span>
                    <span className="text-slate-400">Oct 29 - 31</span>
                    <span className="text-emerald-400 font-bold">₹12,200 (Paid)</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. PARTNER SUCCESS STORIES / TESTIMONIALS ── */}
      <section className="py-20 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-[#008cff] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            SUCCESS STORIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Trusted by Over 50,000 Hoteliers &amp; Hosts
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Hear how property owners across India grew their occupancy and direct revenues with SS Journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center space-x-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-700 italic leading-relaxed mb-6">
              "Our boutique heritage resort in Udaipur saw occupancy rise from 45% to over 88% within two months of listing. The zero-commission period was an amazing boost for our cash flow!"
            </p>
            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black flex items-center justify-center text-sm">
                RS
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Rajesh Sharma</h4>
                <p className="text-[11px] text-slate-500">The Grand Heritage Resort, Udaipur</p>
              </div>
              <span className="ml-auto text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                +120% Bookings
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center space-x-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-700 italic leading-relaxed mb-6">
              "Listing our private villa in North Goa was the best decision. The Extranet app is so straightforward to block dates and chat with guests. Express payouts are always strictly on time."
            </p>
            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black flex items-center justify-center text-sm">
                AF
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Alisha Fernandes</h4>
                <p className="text-[11px] text-slate-500">Serene Palms Villa, Goa</p>
              </div>
              <span className="ml-auto text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                4.95 ★ Host
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center space-x-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-700 italic leading-relaxed mb-6">
              "We run an 18-room alpine lodge in Manali. The dedicated partner desk assisted us in setting up dynamic weekend tariffs. Our shoulder season bookings skyrocketed by 85%."
            </p>
            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-black flex items-center justify-center text-sm">
                VT
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Vikram Thakur</h4>
                <p className="text-[11px] text-slate-500">Pine Valley Chalet, Manali</p>
              </div>
              <span className="ml-auto text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                +85% Revenue
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 8. FREQUENTLY ASKED QUESTIONS (ACCORDION) ── */}
      <section className="py-16 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-[840px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-black uppercase tracking-widest text-[#008cff]">
              GOT QUESTIONS?
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              Frequently Asked Questions by Property Owners
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How much does it cost to list my property on SS Journey?",
                a: "Listing your property is 100% free! There are no registration fees, monthly subscription charges, or setup costs. You enjoy 0% commission on all bookings during your first 30 days. After that, you only pay a nominal success fee when guests complete their stay."
              },
              {
                q: "What documents are required for registration?",
                a: "You only need basic documents: a government ID (Aadhaar or Passport) of the owner/manager, property ownership document or lease agreement, and bank account details for direct payout settlements. If you have GST registration, you can provide it for tax invoices."
              },
              {
                q: "How and when do I receive payments for bookings?",
                a: "For prepaid bookings, payout is automatically disbursed directly to your registered bank account via NEFT/RTGS upon guest check-in. For pay-at-hotel bookings, guests settle their bill with you directly upon check-in or checkout."
              },
              {
                q: "Can I sync my room calendar with Airbnb, Booking.com, and Agoda?",
                a: "Yes! SS Journey Connect supports two-way iCal and Channel Manager API synchronization. Any booking made on SS Journey or external platforms automatically syncs in real time, preventing double bookings."
              },
              {
                q: "Do I need a commercial license to list a homestay or villa?",
                a: "Individual homestays, bed & breakfasts, and holiday villas do not require commercial hotel licensing in most Indian states. Local tourism registration (where mandated by state guidelines) is easily supported by our onboarding team."
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between text-sm font-bold text-slate-800 hover:text-[#008cff] transition"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-[#008cff] shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. BOTTOM CTA STRIP ── */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 text-white py-12 border-t border-white/10 select-none">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                START EARNING TODAY
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Ready to Grow Your Hospitality Business?
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Join over 50,000 hoteliers and hosts across India. Start with 0% commission for 30 days.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wide shadow-lg shadow-orange-500/25 transition cursor-pointer"
              >
                Register Your Property (Free)
              </button>
              <a
                href="tel:18001234567"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition flex items-center space-x-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call 1800 123 4567</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ListPropertyPage;
