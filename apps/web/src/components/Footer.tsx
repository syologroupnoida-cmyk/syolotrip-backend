import React from 'react';
import { ShieldCheck, Heart, ExternalLink } from 'lucide-react';
import type { ScreenType } from './Header';

interface FooterProps {
  onNavigate?: (screen: ScreenType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-gradient-to-b from-[#071a3d] to-[#040e24] text-blue-200 mt-20 border-t border-[#143d8a]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/assets/ss-journey-logo.jpg" alt="SS Journey" className="w-12 h-12 rounded-xl object-cover bg-white p-0.5 ring-2 ring-[#f28c1c]/30" />
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-wider">SS JOURNEY</h3>
                <span className="text-[10px] uppercase font-bold text-[#f28c1c] tracking-[0.12em]">SuccessSign Journey</span>
              </div>
            </div>
            <p className="text-sm text-blue-300/70 leading-relaxed">
              Explore · Book · Travel · More — Your trusted travel partner for flights, luxury hotels, express buses, and bespoke holiday packages.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#f28c1c]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400/80">Trusted & Verified Platform</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Travel Services</h4>
            <ul className="space-y-2 text-sm text-blue-300/60">
              <li>
                <button 
                  type="button" 
                  onClick={() => onNavigate?.('flights')} 
                  className="hover:text-[#f28c1c] transition cursor-pointer text-left"
                >
                  Domestic & International Flights
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onNavigate?.('hotels')} 
                  className="hover:text-[#f28c1c] transition cursor-pointer text-left"
                >
                  Hotels, Resorts & Homestays
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onNavigate?.('explore')} 
                  className="hover:text-[#f28c1c] transition cursor-pointer text-left"
                >
                  Intercity Bus Booking
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onNavigate?.('checkout')} 
                  className="hover:text-[#f28c1c] transition cursor-pointer text-left"
                >
                  Curated Holiday Packages
                </button>
              </li>
            </ul>
          </div>

          {/* System & Architecture */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform Stack</h4>
            <ul className="space-y-2 text-sm text-blue-300/60">
              <li>Backend: FastAPI & SQLAlchemy 2.0</li>
              <li>Database: PostgreSQL / Alembic</li>
              <li>Frontend: React 18, Vite & Tailwind</li>
              <li>Contracts: Shared TypeScript Typings</li>
            </ul>
          </div>

          {/* Compliance & Administration */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Administration</h4>
            <p className="text-sm text-blue-300/60 mb-4">
              Operations portal for inventory management, price snapshots, and booking auditing.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate?.('admin')}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-900/40 transition cursor-pointer"
              >
                <span>Open Admin Dashboard</span>
              </button>
              <a
                href={import.meta.env.PROD ? '/admin/' : 'http://localhost:5174/admin/'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#143d8a]/40 hover:bg-[#143d8a]/60 text-xs font-semibold text-blue-200 border border-[#143d8a]/50 transition"
                title="Open standalone admin portal"
              >
                <span>Dedicated Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-300" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#143d8a]/30 flex flex-col md:flex-row items-center justify-between text-xs text-blue-400/50 gap-4">
          <p>© {new Date().getFullYear()} SS Journey (SuccessSign Journey). All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-[#f28c1c] fill-[#f28c1c]" /> for high scalability
          </p>
        </div>
      </div>
    </footer>
  );
};
