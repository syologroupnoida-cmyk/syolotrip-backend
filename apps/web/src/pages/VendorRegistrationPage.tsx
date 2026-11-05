import React, { useState } from 'react';
import { ScreenType } from '../components/Header';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  Zap,
  ChevronDown
} from 'lucide-react';
import { registerVendorApi, loginApi } from '../services/api';

interface VendorRegistrationPageProps {
  onNavigate: (screen: ScreenType) => void;
  onLoginSuccess?: (user: any) => void;
  initialMode?: 'register' | 'login';
}

const PROPERTY_CATEGORIES = [
  'Hotel',
  'Homestay / Villa',
  'Resort',
  'Guest House',
  'Apartment'
] as const;

type PropertyCategory = typeof PROPERTY_CATEGORIES[number];

const ROOM_UNIT_OPTIONS = [
  '1 - 5 Rooms (Homestay / Boutique)',
  '6 - 15 Rooms (Boutique / Heritage)',
  '16 - 50 Rooms (Mid-scale Hotel)',
  '50+ Rooms (Luxury Resort / Chain)'
];

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

  // Form State matching reference design
  const [selectedCategory, setSelectedCategory] = useState<PropertyCategory>('Hotel');
  const [ownerAndBusinessName, setOwnerAndBusinessName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [cityLocation, setCityLocation] = useState('');
  const [password, setPassword] = useState('');
  const [addressLocality, setAddressLocality] = useState('');
  const [taxIdGstin, setTaxIdGstin] = useState('');
  const [roomUnits, setRoomUnits] = useState(ROOM_UNIT_OPTIONS[0]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!ownerAndBusinessName.trim()) {
      setErrorMessage('Please enter your Owner and Business / Property name.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!emailAddress.trim()) {
      setErrorMessage('Please enter your contact email address.');
      return;
    }
    if (!cityLocation.trim()) {
      setErrorMessage('Please enter your property city or destination.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Please create an extranet password with at least 6 characters.');
      return;
    }

    // Parse owner name & business name
    let ownerName = ownerAndBusinessName.trim();
    let bizName = ownerAndBusinessName.trim();
    if (ownerAndBusinessName.includes('/')) {
      const parts = ownerAndBusinessName.split('/');
      ownerName = parts[0].trim() || bizName;
      bizName = parts.slice(1).join('/').trim() || ownerName;
    }

    setIsLoading(true);
    try {
      const result = await registerVendorApi({
        full_name: ownerName,
        business_name: bizName,
        email: emailAddress.trim(),
        phone: `+91${mobileNumber.trim()}`,
        password,
        property_type: selectedCategory,
        city: cityLocation.trim(),
        state: '',
        address: addressLocality.trim(),
        tax_id: taxIdGstin.trim(),
        room_count: roomUnits,
        agree_terms: true,
      });

      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }
      if (onLoginSuccess && result.user) {
        onLoginSuccess(result.user);
      }
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
      const msg = err.response?.data?.message || err.message || 'Invalid partner extranet credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginApi('vendor.demo@ssjourney.com', 'Vendor@123456');
      if (res.tokens?.accessToken) {
        localStorage.setItem('auth_token', res.tokens.accessToken);
      }
      if (onLoginSuccess && res.user) {
        onLoginSuccess(res.user);
      }
      onNavigate('vendor-dashboard');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Quick Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-[#ff6b00] selection:text-white"
      style={{
        backgroundImage: "radial-gradient(circle at center, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.75) 100%), url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Centered Modal / Form Card matching Reference Design */}
      <div className="w-full max-w-[560px] bg-white rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.35)] p-6 sm:p-9 relative z-10 animate-fade-in border border-white/80">
        
        {/* Top Tab Switcher */}
        <div className="bg-[#f0f3f8] p-1 rounded-full flex items-center mb-6">
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register Property (Free)
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Partner Login
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── MODE 1: REGISTER PROPERTY FORM ── */}
        {mode === 'register' ? (
          <div>
            {/* Header Titles */}
            <div className="mb-5">
              <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                Sign up &amp; List Your Property
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Register directly on the official Syolo Travels Partner Network.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* PROPERTY CATEGORY */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  PROPERTY CATEGORY
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'border-2 border-[#008cff] bg-blue-50/60 text-[#008cff]'
                            : 'border border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Owner / Property Business Name * */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Owner / Property Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerAndBusinessName}
                  onChange={(e) => setOwnerAndBusinessName(e.target.value)}
                  placeholder="e.g. Vikramaditya Rathore / Royal Retreats"
                  className="w-full text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#008cff] transition"
                />
              </div>

              {/* Mobile Number (10 Digits) * */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mobile Number (10 Digits) *
                </label>
                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 shrink-0 select-none">
                    IN +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="flex-1 text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#008cff] transition font-mono"
                  />
                </div>
              </div>

              {/* Row: Email Address * & City / Location * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="partner@hotel.com"
                    className="w-full text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#008cff] transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityLocation}
                    onChange={(e) => setCityLocation(e.target.value)}
                    placeholder="e.g. Goa, Jaipur"
                    className="w-full text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#008cff] transition"
                  />
                </div>
              </div>

              {/* Create Extranet Password * */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Create Extranet Password *
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Min 6 characters
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a secure password"
                    className="w-full text-xs sm:text-sm font-semibold px-4 pr-11 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#008cff] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Row: Address / Locality & GSTIN / Tax ID (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Address / Locality
                  </label>
                  <input
                    type="text"
                    value={addressLocality}
                    onChange={(e) => setAddressLocality(e.target.value)}
                    placeholder="Beach Road, Calangute"
                    className="w-full text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#008cff] transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    GSTIN / Tax ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={taxIdGstin}
                    onChange={(e) => setTaxIdGstin(e.target.value.toUpperCase())}
                    placeholder="E.G. 29AAAAA0000A1Z5"
                    className="w-full text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#008cff] transition font-mono uppercase"
                  />
                </div>
              </div>

              {/* Total Number of Rooms / Units */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Total Number of Rooms / Units
                </label>
                <div className="relative flex items-center">
                  <select
                    value={roomUnits}
                    onChange={(e) => setRoomUnits(e.target.value)}
                    className="w-full appearance-none text-xs sm:text-sm font-semibold px-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#008cff] transition cursor-pointer text-slate-800"
                  >
                    {ROOM_UNIT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Submit Partner Application Orange Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#ff7500] to-[#ff5200] hover:from-[#ff6200] hover:to-[#ff4500] disabled:opacity-50 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <span>SUBMIT PARTNER APPLICATION</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>

              {/* Terms Subtext */}
              <p className="text-[11px] text-center text-slate-500 leading-normal pt-1">
                By proceeding, you agree to Syolo Travels'{' '}
                <span className="text-slate-700 underline font-semibold cursor-pointer">
                  Partner Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-slate-700 underline font-semibold cursor-pointer">
                  Compliance Verification Policy
                </span>.
              </p>
            </form>
          </div>
        ) : (
          /* ── MODE 2: PARTNER LOGIN FORM ── */
          <div>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                Partner Extranet Login
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Sign in to manage your property, inventory, room rates, and guest arrivals.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Partner Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="partner@hotel.com"
                  className="w-full text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#008cff] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Extranet Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full text-xs sm:text-sm font-semibold px-4 pr-11 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#008cff] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-full bg-[#008cff] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>SIGN IN TO EXTRANET</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo 1-Click Login */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>⚡ Quick Demo: Log in as Vikramaditya Rathore (Verified Partner)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
