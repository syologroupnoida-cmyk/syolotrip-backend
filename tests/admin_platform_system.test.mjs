import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/traveler_db',
});

const BASE_URL = process.env.API_URL || 'http://localhost:8000/api/v1';
const SECRET_KEY = process.env.SECRET_KEY || 'dev-secret-key-super-secure-token-ss-journey-2026-production-grade';

// Generate Admin JWT Token
const adminToken = jwt.sign(
  { sub: '1848fe67-8766-431f-b4ef-eff1271bd52c', role: 'ADMIN', email: 'superadmin@ssjourney.com' },
  SECRET_KEY,
  { expiresIn: '1h' }
);

const authHeaders = {
  'Authorization': `Bearer ${adminToken}`,
  'Content-Type': 'application/json',
};

test.describe('SS Journey — Complete Admin Platform Management System Tests', () => {

  test('1. Central Admin Dashboard Overview returns real multi-service analytics', async () => {
    const res = await fetch(`${BASE_URL}/admin/overview?date_range=all&channel=all`, {
      headers: authHeaders,
    });
    assert.equal(res.status, 200, 'Overview endpoint must return 200 OK');
    const body = await res.json();
    assert.equal(body.success, true);
    const data = body.data;

    // Check Metrics & Reconciliation
    assert(data.total_revenue >= 0, 'Must report non-negative total revenue');
    assert(data.platform_earnings >= 0, 'Must report non-negative platform earnings');
    assert(typeof data.total_bookings === 'number', 'Total bookings must be a number');
    assert(typeof data.total_customers === 'number', 'Total customers must be a number');
    assert(typeof data.total_partners === 'number', 'Total partners must be a number');

    // Check 10 Travel Services Inventory Breakdown
    const inv = data.inventory_overview;
    assert(inv, 'Inventory overview object must exist');
    const requiredServices = ['flights', 'hotels', 'villas', 'packages', 'trains', 'buses', 'cabs', 'tours', 'visa', 'insurance'];
    for (const svc of requiredServices) {
      assert(inv[svc] !== undefined, `Inventory overview must include ${svc}`);
      assert(typeof inv[svc].active === 'number', `${svc} must have active count`);
      assert(typeof inv[svc].total === 'number', `${svc} must have total count`);
    }

    // Check Master Data Overview (5 Tables)
    const master = data.master_data_overview;
    assert(master, 'Master data overview must exist');
    assert(master.airports > 0, 'Must have airports');
    assert(master.stations > 0, 'Must have railway stations');
    assert(master.terminals > 0, 'Must have bus terminals');
    assert(master.destinations > 0, 'Must have destinations');
    assert(master.countries > 0, 'Must have countries');

    // Check Payment Statistics & Timeline
    assert(data.payment_stats, 'Payment stats must exist');
    assert(Array.isArray(data.recent_bookings), 'Recent bookings must be an array');
    assert(Array.isArray(data.recent_transactions), 'Recent transactions must be an array');
  });

  test('2. Central Dashboard respects date, channel and service filters', async () => {
    // Channel filter: B2C
    const resB2C = await fetch(`${BASE_URL}/admin/overview?channel=B2C&date_range=month`, {
      headers: authHeaders,
    });
    assert.equal(resB2C.status, 200);
    const b2cData = (await resB2C.json()).data;
    assert(typeof b2cData.b2c_bookings === 'number');

    // Service filter: FLIGHT
    const resSvc = await fetch(`${BASE_URL}/admin/overview?service=FLIGHT`, {
      headers: authHeaders,
    });
    assert.equal(resSvc.status, 200);
    const svcData = (await resSvc.json()).data;
    assert(typeof svcData.total_bookings === 'number');
  });

  test('3. Universal Service Management CRUD operates across entities', async () => {
    // 3a. Read entity list
    const listRes = await fetch(`${BASE_URL}/admin/services/villas?limit=5`, {
      headers: authHeaders,
    });
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.equal(listBody.success, true);
    assert(Array.isArray(listBody.data.items), 'Items must be an array');

    // 3b. Create new record in villas
    const newVilla = {
      name: 'Test Sunset Villa Oceanfront',
      destination: 'Goa',
      city: 'Anjuna',
      country: 'India',
      bedrooms: 4,
      bathrooms: 4,
      max_guests: 10,
      price_per_night: 25000,
      private_pool: true,
      beach_access: true,
      overview: 'Luxury automated test villa with private sunset deck.',
    };

    const createRes = await fetch(`${BASE_URL}/admin/services/villas`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newVilla),
    });
    assert.equal(createRes.status, 201, 'Should create record with 201 Created');
    const created = (await createRes.json()).data;
    assert(created.id, 'Created record must have an ID');
    const createdId = created.id;

    // 3c. Update record
    const updateRes = await fetch(`${BASE_URL}/admin/services/villas/${createdId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        ...newVilla,
        price_per_night: 28000,
        name: 'Test Sunset Villa Oceanfront (Renovated)',
      }),
    });
    assert.equal(updateRes.status, 200, 'Should update record');
    const updated = (await updateRes.json()).data;
    assert.equal(parseFloat(updated.starting_price), 28000);

    // 3d. Status toggle (Active / Publication Status)
    const patchRes = await fetch(`${BASE_URL}/admin/services/villas/${createdId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ is_active: false, status: 'ARCHIVED' }),
    });
    assert.equal(patchRes.status, 200);
    const patched = (await patchRes.json()).data;
    assert.equal(patched.is_active, false);

    // 3e. Delete record
    const delRes = await fetch(`${BASE_URL}/admin/services/villas/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.equal(delRes.status, 200);
    const delBody = await delRes.json();
    assert.equal(delBody.success, true);
  });

  test('4. Universal Service Management protects records with active bookings against deletion', async () => {
    // Find an item in booking_items that references flights
    const bookedFlight = await pool.query(
      `SELECT item_reference_id FROM booking_items WHERE item_type = 'FLIGHT' AND item_reference_id IS NOT NULL LIMIT 1`
    );

    if (bookedFlight.rows.length > 0) {
      const flightId = bookedFlight.rows[0].item_reference_id;
      const delRes = await fetch(`${BASE_URL}/admin/services/flights/${flightId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const delBody = await delRes.json();
      assert.equal(delBody.success, false, 'Deletion must be prevented due to dependent bookings');
      assert(delBody.message.includes('booking'), 'Message must explain dependency safeguard');
    }
  });

  test('5. Universal Import & Export Engine generates templates and exports', async () => {
    // 5a. Download template in CSV
    const csvTmplRes = await fetch(`${BASE_URL}/admin/io/insurance/template?format=csv`, {
      headers: authHeaders,
    });
    assert.equal(csvTmplRes.status, 200);
    assert(csvTmplRes.headers.get('content-type').includes('csv'));
    const csvContent = await csvTmplRes.text();
    assert(csvContent.includes('plan_code'));

    // 5b. Download template in XLSX
    const xlsxTmplRes = await fetch(`${BASE_URL}/admin/io/packages/template?format=xlsx`, {
      headers: authHeaders,
    });
    assert.equal(xlsxTmplRes.status, 200);
    assert(xlsxTmplRes.headers.get('content-type').includes('spreadsheetml'));

    // 5c. Export database records in CSV
    const expRes = await fetch(`${BASE_URL}/admin/io/airports/export?format=csv`, {
      headers: authHeaders,
    });
    assert.equal(expRes.status, 200);
    const expText = await expRes.text();
    assert(expText.includes('DEL') || expText.includes('BOM'), 'Export must contain airport records');
  });

  test('6. Universal Import Engine validates rows and records batch audit job', async () => {
    // 6a. Preview with valid and invalid rows
    const testRows = [
      {
        plan_code: 'TEST-PLAN-AUTO-01',
        plan_name: 'Automated Test Travel Guard',
        coverage_type: 'DOMESTIC',
        medical_coverage_limit: 1000000,
        daily_premium: 89,
        baggage_loss_limit: 25000,
        trip_cancellation_limit: 50000,
      },
      {
        plan_code: '', // Invalid: missing required code
        plan_name: 'Invalid Test Plan Missing Code',
        daily_premium: -10, // Invalid: negative
      }
    ];

    const previewRes = await fetch(`${BASE_URL}/admin/io/insurance/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ rows: testRows, file_name: 'test_plans.csv' }),
    });
    assert.equal(previewRes.status, 200);
    const previewData = (await previewRes.json()).data;

    assert.equal(previewData.total_rows, 2);
    assert.equal(previewData.valid_count, 1, 'Exactly 1 row must be valid');
    assert.equal(previewData.invalid_count, 1, 'Exactly 1 row must be invalid');

    // 6b. Import valid row
    const importRes = await fetch(`${BASE_URL}/admin/io/insurance/import`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ rows: previewData.valid_records, file_name: 'test_plans.csv' }),
    });
    assert.equal(importRes.status, 200);
    const importData = (await importRes.json()).data;
    assert.equal(importData.imported_count, 1);
    assert(importData.job_id, 'Import must return job ID');

    // 6c. Verify recorded in import_jobs history
    const histRes = await fetch(`${BASE_URL}/admin/io/history`, {
      headers: authHeaders,
    });
    assert.equal(histRes.status, 200);
    const histJobs = (await histRes.json()).data;
    assert(histJobs.some(j => j.id === importData.job_id), 'Job must appear in import history');

    // Cleanup imported test plan
    await pool.query("DELETE FROM travel_insurance_plans WHERE plan_code = 'TEST-PLAN-AUTO-01'");
  });

  test('7. Customer Management and Account Suspension operates with audit logging', async () => {
    // 7a. Get customer list
    const custRes = await fetch(`${BASE_URL}/admin/customers`, {
      headers: authHeaders,
    });
    assert.equal(custRes.status, 200);
    const customers = (await custRes.json()).data;
    assert(customers.length > 0, 'Must have customers');
    const targetCustomer = customers[0];

    // 7b. Suspend customer with audit reason
    const suspRes = await fetch(`${BASE_URL}/admin/customers/${targetCustomer.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        is_active: false,
        reason: 'Automated test suspension for administrative compliance verification',
      }),
    });
    assert.equal(suspRes.status, 200);

    // Verify audit log entry
    const auditRes = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE entity_id = $1 AND (action = 'UPDATE' OR action = 'CUSTOMER_STATUS_CHANGE')
       ORDER BY created_at DESC LIMIT 1`,
      [targetCustomer.id]
    );
    assert.equal(auditRes.rows.length, 1);
    assert.equal(auditRes.rows[0].reason, 'Automated test suspension for administrative compliance verification');

    // Reactivate customer
    await fetch(`${BASE_URL}/admin/customers/${targetCustomer.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        is_active: true,
        reason: 'Reactivated following automated test verification',
      }),
    });
  });

  test('8. RBAC Role Listing and Role Assignment persists to database', async () => {
    const rolesRes = await fetch(`${BASE_URL}/admin/roles`, {
      headers: authHeaders,
    });
    assert.equal(rolesRes.status, 200);
    const rolesBody = await rolesRes.json();
    assert.equal(rolesBody.success, true);
    assert(rolesBody.data.roles.includes('SUPER_ADMIN'));
    assert(rolesBody.data.roles.includes('OPERATIONS_ADMIN'));
    assert(rolesBody.data.roles.includes('INVENTORY_MANAGER'));
  });

});
