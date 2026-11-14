import path from 'path';
import xlsx from 'xlsx';
import { pool, query } from './index.js';
import { initDbSchema } from './schema.js';

// Destination image map
const DESTINATION_IMAGES: Record<string, string> = {
  Andaman: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80',
  Bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
  Darjeeling: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=80',
  Dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80',
  Goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80',
  Himalayan: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
  Kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=80',
  Malaysia: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&auto=format&fit=crop&q=80',
  Nepal: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
  'North India': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
  Rajasthan: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
  Singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop&q=80',
  'South India': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80',
  'Sri Lanka': 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=800&auto=format&fit=crop&q=80',
  Thailand: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800&auto=format&fit=crop&q=80',
  Turkey: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&auto=format&fit=crop&q=80',
};

const DESTINATION_MASTER_METADATA: Record<string, { country: string; type: string; state?: string }> = {
  Andaman: { country: 'India', type: 'ISLAND', state: 'Andaman & Nicobar' },
  Bali: { country: 'Indonesia', type: 'ISLAND' },
  Darjeeling: { country: 'India', type: 'HILL_STATION', state: 'West Bengal' },
  Dubai: { country: 'UAE', type: 'METRO' },
  Goa: { country: 'India', type: 'BEACH', state: 'Goa' },
  Himalayan: { country: 'India', type: 'HILL_STATION', state: 'Himachal / Uttarakhand' },
  Kerala: { country: 'India', type: 'REGION', state: 'Kerala' },
  Malaysia: { country: 'Malaysia', type: 'COUNTRY' },
  Nepal: { country: 'Nepal', type: 'COUNTRY' },
  'North India': { country: 'India', type: 'REGION' },
  Rajasthan: { country: 'India', type: 'HERITAGE', state: 'Rajasthan' },
  Singapore: { country: 'Singapore', type: 'METRO' },
  'South India': { country: 'India', type: 'REGION' },
  'Sri Lanka': { country: 'Sri Lanka', type: 'COUNTRY' },
  Thailand: { country: 'Thailand', type: 'COUNTRY' },
  Turkey: { country: 'Turkey', type: 'COUNTRY' },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function parseDuration(durationStr: string): { nights: number; days: number } {
  // e.g. "5 Nights / 6 Days"
  const match = durationStr.match(/(\d+)\s*Nights?\s*\/\s*(\d+)\s*Days?/i);
  if (match) {
    return { nights: parseInt(match[1], 10), days: parseInt(match[2], 10) };
  }
  return { nights: 4, days: 5 };
}

function splitDelimited(val: any, delimiter: string = ';'): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val)
    .split(delimiter)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function ingestHolidayPackages(options?: {
  publicationStatus?: 'DRAFT' | 'PUBLISHED';
  filePath?: string;
}) {
  const startTime = Date.now();
  console.log('============================================================');
  console.log('🚀 SS JOURNEY — HOLIDAY PACKAGES INGESTION ENGINE');
  console.log('============================================================');

  const candidates = [
    options?.filePath,
    path.resolve(process.cwd(), 'data/SS_Journey_Cleaned_Holiday_Packages.xlsx'),
    path.resolve(process.cwd(), 'backend/data/SS_Journey_Cleaned_Holiday_Packages.xlsx'),
    path.resolve(__dirname, '../../data/SS_Journey_Cleaned_Holiday_Packages.xlsx'),
  ].filter(Boolean) as string[];

  let resolvedPath = candidates[0];
  for (const p of candidates) {
    if (require('fs').existsSync(p)) {
      resolvedPath = p;
      break;
    }
  }
  console.log(`📁 Source Workbook: ${resolvedPath}`);

  // Ensure DB schema is ready
  await initDbSchema();

  // Load workbook
  const workbook = xlsx.readFile(resolvedPath);
  const sheetNames = workbook.SheetNames;
  console.log(`📋 Available Sheets: ${sheetNames.join(', ')}`);

  const requiredSheets = ['Holiday_Packages', 'Package_Itinerary', 'Destination_Summary'];
  for (const sheet of requiredSheets) {
    if (!sheetNames.includes(sheet)) {
      throw new Error(`Critical Error: Required sheet '${sheet}' is missing from workbook!`);
    }
  }

  // 1. Read Sheets
  const packagesRaw: any[] = xlsx.utils.sheet_to_json(workbook.Sheets['Holiday_Packages']);
  const itinerariesRaw: any[] = xlsx.utils.sheet_to_json(workbook.Sheets['Package_Itinerary']);
  const destinationSummaryRaw: any[] = xlsx.utils.sheet_to_json(workbook.Sheets['Destination_Summary']);

  console.log(`📊 Loaded:`);
  console.log(`   - ${packagesRaw.length} Package records (Expected: 480)`);
  console.log(`   - ${itinerariesRaw.length} Day-wise itinerary records (Expected: 2400)`);
  console.log(`   - ${destinationSummaryRaw.length} Destination summaries (Expected: 16)`);

  if (packagesRaw.length !== 480) {
    console.warn(`⚠️ Warning: Expected exactly 480 packages, found ${packagesRaw.length}`);
  }
  if (itinerariesRaw.length !== 2400) {
    console.warn(`⚠️ Warning: Expected exactly 2,400 itinerary records, found ${itinerariesRaw.length}`);
  }

  // Determine default publication status
  // Default to PUBLISHED unless explicitly asked for DRAFT
  const publicationStatus = options?.publicationStatus || 'PUBLISHED';
  console.log(`🔒 Publication Status for Ingested Items: ${publicationStatus}`);

  // 2. Synchronize Destinations into destinations master table
  console.log(`\n📍 Synchronizing destinations into master table...`);
  let syncedDestinations = 0;
  for (const destRow of destinationSummaryRaw) {
    const destName = String(destRow['Destination'] || '').trim();
    if (!destName) continue;

    const meta = DESTINATION_MASTER_METADATA[destName] || {
      country: destRow['Region'] === 'International' ? 'International' : 'India',
      type: 'CITY',
    };
    const slug = slugify(destName);
    const displayName = `${destName}, ${meta.country}`;

    await query(
      `INSERT INTO destinations (slug, name, city, display_name, country, destination_type, state, popular_services, source, is_active)
       VALUES ($1, $2, $2, $3, $4, $5, $6, '["packages", "hotels"]'::jsonb, 'EXCEL_HOLIDAY_PACKAGES', true)
       ON CONFLICT (slug) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         destination_type = EXCLUDED.destination_type,
         is_active = true,
         updated_at = NOW()`,
      [slug, destName, displayName, meta.country, meta.type, meta.state || null]
    );
    syncedDestinations++;
  }
  console.log(`✅ ${syncedDestinations} Destinations synchronized in master destinations table.`);

  // 3. Process and Upsert Holiday Packages
  console.log(`\n📦 Ingesting Holiday Packages...`);
  let packagesUpserted = 0;
  const packageIdSet = new Set<string>();
  const destinationCounts: Record<string, number> = {};

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const row of packagesRaw) {
      const packageId = String(row['Package ID'] || '').trim();
      if (!packageId) {
        throw new Error('Missing Package ID in row: ' + JSON.stringify(row));
      }

      if (packageIdSet.has(packageId)) {
        throw new Error(`Duplicate Package ID found in dataset: ${packageId}`);
      }
      packageIdSet.add(packageId);

      const region = String(row['Region'] || 'National').trim();
      const destination = String(row['Destination'] || '').trim();
      const title = String(row['Package Title'] || '').trim();
      const theme = String(row['Theme'] || 'Explorer').trim();
      const packageType = String(row['Package Type'] || 'Holiday').trim();
      const durationStr = String(row['Duration'] || '5 Nights / 6 Days').trim();
      const { nights, days } = parseDuration(durationStr);

      const startingPrice = parseFloat(row['Starting Price (INR/Person)']) || 15000;
      const oldPrice = parseFloat(row['Old Price (INR/Person)']) || Math.round(startingPrice * 1.15);
      const discountPercent =
        parseInt(row['Discount %'], 10) || Math.round(((oldPrice - startingPrice) / oldPrice) * 100);

      const route = String(row['Route'] || '').trim();
      const overview = String(row['Overview'] || '').trim();

      const highlights = splitDelimited(row['Highlights'], ',');
      const placesCovered = splitDelimited(row['Places Covered'], ',');
      const activities = splitDelimited(row['Activities'], ',');

      const hotelCategory = String(row['Hotel Category'] || '3/4 Star (customizable)').trim();
      const transfers = String(row['Transfers'] || 'Included as per itinerary').trim();
      const meals = String(row['Meals'] || 'Breakfast').trim();
      const sightseeing = String(row['Sightseeing'] || 'As per itinerary').trim();

      const inclusions = splitDelimited(row['Inclusions'], ';');
      const exclusions = splitDelimited(row['Exclusions'], ';');

      const dayWiseItineraryText = String(row['Day-wise Itinerary'] || '').trim();
      const bestTimeToVisit = String(row['Best Time to Visit'] || 'October to March').trim();
      const suitableFor = String(row['Suitable For'] || theme).trim();
      const offerTitle = String(row['Offer Title'] || `Explore ${title}`).trim();
      const offerDescription = String(
        row['Offer Description'] || 'Handcrafted holiday with verified travel partners.'
      ).trim();
      const cancellationPolicy = String(
        row['Cancellation Policy'] ||
          'Flexible cancellation available up to 7 days before departure. Contact SS Journey support for details.'
      ).trim();
      const seoTitle = String(row['SEO Title'] || `${title} | SS Journey`).trim();
      const seoDescription = String(row['SEO Description'] || overview).trim();
      const seoKeywords = String(row['SEO Keywords'] || `${destination} tour packages, holiday packages`).trim();

      const featuredImage =
        DESTINATION_IMAGES[destination] ||
        'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80';
      const slug = `${slugify(title)}-${packageId.toLowerCase()}`;

      // Upsert package
      await client.query(
        `INSERT INTO holiday_packages (
          package_id, slug, title, destination, region, theme, package_type,
          duration, duration_days, duration_nights, price_per_person, old_price, discount_percent,
          currency, route, overview, highlights, places_covered, activities,
          hotel_category, transfers, meals, sightseeing, inclusions, exclusions,
          day_wise_itinerary_text, best_time_to_visit, suitable_for, offer_title, offer_description,
          cancellation_policy, seo_title, seo_description, seo_keywords,
          publication_status, featured_image, rating, available_capacity, is_simulated, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          'INR', $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28, $29,
          $30, $31, $32, $33,
          $34, $35, $36, 25, false, true
        )
        ON CONFLICT (package_id) DO UPDATE SET
          slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          destination = EXCLUDED.destination,
          region = EXCLUDED.region,
          theme = EXCLUDED.theme,
          package_type = EXCLUDED.package_type,
          duration = EXCLUDED.duration,
          duration_days = EXCLUDED.duration_days,
          duration_nights = EXCLUDED.duration_nights,
          price_per_person = EXCLUDED.price_per_person,
          old_price = EXCLUDED.old_price,
          discount_percent = EXCLUDED.discount_percent,
          route = EXCLUDED.route,
          overview = EXCLUDED.overview,
          highlights = EXCLUDED.highlights,
          places_covered = EXCLUDED.places_covered,
          activities = EXCLUDED.activities,
          hotel_category = EXCLUDED.hotel_category,
          transfers = EXCLUDED.transfers,
          meals = EXCLUDED.meals,
          sightseeing = EXCLUDED.sightseeing,
          inclusions = EXCLUDED.inclusions,
          exclusions = EXCLUDED.exclusions,
          day_wise_itinerary_text = EXCLUDED.day_wise_itinerary_text,
          best_time_to_visit = EXCLUDED.best_time_to_visit,
          suitable_for = EXCLUDED.suitable_for,
          offer_title = EXCLUDED.offer_title,
          offer_description = EXCLUDED.offer_description,
          cancellation_policy = EXCLUDED.cancellation_policy,
          seo_title = EXCLUDED.seo_title,
          seo_description = EXCLUDED.seo_description,
          seo_keywords = EXCLUDED.seo_keywords,
          publication_status = EXCLUDED.publication_status,
          featured_image = EXCLUDED.featured_image,
          is_active = true,
          updated_at = NOW()`,
        [
          packageId,
          slug,
          title,
          destination,
          region,
          theme,
          packageType,
          durationStr,
          days,
          nights,
          startingPrice,
          oldPrice,
          discountPercent,
          route,
          overview,
          JSON.stringify(highlights),
          JSON.stringify(placesCovered),
          JSON.stringify(activities),
          hotelCategory,
          transfers,
          meals,
          sightseeing,
          JSON.stringify(inclusions),
          JSON.stringify(exclusions),
          dayWiseItineraryText,
          bestTimeToVisit,
          suitableFor,
          offerTitle,
          offerDescription,
          cancellationPolicy,
          seoTitle,
          seoDescription,
          seoKeywords,
          publicationStatus,
          featuredImage,
          4.85,
        ]
      );

      packagesUpserted++;
      destinationCounts[destination] = (destinationCounts[destination] || 0) + 1;
    }

    // 4. Process and Upsert Relational Itineraries
    console.log(`\n🗓️ Ingesting Day-Wise Itineraries...`);
    let itinerariesUpserted = 0;

    for (const itin of itinerariesRaw) {
      const packageId = String(itin['Package ID'] || '').trim();
      const destination = String(itin['Destination'] || '').trim();
      const packageTitle = String(itin['Package Title'] || '').trim();
      const dayNumber = parseInt(itin['Day Number'], 10);
      const itineraryDescription = String(itin['Itinerary Description'] || '').trim();

      if (!packageId || isNaN(dayNumber) || !itineraryDescription) {
        continue;
      }

      await client.query(
        `INSERT INTO package_itineraries (
          package_id, destination, package_title, day_number, itinerary_description
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (package_id, day_number) DO UPDATE SET
          destination = EXCLUDED.destination,
          package_title = EXCLUDED.package_title,
          itinerary_description = EXCLUDED.itinerary_description,
          updated_at = NOW()`,
        [packageId, destination, packageTitle, dayNumber, itineraryDescription]
      );

      itinerariesUpserted++;
    }

    await client.query('COMMIT');
    console.log(`\n✅ Database Transaction Committed Successfully!`);

    // Summary Verification
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n============================================================');
    console.log('🎉 INGESTION COMPLETE & VERIFIED');
    console.log('============================================================');
    console.log(`⏱️ Duration: ${durationSec}s`);
    console.log(`📦 Packages Upserted: ${packagesUpserted}`);
    console.log(`🗓️ Itinerary Days Upserted: ${itinerariesUpserted}`);
    console.log(`🗺️ Destination Breakdown (Total ${Object.keys(destinationCounts).length} Destinations):`);
    for (const [dest, count] of Object.entries(destinationCounts).sort()) {
      console.log(`   - ${dest.padEnd(16)}: ${count} packages`);
    }

    return {
      success: true,
      packagesCount: packagesUpserted,
      itinerariesCount: itinerariesUpserted,
      destinationsCount: Object.keys(destinationCounts).length,
      durationSec,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ingestion failed, transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Direct CLI Execution
if (process.argv[1] && process.argv[1].endsWith('ingestHolidayPackages.ts')) {
  const isDraft = process.argv.includes('--draft');
  const pubStatus = isDraft ? 'DRAFT' : 'PUBLISHED';
  ingestHolidayPackages({ publicationStatus: pubStatus })
    .then(() => {
      console.log('🚀 Script finished cleanly.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}
