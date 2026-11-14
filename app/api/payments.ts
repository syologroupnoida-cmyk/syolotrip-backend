import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../db/index.js';
import { commitWalletReservation, evaluateAndAwardBookingCashback } from '../services/walletService.js';

const router = Router();

// POST /payments/demo
router.post('/demo', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { booking_id, amount, payment_method = 'DEMO_SIMULATION', reservation_id } = req.body;

    if (!booking_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'booking_id is required' });
    }

    const bRes = await client.query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
    if (bRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bRes.rows[0];
    const paymentRef = 'PAY-DEMO-' + uuidv4().substring(0, 8).toUpperCase();
    const serverVerifiedAmount = parseFloat(booking.total_amount);

    const paymentId = uuidv4();
    const payRes = await client.query(
      `INSERT INTO payments (id, booking_id, payment_reference, payment_method, amount, currency, status, is_demo, gateway_response)
       VALUES ($1, $2, $3, $4, $5, $6, 'SUCCESS', true, $7)
       RETURNING *`,
      [
        paymentId,
        booking.id,
        paymentRef,
        payment_method,
        serverVerifiedAmount,
        booking.currency,
        JSON.stringify({ simulated: true, authorized_at: new Date().toISOString() }),
      ]
    );

    // Commit any pending wallet reservation for this booking
    const targetReservationId = reservation_id;
    let resvQuery = targetReservationId
      ? 'SELECT id FROM wallet_reservations WHERE id = $1 AND status = \'PENDING\''
      : 'SELECT id FROM wallet_reservations WHERE booking_id = $1 AND status = \'PENDING\' LIMIT 1';
    const resvParams = targetReservationId ? [targetReservationId] : [booking.id];

    const pendingResv = await client.query(resvQuery, resvParams);
    if (pendingResv.rows.length > 0) {
      await commitWalletReservation({
        reservationId: pendingResv.rows[0].id,
        paymentId: payRes.rows[0].id,
        externalClient: client,
      });
    }

    await client.query(`UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW() WHERE id = $1`, [booking.id]);
    await client.query('COMMIT');

    // Auto-award cashback asynchronously
    evaluateAndAwardBookingCashback(booking.id).catch((e) => console.warn('Cashback error:', e));

    return res.json({
      success: true,
      message: 'Demo payment processed successfully. Booking confirmed.',
      data: {
        payment_id: payRes.rows[0].id,
        payment_reference: paymentRef,
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        status: 'SUCCESS',
        booking_status: 'CONFIRMED',
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// POST /payments/razorpay/order
router.post('/razorpay/order', async (req, res) => {
  try {
    const { booking_id } = req.body;
    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'booking_id is required' });
    }

    const bRes = await query('SELECT total_amount, currency FROM bookings WHERE id = $1', [booking_id]);
    if (bRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const serverAmount = parseFloat(bRes.rows[0].total_amount);
    const currency = bRes.rows[0].currency || 'INR';
    const fakeOrderId = 'order_' + Math.random().toString(36).substring(2, 12);

    return res.json({
      success: true,
      data: {
        order_id: fakeOrderId,
        amount: Math.round(serverAmount * 100), // integer paise
        currency,
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_mode',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /payments/razorpay/verify
router.post('/razorpay/verify', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { booking_id, razorpay_order_id, razorpay_payment_id, reservation_id } = req.body;

    if (!booking_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'booking_id is required' });
    }

    const bRes = await client.query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
    if (bRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bRes.rows[0];
    const paymentRef = razorpay_payment_id || 'RZP-' + uuidv4().slice(0, 8);

    const paymentId = uuidv4();
    const payRes = await client.query(
      `INSERT INTO payments (id, booking_id, payment_reference, payment_method, amount, currency, status, is_demo, gateway_response)
       VALUES ($1, $2, $3, 'RAZORPAY', $4, 'INR', 'SUCCESS', false, $5)
       RETURNING *`,
      [paymentId, booking.id, paymentRef, booking.total_amount, JSON.stringify({ razorpay_order_id })]
    );

    // Commit any pending wallet reservation
    const targetReservationId = reservation_id;
    let resvQuery = targetReservationId
      ? 'SELECT id FROM wallet_reservations WHERE id = $1 AND status = \'PENDING\''
      : 'SELECT id FROM wallet_reservations WHERE booking_id = $1 AND status = \'PENDING\' LIMIT 1';
    const resvParams = targetReservationId ? [targetReservationId] : [booking.id];

    const pendingResv = await client.query(resvQuery, resvParams);
    if (pendingResv.rows.length > 0) {
      await commitWalletReservation({
        reservationId: pendingResv.rows[0].id,
        paymentId: payRes.rows[0].id,
        externalClient: client,
      });
    }

    await client.query(`UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW() WHERE id = $1`, [booking.id]);
    await client.query('COMMIT');

    // Auto-award cashback asynchronously
    evaluateAndAwardBookingCashback(booking.id).catch((e) => console.warn('Cashback error:', e));

    return res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      data: { verified: true, booking_id: booking.id, payment_id: payRes.rows[0].id },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

export default router;

