import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:8000/api/v1';

test('SS Journey Vendor Onboarding, KYC & Property Approval System Tests', async (t) => {
  let adminToken = '';
  let vendorToken = '';
  let vendorId = '';
  let vendorUserId = '';
  let propertyId = '';

  const timestamp = Date.now();
  const testVendorEmail = `vendor_${timestamp}@example.com`;
  const testVendorPassword = 'VendorPassword@123';
  const testBusinessName = `Hilltop Haven Stays ${timestamp}`;

  // 1. Setup Admin Token
  await t.test('Admin authentication succeeds', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ssjourney.com', password: 'Admin@123456' }),
    });
    const json = await res.json();
    assert.equal(res.status, 200, 'Admin login should succeed');
    adminToken = json.data.tokens.accessToken || json.data.tokens.access_token;
    assert.ok(adminToken, 'Admin token should be present');
  });

  // 2. Public Basic Vendor Registration
  await t.test('Visitor can register as a property vendor without automatic KYC approval', async () => {
    const res = await fetch(`${BASE_URL}/vendor/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Rajesh Varma',
        business_name: testBusinessName,
        email: testVendorEmail,
        phone: '9876543210',
        password: testVendorPassword,
        property_type: 'Hotel',
        city: 'Manali',
        state: 'Himachal Pradesh',
        agree_terms: true,
      }),
    });
    const json = await res.json();
    if (res.status !== 201) {
      console.error('Registration failed with:', json);
    }
    assert.equal(res.status, 201, 'Registration should return 201');
    assert.equal(json.success, true);
    assert.equal(json.data.user.role, 'PARTNER');
    assert.equal(json.data.partner.kyc_status, 'KYC_INCOMPLETE');
    assert.equal(json.data.partner.is_verified, false);
    vendorId = json.data.partner.id;
    vendorUserId = json.data.user.id;
  });

  // 3. Vendor Login & Dashboard Retrieval
  await t.test('Vendor can log in and view onboarding checklist', async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testVendorEmail, password: testVendorPassword }),
    });
    const loginJson = await loginRes.json();
    assert.equal(loginRes.status, 200);
    vendorToken = loginJson.data.tokens.accessToken || loginJson.data.tokens.access_token;

    const dashRes = await fetch(`${BASE_URL}/vendor/dashboard`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const dashJson = await dashRes.json();
    assert.equal(dashRes.status, 200);
    assert.equal(dashJson.data.partner.propertyListingUnlocked, false, 'Property listing must be locked initially');
    assert.equal(dashJson.data.partner.kycStatus, 'KYC_INCOMPLETE');
    assert.ok(dashJson.data.onboardingChecklist.length >= 5);
  });

  // 4. Strict Security Gate: Property listing blocked before KYC approval
  await t.test('Property creation is strictly blocked before KYC approval (HTTP 403)', async () => {
    const res = await fetch(`${BASE_URL}/vendor/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        name: 'Premature Hotel Listing',
        property_type: 'HOTEL',
        address: 'Mall Road',
        city: 'Manali',
        overview: 'A luxury stay attempt before KYC.',
        featured_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        starting_price: 3500,
      }),
    });
    const json = await res.json();
    assert.equal(res.status, 403, 'Should reject property creation with HTTP 403 Forbidden');
    assert.match(json.message, /Property listing is locked/i);
  });

  // 5. Vendor submits KYC application with flexible document structure
  await t.test('Vendor can submit KYC application with masked documents', async () => {
    const dummyBase64 = Buffer.from('Mock PDF Content for Certificate of Incorporation').toString('base64');

    const res = await fetch(`${BASE_URL}/vendor/kyc/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        business_structure: 'SOLE_PROPRIETORSHIP',
        legal_business_name: testBusinessName,
        trade_name: 'Hilltop Stays',
        gstin: '02AAAAA0000A1Z5',
        pan_number: 'ABCDE1234F',
        registered_address: '12 Naggar Road, Prini',
        city: 'Manali',
        state: 'Himachal Pradesh',
        pincode: '175131',
        documents: [
          {
            section: 'IDENTITY',
            document_type: 'PAN_CARD',
            document_number_masked: 'XXXXX1234F',
            file_name: 'pan_card.pdf',
            mime_type: 'application/pdf',
            base64_data: dummyBase64,
          },
          {
            section: 'OWNERSHIP',
            document_type: 'ELECTRICITY_BILL',
            document_number_masked: 'EB-879812-XX',
            file_name: 'electricity_bill.pdf',
            mime_type: 'application/pdf',
            base64_data: dummyBase64,
          },
        ],
      }),
    });
    const json = await res.json();
    assert.equal(res.status, 201);
    assert.equal(json.data.application.status, 'PENDING_REVIEW');
    assert.equal(json.data.documents.length, 2);
  });

  // 6. Admin receives notification and inspects vendor application
  await t.test('Admin receives persistent notification and can view vendor application', async () => {
    const notifRes = await fetch(`${BASE_URL}/admin/vendors/system/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const notifJson = await notifRes.json();
    assert.equal(notifRes.status, 200);
    const kycNotif = notifJson.data.items.find((n) => n.vendor_id === vendorId);
    assert.ok(kycNotif, 'Admin notification should exist for the submitted KYC');

    const appRes = await fetch(`${BASE_URL}/admin/vendors/${vendorId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const appJson = await appRes.json();
    assert.equal(appRes.status, 200);
    assert.equal(appJson.data.vendor.kyc_status, 'KYC_SUBMITTED');
    assert.equal(appJson.data.documents.length, 2);
  });

  // 7. Admin approves vendor KYC
  await t.test('Admin can approve KYC and unlock property listing for vendor', async () => {
    const approveRes = await fetch(`${BASE_URL}/admin/vendors/${vendorId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        action: 'APPROVE',
        notes: 'Identity and electricity bill ownership verified.',
      }),
    });
    const approveJson = await approveRes.json();
    assert.equal(approveRes.status, 200);
    assert.equal(approveJson.success, true);

    // Vendor dashboard reflects unlocked property listing
    const dashRes = await fetch(`${BASE_URL}/vendor/dashboard`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const dashJson = await dashRes.json();
    assert.equal(dashJson.data.partner.propertyListingUnlocked, true, 'Property listing must be unlocked after approval');
    assert.equal(dashJson.data.partner.kycStatus, 'KYC_APPROVED');
  });

  // 8. KYC-Approved vendor creates and submits a property listing
  await t.test('KYC-approved vendor can create and submit property listing for admin review', async () => {
    const propRes = await fetch(`${BASE_URL}/vendor/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        name: `${testBusinessName} Resort & Spa`,
        property_type: 'HOTEL',
        star_rating: 4,
        address: 'Hadimba Temple Road',
        city: 'Manali',
        state: 'Himachal Pradesh',
        overview: 'Nestled amidst cedar pine forests, offering panoramic snow mountain views.',
        featured_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        starting_price: 4500,
        rooms: [
          {
            room_type: 'Deluxe Pine View Room',
            bed_type: 'King Bed',
            max_occupancy: 2,
            price_per_night: 4500,
            available_rooms: 10,
          },
        ],
      }),
    });
    const propJson = await propRes.json();
    assert.equal(propRes.status, 201);
    assert.equal(propJson.data.property.publication_status, 'SUBMITTED', 'Property should start in SUBMITTED status');
    propertyId = propJson.data.property.id;
  });

  // 9. Admin reviews and approves property listing
  await t.test('Admin reviews pending property approval queue and approves property listing', async () => {
    const pendingRes = await fetch(`${BASE_URL}/admin/vendors/properties/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingJson = await pendingRes.json();
    assert.equal(pendingRes.status, 200);
    const target = pendingJson.data.find((p) => p.id === propertyId);
    assert.ok(target, 'Submitted property must be in admin pending queue');

    const reviewRes = await fetch(`${BASE_URL}/admin/vendors/properties/${propertyId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'APPROVE' }),
    });
    const reviewJson = await reviewRes.json();
    assert.equal(reviewRes.status, 200);
    assert.equal(reviewJson.success, true);
  });

  // 10. Approved property appears in customer search
  await t.test('Approved property becomes live and bookable in public hotel search', async () => {
    const searchRes = await fetch(`${BASE_URL}/hotels?city=Manali`);
    const searchJson = await searchRes.json();
    assert.equal(searchRes.status, 200);
    const items = Array.isArray(searchJson.data) ? searchJson.data : (searchJson.data?.items || []);
    const found = items.find((h) => h.id === propertyId);
    assert.ok(found, 'Approved property must be returned in public customer search');
    assert.equal(found.publication_status, 'APPROVED');
  });
});
