import React, { useState } from 'react';
import { ScreenType } from '../components/Header';
import { loginBusinessApi, MyBizCompany, MyBizEmployee, UserProfile } from '../services/api';

interface BusinessLoginPageProps {
  onNavigate: (screen: ScreenType) => void;
  onBizLoginSuccess: (user: UserProfile, company: MyBizCompany, employee: MyBizEmployee, token: string) => void;
}

export const BusinessLoginPage: React.FC<BusinessLoginPageProps> = ({
  onNavigate,
  onBizLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const targetEmail = (loginEmail || email).trim().toLowerCase();
    const targetPassword = loginPassword || password;

    if (!targetEmail || !targetPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginBusinessApi({
        email: targetEmail,
        password: targetPassword,
      });

      const token = res.token;
      if (token) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('biz_token', token);
      }

      onBizLoginSuccess(res.user, res.company, res.employee, token);
      onNavigate('business-dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Business login failed. Please verify credentials.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow ambient effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Back button */}
        <button
          type="button"
          onClick={() => onNavigate('business')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition mb-6 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to SS Journey myBiz</span>
        </button>

        {/* Branding header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 text-white font-black text-2xl shadow-xl shadow-orange-500/20 mb-4">
            B
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SS Journey <span className="text-amber-400">myBiz</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Sign in to your corporate or travel agency command center
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-slate-800/90 border border-slate-700/80 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition pr-10"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-60 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to myBiz</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick 1-Click Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('corp.admin@ssjourney.com');
                  setPassword('CorpPass123!');
                  handleLogin('corp.admin@ssjourney.com', 'CorpPass123!');
                }}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-amber-500/30 text-amber-300 font-bold text-[11px] transition text-center hover:border-amber-400"
              >
                Corporate Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('agency.admin@ssjourney.com');
                  setPassword('AgencyPass123!');
                  handleLogin('agency.admin@ssjourney.com', 'AgencyPass123!');
                }}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-blue-500/30 text-blue-300 font-bold text-[11px] transition text-center hover:border-blue-400"
              >
                Travel Agency
              </button>
            </div>
          </div>

          {/* Switch to Register */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have a myBiz business account yet?{' '}
            <button
              type="button"
              onClick={() => onNavigate('business-register')}
              className="text-amber-400 hover:text-amber-300 font-bold underline transition"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
