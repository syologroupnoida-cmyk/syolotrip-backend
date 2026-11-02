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
      conditions.push(`(LOWER(from_city) LIKE LOWER($${idx}) OR LOWER(from_station_name) LIKE LOWER($${idx}))`);
      values.push(`%${from_city}%`);
      idx++;
    }
    if (to_city) {
      conditions.push(`(LOWER(to_city) LIKE LOWER($${idx}) OR LOWER(to_station_name) LIKE LOWER($${idx}))`);
      values.push(`%${to_city}%`);
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

    const items = result.rows.map((r) => ({
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
      data: {
        items,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
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
      conditions.push(`LOWER(from_city) LIKE LOWER($${idx})`);
      values.push(`%${from_city}%`);
      idx++;
    }
    if (to_city) {
      conditions.push(`LOWER(to_city) LIKE LOWER($${idx})`);
      values.push(`%${to_city}%`);
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

    const items = result.rows.map((r) => ({
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
      data: {
        items,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
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

    if (city) {
      conditions.push(`LOWER(city) LIKE LOWER($${idx})`);
      values.push(`%${city}%`);
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

    const items = result.rows.map((r) => ({
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
      data: {
        items,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
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
    const { destination, max_price } = req.query;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const offset = (page - 1) * limit;

    let conditions: string[] = ['is_active = true'];
    let values: any[] = [];
    let idx = 1;

    if (destination) {
      conditions.push(`(LOWER(destination) LIKE LOWER($${idx}) OR LOWER(title) LIKE LOWER($${idx}))`);
      values.push(`%${destination}%`);
      idx++;
    }
    if (max_price) {
      conditions.push(`price_per_person <= $${idx}`);
      values.push(parseFloat(max_price as string));
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) as total FROM holiday_packages ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const result = await query(
      `SELECT * FROM holiday_packages ${whereClause} ORDER BY price_per_person ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    const items = result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      destination: r.destination,
      duration_days: r.duration_days,
      duration_nights: r.duration_nights,
      overview: r.overview,
      inclusions: r.inclusions,
      exclusions: r.exclusions,
      itinerary: r.itinerary,
      price_per_person: parseFloat(r.price_per_person),
      currency: r.currency,
      featured_image: r.featured_image,
      rating: r.rating,
      available_capacity: r.available_capacity,
      is_simulated: r.is_simulated,
    }));

    return res.json({
      success: true,
      data: {
        items,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

