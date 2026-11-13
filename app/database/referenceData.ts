/**
 * SS JOURNEY - MASTER LOCATION & CATALOG REFERENCE DATASETS
 * 
 * Sources & Attributions:
 * 1. Airports: OurAirports (Public Domain / CC0) & OpenFlights.
 * 2. Railway Stations: Indian Railways Open Data / National Train Enquiry System.
 * 3. Bus Terminals: OpenStreetMap Transport & State Road Transport Corporation (SRTC) data.
 * 4. Countries: ISO-3166-1 standard reference dataset.
 * 5. Destinations: OpenStreetMap / UNWTO / Ministry of Tourism India reference data.
 * 6. Tours: SS Journey Curated Experiences & Regional Tour Operators.
 * 7. Visas: Official Embassy Guidelines & VFS / Bureau of Immigration Requirements.
 */

export interface CountryRef {
  code: string;
  iso3: string;
  name: string;
  official_name?: string;
  continent: string;
  flag_emoji: string;
  currency_code: string;
  requires_visa_for_indian_passports: boolean;
  visa_types_available: string[];
  aliases: string[];
  source?: string;
}

export interface DestinationRef {
  slug: string;
  name: string;
  display_name: string;
  state?: string;
  country: string;
  country_code?: string;
  destination_type: 'CITY' | 'HILL_STATION' | 'BEACH' | 'HERITAGE' | 'METRO' | 'ISLAND';
  latitude: number;
  longitude: number;
  timezone?: string;
  popular_services: string[];
  aliases: string[];
  source?: string;
}

export interface AirportRef {
  iata_code?: string;
  icao_code?: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  elevation_ft?: number;
  airport_type: 'large_airport' | 'medium_airport' | 'small_airport' | 'closed';
  is_commercial: boolean;
  aliases: string[];
  source?: string;
}

export interface RailwayStationRef {
  station_code: string;
  name: string;
  city: string;
  state: string;
  country: string;
  zone?: string;
  division?: string;
  latitude?: number;
  longitude?: number;
  station_category?: string;
  aliases: string[];
  source?: string;
}

export interface BusTerminalRef {
  terminal_code: string;
  name: string;
  city: string;
  state: string;
  country: string;
  terminal_type: 'ISBT' | 'BUS_STAND' | 'TRANSIT_HUB' | 'BOARDING_POINT';
  address: string;
  latitude: number;
  longitude: number;
  aliases: string[];
  source?: string;
}

export interface TourRef {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  duration: string;
  category: string;
  rating: number;
  review_count: number;
  price_per_person: number;
  currency: string;
  featured_image: string;
  highlights: string[];
  cancellation_policy: string;
  instant_confirmation: boolean;
  overview?: string;
  itinerary?: any[];
  source?: string;
}

export interface VisaRef {
  country_code: string;
  country_name: string;
  visa_slug: string;
  visa_name: string;
  flag_emoji: string;
  validity: string;
  stay_period: string;
  processing_time: string;
  express_available: boolean;
  base_fee: number;
  embassy_fee: number;
  service_fee: number;
  total_price: number;
  currency: string;
  requirements: string[];
  approval_rate: string;
  aliases: string[];
  source?: string;
}

// ============================================================================
// 1. COUNTRIES REFERENCE DATASET (ISO-3166)
// ============================================================================
export const COUNTRIES_REFERENCE: CountryRef[] = [
  // Asia
  { code: 'IN', iso3: 'IND', name: 'India', official_name: 'Republic of India', continent: 'Asia', flag_emoji: '🇮🇳', currency_code: 'INR', requires_visa_for_indian_passports: false, visa_types_available: ['Citizen'], aliases: ['bharat', 'hindustan'] },
  { code: 'AE', iso3: 'ARE', name: 'United Arab Emirates', official_name: 'United Arab Emirates', continent: 'Middle East', flag_emoji: '🇦🇪', currency_code: 'AED', requires_visa_for_indian_passports: true, visa_types_available: ['30-Days Express Tourist eVisa', '60-Days Long Stay Tourist eVisa', 'Transit Visa (96hr)'], aliases: ['uae', 'dubai', 'abu dhabi', 'sharjah', 'emirates'] },
  { code: 'SG', iso3: 'SGP', name: 'Singapore', official_name: 'Republic of Singapore', continent: 'Asia', flag_emoji: '🇸🇬', currency_code: 'SGD', requires_visa_for_indian_passports: true, visa_types_available: ['30-Days Multiple Entry eVisa (ICA Verified)', 'Business eVisa'], aliases: ['singapore', 'changi', 'lion city'] },
  { code: 'TH', iso3: 'THA', name: 'Thailand', official_name: 'Kingdom of Thailand', continent: 'Asia', flag_emoji: '🇹🇭', currency_code: 'THB', requires_visa_for_indian_passports: false, visa_types_available: ['Visa Waiver / Fast-Track VIP Clearance', '60-Days Tourist eVisa'], aliases: ['thailand', 'bangkok', 'phuket', 'siam'] },
  { code: 'MY', iso3: 'MYS', name: 'Malaysia', official_name: 'Malaysia', continent: 'Asia', flag_emoji: '🇲🇾', currency_code: 'MYR', requires_visa_for_indian_passports: false, visa_types_available: ['Visa-Free Entry (MDAC Pre-Arrival)', 'eNTRI Tourist Pass'], aliases: ['malaysia', 'kuala lumpur', 'penang'] },
  { code: 'ID', iso3: 'IDN', name: 'Indonesia', official_name: 'Republic of Indonesia', continent: 'Asia', flag_emoji: '🇮🇩', currency_code: 'IDR', requires_visa_for_indian_passports: true, visa_types_available: ['30-Days Electronic Visa on Arrival (e-VOA)', '60-Days Tourist eVisa'], aliases: ['indonesia', 'bali', 'jakarta'] },
  { code: 'VN', iso3: 'VNM', name: 'Vietnam', official_name: 'Socialist Republic of Vietnam', continent: 'Asia', flag_emoji: '🇻🇳', currency_code: 'VND', requires_visa_for_indian_passports: true, visa_types_available: ['30-Days Single Entry Tourist eVisa', '90-Days Multiple Entry eVisa'], aliases: ['vietnam', 'hanoi', 'ho chi minh', 'da nang'] },
  { code: 'LK', iso3: 'LKA', name: 'Sri Lanka', official_name: 'Democratic Socialist Republic of Sri Lanka', continent: 'Asia', flag_emoji: '🇱🇰', currency_code: 'LKR', requires_visa_for_indian_passports: false, visa_types_available: ['Free Tourist ETA Waiver', '30-Days Double Entry ETA'], aliases: ['sri lanka', 'colombo', 'ceylon'] },
  { code: 'MV', iso3: 'MDV', name: 'Maldives', official_name: 'Republic of Maldives', continent: 'Asia', flag_emoji: '🇲🇻', currency_code: 'MVR', requires_visa_for_indian_passports: false, visa_types_available: ['30-Days Free Visa on Arrival'], aliases: ['maldives', 'male'] },
  { code: 'NP', iso3: 'NPL', name: 'Nepal', official_name: 'Federal Democratic Republic of Nepal', continent: 'Asia', flag_emoji: '🇳🇵', currency_code: 'NPR', requires_visa_for_indian_passports: false, visa_types_available: ['Freedom of Movement (Voter ID / Passport)'], aliases: ['nepal', 'kathmandu'] },
  { code: 'BT', iso3: 'BTN', name: 'Bhutan', official_name: 'Kingdom of Bhutan', continent: 'Asia', flag_emoji: '🇧🇹', currency_code: 'BTN', requires_visa_for_indian_passports: false, visa_types_available: ['Entry Permit & SDF (₹1200/day)'], aliases: ['bhutan', 'thimphu', 'paro'] },
  { code: 'JP', iso3: 'JPN', name: 'Japan', official_name: 'Japan', continent: 'Asia', flag_emoji: '🇯🇵', currency_code: 'JPY', requires_visa_for_indian_passports: true, visa_types_available: ['Single Entry Tourist eVisa', '5-Year Multiple Entry Tourist Visa'], aliases: ['japan', 'tokyo', 'osaka', 'kyoto', 'nippon'] },
  { code: 'KR', iso3: 'KOR', name: 'South Korea', official_name: 'Republic of Korea', continent: 'Asia', flag_emoji: '🇰🇷', currency_code: 'KRW', requires_visa_for_indian_passports: true, visa_types_available: ['C-3-9 Tourist Visa', 'K-ETA (Jeju Island direct)'], aliases: ['korea', 'south korea', 'seoul'] },
  { code: 'SA', iso3: 'SAU', name: 'Saudi Arabia', official_name: 'Kingdom of Saudi Arabia', continent: 'Middle East', flag_emoji: '🇸🇦', currency_code: 'SAR', requires_visa_for_indian_passports: true, visa_types_available: ['Tourist eVisa (Instant with valid US/UK/Schengen visa)', 'Umrah eVisa'], aliases: ['saudi arabia', 'saudi', 'riyadh', 'jeddah', 'mecca'] },
  { code: 'QA', iso3: 'QAT', name: 'Qatar', official_name: 'State of Qatar', continent: 'Middle East', flag_emoji: '🇶🇦', currency_code: 'QAR', requires_visa_for_indian_passports: false, visa_types_available: ['30-Days Free Visa on Arrival (Hayya Portal)'], aliases: ['qatar', 'doha'] },
  { code: 'OM', iso3: 'OMN', name: 'Oman', official_name: 'Sultanate of Oman', continent: 'Middle East', flag_emoji: '🇴🇲', currency_code: 'OMR', requires_visa_for_indian_passports: true, visa_types_available: ['14-Days Visa-Free / 30-Days Unsponsored Tourist eVisa'], aliases: ['oman', 'muscat'] },
  { code: 'BH', iso3: 'BHR', name: 'Bahrain', official_name: 'Kingdom of Bahrain', continent: 'Middle East', flag_emoji: '🇧🇭', currency_code: 'BHD', requires_visa_for_indian_passports: true, visa_types_available: ['14-Days Tourist eVisa', '30-Days Multiple Entry eVisa'], aliases: ['bahrain', 'manama'] },
  { code: 'KW', iso3: 'KWT', name: 'Kuwait', official_name: 'State of Kuwait', continent: 'Middle East', flag_emoji: '🇰🇼', currency_code: 'KWD', requires_visa_for_indian_passports: true, visa_types_available: ['Standard Tourist Visa'], aliases: ['kuwait', 'kuwait city'] },
  { code: 'TR', iso3: 'TUR', name: 'Turkey', official_name: 'Republic of Türkiye', continent: 'Europe / Asia', flag_emoji: '🇹🇷', currency_code: 'TRY', requires_visa_for_indian_passports: true, visa_types_available: ['30-Days Single Entry eVisa (with valid US/UK/Schengen visa)', 'Sticker Visa'], aliases: ['turkey', 'turkiye', 'istanbul', 'ankara'] },
  { code: 'GE', iso3: 'GEO', name: 'Georgia', official_name: 'Georgia', continent: 'Europe / Asia', flag_emoji: '🇬🇪', currency_code: 'GEL', requires_visa_for_indian_passports: true, visa_types_available: ['Tourist eVisa', 'Visa-Free with valid GCC/Schengen/US visa'], aliases: ['georgia', 'tbilisi'] },
  { code: 'AZ', iso3: 'AZE', name: 'Azerbaijan', official_name: 'Republic of Azerbaijan', continent: 'Asia', flag_emoji: '🇦🇿', currency_code: 'AZN', requires_visa_for_indian_passports: true, visa_types_available: ['ASAN Tourist eVisa (3 Working Days / 3 Hours Express)'], aliases: ['azerbaijan', 'baku'] },
  { code: 'KZ', iso3: 'KAZ', name: 'Kazakhstan', official_name: 'Republic of Kazakhstan', continent: 'Central Asia', flag_emoji: '🇰🇿', currency_code: 'KZT', requires_visa_for_indian_passports: false, visa_types_available: ['14-Days Visa-Free Entry'], aliases: ['kazakhstan', 'almaty', 'astana'] },
  { code: 'UZ', iso3: 'UZB', name: 'Uzbekistan', official_name: 'Republic of Uzbekistan', continent: 'Central Asia', flag_emoji: '🇺🇿', currency_code: 'UZS', requires_visa_for_indian_passports: true, visa_types_available: ['30-Days Tourist eVisa'], aliases: ['uzbekistan', 'tashkent', 'samarkand'] },

  // Europe
  { code: 'GB', iso3: 'GBR', name: 'United Kingdom', official_name: 'United Kingdom of Great Britain and Northern Ireland', continent: 'Europe', flag_emoji: '🇬🇧', currency_code: 'GBP', requires_visa_for_indian_passports: true, visa_types_available: ['Standard Visitor Visa (6 Months)', '2-Year / 5-Year Long Term Visitor Visa'], aliases: ['uk', 'united kingdom', 'great britain', 'england', 'london', 'scotland'] },
  { code: 'FR', iso3: 'FRA', name: 'France', official_name: 'French Republic', continent: 'Europe', flag_emoji: '🇫🇷', currency_code: 'EUR', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)', 'Circulation Schengen Visa'], aliases: ['france', 'paris', 'schengen'] },
  { code: 'CH', iso3: 'CHE', name: 'Switzerland', official_name: 'Swiss Confederation', continent: 'Europe', flag_emoji: '🇨🇭', currency_code: 'CHF', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['switzerland', 'swiss', 'zurich', 'geneva', 'alps'] },
  { code: 'DE', iso3: 'DEU', name: 'Germany', official_name: 'Federal Republic of Germany', continent: 'Europe', flag_emoji: '🇩🇪', currency_code: 'EUR', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)', 'National Visa Type D'], aliases: ['germany', 'deutschland', 'berlin', 'frankfurt', 'munich'] },
  { code: 'IT', iso3: 'ITA', name: 'Italy', official_name: 'Italian Republic', continent: 'Europe', flag_emoji: '🇮🇹', currency_code: 'EUR', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['italy', 'italia', 'rome', 'milan', 'venice'] },
  { code: 'ES', iso3: 'ESP', name: 'Spain', official_name: 'Kingdom of Spain', continent: 'Europe', flag_emoji: '🇪🇸', currency_code: 'EUR', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['spain', 'espana', 'madrid', 'barcelona'] },
  { code: 'NL', iso3: 'NLD', name: 'Netherlands', official_name: 'Kingdom of the Netherlands', continent: 'Europe', flag_emoji: '🇳🇱', currency_code: 'EUR', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['netherlands', 'holland', 'amsterdam'] },
  { code: 'AT', iso3: 'AUT', name: 'Austria', official_name: 'Republic of Austria', continent: 'Europe', flag_emoji: '🇦🇹', currency_code: 'EUR', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['austria', 'vienna'] },
  { code: 'GR', iso3: 'GRC', name: 'Greece', official_name: 'Hellenic Republic', continent: 'Europe', flag_emoji: '🇬🇷', currency_code: 'EUR', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['greece', 'athens', 'santorini'] },
  { code: 'PT', iso3: 'PRT', name: 'Portugal', official_name: 'Portuguese Republic', continent: 'Europe', flag_emoji: '🇵🇹', currency_code: 'EUR', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['portugal', 'lisbon'] },
  { code: 'IS', iso3: 'ISL', name: 'Iceland', official_name: 'Iceland', continent: 'Europe', flag_emoji: '🇮🇸', currency_code: 'ISK', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['iceland', 'reykjavik'] },
  { code: 'NO', iso3: 'NOR', name: 'Norway', official_name: 'Kingdom of Norway', continent: 'Europe', flag_emoji: '🇳🇴', currency_code: 'NOK', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['norway', 'oslo'] },
  { code: 'SE', iso3: 'SWE', name: 'Sweden', official_name: 'Kingdom of Sweden', continent: 'Europe', flag_emoji: '🇸🇪', currency_code: 'SEK', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['sweden', 'stockholm'] },
  { code: 'FI', iso3: 'FIN', name: 'Finland', official_name: 'Republic of Finland', continent: 'Europe', flag_emoji: '🇫🇮', currency_code: 'EUR', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['finland', 'helsinki'] },
  { code: 'DK', iso3: 'DNK', name: 'Denmark', official_name: 'Kingdom of Denmark', continent: 'Europe', flag_emoji: '🇩🇰', currency_code: 'DKK', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'], aliases: ['denmark', 'copenhagen'] },
  { code: 'IE', iso3: 'IRL', name: 'Ireland', official_name: 'Republic of Ireland', continent: 'Europe', flag_emoji: '🇮🇪', currency_code: 'EUR', requires_visa_for_indian_passports: true, visa_types_available: ['Short Stay "C" Tourist Visa (BIVS Supported)'], aliases: ['ireland', 'dublin', 'eire'] },
  { code: 'RU', iso3: 'RUS', name: 'Russia', official_name: 'Russian Federation', continent: 'Europe / Asia', flag_emoji: '🇷🇺', currency_code: 'RUB', requires_visa_for_indian_passports: true, visa_types_available: ['Unified Electronic Visa (16-Days e-Visa)'], aliases: ['russia', 'moscow', 'saint petersburg'] },

  // Americas
  { code: 'US', iso3: 'USA', name: 'United States', official_name: 'United States of America', continent: 'North America', flag_emoji: '🇺🇸', currency_code: 'USD', requires_visa_for_indian_passports: true, visa_types_available: ['B1/B2 Tourist & Business Visitor Visa (10-Year Multiple Entry)'], aliases: ['usa', 'us', 'united states', 'america', 'new york', 'california'] },
  { code: 'CA', iso3: 'CAN', name: 'Canada', official_name: 'Canada', continent: 'North America', flag_emoji: '🇨🇦', currency_code: 'CAD', requires_visa_for_indian_passports: true, visa_types_available: ['Temporary Resident Visa (TRV - 10 Year Multiple Entry)'], aliases: ['canada', 'toronto', 'vancouver', 'montreal'] },
  { code: 'MX', iso3: 'MEX', name: 'Mexico', official_name: 'United Mexican States', continent: 'North America', flag_emoji: '🇲🇽', currency_code: 'MXN', requires_visa_for_indian_passports: true, visa_types_available: ['Visa-Free with valid US/UK/Canada/Schengen visa', 'Tourist Visa'], aliases: ['mexico', 'cancun', 'mexico city'] },
  { code: 'BR', iso3: 'BRA', name: 'Brazil', official_name: 'Federative Republic of Brazil', continent: 'South America', flag_emoji: '🇧🇷', currency_code: 'BRL', requires_visa_for_indian_passports: true, visa_types_available: ['VIVIS Tourist Visa'], aliases: ['brazil', 'brasil', 'rio de janeiro', 'sao paulo'] },
  { code: 'AR', iso3: 'ARG', name: 'Argentina', official_name: 'Argentine Republic', continent: 'South America', flag_emoji: '🇦🇷', currency_code: 'ARS', requires_visa_for_indian_passports: true, visa_types_available: ['AVE Electronic Travel Authorization (with US B2 visa)'], aliases: ['argentina', 'buenos aires'] },

  // Oceania
  { code: 'AU', iso3: 'AUS', name: 'Australia', official_name: 'Commonwealth of Australia', continent: 'Oceania', flag_emoji: '🇦🇺', currency_code: 'AUD', requires_visa_for_indian_passports: true, visa_types_available: ['Visitor Visa (Subclass 600 - Tourist Stream)'], aliases: ['australia', 'sydney', 'melbourne', 'oz'] },
  { code: 'NZ', iso3: 'NZL', name: 'New Zealand', official_name: 'New Zealand', continent: 'Oceania', flag_emoji: '🇳🇿', currency_code: 'NZD', requires_visa_for_indian_passports: true, visa_types_available: ['Visitor Visa (Tourist Stream)'], aliases: ['new zealand', 'auckland', 'kiwi'] },
  { code: 'FJ', iso3: 'FJI', name: 'Fiji', official_name: 'Republic of Fiji', continent: 'Oceania', flag_emoji: '🇫🇯', currency_code: 'FJD', requires_visa_for_indian_passports: false, visa_types_available: ['120-Days Free Visitor Permit on Arrival'], aliases: ['fiji', 'suva', 'nadi'] },

  // Africa
  { code: 'ZA', iso3: 'ZAF', name: 'South Africa', official_name: 'Republic of South Africa', continent: 'Africa', flag_emoji: '🇿🇦', currency_code: 'ZAR', requires_visa_for_indian_passports: true, visa_types_available: ['90-Days Tourist eVisa', 'Visitor Visa'], aliases: ['south africa', 'cape town', 'johannesburg'] },
  { code: 'EG', iso3: 'EGY', name: 'Egypt', official_name: 'Arab Republic of Egypt', continent: 'Africa', flag_emoji: '🇪🇬', currency_code: 'EGP', requires_visa_for_indian_passports: true, visa_types_available: ['30-Days Single Entry Tourist eVisa', 'Visa on Arrival (with GCC/US/UK visa)'], aliases: ['egypt', 'cairo', 'pyramids'] },
  { code: 'KE', iso3: 'KEN', name: 'Kenya', official_name: 'Republic of Kenya', continent: 'Africa', flag_emoji: '🇰🇪', currency_code: 'KES', requires_visa_for_indian_passports: false, visa_types_available: ['Electronic Travel Authorization (eTA - Visa-Free)'], aliases: ['kenya', 'nairobi', 'safari', 'masai mara'] },
  { code: 'TZ', iso3: 'TZA', name: 'Tanzania', official_name: 'United Republic of Tanzania', continent: 'Africa', flag_emoji: '🇹🇿', currency_code: 'TZS', requires_visa_for_indian_passports: true, visa_types_available: ['Ordinary Tourist eVisa', 'Visa on Arrival'], aliases: ['tanzania', 'zanzibar', 'kilimanjaro'] },
  { code: 'MU', iso3: 'MUS', name: 'Mauritius', official_name: 'Republic of Mauritius', continent: 'Africa', flag_emoji: '🇲🇺', currency_code: 'MUR', requires_visa_for_indian_passports: false, visa_types_available: ['60-Days Free Visa on Arrival'], aliases: ['mauritius', 'port louis'] },
  { code: 'SC', iso3: 'SYC', name: 'Seychelles', official_name: 'Republic of Seychelles', continent: 'Africa', flag_emoji: '🇸🇨', currency_code: 'SCR', requires_visa_for_indian_passports: false, visa_types_available: ['30-Days Free Visitor Permit (Pre-registration mandatory)'], aliases: ['seychelles', 'mahe'] },
  { code: 'MA', iso3: 'MAR', name: 'Morocco', official_name: 'Kingdom of Morocco', continent: 'Africa', flag_emoji: '🇲🇦', currency_code: 'MAD', requires_visa_for_indian_passports: true, visa_types_available: ['Electronic Travel Authorization (AEVM / eVisa)'], aliases: ['morocco', 'marrakech', 'casablanca'] },
];

// ============================================================================
// 2. DESTINATIONS & CITIES REFERENCE DATASET
// ============================================================================
export const DESTINATIONS_REFERENCE: DestinationRef[] = [
  // India - Metros & Urban
  { slug: 'delhi-ncr', name: 'Delhi', display_name: 'Delhi NCR, India', state: 'Delhi', country: 'India', country_code: 'IN', destination_type: 'METRO', latitude: 28.6139, longitude: 77.2090, popular_services: ['flights', 'hotels', 'trains', 'cabs', 'tours'], aliases: ['new delhi', 'ncr', 'gurugram', 'noida', 'dilli'] },
  { slug: 'mumbai-maharashtra', name: 'Mumbai', display_name: 'Mumbai, Maharashtra, India', state: 'Maharashtra', country: 'India', country_code: 'IN', destination_type: 'METRO', latitude: 19.0760, longitude: 72.8777, popular_services: ['flights', 'hotels', 'trains', 'cabs', 'tours'], aliases: ['bombay', 'south bombay', 'navi mumbai'] },
  { slug: 'bengaluru-karnataka', name: 'Bengaluru', display_name: 'Bengaluru (Bangalore), Karnataka, India', state: 'Karnataka', country: 'India', country_code: 'IN', destination_type: 'METRO', latitude: 12.9716, longitude: 77.5946, popular_services: ['flights', 'hotels', 'trains', 'buses', 'cabs'], aliases: ['bangalore', 'garden city', 'silicon valley'] },
  { slug: 'hyderabad-telangana', name: 'Hyderabad', display_name: 'Hyderabad, Telangana, India', state: 'Telangana', country: 'India', country_code: 'IN', destination_type: 'METRO', latitude: 17.3850, longitude: 78.4867, popular_services: ['flights', 'hotels', 'trains', 'cabs'], aliases: ['secunderabad', 'cyberabad'] },
  { slug: 'chennai-tamil-nadu', name: 'Chennai', display_name: 'Chennai (Madras), Tamil Nadu, India', state: 'Tamil Nadu', country: 'India', country_code: 'IN', destination_type: 'METRO', latitude: 13.0827, longitude: 80.2707, popular_services: ['flights', 'hotels', 'trains', 'buses', 'cabs'], aliases: ['madras'] },
  { slug: 'kolkata-west-bengal', name: 'Kolkata', display_name: 'Kolkata (Calcutta), West Bengal, India', state: 'West Bengal', country: 'India', country_code: 'IN', destination_type: 'METRO', latitude: 22.5726, longitude: 88.3639, popular_services: ['flights', 'hotels', 'trains', 'cabs'], aliases: ['calcutta'] },
  { slug: 'ahmedabad-gujarat', name: 'Ahmedabad', display_name: 'Ahmedabad, Gujarat, India', state: 'Gujarat', country: 'India', country_code: 'IN', destination_type: 'CITY', latitude: 23.0225, longitude: 72.5714, popular_services: ['flights', 'hotels', 'trains', 'buses', 'cabs'], aliases: ['amdavad', 'gandhinagar'] },
  { slug: 'pune-maharashtra', name: 'Pune', display_name: 'Pune, Maharashtra, India', state: 'Maharashtra', country: 'India', country_code: 'IN', destination_type: 'CITY', latitude: 18.5204, longitude: 73.8567, popular_services: ['flights', 'hotels', 'trains', 'buses', 'cabs'], aliases: ['poona', 'hinjewadi'] },

  // India - Hill Stations & Mountains
  { slug: 'manali-himachal-pradesh', name: 'Manali', display_name: 'Manali, Himachal Pradesh, India', state: 'Himachal Pradesh', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 32.2396, longitude: 77.1887, popular_services: ['hotels', 'villas', 'packages', 'cabs', 'buses'], aliases: ['old manali', 'solang', 'rohtang', 'kullu manali'] },
  { slug: 'shimla-himachal-pradesh', name: 'Shimla', display_name: 'Shimla, Himachal Pradesh, India', state: 'Himachal Pradesh', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 31.1048, longitude: 77.1734, popular_services: ['hotels', 'villas', 'packages', 'trains', 'cabs'], aliases: ['simla', 'kufri', 'mall road shimla'] },
  { slug: 'dharamshala-himachal-pradesh', name: 'Dharamshala', display_name: 'Dharamshala & McLeodGanj, Himachal Pradesh, India', state: 'Himachal Pradesh', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 32.2190, longitude: 76.3234, popular_services: ['hotels', 'villas', 'packages', 'cabs'], aliases: ['mcleodganj', 'mcleod ganj', 'kangra'] },
  { slug: 'leh-ladakh', name: 'Leh', display_name: 'Leh Ladakh, UT of Ladakh, India', state: 'Ladakh', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 34.1526, longitude: 77.5771, popular_services: ['flights', 'hotels', 'packages', 'cabs'], aliases: ['ladakh', 'pangong', 'nubra valley'] },
  { slug: 'srinagar-jammu-kashmir', name: 'Srinagar', display_name: 'Srinagar, Jammu & Kashmir, India', state: 'Jammu and Kashmir', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 34.0837, longitude: 74.7973, popular_services: ['flights', 'hotels', 'packages', 'cabs'], aliases: ['kashmir', 'dal lake', 'gulmarg', 'pahalgam'] },
  { slug: 'nainital-uttarakhand', name: 'Nainital', display_name: 'Nainital, Uttarakhand, India', state: 'Uttarakhand', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 29.3803, longitude: 79.4636, popular_services: ['hotels', 'villas', 'packages', 'cabs'], aliases: ['lake city', 'bhimtal', 'mukteshwar'] },
  { slug: 'mussoorie-uttarakhand', name: 'Mussoorie', display_name: 'Mussoorie, Uttarakhand, India', state: 'Uttarakhand', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 30.4598, longitude: 78.0644, popular_services: ['hotels', 'villas', 'packages', 'cabs'], aliases: ['queen of hills', 'dhanaulti'] },
  { slug: 'rishikesh-uttarakhand', name: 'Rishikesh', display_name: 'Rishikesh, Uttarakhand, India', state: 'Uttarakhand', country: 'India', country_code: 'IN', destination_type: 'HERITAGE', latitude: 30.0869, longitude: 78.2676, popular_services: ['hotels', 'packages', 'tours', 'cabs'], aliases: ['yoga capital', 'haridwar', 'tapovan'] },
  { slug: 'ooty-tamil-nadu', name: 'Ooty', display_name: 'Ooty (Udhagamandalam), Tamil Nadu, India', state: 'Tamil Nadu', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 11.4102, longitude: 76.6950, popular_services: ['hotels', 'villas', 'packages', 'cabs'], aliases: ['udhagamandalam', 'nilgiris', 'coonoor'] },
  { slug: 'munnar-kerala', name: 'Munnar', display_name: 'Munnar, Kerala, India', state: 'Kerala', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 10.0889, longitude: 77.0595, popular_services: ['hotels', 'villas', 'packages', 'cabs'], aliases: ['tea gardens munnar', 'idukki'] },
  { slug: 'darjeeling-west-bengal', name: 'Darjeeling', display_name: 'Darjeeling, West Bengal, India', state: 'West Bengal', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 27.0410, longitude: 88.2663, popular_services: ['hotels', 'packages', 'tours', 'cabs'], aliases: ['queen of hills', 'toy train darjeeling'] },
  { slug: 'gangtok-sikkim', name: 'Gangtok', display_name: 'Gangtok, Sikkim, India', state: 'Sikkim', country: 'India', country_code: 'IN', destination_type: 'HILL_STATION', latitude: 27.3389, longitude: 88.6065, popular_services: ['hotels', 'packages', 'cabs'], aliases: ['sikkim', 'tsomgo lake'] },

  // India - Beach & Coastal
  { slug: 'goa-india', name: 'Goa', display_name: 'Goa (North & South Goa Beaches), India', state: 'Goa', country: 'India', country_code: 'IN', destination_type: 'BEACH', latitude: 15.2993, longitude: 74.1240, popular_services: ['flights', 'hotels', 'villas', 'packages', 'cabs', 'tours'], aliases: ['panaji', 'calangute', 'baga', 'candolim', 'anjuna', 'morjim', 'palolem', 'colva'] },
  { slug: 'kochi-kerala', name: 'Kochi', display_name: 'Kochi (Cochin), Kerala, India', state: 'Kerala', country: 'India', country_code: 'IN', destination_type: 'CITY', latitude: 9.9312, longitude: 76.2673, popular_services: ['flights', 'hotels', 'packages', 'cabs'], aliases: ['cochin', 'fort kochi', 'ernakulam'] },
  { slug: 'alleppey-kerala', name: 'Alleppey', display_name: 'Alleppey (Alappuzha Backwaters), Kerala, India', state: 'Kerala', country: 'India', country_code: 'IN', destination_type: 'BEACH', latitude: 9.4981, longitude: 76.3388, popular_services: ['hotels', 'villas', 'packages', 'cabs'], aliases: ['alappuzha', 'kerala backwaters', 'houseboat alleppey'] },
  { slug: 'pondicherry-india', name: 'Pondicherry', display_name: 'Puducherry (Pondicherry French Quarter), India', state: 'Puducherry', country: 'India', country_code: 'IN', destination_type: 'BEACH', latitude: 11.9416, longitude: 79.8083, popular_services: ['hotels', 'villas', 'packages', 'cabs'], aliases: ['puducherry', 'auroville', 'white town'] },
  { slug: 'havelock-island-andaman', name: 'Havelock Island', display_name: 'Havelock Island (Swaraj Dweep), Andaman & Nicobar', state: 'Andaman and Nicobar Islands', country: 'India', country_code: 'IN', destination_type: 'ISLAND', latitude: 11.9833, longitude: 92.9833, popular_services: ['hotels', 'packages', 'tours', 'cabs'], aliases: ['swaraj dweep', 'radhanagar beach', 'andaman', 'port blair'] },

  // India - Heritage & Culture
  { slug: 'jaipur-rajasthan', name: 'Jaipur', display_name: 'Jaipur (Pink City), Rajasthan, India', state: 'Rajasthan', country: 'India', country_code: 'IN', destination_type: 'HERITAGE', latitude: 26.9124, longitude: 75.7873, popular_services: ['flights', 'hotels', 'villas', 'packages', 'trains', 'cabs', 'tours'], aliases: ['pink city', 'amer fort', 'hawa mahal'] },
  { slug: 'udaipur-rajasthan', name: 'Udaipur', display_name: 'Udaipur (City of Lakes), Rajasthan, India', state: 'Rajasthan', country: 'India', country_code: 'IN', destination_type: 'HERITAGE', latitude: 24.5854, longitude: 73.7125, popular_services: ['flights', 'hotels', 'villas', 'packages', 'trains', 'cabs'], aliases: ['city of lakes', 'lake pichola', 'lake palace'] },
  { slug: 'jodhpur-rajasthan', name: 'Jodhpur', display_name: 'Jodhpur (Blue City), Rajasthan, India', state: 'Rajasthan', country: 'India', country_code: 'IN', destination_type: 'HERITAGE', latitude: 26.2389, longitude: 73.0243, popular_services: ['flights', 'hotels', 'packages', 'trains', 'cabs'], aliases: ['blue city', 'mehrangarh'] },
  { slug: 'jaisalmer-rajasthan', name: 'Jaisalmer', display_name: 'Jaisalmer (Golden City & Thar Desert), Rajasthan, India', state: 'Rajasthan', country: 'India', country_code: 'IN', destination_type: 'HERITAGE', latitude: 26.9157, longitude: 70.9083, popular_services: ['hotels', 'packages', 'tours', 'cabs'], aliases: ['golden city', 'sam sand dunes'] },
  { slug: 'agra-uttar-pradesh', name: 'Agra', display_name: 'Agra (Taj Mahal), Uttar Pradesh, India', state: 'Uttar Pradesh', country: 'India', country_code: 'IN', destination_type: 'HERITAGE', latitude: 27.1767, longitude: 78.0081, popular_services: ['hotels', 'trains', 'cabs', 'tours'], aliases: ['taj mahal', 'fatehpur sikri'] },
  { slug: 'varanasi-uttar-pradesh', name: 'Varanasi', display_name: 'Varanasi (Kashi & Ghats), Uttar Pradesh, India', state: 'Uttar Pradesh', country: 'India', country_code: 'IN', destination_type: 'HERITAGE', latitude: 25.3176, longitude: 82.9739, popular_services: ['flights', 'hotels', 'trains', 'cabs', 'tours'], aliases: ['kashi', 'banaras', 'ganga ghats'] },
  { slug: 'amritsar-punjab', name: 'Amritsar', display_name: 'Amritsar (Golden Temple), Punjab, India', state: 'Punjab', country: 'India', country_code: 'IN', destination_type: 'HERITAGE', latitude: 31.6340, longitude: 74.8723, popular_services: ['flights', 'hotels', 'trains', 'cabs'], aliases: ['golden temple', 'wagah border'] },

  // International - Top Tourist Hubs
  { slug: 'dubai-uae', name: 'Dubai', display_name: 'Dubai, United Arab Emirates', country: 'United Arab Emirates', country_code: 'AE', destination_type: 'METRO', latitude: 25.2048, longitude: 55.2708, popular_services: ['flights', 'hotels', 'cabs', 'tours', 'visa'], aliases: ['burj khalifa', 'palm jumeirah', 'downtown dubai', 'uae'] },
  { slug: 'singapore-city', name: 'Singapore', display_name: 'Singapore, Singapore', country: 'Singapore', country_code: 'SG', destination_type: 'METRO', latitude: 1.3521, longitude: 103.8198, popular_services: ['flights', 'hotels', 'tours', 'visa'], aliases: ['marina bay', 'sentosa', 'changi'] },
  { slug: 'bangkok-thailand', name: 'Bangkok', display_name: 'Bangkok, Thailand', country: 'Thailand', country_code: 'TH', destination_type: 'METRO', latitude: 13.7563, longitude: 100.5018, popular_services: ['flights', 'hotels', 'tours', 'visa'], aliases: ['siam', 'sukhumvit', 'suvarnabhumi'] },
  { slug: 'phuket-thailand', name: 'Phuket', display_name: 'Phuket Island & Patong, Thailand', country: 'Thailand', country_code: 'TH', destination_type: 'BEACH', latitude: 7.8804, longitude: 98.3923, popular_services: ['flights', 'hotels', 'villas', 'packages', 'tours', 'visa'], aliases: ['patong', 'kata beach', 'karon'] },
  { slug: 'bali-indonesia', name: 'Bali', display_name: 'Bali (Seminyak, Ubud, Canggu), Indonesia', country: 'Indonesia', country_code: 'ID', destination_type: 'ISLAND', latitude: -8.3405, longitude: 115.0920, popular_services: ['flights', 'hotels', 'villas', 'packages', 'tours', 'visa'], aliases: ['denpasar', 'seminyak', 'ubud', 'canggu', 'kuta'] },
  { slug: 'kuala-lumpur-malaysia', name: 'Kuala Lumpur', display_name: 'Kuala Lumpur, Malaysia', country: 'Malaysia', country_code: 'MY', destination_type: 'METRO', latitude: 3.1390, longitude: 101.6869, popular_services: ['flights', 'hotels', 'tours'], aliases: ['kl', 'petronas towers', 'bukit bintang'] },
  { slug: 'london-uk', name: 'London', display_name: 'London, Greater London, United Kingdom', country: 'United Kingdom', country_code: 'GB', destination_type: 'METRO', latitude: 51.5074, longitude: -0.1278, popular_services: ['flights', 'hotels', 'cabs', 'tours', 'visa'], aliases: ['westminster', 'mayfair', 'soho', 'heathrow'] },
  { slug: 'paris-france', name: 'Paris', display_name: 'Paris, Île-de-France, France', country: 'France', country_code: 'FR', destination_type: 'METRO', latitude: 48.8566, longitude: 2.3522, popular_services: ['flights', 'hotels', 'cabs', 'tours', 'visa'], aliases: ['eiffel tower', 'champs-elysees', 'louvre'] },
  { slug: 'rome-italy', name: 'Rome', display_name: 'Rome, Lazio, Italy', country: 'Italy', country_code: 'IT', destination_type: 'HERITAGE', latitude: 41.9028, longitude: 12.4964, popular_services: ['flights', 'hotels', 'tours', 'visa'], aliases: ['roma', 'colosseum', 'vatican'] },
  { slug: 'zurich-switzerland', name: 'Zurich', display_name: 'Zurich, Switzerland', country: 'Switzerland', country_code: 'CH', destination_type: 'METRO', latitude: 47.3769, longitude: 8.5417, popular_services: ['flights', 'hotels', 'trains', 'tours', 'visa'], aliases: ['swiss alps', 'lucerne', 'interlaken'] },
  { slug: 'amsterdam-netherlands', name: 'Amsterdam', display_name: 'Amsterdam, Netherlands', country: 'Netherlands', country_code: 'NL', destination_type: 'METRO', latitude: 52.3676, longitude: 4.9041, popular_services: ['flights', 'hotels', 'tours', 'visa'], aliases: ['dam', 'holland'] },
  { slug: 'new-york-usa', name: 'New York', display_name: 'New York City (NYC), NY, United States', state: 'New York', country: 'United States', country_code: 'US', destination_type: 'METRO', latitude: 40.7128, longitude: -74.0060, popular_services: ['flights', 'hotels', 'tours', 'visa'], aliases: ['nyc', 'manhattan', 'brooklyn', 'times square'] },
  { slug: 'san-francisco-usa', name: 'San Francisco', display_name: 'San Francisco & Silicon Valley, CA, United States', state: 'California', country: 'United States', country_code: 'US', destination_type: 'METRO', latitude: 37.7749, longitude: -122.4194, popular_services: ['flights', 'hotels', 'tours', 'visa'], aliases: ['bay area', 'silicon valley', 'golden gate'] },
  { slug: 'tokyo-japan', name: 'Tokyo', display_name: 'Tokyo, Japan', country: 'Japan', country_code: 'JP', destination_type: 'METRO', latitude: 35.6762, longitude: 139.6503, popular_services: ['flights', 'hotels', 'tours', 'visa'], aliases: ['shinjuku', 'shibuya', 'ginza'] },
  { slug: 'sydney-australia', name: 'Sydney', display_name: 'Sydney, New South Wales, Australia', state: 'New South Wales', country: 'Australia', country_code: 'AU', destination_type: 'METRO', latitude: -33.8688, longitude: 151.2093, popular_services: ['flights', 'hotels', 'tours', 'visa'], aliases: ['sydney opera house', 'bondi beach'] },
  { slug: 'male-maldives', name: 'Male', display_name: 'Maldives (Malé Atoll & Overwater Resorts)', country: 'Maldives', country_code: 'MV', destination_type: 'ISLAND', latitude: 4.1755, longitude: 73.5093, popular_services: ['flights', 'hotels', 'villas', 'packages'], aliases: ['maldives', 'overwater villa', 'ari atoll'] },
  { slug: 'colombo-sri-lanka', name: 'Colombo', display_name: 'Colombo & Bentota Coast, Sri Lanka', country: 'Sri Lanka', country_code: 'LK', destination_type: 'CITY', latitude: 6.9271, longitude: 79.8612, popular_services: ['flights', 'hotels', 'packages', 'tours'], aliases: ['sri lanka beach', 'bentota', 'galle'] },
  { slug: 'reykjavik-iceland', name: 'Reykjavik', display_name: 'Reykjavík (Northern Lights & Golden Circle), Iceland', country: 'Iceland', country_code: 'IS', destination_type: 'CITY', latitude: 64.1466, longitude: -21.9426, popular_services: ['flights', 'hotels', 'tours', 'visa'], aliases: ['iceland', 'blue lagoon', 'golden circle'] },
];

// ============================================================================
// 3. AIRPORTS REFERENCE DATASET (OurAirports / CC0)
// ============================================================================
export const AIRPORTS_REFERENCE: AirportRef[] = [
  // India - Primary International & Domestic Commercial Hubs
  { iata_code: 'DEL', icao_code: 'VIDP', name: 'Indira Gandhi International Airport', city: 'Delhi', state: 'Delhi', country: 'India', country_code: 'IN', latitude: 28.5562, longitude: 77.1000, elevation_ft: 777, airport_type: 'large_airport', is_commercial: true, aliases: ['New Delhi', 'Delhi NCR', 'Palam', 'T3', 'T1', 'IGI Airport', 'Indira Gandhi'] },
  { iata_code: 'BOM', icao_code: 'VABB', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', state: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 19.0896, longitude: 72.8656, elevation_ft: 39, airport_type: 'large_airport', is_commercial: true, aliases: ['Bombay', 'Sahar', 'Santa Cruz', 'T2', 'CSMIA'] },
  { iata_code: 'BLR', icao_code: 'VOBL', name: 'Kempegowda International Airport', city: 'Bengaluru', state: 'Karnataka', country: 'India', country_code: 'IN', latitude: 13.1986, longitude: 77.7066, elevation_ft: 3000, airport_type: 'large_airport', is_commercial: true, aliases: ['Bangalore', 'Devanahalli', 'KIA'] },
  { iata_code: 'HYD', icao_code: 'VOHS', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', state: 'Telangana', country: 'India', country_code: 'IN', latitude: 17.2403, longitude: 78.4294, elevation_ft: 2024, airport_type: 'large_airport', is_commercial: true, aliases: ['Shamshabad', 'Secunderabad', 'RGIA'] },
  { iata_code: 'MAA', icao_code: 'VOMM', name: 'Chennai International Airport', city: 'Chennai', state: 'Tamil Nadu', country: 'India', country_code: 'IN', latitude: 12.9941, longitude: 80.1709, elevation_ft: 52, airport_type: 'large_airport', is_commercial: true, aliases: ['Madras', 'Meenambakkam', 'Tirisulam'] },
  { iata_code: 'CCU', icao_code: 'VECC', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', state: 'West Bengal', country: 'India', country_code: 'IN', latitude: 22.6547, longitude: 88.4467, elevation_ft: 16, airport_type: 'large_airport', is_commercial: true, aliases: ['Calcutta', 'Dum Dum', 'NSCBIA'] },
  { iata_code: 'COK', icao_code: 'VOCI', name: 'Cochin International Airport', city: 'Kochi', state: 'Kerala', country: 'India', country_code: 'IN', latitude: 10.1518, longitude: 76.3930, elevation_ft: 30, airport_type: 'large_airport', is_commercial: true, aliases: ['Cochin', 'Nedumbassery', 'Ernakulam'] },
  { iata_code: 'AMD', icao_code: 'VAAH', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', state: 'Gujarat', country: 'India', country_code: 'IN', latitude: 23.0772, longitude: 72.6347, elevation_ft: 189, airport_type: 'large_airport', is_commercial: true, aliases: ['Hansol', 'Gandhinagar', 'SVPIA'] },
  { iata_code: 'GOI', icao_code: 'VOGO', name: 'Dabolim Airport (South Goa)', city: 'Goa', state: 'Goa', country: 'India', country_code: 'IN', latitude: 15.3808, longitude: 73.8314, elevation_ft: 184, airport_type: 'medium_airport', is_commercial: true, aliases: ['Dabolim', 'Vasco', 'South Goa Airport'] },
  { iata_code: 'GOX', icao_code: 'VOGA', name: 'Manohar International Airport (Mopa / North Goa)', city: 'Goa', state: 'Goa', country: 'India', country_code: 'IN', latitude: 15.7667, longitude: 73.8667, elevation_ft: 550, airport_type: 'large_airport', is_commercial: true, aliases: ['Mopa', 'North Goa Airport', 'Pernem'] },
  { iata_code: 'PNQ', icao_code: 'VAPO', name: 'Pune International Airport', city: 'Pune', state: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 18.5822, longitude: 73.9197, elevation_ft: 1942, airport_type: 'medium_airport', is_commercial: true, aliases: ['Lohegaon', 'Poona'] },
  { iata_code: 'JAI', icao_code: 'VIJP', name: 'Jaipur International Airport', city: 'Jaipur', state: 'Rajasthan', country: 'India', country_code: 'IN', latitude: 26.8242, longitude: 75.8122, elevation_ft: 1263, airport_type: 'medium_airport', is_commercial: true, aliases: ['Sanganer', 'Pink City Airport'] },
  { iata_code: 'LKO', icao_code: 'VILK', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 26.7606, longitude: 80.8893, elevation_ft: 405, airport_type: 'medium_airport', is_commercial: true, aliases: ['Amausi', 'Nawab City Airport'] },
  { iata_code: 'IXC', icao_code: 'VICG', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', state: 'Chandigarh', country: 'India', country_code: 'IN', latitude: 30.6735, longitude: 76.7885, elevation_ft: 1012, airport_type: 'medium_airport', is_commercial: true, aliases: ['Mohali', 'Panchkula', 'Chandigarh Airport'] },
  { iata_code: 'GAU', icao_code: 'VEGT', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', state: 'Assam', country: 'India', country_code: 'IN', latitude: 26.1061, longitude: 91.5859, elevation_ft: 162, airport_type: 'medium_airport', is_commercial: true, aliases: ['Borjhar', 'Assam Airport', 'North East Gateway'] },
  { iata_code: 'BBI', icao_code: 'VEBS', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', state: 'Odisha', country: 'India', country_code: 'IN', latitude: 20.2444, longitude: 85.8178, elevation_ft: 140, airport_type: 'medium_airport', is_commercial: true, aliases: ['Orissa Airport', 'Puri Gateway'] },
  { iata_code: 'PAT', icao_code: 'VEPT', name: 'Jay Prakash Narayan International Airport', city: 'Patna', state: 'Bihar', country: 'India', country_code: 'IN', latitude: 25.5913, longitude: 85.0880, elevation_ft: 170, airport_type: 'medium_airport', is_commercial: true, aliases: ['Bihar Airport'] },
  { iata_code: 'TRV', icao_code: 'VOTV', name: 'Thiruvananthapuram International Airport', city: 'Thiruvananthapuram', state: 'Kerala', country: 'India', country_code: 'IN', latitude: 8.4821, longitude: 76.9201, elevation_ft: 15, airport_type: 'medium_airport', is_commercial: true, aliases: ['Trivandrum', 'Chacka'] },
  { iata_code: 'NAG', icao_code: 'VANP', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur', state: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 21.0922, longitude: 79.0472, elevation_ft: 1033, airport_type: 'medium_airport', is_commercial: true, aliases: ['Sonegaon', 'Orange City Airport'] },
  { iata_code: 'IDR', icao_code: 'VAID', name: 'Devi Ahilyabai Holkar International Airport', city: 'Indore', state: 'Madhya Pradesh', country: 'India', country_code: 'IN', latitude: 22.7217, longitude: 75.8011, elevation_ft: 1849, airport_type: 'medium_airport', is_commercial: true, aliases: ['Indore Airport', 'Malwa'] },
  { iata_code: 'VNS', icao_code: 'VEBN', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 25.4524, longitude: 82.8593, elevation_ft: 266, airport_type: 'medium_airport', is_commercial: true, aliases: ['Babatpur', 'Kashi Airport', 'Banaras Airport'] },
  { iata_code: 'ATQ', icao_code: 'VIAR', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', state: 'Punjab', country: 'India', country_code: 'IN', latitude: 31.7096, longitude: 74.7973, elevation_ft: 756, airport_type: 'medium_airport', is_commercial: true, aliases: ['Rajasansi', 'Golden Temple Airport'] },
  { iata_code: 'IXL', icao_code: 'VILH', name: 'Kushok Bakula Rimpochee Airport', city: 'Leh', state: 'Ladakh', country: 'India', country_code: 'IN', latitude: 34.1359, longitude: 77.5465, elevation_ft: 10682, airport_type: 'medium_airport', is_commercial: true, aliases: ['Ladakh Airport', 'High Altitude Leh Airport'] },
  { iata_code: 'SXR', icao_code: 'VISR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', country_code: 'IN', latitude: 33.9871, longitude: 74.7744, elevation_ft: 5445, airport_type: 'medium_airport', is_commercial: true, aliases: ['Budgam', 'Kashmir Airport'] },
  { iata_code: 'UDR', icao_code: 'VAUD', name: 'Maharana Pratap Airport', city: 'Udaipur', state: 'Rajasthan', country: 'India', country_code: 'IN', latitude: 24.6178, longitude: 73.8961, elevation_ft: 1684, airport_type: 'medium_airport', is_commercial: true, aliases: ['Dabok', 'Udaipur Airport'] },
  { iata_code: 'BDQ', icao_code: 'VABO', name: 'Vadodara Airport', city: 'Vadodara', state: 'Gujarat', country: 'India', country_code: 'IN', latitude: 22.3361, longitude: 73.2263, elevation_ft: 129, airport_type: 'medium_airport', is_commercial: true, aliases: ['Baroda', 'Harni'] },
  { iata_code: 'IXJ', icao_code: 'VIJU', name: 'Jammu Civil Enclave', city: 'Jammu', state: 'Jammu and Kashmir', country: 'India', country_code: 'IN', latitude: 32.6891, longitude: 74.8374, elevation_ft: 1029, airport_type: 'medium_airport', is_commercial: true, aliases: ['Satwari', 'Vaishno Devi Gateway'] },
  { iata_code: 'IXR', icao_code: 'VERC', name: 'Birsa Munda Airport', city: 'Ranchi', state: 'Jharkhand', country: 'India', country_code: 'IN', latitude: 23.3143, longitude: 85.3217, elevation_ft: 2148, airport_type: 'medium_airport', is_commercial: true, aliases: ['Hinoo', 'Jharkhand Airport'] },
  { iata_code: 'CJB', icao_code: 'VOCB', name: 'Coimbatore International Airport', city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', country_code: 'IN', latitude: 11.0299, longitude: 77.0434, elevation_ft: 1319, airport_type: 'medium_airport', is_commercial: true, aliases: ['Peelamedu', 'Kovai'] },
  { iata_code: 'VTZ', icao_code: 'VOVZ', name: 'Visakhapatnam International Airport', city: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', country_code: 'IN', latitude: 17.7212, longitude: 83.2245, elevation_ft: 17, airport_type: 'medium_airport', is_commercial: true, aliases: ['Vizag Airport'] },
  { iata_code: 'DED', icao_code: 'VIDN', name: 'Dehradun Jolly Grant Airport', city: 'Dehradun', state: 'Uttarakhand', country: 'India', country_code: 'IN', latitude: 30.1897, longitude: 78.1803, elevation_ft: 1833, airport_type: 'medium_airport', is_commercial: true, aliases: ['Jolly Grant', 'Rishikesh Gateway', 'Mussoorie Gateway'] },
  { iata_code: 'IXB', icao_code: 'VEBD', name: 'Bagdogra International Airport', city: 'Siliguri', state: 'West Bengal', country: 'India', country_code: 'IN', latitude: 26.6812, longitude: 88.3286, elevation_ft: 412, airport_type: 'medium_airport', is_commercial: true, aliases: ['Darjeeling Gateway', 'Sikkim Gateway', 'Siliguri'] },
  { iata_code: 'IXE', icao_code: 'VOML', name: 'Mangalore International Airport', city: 'Mangalore', state: 'Karnataka', country: 'India', country_code: 'IN', latitude: 12.9613, longitude: 74.8900, elevation_ft: 336, airport_type: 'medium_airport', is_commercial: true, aliases: ['Bajpe', 'Mangaluru'] },
  { iata_code: 'BHO', icao_code: 'VABP', name: 'Raja Bhoj Airport', city: 'Bhopal', state: 'Madhya Pradesh', country: 'India', country_code: 'IN', latitude: 23.2875, longitude: 77.3378, elevation_ft: 1718, airport_type: 'medium_airport', is_commercial: true, aliases: ['Bhopal Airport', 'Gandhi Nagar'] },
  { iata_code: 'RPR', icao_code: 'VARP', name: 'Swami Vivekananda Airport', city: 'Raipur', state: 'Chhattisgarh', country: 'India', country_code: 'IN', latitude: 21.1804, longitude: 81.7388, elevation_ft: 1041, airport_type: 'medium_airport', is_commercial: true, aliases: ['Mana Airport', 'Raipur'] },

  // Non-commercial / Regional Airfields (No IATA code - verified requirement)
  { icao_code: 'VI89', name: 'Sarsawa Air Force Base', city: 'Saharanpur', state: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 29.9997, longitude: 77.4244, airport_type: 'small_airport', is_commercial: false, aliases: ['Sarsawa AFB'], source: 'OurAirports' },
  { icao_code: 'VOAR', name: 'INS Rajali Naval Air Station', city: 'Arakkonam', state: 'Tamil Nadu', country: 'India', country_code: 'IN', latitude: 13.0711, longitude: 79.6919, airport_type: 'medium_airport', is_commercial: false, aliases: ['Arakkonam Naval Base'], source: 'OurAirports' },

  // International - Major Global Aviation Gateways
  { iata_code: 'DXB', icao_code: 'OMDB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', latitude: 25.2528, longitude: 55.3644, elevation_ft: 62, airport_type: 'large_airport', is_commercial: true, aliases: ['Dubai', 'T1', 'T3', 'Emirates Hub'] },
  { iata_code: 'AUH', icao_code: 'OMAA', name: 'Zayed International Airport (Abu Dhabi)', city: 'Abu Dhabi', country: 'United Arab Emirates', country_code: 'AE', latitude: 24.4330, longitude: 54.6511, elevation_ft: 88, airport_type: 'large_airport', is_commercial: true, aliases: ['Abu Dhabi', 'Etihad Hub'] },
  { iata_code: 'DOH', icao_code: 'OTHH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', country_code: 'QA', latitude: 25.2731, longitude: 51.6081, elevation_ft: 13, airport_type: 'large_airport', is_commercial: true, aliases: ['Qatar Hub', 'Doha Airport'] },
  { iata_code: 'SIN', icao_code: 'WSSS', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', country_code: 'SG', latitude: 1.3502, longitude: 103.9944, elevation_ft: 22, airport_type: 'large_airport', is_commercial: true, aliases: ['Changi', 'Jewel Changi'] },
  { iata_code: 'BKK', icao_code: 'VTBS', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', country_code: 'TH', latitude: 13.6900, longitude: 100.7501, elevation_ft: 5, airport_type: 'large_airport', is_commercial: true, aliases: ['Bangkok International', 'Suvarnabhumi'] },
  { iata_code: 'HKT', icao_code: 'VTSP', name: 'Phuket International Airport', city: 'Phuket', country: 'Thailand', country_code: 'TH', latitude: 8.1132, longitude: 98.3169, elevation_ft: 82, airport_type: 'large_airport', is_commercial: true, aliases: ['Phuket Airport'] },
  { iata_code: 'KUL', icao_code: 'WMKK', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', country_code: 'MY', latitude: 2.7456, longitude: 101.7099, elevation_ft: 70, airport_type: 'large_airport', is_commercial: true, aliases: ['KLIA', 'KLIA2', 'Sepang'] },
  { iata_code: 'DPS', icao_code: 'WADD', name: 'I Gusti Ngurah Rai International Airport', city: 'Bali', country: 'Indonesia', country_code: 'ID', latitude: -8.7482, longitude: 115.1672, elevation_ft: 14, airport_type: 'large_airport', is_commercial: true, aliases: ['Denpasar', 'Bali Airport'] },
  { iata_code: 'LHR', icao_code: 'EGLL', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', country_code: 'GB', latitude: 51.4700, longitude: -0.4543, elevation_ft: 83, airport_type: 'large_airport', is_commercial: true, aliases: ['Heathrow', 'T2', 'T3', 'T5', 'London Hub'] },
  { iata_code: 'LGW', icao_code: 'EGKK', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom', country_code: 'GB', latitude: 51.1537, longitude: -0.1821, elevation_ft: 202, airport_type: 'large_airport', is_commercial: true, aliases: ['Gatwick', 'South Terminal'] },
  { iata_code: 'CDG', icao_code: 'LFPG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', country_code: 'FR', latitude: 49.0097, longitude: 2.5479, elevation_ft: 392, airport_type: 'large_airport', is_commercial: true, aliases: ['Roissy', 'Paris CDG'] },
  { iata_code: 'AMS', icao_code: 'EHAM', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', country_code: 'NL', latitude: 52.3086, longitude: 4.7639, elevation_ft: -11, airport_type: 'large_airport', is_commercial: true, aliases: ['Schiphol', 'Amsterdam'] },
  { iata_code: 'FRA', icao_code: 'EDDF', name: 'Frankfurt am Main Airport', city: 'Frankfurt', country: 'Germany', country_code: 'DE', latitude: 50.0379, longitude: 8.5622, elevation_ft: 364, airport_type: 'large_airport', is_commercial: true, aliases: ['Frankfurt Airport', 'Lufthansa Hub'] },
  { iata_code: 'MUC', icao_code: 'EDDM', name: 'Munich Airport', city: 'Munich', country: 'Germany', country_code: 'DE', latitude: 48.3538, longitude: 11.7861, elevation_ft: 1487, airport_type: 'large_airport', is_commercial: true, aliases: ['Franz Josef Strauss', 'Bavaria Airport'] },
  { iata_code: 'ZRH', icao_code: 'LSZH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', country_code: 'CH', latitude: 47.4647, longitude: 8.5492, elevation_ft: 1416, airport_type: 'large_airport', is_commercial: true, aliases: ['Kloten', 'Swiss Hub'] },
  { iata_code: 'FCO', icao_code: 'LIRF', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy', country_code: 'IT', latitude: 41.8003, longitude: 12.2389, elevation_ft: 15, airport_type: 'large_airport', is_commercial: true, aliases: ['Fiumicino', 'Rome Airport'] },
  { iata_code: 'MAD', icao_code: 'LEMD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain', country_code: 'ES', latitude: 40.4983, longitude: -3.5676, elevation_ft: 2001, airport_type: 'large_airport', is_commercial: true, aliases: ['Barajas', 'Madrid Airport'] },
  { iata_code: 'IST', icao_code: 'LTFM', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', country_code: 'TR', latitude: 41.2753, longitude: 28.7519, elevation_ft: 325, airport_type: 'large_airport', is_commercial: true, aliases: ['Istanbul New Airport', 'Turkish Airlines Hub'] },
  { iata_code: 'JFK', icao_code: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', state: 'New York', country: 'United States', country_code: 'US', latitude: 40.6413, longitude: -73.7781, elevation_ft: 13, airport_type: 'large_airport', is_commercial: true, aliases: ['New York JFK', 'Queens', 'Kennedy'] },
  { iata_code: 'EWR', icao_code: 'KEWR', name: 'Newark Liberty International Airport', city: 'New York', state: 'New Jersey', country: 'United States', country_code: 'US', latitude: 40.6895, longitude: -74.1745, elevation_ft: 18, airport_type: 'large_airport', is_commercial: true, aliases: ['Newark', 'NYC Area'] },
  { iata_code: 'SFO', icao_code: 'KSFO', name: 'San Francisco International Airport', city: 'San Francisco', state: 'California', country: 'United States', country_code: 'US', latitude: 37.6188, longitude: -122.3750, elevation_ft: 13, airport_type: 'large_airport', is_commercial: true, aliases: ['Bay Area Hub', 'Silicon Valley Airport'] },
  { iata_code: 'ORD', icao_code: 'KORD', name: "O'Hare International Airport", city: 'Chicago', state: 'Illinois', country: 'United States', country_code: 'US', latitude: 41.9742, longitude: -87.9073, elevation_ft: 672, airport_type: 'large_airport', is_commercial: true, aliases: ['Chicago Ohare'] },
  { iata_code: 'LAX', icao_code: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'California', country: 'United States', country_code: 'US', latitude: 33.9416, longitude: -118.4085, elevation_ft: 125, airport_type: 'large_airport', is_commercial: true, aliases: ['LAX Airport', 'Southern California'] },
  { iata_code: 'YYZ', icao_code: 'CYYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', state: 'Ontario', country: 'Canada', country_code: 'CA', latitude: 43.6777, longitude: -79.6248, elevation_ft: 569, airport_type: 'large_airport', is_commercial: true, aliases: ['Pearson', 'Toronto Airport'] },
  { iata_code: 'SYD', icao_code: 'YSSY', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', state: 'New South Wales', country: 'Australia', country_code: 'AU', latitude: -33.9461, longitude: 151.1772, elevation_ft: 21, airport_type: 'large_airport', is_commercial: true, aliases: ['Mascot', 'Sydney Airport'] },
  { iata_code: 'MEL', icao_code: 'YMML', name: 'Melbourne Airport', city: 'Melbourne', state: 'Victoria', country: 'Australia', country_code: 'AU', latitude: -37.6690, longitude: 144.8410, elevation_ft: 434, airport_type: 'large_airport', is_commercial: true, aliases: ['Tullamarine'] },
  { iata_code: 'HND', icao_code: 'RJTT', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', country_code: 'JP', latitude: 35.5494, longitude: 139.7798, elevation_ft: 35, airport_type: 'large_airport', is_commercial: true, aliases: ['Haneda', 'Tokyo Hub'] },
  { iata_code: 'NRT', icao_code: 'RJAA', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', country_code: 'JP', latitude: 35.7647, longitude: 140.3863, elevation_ft: 141, airport_type: 'large_airport', is_commercial: true, aliases: ['Narita'] },
  { iata_code: 'ICN', icao_code: 'RKSI', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', country_code: 'KR', latitude: 37.4602, longitude: 126.4407, elevation_ft: 23, airport_type: 'large_airport', is_commercial: true, aliases: ['Incheon', 'Seoul Hub'] },
  { iata_code: 'MLE', icao_code: 'VRMM', name: 'Velana International Airport', city: 'Male', country: 'Maldives', country_code: 'MV', latitude: 4.1918, longitude: 73.5290, elevation_ft: 6, airport_type: 'large_airport', is_commercial: true, aliases: ['Hulhule', 'Maldives Airport'] },
  { iata_code: 'CMB', icao_code: 'VCBI', name: 'Bandaranaike International Airport', city: 'Colombo', country: 'Sri Lanka', country_code: 'LK', latitude: 7.1808, longitude: 79.8841, elevation_ft: 30, airport_type: 'large_airport', is_commercial: true, aliases: ['Katunayake', 'Sri Lanka Airport'] },
  { iata_code: 'KEF', icao_code: 'BIKF', name: 'Keflavík International Airport', city: 'Reykjavik', country: 'Iceland', country_code: 'IS', latitude: 63.9850, longitude: -22.6056, elevation_ft: 171, airport_type: 'large_airport', is_commercial: true, aliases: ['Reykjavik Airport', 'Iceland Airport'] },
];

// ============================================================================
// 4. RAILWAY STATIONS REFERENCE DATASET (Indian Railways Open Data)
// ============================================================================
export const RAILWAY_STATIONS_REFERENCE: RailwayStationRef[] = [
  // Delhi NCR
  { station_code: 'NDLS', name: 'New Delhi Railway Station', city: 'Delhi', state: 'Delhi', country: 'India', zone: 'Northern Railway (NR)', latitude: 28.6430, longitude: 77.2195, station_category: 'NSG-1', aliases: ['New Delhi', 'Pahar Ganj', 'Ajmeri Gate', 'Vande Bharat Hub'] },
  { station_code: 'DLI', name: 'Old Delhi Railway Station (Delhi Junction)', city: 'Delhi', state: 'Delhi', country: 'India', zone: 'Northern Railway (NR)', latitude: 28.6608, longitude: 77.2282, station_category: 'NSG-1', aliases: ['Old Delhi', 'Delhi Junction', 'Chandni Chowk Station'] },
  { station_code: 'NZM', name: 'Hazrat Nizamuddin Railway Station', city: 'Delhi', state: 'Delhi', country: 'India', zone: 'Northern Railway (NR)', latitude: 28.5888, longitude: 77.2536, station_category: 'NSG-1', aliases: ['Nizamuddin', 'South Delhi', 'Rajdhani Hub'] },
  { station_code: 'ANVT', name: 'Anand Vihar Terminal', city: 'Delhi', state: 'Delhi', country: 'India', zone: 'Northern Railway (NR)', latitude: 28.6508, longitude: 77.3153, station_category: 'NSG-1', aliases: ['Anand Vihar', 'East Delhi Terminal'] },
  { station_code: 'DEC', name: 'Delhi Cantt Railway Station', city: 'Delhi', state: 'Delhi', country: 'India', zone: 'Northern Railway (NR)', latitude: 28.5925, longitude: 77.1214, station_category: 'NSG-2', aliases: ['Delhi Cantt', 'IGI Airport Railway'] },

  // Mumbai & Maharashtra
  { station_code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', country: 'India', zone: 'Central Railway (CR)', latitude: 18.9401, longitude: 72.8353, station_category: 'NSG-1', aliases: ['VT', 'Victoria Terminus', 'South Mumbai', 'CST'] },
  { station_code: 'MMCT', name: 'Mumbai Central Railway Station', city: 'Mumbai', state: 'Maharashtra', country: 'India', zone: 'Western Railway (WR)', latitude: 18.9696, longitude: 72.8193, station_category: 'NSG-1', aliases: ['BCT', 'Mumbai Central', 'Western Line'] },
  { station_code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai', state: 'Maharashtra', country: 'India', zone: 'Western Railway (WR)', latitude: 19.0628, longitude: 72.8407, station_category: 'NSG-1', aliases: ['Bandra West', 'Bandra Terminus'] },
  { station_code: 'LTT', name: 'Lokmanya Tilak Terminus (Kurla Terminus)', city: 'Mumbai', state: 'Maharashtra', country: 'India', zone: 'Central Railway (CR)', latitude: 19.0694, longitude: 72.8906, station_category: 'NSG-1', aliases: ['Kurla Terminus', 'LTT Kurla'] },
  { station_code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra', country: 'India', zone: 'Central Railway (CR)', latitude: 18.5289, longitude: 73.8744, station_category: 'NSG-1', aliases: ['Poona', 'Pune Station'] },
  { station_code: 'NGP', name: 'Nagpur Junction', city: 'Nagpur', state: 'Maharashtra', country: 'India', zone: 'Central Railway (CR)', latitude: 21.1528, longitude: 79.0889, station_category: 'NSG-1', aliases: ['Nagpur Central'] },

  // Kolkata & East
  { station_code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', country: 'India', zone: 'Eastern Railway (ER)', latitude: 22.5839, longitude: 88.3426, station_category: 'NSG-1', aliases: ['Howrah', 'Howrah Bridge Station'] },
  { station_code: 'SDAH', name: 'Sealdah Railway Station', city: 'Kolkata', state: 'West Bengal', country: 'India', zone: 'Eastern Railway (ER)', latitude: 22.5697, longitude: 88.3712, station_category: 'NSG-1', aliases: ['Sealdah North', 'Sealdah South'] },
  { station_code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar', country: 'India', zone: 'East Central Railway (ECR)', latitude: 25.6022, longitude: 85.1376, station_category: 'NSG-1', aliases: ['Patna Central'] },
  { station_code: 'BBS', name: 'Bhubaneswar Railway Station', city: 'Bhubaneswar', state: 'Odisha', country: 'India', zone: 'East Coast Railway (ECoR)', latitude: 20.2668, longitude: 85.8436, station_category: 'NSG-1', aliases: ['Bhubaneswar Master Canteen'] },
  { station_code: 'PURI', name: 'Puri Railway Station', city: 'Puri', state: 'Odisha', country: 'India', zone: 'East Coast Railway (ECoR)', latitude: 19.8135, longitude: 85.8312, station_category: 'NSG-2', aliases: ['Jagannath Puri Station'] },
  { station_code: 'GHY', name: 'Guwahati Railway Station', city: 'Guwahati', state: 'Assam', country: 'India', zone: 'Northeast Frontier Railway (NFR)', latitude: 26.1856, longitude: 91.7516, station_category: 'NSG-1', aliases: ['Paltan Bazaar'] },

  // South India
  { station_code: 'MAS', name: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central (Chennai Central)', city: 'Chennai', state: 'Tamil Nadu', country: 'India', zone: 'Southern Railway (SR)', latitude: 13.0825, longitude: 80.2755, station_category: 'NSG-1', aliases: ['Chennai Central', 'Madras Central', 'Park Town'] },
  { station_code: 'MS', name: 'Chennai Egmore Railway Station', city: 'Chennai', state: 'Tamil Nadu', country: 'India', zone: 'Southern Railway (SR)', latitude: 13.0797, longitude: 80.2611, station_category: 'NSG-1', aliases: ['Egmore'] },
  { station_code: 'SBC', name: 'KSR Bengaluru City Junction (Bangalore City)', city: 'Bengaluru', state: 'Karnataka', country: 'India', zone: 'South Western Railway (SWR)', latitude: 12.9781, longitude: 77.5697, station_category: 'NSG-1', aliases: ['Bangalore City', 'Majestic Railway Station', 'Krantivira Sangolli Rayanna'] },
  { station_code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru', state: 'Karnataka', country: 'India', zone: 'South Western Railway (SWR)', latitude: 13.0238, longitude: 77.5503, station_category: 'NSG-1', aliases: ['Yeshwanthpur', 'North Bangalore Station'] },
  { station_code: 'SMVB', name: 'Sir M. Visvesvaraya Terminal (Baiyappanahalli)', city: 'Bengaluru', state: 'Karnataka', country: 'India', zone: 'South Western Railway (SWR)', latitude: 12.9926, longitude: 77.6534, station_category: 'NSG-1', aliases: ['SMVT Bengaluru', 'Air Conditioned Rail Terminal'] },
  { station_code: 'HYB', name: 'Hyderabad Deccan (Nampally)', city: 'Hyderabad', state: 'Telangana', country: 'India', zone: 'South Central Railway (SCR)', latitude: 17.3924, longitude: 78.4697, station_category: 'NSG-1', aliases: ['Nampally Station', 'Hyderabad City'] },
  { station_code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad', state: 'Telangana', country: 'India', zone: 'South Central Railway (SCR)', latitude: 17.4344, longitude: 78.5014, station_category: 'NSG-1', aliases: ['Secunderabad Central'] },
  { station_code: 'TVC', name: 'Thiruvananthapuram Central', city: 'Thiruvananthapuram', state: 'Kerala', country: 'India', zone: 'Southern Railway (SR)', latitude: 8.4869, longitude: 76.9530, station_category: 'NSG-1', aliases: ['Trivandrum Central', 'Thampanoor'] },
  { station_code: 'ERS', name: 'Ernakulam Junction (South)', city: 'Kochi', state: 'Kerala', country: 'India', zone: 'Southern Railway (SR)', latitude: 9.9678, longitude: 76.2908, station_category: 'NSG-1', aliases: ['Cochin South', 'Ernakulam South'] },

  // Uttar Pradesh & Northern Hubs
  { station_code: 'BSB', name: 'Varanasi Junction (Cantonment)', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', zone: 'Northern Railway (NR)', latitude: 25.3267, longitude: 82.9863, station_category: 'NSG-1', aliases: ['Varanasi Cantt', 'Kashi Junction', 'Banaras Cantt'] },
  { station_code: 'BSBS', name: 'Banaras Railway Station (Manduadih)', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', zone: 'North Eastern Railway (NER)', latitude: 25.3090, longitude: 82.9642, station_category: 'NSG-2', aliases: ['Manduadih', 'Banaras Terminal'] },
  { station_code: 'AGC', name: 'Agra Cantt Railway Station', city: 'Agra', state: 'Uttar Pradesh', country: 'India', zone: 'North Central Railway (NCR)', latitude: 27.1583, longitude: 77.9897, station_category: 'NSG-1', aliases: ['Agra Cantonment', 'Taj Mahal Railway Station'] },
  { station_code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh', country: 'India', zone: 'North Central Railway (NCR)', latitude: 26.4539, longitude: 80.3514, station_category: 'NSG-1', aliases: ['Kanpur Central Junction'] },
  { station_code: 'LKO', name: 'Lucknow Charbagh (NR)', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', zone: 'Northern Railway (NR)', latitude: 26.8322, longitude: 80.9208, station_category: 'NSG-1', aliases: ['Charbagh', 'Lucknow Central'] },
  { station_code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction (Mughalsarai)', city: 'Mughalsarai', state: 'Uttar Pradesh', country: 'India', zone: 'East Central Railway (ECR)', latitude: 25.2814, longitude: 83.1189, station_category: 'NSG-1', aliases: ['Mughalsarai', 'Grand Chord Hub'] },
  { station_code: 'JAT', name: 'Jammu Tawi', city: 'Jammu', state: 'Jammu and Kashmir', country: 'India', zone: 'Northern Railway (NR)', latitude: 32.7061, longitude: 74.8797, station_category: 'NSG-1', aliases: ['Jammu Station', 'Tawi'] },
  { station_code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra', city: 'Katra', state: 'Jammu and Kashmir', country: 'India', zone: 'Northern Railway (NR)', latitude: 32.9902, longitude: 74.9317, station_category: 'NSG-1', aliases: ['Katra', 'Vaishno Devi Station'] },
  { station_code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh', state: 'Chandigarh', country: 'India', zone: 'Northern Railway (NR)', latitude: 30.7058, longitude: 76.8225, station_category: 'NSG-1', aliases: ['Chandigarh Station', 'Daria'] },
  { station_code: 'ASR', name: 'Amritsar Junction', city: 'Amritsar', state: 'Punjab', country: 'India', zone: 'Northern Railway (NR)', latitude: 31.6339, longitude: 74.8656, station_category: 'NSG-1', aliases: ['Amritsar Central', 'Golden Temple Rail'] },
  { station_code: 'DDN', name: 'Dehradun Railway Station', city: 'Dehradun', state: 'Uttarakhand', country: 'India', zone: 'Northern Railway (NR)', latitude: 30.3150, longitude: 78.0336, station_category: 'NSG-2', aliases: ['Dehradun Terminal', 'Mussoorie Railhead'] },
  { station_code: 'HW', name: 'Haridwar Junction', city: 'Haridwar', state: 'Uttarakhand', country: 'India', zone: 'Northern Railway (NR)', latitude: 29.9457, longitude: 78.1564, station_category: 'NSG-1', aliases: ['Haridwar Station', 'Ganga Ghat Station'] },

  // Rajasthan & Gujarat
  { station_code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan', country: 'India', zone: 'North Western Railway (NWR)', latitude: 26.9200, longitude: 75.7878, station_category: 'NSG-1', aliases: ['Pink City Station', 'Jaipur Central'] },
  { station_code: 'JU', name: 'Jodhpur Junction', city: 'Jodhpur', state: 'Rajasthan', country: 'India', zone: 'North Western Railway (NWR)', latitude: 26.2847, longitude: 73.0211, station_category: 'NSG-1', aliases: ['Blue City Station'] },
  { station_code: 'UDZ', name: 'Udaipur City', city: 'Udaipur', state: 'Rajasthan', country: 'India', zone: 'North Western Railway (NWR)', latitude: 24.5714, longitude: 73.6989, station_category: 'NSG-2', aliases: ['Udaipur Station', 'City of Lakes Rail'] },
  { station_code: 'ADI', name: 'Ahmedabad Junction (Kalupur)', city: 'Ahmedabad', state: 'Gujarat', country: 'India', zone: 'Western Railway (WR)', latitude: 23.0225, longitude: 72.6006, station_category: 'NSG-1', aliases: ['Kalupur Station', 'Ahmedabad Central'] },
  { station_code: 'BRC', name: 'Vadodara Junction', city: 'Vadodara', state: 'Gujarat', country: 'India', zone: 'Western Railway (WR)', latitude: 22.3108, longitude: 73.1812, station_category: 'NSG-1', aliases: ['Baroda Junction'] },
  { station_code: 'ST', name: 'Surat Railway Station', city: 'Surat', state: 'Gujarat', country: 'India', zone: 'Western Railway (WR)', latitude: 21.2048, longitude: 72.8406, station_category: 'NSG-1', aliases: ['Surat Central', 'Diamond City Station'] },

  // Goa
  { station_code: 'MAO', name: 'Madgaon Junction', city: 'Goa', state: 'Goa', country: 'India', zone: 'Konkan Railway (KR)', latitude: 15.2736, longitude: 73.9781, station_category: 'NSG-1', aliases: ['Margao', 'South Goa Railway Station'] },
  { station_code: 'THVM', name: 'Thivim Railway Station', city: 'Goa', state: 'Goa', country: 'India', zone: 'Konkan Railway (KR)', latitude: 15.6083, longitude: 73.8647, station_category: 'NSG-2', aliases: ['North Goa Railhead', 'Calangute / Baga Station'] },
  { station_code: 'KRMI', name: 'Karmali Railway Station', city: 'Goa', state: 'Goa', country: 'India', zone: 'Konkan Railway (KR)', latitude: 15.4939, longitude: 73.9231, station_category: 'NSG-2', aliases: ['Panaji Railhead', 'Old Goa Station'] },
];

// ============================================================================
// 5. BUS TERMINALS REFERENCE DATASET (OpenStreetMap Transport)
// ============================================================================
export const BUS_TERMINALS_REFERENCE: BusTerminalRef[] = [
  // Delhi
  { terminal_code: 'ISBT-DEL-KG', name: 'Maharana Pratap Inter-State Bus Terminus (Kashmere Gate ISBT)', city: 'Delhi', state: 'Delhi', country: 'India', terminal_type: 'ISBT', address: 'Kashmere Gate, Mori Gate, Central Delhi, Delhi 110006', latitude: 28.6675, longitude: 77.2286, aliases: ['Kashmere Gate ISBT', 'ISBT Delhi', 'Mori Gate Bus Stand'] },
  { terminal_code: 'ISBT-DEL-AV', name: 'Swami Vivekanand Inter-State Bus Terminus (Anand Vihar ISBT)', city: 'Delhi', state: 'Delhi', country: 'India', terminal_type: 'ISBT', address: 'Anand Vihar, Trans-Yamuna, East Delhi, Delhi 110092', latitude: 28.6508, longitude: 77.3153, aliases: ['Anand Vihar ISBT', 'East Delhi Bus Terminal'] },
  { terminal_code: 'ISBT-DEL-SKK', name: 'Vir Hakikat Rai Inter-State Bus Terminus (Sarai Kale Khan ISBT)', city: 'Delhi', state: 'Delhi', country: 'India', terminal_type: 'ISBT', address: 'Sarai Kale Khan, Ring Road, South East Delhi, Delhi 110013', latitude: 28.5888, longitude: 77.2536, aliases: ['Sarai Kale Khan ISBT', 'Nizamuddin Bus Terminal'] },

  // Mumbai
  { terminal_code: 'ST-BOM-CENTRAL', name: 'Mumbai Central ST Bus Depot (MSRTC)', city: 'Mumbai', state: 'Maharashtra', country: 'India', terminal_type: 'BUS_STAND', address: 'Maratha Mandir Marg, Mumbai Central, Mumbai, Maharashtra 400008', latitude: 18.9696, longitude: 72.8193, aliases: ['Mumbai Central Bus Stand', 'MSRTC Mumbai Central'] },
  { terminal_code: 'ST-BOM-BORIVALI', name: 'Borivali Nancy Colony Bus Station', city: 'Mumbai', state: 'Maharashtra', country: 'India', terminal_type: 'BOARDING_POINT', address: 'Nancy Colony, Borivali East, Mumbai, Maharashtra 400066', latitude: 19.2288, longitude: 72.8575, aliases: ['Borivali West ST', 'Western Express Bus Hub'] },
  { terminal_code: 'ST-BOM-DADAR', name: 'Dadar Swami Narayan Temple Inter-City Bus Stand', city: 'Mumbai', state: 'Maharashtra', country: 'India', terminal_type: 'BOARDING_POINT', address: 'Dadar East / Pritam Hotel Circle, Mumbai, Maharashtra 400014', latitude: 19.0178, longitude: 72.8478, aliases: ['Dadar Asiad Bus Stand', 'Pune Shivneri Boarding'] },

  // Bengaluru
  { terminal_code: 'BS-BLR-MAJESTIC', name: 'Kempegowda Bus Station (Majestic Terminal)', city: 'Bengaluru', state: 'Karnataka', country: 'India', terminal_type: 'ISBT', address: 'Gubbi Thotadappa Rd, Gandhi Nagar, Bengaluru, Karnataka 560009', latitude: 12.9777, longitude: 77.5726, aliases: ['Majestic Bus Stand', 'KSRTC Central Bus Station'] },
  { terminal_code: 'BS-BLR-SHANTINAGAR', name: 'Shantinagar KSRTC Bus Station', city: 'Bengaluru', state: 'Karnataka', country: 'India', terminal_type: 'ISBT', address: 'Double Road, Shantinagar, Bengaluru, Karnataka 560027', latitude: 12.9550, longitude: 77.5956, aliases: ['Shantinagar Bus Station', 'Tamil Nadu / Kerala KSRTC Terminal'] },
  { terminal_code: 'BS-BLR-SILKBOARD', name: 'Silk Board Junction Intercity Boarding Plaza', city: 'Bengaluru', state: 'Karnataka', country: 'India', terminal_type: 'BOARDING_POINT', address: 'Central Silk Board Flyover, Hosur Road, Bengaluru 560068', latitude: 12.9176, longitude: 77.6238, aliases: ['Silk Board Bus Stop', 'Hosur Road Boarding'] },

  // Chennai
  { terminal_code: 'ISBT-MAA-CMBT', name: 'Chennai Mofussil Bus Terminus (CMBT Koyambedu)', city: 'Chennai', state: 'Tamil Nadu', country: 'India', terminal_type: 'ISBT', address: 'Jawaharlal Nehru Salai, Koyambedu, Chennai, Tamil Nadu 600107', latitude: 13.0694, longitude: 80.2056, aliases: ['CMBT Koyambedu', 'Chennai Bus Terminal'] },
  { terminal_code: 'ISBT-MAA-KCBT', name: 'Kalaignar Centenary Bus Terminus (Kilambakkam KCBT)', city: 'Chennai', state: 'Tamil Nadu', country: 'India', terminal_type: 'ISBT', address: 'GST Road, Kilambakkam, Chengalpattu, Chennai, Tamil Nadu 600048', latitude: 12.8364, longitude: 80.0578, aliases: ['Kilambakkam New Bus Stand', 'KCBT'] },

  // Hyderabad
  { terminal_code: 'ISBT-HYD-MGBS', name: 'Mahatma Gandhi Bus Station (MGBS / Imlibun)', city: 'Hyderabad', state: 'Telangana', country: 'India', terminal_type: 'ISBT', address: 'Gowliguda, Imlibun Island, Hyderabad, Telangana 500012', latitude: 17.3789, longitude: 78.4811, aliases: ['MGBS', 'Imlibun Bus Stand', 'TSRTC Central Terminal'] },
  { terminal_code: 'ISBT-HYD-JBS', name: 'Jubilee Bus Station (JBS)', city: 'Hyderabad', state: 'Telangana', country: 'India', terminal_type: 'ISBT', address: 'Secunderabad Cantonment, Hyderabad, Telangana 500003', latitude: 17.4489, longitude: 78.4981, aliases: ['JBS Secunderabad', 'North Telangana Terminal'] },

  // Jaipur
  { terminal_code: 'ISBT-JAI-SINDHI', name: 'Sindhi Camp Inter-State Central Bus Station', city: 'Jaipur', state: 'Rajasthan', country: 'India', terminal_type: 'ISBT', address: 'Station Road, Sindhi Camp, Pink City, Jaipur, Rajasthan 302001', latitude: 26.9234, longitude: 75.7981, aliases: ['Sindhi Camp Bus Stand', 'RSRTC Central Terminal'] },

  // Lucknow
  { terminal_code: 'ISBT-LKO-ALAMBAGH', name: 'Alambagh Inter-State Bus Terminus (UPSRTC)', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', terminal_type: 'ISBT', address: 'Kanpur Road, Alambagh, Lucknow, Uttar Pradesh 226005', latitude: 26.8156, longitude: 80.9083, aliases: ['Alambagh ISBT', 'Alambagh Modern Bus Stand'] },

  // Goa
  { terminal_code: 'BS-GOA-PANJIM', name: 'Panaji KTC Central Bus Terminal', city: 'Goa', state: 'Goa', country: 'India', terminal_type: 'ISBT', address: 'Patto Plaza, Panaji, North Goa, Goa 403001', latitude: 15.4989, longitude: 73.8317, aliases: ['Panjim Bus Stand', 'KTC Panaji'] },
  { terminal_code: 'BS-GOA-MAPUSA', name: 'Mapusa KTC Inter-State Bus Stand', city: 'Goa', state: 'Goa', country: 'India', terminal_type: 'BUS_STAND', address: 'Morod, Mapusa, Bardez, North Goa, Goa 403507', latitude: 15.5928, longitude: 73.8139, aliases: ['Mapusa Bus Stand', 'North Goa Coastal Transit'] },

  // Himachal Pradesh / Hill Stations
  { terminal_code: 'BS-MANALI-PRIVATE', name: 'Manali Private & HRTC Bus Terminal', city: 'Manali', state: 'Himachal Pradesh', country: 'India', terminal_type: 'BUS_STAND', address: 'The Mall Road / Aleo Bridge, Manali, Himachal Pradesh 175131', latitude: 32.2396, longitude: 77.1887, aliases: ['Manali Mall Road Bus Stand', 'HRTC Manali'] },
  { terminal_code: 'BS-SHIMLA-ISBT', name: 'ISBT Tutikandi New Bus Stand', city: 'Shimla', state: 'Himachal Pradesh', country: 'India', terminal_type: 'ISBT', address: 'Tutikandi, Bypass Road, Shimla, Himachal Pradesh 171004', latitude: 31.0967, longitude: 77.1517, aliases: ['Tutikandi ISBT', 'Shimla New Bus Stand'] },
  { terminal_code: 'ISBT-CDG-SEC43', name: 'Inter State Bus Terminal Sector 43', city: 'Chandigarh', state: 'Chandigarh', country: 'India', terminal_type: 'ISBT', address: 'Sector 43, Chandigarh 160043', latitude: 30.7189, longitude: 76.7461, aliases: ['ISBT 43', 'Chandigarh Bus Stand'] },
];

// ============================================================================
// 6. TOURS & ATTRACTIONS REFERENCE DATASET
// ============================================================================
export const TOURS_REFERENCE: TourRef[] = [
  // Preserved from TOURS_CATALOG in servicesExtra.ts
  {
    id: 'tour-dxb-burj',
    slug: 'burj-khalifa-at-the-top',
    title: 'Burj Khalifa: At The Top (124th + 125th Floor Observatory)',
    city: 'Dubai',
    country: 'United Arab Emirates',
    duration: '2 Hours',
    category: 'Observation Decks & Landmarks',
    rating: 4.92,
    review_count: 8420,
    price_per_person: 3850,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80',
    highlights: ['World fastest double-deck elevators', '360-degree panoramic view of Dubai', 'Sunset access option available'],
    cancellation_policy: 'Free cancellation up to 24 hours before visit',
    instant_confirmation: true,
    overview: 'Ascend to the 124th and 125th floors of the world tallest tower and witness breathtaking 360-degree views of Dubai skyline and the Arabian Gulf.',
  },
  {
    id: 'tour-dxb-safari',
    slug: 'dubai-red-dunes-desert-safari',
    title: 'Red Dunes Desert Safari with BBQ Dinner, Dune Bashing & Camel Ride',
    city: 'Dubai',
    country: 'United Arab Emirates',
    duration: '6 Hours',
    category: 'Adventure & Desert Safari',
    rating: 4.88,
    review_count: 5120,
    price_per_person: 2750,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    highlights: ['4x4 Land Cruiser dune bashing', 'Buffet dinner with vegetarian & non-veg options', 'Tanoura and belly dance show'],
    cancellation_policy: 'Free cancellation up to 24 hours',
    instant_confirmation: true,
    overview: 'Experience the exhilarating thrills of desert dune bashing followed by cultural shows, henna painting, and a five-star starlit BBQ banquet.',
  },
  {
    id: 'tour-sin-gardens',
    slug: 'gardens-by-the-bay-singapore',
    title: 'Gardens by the Bay: Flower Dome, Cloud Forest & Supertree Observatory',
    city: 'Singapore',
    country: 'Singapore',
    duration: '3.5 Hours',
    category: 'Nature & Iconic Architecture',
    rating: 4.91,
    review_count: 6730,
    price_per_person: 2950,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop&q=80',
    highlights: ['World highest indoor waterfall', 'Rare high-altitude tropical plants', 'Night light and sound spectacle'],
    cancellation_policy: 'Instant electronic barcode voucher',
    instant_confirmation: true,
    overview: 'Discover Singapore architectural botanical wonder featuring climate-controlled cooled conservatories, avatar-like supertrees, and misty cloud walks.',
  },
  {
    id: 'tour-par-eiffel',
    slug: 'eiffel-tower-direct-summit-access',
    title: 'Eiffel Tower Direct Summit Access with Guided History Walk',
    city: 'Paris',
    country: 'France',
    duration: '2.5 Hours',
    category: 'Monuments & Guided Tours',
    rating: 4.89,
    review_count: 4950,
    price_per_person: 6200,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    highlights: ['Skip-the-ticket-line elevator access', 'Top summit viewing deck', 'Expert art historian commentary'],
    cancellation_policy: 'Free cancellation up to 48 hours',
    instant_confirmation: true,
    overview: 'Skip the general admissions queue and ascend to the pinnacle of Paris with uninterrupted views of the River Seine, Notre-Dame, and the Louvre.',
  },
  {
    id: 'tour-bali-nusa',
    slug: 'nusa-penida-island-speedboat-tour',
    title: 'Nusa Penida Island Private Speedboat Tour with Kelingking & Broken Beach',
    city: 'Bali',
    country: 'Indonesia',
    duration: 'Full Day (9 Hours)',
    category: 'Island Excursions & Snorkeling',
    rating: 4.95,
    review_count: 3200,
    price_per_person: 4200,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
    highlights: ['Roundtrip hotel transfers and speedboat', 'Snorkeling at Crystal Bay', 'Private car chauffeur on island'],
    cancellation_policy: 'Free cancellation up to 24 hours',
    instant_confirmation: true,
    overview: 'Cruise across turquoise waters to Nusa Penida to photograph the iconic T-Rex cliff at Kelingking Beach and swim alongside majestic manta rays.',
  },
  {
    id: 'tour-agr-taj-sunrise',
    slug: 'taj-mahal-exclusive-sunrise-tour',
    title: 'Taj Mahal Exclusive Sunrise Tour with Skip-the-Line Entry & Agra Fort',
    city: 'Agra',
    country: 'India',
    duration: '4 Hours',
    category: 'UNESCO World Heritage',
    rating: 4.96,
    review_count: 7800,
    price_per_person: 1450,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80',
    highlights: ['Avoid crowds during golden sunrise hour', 'Government-approved heritage historian guide', 'Shoe covers and battery cart included'],
    cancellation_policy: 'Free cancellation up to 12 hours',
    instant_confirmation: true,
    overview: 'Watch the white marble of the Taj Mahal transform under the first pink hues of dawn with expert architectural and historical narration.',
  },
  {
    id: 'tour-goa-scuba',
    slug: 'grand-island-scuba-diving-water-sports',
    title: 'Grand Island Scuba Diving with Dolphin Sightings & Water Sports Combo',
    city: 'Goa',
    country: 'India',
    duration: '6 Hours',
    category: 'Water Sports & Coastal Adventures',
    rating: 4.82,
    review_count: 2450,
    price_per_person: 1950,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
    highlights: ['PADI certified dive instructor', 'Underwater video and photo package included', 'Parasailing, Banana ride and Jet Ski combo'],
    cancellation_policy: 'Free cancellation up to 24 hours',
    instant_confirmation: true,
    overview: 'Boat cruise to Grand Island featuring introductory scuba diving amid tropical corals, wild dolphin watching, and thrilling water sports rides.',
  },
  {
    id: 'tour-del-old-delhi',
    slug: 'old-delhi-culinary-walk-rickshaw',
    title: 'Old Delhi Chandni Chowk Culinary Walk & Heritage Rickshaw Safari',
    city: 'Delhi',
    country: 'India',
    duration: '3.5 Hours',
    category: 'Food, Culture & Heritage',
    rating: 4.93,
    review_count: 3120,
    price_per_person: 1250,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    highlights: ['Paranthe Wali Gali historic tastings', 'Asia largest spice market rooftop view', 'Private pedal rickshaw ride'],
    cancellation_policy: 'Free cancellation up to 24 hours',
    instant_confirmation: true,
    overview: 'Navigate the historic alleys of 17th-century Shahjahanabad by cycle rickshaw, savoring century-old recipes and aromatic spice havelis.',
  },

  // Additional Curated Tours
  {
    id: 'tour-jai-amer-heritage',
    slug: 'amer-fort-jaipur-palace-heritage-walk',
    title: 'Amer Fort & City Palace Royal Heritage Walk with Skip-the-Line Entry',
    city: 'Jaipur',
    country: 'India',
    duration: '5 Hours',
    category: 'Monuments & Guided Tours',
    rating: 4.91,
    review_count: 1840,
    price_per_person: 1650,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1603258849045-8134707011d8?w=800&auto=format&fit=crop&q=80',
    highlights: ['Sheesh Mahal Mirror Palace tour', 'Chauffeur transport in AC sedan', 'Local Rajasthani tea & lassi stop'],
    cancellation_policy: 'Free cancellation up to 24 hours',
    instant_confirmation: true,
    overview: 'Immerse yourself in Rajput royal splendor exploring Amer Fort, Jal Mahal, and the royal collections of the Jaipur City Palace.',
  },
  {
    id: 'tour-lon-thames-cruise',
    slug: 'london-thames-sunset-cruise-dinner',
    title: 'River Thames Evening Sightseeing Cruise with Sparkling Wine',
    city: 'London',
    country: 'United Kingdom',
    duration: '2 Hours',
    category: 'Cruises & Boat Tours',
    rating: 4.87,
    review_count: 2950,
    price_per_person: 3450,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop&q=80',
    highlights: ['Views of Big Ben and Tower Bridge illuminated', 'Live acoustic lounge music on board', 'Glass of sparkling prosecco'],
    cancellation_policy: 'Free cancellation up to 48 hours',
    instant_confirmation: true,
    overview: 'Glide past the Houses of Parliament, St Paul Cathedral, and Tower Bridge under the twilight glow of London skyline.',
  },
];

// ============================================================================
// 7. VISA REQUIREMENTS REFERENCE DATASET
// ============================================================================
export const VISA_REFERENCE: VisaRef[] = [
  // Preserved from VISA_CATALOG in servicesExtra.ts
  {
    country_code: 'AE',
    country_name: 'United Arab Emirates',
    visa_slug: 'ae-30-day-express',
    visa_name: '30-Days Express Tourist eVisa',
    flag_emoji: '🇦🇪',
    validity: '60 Days from issuance',
    stay_period: '30 Days single entry',
    processing_time: '24 to 48 Hours',
    express_available: true,
    base_fee: 4500,
    embassy_fee: 1499,
    service_fee: 500,
    total_price: 6499,
    currency: 'INR',
    requirements: ['Scanned Passport Front & Back (6 months validity)', 'White Background Passport Photo', 'Confirmed Return Flight Ticket'],
    approval_rate: '99.4%',
    aliases: ['uae', 'dubai', 'abu dhabi', 'emirates'],
  },
  {
    country_code: 'AE',
    country_name: 'United Arab Emirates',
    visa_slug: 'ae-60-day-long-stay',
    visa_name: '60-Days Long Stay Tourist eVisa',
    flag_emoji: '🇦🇪',
    validity: '60 Days from issuance',
    stay_period: '60 Days single entry',
    processing_time: '48 to 72 Hours',
    express_available: true,
    base_fee: 9800,
    embassy_fee: 2699,
    service_fee: 500,
    total_price: 12999,
    currency: 'INR',
    requirements: ['Scanned Passport Front & Back', 'Passport Photo', 'Hotel Reservation & Return Flights'],
    approval_rate: '99.2%',
    aliases: ['uae', 'dubai', 'abu dhabi', 'emirates'],
  },
  {
    country_code: 'SG',
    country_name: 'Singapore',
    visa_slug: 'sg-30-day-ica-verified',
    visa_name: '30-Days Multiple Entry eVisa (ICA Verified)',
    flag_emoji: '🇸🇬',
    validity: '2 Years multiple entries',
    stay_period: '30 Days per visit',
    processing_time: '3 to 4 Working Days',
    express_available: false,
    base_fee: 1800,
    embassy_fee: 650,
    service_fee: 300,
    total_price: 2750,
    currency: 'INR',
    requirements: ['Passport copy with 6 months validity', 'ICA Form 14A duly completed', 'Bank statement (past 3 months with healthy balance)', 'Covering letter'],
    approval_rate: '98.8%',
    aliases: ['singapore', 'changi'],
  },
  {
    country_code: 'TH',
    country_name: 'Thailand',
    visa_slug: 'th-waiver-vip-clearance',
    visa_name: 'Thailand Visa Waiver / Fast-Track VIP Clearance',
    flag_emoji: '🇹🇭',
    validity: '30 Days',
    stay_period: '30 Days per entry',
    processing_time: 'Instant / Same Day',
    express_available: true,
    base_fee: 1800,
    embassy_fee: 699,
    service_fee: 500,
    total_price: 2999,
    currency: 'INR',
    requirements: ['Passport valid for 30+ days', 'Confirmed return flight within 30 days', 'Proof of accommodation booking'],
    approval_rate: '99.9%',
    aliases: ['thailand', 'bangkok', 'phuket', 'siam'],
  },
  {
    country_code: 'VN',
    country_name: 'Vietnam',
    visa_slug: 'vn-30-day-evisa',
    visa_name: '30-Days Single Entry Tourist eVisa',
    flag_emoji: '🇻🇳',
    validity: '30 Days',
    stay_period: '30 Days',
    processing_time: '2 to 3 Working Days',
    express_available: true,
    base_fee: 1400,
    embassy_fee: 499,
    service_fee: 300,
    total_price: 2199,
    currency: 'INR',
    requirements: ['Passport Bio page scan', 'Digital photo without glasses'],
    approval_rate: '99.7%',
    aliases: ['vietnam', 'hanoi', 'da nang'],
  },
  {
    country_code: 'FR',
    country_name: 'France (Schengen)',
    visa_slug: 'fr-schengen-short-stay',
    visa_name: 'Short Stay Schengen Tourist Visa (Type C) Appointment & File Concierge',
    flag_emoji: '🇫🇷',
    validity: 'Up to 90 Days in 180 Days Period',
    stay_period: 'Up to 90 Days',
    processing_time: '12 to 15 Calendar Days',
    express_available: false,
    base_fee: 5500,
    embassy_fee: 2199,
    service_fee: 800,
    total_price: 8499,
    currency: 'INR',
    requirements: ['Confirmed roundtrip flights & hotel vouchers', '3 Years ITR filings & 6 months bank statements', 'Day-by-day travel itinerary', 'Travel medical insurance (€30,000 cover)'],
    approval_rate: '96.5%',
    aliases: ['france', 'paris', 'schengen', 'europe', 'switzerland', 'germany', 'italy'],
  },
  {
    country_code: 'GB',
    country_name: 'United Kingdom',
    visa_slug: 'gb-standard-visitor-6m',
    visa_name: 'UK Standard Visitor Visa (6 Months) File Review & Biometrics Concierge',
    flag_emoji: '🇬🇧',
    validity: '6 Months Multiple Entry',
    stay_period: 'Up to 180 Days',
    processing_time: '15 Working Days',
    express_available: true,
    base_fee: 10500,
    embassy_fee: 3499,
    service_fee: 1000,
    total_price: 14999,
    currency: 'INR',
    requirements: ['Current valid passport', 'Employment letter / Business registration', '6 Months bank statements & salary slips', 'Proof of funds'],
    approval_rate: '95.8%',
    aliases: ['uk', 'united kingdom', 'london', 'great britain', 'england'],
  },

  // Additional Popular Visas
  {
    country_code: 'LK',
    country_name: 'Sri Lanka',
    visa_slug: 'lk-30-day-eta',
    visa_name: '30-Days Tourist Electronic Travel Authorization (ETA)',
    flag_emoji: '🇱🇰',
    validity: '180 Days from approval',
    stay_period: '30 Days double entry',
    processing_time: '12 to 24 Hours',
    express_available: true,
    base_fee: 1200,
    embassy_fee: 0,
    service_fee: 450,
    total_price: 1650,
    currency: 'INR',
    requirements: ['Passport bio page copy (6+ months validity)', 'Return flight ticket'],
    approval_rate: '99.8%',
    aliases: ['sri lanka', 'colombo', 'ceylon'],
  },
  {
    country_code: 'MY',
    country_name: 'Malaysia',
    visa_slug: 'my-mdac-digital-pass',
    visa_name: 'Malaysia Digital Arrival Card (MDAC) & Fast-Track Assistance',
    flag_emoji: '🇲🇾',
    validity: '30 Days',
    stay_period: '30 Days per entry (Visa-Free)',
    processing_time: '2 to 6 Hours',
    express_available: true,
    base_fee: 800,
    embassy_fee: 0,
    service_fee: 350,
    total_price: 1150,
    currency: 'INR',
    requirements: ['Valid Passport (6+ months)', 'Return Flight Confirmation', 'Hotel Booking Confirmation'],
    approval_rate: '99.9%',
    aliases: ['malaysia', 'kuala lumpur', 'penang'],
  },
  {
    country_code: 'ID',
    country_name: 'Indonesia',
    visa_slug: 'id-30-day-e-voa',
    visa_name: '30-Days Electronic Visa on Arrival (e-VOA) Bali VIP Clearance',
    flag_emoji: '🇮🇩',
    validity: '90 Days to enter',
    stay_period: '30 Days single entry',
    processing_time: '12 to 24 Hours',
    express_available: true,
    base_fee: 2800,
    embassy_fee: 850,
    service_fee: 400,
    total_price: 4050,
    currency: 'INR',
    requirements: ['Passport scan with 6 months validity', 'Recent passport photo', 'Return flight ticket'],
    approval_rate: '99.7%',
    aliases: ['indonesia', 'bali', 'jakarta'],
  },
];
