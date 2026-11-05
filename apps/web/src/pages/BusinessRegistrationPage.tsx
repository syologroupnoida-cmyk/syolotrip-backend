import React, { useState } from 'react';
import { ScreenType } from '../components/Header';
import { registerBusinessApi, MyBizCompany } from '../services/api';

interface BusinessRegistrationPageProps {
  onNavigate: (screen: ScreenType) => void;
  onBizRegistered: (company: MyBizCompany, token?: string) => void;
}

export const BusinessRegistrationPage: React.FC<BusinessRegistrationPageProps> = ({
  onNavigate,
  onBizRegistered,
}) => {
  const [accountType, setAccountType] = useState<'CORPORATE' | 'AGENCY'>('CORPORATE');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Business profile details
  const [billingAddress, setBillingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [website, setWebsite] = useState('');
  const [employeeRange, setEmployeeRange] = useState('11-50');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!companyName.trim()) {
      setErrorMsg('Please enter your legal business or company name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid business email address.');
      return;
    }
    if (!contactPersonName.trim()) {
      setErrorMsg('Please enter the contact person or administrator name.');
      return;
    }
    if (!contactPersonPhone.trim() || contactPersonPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please recheck.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerBusinessApi({
        account_type: accountType,
        company_name: companyName.trim(),
        billing_email: email.trim().toLowerCase(),
        password,
        contact_person_name: contactPersonName.trim(),
        contact_person_phone: contactPersonPhone.trim(),
        address: billingAddress.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postal_code: pincode.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        pan: pan.trim().toUpperCase() || undefined,
        website: website.trim() || undefined,
        company_size: employeeRange,
      });

      setSuccessMsg('Account registered successfully! Redirecting to command center...');
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('biz_token', res.token);
      }
      setTimeout(() => {
        onBizRegistered(res.company, res.token);
        onNavigate('business-dashboard');
      }, 1000);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please verify your details.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[760px] mx-auto">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => onNavigate('business')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition mb-6 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Syolo Travels myBiz</span>
        </button>

        {/* Header Title Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md mb-8">
          <div className="flex items-center space-x-3.5 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/20">
              B
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Register for Syolo Travels myBiz
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Centralize corporate travel, manage travel agency bookings, and streamline GST invoicing.
              </p>
            </div>
          </div>

          {/* Account Type Selector Tabs */}
          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Select Your Business Category <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Corporate Company */}
              <button
                type="button"
                onClick={() => setAccountType('CORPORATE')}
                className={`p-4 rounded-2xl border text-left transition duration-200 cursor-pointer flex flex-col justify-between ${
                  accountType === 'CORPORATE'
                    ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <span className={`material-symbols-outlined text-[24px] ${accountType === 'CORPORATE' ? 'text-amber-400' : 'text-slate-400'}`}>
                      apartment
                    </span>
                    <span className="text-sm font-black text-white">Corporate Company</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${accountType === 'CORPORATE' ? 'border-amber-400' : 'border-slate-600'}`}>
                    {accountType === 'CORPORATE' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  For businesses booking for employees, enforcing travel policies, and automating manager approvals.
                </p>
              </button>

              {/* Option B: Travel Agency */}
              <button
                type="button"
                onClick={() => setAccountType('AGENCY')}
                className={`p-4 rounded-2xl border text-left transition duration-200 cursor-pointer flex flex-col justify-between ${
                  accountType === 'AGENCY'
                    ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <span className={`material-symbols-outlined text-[24px] ${accountType === 'AGENCY' ? 'text-blue-400' : 'text-slate-400'}`}>
                      travel_explore
                    </span>
                    <span className="text-sm font-black text-white">Travel Agency</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${accountType === 'AGENCY' ? 'border-blue-400' : 'border-slate-600'}`}>
                    {accountType === 'AGENCY' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  For agencies booking on behalf of clients with sub-agent logins, markups, and client billing.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section: Business Details */}
          <div>
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <span className="material-symbols-outlined text-[18px]">business</span>
              <span>Business Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Legal Business / Company Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={accountType === 'CORPORATE' ? 'e.g. Acme Technologies Pvt Ltd' : 'e.g. Horizon Travels & Tours'}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  GSTIN (Recommended for Tax Credit)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PAN Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Company Website (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {accountType === 'CORPORATE' ? 'Number of Employees' : 'Agency Team Size'}
                </label>
                <select
                  value={employeeRange}
                  onChange={(e) => setEmployeeRange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 transition"
                >
                  <option value="1-10">1 - 10</option>
                  <option value="11-50">11 - 50</option>
                  <option value="51-200">51 - 200</option>
                  <option value="201-500">201 - 500</option>
                  <option value="500+">500+ Employees</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Address Details */}
          <div className="pt-4 border-t border-slate-700/60">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span>Billing Address</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered Office Address
                </label>
                <input
                  type="text"
                  placeholder="Suite / Floor / Building, Street name"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">City</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">State</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 400001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 font-mono transition"
                />
              </div>
            </div>
          </div>

          {/* Section: Admin Account Credentials */}
          <div className="pt-4 border-t border-slate-700/60">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
              <span>Primary Business Administrator</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Administrator Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Phone Number <span className="text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={contactPersonPhone}
                  onChange={(e) => setContactPersonPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 font-mono transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Work Email (Used for Login &amp; GST Invoices) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Create Password <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password <span className="text-amber-400">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 transition"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-700/60">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-sm tracking-wide shadow-xl shadow-amber-500/20 transition cursor-pointer disabled:opacity-60 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  <span>Registering Business...</span>
                </>
              ) : (
                <>
                  <span>Create myBiz Business Account</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 mt-4">
              Already have a myBiz business account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('business-login')}
                className="text-amber-400 hover:text-amber-300 font-bold underline transition"
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
