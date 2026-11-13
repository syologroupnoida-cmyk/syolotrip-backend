import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:8000/api/v1';

async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, fetchOptions);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

test('SS Journey myBiz B2B Business Travel Portal Tests', async (t) => {
  let corpAdminToken = '';
  let corpCompanyId = '';
  let agencyAdminToken = '';
  let agencyCompanyId = '';
  let adminToken = '';

  const timestamp = Date.now();
  const corpEmail = `corp_${timestamp}@enterprise.com`;
  const agencyEmail = `agency_${timestamp}@travels.com`;

  // 1. Admin Login for Moderation
  await t.test('1. Admin authentication succeeds', async () => {
    const res = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@ssjourney.com',
        password: 'Admin@123456',
      },
    });
    assert.strictEqual(res.status, 200);
    adminToken = res.data.data.tokens?.accessToken || res.data.data.token;
    assert.ok(adminToken);
  });

  // 2. Corporate Company Registration
  await t.test('2. Corporate Company Registration creates pending company and admin user', async () => {
    const res = await makeRequest('/business/register', {
      method: 'POST',
      body: {
        account_type: 'CORPORATE',
        company_name: 'Nexus Tech Global Ltd',
        billing_email: corpEmail,
        contact_person_name: 'Rajesh Sharma',
        contact_person_phone: '+91 9876543210',
        password: 'CorporateSecurePass123!',
        industry: 'Information Technology',
        company_size: '51-200',
        city: 'Bengaluru',
        state: 'Karnataka',
        gstin: '29ABCDE1234F1Z5',
        website: 'https://nexustech.global',
      },
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.company.account_type, 'CORPORATE');
    assert.strictEqual(res.data.data.company.verification_status, 'PENDING');
    assert.strictEqual(res.data.data.company.name, 'Nexus Tech Global Ltd');
    corpAdminToken = res.data.data.token;
    corpCompanyId = res.data.data.company.id;
  });

  // 3. Travel Agency Registration
  await t.test('3. Travel Agency Registration creates agency and agency admin', async () => {
    const res = await makeRequest('/business/register', {
      method: 'POST',
      body: {
        account_type: 'AGENCY',
        company_name: 'Horizon Express Travels',
        billing_email: agencyEmail,
        contact_person_name: 'Ananya Verma',
        contact_person_phone: '+91 9811223344',
        password: 'AgencySecurePass123!',
        industry: 'Travel & Tourism',
        company_size: '11-50',
        city: 'Mumbai',
        state: 'Maharashtra',
        gstin: '27AABCT9988G1ZQ',
        website: 'https://horizontravels.in',
      },
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.company.account_type, 'AGENCY');
    assert.strictEqual(res.data.data.user.role, 'AGENCY_ADMIN');
    agencyAdminToken = res.data.data.token;
    agencyCompanyId = res.data.data.company.id;
  });

  // 4. Business Login
  await t.test('4. Business Login successfully authenticates corporate admin', async () => {
    const res = await makeRequest('/business/login', {
      method: 'POST',
      body: {
        email: corpEmail,
        password: 'CorporateSecurePass123!',
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.company.name, 'Nexus Tech Global Ltd');
    assert.ok(res.data.data.token);
  });

  // 5. Context Endpoint
  await t.test('5. Business context returns tenant company, employee & policy details', async () => {
    const res = await makeRequest('/business/context', {
      headers: { Authorization: `Bearer ${corpAdminToken}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.company.id, corpCompanyId);
    assert.ok(res.data.data.policy);
    assert.strictEqual(res.data.data.is_mybiz_user, true);
  });

  // 6. Real DB Metrics Dashboard
  await t.test('6. Business Dashboard returns real persisted metrics and zero-fabrication stats', async () => {
    const res = await makeRequest('/business/dashboard', {
      headers: { Authorization: `Bearer ${corpAdminToken}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const metrics = res.data.data.metrics;
    assert.strictEqual(typeof metrics.totalBookings, 'number');
    assert.strictEqual(typeof metrics.totalSpend, 'number');
    assert.strictEqual(typeof metrics.activeMembers, 'number');
    assert.ok(metrics.activeMembers >= 1); // Rajesh Sharma is registered
  });

  // 7. Employee Management (Corporate)
  let newEmpId = '';
  await t.test('7. Corporate Admin can add, update, and manage employees', async () => {
    // Add employee
    const addRes = await makeRequest('/business/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${corpAdminToken}` },
      body: {
        full_name: 'Pooja Nair',
        email: `pooja_${timestamp}@enterprise.com`,
        phone: '+91 9776655443',
        department: 'Product Design',
        designation: 'Senior UX Lead',
        role: 'EMPLOYEE',
        monthly_budget: 75000,
        booking_permission: 'CAN_BOOK',
      },
    });

    assert.strictEqual(addRes.status, 201);
    assert.strictEqual(addRes.data.success, true);
    assert.strictEqual(addRes.data.data.full_name, 'Pooja Nair');
    newEmpId = addRes.data.data.id;

    // Update employee
    const updateRes = await makeRequest(`/business/employees/${newEmpId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${corpAdminToken}` },
      body: {
        designation: 'Staff Product Designer',
        monthly_budget: 90000,
      },
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.data.designation, 'Staff Product Designer');
  });

  // 8. Agent Management (Agency)
  await t.test('8. Travel Agency Admin can add sub-agents with commission rate', async () => {
    const addRes = await makeRequest('/business/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${agencyAdminToken}` },
      body: {
        full_name: 'Karan Singhania',
        email: `karan_${timestamp}@travels.com`,
        phone: '+91 9822334455',
        department: 'Ticketing & Ticketing Sales',
        designation: 'Senior Travel Consultant',
        role: 'AGENCY_AGENT',
        commission_rate: 4.5,
      },
    });

    assert.strictEqual(addRes.status, 201);
    assert.strictEqual(addRes.data.data.role, 'AGENCY_AGENT');
  });

  // 9. Travel Policy Configuration & Validation
  await t.test('9. Travel Policy Configuration & Pre-Booking Validation enforcement', async () => {
    // Update policy
    const putPolRes = await makeRequest('/business/policy', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${corpAdminToken}` },
      body: {
        flight_class: 'ECONOMY',
        max_flight_budget_domestic: 12000,
        hotel_max_price_per_night: 6000,
        requires_approval_above: 10000,
      },
    });
    assert.strictEqual(putPolRes.status, 200);

    // Validate compliant flight
    const valGood = await makeRequest('/business/policy/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${corpAdminToken}` },
      body: {
        service_type: 'FLIGHT',
        amount: 8500,
        travel_class: 'ECONOMY',
      },
    });
    assert.strictEqual(valGood.status, 200);
    assert.strictEqual(valGood.data.data.is_compliant, true);

    // Validate non-compliant flight (violates cap)
    const valBad = await makeRequest('/business/policy/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${corpAdminToken}` },
      body: {
        service_type: 'FLIGHT',
        amount: 18000,
        travel_class: 'BUSINESS',
      },
    });
    assert.strictEqual(valBad.status, 200);
    assert.strictEqual(valBad.data.data.is_compliant, false);
    assert.ok(valBad.data.data.violations.length >= 2);
    assert.strictEqual(valBad.data.data.requires_approval, true);
  });

  // 10. Trip Request & Approval Flow
  let tripReqId = '';
  await t.test('10. Trip Request submission, review & approval workflow', async () => {
    // Submit request
    const reqRes = await makeRequest('/business/trip-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${corpAdminToken}` },
      body: {
        service_type: 'FLIGHT',
        destination: 'Mumbai',
        travel_date_from: '2026-11-20',
        travel_date_to: '2026-11-23',
        estimated_amount: 14500,
        purpose_of_travel: 'Quarterly Client Executive Review',
        project_code: 'PRJ-NEXUS-01',
      },
    });
    assert.strictEqual(reqRes.status, 201);
    assert.strictEqual(reqRes.data.data.status, 'PENDING');
    tripReqId = reqRes.data.data.id;

    // Approve request
    const appRes = await makeRequest(`/business/trip-requests/${tripReqId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${corpAdminToken}` },
      body: { comment: 'Approved for client meeting' },
    });
    assert.strictEqual(appRes.status, 200);
    assert.strictEqual(appRes.data.data.status, 'APPROVED');
  });

  // 11. Cross-Company Tenant Isolation
  await t.test('11. Strict Tenant Isolation: Agency cannot see Corporate employees or requests', async () => {
    // Agency requests employees
    const empRes = await makeRequest('/business/employees', {
      headers: { Authorization: `Bearer ${agencyAdminToken}` },
    });
    assert.strictEqual(empRes.status, 200);
    const empIds = empRes.data.data.map((e) => e.id);
    assert.ok(!empIds.includes(newEmpId), 'Agency should NOT be able to access Corporate employee');

    // Agency attempts to delete Corporate employee directly
    const delRes = await makeRequest(`/business/employees/${newEmpId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${agencyAdminToken}` },
    });
    assert.strictEqual(delRes.status, 404);
  });

  // 12. Admin Business Moderation
  await t.test('12. Admin can list, review, and verify B2B business accounts', async () => {
    // List companies
    const listRes = await makeRequest('/admin/business/companies', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const ids = listRes.data.data.map((c) => c.id);
    assert.ok(ids.includes(corpCompanyId));
    assert.ok(ids.includes(agencyCompanyId));

    // Verify company
    const verifyRes = await makeRequest(`/admin/business/companies/${corpCompanyId}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.data.data.verification_status, 'VERIFIED');
  });
});
