import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  Compass,
  Sun,
  Moon,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTheme } from '../context/ThemeContext';

export const AdminLoginPage: React.FC = () => {
  const { login, demoLogin } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInstantBypass = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await demoLogin('ADMIN');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Bypass demo login failed';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your administrator email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(trimmedEmail, password);
      // Login success updates auth state in context; App.tsx switches to dashboard
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 401) {
        setErrorMessage('Invalid administrator credentials. Access denied.');
      } else if (status === 403) {
        setErrorMessage('This administrator account has been deactivated. Contact system admin.');
      } else if (detail) {
        setErrorMessage(typeof detail === 'string' ? detail : 'Authentication failed.');
      } else {
        setErrorMessage('Failed to connect to authentication server. Please verify backend service.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-md backdrop-blur-md ${
            theme === 'dark'
              ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200'
              : 'border-slate-300 bg-white/90 hover:bg-slate-100 text-slate-800'
          }`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>
      {/* Background radial gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-lg shadow-brand-500/20 mb-4 border border-brand-400/30">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>SS Journey</span>
            <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30 tracking-wider">
              Admin
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Operations & Global Inventory Control Center
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold text-slate-200">
                Interactive Admin Login
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              ROLE: ADMIN
            </span>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-shake"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ssjourney.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* 1-Click Security Bypass Login */}
            <button
              type="button"
              onClick={handleInstantBypass}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <span>⚡ Instant Security Bypass Login (1-Click Admin)</span>
            </button>

            {/* Quick Fill Demo / Dev Helper */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-slate-400">Default: <code className="text-brand-400 font-mono">admin@ssjourney.com</code></span>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@ssjourney.com');
                  setPassword('Admin@123456');
                }}
                className="text-brand-400 hover:text-brand-300 font-medium underline underline-offset-2 cursor-pointer"
              >
                Auto-fill credentials
              </button>
            </div>
          </form>

          {/* Security Notice Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] leading-relaxed text-slate-400">
              🔒 <strong>SS Journey Security Protocol:</strong> Unauthorized access attempts are logged with client IP and reported. Interactive password authentication is mandatory.
            </p>
          </div>
        </div>

        {/* Back Link to Customer Web App */}
        <div className="text-center mt-6">
          <a
            href="http://localhost:5173/"
            className="text-xs text-slate-400 hover:text-slate-200 transition underline underline-offset-4"
          >
            ← Return to SS Journey Customer Portal (:5173)
          </a>
        </div>
      </div>
    </div>
  );
};
