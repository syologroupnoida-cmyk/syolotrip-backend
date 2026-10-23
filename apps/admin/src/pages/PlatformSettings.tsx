import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Server, Globe, ExternalLink, RefreshCw, Cpu, Sun, Moon } from 'lucide-react';
import { getAdminHealth } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const PlatformSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const { data: health, refetch, isFetching } = useQuery({
    queryKey: ['adminHealth'],
    queryFn: getAdminHealth,
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-400" />
            Platform &amp; System Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Service orchestration, backend environment variables, and simulation adapter health.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Ping Services</span>
        </button>
      </div>

      {/* Grid of System Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Core Backend Engine */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-brand-400" />
              <h3 className="font-bold text-sm text-white">FastAPI Backend Engine</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {health?.status === 'healthy' ? 'HEALTHY' : 'CONNECTING'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-500">Service Version</span>
              <span className="font-mono font-bold text-white">{health?.version || '1.0.0'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-500">Environment</span>
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">{health?.environment || 'development'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-500">Database Connection</span>
              <span className="font-semibold text-emerald-400">{health?.database || 'PostgreSQL AsyncPG'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Interactive Swagger Docs</span>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>/docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Travel Engine Simulation Adapters */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Travel Service Adapters</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              MOCK SIMULATOR
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            {[
              { service: 'Flight GDS / NDC Provider', mode: health?.services?.flights_provider || 'Mock Simulator', status: 'Online' },
              { service: 'Hotel CRS Engine', mode: health?.services?.hotels_provider || 'Mock Simulator', status: 'Online' },
              { service: 'IRCTC Train Booking Gateway', mode: 'IRCTC Simulator (100% PNR)', status: 'Online' },
              { service: 'Intercity Bus Engine', mode: health?.services?.buses_provider || 'Mock Simulator', status: 'Online' },
              { service: 'Holiday Packaging Engine', mode: health?.services?.packages_provider || 'Curated Packages', status: 'Online' },
            ].map((p) => (
              <div key={p.service} className="flex justify-between items-center py-1.5 border-b border-slate-800/60 last:border-none">
                <span className="text-slate-400">{p.service}</span>
                <span className="font-semibold text-white">{p.mode}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Application Links */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-sm text-white">Connected Applications &amp; Ports</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <a
              href="http://localhost:5173/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500 transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-xs">Consumer Web Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400" />
              </div>
              <p className="text-[11px] text-slate-400">SS Journey desktop booking experience.</p>
              <span className="inline-block mt-2 font-mono text-[10px] text-brand-400">http://localhost:5173/</span>
            </a>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-xs">Mobile Expo Application</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 font-bold">EXPO</span>
              </div>
              <p className="text-[11px] text-slate-400">React Native app for Android APK &amp; iOS.</p>
              <span className="inline-block mt-2 font-mono text-[10px] text-amber-400">Metro Port: 8081</span>
            </div>

            <a
              href="http://localhost:8000/api/v1/health"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-xs">REST API Backend</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400">FastAPI backend with PostgreSQL database.</p>
              <span className="inline-block mt-2 font-mono text-[10px] text-emerald-400">http://localhost:8000/</span>
            </a>
          </div>
        </div>

        {/* Console Appearance & Theme Preferences */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
              <div>
                <h3 className="font-bold text-sm text-white">Console Appearance &amp; Theme</h3>
                <p className="text-xs text-slate-400">Select your preferred color theme for the Administrator console.</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-brand-500/10 text-brand-400 border border-brand-500/20">
              Active: {theme} Mode
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                theme === 'dark'
                  ? 'bg-slate-900 border-brand-500 shadow-sm ring-1 ring-brand-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Dark Console (Default)</div>
                  <div className="text-[11px] text-slate-400">Sleek midnight slate theme for low-light environments</div>
                </div>
              </div>
              {theme === 'dark' && <span className="text-xs font-bold text-brand-400">Active ✓</span>}
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                theme === 'light'
                  ? 'bg-slate-900 border-amber-500 shadow-sm ring-1 ring-amber-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Light Console</div>
                  <div className="text-[11px] text-slate-400">Clean, crisp high-contrast theme for daytime viewing</div>
                </div>
              </div>
              {theme === 'light' && <span className="text-xs font-bold text-amber-400">Active ✓</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

