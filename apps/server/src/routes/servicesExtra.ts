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

// ================= TOURS & ATTRACTIONS ROUTER (DATABASE-BACKED) =================
export const toursRouter = Router();

toursRouter.get('/', async (req, res) => {
  try {
    const { city, category, max_price } = req.query;
    const cleanCity = typeof city === 'string' ? city.split(',')[0].trim().toLowerCase() : '';

    let conditions = ['is_active = true'];
    let values: any[] = [];
    let idx = 1;

    if (cleanCity) {
      conditions.push(`(LOWER(city) LIKE $${idx} OR LOWER(country) LIKE $${idx} OR LOWER(title) LIKE $${idx})`);
      values.push(`%${cleanCity}%`);
      idx++;
    }
    if (category) {
      conditions.push(`LOWER(category) LIKE $${idx}`);
      values.push(`%${(category as string).toLowerCase()}%`);
      idx++;
    }
    if (max_price) {
      conditions.push(`price_per_person <= $${idx}`);
      values.push(parseFloat(max_price as string));
      idx++;
    }

    const sql = `SELECT * FROM tours WHERE ${conditions.join(' AND ')} ORDER BY rating DESC, review_count DESC`;
    const dbRes = await query(sql, values);

    const items = dbRes.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      city: row.city,
      country: row.country,
      duration: row.duration,
      category: row.category,
      rating: parseFloat(row.rating),
      review_count: parseInt(row.review_count, 10),
      price_per_person: parseFloat(row.price_per_person),
      currency: row.currency,
      featured_image: row.featured_image,
      highlights: Array.isArray(row.highlights) ? row.highlights : JSON.parse(row.highlights || '[]'),
      cancellation_policy: row.cancellation_policy,
      instant_confirmation: row.instant_confirmation,
    }));

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

// ================= VISA ROUTER (DATABASE-BACKED) =================
export const visaRouter = Router();

visaRouter.get('/', async (req, res) => {
  try {
    const { country } = req.query;
    const cleanCountry = typeof country === 'string' ? country.toLowerCase().trim() : '';

    let conditions = ['is_active = true'];
    let values: any[] = [];
    let idx = 1;

    if (cleanCountry) {
      conditions.push(
        `(LOWER(country_name) LIKE $${idx} OR LOWER(country_code) = $${idx + 1} OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(aliases) a WHERE LOWER(a) LIKE $${idx}))`
      );
      values.push(`%${cleanCountry}%`, cleanCountry);
      idx += 2;
    }

    const sql = `SELECT * FROM visa_requirements WHERE ${conditions.join(' AND ')} ORDER BY country_name ASC, total_price ASC`;
    const dbRes = await query(sql, values);

    const items = dbRes.rows.map((row: any) => ({
      country_code: row.country_code,
      country_name: row.country_name,
      flag: row.flag_emoji,
      visa_name: row.visa_name,
      validity: row.validity,
      stay_period: row.stay_period,
      processing_time: row.processing_time,
      express_available: row.express_available,
      base_fee: parseFloat(row.base_fee),
      embassy_fee: parseFloat(row.embassy_fee || '0'),
      service_fee: parseFloat(row.service_fee || '0'),
      total_price: parseFloat(row.total_price),
      currency: row.currency,
      requirements: Array.isArray(row.requirements) ? row.requirements : JSON.parse(row.requirements || '[]'),
      approval_rate: row.approval_rate,
      aliases: Array.isArray(row.aliases) ? row.aliases : JSON.parse(row.aliases || '[]'),
    }));

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
