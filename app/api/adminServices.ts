import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

export const adminServicesRouter = Router();

// Enforce admin authentication
adminServicesRouter.use(authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'INVENTORY_MANAGER'));

// Entity configuration map
export interface EntityConfig {
  tableName: string;
  idColumn: string;
  uniqueKey: string;
  defaultSort: string;
  filterExtra?: (reqQuery: any) => { conditions: string[]; values: any[] };
  searchColumns: string[];
  dependencyCheck?: (id: string) => Promise<{ canDelete: boolean; reason?: string }>;
  allowedColumns: string[];
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  flights: {
    tableName: 'flights',
    idColumn: 'id',
    uniqueKey: 'flight_number',
    defaultSort: 'departure_time ASC',
    searchColumns: ['flight_number', 'airline', 'origin_city', 'destination_city', 'origin_code', 'destination_code'],
    allowedColumns: [
      'airline', 'airline_code', 'flight_number', 'aircraft',
      'origin_code', 'origin_name', 'origin_city', 'origin_country',
      'destination_code', 'destination_name', 'destination_city', 'destination_country',
      'departure_time', 'arrival_time', 'duration_minutes', 'stops',
      'cabin_class', 'available_seats', 'base_fare', 'taxes', 'total_price',
      'currency', 'is_active', 'is_simulated'
    ],
    dependencyCheck: async (id: string) => {
      const res = await query(
        `SELECT COUNT(*) as cnt FROM booking_items WHERE item_type = 'FLIGHT' AND item_reference_id = $1`,
        [id]
      );
      const count = parseInt(res.rows[0].cnt, 10);
      if (count > 0) {
        return {
          canDelete: false,
          reason: `Flight is referenced by ${count} customer booking(s). Archive or deactivate it instead to protect historical records.`,
        };
      }
      return { canDelete: true };
    },
  },

  hotels: {
    tableName: 'hotels',
    idColumn: 'id',
    uniqueKey: 'name',
    defaultSort: 'star_rating DESC, starting_price ASC',
    searchColumns: ['name', 'city', 'country', 'address', 'neighborhood'],
    allowedColumns: [
      'name', 'property_type', 'star_rating', 'guest_rating', 'rating_label',
      'review_count', 'address', 'city', 'country', 'neighborhood',
      'overview', 'description', 'amenities', 'featured_image', 'images',
      'starting_price', 'currency', 'check_in_time', 'check_out_time',
      'cancellation_policy', 'publication_status', 'featured', 'is_active', 'is_simulated'
    ],
    dependencyCheck: async (id: string) => {
      const res = await query(
        `SELECT COUNT(*) as cnt FROM booking_items WHERE (item_type = 'HOTEL' OR hotel_id = $1::uuid) OR item_reference_id = $2`,
        [id, id]
      );
      const count = parseInt(res.rows[0].cnt, 10);
      if (count > 0) {
        return {
          canDelete: false,
          reason: `Property is referenced by ${count} customer booking(s). Deactivate or unpublish it instead.`,
        };
      }
      return { canDelete: true };
    },
  },

  villas: {
    tableName: 'hotels',
    idColumn: 'id',
    uniqueKey: 'name',
    defaultSort: 'star_rating DESC, starting_price ASC',
    searchColumns: ['name', 'city', 'country', 'address', 'neighborhood'],
    filterExtra: () => ({
      conditions: ["(property_type = 'VILLA' OR property_type = 'HOMESTAY' OR property_type = 'RESORT')"],
      values: [],
    }),
    allowedColumns: [
      'name', 'property_type', 'star_rating', 'guest_rating', 'rating_label',
      'review_count', 'address', 'city', 'country', 'neighborhood',
      'overview', 'description', 'amenities', 'featured_image', 'images',
      'starting_price', 'currency', 'check_in_time', 'check_out_time',
      'cancellation_policy', 'publication_status', 'featured', 'is_active', 'is_simulated'
    ],
    dependencyCheck: async (id: string) => {
      const res = await query(
        `SELECT COUNT(*) as cnt FROM booking_items WHERE item_type = 'VILLA' AND (hotel_id = $1::uuid OR item_reference_id = $2)`,
        [id, id]
      );
      const count = parseInt(res.rows[0].cnt, 10);
      if (count > 0) {
        return {
          canDelete: false,
          reason: `Villa is referenced by ${count} customer booking(s). Unpublish it instead.`,
        };
      }
      return { canDelete: true };
    },
  },

  packages: {
    tableName: 'holiday_packages',
    idColumn: 'id',
    uniqueKey: 'package_id',
    defaultSort: 'created_at DESC, price_per_person ASC',
    searchColumns: ['title', 'destination', 'package_id', 'theme', 'route'],
    allowedColumns: [
      'package_id', 'slug', 'title', 'destination', 'region', 'theme', 'package_type',
      'duration', 'duration_days', 'duration_nights', 'overview',
      'inclusions', 'exclusions', 'route', 'highlights', 'places_covered', 'activities',
      'hotel_category', 'transfers', 'meals', 'sightseeing', 'best_time_to_visit',
      'suitable_for', 'offer_title', 'offer_description', 'cancellation_policy',
      'seo_title', 'seo_description', 'seo_keywords', 'day_wise_itinerary_text',
      'price_per_person', 'old_price', 'discount_percent', 'currency',
      'featured_image', 'rating', 'available_capacity', 'publication_status',
      'is_simulated', 'is_active'
    ],
    dependencyCheck: async (id: string) => {
      const res = await query(
        `SELECT COUNT(*) as cnt FROM booking_items WHERE item_type = 'PACKAGE' AND item_reference_id = $1`,
        [id]
      );
      const count = parseInt(res.rows[0].cnt, 10);
      if (count > 0) {
        return {
          canDelete: false,
          reason: `Package is referenced by ${count} booking(s). Revert to Draft or Archive instead.`,
        };
      }
      return { canDelete: true };
    },
  },

  trains: {
    tableName: 'trains',
    idColumn: 'id',
    uniqueKey: 'train_number',
    defaultSort: 'departure_time ASC',
    searchColumns: ['train_number', 'train_name', 'from_city', 'to_city', 'from_station_code', 'to_station_code'],
    allowedColumns: [
      'train_number', 'train_name', 'train_type',
      'from_station_code', 'from_station_name', 'from_city',
      'to_station_code', 'to_station_name', 'to_city',
      'departure_time', 'arrival_time', 'duration_minutes', 'train_class',
      'available_seats', 'base_fare', 'rating', 'currency', 'is_simulated', 'is_active'
    ],
    dependencyCheck: async (id: string) => {
      const res = await query(
        `SELECT COUNT(*) as cnt FROM booking_items WHERE item_type = 'TRAIN' AND item_reference_id = $1`,
        [id]
      );
      const count = parseInt(res.rows[0].cnt, 10);
      if (count > 0) {
        return { canDelete: false, reason: `Train is referenced by ${count} customer booking(s). Deactivate instead.` };
      }
      return { canDelete: true };
    },
  },

  buses: {
    tableName: 'buses',
    idColumn: 'id',
    uniqueKey: 'operator_name',
    defaultSort: 'departure_time ASC',
    searchColumns: ['operator_name', 'bus_type', 'from_city', 'to_city', 'boarding_point', 'dropping_point'],
    allowedColumns: [
      'operator_name', 'bus_type', 'from_city', 'to_city',
      'boarding_point', 'dropping_point', 'departure_time', 'arrival_time',
      'duration_minutes', 'available_seats', 'base_fare', 'rating', 'currency',
      'is_simulated', 'is_active'
    ],
    dependencyCheck: async (id: string) => {
      const res = await query(
        `SELECT COUNT(*) as cnt FROM booking_items WHERE item_type = 'BUS' AND item_reference_id = $1`,
        [id]
      );
      const count = parseInt(res.rows[0].cnt, 10);
      if (count > 0) {
        return { canDelete: false, reason: `Bus service is referenced by ${count} booking(s). Deactivate instead.` };
      }
      return { canDelete: true };
    },
  },

  cabs: {
    tableName: 'cabs',
    idColumn: 'id',
    uniqueKey: 'vehicle_model',
    defaultSort: 'base_fare ASC',
    searchColumns: ['cab_type', 'vehicle_model', 'city', 'pickup_area', 'drop_area', 'driver_name'],
    allowedColumns: [
      'cab_type', 'vehicle_model', 'city', 'pickup_area', 'drop_area',
      'driver_name', 'driver_rating', 'capacity', 'base_fare', 'currency',
      'eta_minutes', 'features', 'is_simulated', 'is_active'
    ],
    dependencyCheck: async (id: string) => {
      const res = await query(
        `SELECT COUNT(*) as cnt FROM booking_items WHERE item_type = 'CAB' AND item_reference_id = $1`,
        [id]
      );
      const count = parseInt(res.rows[0].cnt, 10);
      if (count > 0) {
        return { canDelete: false, reason: `Cab listing is referenced by ${count} booking(s). Deactivate instead.` };
      }
      return { canDelete: true };
    },
  },

  tours: {
    tableName: 'tours',
    idColumn: 'id',
    uniqueKey: 'slug',
    defaultSort: 'rating DESC, price_per_person ASC',
    searchColumns: ['title', 'city', 'country', 'category'],
    allowedColumns: [
      'id', 'slug', 'title', 'city', 'country', 'duration', 'category',
      'rating', 'review_count', 'price_per_person', 'currency',
      'featured_image', 'highlights', 'cancellation_policy',
      'instant_confirmation', 'overview', 'itinerary', 'source', 'is_active'
    ],
    dependencyCheck: async (id: string) => {
      const res = await query(
        `SELECT COUNT(*) as cnt FROM booking_items WHERE item_type = 'TOUR' AND item_reference_id = $1`,
        [id]
      );
      const count = parseInt(res.rows[0].cnt, 10);
      if (count > 0) {
        return { canDelete: false, reason: `Tour is referenced by ${count} booking(s). Deactivate instead.` };
      }
      return { canDelete: true };
    },
  },

  visa: {
    tableName: 'visa_requirements',
    idColumn: 'id',
    uniqueKey: 'visa_slug',
    defaultSort: 'country_name ASC',
    searchColumns: ['country_name', 'country_code', 'visa_name', 'visa_slug'],
    allowedColumns: [
      'country_code', 'country_name', 'visa_slug', 'visa_name', 'flag_emoji',
      'validity', 'stay_period', 'processing_time', 'express_available',
      'base_fee', 'embassy_fee', 'service_fee', 'total_price', 'currency',
      'requirements', 'approval_rate', 'aliases', 'last_verified_at',
      'review_status', 'description', 'source', 'is_active'
    ],
    dependencyCheck: async () => ({ canDelete: true }),
  },

  insurance: {
    tableName: 'travel_insurance_plans',
    idColumn: 'id',
    uniqueKey: 'plan_code',
    defaultSort: 'base_premium ASC',
    searchColumns: ['plan_code', 'plan_name', 'provider_name', 'coverage_zone'],
    allowedColumns: [
      'plan_code', 'plan_name', 'provider_name', 'coverage_zone',
      'max_medical_coverage', 'baggage_loss_coverage', 'trip_cancellation_coverage',
      'daily_premium', 'base_premium', 'currency', 'validity_days',
      'policy_benefits', 'policy_exclusions', 'eligibility_min_age',
      'eligibility_max_age', 'has_covid_coverage', 'has_adventure_sports',
      'source', 'is_active'
    ],
    dependencyCheck: async (id: string) => {
      const res = await query(
        `SELECT COUNT(*) as cnt FROM booking_items WHERE item_type = 'INSURANCE' AND item_reference_id = $1`,
        [id]
      );
      const count = parseInt(res.rows[0].cnt, 10);
      if (count > 0) {
        return { canDelete: false, reason: `Plan is referenced by ${count} policy booking(s). Deactivate instead.` };
      }
      return { canDelete: true };
    },
  },

  airports: {
    tableName: 'airports',
    idColumn: 'id',
    uniqueKey: 'iata_code',
    defaultSort: 'city ASC, name ASC',
    searchColumns: ['iata_code', 'icao_code', 'name', 'city', 'country'],
    allowedColumns: [
      'iata_code', 'icao_code', 'name', 'city', 'state', 'country', 'country_code',
      'latitude', 'longitude', 'elevation_ft', 'airport_type', 'is_commercial',
      'aliases', 'source', 'is_active'
    ],
    dependencyCheck: async (id: string) => {
      const aRes = await query('SELECT iata_code FROM airports WHERE id = $1', [id]);
      if (aRes.rows.length > 0 && aRes.rows[0].iata_code) {
        const code = aRes.rows[0].iata_code;
        const flRes = await query(
          'SELECT COUNT(*) as cnt FROM flights WHERE origin_code = $1 OR destination_code = $1',
          [code]
        );
        const count = parseInt(flRes.rows[0].cnt, 10);
        if (count > 0) {
          return { canDelete: false, reason: `Airport ${code} is referenced by ${count} active flight route(s).` };
        }
      }
      return { canDelete: true };
    },
  },

  stations: {
    tableName: 'railway_stations',
    idColumn: 'id',
    uniqueKey: 'station_code',
    defaultSort: 'city ASC, name ASC',
    searchColumns: ['station_code', 'name', 'city', 'state'],
    allowedColumns: [
      'station_code', 'name', 'city', 'state', 'country', 'zone',
      'division', 'latitude', 'longitude', 'station_category',
      'aliases', 'source', 'is_active'
    ],
    dependencyCheck: async () => ({ canDelete: true }),
  },

  terminals: {
    tableName: 'bus_terminals',
    idColumn: 'id',
    uniqueKey: 'terminal_code',
    defaultSort: 'city ASC, name ASC',
    searchColumns: ['terminal_code', 'name', 'city', 'state'],
    allowedColumns: [
      'terminal_code', 'name', 'city', 'state', 'country', 'terminal_type',
      'address', 'latitude', 'longitude', 'aliases', 'source', 'is_active'
    ],
    dependencyCheck: async () => ({ canDelete: true }),
  },

  destinations: {
    tableName: 'destinations',
    idColumn: 'id',
    uniqueKey: 'slug',
    defaultSort: 'name ASC',
    searchColumns: ['name', 'city', 'country', 'state', 'slug'],
    allowedColumns: [
      'slug', 'name', 'city', 'display_name', 'state', 'country',
      'country_code', 'destination_type', 'latitude', 'longitude',
      'timezone', 'popular_services', 'aliases', 'source', 'is_active'
    ],
    dependencyCheck: async () => ({ canDelete: true }),
  },

  countries: {
    tableName: 'countries',
    idColumn: 'id',
    uniqueKey: 'code',
    defaultSort: 'name ASC',
    searchColumns: ['code', 'iso3', 'name', 'official_name', 'continent'],
    allowedColumns: [
      'code', 'iso3', 'name', 'official_name', 'continent', 'flag_emoji',
      'currency_code', 'requires_visa_for_indian_passports',
      'visa_types_available', 'aliases', 'source', 'is_active'
    ],
    dependencyCheck: async () => ({ canDelete: true }),
  },
};

// ================= UNIVERSAL CRUD ROUTES =================

// 1. LIST RECORDS
adminServicesRouter.get('/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const config = ENTITY_CONFIGS[entity];
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown service entity: ${entity}` });
    }

    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
    const offset = (page - 1) * limit;

    let conditions: string[] = ['1=1'];
    let values: any[] = [];
    let idx = 1;

    // Entity-specific extra filters (e.g. villas filter property_type)
    if (config.filterExtra) {
      const extra = config.filterExtra(req.query);
      if (extra.conditions.length > 0) {
        conditions.push(...extra.conditions);
      }
    }

    // Active status filter
    if (req.query.is_active !== undefined && req.query.is_active !== 'ALL') {
      conditions.push(`is_active = $${idx}`);
      values.push(req.query.is_active === 'true');
      idx++;
    }

    // Publication status filter (if column exists)
    if (req.query.publication_status && req.query.publication_status !== 'ALL') {
      conditions.push(`publication_status = $${idx}`);
      values.push(req.query.publication_status);
      idx++;
    }

    // Region filter
    if (req.query.region && req.query.region !== 'ALL') {
      conditions.push(`LOWER(region) = LOWER($${idx})`);
      values.push(req.query.region);
      idx++;
    }

    // General search filter
    if (req.query.search) {
      const searchStr = (req.query.search as string).trim();
      const searchClauses = config.searchColumns.map(
        (col) => `LOWER(COALESCE(${col}::text, '')) LIKE LOWER($${idx})`
      );
      conditions.push(`(${searchClauses.join(' OR ')})`);
      values.push(`%${searchStr}%`);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) as total FROM ${config.tableName} ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const sortOrder = (req.query.sort as string) || config.defaultSort;
    const itemsRes = await query(
      `SELECT * FROM ${config.tableName} ${whereClause} ORDER BY ${sortOrder} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    return res.json({
      success: true,
      data: {
        entity,
        items: itemsRes.rows,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. GET SINGLE RECORD
adminServicesRouter.get('/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const config = ENTITY_CONFIGS[entity];
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown service entity: ${entity}` });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let recordRes;
    if (isUuid) {
      recordRes = await query(`SELECT * FROM ${config.tableName} WHERE ${config.idColumn} = $1`, [id]);
    } else {
      recordRes = await query(
        `SELECT * FROM ${config.tableName} WHERE ${config.uniqueKey} = $1 OR ${config.idColumn}::text = $1`,
        [id]
      );
    }

    if (recordRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: `${entity} record not found` });
    }

    const record = recordRes.rows[0];

    // Child relations
    if (entity === 'packages' && record.package_id) {
      const itinRes = await query(
        'SELECT * FROM package_itineraries WHERE package_id = $1 ORDER BY day_number ASC',
        [record.package_id]
      );
      record.itineraries = itinRes.rows;
    } else if (entity === 'hotels' && record.id) {
      const roomRes = await query('SELECT * FROM hotel_rooms WHERE hotel_id = $1 ORDER BY price_per_night ASC', [
        record.id,
      ]);
      record.rooms = roomRes.rows;
    }

    return res.json({ success: true, data: record });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. CREATE RECORD
adminServicesRouter.post('/:entity', async (req: AuthenticatedRequest, res) => {
  try {
    const { entity } = req.params;
    const config = ENTITY_CONFIGS[entity];
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown service entity: ${entity}` });
    }

    const payload = { ...req.body };

    // Apply entity specific intelligent defaults
    if (entity === 'villas') {
      if (!payload.property_type) payload.property_type = 'VILLA';
      if (payload.star_rating === undefined) payload.star_rating = 4;
      if (payload.starting_price === undefined && payload.price_per_night !== undefined) {
        payload.starting_price = payload.price_per_night;
      }
    } else if (entity === 'hotels') {
      if (!payload.property_type) payload.property_type = 'HOTEL';
      if (payload.star_rating === undefined) payload.star_rating = 3;
    } else if (entity === 'insurance') {
      if (!payload.coverage_type) payload.coverage_type = 'DOMESTIC';
    }

    const cols: string[] = [];
    const vals: any[] = [];
    const placeholders: string[] = [];
    let idx = 1;

    for (const key of config.allowedColumns) {
      if (payload[key] !== undefined) {
        cols.push(key);
        // Format object/array fields into JSON string
        if (typeof payload[key] === 'object' && payload[key] !== null) {
          vals.push(JSON.stringify(payload[key]));
        } else {
          vals.push(payload[key]);
        }
        placeholders.push(`$${idx}`);
        idx++;
      }
    }

    if (cols.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for insertion' });
    }

    const insertSql = `INSERT INTO ${config.tableName} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const insertRes = await query(insertSql, vals);
    const createdItem = insertRes.rows[0];

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, new_state, created_at)
       VALUES ($1, $2, 'CREATE', $3, $4, $5, NOW())`,
      [req.user?.id || null, req.user?.email || 'admin@traveler.com', entity, createdItem.id || createdItem[config.idColumn], JSON.stringify(createdItem)]
    );

    return res.status(201).json({
      success: true,
      message: `${entity} created successfully`,
      data: createdItem,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. UPDATE RECORD
adminServicesRouter.put('/:entity/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { entity, id } = req.params;
    const config = ENTITY_CONFIGS[entity];
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown service entity: ${entity}` });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const prevRes = await query(
      `SELECT * FROM ${config.tableName} WHERE ${isUuid ? config.idColumn : config.uniqueKey} = $1`,
      [id]
    );
    if (prevRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: `${entity} record not found` });
    }
    const previousState = prevRes.rows[0];

    const payload = { ...req.body };
    if (entity === 'villas' && payload.starting_price === undefined && payload.price_per_night !== undefined) {
      payload.starting_price = payload.price_per_night;
    }
    const updates: string[] = ['updated_at = NOW()'];
    const vals: any[] = [];
    let idx = 1;

    for (const key of config.allowedColumns) {
      if (payload[key] !== undefined && key !== config.idColumn) {
        updates.push(`${key} = $${idx}`);
        if (typeof payload[key] === 'object' && payload[key] !== null) {
          vals.push(JSON.stringify(payload[key]));
        } else {
          vals.push(payload[key]);
        }
        idx++;
      }
    }

    vals.push(previousState[config.idColumn]);
    const updateSql = `UPDATE ${config.tableName} SET ${updates.join(', ')} WHERE ${config.idColumn} = $${idx} RETURNING *`;
    const updateRes = await query(updateSql, vals);
    const updatedItem = updateRes.rows[0];

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, previous_state, new_state, created_at)
       VALUES ($1, $2, 'UPDATE', $3, $4, $5, $6, NOW())`,
      [
        req.user?.id || null,
        req.user?.email || 'admin@traveler.com',
        entity,
        updatedItem[config.idColumn],
        JSON.stringify(previousState),
        JSON.stringify(updatedItem),
      ]
    );

    return res.json({
      success: true,
      message: `${entity} record updated successfully`,
      data: updatedItem,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. TOGGLE STATUS / ARCHIVE
adminServicesRouter.patch('/:entity/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { entity, id } = req.params;
    const { status, is_active } = req.body;
    const config = ENTITY_CONFIGS[entity];
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown service entity: ${entity}` });
    }

    const updates: string[] = ['updated_at = NOW()'];
    const vals: any[] = [];
    let idx = 1;

    if (is_active !== undefined) {
      updates.push(`is_active = $${idx}`);
      vals.push(Boolean(is_active));
      idx++;
    }
    if (status !== undefined) {
      updates.push(`publication_status = $${idx}`);
      vals.push(status);
      idx++;
    }

    vals.push(id);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const whereClause = isUuid ? `${config.idColumn} = $${idx}` : `${config.uniqueKey} = $${idx}`;
    const sql = `UPDATE ${config.tableName} SET ${updates.join(', ')} WHERE ${whereClause} RETURNING *`;
    const updateRes = await query(sql, vals);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    return res.json({
      success: true,
      message: `Status updated successfully`,
      data: updateRes.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. DELETE WITH DEPENDENCY CHECK
adminServicesRouter.delete('/:entity/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { entity, id } = req.params;
    const config = ENTITY_CONFIGS[entity];
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown service entity: ${entity}` });
    }

    // Check historical dependencies
    if (config.dependencyCheck) {
      const dep = await config.dependencyCheck(id);
      if (!dep.canDelete) {
        return res.status(409).json({
          success: false,
          conflict: true,
          message: dep.reason,
        });
      }
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const whereClause = isUuid ? `${config.idColumn} = $1` : `${config.uniqueKey} = $1`;
    const deleteRes = await query(
      `DELETE FROM ${config.tableName} WHERE ${whereClause} RETURNING *`,
      [id]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, previous_state, created_at)
       VALUES ($1, $2, 'DELETE', $3, $4, $5, NOW())`,
      [
        req.user?.id || null,
        req.user?.email || 'admin@traveler.com',
        entity,
        id,
        JSON.stringify(deleteRes.rows[0]),
      ]
    );

    return res.json({
      success: true,
      message: `${entity} record permanently deleted`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 7. BULK STATUS UPDATE
adminServicesRouter.post('/:entity/bulk-status', async (req: AuthenticatedRequest, res) => {
  try {
    const { entity } = req.params;
    const { status, is_active, ids } = req.body;
    const config = ENTITY_CONFIGS[entity];
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown service entity: ${entity}` });
    }

    const updates: string[] = ['updated_at = NOW()'];
    const vals: any[] = [];
    let idx = 1;

    if (is_active !== undefined) {
      updates.push(`is_active = $${idx}`);
      vals.push(Boolean(is_active));
      idx++;
    }
    if (status !== undefined) {
      updates.push(`publication_status = $${idx}`);
      vals.push(status);
      idx++;
    }

    let whereClause = '';
    if (Array.isArray(ids) && ids.length > 0) {
      whereClause = `WHERE ${config.idColumn} = ANY($${idx}::uuid[]) OR ${config.uniqueKey} = ANY($${idx}::varchar[])`;
      vals.push(ids);
    }

    const sql = `UPDATE ${config.tableName} SET ${updates.join(', ')} ${whereClause} RETURNING ${config.idColumn}`;
    const updateRes = await query(sql, vals);

    return res.json({
      success: true,
      message: `Bulk updated ${updateRes.rows.length} ${entity} records`,
      count: updateRes.rows.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
