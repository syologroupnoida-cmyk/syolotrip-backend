import React from 'react';
import { UserCheck, Bell, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAdminHealth } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAdminAuth } from '../context/AdminAuthContext';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar, isSidebarOpen = false }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAdminAuth();

  const { data: health, isSuccess } = useQuery({
    queryKey: ['adminHealth'],
    queryFn: getAdminHealth,
    refetchInterval: 15000,
  });

  return (
    <header
      className={`h-16 border-b px-3 sm:px-6 flex items-center justify-between transition-colors backdrop-blur-md sticky top-0 z-30 ${
        theme === 'dark'
          ? 'border-slate-800 bg-slate-950/80'
          : 'border-slate-200 bg-white/95 shadow-xs'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className={`lg:hidden p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
            theme === 'dark'
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          {isSidebarOpen ? <X className="w-5 h-5 text-brand-500" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Environment Badge */}
        <span className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 whitespace-nowrap">
          <span className="hidden sm:inline">Environment: </span>
          {health?.environment || 'development'}
        </span>

        {/* API Health */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          <span className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span className="hidden sm:inline">API: </span>
          <span>{isSuccess ? 'Connected' : 'Connecting'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex items-center gap-2">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <span>⚡ API Docs</span>
            <span className="text-[10px] text-slate-500">(:8000)</span>
          </a>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          id="admin-theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs group ${
            theme === 'dark'
              ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
              : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
          }`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>

        <button
          className={`p-2 rounded-lg transition ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className={`flex items-center gap-2.5 pl-3 border-l ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
              {user?.fullName || (user as any)?.full_name || 'System Administrator'}
            </div>
            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
              {user?.email || 'Role: ADMIN'}
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out of Admin Console"
            className={`flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-xs cursor-pointer ${
              theme === 'dark'
                ? 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300'
                : 'border-rose-300 bg-rose-100 hover:bg-rose-200 text-rose-800'
            }`}
          >
            <LogOut className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-rose-300' : 'text-rose-700'}`} />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
