import { Router } from 'express';
import { query } from '../db/index.js';

// ================= VILLAS ROUTER =================
export const villasRouter = Router();

villasRouter.get('/', async (req, res) => {
  try {
    const { city, max_price, guests } = req.query;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const offset = (page - 1) * limit;

    let conditions: string[] = [
      "is_active = true",
      "publication_status = 'APPROVED'",
      "(property_type = 'VILLA' OR property_type = 'HOMESTAY' OR property_type = 'RESORT')"
    ];
    let values: any[] = [];
    let idx = 1;

    if (city) {
      const cleanCity = (city as string).split(',')[0].trim();
      conditions.push(`(LOWER(city) LIKE LOWER($${idx}) OR LOWER(name) LIKE LOWER($${idx}))`);
      values.push(`%${cleanCity}%`);
      idx++;
    }
    if (max_price) {
      conditions.push(`starting_price <= $${idx}`);
      values.push(parseFloat(max_price as string));
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) as total FROM hotels ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const result = await query(
      `SELECT * FROM hotels ${whereClause} ORDER BY star_rating DESC, starting_price ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    // Notice: NO FAKE FALLBACK INJECTION!
    const rows = result.rows;

    const items = rows.map((row) => ({
      id: row.id,
      name: row.name,
      property_type: row.property_type,
      star_rating: row.star_rating,
      guest_rating: row.guest_rating,
      rating_label: row.rating_label,
      review_count: row.review_count,
      address: row.address,
      city: row.city,
      country: row.country,
      neighborhood: row.neighborhood,
      overview: row.overview,
      amenities: row.amenities || [],
      featured_image: row.featured_image,
      starting_price: parseFloat(row.starting_price),
      currency: row.currency,
      is_simulated: row.is_simulated,
    }));

    return res.json({
      success: true,
      inventory_status: items.length > 0 ? 'AVAILABLE' : 'NO_INVENTORY',
      message:
        items.length > 0
          ? 'Matching luxury villas and homestays retrieved successfully.'
          : `No villas or homestays currently available in ${city || 'this location'}. Try adjusting your dates or explore our featured private villas.`,
      data: {
        items,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= TOURS & ATTRACTIONS ROUTER =================
export const toursRouter = Router();

interface TourItem {
  id: string;
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
}

const TOURS_CATALOG: TourItem[] = [
  {
    id: 'tour-dxb-burj',
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
  },
  {
    id: 'tour-dxb-safari',
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
  },
  {
    id: 'tour-sin-gardens',
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
  },
  {
    id: 'tour-par-eiffel',
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
  },
  {
    id: 'tour-bali-nusa',
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
  },
  {
    id: 'tour-agr-taj-sunrise',
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
  },
  {
    id: 'tour-goa-scuba',
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
  },
  {
    id: 'tour-del-old-delhi',
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
  },
];

toursRouter.get('/', async (req, res) => {
  try {
    const { city, category, max_price } = req.query;
    const cleanCity = typeof city === 'string' ? city.split(',')[0].trim().toLowerCase() : '';

    let items = TOURS_CATALOG.filter((t) => {
      if (cleanCity && !t.city.toLowerCase().includes(cleanCity) && !t.country.toLowerCase().includes(cleanCity)) {
        return false;
      }
      if (category && !t.category.toLowerCase().includes((category as string).toLowerCase())) {
        return false;
      }
      if (max_price && t.price_per_person > parseFloat(max_price as string)) {
        return false;
      }
      return true;
    });

    return res.json({
      success: true,
      inventory_status: items.length > 0 ? 'AVAILABLE' : 'NO_INVENTORY',
      message:
        items.length > 0
          ? 'Tours and attractions retrieved successfully.'
          : `No sightseeing or attractions currently listed for ${city || 'this location'}. Explore our featured experiences in Dubai, Paris, and Singapore.`,
      data: {
        items,
        total: items.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= VISA ROUTER =================
export const visaRouter = Router();

interface VisaProduct {
  country_code: string;
  country_name: string;
  flag: string;
  visa_name: string;
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
}

const VISA_CATALOG: VisaProduct[] = [
  {
    country_code: 'AE',
    country_name: 'United Arab Emirates',
    flag: '🇦🇪',
    visa_name: '30-Days Express Tourist eVisa',
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
  },
  {
    country_code: 'AE',
    country_name: 'United Arab Emirates',
    flag: '🇦🇪',
    visa_name: '60-Days Long Stay Tourist eVisa',
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
  },
  {
    country_code: 'SG',
    country_name: 'Singapore',
    flag: '🇸🇬',
    visa_name: '30-Days Multiple Entry eVisa (ICA Verified)',
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
  },
  {
    country_code: 'TH',
    country_name: 'Thailand',
    flag: '🇹🇭',
    visa_name: 'Thailand Visa Waiver / Fast-Track VIP Clearance',
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
  },
  {
    country_code: 'VN',
    country_name: 'Vietnam',
    flag: '🇻🇳',
    visa_name: '30-Days Single Entry Tourist eVisa',
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
  },
  {
    country_code: 'FR',
    country_name: 'France (Schengen)',
    flag: '🇫🇷',
    visa_name: 'Short Stay Schengen Tourist Visa (Type C) Appointment & File Concierge',
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
  },
  {
    country_code: 'GB',
    country_name: 'United Kingdom',
    flag: '🇬🇧',
    visa_name: 'UK Standard Visitor Visa (6 Months) File Review & Biometrics Concierge',
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
  },
];

visaRouter.get('/', async (req, res) => {
  try {
    const { country } = req.query;
    const cleanCountry = typeof country === 'string' ? country.toLowerCase().trim() : '';

    let items = VISA_CATALOG;
    if (cleanCountry) {
      items = items.filter(
        (v) =>
          v.country_name.toLowerCase().includes(cleanCountry) ||
          v.country_code.toLowerCase().includes(cleanCountry)
      );
    }

    return res.json({
      success: true,
      inventory_status: items.length > 0 ? 'AVAILABLE' : 'NO_INVENTORY',
      message:
        items.length > 0
          ? 'Visa services retrieved successfully.'
          : `No online visa filing service currently available for ${country || 'this country'}. Contact our embassy visa desk for personalized assistance.`,
      data: {
        items,
        total: items.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= TRAVEL INSURANCE ROUTER =================
export const insuranceRouter = Router();

interface InsurancePlan {
  id: string;
  name: string;
  badge: string;
  badge_color: string;
  medical_cover: string;
  baggage_loss_cover: string;
  trip_cancellation_cover: string;
  passport_loss_cover: string;
  destination_zone: string;
  price_per_day: number;
  total_price: number;
  currency: string;
  features: string[];
  schengen_compliant: boolean;
}

const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: 'ins-silver',
    name: 'Travel Shield Silver',
    badge: 'ECONOMY ESSENTIAL',
    badge_color: 'bg-blue-600',
    medical_cover: '$50,000 USD',
    baggage_loss_cover: '$500 USD',
    trip_cancellation_cover: '$750 USD',
    passport_loss_cover: '$250 USD',
    destination_zone: 'Asia & Middle East',
    price_per_day: 49,
    total_price: 499,
    currency: 'INR',
    features: ['Cashless Hospitalization Network', 'Emergency Dental Treatment ($250)', '24/7 Multi-Lingual Emergency Helpline', 'Instant PDF Policy via Email & SMS'],
    schengen_compliant: false,
  },
  {
    id: 'ins-gold',
    name: 'Global Travel Shield Gold',
    badge: 'MOST POPULAR',
    badge_color: 'bg-emerald-600',
    medical_cover: '$100,000 USD',
    baggage_loss_cover: '$1,000 USD',
    trip_cancellation_cover: '$1,500 USD',
    passport_loss_cover: '$500 USD',
    destination_zone: 'Worldwide (Excl. USA/Canada)',
    price_per_day: 85,
    total_price: 850,
    currency: 'INR',
    features: ['100% Cashless Medical Hospitalization', 'Flight Delay Compensation (>4 Hours)', 'Loss of Checked Baggage & Laptop Cover', 'Emergency Medical Evacuation to India'],
    schengen_compliant: true,
  },
  {
    id: 'ins-platinum-schengen',
    name: 'Global Travel Shield Platinum (Schengen Certified)',
    badge: '100% EMBASSY COMPLIANT',
    badge_color: 'bg-purple-600',
    medical_cover: '€30,000 / $250,000 USD',
    baggage_loss_cover: '$2,000 USD',
    trip_cancellation_cover: '$2,500 USD',
    passport_loss_cover: '$750 USD',
    destination_zone: 'Europe & Schengen Area',
    price_per_day: 129,
    total_price: 1299,
    currency: 'INR',
    features: ['Guaranteed Acceptance at all Schengen Embassies', 'Zero Deductible / Zero Excess on claims', 'Repatriation of Mortal Remains', 'Adventure Sports Medical Cover included'],
    schengen_compliant: true,
  },
  {
    id: 'ins-usa-special',
    name: 'USA & North America Ultra Shield',
    badge: 'COMPREHENSIVE USA COVER',
    badge_color: 'bg-amber-600',
    medical_cover: '$500,000 USD',
    baggage_loss_cover: '$2,500 USD',
    trip_cancellation_cover: '$5,000 USD',
    passport_loss_cover: '$1,000 USD',
    destination_zone: 'United States & Canada',
    price_per_day: 199,
    total_price: 1999,
    currency: 'INR',
    features: ['UnitedHealthcare PPO Network in USA', 'Emergency In-Patient & ICU full reimbursement', 'Personal Liability Protection ($100,000)', 'Bounced Hotel / Flight Interruption Cover'],
    schengen_compliant: true,
  },
];

insuranceRouter.get('/', async (req, res) => {
  try {
    const { destination } = req.query;
    return res.json({
      success: true,
      inventory_status: 'AVAILABLE',
      message: 'Travel insurance plans retrieved successfully.',
      data: {
        items: INSURANCE_PLANS,
        total: INSURANCE_PLANS.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
