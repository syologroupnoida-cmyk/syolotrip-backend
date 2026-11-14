import { Router } from 'express';
import xlsx from 'xlsx';
import { pool, query } from '../db/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { ENTITY_CONFIGS } from './adminServices.js';

export const adminImportExportRouter = Router();

// Enforce admin authentication
adminImportExportRouter.use(
  authenticateToken,
  requireRole('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'INVENTORY_MANAGER')
);

// Sample templates for every entity
const ENTITY_SAMPLE_RECORDS: Record<string, Record<string, any>> = {
  flights: {
    airline: 'Air India',
    airline_code: 'AI',
    flight_number: 'AI-202',
    aircraft: 'Airbus A320neo',
    origin_code: 'DEL',
    origin_name: 'Indira Gandhi International Airport',
    origin_city: 'Delhi',
    origin_country: 'India',
    destination_code: 'BOM',
    destination_name: 'Chhatrapati Shivaji Maharaj International',
    destination_city: 'Mumbai',
    destination_country: 'India',
    departure_time: '10:00',
    arrival_time: '12:15',
    duration_minutes: 135,
    stops: 0,
    cabin_class: 'ECONOMY',
    available_seats: 45,
    base_fare: 4500,
    taxes: 650,
    total_price: 5150,
    currency: 'INR',
    is_active: true,
  },
  hotels: {
    name: 'Grand Hyatt Mumbai',
    property_type: 'HOTEL',
    star_rating: 5,
    guest_rating: 9.2,
    rating_label: 'Exceptional',
    review_count: 850,
    address: 'BKC Vicinity, Santacruz East',
    city: 'Mumbai',
    country: 'India',
    neighborhood: 'Bandra Kurla Complex',
    overview: 'Luxury hotel offering award-winning dining, spa, and elegant rooms.',
    amenities: 'Free WiFi, Swimming Pool, Spa, Airport Transfer, 24/7 Dining',
    starting_price: 12500,
    currency: 'INR',
    check_in_time: '14:00',
    check_out_time: '12:00',
    cancellation_policy: 'Free cancellation up to 48 hours prior to arrival',
    publication_status: 'APPROVED',
    is_active: true,
  },
  villas: {
    name: 'SaffronStays Ocean Breeze Villa',
    property_type: 'VILLA',
    star_rating: 5,
    guest_rating: 9.5,
    address: 'Candolim Beach Road',
    city: 'Goa',
    country: 'India',
    neighborhood: 'North Goa Waterfront',
    overview: 'Private 4BHK sea-facing luxury villa with private infinity pool and private chef.',
    amenities: 'Private Pool, Butler Service, Beach Access, High-Speed WiFi, BBQ',
    starting_price: 24000,
    currency: 'INR',
    publication_status: 'APPROVED',
    is_active: true,
  },
  packages: {
    package_id: 'TZ-NAT-GOA-99',
    title: 'Goa Luxury Beachside Escape',
    destination: 'Goa',
    region: 'National',
    theme: 'Beach',
    package_type: 'Holiday',
    duration: '4 Nights / 5 Days',
    duration_days: 5,
    duration_nights: 4,
    price_per_person: 19500,
    old_price: 23000,
    discount_percent: 15,
    currency: 'INR',
    route: 'Panjim – Calangute – Candolim – Dudhsagar',
    overview: 'Relaxing 5-day holiday in North & South Goa with boutique beach resort stays.',
    highlights: 'Catamaran cruise, Historic forts, Private beach dinner',
    places_covered: 'Panjim, Calangute, Aguada Fort, Palolem',
    activities: 'Water sports, Heritage walk, Sunset cruise',
    hotel_category: '4-Star Beachfront',
    transfers: 'Private AC Sedan',
    meals: 'Daily Buffet Breakfast',
    sightseeing: 'Guided tour of Old Goa & Fort Aguada',
    inclusions: '4 Nights Stay; Daily Breakfast; Airport Transfers; Sightseeing Tours',
    exclusions: 'Flights; Personal expenses; Optional water sports',
    publication_status: 'PUBLISHED',
    is_active: true,
  },
  trains: {
    train_number: '20607',
    train_name: 'Chennai - Mysuru Vande Bharat',
    train_type: 'Vande Bharat',
    from_station_code: 'MAS',
    from_station_name: 'Chennai Central',
    from_city: 'Chennai',
    to_station_code: 'SBC',
    to_station_name: 'KSR Bengaluru',
    to_city: 'Bengaluru',
    departure_time: '05:50',
    arrival_time: '10:20',
    duration_minutes: 270,
    train_class: 'AC Chair Car (CC)',
    available_seats: 80,
    base_fare: 995,
    rating: 4.9,
    currency: 'INR',
    is_active: true,
  },
  buses: {
    operator_name: 'Zingbus Luxury Sleeper',
    bus_type: 'Volvo 9600 Multi-Axle AC Sleeper',
    from_city: 'Delhi',
    to_city: 'Manali',
    boarding_point: 'Kashmere Gate ISBT',
    dropping_point: 'Private Bus Stand Manali',
    departure_time: '20:30',
    arrival_time: '08:00',
    duration_minutes: 690,
    available_seats: 24,
    base_fare: 1350,
    rating: 4.8,
    currency: 'INR',
    is_active: true,
  },
  cabs: {
    cab_type: 'Sedan Prime',
    vehicle_model: 'Maruti Suzuki Dzire / Honda Amaze',
    city: 'Delhi',
    pickup_area: 'IGI Airport T3',
    drop_area: 'Connaught Place',
    driver_name: 'Pardeep Kumar (Verified)',
    driver_rating: 4.94,
    capacity: 4,
    base_fare: 650,
    currency: 'INR',
    eta_minutes: 8,
    features: 'AC, FASTag Included, Sanitized',
    is_active: true,
  },
  tours: {
    id: 'dubai-desert-safari',
    slug: 'dubai-desert-safari-bbq-dinner',
    title: 'Dubai Red Dune Desert Safari with BBQ Dinner',
    city: 'Dubai',
    country: 'UAE',
    duration: '6 Hours',
    category: 'Adventure',
    rating: 4.9,
    review_count: 1250,
    price_per_person: 3200,
    currency: 'INR',
    featured_image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    highlights: 'Dune bashing, Camel ride, Sandboarding, Tanoura dance, BBQ buffet',
    cancellation_policy: 'Free cancellation up to 24 hours in advance',
    is_active: true,
  },
  visa: {
    country_code: 'AE',
    country_name: 'United Arab Emirates',
    visa_slug: 'dubai-uae-30-days-tourist-visa',
    visa_name: 'UAE 30 Days Single Entry Tourist Visa',
    flag_emoji: '🇦🇪',
    validity: '60 Days from issuance',
    stay_period: '30 Days',
    processing_time: '2 - 3 Working Days',
    express_available: true,
    base_fee: 5500,
    embassy_fee: 1500,
    service_fee: 499,
    total_price: 7499,
    currency: 'INR',
    requirements: 'Valid Passport copy (min 6 months), Passport size photo with white background',
    source: 'UAE ICP / GDRFA Official Embassy Portal',
    review_status: 'VERIFIED',
    is_active: true,
  },
  insurance: {
    plan_code: 'SHIELD-ASIA-01',
    plan_name: 'SS Shield Asia & Schengen Explorer',
    provider_name: 'Bajaj Allianz General Insurance',
    coverage_zone: 'Asia / Schengen',
    max_medical_coverage: 5000000,
    baggage_loss_coverage: 50000,
    trip_cancellation_coverage: 100000,
    daily_premium: 89,
    base_premium: 499,
    currency: 'INR',
    validity_days: 30,
    policy_benefits: 'Emergency Medical Hospitalization, Flight Delay Compensation, Lost Baggage, 24x7 Assistance',
    policy_exclusions: 'Pre-existing medical conditions undeclared, Extreme sports',
    is_active: true,
  },
  airports: {
    iata_code: 'HYD',
    icao_code: 'VOHS',
    name: 'Rajiv Gandhi International Airport',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    country_code: 'IN',
    latitude: 17.2403,
    longitude: 78.4294,
    elevation_ft: 2024,
    airport_type: 'large_airport',
    is_commercial: true,
    source: 'OurAirports',
    is_active: true,
  },
  stations: {
    station_code: 'JP',
    name: 'Jaipur Junction Railway Station',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    zone: 'NWR',
    station_category: 'NSG-1',
    source: 'IndianRailways-OpenData',
    is_active: true,
  },
  terminals: {
    terminal_code: 'ISBT-ANAND-VIHAR',
    name: 'Swami Vivekanand ISBT Anand Vihar',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    terminal_type: 'ISBT',
    address: 'Anand Vihar, East Delhi',
    source: 'OpenStreetMap-Transport',
    is_active: true,
  },
  destinations: {
    slug: 'jaipur-rajasthan',
    name: 'Jaipur',
    city: 'Jaipur',
    display_name: 'Jaipur, Rajasthan, India',
    state: 'Rajasthan',
    country: 'India',
    country_code: 'IN',
    destination_type: 'HERITAGE',
    latitude: 26.9124,
    longitude: 75.7873,
    timezone: 'Asia/Kolkata',
    source: 'GEO_MASTER',
    is_active: true,
  },
  countries: {
    code: 'JP',
    iso3: 'JPN',
    name: 'Japan',
    official_name: 'State of Japan',
    continent: 'Asia',
    flag_emoji: '🇯🇵',
    currency_code: 'JPY',
    requires_visa_for_indian_passports: true,
    source: 'ISO-3166',
    is_active: true,
  },
};

// ================= ENDPOINTS =================

// 1. DOWNLOAD TEMPLATE (XLSX / CSV)
adminImportExportRouter.get('/:entity/template', async (req, res) => {
  try {
    const { entity } = req.params;
    const format = (req.query.format as string) === 'csv' ? 'csv' : 'xlsx';
    const config = ENTITY_CONFIGS[entity];

    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown entity: ${entity}` });
    }

    const sampleRow = ENTITY_SAMPLE_RECORDS[entity] || {};
    const columns = config.allowedColumns;

    // Create 2 rows: header row and sample data row
    const rowObj: Record<string, any> = {};
    for (const col of columns) {
      rowObj[col] = sampleRow[col] !== undefined ? sampleRow[col] : '';
    }

    const ws = xlsx.utils.json_to_sheet([rowObj], { header: columns });
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, `${entity}_Template`);

    const filename = `${entity}_template.${format}`;

    if (format === 'csv') {
      const csvData = xlsx.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvData);
    } else {
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. PREVIEW & VALIDATE UPLOAD
adminImportExportRouter.post('/:entity/preview', async (req, res) => {
  try {
    const { entity } = req.params;
    const config = ENTITY_CONFIGS[entity];
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown entity: ${entity}` });
    }

    let rows: any[] = [];

    // Support both direct JSON rows or Base64 file upload
    if (Array.isArray(req.body.rows)) {
      rows = req.body.rows;
    } else if (req.body.file_data) {
      const base64Data = req.body.file_data.includes(',')
        ? req.body.file_data.split(',')[1]
        : req.body.file_data;
      const buffer = Buffer.from(base64Data, 'base64');
      const wb = xlsx.read(buffer, { type: 'buffer' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      rows = xlsx.utils.sheet_to_json(firstSheet);
    } else {
      return res.status(400).json({ success: false, message: 'Provide either `rows` array or `file_data` base64 string' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Uploaded file contains 0 records' });
    }

    // Fetch existing keys for duplicate detection
    const existingKeysRes = await query(
      `SELECT ${config.uniqueKey} FROM ${config.tableName} WHERE ${config.uniqueKey} IS NOT NULL`
    );
    const existingKeySet = new Set(
      existingKeysRes.rows.map((r) => String(r[config.uniqueKey] || '').toLowerCase().trim())
    );

    const previewRows: any[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    const seenInUpload = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];

      const rawKey = String(row[config.uniqueKey] || '').trim();
      const normKey = rawKey.toLowerCase();

      // Check key presence
      if (!rawKey) {
        errors.push(`Missing unique identifier column '${config.uniqueKey}'`);
      } else if (seenInUpload.has(normKey)) {
        errors.push(`Duplicate key in current file: '${rawKey}'`);
      } else {
        seenInUpload.add(normKey);
      }

      // Check numeric fields
      const numericCandidates = [
        'base_fare', 'price_per_person', 'starting_price', 'total_price',
        'available_seats', 'available_capacity', 'duration_days', 'duration_nights',
        'star_rating', 'guest_rating', 'latitude', 'longitude'
      ];
      for (const f of numericCandidates) {
        if (row[f] !== undefined && row[f] !== '' && isNaN(Number(row[f]))) {
          errors.push(`Field '${f}' must be numeric (received '${row[f]}')`);
        }
      }

      const isExistingInDb = normKey ? existingKeySet.has(normKey) : false;
      if (isExistingInDb) {
        duplicateCount++;
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      previewRows.push({
        rowIndex: i + 1,
        key: rawKey,
        data: row,
        isValid,
        isExistingInDb,
        errors,
      });
    }

    return res.json({
      success: true,
      data: {
        entity,
        total_rows: rows.length,
        valid_rows: validCount,
        valid_count: validCount,
        invalid_rows: invalidCount,
        invalid_count: invalidCount,
        duplicates_count: duplicateCount,
        existing_rows: duplicateCount,
        new_rows: validCount - duplicateCount,
        valid_records: previewRows.filter((r) => r.isValid).map((r) => r.data),
        rows_preview: previewRows.slice(0, 100), // Preview first 100 rows
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. EXECUTE IMPORT (BATCH UPSERT WITH TRANSACTION)
adminImportExportRouter.post('/:entity/import', async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { entity } = req.params;
    const { rows, file_name = `${entity}_upload.xlsx` } = req.body;
    const config = ENTITY_CONFIGS[entity];

    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown entity: ${entity}` });
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided for import' });
    }

    await client.query('BEGIN');

    let inserted = 0;
    let updated = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      await client.query('SAVEPOINT row_sp');
      try {
        const keyVal = row[config.uniqueKey];
        if (!keyVal) {
          errors.push({ row: i + 1, error: `Missing ${config.uniqueKey}` });
          await client.query('RELEASE SAVEPOINT row_sp');
          continue;
        }

        // Prepare columns and values
        const cols: string[] = [];
        const vals: any[] = [];
        const placeholders: string[] = [];
        const updateSets: string[] = ['updated_at = NOW()'];
        let idx = 1;

        for (const col of config.allowedColumns) {
          if (row[col] !== undefined) {
            cols.push(col);
            let val = row[col];
            if (typeof val === 'object' && val !== null) {
              vals.push(JSON.stringify(val));
            } else if (typeof val === 'string' && (col === 'inclusions' || col === 'exclusions' || col === 'highlights')) {
              // Auto-split semicolon/comma strings into JSON arrays for array columns
              const delimiter = val.includes(';') ? ';' : ',';
              const arr = val.split(delimiter).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
              vals.push(JSON.stringify(arr));
            } else {
              vals.push(val);
            }
            placeholders.push(`$${idx}`);

            if (col !== config.uniqueKey && col !== config.idColumn) {
              updateSets.push(`${col} = EXCLUDED.${col}`);
            }
            idx++;
          }
        }

        const upsertSql = `
          INSERT INTO ${config.tableName} (${cols.join(', ')})
          VALUES (${placeholders.join(', ')})
          ON CONFLICT (${config.uniqueKey}) DO UPDATE SET
            ${updateSets.join(', ')}
          RETURNING xmax = 0 AS is_inserted
        `;

        const r = await client.query(upsertSql, vals);
        if (r.rows[0].is_inserted) {
          inserted++;
        } else {
          updated++;
        }
        await client.query('RELEASE SAVEPOINT row_sp');
      } catch (rowErr: any) {
        await client.query('ROLLBACK TO SAVEPOINT row_sp');
        errors.push({ row: i + 1, error: rowErr.message });
      }
    }

    // Save import job record
    const jobRes = await client.query(
      `INSERT INTO import_jobs (
        entity_type, file_name, file_format, total_records,
        successful_records, failed_records, status, error_summary,
        imported_by_user_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id`,
      [
        entity,
        file_name,
        file_name.endsWith('.csv') ? 'CSV' : 'XLSX',
        rows.length,
        inserted + updated,
        errors.length,
        errors.length === 0 ? 'COMPLETED' : inserted + updated > 0 ? 'PARTIAL' : 'FAILED',
        JSON.stringify(errors.slice(0, 50)),
        req.user?.id || null,
      ]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details, created_at)
       VALUES ($1, $2, 'IMPORT', $3, $4, $5, NOW())`,
      [
        req.user?.id || null,
        req.user?.email || 'admin@traveler.com',
        entity,
        jobRes.rows[0].id,
        JSON.stringify({ file_name, inserted, updated, failed: errors.length }),
      ]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Import processed: ${inserted} created, ${updated} updated, ${errors.length} failed.`,
      data: {
        job_id: jobRes.rows[0].id,
        entity,
        total: rows.length,
        imported_count: inserted + updated,
        inserted,
        updated,
        failed: errors.length,
        errors: errors.slice(0, 20),
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// 4. EXPORT DATABASE RECORDS (XLSX / CSV)
adminImportExportRouter.get('/:entity/export', async (req, res) => {
  try {
    const { entity } = req.params;
    const format = (req.query.format as string) === 'csv' ? 'csv' : 'xlsx';
    const config = ENTITY_CONFIGS[entity];

    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown entity: ${entity}` });
    }

    let conditions: string[] = ['1=1'];
    let values: any[] = [];
    let idx = 1;

    if (config.filterExtra) {
      const extra = config.filterExtra(req.query);
      if (extra.conditions.length > 0) {
        conditions.push(...extra.conditions);
      }
    }

    if (req.query.is_active !== undefined) {
      conditions.push(`is_active = $${idx}`);
      values.push(req.query.is_active === 'true');
      idx++;
    }

    const sql = `SELECT * FROM ${config.tableName} WHERE ${conditions.join(' AND ')} ORDER BY ${config.defaultSort} LIMIT 5000`;
    const result = await query(sql, values);

    // Flatten any json/object fields into readable text for spreadsheet
    const formattedRows = result.rows.map((row) => {
      const copy: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        if (v !== null && typeof v === 'object') {
          copy[k] = JSON.stringify(v);
        } else {
          copy[k] = v;
        }
      }
      return copy;
    });

    const ws = xlsx.utils.json_to_sheet(formattedRows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, `${entity}_Export`);

    const filename = `${entity}_export_${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      const csvData = xlsx.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvData);
    } else {
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. IMPORT AUDIT HISTORY
adminImportExportRouter.get('/history', async (req, res) => {
  try {
    const limit = Math.min(100, parseInt((req.query.limit as string) || '20', 10));
    const result = await query(
      `SELECT ij.*, u.email as imported_by_email
       FROM import_jobs ij
       LEFT JOIN users u ON ij.imported_by_user_id = u.id
       ORDER BY ij.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
