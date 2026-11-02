import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../db/index.js';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /bookings
router.post('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      service_type,
      contact_email,
      contact_phone,
      guest_name,
      check_in_date,
      check_out_date,
      base_amount,
      taxes_amount = 0,
      discount_amount = 0,
      total_amount,
      currency = 'INR',
      items = [],
      passengers = [],
      details_snapshot = {},
    } = req.body;

    if (!service_type || !contact_email || !contact_phone) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Missing required booking fields' });
    }

    const bookingRef = 'SS-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
    const userId = req.user ? req.user.id : null;
    const cancellationToken = uuidv4();

    const bookingRes = await client.query(
      `INSERT INTO bookings (
        booking_reference, user_id, service_type, status, provider, is_simulated,
        guest_name, contact_email, contact_phone, check_in_date, check_out_date,
        cancellation_token, base_amount, taxes_amount, discount_amount, total_amount,
        currency, details_snapshot
      ) VALUES ($1, $2, $3, 'PENDING', 'SIMULATED_SS_JOURNEY', true, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        bookingRef,
        userId,
        service_type.toUpperCase(),
        guest_name || (passengers[0] ? `${passengers[0].first_name} ${passengers[0].last_name}` : 'Valued Guest'),
        contact_email,
        contact_phone,
        check_in_date || null,
        check_out_date || null,
        cancellationToken,
        base_amount || total_amount,
        taxes_amount,
        discount_amount,
        total_amount,
        currency,
        JSON.stringify(details_snapshot),
      ]
    );

    const booking = bookingRes.rows[0];

    // Insert items
    for (const item of items) {
      await client.query(
        `INSERT INTO booking_items (
          booking_id, item_type, item_reference_id, title, quantity, hotel_id, room_id,
          check_in_date, check_out_date, unit_price, total_price, meta_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          booking.id,
          item.item_type || service_type,
          item.item_reference_id || item.id || 'N/A',
          item.title || 'Travel Item',
          item.quantity || 1,
          item.hotel_id || null,
          item.room_id || null,
          item.check_in_date || check_in_date || null,
          item.check_out_date || check_out_date || null,
          item.unit_price || total_amount,
          item.total_price || total_amount,
          JSON.stringify(item.meta_data || {}),
        ]
      );
    }

    // Insert passengers
    for (const p of passengers) {
      await client.query(
        `INSERT INTO passengers (
          booking_id, title, first_name, last_name, passenger_type, gender,
          date_of_birth, passport_number, seat_preference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          booking.id,
          p.title || 'Mr',
          p.first_name,
          p.last_name,
          p.passenger_type || 'ADULT',
          p.gender || 'MALE',
          p.date_of_birth || null,
          p.passport_number || null,
          p.seat_preference || null,
        ]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: booking.id,
        booking_reference: booking.booking_reference,
        bookingReference: booking.booking_reference,
        status: booking.status,
        service_type: booking.service_type,
        serviceType: booking.service_type,
        total_amount: parseFloat(booking.total_amount),
        priceBreakdown: {
          baseAmount: parseFloat(booking.base_amount),
          taxesAndFees: parseFloat(booking.taxes_amount),
          discountAmount: parseFloat(booking.discount_amount),
          totalAmount: parseFloat(booking.total_amount),
          currency: booking.currency,
        },
        contact_email: booking.contact_email,
        contact_phone: booking.contact_phone,
        cancellation_token: booking.cancellation_token,
        created_at: booking.created_at,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET /bookings/my-trips
router.get('/my-trips', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const bookingsRes = await query(
      `SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );

    const results = [];
    for (const b of bookingsRes.rows) {
      const itemsRes = await query('SELECT * FROM booking_items WHERE booking_id = $1', [b.id]);
      const passengersRes = await query('SELECT * FROM passengers WHERE booking_id = $1', [b.id]);

      results.push({
        id: b.id,
        booking_reference: b.booking_reference,
        bookingReference: b.booking_reference,
        user_id: b.user_id,
        service_type: b.service_type,
        serviceType: b.service_type,
        status: b.status,
        provider: b.provider,
        is_simulated: b.is_simulated,
        guest_name: b.guest_name,
        contact_email: b.contact_email,
        contact_phone: b.contact_phone,
        total_amount: parseFloat(b.total_amount),
        currency: b.currency,
        created_at: b.created_at,
        details_snapshot: b.details_snapshot,
        items: itemsRes.rows,
        passengers: passengersRes.rows,
      });
    }

    return res.json({
      success: true,
      data: results,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /bookings/:id/cancel
router.post('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { reason } = req.body;
    const bookingRes = await query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const b = bookingRes.rows[0];
    if (req.user!.role !== 'ADMIN' && b.user_id !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking' });
    }

    await query(
      `UPDATE bookings SET status = 'CANCELLED', cancellation_reason = $1, updated_at = NOW() WHERE id = $2`,
      [reason || 'User requested cancellation', b.id]
    );

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { id: b.id, status: 'CANCELLED' },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
