import React, { useState } from 'react';
import { loginApi, registerApi, demoLoginApi, UserProfile } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstantBypassLogin = async (role: 'CUSTOMER' | 'ADMIN' | 'PARTNER') => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await demoLoginApi(role);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      let msg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Bypass demo login failed';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginApi(email, password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await registerApi({
          email,
          full_name: fullName,
          password,
          phone: phone || undefined,
        });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      let msg = err.response?.data?.detail || err.response?.data?.message;
      if (!msg && err.response?.status === 500) {
        msg = 'Unable to connect to backend server on port 8000. Please ensure the backend server is running.';
      } else if (!msg) {
        msg = err.message || 'Authentication failed';
      }
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-surface-container-lowest text-on-surface w-full max-w-md rounded-2xl shadow-float border border-outline-variant/30 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#071a3d] via-primary to-[#143d8a] text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex items-center gap-3">
            <img 
              src="/assets/ss-journey-emblem.png" 
              alt="SS Journey" 
              className="h-10 w-auto object-contain drop-shadow-sm"
            />
            <div>
              <h3 className="text-headline-sm font-bold text-white">SS Journey Account</h3>
              <p className="text-body-sm text-blue-200">
                {mode === 'login' ? 'Sign in to access your bookings' : 'Create your traveler profile'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-outline-variant/20 bg-surface-container-low">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-label-lg font-bold text-center transition-colors ${
              mode === 'login'
                ? 'text-primary border-b-2 border-primary bg-surface-container-lowest'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-label-lg font-bold text-center transition-colors ${
              mode === 'register'
                ? 'text-primary border-b-2 border-primary bg-surface-container-lowest'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Instant Security Bypass / 1-Click Demo Login */}
        <div className="bg-amber-50/90 border-b border-amber-200 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <span>⚡</span> Security Bypass Login (1-Click)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 border border-amber-400/30">
              Instant
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleInstantBypassLogin('CUSTOMER')}
              className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-0.5 active:scale-95 disabled:opacity-50"
            >
              <span className="font-extrabold">👤 User</span>
              <span className="text-[9px] font-normal opacity-90">Customer</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleInstantBypassLogin('ADMIN')}
              className="py-2 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-0.5 active:scale-95 disabled:opacity-50"
            >
              <span className="font-extrabold">🛡️ Admin</span>
              <span className="text-[9px] font-normal opacity-90">Full Access</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleInstantBypassLogin('PARTNER')}
              className="py-2 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-0.5 active:scale-95 disabled:opacity-50"
            >
              <span className="font-extrabold">🏨 Partner</span>
              <span className="text-[9px] font-normal opacity-90">Hotel/Host</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="bg-error/10 border border-error/30 text-error rounded-xl p-3 text-body-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-1">Phone Number (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-label-md font-semibold text-on-surface mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@ssjourney.com"
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-label-md font-semibold text-on-surface mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#f28c1c] hover:bg-[#e57a0e] text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In to SS Journey' : 'Create Free Account'}</span>
            )}
          </button>

          {/* Quick Demo Credentials */}
          <div className="mt-3 pt-3 border-t border-outline-variant/20">
            <span className="text-label-sm text-on-surface-variant font-medium block mb-2 text-center">
              Quick Demo Fill:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('customer@ssjourney.com', 'Customer@123456')}
                className="text-label-sm bg-surface-container hover:bg-surface-container-high text-primary font-semibold py-1.5 px-2 rounded-lg border border-outline-variant/30 transition-colors text-center text-xs"
              >
                Customer Account
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin@ssjourney.com', 'Admin@123456')}
                className="text-label-sm bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold py-1.5 px-2 rounded-lg border border-amber-300 transition-colors text-center text-xs"
              >
                Admin Account
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
