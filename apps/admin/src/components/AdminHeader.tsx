import React from 'react';
import { UserCheck, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAdminHealth } from '../services/api';

export const AdminHeader: React.FC = () => {
  const { data: health, isSuccess } = useQuery({
    queryKey: ['adminHealth'],
    queryFn: getAdminHealth,
    refetchInterval: 15000,
  });

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20">
          Environment: {health?.environment || 'development'}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span>API: {isSuccess ? 'Connected' : 'Checking...'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition">
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold text-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">System Administrator</div>
            <div className="text-[10px] text-slate-500">Role: SUPER_ADMIN</div>
          </div>
        </div>
      </div>
    </header>
  );
};
