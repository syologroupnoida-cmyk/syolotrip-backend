import React from 'react';
import { 
  LayoutDashboard, Plane, Hotel, Bus, Train, Car, Compass, 
  Receipt, Users, Tag, FileText, Settings, ShieldAlert, Globe 
} from 'lucide-react';

interface AdminSidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentTab, setCurrentTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'flights', label: 'Flight Inventory', icon: Plane },
    { id: 'hotels', label: 'Hotel Properties', icon: Hotel },
    { id: 'trains', label: 'Train Routes', icon: Train },
    { id: 'buses', label: 'Bus Routes', icon: Bus },
    { id: 'cabs', label: 'Cab Fleets', icon: Car },
    { id: 'packages', label: 'Holiday Packages', icon: Compass },
    { id: 'bookings', label: 'Bookings & Orders', icon: Receipt },
    { id: 'users', label: 'Users & Customers', icon: Users },
    { id: 'pricing', label: 'Offers & Coupons', icon: Tag },
    { id: 'audit', label: 'Audit Trail Logs', icon: FileText },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3">
          <img 
            src="/assets/ss-journey-logo.jpg" 
            alt="SS Journey" 
            className="w-9 h-9 rounded-lg object-contain bg-white shadow-md shadow-brand-600/30"
          />
          <div>
            <span className="font-extrabold text-base tracking-wider text-white">SS JOURNEY</span>
            <span className="block text-[10px] uppercase font-semibold text-brand-400">ADMIN CONSOLE</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        {/* Quick link to consumer web app */}
        <div className="pt-2 border-t border-slate-900">
          <a
            href="http://localhost:5173/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 transition"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-400" />
              <span>Consumer Web App</span>
            </span>
            <span className="text-[10px] text-slate-500">5173 ↗</span>
          </a>
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Simulated Engine</span>
        </div>
        <p className="leading-relaxed text-[11px] text-slate-400">
          All inventory mutations in Phase 1 operate on deterministic mock data stores.
        </p>
      </div>
    </aside>
  );
};
