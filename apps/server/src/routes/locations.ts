import { Router } from 'express';
import { query } from '../db/index.js';

export const locationsRouter = Router();

export interface LocationSuggestion {
  id: string;
  name: string;
  display_name: string;
  secondary_description: string;
  city: string;
  state?: string;
  country: string;
  category: 'AIRPORT' | 'STATION' | 'BUS_STOP' | 'HOTEL' | 'LOCALITY' | 'LANDMARK' | 'ADDRESS' | 'COUNTRY' | 'REGION';
  category_label: string;
  code?: string; // IATA for airports, IRCTC for train stations, ISO for countries
  lat?: number;
  lon?: number;
  provider: 'INTERNAL_DATABASE' | 'CURATED_HUB' | 'OPENSTREETMAP_PHOTON' | 'NOMINATIM';
  service_affinity?: string[];
}

// ============================================================================
// SERVICE-SPECIFIC SUGGESTION DISPATCHER (DATABASE-BACKED)
// ============================================================================
locationsRouter.get('/suggest', async (req, res) => {
  try {
    const rawService = ((req.query.service as string) || 'hotels').toLowerCase().trim();
    const q = ((req.query.q as string) || '').trim();
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '10', 10), 1), 25);
    const qLower = q.toLowerCase();
    const pattern = `%${qLower}%`;

    // -------------------------------------------------------------
    // SERVICE 1: FLIGHTS -> STRICTLY AIRPORTS ONLY (DATABASE-BACKED)
    // -------------------------------------------------------------
    if (rawService === 'flights' || rawService === 'flight') {
      try {
        const sql = `
          SELECT id, iata_code, icao_code, name, city, state, country, latitude, longitude, aliases
          FROM airports
          WHERE is_active = true AND is_commercial = true
            AND (
              $1 = '' OR
              UPPER(iata_code) = UPPER($1) OR
              LOWER(iata_code) LIKE $2 OR
              LOWER(city) LIKE $2 OR
              LOWER(name) LIKE $2 OR
              LOWER(country) LIKE $2 OR
              EXISTS (SELECT 1 FROM jsonb_array_elements_text(aliases) a WHERE LOWER(a) LIKE $2)
            )
          ORDER BY
            CASE WHEN UPPER(iata_code) = UPPER($1) THEN 1
                 WHEN LOWER(city) = LOWER($1) THEN 2
                 WHEN LOWER(city) LIKE LOWER($1 || '%') THEN 3
                 WHEN LOWER(name) LIKE LOWER($1 || '%') THEN 4
                 ELSE 5 END,
            name ASC
          LIMIT $3
        `;
        const dbRes = await query(sql, [q, pattern, limit]);

        const items: LocationSuggestion[] = dbRes.rows.map((a: any) => ({
          id: `apt-${(a.iata_code || a.id).toLowerCase()}`,
          name: `${a.name} (${a.iata_code})`,
          display_name: `${a.city} (${a.iata_code}) — ${a.name}`,
          secondary_description: `${a.city}, ${a.state ? a.state + ', ' : ''}${a.country}`,
          city: a.city,
          state: a.state || undefined,
          country: a.country,
          category: 'AIRPORT',
          category_label: 'Airport',
          code: a.iata_code,
          lat: a.latitude,
          lon: a.longitude,
          provider: 'INTERNAL_DATABASE',
          service_affinity: ['flights'],
        }));

        return res.json({
          success: true,
          service: 'flights',
          data: items,
          count: items.length,
        });
      } catch (dbErr: any) {
        console.error('[LOCATIONS-SUGGEST] Database error on flights query:', dbErr.message);
        return res.status(500).json({ success: false, message: 'Failed to search airports database' });
      }
    }

    // -------------------------------------------------------------
    // SERVICE 2: TRAINS -> STRICTLY RAILWAY STATIONS ONLY (DATABASE-BACKED)
    // -------------------------------------------------------------
    if (rawService === 'trains' || rawService === 'train') {
      try {
        const sql = `
          SELECT id, station_code, name, city, state, country, zone, latitude, longitude, aliases
          FROM railway_stations
          WHERE is_active = true
            AND (
              $1 = '' OR
              UPPER(station_code) = UPPER($1) OR
              LOWER(station_code) LIKE $2 OR
              LOWER(city) LIKE $2 OR
              LOWER(name) LIKE $2 OR
              LOWER(state) LIKE $2 OR
              EXISTS (SELECT 1 FROM jsonb_array_elements_text(aliases) a WHERE LOWER(a) LIKE $2)
            )
          ORDER BY
            CASE WHEN UPPER(station_code) = UPPER($1) THEN 1
                 WHEN LOWER(city) = LOWER($1) THEN 2
                 WHEN LOWER(city) LIKE LOWER($1 || '%') THEN 3
                 WHEN LOWER(name) LIKE LOWER($1 || '%') THEN 4
                 ELSE 5 END,
            name ASC
          LIMIT $3
        `;
        const dbRes = await query(sql, [q, pattern, limit]);

        const items: LocationSuggestion[] = dbRes.rows.map((s: any) => ({
          id: `stn-${s.station_code.toLowerCase()}`,
          name: `${s.name} (${s.station_code})`,
          display_name: `${s.name} [${s.station_code}] — ${s.city}`,
          secondary_description: `${s.city}, ${s.state}, ${s.country}`,
          city: s.city,
          state: s.state,
          country: s.country,
          category: 'STATION',
          category_label: 'Railway Station',
          code: s.station_code,
          lat: s.latitude,
          lon: s.longitude,
          provider: 'INTERNAL_DATABASE',
          service_affinity: ['trains'],
        }));

        return res.json({
          success: true,
          service: 'trains',
          data: items,
          count: items.length,
        });
      } catch (dbErr: any) {
        console.error('[LOCATIONS-SUGGEST] Database error on trains query:', dbErr.message);
        return res.status(500).json({ success: false, message: 'Failed to search railway stations database' });
      }
    }

    // -------------------------------------------------------------
    // SERVICE 3: BUSES -> BUS TERMINALS, ISBTs & STOPS (DATABASE-BACKED)
    // -------------------------------------------------------------
    if (rawService === 'buses' || rawService === 'bus') {
      try {
        const sql = `
          SELECT id, terminal_code, name, city, state, country, terminal_type, address, latitude, longitude, aliases
          FROM bus_terminals
          WHERE is_active = true
            AND (
              $1 = '' OR
              LOWER(city) LIKE $2 OR
              LOWER(name) LIKE $2 OR
              LOWER(state) LIKE $2 OR
              EXISTS (SELECT 1 FROM jsonb_array_elements_text(aliases) a WHERE LOWER(a) LIKE $2)
            )
          ORDER BY
            CASE WHEN LOWER(city) = LOWER($1) THEN 1
                 WHEN LOWER(city) LIKE LOWER($1 || '%') THEN 2
                 ELSE 3 END,
            name ASC
          LIMIT $3
        `;
        const dbRes = await query(sql, [q, pattern, limit]);

        const seenCities = new Set<string>();
        const items: LocationSuggestion[] = dbRes.rows.map((b: any) => {
          seenCities.add(b.city.toLowerCase());
          return {
            id: `bus-${b.terminal_code.toLowerCase()}`,
            name: b.name,
            display_name: `${b.name} · ${b.city}`,
            secondary_description: `${b.address || b.city + ', ' + b.state}, ${b.country}`,
            city: b.city,
            state: b.state,
            country: b.country,
            category: 'BUS_STOP',
            category_label: b.terminal_type === 'ISBT' ? 'Inter-State Bus Terminal' : 'Bus Boarding Point',
            lat: b.latitude,
            lon: b.longitude,
            provider: 'INTERNAL_DATABASE',
            service_affinity: ['buses'],
          };
        });

        // If user typed a city with no explicit terminal, query destinations to verify city exists and offer city-level hub
        if (q && !seenCities.has(qLower)) {
          const destCheck = await query(
            'SELECT name, state, country FROM destinations WHERE is_active = true AND (LOWER(name) = $1 OR LOWER(name) LIKE $2) LIMIT 1',
            [qLower, pattern]
          );
          if (destCheck.rows.length > 0) {
            const cityName = destCheck.rows[0].name;
            items.unshift({
              id: `bus-city-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
              name: `${cityName} (All Boarding Points)`,
              display_name: `${cityName} City Hub · Multiple Boarding Stops`,
              secondary_description: `All scheduled bus services departing from ${cityName}, ${destCheck.rows[0].country}`,
              city: cityName,
              state: destCheck.rows[0].state || undefined,
              country: destCheck.rows[0].country,
              category: 'BUS_STOP',
              category_label: 'City Bus Hub',
              provider: 'INTERNAL_DATABASE',
              service_affinity: ['buses'],
            });
          }
        }

        return res.json({
          success: true,
          service: 'buses',
          data: items.slice(0, limit),
          count: items.length,
        });
      } catch (dbErr: any) {
        console.error('[LOCATIONS-SUGGEST] Database error on buses query:', dbErr.message);
        return res.status(500).json({ success: false, message: 'Failed to search bus terminals database' });
      }
    }

    // -------------------------------------------------------------
    // SERVICE 4: VISA & SERVICE 5: INSURANCE -> STRICTLY COUNTRIES (DATABASE-BACKED)
    // -------------------------------------------------------------
    if (rawService === 'visa' || rawService === 'insurance') {
      try {
        const sql = `
          SELECT id, code, iso3, name, official_name, continent, flag_emoji, requires_visa_for_indian_passports, visa_types_available, aliases
          FROM countries
          WHERE is_active = true
            AND (
              $1 = '' OR
              UPPER(code) = UPPER($1) OR
              UPPER(iso3) = UPPER($1) OR
              LOWER(name) LIKE $2 OR
              LOWER(continent) LIKE $2 OR
              EXISTS (SELECT 1 FROM jsonb_array_elements_text(aliases) a WHERE LOWER(a) LIKE $2)
            )
          ORDER BY
            CASE WHEN UPPER(code) = UPPER($1) THEN 1
                 WHEN LOWER(name) = LOWER($1) THEN 2
                 WHEN LOWER(name) LIKE LOWER($1 || '%') THEN 3
                 ELSE 4 END,
            name ASC
          LIMIT $3
        `;
        const dbRes = await query(sql, [q, pattern, limit]);

        const items: LocationSuggestion[] = dbRes.rows.map((c: any) => {
          const visaAvailable = Array.isArray(c.visa_types_available)
            ? c.visa_types_available
            : typeof c.visa_types_available === 'string'
            ? JSON.parse(c.visa_types_available)
            : [];

          const visaNote = c.requires_visa_for_indian_passports
            ? (visaAvailable[0] || 'Visa Required')
            : 'Visa-Free / Visa on Arrival';

          return {
            id: `country-${c.code.toLowerCase()}`,
            name: `${c.flag_emoji} ${c.name}`,
            display_name: `${c.flag_emoji} ${c.name} (${c.code})`,
            secondary_description: rawService === 'visa' ? `${visaNote} · ${c.continent}` : `Worldwide Travel Coverage · ${c.continent}`,
            city: c.name,
            country: c.name,
            category: 'COUNTRY',
            category_label: 'Sovereign Country',
            code: c.code,
            provider: 'INTERNAL_DATABASE',
            service_affinity: ['visa', 'insurance'],
          };
        });

        // Special handling for insurance shield zones like "Schengen"
        if (rawService === 'insurance' && (qLower.includes('schengen') || qLower.includes('europe'))) {
          const hasSchengen = items.some(i => i.name.toLowerCase().includes('schengen'));
          if (!hasSchengen) {
            items.unshift({
              id: 'plan-zone-schengen',
              name: '🇪🇺 Schengen Area (Europe 29 Countries)',
              display_name: '🇪🇺 Schengen Visa Compulsory Medical Insurance (€30,000+ Cover)',
              secondary_description: 'Mandatory compliant coverage for France, Switzerland, Germany, Italy, Austria & 24 nations',
              city: 'Europe',
              country: 'Schengen Member States',
              category: 'REGION',
              category_label: 'International Insurance Zone',
              code: 'EU',
              provider: 'INTERNAL_DATABASE',
              service_affinity: ['insurance'],
            });
          }
        }

        return res.json({
          success: true,
          service: rawService,
          data: items.slice(0, limit),
          count: items.length,
        });
      } catch (dbErr: any) {
        console.error('[LOCATIONS-SUGGEST] Database error on countries query:', dbErr.message);
        return res.status(500).json({ success: false, message: 'Failed to search countries database' });
      }
    }

    // -------------------------------------------------------------
    // SERVICE 6: CABS -> LOCALITIES, HUBS, AIRPORTS, STATIONS & ADDRESSES
    // -------------------------------------------------------------
    if (rawService === 'cabs' || rawService === 'cab') {
      const results: LocationSuggestion[] = [];
      const seen = new Set<string>();

      try {
        // Step A: Match Destinations & Landmarks in PostgreSQL
        const destRes = await query(
          `SELECT id, slug, name, display_name, state, country, destination_type, latitude, longitude, aliases
           FROM destinations
           WHERE is_active = true
             AND (
               $1 = '' OR
               LOWER(name) LIKE $2 OR
               LOWER(display_name) LIKE $2 OR
               EXISTS (SELECT 1 FROM jsonb_array_elements_text(aliases) a WHERE LOWER(a) LIKE $2)
             )
           LIMIT $3`,
          [q, pattern, Math.min(limit, 5)]
        );

        for (const d of destRes.rows) {
          const key = d.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              id: `dest-${d.slug}`,
              name: d.name,
              display_name: d.display_name,
              secondary_description: `${d.name}, ${d.state ? d.state + ', ' : ''}${d.country}`,
              city: d.name,
              state: d.state || undefined,
              country: d.country,
              category: 'LOCALITY',
              category_label: 'City Center / Locality',
              lat: d.latitude,
              lon: d.longitude,
              provider: 'INTERNAL_DATABASE',
              service_affinity: ['cabs'],
            });
          }
        }

        // Step B: Include Airports for cab pickup
        const aptRes = await query(
          `SELECT id, iata_code, name, city, state, country, latitude, longitude
           FROM airports
           WHERE is_active = true AND is_commercial = true
             AND ($1 = '' OR UPPER(iata_code) = UPPER($1) OR LOWER(city) LIKE $2 OR LOWER(name) LIKE $2)
           LIMIT 3`,
          [q, pattern]
        );

        for (const a of aptRes.rows) {
          const key = `${a.city}-${a.iata_code}`.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              id: `cab-apt-${a.iata_code.toLowerCase()}`,
              name: `${a.name} (${a.iata_code})`,
              display_name: `${a.city} Airport (${a.iata_code}) — Pick-up / Drop Zone`,
              secondary_description: `${a.name}, ${a.city}, ${a.country}`,
              city: a.city,
              state: a.state || undefined,
              country: a.country,
              category: 'AIRPORT',
              category_label: 'Airport Terminal',
              code: a.iata_code,
              lat: a.latitude,
              lon: a.longitude,
              provider: 'INTERNAL_DATABASE',
              service_affinity: ['cabs'],
            });
          }
        }
      } catch (dbErr: any) {
        console.warn('[LOCATIONS-SUGGEST] Cab DB search error:', dbErr.message);
      }

      // Step C: Live Map Places via Photon OpenStreetMap if user provided 2+ characters
      if (q && q.length >= 2 && results.length < limit) {
        try {
          const photonUrl = new URL('https://photon.komoot.io/api/');
          photonUrl.searchParams.set('q', q);
          photonUrl.searchParams.set('limit', String(limit - results.length));

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const resp = await fetch(photonUrl.toString(), {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
          });
          clearTimeout(timeoutId);

          if (resp.ok) {
            const json = (await resp.json()) as any;
            const features = json.features || [];

            for (const f of features) {
              const props = f.properties || {};
              const coords = f.geometry?.coordinates || [0, 0];
              const name = props.name || props.street || props.locality || props.city || q;
              const nameKey = name.toLowerCase();

              if (!seen.has(nameKey)) {
                seen.add(nameKey);
                const addressParts = [
                  props.name !== props.street ? props.street : null,
                  props.locality,
                  props.district,
                  props.city,
                  props.state,
                  props.country,
                ].filter(Boolean);

                const formatted = addressParts.length > 0 ? addressParts.join(', ') : `${name}, ${props.country || ''}`;

                results.push({
                  id: `osm-${props.osm_id || Math.random().toString(36).substring(2, 9)}`,
                  name,
                  display_name: `${name}${props.city ? ' · ' + props.city : ''}`,
                  secondary_description: formatted,
                  city: props.city || props.county || q,
                  state: props.state || '',
                  country: props.country || 'India',
                  category: 'ADDRESS',
                  category_label: props.osm_value ? props.osm_value.toUpperCase() : 'Location',
                  lat: coords[1],
                  lon: coords[0],
                  provider: 'OPENSTREETMAP_PHOTON',
                  service_affinity: ['cabs'],
                });
                if (results.length >= limit) break;
              }
            }
          }
        } catch {
          // Graceful network timeout fallback
        }
      }

      return res.json({
        success: true,
        service: 'cabs',
        data: results.slice(0, limit),
        count: results.length,
      });
    }

    // -------------------------------------------------------------
    // SERVICE 7: HOTELS, SERVICE 8: VILLAS, SERVICE 9: HOLIDAYS, SERVICE 10: TOURS
    // -> WORLDWIDE DESTINATIONS, CITIES & LOCALITIES (DATABASE-BACKED + GLOBAL DISCOVERY)
    // -------------------------------------------------------------
    const destinationResults: LocationSuggestion[] = [];
    const seenDestinations = new Set<string>();

    // Step A: Search database destinations in PostgreSQL
    try {
      const destRes = await query(
        `SELECT id, slug, name, city, display_name, state, country, country_code, destination_type, latitude, longitude, aliases
         FROM destinations
         WHERE is_active = true
           AND (
             $1 = '' OR
             LOWER(name) LIKE $2 OR
             LOWER(city) LIKE $2 OR
             LOWER(display_name) LIKE $2 OR
             LOWER(country) LIKE $2 OR
             EXISTS (SELECT 1 FROM jsonb_array_elements_text(aliases) a WHERE LOWER(a) LIKE $2)
           )
         ORDER BY
           CASE WHEN LOWER(name) = LOWER($1) THEN 1
                WHEN LOWER(name) LIKE LOWER($1 || '%') THEN 2
                ELSE 3 END,
           name ASC
         LIMIT $3`,
        [q, pattern, limit]
      );

      for (const d of destRes.rows) {
        const cityKey = (d.city || d.name).toLowerCase();
        if (!seenDestinations.has(cityKey)) {
          seenDestinations.add(cityKey);
          destinationResults.push({
            id: `dest-${d.slug}`,
            name: d.name,
            display_name: d.display_name,
            secondary_description: `${d.destination_type} · ${d.state ? d.state + ', ' : ''}${d.country}`,
            city: d.city || d.name,
            state: d.state || undefined,
            country: d.country,
            category: 'LOCALITY',
            category_label: d.country === 'India' ? 'Popular Domestic Destination' : 'Top International Destination',
            lat: d.latitude,
            lon: d.longitude,
            provider: 'INTERNAL_DATABASE',
            service_affinity: ['hotels', 'villas', 'holidays', 'tours'],
          });
        }
      }
    } catch (dbErr: any) {
      console.warn('[LOCATIONS-SUGGEST] Database error on destinations query:', dbErr.message);
    }

    // Step B: Live Global Geocoding via Photon OSM (Allows ANY city in the world: Tokyo, Reykjavik, Manali, Zurich, etc.)
    if (q && q.length >= 2 && destinationResults.length < limit) {
      try {
        const photonUrl = new URL('https://photon.komoot.io/api/');
        photonUrl.searchParams.set('q', q);
        photonUrl.searchParams.set('limit', String(limit - destinationResults.length + 3));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const resp = await fetch(photonUrl.toString(), {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const json = (await resp.json()) as any;
          const features = json.features || [];

          for (const f of features) {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];
            const cityName = props.city || props.name || props.locality;
            if (!cityName) continue;

            const cityKey = cityName.toLowerCase();
            if (!seenDestinations.has(cityKey)) {
              seenDestinations.add(cityKey);

              const countryName = props.country || '';
              const stateName = props.state || '';
              const subText = [stateName, countryName].filter(Boolean).join(', ');

              destinationResults.push({
                id: `geo-dest-${props.osm_id || Math.random().toString(36).substring(2, 9)}`,
                name: cityName,
                display_name: subText ? `${cityName}, ${subText}` : cityName,
                secondary_description: props.type ? `${props.type.toUpperCase()} · ${subText}` : `Destination in ${countryName}`,
                city: cityName,
                state: stateName,
                country: countryName,
                category: 'LOCALITY',
                category_label: 'Verified Destination',
                lat: coords[1],
                lon: coords[0],
                provider: 'OPENSTREETMAP_PHOTON',
                service_affinity: ['hotels', 'villas', 'holidays', 'tours'],
              });

              if (destinationResults.length >= limit) break;
            }
          }
        }
      } catch {
        // Safe timeout fallback
      }
    }

    // Step C: Fallback: If user typed something novel and external service is unavailable,
    // ACCEPT THE USER'S LOCATION INPUT AS VALID! (Preserves location discovery vs inventory separation)
    if (q && destinationResults.length === 0) {
      destinationResults.push({
        id: `user-dest-${Date.now()}`,
        name: q,
        display_name: `${q} (Global Search)`,
        secondary_description: `Search all available stays and inventory in ${q}`,
        city: q,
        country: 'Worldwide',
        category: 'LOCALITY',
        category_label: 'Selected Destination',
        provider: 'INTERNAL_DATABASE',
        service_affinity: ['hotels', 'villas', 'holidays', 'tours'],
      });
    }

    return res.json({
      success: true,
      service: rawService,
      data: destinationResults.slice(0, limit),
      count: destinationResults.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// PLACES SEARCH (FOR CABS / MAP PICKERS)
// ============================================================================
locationsRouter.get('/places-search', async (req, res) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '8', 10), 1), 20);

    // If query is empty or 1 character, return top destinations from PostgreSQL
    if (!q || q.length < 2) {
      const dbRes = await query(
        'SELECT slug, name, display_name, state, country, latitude, longitude FROM destinations WHERE is_active = true ORDER BY name ASC LIMIT $1',
        [limit]
      );
      const results = dbRes.rows.map((d: any) => ({
        id: `dest-${d.slug}`,
        name: d.name,
        display_name: d.display_name,
        formatted_address: `${d.name}, ${d.state ? d.state + ', ' : ''}${d.country}`,
        category: 'LOCALITY',
        category_label: 'Verified City',
        lat: d.latitude,
        lon: d.longitude,
        city: d.name,
        state: d.state || '',
        country: d.country,
      }));
      return res.json({ success: true, data: results });
    }

    const pattern = `%${q.toLowerCase()}%`;
    const results: any[] = [];
    const seenNames = new Set<string>();

    // Step A: Search database destinations
    const destDb = await query(
      `SELECT slug, name, display_name, state, country, latitude, longitude
       FROM destinations
       WHERE is_active = true AND (LOWER(name) LIKE $1 OR LOWER(display_name) LIKE $1)
       LIMIT $2`,
      [pattern, Math.min(limit, 4)]
    );

    for (const d of destDb.rows) {
      const key = d.name.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        results.push({
          id: `dest-${d.slug}`,
          name: d.name,
          display_name: d.display_name,
          formatted_address: `${d.name}, ${d.state ? d.state + ', ' : ''}${d.country}`,
          category: 'LOCALITY',
          category_label: 'Verified Destination',
          lat: d.latitude,
          lon: d.longitude,
          city: d.name,
          state: d.state || '',
          country: d.country,
        });
      }
    }

    // Step B: Live OpenStreetMap Photon geocoder for places & landmarks
    if (results.length < limit) {
      try {
        const photonUrl = new URL('https://photon.komoot.io/api/');
        photonUrl.searchParams.set('q', q);
        photonUrl.searchParams.set('limit', String(limit - results.length));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const resp = await fetch(photonUrl.toString(), {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const json = (await resp.json()) as any;
          const features = json.features || [];

          for (const f of features) {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];
            const name = props.name || props.street || props.locality || props.city || q;
            const nameKey = name.toLowerCase();

            if (!seenNames.has(nameKey)) {
              seenNames.add(nameKey);
              const addressParts = [
                props.name !== props.street ? props.street : null,
                props.locality,
                props.district,
                props.city,
                props.state,
                props.country,
              ].filter(Boolean);

              const formatted = addressParts.length > 0 ? addressParts.join(', ') : `${name}, ${props.country || ''}`;

              results.push({
                id: `osm-${props.osm_id || Math.random().toString(36).substring(2, 9)}`,
                name,
                display_name: `${name}${props.city ? ' · ' + props.city : ''}`,
                formatted_address: formatted,
                category: 'LOCALITY',
                category_label: props.osm_value ? props.osm_value.toUpperCase() : 'Location',
                lat: coords[1],
                lon: coords[0],
                city: props.city || props.county || '',
                state: props.state || '',
                country: props.country || '',
              });
              if (results.length >= limit) break;
            }
          }
        }
      } catch {
        // Safe timeout fallback
      }
    }

    return res.json({ success: true, data: results });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// REVERSE GEOCODING (GPS CURRENT LOCATION)
// ============================================================================
locationsRouter.get('/reverse-geocode', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    try {
      const photonRevUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const resp = await fetch(photonRevUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const json = (await resp.json()) as any;
        const feature = json.features && json.features[0];
        if (feature) {
          const props = feature.properties || {};
          const name = props.name || props.street || props.locality || 'Current Location';
          const addressParts = [
            props.name !== props.street ? props.street : null,
            props.locality,
            props.district,
            props.city,
            props.state,
            props.country,
          ].filter(Boolean);

          const formatted = addressParts.length > 0 ? addressParts.join(', ') : `${name}, ${props.country || ''}`;

          return res.json({
            success: true,
            data: {
              id: `geo-${Date.now()}`,
              name,
              display_name: `${name} (Current GPS Location)`,
              formatted_address: formatted,
              category: 'LOCALITY',
              category_label: 'Current Location',
              lat,
              lon,
              city: props.city || props.county || '',
              state: props.state || '',
              country: props.country || '',
            },
          });
        }
      }
    } catch {
      // Fallback
    }

    return res.json({
      success: true,
      data: {
        id: `geo-${Date.now()}`,
        name: 'My Current Location',
        display_name: `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        formatted_address: `Detected GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        category: 'LOCALITY',
        category_label: 'Current Location',
        lat,
        lon,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// DRIVING ROUTE & DISTANCE ESTIMATION
// ============================================================================
locationsRouter.get('/route-estimate', async (req, res) => {
  try {
    const originLat = parseFloat(req.query.originLat as string);
    const originLon = parseFloat(req.query.originLon as string);
    const destLat = parseFloat(req.query.destLat as string);
    const destLon = parseFloat(req.query.destLon as string);

    if (isNaN(originLat) || isNaN(originLon) || isNaN(destLat) || isNaN(destLon)) {
      return res.status(400).json({ success: false, message: 'Invalid route coordinates' });
    }

    const R = 6371; // Earth radius in km
    const dLat = ((destLat - originLat) * Math.PI) / 180;
    const dLon = ((destLon - originLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((originLat * Math.PI) / 180) *
        Math.cos((destLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDist = R * c;

    const roadDistKm = Math.max(1, Math.round(straightDist * 1.28 * 10) / 10);
    const estMinutes = Math.max(6, Math.round((roadDistKm / 32) * 60) + 6);

    const hours = Math.floor(estMinutes / 60);
    const mins = estMinutes % 60;
    const formattedDuration = hours > 0 ? `${hours} hr ${mins} min` : `${mins} mins`;

    return res.json({
      success: true,
      data: {
        distance_km: roadDistKm,
        duration_minutes: estMinutes,
        formatted_duration: formattedDuration,
        origin: { lat: originLat, lon: originLon },
        destination: { lat: destLat, lon: destLon },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// SERVICES METADATA (AIRPORTS & HUBS OVERVIEW - FROM DATABASE)
// ============================================================================
locationsRouter.get('/', async (req, res) => {
  try {
    const [airportsRes, stationsRes, busesRes, countriesRes, destinationsRes] = await Promise.all([
      query('SELECT iata_code as code, name, city, country FROM airports WHERE is_active = true AND is_commercial = true ORDER BY name ASC LIMIT 14'),
      query('SELECT station_code as code, name, city, state, country FROM railway_stations WHERE is_active = true ORDER BY name ASC LIMIT 10'),
      query('SELECT terminal_code as code, name, city, state, country, terminal_type as hub_type FROM bus_terminals WHERE is_active = true ORDER BY name ASC LIMIT 10'),
      query('SELECT code, iso3, name, continent, flag_emoji as popular_flag, requires_visa_for_indian_passports FROM countries WHERE is_active = true ORDER BY name ASC LIMIT 12'),
      query('SELECT slug as id, name, display_name, city, state, country, destination_type FROM destinations WHERE is_active = true ORDER BY name ASC LIMIT 20'),
    ]);

    return res.json({
      success: true,
      data: {
        origins: airportsRes.rows.slice(0, 6),
        destinations: airportsRes.rows.slice(6, 14),
        stations: stationsRes.rows,
        bus_hubs: busesRes.rows,
        countries: countriesRes.rows,
        curated_hubs: destinationsRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

locationsRouter.post('/validate-route', async (req, res) => {
  return res.json({ success: true, data: { valid: true, message: 'Route validated' } });
});
