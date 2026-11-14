import test from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/traveler_db',
});

const BASE_URL = process.env.API_URL || 'http://localhost:8000/api/v1';

test.describe('SS Journey — Holiday Packages Dataset Integration Tests', () => {

  test('1. Database holds exactly 480 packages and 2,400 day-wise itineraries', async () => {
    const pkgRes = await pool.query(
      'SELECT COUNT(*) as total, COUNT(DISTINCT package_id) as distinct_ids FROM holiday_packages WHERE package_id IS NOT NULL'
    );
    assert.equal(parseInt(pkgRes.rows[0].total, 10), 480, 'Must have exactly 480 package records');
    assert.equal(parseInt(pkgRes.rows[0].distinct_ids, 10), 480, 'All 480 package IDs must be unique');

    const itinRes = await pool.query(
      'SELECT COUNT(*) as total, COUNT(DISTINCT package_id) as distinct_pkgs FROM package_itineraries'
    );
    assert.equal(parseInt(itinRes.rows[0].total, 10), 2400, 'Must have exactly 2,400 day-wise itinerary records');
    assert.equal(parseInt(itinRes.rows[0].distinct_pkgs, 10), 480, 'All 480 packages must have day-wise itineraries');
  });

  test('2. Verified distribution: 16 destinations (30 each), 240 National, 240 International', async () => {
    // 16 destinations check
    const destRes = await pool.query(
      `SELECT destination, COUNT(*) as count
       FROM holiday_packages
       WHERE package_id IS NOT NULL
       GROUP BY destination
       ORDER BY destination`
    );
    assert.equal(destRes.rows.length, 16, 'Must cover exactly 16 destinations');
    for (const row of destRes.rows) {
      assert.equal(parseInt(row.count, 10), 30, `Destination ${row.destination} must have exactly 30 packages`);
    }

    // Region check (240 National, 240 International)
    const regionRes = await pool.query(
      `SELECT region, COUNT(*) as count
       FROM holiday_packages
       WHERE package_id IS NOT NULL
       GROUP BY region`
    );
    const regionMap = Object.fromEntries(regionRes.rows.map(r => [r.region, parseInt(r.count, 10)]));
    assert.equal(regionMap['National'], 240, 'Must have exactly 240 National packages');
    assert.equal(regionMap['International'], 240, 'Must have exactly 240 International packages');
  });

  test('3. Package schema normalization (Pricing, Arrays, Policies)', async () => {
    const sampleRes = await pool.query(
      `SELECT * FROM holiday_packages WHERE package_id = 'TZ-NAT-KERA-01'`
    );
    assert.equal(sampleRes.rows.length, 1, 'Package TZ-NAT-KERA-01 must exist');
    const pkg = sampleRes.rows[0];

    assert.equal(pkg.destination, 'Kerala');
    assert.equal(pkg.region, 'National');
    assert.equal(pkg.theme, 'Explorer');
    assert.equal(pkg.duration_days, 6);
    assert.equal(pkg.duration_nights, 5);
    assert.equal(parseFloat(pkg.price_per_person), 23000);
    assert.equal(parseFloat(pkg.old_price), 26500);
    assert.equal(pkg.discount_percent, 13);
    assert.ok(Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0, 'Inclusions must be JSONB array');
    assert.ok(Array.isArray(pkg.exclusions) && pkg.exclusions.length > 0, 'Exclusions must be JSONB array');
    assert.ok(Array.isArray(pkg.highlights) && pkg.highlights.length > 0, 'Highlights must be JSONB array');
    assert.ok(pkg.route && pkg.route.includes('Munnar'), 'Route must be populated');
    assert.ok(pkg.cancellation_policy, 'Cancellation policy must be present');
  });

  test('4. Customer API: GET /api/v1/packages returns paginated packages with transparency notice', async () => {
    const res = await fetch(`${BASE_URL}/packages?limit=10`);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.success, true);
    assert.equal(json.inventory_status, 'AVAILABLE');
    assert.ok(json.pricing_notice, 'Must include indicative pricing notice');
    assert.equal(json.data.items.length, 10);
    assert.equal(json.data.pagination.total, 480);

    const first = json.data.items[0];
    assert.ok(first.package_id, 'Package ID must be present');
    assert.ok(first.price_per_person > 0, 'Price must be positive');
    assert.ok(first.featured_image, 'Featured image must be present');
  });

  test('5. Customer API: Filtering by region (National vs International)', async () => {
    const natRes = await fetch(`${BASE_URL}/packages?region=National&limit=5`);
    const natJson = await natRes.json();
    assert.equal(natJson.data.pagination.total, 240);
    for (const item of natJson.data.items) {
      assert.equal(item.region, 'National');
    }

    const intRes = await fetch(`${BASE_URL}/packages?region=International&limit=5`);
    const intJson = await intRes.json();
    assert.equal(intJson.data.pagination.total, 240);
    for (const item of intJson.data.items) {
      assert.equal(item.region, 'International');
    }
  });

  test('6. Customer API: Destination search returns exact 30 packages for each covered destination', async () => {
    const destinations = ['Bali', 'Dubai', 'Goa', 'Andaman', 'Rajasthan', 'Thailand'];
    for (const dest of destinations) {
      const res = await fetch(`${BASE_URL}/packages?destination=${dest}&limit=50`);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.pagination.total, 30, `Expected 30 packages for ${dest}`);
    }
  });

  test('7. Customer API: GET /api/v1/packages/:idOrSlug retrieves full day-wise itinerary', async () => {
    const res = await fetch(`${BASE_URL}/packages/TZ-NAT-KERA-01`);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.success, true);
    assert.equal(json.data.package_id, 'TZ-NAT-KERA-01');
    assert.ok(Array.isArray(json.data.itineraries), 'Must return itineraries array');
    assert.equal(json.data.itineraries.length, 6, 'Kerala Explorer must have 6 day records');
    assert.equal(json.data.itineraries[0].day_number, 1);
    assert.ok(json.data.itineraries[0].description.includes('Kochi'), 'Day 1 must mention Kochi');
  });

  test('8. Search for destination with NO packages returns valid NO_INVENTORY empty state without error', async () => {
    const res = await fetch(`${BASE_URL}/packages?destination=Paris`);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.success, true);
    assert.equal(json.inventory_status, 'NO_INVENTORY');
    assert.equal(json.data.items.length, 0);
    assert.ok(json.message.includes('No holiday packages currently found for Paris'));
  });

  test('9. Admin/Workflow status toggle (DRAFT vs PUBLISHED)', async () => {
    // 1. Toggle to DRAFT
    const draftRes = await fetch(`${BASE_URL}/packages/TZ-NAT-KERA-01/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DRAFT' }),
    });
    assert.equal(draftRes.status, 200);

    // 2. Public customer search excludes DRAFT
    const searchRes = await fetch(`${BASE_URL}/packages?destination=Kerala&limit=50`);
    const searchJson = await searchRes.json();
    assert.equal(searchJson.data.pagination.total, 29, 'Kerala public count should be 29 when 1 is drafted');

    // 3. Toggle back to PUBLISHED
    const pubRes = await fetch(`${BASE_URL}/packages/TZ-NAT-KERA-01/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PUBLISHED' }),
    });
    assert.equal(pubRes.status, 200);

    // 4. Public count restored to 30
    const restoredRes = await fetch(`${BASE_URL}/packages?destination=Kerala&limit=50`);
    const restoredJson = await restoredRes.json();
    assert.equal(restoredJson.data.pagination.total, 30, 'Kerala public count must be restored to 30');
  });

});

