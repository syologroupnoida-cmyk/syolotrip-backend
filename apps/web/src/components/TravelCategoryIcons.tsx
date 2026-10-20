import React from 'react';

export interface CategoryIconProps {
  active?: boolean;
  className?: string;
}

// 1. Flights (Isometric airplane with soft drop shadow and blue wing accent)
export const FlightsIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    {/* Ground shadow */}
    <ellipse cx="24" cy="41" rx="14" ry="4" fill={active ? "#93c5fd" : "#e2e8f0"} opacity={active ? "0.8" : "0.7"} />
    {active && <ellipse cx="26" cy="39" rx="8" ry="2.5" fill="#3b82f6" opacity="0.6" />}
    <g transform="translate(4, 3)">
      {/* Blue accent underwing */}
      <path d="M20 18 L10 32 L15 32 L24 23 Z" fill={active ? "#0084ff" : "#94a3b8"} />
      {/* Wings and fuselage */}
      <path 
        d="M36 6 C37 8 35 11 31 15 L23 23 L22 33 L19 35 L19 26 L12 30 L9 29 L14 22 L23 15 L26 8 C29 4 34 4 36 6 Z" 
        fill="#ffffff" 
        stroke="#0f172a" 
        strokeWidth="1.8" 
        strokeLinejoin="round" 
      />
      <path d="M26 13 L34 8" stroke="#0f172a" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M20 19 L16 31" stroke="#0f172a" strokeWidth="1.4" strokeLinecap="round" />
      {/* Engine */}
      <rect x="20" y="21" width="5" height="2.5" rx="1.2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" transform="rotate(-40 20 21)" />
    </g>
  </svg>
);

// 2. Hotels (Isometric buildings with windows)
export const HotelsIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    {/* Ground shadow */}
    <ellipse cx="24" cy="42" rx="16" ry="4" fill={active ? "#93c5fd" : "#e2e8f0"} />
    {/* Tall Hotel Building */}
    <path d="M12 20 L22 25 L22 41 L12 36 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M22 25 L32 20 L32 36 L22 41 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 20 L22 15 L32 20 L22 25 Z" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    {/* Windows */}
    <rect x="14" y="22" width="2.2" height="2.5" fill="#0f172a" />
    <rect x="18" y="24" width="2.2" height="2.5" fill="#0f172a" />
    <rect x="14" y="27" width="2.2" height="2.5" fill="#0f172a" />
    <rect x="18" y="29" width="2.2" height="2.5" fill="#0f172a" />
    <rect x="14" y="32" width="2.2" height="2.5" fill="#0f172a" />
    <rect x="18" y="34" width="2.2" height="2.5" fill="#0f172a" />
    {/* Shorter Annex */}
    <path d="M28 28 L38 23 L38 38 L28 43 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M28 28 L33 25 L38 28 L33 30 Z" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

// 3. Villas & Homestays (Isometric cottage with tree)
export const VillasIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    {/* Ground shadow */}
    <ellipse cx="24" cy="42" rx="16" ry="4" fill={active ? "#93c5fd" : "#e2e8f0"} />
    {/* Tree */}
    <path d="M12 32 L12 40" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="30" r="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
    {/* Cottage house */}
    <path d="M19 28 L27 32 L27 41 L19 37 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M27 32 L39 26 L39 35 L27 41 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M21 33 L25 35 L25 40 L21 38 Z" fill="#0f172a" />
    {/* Roof */}
    <path d="M17 27 L23 20 L28 31 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M23 20 L36 14 L41 24 L28 31 Z" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

// 4. Holiday Packages (Beach umbrella with ball)
export const HolidaysIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    {/* Ground shadow */}
    <ellipse cx="24" cy="42" rx="15" ry="4" fill={active ? "#93c5fd" : "#e2e8f0"} />
    {/* Beach ball */}
    <circle cx="16" cy="38" r="4.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
    <path d="M14 34 C16 38 16 38 18 42" stroke="#0f172a" strokeWidth="1.4" />
    <path d="M12 37 C16 36 18 39 20 40" stroke="#0f172a" strokeWidth="1.4" />
    <circle cx="16" cy="38" r="1.5" fill="#0f172a" />
    {/* Umbrella pole */}
    <path d="M27 20 L21 40" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    {/* Umbrella canopy */}
    <path 
      d="M16 23 C18 14 36 11 39 19 C36 21 32 23 28 24 C24 25 20 25 16 23 Z" 
      fill="#ffffff" 
      stroke="#0f172a" 
      strokeWidth="1.8" 
      strokeLinejoin="round" 
    />
    <path d="M28 13 C26 17 25 21 25 24" stroke="#0f172a" strokeWidth="1.4" />
    <path d="M33 15 C32 18 32 21 32 23" stroke="#0f172a" strokeWidth="1.4" />
  </svg>
);

// 5. Trains (Isometric high-speed bullet train on tracks)
export const TrainsIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    {/* Ground shadow */}
    <ellipse cx="24" cy="42" rx="16" ry="4" fill={active ? "#93c5fd" : "#e2e8f0"} />
    {/* Track rails */}
    <path d="M10 40 L38 23" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14 43 L42 26" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14 39 L17 41" stroke="#0f172a" strokeWidth="1.5" />
    <path d="M22 34 L25 36" stroke="#0f172a" strokeWidth="1.5" />
    <path d="M30 29 L33 31" stroke="#0f172a" strokeWidth="1.5" />
    {/* Bullet train body */}
    <path 
      d="M12 37 C11 35 12 30 16 26 C20 22 36 14 38 14 C40 14 41 16 40 18 L34 26 L20 34 C16 36 13 38 12 37 Z" 
      fill="#ffffff" 
      stroke="#0f172a" 
      strokeWidth="1.8" 
      strokeLinejoin="round" 
    />
    {/* Windshield */}
    <path d="M13 34 C14 31 16 28 19 26 L23 27 C20 30 17 33 15 35 Z" fill="#0f172a" />
    {/* Stripe */}
    <path d="M18 34 L38 22" stroke={active ? "#0084ff" : "#0f172a"} strokeWidth="1.5" />
  </svg>
);

// 6. Buses (Isometric coach bus)
export const BusesIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    {/* Ground shadow */}
    <ellipse cx="24" cy="42" rx="16" ry="4" fill={active ? "#93c5fd" : "#e2e8f0"} />
    {/* Wheels */}
    <circle cx="18" cy="39" r="3" fill="#0f172a" />
    <circle cx="33" cy="30" r="3" fill="#0f172a" />
    {/* Bus Front */}
    <path d="M12 28 L20 33 L20 40 L12 35 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M13 29 L19 33 L19 36 L13 32 Z" fill="#0f172a" />
    <circle cx="14" cy="34" r="1" fill="#facc15" />
    {/* Bus Side */}
    <path d="M20 33 L38 23 L38 31 L20 40 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M22 33 L36 25 L36 28 L22 36 Z" fill="#0f172a" />
    {/* Bus Roof */}
    <path d="M12 28 L20 22 L38 17 L38 23 L20 33 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

// 7. Cabs (Isometric car with luggage carrier)
export const CabsIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    {/* Ground shadow */}
    <ellipse cx="24" cy="42" rx="16" ry="4" fill={active ? "#93c5fd" : "#e2e8f0"} />
    {/* Roof rack */}
    <rect x="23" y="16" width="8" height="3" rx="1" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.2" transform="rotate(-25 23 16)" />
    {/* Wheels */}
    <circle cx="17" cy="39" r="3" fill="#0f172a" />
    <circle cx="32" cy="30" r="3" fill="#0f172a" />
    {/* Front Hood */}
    <path d="M12 33 L18 36 L18 40 L12 37 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    {/* Windshield */}
    <path d="M18 32 L24 25 L28 27 L22 34 Z" fill="#0f172a" />
    {/* Cabin & Side */}
    <path d="M18 36 L36 26 L36 32 L18 40 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M24 25 L33 20 L37 25 L28 27 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M24 31 L32 26 L32 29 L24 34 Z" fill="#0f172a" />
  </svg>
);

// 8. Tours & Attractions (Hot air balloon)
export const ToursIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="42" rx="6" ry="2.5" fill={active ? "#93c5fd" : "#e2e8f0"} />
    <path d="M22 36 L26 36 L25 39 L23 39 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M21 32 L22 36 M27 32 L26 36" stroke="#0f172a" strokeWidth="1" />
    <path 
      d="M24 10 C16 10 15 18 19 26 C21 30 23 32 24 32 C25 32 27 30 29 26 C33 18 32 10 24 10 Z" 
      fill="#ffffff" 
      stroke="#0f172a" 
      strokeWidth="1.8" 
      strokeLinejoin="round" 
    />
    <path d="M24 10 C21 16 21 26 24 32 C27 26 27 16 24 10 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" />
  </svg>
);

// 9. Visa (Passport booklet)
export const VisaIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="42" rx="10" ry="3.5" fill={active ? "#93c5fd" : "#e2e8f0"} />
    <path d="M23 18 L31 14 L31 36 L23 40 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M21 19 L29 15 L29 37 L21 41 Z" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M19 20 L27 16 L27 38 L19 42 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="23" cy="27" r="2.5" fill="none" stroke="#0f172a" strokeWidth="1.2" />
    <line x1="21" y1="33" x2="25" y2="31" stroke="#0f172a" strokeWidth="1.2" />
  </svg>
);

// 10. Forex Card & Currency (Banknotes & card)
export const ForexIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="42" rx="14" ry="3.5" fill={active ? "#93c5fd" : "#e2e8f0"} />
    <path d="M18 18 L34 13 L36 27 L20 32 Z" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M14 26 L30 19 L33 34 L17 41 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="23.5" cy="29.5" r="3" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" />
    <text x="22" y="32" fontSize="5" fontWeight="bold" fill="#0f172a">$</text>
  </svg>
);

// 11. Travel Insurance (Shield with emblem)
export const InsuranceIsometricIcon: React.FC<CategoryIconProps> = ({ active, className = 'w-10 h-10' }) => (
  <svg className={`${className} transition-transform group-hover:scale-105`} viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="42" rx="11" ry="3.5" fill={active ? "#93c5fd" : "#e2e8f0"} />
    <path 
      d="M16 18 C22 16 26 14 26 14 C26 14 30 16 36 18 C36 28 28 36 26 38 C24 36 16 28 16 18 Z" 
      fill="#ffffff" 
      stroke="#0f172a" 
      strokeWidth="1.8" 
      strokeLinejoin="round" 
    />
    <path d="M26 14 L26 38 C27 36 34 28 34 19 C30 17 26 14 26 14 Z" fill="#e2e8f0" />
    <path d="M26 21 L26 31 M21 25 L31 25" stroke={active ? "#0084ff" : "#0f172a"} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
