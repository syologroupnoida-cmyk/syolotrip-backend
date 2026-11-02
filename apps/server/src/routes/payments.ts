import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../db/index.js';

const router = Router();

// POST /payments/demo
router.post('/demo', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { booking_id, amount, payment_method = 'DEMO_SIMULATION' } = req.body;

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

    const payRes = await client.query(
      `INSERT INTO payments (booking_id, payment_reference, payment_method, amount, currency, status, is_demo, gateway_response)
       VALUES ($1, $2, $3, $4, $5, 'SUCCESS', true, $6)
       RETURNING *`,
      [
        booking.id,
        paymentRef,
        payment_method,
        amount || booking.total_amount,
        booking.currency,
        JSON.stringify({ simulated: true, authorized_at: new Date().toISOString() }),
      ]
    );

    await client.query(`UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW() WHERE id = $1`, [booking.id]);
    await client.query('COMMIT');

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
    const { booking_id, amount, currency = 'INR' } = req.body;
    const fakeOrderId = 'order_' + Math.random().toString(36).substring(2, 12);

    return res.json({
      success: true,
      data: {
        order_id: fakeOrderId,
        amount: Math.round((amount || 1000) * 100),
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
  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id } = req.body;
    if (booking_id) {
      await query(`UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW() WHERE id = $1`, [booking_id]);
      await query(
        `INSERT INTO payments (booking_id, payment_reference, payment_method, amount, currency, status, is_demo, gateway_response)
         VALUES ($1, $2, 'RAZORPAY', (SELECT total_amount FROM bookings WHERE id = $1), 'INR', 'SUCCESS', false, $3)`,
        [booking_id, razorpay_payment_id || 'RZP-' + uuidv4().slice(0, 8), JSON.stringify({ razorpay_order_id })]
      );
    }
    return res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      data: { verified: true, booking_id },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

