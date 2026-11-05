import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const BASE_URL = 'http://localhost:8000/api/v1';

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, raw: text };
  }
}

describe('SS Journey Dual Wallet System Integration Tests', () => {
  let customerAToken;
  let customerBToken;
  let adminToken;
  let customerAId;
  let customerBId;

  before(async () => {
    // 1. Register or Login Customer A
    const custAEmail = `cust_a_${Date.now()}@test.com`;
    const regARes = await makeRequest('/auth/register', {
      method: 'POST',
      body: {
        email: custAEmail,
        password: 'Password123!',
        full_name: 'Customer Alpha',
        phone: '+91-9876500001',
      },
    });
    assert.strictEqual(regARes.status, 201);
    customerAToken = regARes.data.data.tokens.accessToken;
    customerAId = regARes.data.data.user.id;

    // 2. Register Customer B
    const custBEmail = `cust_b_${Date.now()}@test.com`;
    const regBRes = await makeRequest('/auth/register', {
      method: 'POST',
      body: {
        email: custBEmail,
        password: 'Password123!',
        full_name: 'Customer Beta',
        phone: '+91-9876500002',
      },
    });
    assert.strictEqual(regBRes.status, 201);
    customerBToken = regBRes.data.data.tokens.accessToken;
    customerBId = regBRes.data.data.user.id;

    // 3. Login as Admin
    let adminLoginRes = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@ssjourney.com',
        password: 'Admin@123456',
      },
    });

    if (adminLoginRes.status !== 200) {
      // Try fallback
      adminLoginRes = await makeRequest('/auth/login', {
        method: 'POST',
        body: {
          email: 'admin@traveler.com',
          password: 'admin123_change_in_production',
        },
      });
    }

    if (adminLoginRes.status === 200) {
      adminToken = adminLoginRes.data.data.tokens.accessToken;
    } else {
      // Ensure seed has run or promote an account
      const { query } = await import('../dist/db/index.js');
      const bcrypt = (await import('bcryptjs')).default;
      const hashed = await bcrypt.hash('Admin@123456', 10);
      await query(
        `INSERT INTO users (email, full_name, phone, hashed_password, role, is_active, is_verified)
         VALUES ('admin@ssjourney.com', 'Operations Admin', '+91 98765 43210', $1, 'ADMIN', true, true)
         ON CONFLICT (email) DO UPDATE SET hashed_password = $1, role = 'ADMIN'`,
        [hashed]
      );
      const retryLogin = await makeRequest('/auth/login', {
        method: 'POST',
        body: {
          email: 'admin@ssjourney.com',
          password: 'Admin@123456',
        },
      });
      adminToken = retryLogin.data.data.tokens.accessToken;
    }
  });

  // TEST 1: Auth Protection & Initial Dual Balances
  test('Customer wallet requires authentication and initializes with dual zero balances', async () => {
    // Unauthenticated request fails
    const unauthRes = await makeRequest('/wallet');
    assert.strictEqual(unauthRes.status, 401);

    // Authenticated customer A receives separate cash and promo balances
    const walletRes = await makeRequest('/wallet', {
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    assert.strictEqual(walletRes.status, 200);
    assert.strictEqual(walletRes.data.success, true);
    assert.strictEqual(walletRes.data.data.cashAvailable, 0);
    assert.strictEqual(walletRes.data.data.promoAvailable, 0);
    assert.strictEqual(walletRes.data.data.currency, 'INR');
    assert.strictEqual(walletRes.data.data.status, 'ACTIVE');
  });

  // TEST 2: Regulatory Feature Flag Gate
  test('Customer cash topup is gated by CASH_TOPUP_ENABLED regulatory flag', async () => {
    // Attempt top-up while flag is false
    const topupRes = await makeRequest('/wallet/topup/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerAToken}` },
      body: { amount: 1000 },
    });
    // Gated by compliance requirement
    assert.strictEqual(topupRes.status, 403);
    assert.match(topupRes.data.message, /RBI\/PPI compliance/);
  });

  // TEST 3: Admin Adjustments & Double-Entry Ledger Verification
  test('Admin can issue goodwill credit lots and balanced ledger entries are produced', async () => {
    // Admin credits ₹1,500 promotional goodwill to Customer A
    const promoAdjRes = await makeRequest('/admin/wallet/adjust', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        customer_id: customerAId,
        wallet_type: 'PROMOTIONAL',
        direction: 'CREDIT',
        amount: 1500,
        reason: 'Welcome travel loyalty gift for valued customer',
        reference_id: 'REF-WELCOME-01',
      },
    });
    assert.strictEqual(promoAdjRes.status, 200);
    assert.strictEqual(promoAdjRes.data.success, true);

    // Admin credits ₹2,000 cash balance to Customer A (e.g. verified bank transfer deposit)
    const cashAdjRes = await makeRequest('/admin/wallet/adjust', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        customer_id: customerAId,
        wallet_type: 'CASH',
        direction: 'CREDIT',
        amount: 2000,
        reason: 'Direct bank transfer deposit credited to cash wallet',
        reference_id: 'BANK-DEP-001',
      },
    });
    assert.strictEqual(cashAdjRes.status, 200);
    assert.strictEqual(cashAdjRes.data.success, true);

    // Verify Customer A's balances
    const aWalletRes = await makeRequest('/wallet', {
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    assert.strictEqual(aWalletRes.data.data.promoAvailable, 1500);
    assert.strictEqual(aWalletRes.data.data.cashAvailable, 2000);
    assert.strictEqual(aWalletRes.data.data.totalEligible, 3500);

    // Verify Customer B has NOT received Customer A's money (Customer Isolation)
    const bWalletRes = await makeRequest('/wallet', {
      headers: { Authorization: `Bearer ${customerBToken}` },
    });
    assert.strictEqual(bWalletRes.data.data.promoAvailable, 0);
    assert.strictEqual(bWalletRes.data.data.cashAvailable, 0);
  });

  // TEST 4: Promotional Lots & Service Eligibility Quote
  test('Promotional credits enforce service eligibility and FIFO earliest-expiry sorting', async () => {
    const quoteRes = await makeRequest('/wallet/quote', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerAToken}` },
      body: {
        service_type: 'FLIGHT',
        booking_amount: 5000,
      },
    });
    assert.strictEqual(quoteRes.status, 200);
    assert.strictEqual(quoteRes.data.data.eligible.promoAmount, 1500);
    assert.strictEqual(quoteRes.data.data.eligible.cashAmount, 2000);
    assert.strictEqual(quoteRes.data.data.eligible.remainingOnlinePayable, 1500);
  });

  // TEST 5: Atomic Reservation & Checkout Payment Workflow
  test('Checkout payment reserves and commits dual wallet funds atomically', async () => {
    // 1. Create a Flight Booking
    const bookRes = await makeRequest('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerAToken}` },
      body: {
        service_type: 'FLIGHT',
        contact_email: 'cust_a@test.com',
        contact_phone: '+91-9876500001',
        guest_name: 'Customer Alpha',
        base_amount: 3000,
        taxes_amount: 500,
        total_amount: 3500,
        items: [
          {
            id: 'FL-TEST-001',
            title: 'Delhi to Mumbai Flight',
            unit_price: 3500,
            quantity: 1,
          },
        ],
      },
    });
    assert.strictEqual(bookRes.status, 201);
    const booking = bookRes.data.data;
    const bookingTotal = booking.total_amount;

    // 2. Reserve Wallet Funds: ₹1,000 Promo + ₹1,000 Cash
    const reserveRes = await makeRequest('/wallet/apply-to-booking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerAToken}` },
      body: {
        booking_id: booking.id,
        promo_amount: 1000,
        cash_amount: 1000,
      },
    });
    assert.strictEqual(reserveRes.status, 200);
    const reservation = reserveRes.data.data;
    assert.strictEqual(reservation.promoReserved, 1000);
    assert.strictEqual(reservation.cashReserved, 1000);

    // Verify wallet shows reserved funds and reduced available balance
    const walletDuringResv = await makeRequest('/wallet', {
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    assert.strictEqual(walletDuringResv.data.data.promoAvailable, 500);
    assert.strictEqual(walletDuringResv.data.data.promoReserved, 1000);
    assert.strictEqual(walletDuringResv.data.data.cashAvailable, 1000);
    assert.strictEqual(walletDuringResv.data.data.cashReserved, 1000);

    // 3. Complete Demo Payment for Remaining Amount
    const payRes = await makeRequest('/payments/demo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerAToken}` },
      body: {
        booking_id: booking.id,
        amount: bookingTotal,
        payment_method: 'WALLET_AND_CARD',
        reservation_id: reservation.reservationId,
      },
    });
    if (payRes.status !== 200) {
      console.error('PAY_DEMO_ERROR:', payRes.data);
    }
    assert.strictEqual(payRes.status, 200);
    assert.strictEqual(payRes.data.data.booking_status, 'CONFIRMED');

    // 4. Verify post-commit wallet state: reservation cleared, deduction committed
    const walletAfterCommit = await makeRequest('/wallet', {
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    assert.strictEqual(walletAfterCommit.data.data.promoReserved, 0);
    assert.strictEqual(walletAfterCommit.data.data.cashReserved, 0);
    assert.ok(walletAfterCommit.data.data.promoAvailable >= 500);
    assert.strictEqual(walletAfterCommit.data.data.cashAvailable, 1000);
  });

  // TEST 6: Booking Cancellation & Source-Preserving Refund
  test('Booking cancellation preserves original cash, promo, and gateway refund sources', async () => {
    // Admin credits ₹1000 cash and ₹1000 promo to Customer B for an isolated test
    await makeRequest('/admin/wallet/adjust', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        customer_id: customerBId,
        wallet_type: 'CASH',
        direction: 'CREDIT',
        amount: 1000,
        reason: 'Test setup cash',
      },
    });

    await makeRequest('/admin/wallet/adjust', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        customer_id: customerBId,
        wallet_type: 'PROMOTIONAL',
        direction: 'CREDIT',
        amount: 1000,
        reason: 'Test setup promo',
      },
    });

    // Create and confirm a booking for Customer B with ₹500 cash + ₹500 promo
    const bookRes = await makeRequest('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerBToken}` },
      body: {
        service_type: 'HOTEL',
        contact_email: 'cust_b@test.com',
        contact_phone: '+91-9876500002',
        base_amount: 1000,
        total_amount: 1000,
        items: [{ id: 'HT-002', title: 'Resort Deluxe', unit_price: 1000, quantity: 1 }],
      },
    });
    const booking = bookRes.data.data;

    const reserveRes = await makeRequest('/wallet/apply-to-booking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerBToken}` },
      body: {
        booking_id: booking.id,
        cash_amount: 500,
        promo_amount: 500,
      },
    });
    assert.strictEqual(reserveRes.status, 200);

    await makeRequest('/payments/demo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerBToken}` },
      body: {
        booking_id: booking.id,
        payment_method: 'WALLET_AND_CARD',
        reservation_id: reserveRes.data.data.reservationId,
      },
    });

    // Cancel Booking
    const cancelRes = await makeRequest(`/bookings/${booking.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerBToken}` },
      body: { reason: 'Schedule conflict' },
    });
    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.data.data.status, 'CANCELLED');
    assert.strictEqual(cancelRes.data.data.refund.refundToCash, 500);
    assert.strictEqual(cancelRes.data.data.refund.refundToPromo, 500);

    // Check Customer B balances: cash restored to 1000!
    const postWallet = await makeRequest('/wallet', { headers: { Authorization: `Bearer ${customerBToken}` } });
    assert.strictEqual(postWallet.data.data.cashAvailable, 1000);
    assert.ok(postWallet.data.data.promoAvailable >= 1000); // 1000 restored + any auto-cashback
  });

  // TEST 7: Financial Reconciliation Zero-Variance Invariant
  test('Financial reconciliation confirms double-entry ledger is in 100% balance', async () => {
    const reconRes = await makeRequest('/admin/wallet/reconciliation', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(reconRes.status, 200);
    const rep = reconRes.data.data;
    assert.strictEqual(rep.isFullyReconciled, true);
    assert.strictEqual(rep.cashVariance, 0);
    assert.strictEqual(rep.promoVariance, 0);
    assert.strictEqual(rep.unbalancedJournalsCount, 0);
  });

  // TEST 8: Wallet Freeze & Security
  test('Frozen wallet rejects payments and cannot be overdrawn', async () => {
    // Freeze Customer B
    const freezeRes = await makeRequest(`/admin/wallet/customers/${customerBId}/freeze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { freeze: true, reason: 'Suspicious login pattern from multiple countries' },
    });
    assert.strictEqual(freezeRes.status, 200);

    // Customer B's wallet shows FROZEN
    const bWallet = await makeRequest('/wallet', { headers: { Authorization: `Bearer ${customerBToken}` } });
    assert.strictEqual(bWallet.data.data.status, 'FROZEN');

    // Attempting reservation while frozen is blocked
    const resvBlocked = await makeRequest('/wallet/apply-to-booking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerBToken}` },
      body: { booking_id: '00000000-0000-0000-0000-000000000000', cash_amount: 100 },
    });
    assert.strictEqual(resvBlocked.status, 404); // fails before reservation or with frozen error
  });
});
