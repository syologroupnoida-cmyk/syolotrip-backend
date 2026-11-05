import React from 'react';
import { 
  LayoutDashboard, Plane, Hotel, Bus, Train, Car, Compass, 
  Receipt, Users, Tag, FileText, Settings, ShieldAlert, TrendingUp,
  Home, MapPin, FileCheck2, ShieldCheck, Database, Shield, FileSpreadsheet, Wallet,
  Building2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AdminSidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  currentTab, 
  setCurrentTab,
  isOpen = false,
  onClose,
}) => {
  const { theme } = useTheme();

  const navSections: NavSection[] = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'bookings', label: 'Bookings & Orders', icon: Receipt },
      ],
    },
    {
      title: '10 TRAVEL SERVICES',
      items: [
        { id: 'flights', label: 'Flights', icon: Plane },
        { id: 'hotels', label: 'Hotels', icon: Hotel },
        { id: 'villas', label: 'Villas & Homestays', icon: Home },
        { id: 'packages', label: 'Holiday Packages', icon: Compass },
        { id: 'trains', label: 'Trains', icon: Train },
        { id: 'buses', label: 'Buses', icon: Bus },
        { id: 'cabs', label: 'Cabs & Fleets', icon: Car },
        { id: 'tours', label: 'Tours & Attractions', icon: MapPin },
        { id: 'visa', label: 'Visa Requirements', icon: FileCheck2 },
        { id: 'insurance', label: 'Travel Insurance', icon: ShieldCheck },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        { id: 'master-data', label: 'Master Reference Data', icon: Database, badge: '5 Tables' },
      ],
    },
    {
      title: 'COMMERCIALS',
      items: [
        { id: 'pricing', label: 'Pricing & Markups', icon: TrendingUp },
        { id: 'coupons', label: 'Offers & Coupons', icon: Tag },
        { id: 'wallet', label: 'Wallet & Ledger', icon: Wallet, badge: 'Dual' },
      ],
    },
    {
      title: 'USERS & ACCESS',
      items: [
        { id: 'customers', label: 'Customers & Guests', icon: Users },
        { id: 'business', label: 'B2B & Agencies', icon: Building2, badge: 'myBiz' },
        { id: 'roles', label: 'Roles & Permissions', icon: Shield, badge: 'RBAC' },
      ],
    },
    {
      title: 'SYSTEM & TOOLS',
      items: [
        { id: 'import-export', label: 'Import & Export Center', icon: FileSpreadsheet, badge: 'XLSX/CSV' },
        { id: 'audit', label: 'Audit Trail Logs', icon: FileText },
        { id: 'settings', label: 'Platform Settings', icon: Settings },
      ],
    },
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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 border-r flex flex-col justify-between p-3.5 transition-all duration-300 shrink-0 select-none overflow-y-auto ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="space-y-4">
          {/* Brand & Mobile Close */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2.5">
              <img 
                src="/assets/syolo-trips-emblem.png" 
                alt="SS Journey" 
                className="w-9 h-9 object-contain drop-shadow"
              />
              <div>
                <span
                  className={`font-black text-sm tracking-wider ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span className="text-[#00aeef]">SS</span> <span className="text-[#ff9900]">JOURNEY</span>
                </span>
                <span className="block text-[9px] uppercase font-bold tracking-widest text-brand-500">
                  ADMIN PLATFORM
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

          {/* Grouped Navigation */}
          <nav className="space-y-4 pt-1">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-600/15 text-brand-600 dark:text-brand-400 border border-brand-500/30 shadow-xs font-bold'
                          : theme === 'dark'
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? 'text-brand-600 dark:text-brand-400'
                              : theme === 'dark'
                                ? 'text-slate-500'
                                : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-brand-500/20 text-brand-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sync & Security Notice */}
        <div
          className={`p-3 rounded-xl border text-[11px] space-y-1 mt-4 ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>PostgreSQL 10 Services Live</span>
          </div>
          <p className="leading-tight text-[10px] opacity-80">
            Real-time synchronization across consumer portal, mobile apps, and master reference datasets.
          </p>
        </div>
      </aside>
    </>
  );
};
