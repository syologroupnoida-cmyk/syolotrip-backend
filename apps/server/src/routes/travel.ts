import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// ================= TRAINS =================
export const trainsRouter = Router();

trainsRouter.get('/', async (req, res) => {
  try {
    const { from_city, to_city, train_type, max_price } = req.query;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const offset = (page - 1) * limit;

    let conditions: string[] = ['is_active = true'];
    let values: any[] = [];
    let idx = 1;

    if (from_city) {
      const cleanFrom = (from_city as string).split('[')[0].split('(')[0].trim();
      conditions.push(`(LOWER(from_city) LIKE LOWER($${idx}) OR LOWER(from_station_name) LIKE LOWER($${idx}) OR LOWER(from_station_code) LIKE LOWER($${idx}))`);
      values.push(`%${cleanFrom}%`);
      idx++;
    }
    if (to_city) {
      const cleanTo = (to_city as string).split('[')[0].split('(')[0].trim();
      conditions.push(`(LOWER(to_city) LIKE LOWER($${idx}) OR LOWER(to_station_name) LIKE LOWER($${idx}) OR LOWER(to_station_code) LIKE LOWER($${idx}))`);
      values.push(`%${cleanTo}%`);
      idx++;
    }
    if (train_type) {
      conditions.push(`LOWER(train_type) = LOWER($${idx})`);
      values.push(train_type);
      idx++;
    }
    if (max_price) {
      conditions.push(`base_fare <= $${idx}`);
      values.push(parseFloat(max_price as string));
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) as total FROM trains ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const result = await query(
      `SELECT * FROM trains ${whereClause} ORDER BY base_fare ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    const rows = result.rows;
    const finalTotal = total;

    const items = rows.map((r) => ({
      id: r.id,
      train_number: r.train_number,
      train_name: r.train_name,
      train_type: r.train_type,
      from_station_code: r.from_station_code,
      from_station_name: r.from_station_name,
      from_city: r.from_city,
      to_station_code: r.to_station_code,
      to_station_name: r.to_station_name,
      to_city: r.to_city,
      departure_time: r.departure_time,
      arrival_time: r.arrival_time,
      duration_minutes: r.duration_minutes,
      train_class: r.train_class,
      available_seats: r.available_seats,
      base_fare: parseFloat(r.base_fare),
      rating: r.rating,
      currency: r.currency,
      is_simulated: r.is_simulated,
    }));

    return res.json({
      success: true,
      inventory_status: items.length > 0 ? 'AVAILABLE' : 'NO_INVENTORY',
      message:
        items.length > 0
          ? 'Trains retrieved successfully'
          : `No direct trains currently scheduled between ${from_city || 'Origin'} and ${to_city || 'Destination'}. Try selecting nearby railheads or alternate travel dates.`,
      data: {
        items,
        pagination: { total: finalTotal, page, limit, pages: Math.ceil(finalTotal / limit) || 1 },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

trainsRouter.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM trains WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Train not found' });
    const r = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: r.id,
        train_number: r.train_number,
        train_name: r.train_name,
        train_type: r.train_type,
        from_station_code: r.from_station_code,
        from_station_name: r.from_station_name,
        from_city: r.from_city,
        to_station_code: r.to_station_code,
        to_station_name: r.to_station_name,
        to_city: r.to_city,
        departure_time: r.departure_time,
        arrival_time: r.arrival_time,
        duration_minutes: r.duration_minutes,
        train_class: r.train_class,
        available_seats: r.available_seats,
        base_fare: parseFloat(r.base_fare),
        rating: r.rating,
        currency: r.currency,
        is_simulated: r.is_simulated,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= BUSES =================
export const busesRouter = Router();

busesRouter.get('/', async (req, res) => {
  try {
    const { from_city, to_city, bus_type, max_price } = req.query;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const offset = (page - 1) * limit;

    let conditions: string[] = ['is_active = true'];
    let values: any[] = [];
    let idx = 1;

    if (from_city) {
      const cleanFrom = (from_city as string).split('[')[0].split('(')[0].trim();
      conditions.push(`(LOWER(from_city) LIKE LOWER($${idx}) OR LOWER(boarding_point) LIKE LOWER($${idx}))`);
      values.push(`%${cleanFrom}%`);
      idx++;
    }
    if (to_city) {
      const cleanTo = (to_city as string).split('[')[0].split('(')[0].trim();
      conditions.push(`(LOWER(to_city) LIKE LOWER($${idx}) OR LOWER(dropping_point) LIKE LOWER($${idx}))`);
      values.push(`%${cleanTo}%`);
      idx++;
    }
    if (bus_type) {
      conditions.push(`LOWER(bus_type) LIKE LOWER($${idx})`);
      values.push(`%${bus_type}%`);
      idx++;
    }
    if (max_price) {
      conditions.push(`base_fare <= $${idx}`);
      values.push(parseFloat(max_price as string));
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) as total FROM buses ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const result = await query(
      `SELECT * FROM buses ${whereClause} ORDER BY base_fare ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    const rows = result.rows;
    const finalTotal = total;

    const items = rows.map((r) => ({
      id: r.id,
      operator_name: r.operator_name,
      bus_type: r.bus_type,
      from_city: r.from_city,
      to_city: r.to_city,
      boarding_point: r.boarding_point,
      dropping_point: r.dropping_point,
      departure_time: r.departure_time,
      arrival_time: r.arrival_time,
      duration_minutes: r.duration_minutes,
      available_seats: r.available_seats,
      base_fare: parseFloat(r.base_fare),
      rating: r.rating,
      currency: r.currency,
      is_simulated: r.is_simulated,
    }));

    return res.json({
      success: true,
      inventory_status: items.length > 0 ? 'AVAILABLE' : 'NO_INVENTORY',
      message:
        items.length > 0
          ? 'Buses retrieved successfully'
          : `No bus services currently operating between ${from_city || 'Origin'} and ${to_city || 'Destination'}. Try selecting alternate dates or major bus terminals.`,
      data: {
        items,
        pagination: { total: finalTotal, page, limit, pages: Math.ceil(finalTotal / limit) || 1 },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= CABS =================
export const cabsRouter = Router();

cabsRouter.get('/', async (req, res) => {
  try {
    const { city, cab_type } = req.query;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const offset = (page - 1) * limit;

    let conditions: string[] = ['is_active = true'];
    let values: any[] = [];
    let idx = 1;

    const cityStr = typeof city === 'string' ? city.split('(')[0].split(',')[0].trim() : '';

    if (cityStr) {
      conditions.push(`(LOWER(city) LIKE LOWER($${idx}) OR LOWER(pickup_area) LIKE LOWER($${idx}) OR LOWER(drop_area) LIKE LOWER($${idx}))`);
      values.push(`%${cityStr}%`);
      idx++;
    }
    if (cab_type) {
      conditions.push(`LOWER(cab_type) = LOWER($${idx})`);
      values.push(cab_type);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) as total FROM cabs ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const result = await query(
      `SELECT * FROM cabs ${whereClause} ORDER BY base_fare ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    const rows = result.rows;
    const finalTotal = total;

    const items = rows.map((r) => ({
      id: r.id,
      cab_type: r.cab_type,
      vehicle_model: r.vehicle_model,
      city: r.city,
      pickup_area: r.pickup_area,
      drop_area: r.drop_area,
      driver_name: r.driver_name,
      driver_rating: r.driver_rating,
      capacity: r.capacity,
      base_fare: parseFloat(r.base_fare),
      currency: r.currency,
      eta_minutes: r.eta_minutes,
      features: r.features,
      is_simulated: r.is_simulated,
    }));

    return res.json({
      success: true,
      inventory_status: items.length > 0 ? 'AVAILABLE' : 'NO_INVENTORY',
      message:
        items.length > 0
          ? 'Cabs retrieved successfully'
          : `No local cabs currently available in ${cityStr || 'this location'}. You can book an outstation chauffeur or schedule airport transfer in advance.`,
      data: {
        items,
        pagination: { total: finalTotal, page, limit, pages: Math.ceil(finalTotal / limit) || 1 },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= PACKAGES =================
export const packagesRouter = Router();

packagesRouter.get('/', async (req, res) => {
  try {
    const {
      destination,
      region,
      theme,
      package_type,
      min_price,
      max_price,
      min_days,
      max_days,
      sort_by,
      status,
      search,
    } = req.query;

    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const offset = (page - 1) * limit;

    let conditions: string[] = ['is_active = true'];
    let values: any[] = [];
    let idx = 1;

    // Default to PUBLISHED packages unless explicitly requested (e.g. by admin)
    if (status && status !== 'ALL') {
      conditions.push(`publication_status = $${idx}`);
      values.push(status);
      idx++;
    } else if (!status) {
      conditions.push(`(publication_status = 'PUBLISHED' OR publication_status IS NULL)`);
    }

    if (region) {
      const cleanRegion = (region as string).trim();
      if (cleanRegion.toLowerCase() === 'domestic' || cleanRegion.toLowerCase() === 'national') {
        conditions.push(`LOWER(region) = 'national'`);
      } else if (cleanRegion.toLowerCase() === 'international') {
        conditions.push(`LOWER(region) = 'international'`);
      } else {
        conditions.push(`LOWER(region) = LOWER($${idx})`);
        values.push(cleanRegion);
        idx++;
      }
    }

    if (theme && theme !== 'ALL') {
      conditions.push(`LOWER(theme) = LOWER($${idx})`);
      values.push(theme);
      idx++;
    }

    if (package_type) {
      conditions.push(`LOWER(package_type) = LOWER($${idx})`);
      values.push(package_type);
      idx++;
    }

    let searchedDestClean = '';
    if (destination) {
      searchedDestClean = (destination as string).split(',')[0].split('(')[0].trim();
      conditions.push(
        `(LOWER(destination) LIKE LOWER($${idx}) OR LOWER(title) LIKE LOWER($${idx}) OR LOWER(COALESCE(route, '')) LIKE LOWER($${idx}))`
      );
      values.push(`%${searchedDestClean}%`);
      idx++;
    }

    if (search) {
      const cleanSearch = (search as string).trim();
      conditions.push(
        `(LOWER(title) LIKE LOWER($${idx}) OR LOWER(destination) LIKE LOWER($${idx}) OR LOWER(COALESCE(package_id, '')) LIKE LOWER($${idx}) OR LOWER(COALESCE(overview, '')) LIKE LOWER($${idx}))`
      );
      values.push(`%${cleanSearch}%`);
      idx++;
    }

    if (min_price) {
      conditions.push(`price_per_person >= $${idx}`);
      values.push(parseFloat(min_price as string));
      idx++;
    }
    if (max_price) {
      conditions.push(`price_per_person <= $${idx}`);
      values.push(parseFloat(max_price as string));
      idx++;
    }

    if (min_days) {
      conditions.push(`duration_days >= $${idx}`);
      values.push(parseInt(min_days as string, 10));
      idx++;
    }
    if (max_days) {
      conditions.push(`duration_days <= $${idx}`);
      values.push(parseInt(max_days as string, 10));
      idx++;
    }

    // Determine Sort Order
    let orderBy = 'price_per_person ASC';
    if (sort_by === 'price_desc') orderBy = 'price_per_person DESC';
    else if (sort_by === 'duration_asc') orderBy = 'duration_days ASC, price_per_person ASC';
    else if (sort_by === 'duration_desc') orderBy = 'duration_days DESC, price_per_person ASC';
    else if (sort_by === 'rating_desc') orderBy = 'rating DESC, price_per_person ASC';
    else if (sort_by === 'popular') orderBy = 'rating DESC, available_capacity ASC';

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) as total FROM holiday_packages ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const result = await query(
      `SELECT * FROM holiday_packages ${whereClause} ORDER BY ${orderBy} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    const rows = result.rows;

    const items = rows.map((r) => ({
      id: r.id,
      package_id: r.package_id || null,
      slug: r.slug || null,
      title: r.title,
      destination: r.destination,
      region: r.region || 'National',
      theme: r.theme || 'Explorer',
      package_type: r.package_type || 'Holiday',
      duration: r.duration || `${r.duration_nights || 4} Nights / ${r.duration_days || 5} Days`,
      duration_days: r.duration_days,
      duration_nights: r.duration_nights,
      overview: r.overview,
      inclusions: Array.isArray(r.inclusions) ? r.inclusions : [],
      exclusions: Array.isArray(r.exclusions) ? r.exclusions : [],
      highlights: Array.isArray(r.highlights) ? r.highlights : [],
      places_covered: Array.isArray(r.places_covered) ? r.places_covered : [],
      activities: Array.isArray(r.activities) ? r.activities : [],
      hotel_category: r.hotel_category || '3/4 Star',
      transfers: r.transfers || 'Included',
      meals: r.meals || 'Breakfast',
      sightseeing: r.sightseeing || 'As per itinerary',
      best_time_to_visit: r.best_time_to_visit || 'Year round',
      suitable_for: r.suitable_for || r.theme,
      offer_title: r.offer_title || null,
      offer_description: r.offer_description || null,
      cancellation_policy: r.cancellation_policy || null,
      seo_title: r.seo_title || null,
      seo_description: r.seo_description || null,
      seo_keywords: r.seo_keywords || null,
      day_wise_itinerary_text: r.day_wise_itinerary_text || null,
      publication_status: r.publication_status || 'PUBLISHED',
      price_per_person: parseFloat(r.price_per_person),
      old_price: r.old_price ? parseFloat(r.old_price) : Math.round(parseFloat(r.price_per_person) * 1.15),
      discount_percent: r.discount_percent || 0,
      currency: r.currency || 'INR',
      featured_image: r.featured_image,
      rating: parseFloat(r.rating) || 4.8,
      available_capacity: r.available_capacity || 20,
      is_simulated: r.is_simulated || false,
    }));

    return res.json({
      success: true,
      inventory_status: items.length > 0 ? 'AVAILABLE' : 'NO_INVENTORY',
      pricing_notice:
        'Prices shown are indicative starting prices per person and are subject to supplier confirmation, season, and customizations.',
      message:
        items.length > 0
          ? 'Holiday packages retrieved successfully'
          : `No holiday packages currently found for ${searchedDestClean || destination || 'this selection'}. Explore our featured packages in Kerala, Dubai, Bali, and Andaman.`,
      data: {
        items,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/packages/:idOrSlug
packagesRouter.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let pkgResult;
    if (isUuid) {
      pkgResult = await query('SELECT * FROM holiday_packages WHERE id = $1', [idOrSlug]);
    } else {
      pkgResult = await query(
        'SELECT * FROM holiday_packages WHERE package_id = $1 OR LOWER(slug) = LOWER($1)',
        [idOrSlug]
      );
    }

    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Holiday package not found' });
    }

    const r = pkgResult.rows[0];

    // Fetch relational day-wise itineraries
    let itineraries: any[] = [];
    if (r.package_id) {
      const itinRes = await query(
        'SELECT day_number, destination, package_title, itinerary_description FROM package_itineraries WHERE package_id = $1 ORDER BY day_number ASC',
        [r.package_id]
      );
      itineraries = itinRes.rows.map((it) => ({
        day_number: it.day_number,
        destination: it.destination,
        title: `Day ${it.day_number}: ${it.destination || 'Sightseeing & Transfers'}`,
        description: it.itinerary_description,
      }));
    }

    const packageData = {
      id: r.id,
      package_id: r.package_id || null,
      slug: r.slug || null,
      title: r.title,
      destination: r.destination,
      region: r.region || 'National',
      theme: r.theme || 'Explorer',
      package_type: r.package_type || 'Holiday',
      duration: r.duration || `${r.duration_nights || 4} Nights / ${r.duration_days || 5} Days`,
      duration_days: r.duration_days,
      duration_nights: r.duration_nights,
      overview: r.overview,
      inclusions: Array.isArray(r.inclusions) ? r.inclusions : [],
      exclusions: Array.isArray(r.exclusions) ? r.exclusions : [],
      highlights: Array.isArray(r.highlights) ? r.highlights : [],
      places_covered: Array.isArray(r.places_covered) ? r.places_covered : [],
      activities: Array.isArray(r.activities) ? r.activities : [],
      hotel_category: r.hotel_category || '3/4 Star',
      transfers: r.transfers || 'Included',
      meals: r.meals || 'Breakfast',
      sightseeing: r.sightseeing || 'As per itinerary',
      best_time_to_visit: r.best_time_to_visit || 'Year round',
      suitable_for: r.suitable_for || r.theme,
      offer_title: r.offer_title || null,
      offer_description: r.offer_description || null,
      cancellation_policy: r.cancellation_policy || null,
      seo_title: r.seo_title || null,
      seo_description: r.seo_description || null,
      seo_keywords: r.seo_keywords || null,
      day_wise_itinerary_text: r.day_wise_itinerary_text || null,
      itineraries,
      publication_status: r.publication_status || 'PUBLISHED',
      price_per_person: parseFloat(r.price_per_person),
      old_price: r.old_price ? parseFloat(r.old_price) : Math.round(parseFloat(r.price_per_person) * 1.15),
      discount_percent: r.discount_percent || 0,
      currency: r.currency || 'INR',
      featured_image: r.featured_image,
      rating: parseFloat(r.rating) || 4.8,
      available_capacity: r.available_capacity || 20,
      is_simulated: r.is_simulated || false,
      pricing_notice:
        'Prices shown are indicative starting prices per person and are subject to supplier confirmation, season, and customizations.',
    };

    return res.json({
      success: true,
      data: packageData,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/packages/:id/status
packagesRouter.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid publication status' });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let result;
    if (isUuid) {
      result = await query(
        'UPDATE holiday_packages SET publication_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, package_id, publication_status',
        [status, id]
      );
    } else {
      result = await query(
        'UPDATE holiday_packages SET publication_status = $1, updated_at = NOW() WHERE package_id = $2 RETURNING id, package_id, publication_status',
        [status, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    return res.json({
      success: true,
      message: `Package status updated to ${status}`,
      data: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

