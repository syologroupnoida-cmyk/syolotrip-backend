import React, { useState } from 'react';
import { ScreenType } from '../components/Header';
import { 
  Building2, 
  Home, 
  ArrowRight, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { registerVendorApi, loginApi } from '../services/api';

interface VendorRegistrationPageProps {
  onNavigate: (screen: ScreenType) => void;
  onLoginSuccess?: (user: any) => void;
  initialMode?: 'register' | 'login';
}

export const VendorRegistrationPage: React.FC<VendorRegistrationPageProps> = ({ 
  onNavigate,
  onLoginSuccess,
  initialMode = 'register'
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);

  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Registration form fields
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [propertyType, setPropertyType] = useState<'HOTEL' | 'HOMESTAY'>('HOTEL');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Login form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !businessName.trim() || !email.trim() || !phone.trim() || !password || !city.trim()) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('You must agree to the Partner Terms of Service and Compliance Policy.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerVendorApi({
        full_name: fullName.trim(),
        business_name: businessName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        property_type: propertyType,
        city: city.trim(),
        state: state.trim(),
        agree_terms: agreeTerms,
      });

      // Save token to localStorage so vendor session is active
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }
      if (onLoginSuccess && result.user) {
        onLoginSuccess(result.user);
      }

      // Navigate directly to vendor dashboard
      onNavigate('vendor-dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Vendor registration failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginApi(loginEmail.trim(), loginPassword);
      if (res.tokens?.accessToken) {
        localStorage.setItem('auth_token', res.tokens.accessToken);
      }
      if (onLoginSuccess && res.user) {
        onLoginSuccess(res.user);
      }
      onNavigate('vendor-dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid partner credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#008cff] selection:text-white">
      <div className="max-w-2xl mx-auto">
        {/* Navigation Breadcrumb / Back Action */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('list-property')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#008cff] transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Partner Overview</span>
          </button>
          
          <span className="text-xs font-black uppercase tracking-wider text-[#008cff] bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
            Official Partner Extranet
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Header Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-200">
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(null); }}
              className={`py-3 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register New Property
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className={`py-3 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Partner Extranet Login
            </button>
          </div>

          <div className="p-6 sm:p-10">
            {/* Header info */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {mode === 'register' ? 'Become a Property Partner' : 'Welcome Back, Partner'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {mode === 'register' 
                  ? 'Create your partner account in under 2 minutes. KYC and property setup follows.' 
                  : 'Sign in to access your room rates, guest bookings, and financial statements.'}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ── MODE 1: REGISTRATION FORM ── */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-6">
                {/* 1. Property Type Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Select Property Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPropertyType('HOTEL')}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        propertyType === 'HOTEL'
                          ? 'border-[#008cff] bg-blue-50/70 text-[#008cff] shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <Building2 className="w-5 h-5 shrink-0" />
                      <div>
                        <span className="block text-xs font-black">Hotel / Resort</span>
                        <span className="text-[10px] text-slate-500">Commercial Hotel</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPropertyType('HOMESTAY')}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        propertyType === 'HOMESTAY'
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-600 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <Home className="w-5 h-5 shrink-0" />
                      <div>
                        <span className="block text-xs font-black">Homestay / Villa</span>
                        <span className="text-[10px] text-slate-500">Private Homestay</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Personal & Business Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Full Name (Owner / Contact) *
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Vikramaditya Rathore"
                        className="w-full text-xs font-bold pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#008cff] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Business / Property Name *
                    </label>
                    <div className="relative flex items-center">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5" />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Royal Heritage Retreat"
                        className="w-full text-xs font-bold pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#008cff] transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Contact Info (Email & Phone) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Email Address *
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@hotel.com"
                        className="w-full text-xs font-bold pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#008cff] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Mobile Number (10 Digits) *
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full text-xs font-bold pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#008cff] transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Location Details (City & State) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      City / Destination *
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5" />
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Manali, Goa, Jaipur"
                        className="w-full text-xs font-bold pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#008cff] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Himachal Pradesh, Goa, Rajasthan"
                      className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#008cff] transition"
                    />
                  </div>
                </div>

                {/* 5. Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Create Password (Min 6 chars) *
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs font-bold pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#008cff] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs font-bold pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#008cff] transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Terms & Conditions Checkbox */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#008cff] focus:ring-[#008cff] cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      I agree to the SS Journey{' '}
                      <strong className="text-slate-900">Partner Terms of Service</strong>,{' '}
                      <strong className="text-slate-900">KYC Verification Policy</strong>, and confirm that I am authorized to represent this property.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-[#008cff] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>Registering Account...</span>
                  ) : (
                    <>
                      <span>Complete Registration &amp; Open Dashboard</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── MODE 2: LOGIN FORM ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Partner Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="partner@hotel.com"
                      className="w-full text-xs font-bold pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#008cff] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs font-bold pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#008cff] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-[#008cff] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? <span>Signing in...</span> : <span>Sign In to Extranet Dashboard</span>}
                </button>

                {/* 1-Click Demo Partner Login */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                    Quick 1-Click Demo Account
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('vendor.demo@ssjourney.com');
                      setLoginPassword('Vendor@123456');
                      setIsLoading(true);
                      loginApi('vendor.demo@ssjourney.com', 'Vendor@123456')
                        .then((res) => {
                          if (res.tokens?.accessToken) {
                            localStorage.setItem('auth_token', res.tokens.accessToken);
                          }
                          if (onLoginSuccess && res.user) {
                            onLoginSuccess(res.user);
                          }
                          onNavigate('vendor-dashboard');
                        })
                        .catch((err: any) => {
                          setErrorMessage(err.response?.data?.message || err.message);
                        })
                        .finally(() => setIsLoading(false));
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-[#008cff] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Quick Demo: Royal Heritage Retreat (Verified Hotel Partner)</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
