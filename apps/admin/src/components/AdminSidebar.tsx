import React from 'react';
import { 
  LayoutDashboard, Plane, Hotel, Bus, Train, Car, Compass, 
  Receipt, Users, Tag, FileText, Settings, ShieldAlert, TrendingUp 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AdminSidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  currentTab, 
  setCurrentTab,
  isOpen = false,
  onClose,
}) => {
  const { theme } = useTheme();
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
    { id: 'pricing', label: 'Pricing & Markups', icon: TrendingUp },
    { id: 'coupons', label: 'Offers & Coupons', icon: Tag },
    { id: 'audit', label: 'Audit Trail Logs', icon: FileText },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 border-r flex flex-col justify-between p-4 transition-all duration-300 shrink-0 select-none overflow-y-auto ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="space-y-6">
          {/* Brand & Mobile Close */}
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/syolo-trips-emblem.png" 
                alt="Syolo Trips" 
                className="w-10 h-10 object-contain drop-shadow"
              />
              <div>
                <span
                  className={`font-extrabold text-base tracking-wider ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span className="text-[#00aeef]">SYOLO</span> <span className="text-[#ff9900]">TRIPS</span>
                </span>
                <span className="block text-[10px] uppercase font-semibold text-brand-500">
                  ADMIN CONSOLE
                </span>
              </div>
            </div>

            {/* Mobile Drawer Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-600 dark:text-brand-400 border border-brand-500/30 shadow-xs font-bold'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : theme === 'dark'
                        ? 'text-slate-500'
                        : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Safety Notice Card */}
      <div
        className={`p-3.5 rounded-xl border text-[11px] space-y-1.5 ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-400'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
          <span>PostgreSQL Live Sync</span>
        </div>
        <p className="leading-relaxed text-[11px] opacity-90">
          All inventory &amp; booking mutations sync live to PostgreSQL. Payments are explicitly simulated for demo.
        </p>
      </div>
    </aside>
    </>
  );
};
