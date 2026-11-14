import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import {
  getWalletBalances,
  getEligiblePromotionalCredits,
  reserveWalletFunds,
  releaseWalletReservation,
  creditCashTopup,
  isFeatureEnabled,
} from '../services/walletService.js';

const router = Router();

// All customer wallet endpoints require active authentication
router.use(authenticateToken);

// ==========================================
// 1. GET /api/v1/wallet — Current Balances
// ==========================================
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = req.user!.id;
    const balances = await getWalletBalances(customerId);
    const isTopupEnabled = await isFeatureEnabled('CASH_TOPUP_ENABLED', false);
    const isPromoEnabled = await isFeatureEnabled('PROMOTIONAL_WALLET_ENABLED', true);

    return res.json({
      success: true,
      data: {
        ...balances,
        features: {
          cashTopupEnabled: isTopupEnabled,
          promotionalEnabled: isPromoEnabled,
          withdrawalEnabled: false,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. GET /api/v1/wallet/summary — Quick Stats & Expiring Lots
// ==========================================
router.get('/summary', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = req.user!.id;
    const balances = await getWalletBalances(customerId);

    // Sum total credited & redeemed
    const totalsRes = await query(
      `SELECT 
         COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END), 0) as total_credited,
         COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END), 0) as total_redeemed
       FROM wallet_transactions
       WHERE customer_id = $1 AND status = 'COMPLETED'`,
      [customerId]
    );

    // Expiring soon promotional credits (within 30 days)
    const expiringRes = await query(
      `SELECT COALESCE(SUM(remaining_amount), 0) as expiring_soon,
              MIN(expiry_date) as nearest_expiry
       FROM promotional_credit_lots
       WHERE customer_id = $1
         AND status = 'ACTIVE'
         AND remaining_amount > 0
         AND expiry_date > NOW()
         AND expiry_date <= (NOW() + INTERVAL '30 days')`,
      [customerId]
    );

    // Recent 5 transactions
    const recentRes = await query(
      `SELECT * FROM wallet_transactions
       WHERE customer_id = $1
       ORDER BY created_at DESC LIMIT 5`,
      [customerId]
    );

    return res.json({
      success: true,
      data: {
        balances,
        totalCredited: parseFloat(totalsRes.rows[0].total_credited || 0),
        totalRedeemed: parseFloat(totalsRes.rows[0].total_redeemed || 0),
        expiringSoonAmount: parseFloat(expiringRes.rows[0].expiring_soon || 0),
        nearestExpiryDate: expiringRes.rows[0].nearest_expiry || null,
        recentTransactions: recentRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. GET /api/v1/wallet/transactions — Paginated History
// ==========================================
router.get('/transactions', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '15', 10)));
    const offset = (page - 1) * limit;

    const { wallet_type, direction, status, transaction_type, start_date, end_date } = req.query;

    const conditions: string[] = ['customer_id = $1'];
    const values: any[] = [customerId];
    let idx = 2;

    if (wallet_type) {
      conditions.push(`wallet_type = $${idx++}`);
      values.push(String(wallet_type).toUpperCase());
    }
    if (direction) {
      conditions.push(`direction = $${idx++}`);
      values.push(String(direction).toUpperCase());
    }
    if (status) {
      conditions.push(`status = $${idx++}`);
      values.push(String(status).toUpperCase());
    }
    if (transaction_type) {
      conditions.push(`transaction_type = $${idx++}`);
      values.push(String(transaction_type));
    }
    if (start_date) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(start_date);
    }
    if (end_date) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(end_date);
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(`SELECT COUNT(*) as total FROM wallet_transactions WHERE ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total || '0', 10);

    const dataRes = await query(
      `SELECT * FROM wallet_transactions
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]
    );

    return res.json({
      success: true,
      data: {
        items: dataRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. GET /api/v1/wallet/transactions/:id — Transaction Details
// ==========================================
router.get('/transactions/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = req.user!.id;
    const txRes = await query(
      `SELECT * FROM wallet_transactions WHERE id = $1 AND customer_id = $2`,
      [req.params.id, customerId]
    );

    if (txRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
    }

    return res.json({
      success: true,
      data: txRes.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. GET /api/v1/wallet/promotional-lots — Customer Active Credit Lots
// ==========================================
router.get('/promotional-lots', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = req.user!.id;
    const lotsRes = await query(
      `SELECT id, lot_reference, reward_source, original_amount, remaining_amount,
              currency, applicable_services, min_booking_amount, max_usable_amount,
              issue_date, expiry_date, status
       FROM promotional_credit_lots
       WHERE customer_id = $1 AND status = 'ACTIVE' AND remaining_amount > 0 AND expiry_date > NOW()
       ORDER BY expiry_date ASC`,
      [customerId]
    );

    return res.json({
      success: true,
      data: lotsRes.rows,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. POST /api/v1/wallet/quote — Calculate Eligible Wallet Deduction for Checkout
// ==========================================
router.post('/quote', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = req.user!.id;
    const { service_type, booking_amount } = req.body;

    if (!service_type || !booking_amount || parseFloat(booking_amount) <= 0) {
      return res.status(400).json({ success: false, message: 'service_type and positive booking_amount are required' });
    }

    const normService = String(service_type).toUpperCase();
    const amount = parseFloat(booking_amount);

    const balances = await getWalletBalances(customerId);
    const isPromoEnabled = await isFeatureEnabled('PROMOTIONAL_WALLET_ENABLED', true);

    let eligiblePromo = 0;
    let promoLotsCount = 0;

    if (isPromoEnabled && balances.promoAvailable > 0) {
      const client = await query(
        `SELECT * FROM promotional_credit_lots
         WHERE customer_id = $1 AND status = 'ACTIVE' AND remaining_amount > 0 AND expiry_date > NOW()
           AND (min_booking_amount <= $2 OR min_booking_amount IS NULL)
         ORDER BY expiry_date ASC`,
        [customerId, amount]
      );

      for (const lot of client.rows) {
        let services: string[] = [];
        if (typeof lot.applicable_services === 'string') {
          try { services = JSON.parse(lot.applicable_services); } catch (e) { services = []; }
        } else if (Array.isArray(lot.applicable_services)) {
          services = lot.applicable_services;
        }

        if (services.length === 0 || services.includes(normService) || services.includes('ALL')) {
          let cap = parseFloat(lot.remaining_amount);
          if (lot.max_usable_amount) {
            cap = Math.min(cap, parseFloat(lot.max_usable_amount));
          }
          eligiblePromo += cap;
          promoLotsCount++;
        }
      }
    }

    // Capped by booking amount
    eligiblePromo = Math.min(eligiblePromo, balances.promoAvailable, amount);
    const remainingAfterPromo = Math.max(0, amount - eligiblePromo);
    const eligibleCash = Math.min(balances.cashAvailable, remainingAfterPromo);
    const finalOnlinePayable = Math.max(0, amount - (eligiblePromo + eligibleCash));

    return res.json({
      success: true,
      data: {
        bookingAmount: amount,
        serviceType: normService,
        walletStatus: balances.status,
        balances: {
          cashAvailable: balances.cashAvailable,
          promoAvailable: balances.promoAvailable,
        },
        eligible: {
          promoAmount: Math.round(eligiblePromo * 100) / 100,
          cashAmount: Math.round(eligibleCash * 100) / 100,
          totalWalletEligible: Math.round((eligiblePromo + eligibleCash) * 100) / 100,
          remainingOnlinePayable: Math.round(finalOnlinePayable * 100) / 100,
          promoLotsCount,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. POST /api/v1/wallet/apply-to-booking — Reserve Funds for Checkout
// ==========================================
router.post('/apply-to-booking', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = req.user!.id;
    const { booking_id, cash_amount = 0, promo_amount = 0 } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'booking_id is required' });
    }

    const bRes = await query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
    if (bRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bRes.rows[0];
    if (booking.user_id && booking.user_id !== customerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to booking' });
    }

    const bookingAmount = parseFloat(booking.total_amount);
    const serviceType = booking.service_type;

    const reservation = await reserveWalletFunds({
      customerId,
      bookingId: booking.id,
      cashRequested: parseFloat(cash_amount || 0),
      promoRequested: parseFloat(promo_amount || 0),
      serviceType,
      bookingAmount,
    });

    return res.json({
      success: true,
      message: 'Wallet funds reserved successfully for checkout',
      data: reservation,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 8. POST /api/v1/wallet/release-reservation — Release Reserved Funds
// ==========================================
router.post('/release-reservation', async (req: AuthenticatedRequest, res) => {
  try {
    const { reservation_id, reason } = req.body;
    if (!reservation_id) {
      return res.status(400).json({ success: false, message: 'reservation_id is required' });
    }

    await releaseWalletReservation({
      reservationId: reservation_id,
      reason: reason || 'User checkout cancellation',
    });

    return res.json({
      success: true,
      message: 'Wallet reservation released successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 9. POST /api/v1/wallet/topup/orders — Razorpay Top-Up Order Creation
// ==========================================
router.post('/topup/orders', async (req: AuthenticatedRequest, res) => {
  try {
    const isTopupEnabled = await isFeatureEnabled('CASH_TOPUP_ENABLED', false);
    if (!isTopupEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Direct customer cash top-up is currently disabled pending Indian RBI/PPI compliance approvals.',
      });
    }

    const { amount } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 100 || numAmount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Top-up amount must be between ₹100 and ₹50,000 per transaction',
      });
    }

    const orderId = 'order_topup_' + Math.random().toString(36).substring(2, 12);
    return res.json({
      success: true,
      data: {
        orderId,
        amount: Math.round(numAmount * 100), // paise
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_mode',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 10. POST /api/v1/wallet/topup/verify — Razorpay Top-Up Verification
// ==========================================
router.post('/topup/verify', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = req.user!.id;
    const { amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid top-up amount is required' });
    }

    // Signature verification if secret configured
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    const tx = await creditCashTopup({
      customerId,
      amount: numAmount,
      razorpayPaymentId: razorpay_payment_id || 'RZP-' + Math.random().toString(36).slice(2, 8),
      idempotencyKey: `TOPUP-${razorpay_payment_id || razorpay_order_id || Date.now()}`,
    });

    return res.json({
      success: true,
      message: 'Cash wallet topped up successfully',
      data: tx,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

