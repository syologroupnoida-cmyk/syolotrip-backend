import React from 'react';
import { Instagram, Facebook, Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate?: (screen: any) => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-[#071426] text-gray-300 mt-20 border-t border-white/10 select-none">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-8">
          
          {/* ── 1. LOGO & BRANDING ── */}
          <div className="flex items-center space-x-3.5">
            <img 
              src="/assets/ss-journey-emblem.png" 
              alt="SS Journey Logo" 
              className="h-11 w-auto object-contain" 
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black text-white tracking-tight">SS JOURNEY</h3>
                <span className="text-[9px] text-[#f28c1c] tracking-[0.2em] font-black uppercase bg-[#f28c1c]/15 px-1.5 py-0.2 rounded border border-[#f28c1c]/30">
                  GLOBAL
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium tracking-wide">
                Explore · Book · Travel · More
              </p>
            </div>
          </div>

          {/* ── 2. CONTACT INFORMATION ── */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-300">
            <a 
              href="tel:+919876543210" 
              className="flex items-center gap-2 hover:text-[#008cff] transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#008cff] group-hover:bg-[#008cff] group-hover:text-white transition-all">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-semibold uppercase">Call 24/7</span>
                <span className="font-bold text-white group-hover:text-[#008cff]">+91 98765 43210</span>
              </div>
            </a>

            <a 
              href="mailto:support@ssjourney.com" 
              className="flex items-center gap-2 hover:text-[#008cff] transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#008cff] group-hover:bg-[#008cff] group-hover:text-white transition-all">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-semibold uppercase">Email Us</span>
                <span className="font-bold text-white group-hover:text-[#008cff]">support@ssjourney.com</span>
              </div>
            </a>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#f28c1c]">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-semibold uppercase">Headquarters</span>
                <span className="font-bold text-white">Mumbai &amp; Delhi, India</span>
              </div>
            </div>
          </div>

          {/* ── 3. SOCIAL MEDIA (INSTA, FB, X) ── */}
          <div className="flex items-center space-x-3">
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 border border-white/10 text-white/90 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm"
            >
              <Instagram className="w-5 h-5" />
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#1877F2] border border-white/10 text-white/90 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm"
            >
              <Facebook className="w-5 h-5" />
            </a>

            {/* X (formerly Twitter) */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (formerly Twitter)"
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-black hover:border-white/40 border border-white/10 text-white/90 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm"
            >
              {/* Official X Logo SVG */}
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

        </div>

        {/* ── 4. COPYRIGHT ── */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-2 text-center sm:text-left">
          <p>© {new Date().getFullYear()} SS Journey (SuccessSign Journey). All rights reserved.</p>
          <p className="text-gray-400">100% Verified Travel Platform</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
