import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:8000/api/v1';

async function registerTestUser(email, fullName = 'Test Customer', phone = '+91 9988776655') {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'Password@1234',
      full_name: fullName,
      phone,
    }),
  });
  const json = await res.json();
  if (!json.success && json.message?.includes('already registered')) {
    // login instead
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password@1234' }),
    });
    const loginJson = await loginRes.json();
    return loginJson.data;
  }
  return json.data;
}

test('Customer Dashboard System - Auth Protection Guard', async () => {
  // 1. Unauthenticated requests to customer endpoints must fail with 401
  const endpoints = [
    '/customer/dashboard-summary',
    '/customer/profile',
    '/customer/travellers',
    '/customer/payments',
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${BASE_URL}${ep}`);
    assert.strictEqual(res.status, 401, `Endpoint ${ep} should require authentication`);
    const json = await res.json();
    assert.strictEqual(json.success, false);
  }
});

test('Customer Dashboard System - Profile Retrieval and Updating', async () => {
  const timestamp = Date.now();
  const testEmail = `cust_prof_${timestamp}@testjourney.com`;
  const authData = await registerTestUser(testEmail, 'Amitabh Bachan');
  const token = authData.tokens.accessToken;

  // 1. Get initial profile
  const profRes = await fetch(`${BASE_URL}/customer/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(profRes.status, 200);
  const profJson = await profRes.json();
  assert.strictEqual(profJson.success, true);
  assert.strictEqual(profJson.data.fullName, 'Amitabh Bachan');
  assert.strictEqual(profJson.data.email, testEmail);

  // 2. Update profile
  const updateRes = await fetch(`${BASE_URL}/customer/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName: 'Amitabh Harivansh Bachan',
      phone: '+91 98200 11223',
      gender: 'MALE',
      dateOfBirth: '1942-10-11',
      address: 'Jalsa, Juhu Beach Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400049',
      emergencyContactName: 'Jaya Bachan',
      emergencyContactPhone: '+91 98200 99887',
    }),
  });
  assert.strictEqual(updateRes.status, 200);
  const updateJson = await updateRes.json();
  assert.strictEqual(updateJson.success, true);
  assert.strictEqual(updateJson.data.fullName, 'Amitabh Harivansh Bachan');
  assert.strictEqual(updateJson.data.city, 'Mumbai');
  assert.strictEqual(updateJson.data.pincode, '400049');
  assert.strictEqual(updateJson.data.emergencyContactName, 'Jaya Bachan');
});

test('Customer Dashboard System - Dashboard Summary Metrics & Profile Completion', async () => {
  const timestamp = Date.now();
  const testEmail = `cust_sum_${timestamp}@testjourney.com`;
  const authData = await registerTestUser(testEmail, 'Pooja Hegde');
  const token = authData.tokens.accessToken;

  const sumRes = await fetch(`${BASE_URL}/customer/dashboard-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(sumRes.status, 200);
  const sumJson = await sumRes.json();
  assert.strictEqual(sumJson.success, true);

  const { metrics, profile, upcomingTrip, recentBookings } = sumJson.data;
  assert.ok(metrics !== undefined);
  assert.strictEqual(typeof metrics.totalBookings, 'number');
  assert.strictEqual(typeof metrics.upcomingTrips, 'number');
  assert.strictEqual(typeof metrics.profileCompletionPercent, 'number');
  assert.ok(metrics.profileCompletionPercent >= 0 && metrics.profileCompletionPercent <= 100);
  assert.strictEqual(profile.email, testEmail);
  assert.ok(Array.isArray(recentBookings));
});

test('Customer Dashboard System - Saved Travellers CRUD with Strict Ownership Guard', async () => {
  const timestamp = Date.now();
  const customerA = await registerTestUser(`cust_a_${timestamp}@testjourney.com`, 'Customer A');
  const customerB = await registerTestUser(`cust_b_${timestamp}@testjourney.com`, 'Customer B');

  const tokenA = customerA.tokens.accessToken;
  const tokenB = customerB.tokens.accessToken;

  // 1. Customer A adds a traveller
  const addRes = await fetch(`${BASE_URL}/customer/travellers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Ms',
      firstName: 'Kareena',
      lastName: 'Kapoor',
      gender: 'FEMALE',
      passengerType: 'ADULT',
      phone: '+91 98111 44556',
      email: 'kareena@kapoor.com',
      passportNumber: 'Z9876543',
      nationality: 'Indian',
      mealPreference: 'Veg',
      seatPreference: 'Window',
    }),
  });
  assert.strictEqual(addRes.status, 201);
  const addJson = await addRes.json();
  assert.strictEqual(addJson.success, true);
  const travellerId = addJson.data.id;
  assert.strictEqual(addJson.data.firstName, 'Kareena');
  assert.strictEqual(addJson.data.lastName, 'Kapoor');
  assert.strictEqual(addJson.data.fullName, 'Ms Kareena Kapoor');

  // 2. Customer A lists travellers
  const listARes = await fetch(`${BASE_URL}/customer/travellers`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const listAJson = await listARes.json();
  assert.strictEqual(listAJson.success, true);
  assert.ok(listAJson.data.some((t) => t.id === travellerId));

  // 3. Customer B CANNOT see Customer A's traveller (Ownership isolation)
  const listBRes = await fetch(`${BASE_URL}/customer/travellers`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const listBJson = await listBRes.json();
  assert.strictEqual(listBJson.success, true);
  assert.ok(!listBJson.data.some((t) => t.id === travellerId));

  // 4. Customer B CANNOT edit or delete Customer A's traveller
  const evilEditRes = await fetch(`${BASE_URL}/customer/travellers/${travellerId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${tokenB}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ firstName: 'Hacked' }),
  });
  assert.strictEqual(evilEditRes.status, 404);

  const evilDeleteRes = await fetch(`${BASE_URL}/customer/travellers/${travellerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(evilDeleteRes.status, 404);

  // 5. Customer A successfully updates the traveller
  const updateRes = await fetch(`${BASE_URL}/customer/travellers/${travellerId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      seatPreference: 'Aisle',
      mealPreference: 'Jain Special',
    }),
  });
  assert.strictEqual(updateRes.status, 200);
  const updateJson = await updateRes.json();
  assert.strictEqual(updateJson.data.seatPreference, 'Aisle');

  // 6. Customer A deletes the traveller
  const delRes = await fetch(`${BASE_URL}/customer/travellers/${travellerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(delRes.status, 200);

  // Verify it is gone
  const verifyList = await fetch(`${BASE_URL}/customer/travellers`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const verifyJson = await verifyList.json();
  assert.ok(!verifyJson.data.some((t) => t.id === travellerId));
});

test('Customer Dashboard System - Payment History Retrieval', async () => {
  const timestamp = Date.now();
  const authData = await registerTestUser(`cust_pay_${timestamp}@testjourney.com`, 'Rohan Roy');
  const token = authData.tokens.accessToken;

  const payRes = await fetch(`${BASE_URL}/customer/payments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(payRes.status, 200);
  const payJson = await payRes.json();
  assert.strictEqual(payJson.success, true);
  assert.ok(Array.isArray(payJson.data));
});

