import { query } from './index.js';
import { initDbSchema } from './schema.js';
import {
  COUNTRIES_REFERENCE,
  DESTINATIONS_REFERENCE,
  AIRPORTS_REFERENCE,
  RAILWAY_STATIONS_REFERENCE,
  BUS_TERMINALS_REFERENCE,
  TOURS_REFERENCE,
  VISA_REFERENCE,
} from './referenceData.js';

export interface IngestionStats {
  category: string;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  rejected: number;
}

export async function ingestAllReferenceData(): Promise<Record<string, IngestionStats>> {
  console.log('===============================================================');
  console.log('[REFERENCE-DATA-INGEST] Starting idempotent dataset ingestion...');
  console.log('===============================================================');

  // Ensure tables and indexes exist
  await initDbSchema();

  const results: Record<string, IngestionStats> = {};

  // 1. INGEST COUNTRIES
  results.countries = await ingestCountries();

  // 2. INGEST DESTINATIONS
  results.destinations = await ingestDestinations();

  // 3. INGEST AIRPORTS
  results.airports = await ingestAirports();

  // 4. INGEST RAILWAY STATIONS
  results.railway_stations = await ingestRailwayStations();

  // 5. INGEST BUS TERMINALS
  results.bus_terminals = await ingestBusTerminals();

  // 6. INGEST TOURS
  results.tours = await ingestTours();

  // 7. INGEST VISA REQUIREMENTS
  results.visa_requirements = await ingestVisaRequirements();

  console.log('\n===============================================================');
  console.log('[REFERENCE-DATA-INGEST] Ingestion Summary:');
  console.table(results);
  console.log('===============================================================\n');

  return results;
}

// ----------------------------------------------------------------------------
// 1. COUNTRIES INGESTOR
// ----------------------------------------------------------------------------
async function ingestCountries(): Promise<IngestionStats> {
  const stats: IngestionStats = { category: 'Countries', total: COUNTRIES_REFERENCE.length, inserted: 0, updated: 0, skipped: 0, rejected: 0 };

  for (const c of COUNTRIES_REFERENCE) {
    if (!c.code || c.code.length !== 2 || !c.iso3 || c.iso3.length !== 3 || !c.name) {
      console.warn(`[INGEST-REJECT] Invalid country record: ${JSON.stringify(c)}`);
      stats.rejected++;
      continue;
    }

    try {
      const res = await query(
        `INSERT INTO countries (
          code, iso3, name, official_name, continent, flag_emoji, currency_code,
          requires_visa_for_indian_passports, visa_types_available, aliases, is_active, source, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, NOW())
        ON CONFLICT (code) DO UPDATE SET
          iso3 = EXCLUDED.iso3,
          name = EXCLUDED.name,
          official_name = EXCLUDED.official_name,
          continent = EXCLUDED.continent,
          flag_emoji = EXCLUDED.flag_emoji,
          currency_code = EXCLUDED.currency_code,
          requires_visa_for_indian_passports = EXCLUDED.requires_visa_for_indian_passports,
          visa_types_available = EXCLUDED.visa_types_available,
          aliases = EXCLUDED.aliases,
          updated_at = NOW()
        RETURNING (xmax = 0) AS is_insert`,
        [
          c.code.toUpperCase(),
          c.iso3.toUpperCase(),
          c.name,
          c.official_name || c.name,
          c.continent,
          c.flag_emoji || '🌐',
          c.currency_code || 'USD',
          c.requires_visa_for_indian_passports,
          JSON.stringify(c.visa_types_available || []),
          JSON.stringify(c.aliases || []),
          c.source || 'ISO-3166',
        ]
      );

      if (res.rows[0]?.is_insert) {
        stats.inserted++;
      } else {
        stats.updated++;
      }
    } catch (err: any) {
      console.error(`[INGEST-ERROR] Country ${c.code}:`, err.message);
      stats.rejected++;
    }
  }

  return stats;
}

// ----------------------------------------------------------------------------
// 2. DESTINATIONS INGESTOR
// ----------------------------------------------------------------------------
async function ingestDestinations(): Promise<IngestionStats> {
  const stats: IngestionStats = { category: 'Destinations', total: DESTINATIONS_REFERENCE.length, inserted: 0, updated: 0, skipped: 0, rejected: 0 };

  for (const d of DESTINATIONS_REFERENCE) {
    if (!d.slug || !d.name || !d.country || isNaN(d.latitude) || isNaN(d.longitude)) {
      console.warn(`[INGEST-REJECT] Invalid destination record: ${JSON.stringify(d)}`);
      stats.rejected++;
      continue;
    }

    try {
      const res = await query(
        `INSERT INTO destinations (
          slug, name, city, display_name, state, country, country_code, destination_type,
          latitude, longitude, timezone, popular_services, aliases, is_active, source, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14, NOW())
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          city = EXCLUDED.city,
          display_name = EXCLUDED.display_name,
          state = EXCLUDED.state,
          country = EXCLUDED.country,
          country_code = EXCLUDED.country_code,
          destination_type = EXCLUDED.destination_type,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          timezone = EXCLUDED.timezone,
          popular_services = EXCLUDED.popular_services,
          aliases = EXCLUDED.aliases,
          updated_at = NOW()
        RETURNING (xmax = 0) AS is_insert`,
        [
          d.slug.toLowerCase().trim(),
          d.name,
          d.name,
          d.display_name,
          d.state || null,
          d.country,
          d.country_code || null,
          d.destination_type || 'CITY',
          d.latitude,
          d.longitude,
          d.timezone || 'Asia/Kolkata',
          JSON.stringify(d.popular_services || ['hotels', 'cabs']),
          JSON.stringify(d.aliases || []),
          d.source || 'GEO_MASTER',
        ]
      );

      if (res.rows[0]?.is_insert) {
        stats.inserted++;
      } else {
        stats.updated++;
      }
    } catch (err: any) {
      console.error(`[INGEST-ERROR] Destination ${d.slug}:`, err.message);
      stats.rejected++;
    }
  }

  return stats;
}

// ----------------------------------------------------------------------------
// 3. AIRPORTS INGESTOR
// ----------------------------------------------------------------------------
async function ingestAirports(): Promise<IngestionStats> {
  const stats: IngestionStats = { category: 'Airports', total: AIRPORTS_REFERENCE.length, inserted: 0, updated: 0, skipped: 0, rejected: 0 };

  for (const a of AIRPORTS_REFERENCE) {
    if (!a.name || !a.city || !a.country || isNaN(a.latitude) || isNaN(a.longitude)) {
      console.warn(`[INGEST-REJECT] Invalid airport record: ${JSON.stringify(a)}`);
      stats.rejected++;
      continue;
    }

    try {
      // Upsert by IATA code if present, otherwise upsert by ICAO code
      let res;
      if (a.iata_code) {
        res = await query(
          `INSERT INTO airports (
            iata_code, icao_code, name, city, state, country, country_code,
            latitude, longitude, elevation_ft, airport_type, is_commercial, aliases, is_active, source, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14, NOW())
          ON CONFLICT (iata_code) WHERE iata_code IS NOT NULL DO UPDATE SET
            icao_code = EXCLUDED.icao_code,
            name = EXCLUDED.name,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            country = EXCLUDED.country,
            country_code = EXCLUDED.country_code,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            elevation_ft = EXCLUDED.elevation_ft,
            airport_type = EXCLUDED.airport_type,
            is_commercial = EXCLUDED.is_commercial,
            aliases = EXCLUDED.aliases,
            updated_at = NOW()
          RETURNING (xmax = 0) AS is_insert`,
          [
            a.iata_code.toUpperCase().trim(),
            a.icao_code ? a.icao_code.toUpperCase().trim() : null,
            a.name,
            a.city,
            a.state || null,
            a.country,
            a.country_code || null,
            a.latitude,
            a.longitude,
            a.elevation_ft || null,
            a.airport_type || 'large_airport',
            a.is_commercial !== false,
            JSON.stringify(a.aliases || []),
            a.source || 'OurAirports',
          ]
        );
      } else {
        // Non-commercial airport without IATA code
        const existing = await query('SELECT id FROM airports WHERE icao_code = $1 AND name = $2', [a.icao_code, a.name]);
        if (existing.rows.length > 0) {
          await query(
            `UPDATE airports SET
              city = $1, state = $2, country = $3, latitude = $4, longitude = $5,
              airport_type = $6, is_commercial = false, aliases = $7, updated_at = NOW()
             WHERE id = $8`,
            [a.city, a.state || null, a.country, a.latitude, a.longitude, a.airport_type, JSON.stringify(a.aliases || []), existing.rows[0].id]
          );
          stats.updated++;
          continue;
        } else {
          await query(
            `INSERT INTO airports (
              iata_code, icao_code, name, city, state, country, country_code,
              latitude, longitude, elevation_ft, airport_type, is_commercial, aliases, is_active, source, updated_at
            ) VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, true, $12, NOW())`,
            [
              a.icao_code ? a.icao_code.toUpperCase().trim() : null,
              a.name,
              a.city,
              a.state || null,
              a.country,
              a.country_code || null,
              a.latitude,
              a.longitude,
              a.elevation_ft || null,
              a.airport_type || 'small_airport',
              JSON.stringify(a.aliases || []),
              a.source || 'OurAirports',
            ]
          );
          stats.inserted++;
          continue;
        }
      }

      if (res.rows[0]?.is_insert) {
        stats.inserted++;
      } else {
        stats.updated++;
      }
    } catch (err: any) {
      console.error(`[INGEST-ERROR] Airport ${a.iata_code || a.name}:`, err.message);
      stats.rejected++;
    }
  }

  return stats;
}

// ----------------------------------------------------------------------------
// 4. RAILWAY STATIONS INGESTOR
// ----------------------------------------------------------------------------
async function ingestRailwayStations(): Promise<IngestionStats> {
  const stats: IngestionStats = { category: 'Railway Stations', total: RAILWAY_STATIONS_REFERENCE.length, inserted: 0, updated: 0, skipped: 0, rejected: 0 };

  for (const s of RAILWAY_STATIONS_REFERENCE) {
    if (!s.station_code || !s.name || !s.city || !s.state) {
      console.warn(`[INGEST-REJECT] Invalid station record: ${JSON.stringify(s)}`);
      stats.rejected++;
      continue;
    }

    try {
      const res = await query(
        `INSERT INTO railway_stations (
          station_code, name, city, state, country, zone, division,
          latitude, longitude, station_category, aliases, is_active, source, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, NOW())
        ON CONFLICT (station_code) DO UPDATE SET
          name = EXCLUDED.name,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          country = EXCLUDED.country,
          zone = EXCLUDED.zone,
          division = EXCLUDED.division,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          station_category = EXCLUDED.station_category,
          aliases = EXCLUDED.aliases,
          updated_at = NOW()
        RETURNING (xmax = 0) AS is_insert`,
        [
          s.station_code.toUpperCase().trim(),
          s.name,
          s.city,
          s.state,
          s.country || 'India',
          s.zone || null,
          s.division || null,
          s.latitude || null,
          s.longitude || null,
          s.station_category || 'NSG-1',
          JSON.stringify(s.aliases || []),
          s.source || 'IndianRailways-OpenData',
        ]
      );

      if (res.rows[0]?.is_insert) {
        stats.inserted++;
      } else {
        stats.updated++;
      }
    } catch (err: any) {
      console.error(`[INGEST-ERROR] Railway station ${s.station_code}:`, err.message);
      stats.rejected++;
    }
  }

  return stats;
}

// ----------------------------------------------------------------------------
// 5. BUS TERMINALS INGESTOR
// ----------------------------------------------------------------------------
async function ingestBusTerminals(): Promise<IngestionStats> {
  const stats: IngestionStats = { category: 'Bus Terminals', total: BUS_TERMINALS_REFERENCE.length, inserted: 0, updated: 0, skipped: 0, rejected: 0 };

  for (const b of BUS_TERMINALS_REFERENCE) {
    if (!b.terminal_code || !b.name || !b.city || !b.state) {
      console.warn(`[INGEST-REJECT] Invalid bus terminal record: ${JSON.stringify(b)}`);
      stats.rejected++;
      continue;
    }

    try {
      const res = await query(
        `INSERT INTO bus_terminals (
          terminal_code, name, city, state, country, terminal_type,
          address, latitude, longitude, aliases, is_active, source, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, NOW())
        ON CONFLICT (terminal_code) DO UPDATE SET
          name = EXCLUDED.name,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          country = EXCLUDED.country,
          terminal_type = EXCLUDED.terminal_type,
          address = EXCLUDED.address,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          aliases = EXCLUDED.aliases,
          updated_at = NOW()
        RETURNING (xmax = 0) AS is_insert`,
        [
          b.terminal_code.toUpperCase().trim(),
          b.name,
          b.city,
          b.state,
          b.country || 'India',
          b.terminal_type || 'ISBT',
          b.address || b.name,
          b.latitude,
          b.longitude,
          JSON.stringify(b.aliases || []),
          b.source || 'OpenStreetMap-Transport',
        ]
      );

      if (res.rows[0]?.is_insert) {
        stats.inserted++;
      } else {
        stats.updated++;
      }
    } catch (err: any) {
      console.error(`[INGEST-ERROR] Bus terminal ${b.terminal_code}:`, err.message);
      stats.rejected++;
    }
  }

  return stats;
}

// ----------------------------------------------------------------------------
// 6. TOURS INGESTOR
// ----------------------------------------------------------------------------
async function ingestTours(): Promise<IngestionStats> {
  const stats: IngestionStats = { category: 'Tours', total: TOURS_REFERENCE.length, inserted: 0, updated: 0, skipped: 0, rejected: 0 };

  for (const t of TOURS_REFERENCE) {
    if (!t.id || !t.slug || !t.title || !t.city || !t.price_per_person) {
      console.warn(`[INGEST-REJECT] Invalid tour record: ${JSON.stringify(t)}`);
      stats.rejected++;
      continue;
    }

    try {
      const res = await query(
        `INSERT INTO tours (
          id, slug, title, city, country, duration, category, rating, review_count,
          price_per_person, currency, featured_image, highlights, cancellation_policy,
          instant_confirmation, overview, is_active, source, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, $17, NOW())
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          city = EXCLUDED.city,
          country = EXCLUDED.country,
          duration = EXCLUDED.duration,
          category = EXCLUDED.category,
          rating = EXCLUDED.rating,
          review_count = EXCLUDED.review_count,
          price_per_person = EXCLUDED.price_per_person,
          currency = EXCLUDED.currency,
          featured_image = EXCLUDED.featured_image,
          highlights = EXCLUDED.highlights,
          cancellation_policy = EXCLUDED.cancellation_policy,
          instant_confirmation = EXCLUDED.instant_confirmation,
          overview = EXCLUDED.overview,
          updated_at = NOW()
        RETURNING (xmax = 0) AS is_insert`,
        [
          t.id,
          t.slug,
          t.title,
          t.city,
          t.country,
          t.duration,
          t.category,
          t.rating || 4.8,
          t.review_count || 100,
          t.price_per_person,
          t.currency || 'INR',
          t.featured_image,
          JSON.stringify(t.highlights || []),
          t.cancellation_policy || 'Free cancellation up to 24 hours',
          t.instant_confirmation !== false,
          t.overview || t.title,
          t.source || 'SS_JOURNEY_CURATED',
        ]
      );

      if (res.rows[0]?.is_insert) {
        stats.inserted++;
      } else {
        stats.updated++;
      }
    } catch (err: any) {
      console.error(`[INGEST-ERROR] Tour ${t.id}:`, err.message);
      stats.rejected++;
    }
  }

  return stats;
}

// ----------------------------------------------------------------------------
// 7. VISA REQUIREMENTS INGESTOR
// ----------------------------------------------------------------------------
async function ingestVisaRequirements(): Promise<IngestionStats> {
  const stats: IngestionStats = { category: 'Visa Requirements', total: VISA_REFERENCE.length, inserted: 0, updated: 0, skipped: 0, rejected: 0 };

  for (const v of VISA_REFERENCE) {
    if (!v.country_code || !v.visa_slug || !v.visa_name || !v.total_price) {
      console.warn(`[INGEST-REJECT] Invalid visa record: ${JSON.stringify(v)}`);
      stats.rejected++;
      continue;
    }

    try {
      const res = await query(
        `INSERT INTO visa_requirements (
          country_code, country_name, visa_slug, visa_name, flag_emoji, validity,
          stay_period, processing_time, express_available, base_fee, embassy_fee,
          service_fee, total_price, currency, requirements, approval_rate, aliases, is_active, source, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, true, $18, NOW())
        ON CONFLICT (visa_slug) DO UPDATE SET
          country_code = EXCLUDED.country_code,
          country_name = EXCLUDED.country_name,
          visa_name = EXCLUDED.visa_name,
          flag_emoji = EXCLUDED.flag_emoji,
          validity = EXCLUDED.validity,
          stay_period = EXCLUDED.stay_period,
          processing_time = EXCLUDED.processing_time,
          express_available = EXCLUDED.express_available,
          base_fee = EXCLUDED.base_fee,
          embassy_fee = EXCLUDED.embassy_fee,
          service_fee = EXCLUDED.service_fee,
          total_price = EXCLUDED.total_price,
          currency = EXCLUDED.currency,
          requirements = EXCLUDED.requirements,
          approval_rate = EXCLUDED.approval_rate,
          aliases = EXCLUDED.aliases,
          updated_at = NOW()
        RETURNING (xmax = 0) AS is_insert`,
        [
          v.country_code.toUpperCase().trim(),
          v.country_name,
          v.visa_slug,
          v.visa_name,
          v.flag_emoji || '🌐',
          v.validity,
          v.stay_period,
          v.processing_time,
          v.express_available || false,
          v.base_fee,
          v.embassy_fee || 0,
          v.service_fee || 0,
          v.total_price,
          v.currency || 'INR',
          JSON.stringify(v.requirements || []),
          v.approval_rate || '99%',
          JSON.stringify(v.aliases || []),
          v.source || 'EMBASSY_RULES',
        ]
      );

      if (res.rows[0]?.is_insert) {
        stats.inserted++;
      } else {
        stats.updated++;
      }
    } catch (err: any) {
      console.error(`[INGEST-ERROR] Visa requirement ${v.visa_slug}:`, err.message);
      stats.rejected++;
    }
  }

  return stats;
}

// Allow CLI execution directly
if (process.argv[1]?.includes('ingestReferenceData')) {
  ingestAllReferenceData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('FATAL Ingestion failure:', err);
      process.exit(1);
    });
}
