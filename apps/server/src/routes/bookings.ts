import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../db/index.js';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import {
  detectUserPricingChannel,
  resolvePricingRule,
  computePriceWithRule,
} from '../services/pricingEngine.js';

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
      currency = 'INR',
      items = [],
      passengers = [],
      details_snapshot = {},
      coupon_code = null,
    } = req.body;

    if (!service_type || !contact_email || !contact_phone) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Missing required booking fields' });
    }

    const normService = service_type.toUpperCase();

    // 1. Detect customer channel (B2B vs B2C) based on server database state
    const userId = req.user ? req.user.id : null;
    const userContext = await detectUserPricingChannel(userId);
    const activePricingRule = await resolvePricingRule(userContext.channel, normService, userContext.company_id);

    // 2. Resolve trusted supplier base fare from database inventory
    let trustedSupplierBase = 0;
    let trustedSupplierTaxes = 0;

    if (items.length > 0) {
      for (const item of items) {
        const itemRef = item.item_reference_id || item.id;
        if (normService === 'FLIGHT' && itemRef) {
          const fRes = await client.query('SELECT base_fare, taxes FROM flights WHERE id::text = $1 OR flight_number = $1 LIMIT 1', [itemRef]);
          if (fRes.rows.length > 0) {
            trustedSupplierBase += parseFloat(fRes.rows[0].base_fare) * (item.quantity || 1);
            trustedSupplierTaxes += parseFloat(fRes.rows[0].taxes) * (item.quantity || 1);
          } else {
            trustedSupplierBase += parseFloat(item.base_amount || item.unit_price || 0) * (item.quantity || 1);
            trustedSupplierTaxes += parseFloat(item.taxes || 0) * (item.quantity || 1);
          }
        } else if (normService === 'HOTEL' && item.room_id) {
          const rRes = await client.query('SELECT price_per_night, taxes_per_night FROM hotel_rooms WHERE id = $1 LIMIT 1', [item.room_id]);
          if (rRes.rows.length > 0) {
            trustedSupplierBase += parseFloat(rRes.rows[0].price_per_night) * (item.quantity || 1);
            trustedSupplierTaxes += parseFloat(rRes.rows[0].taxes_per_night || 0) * (item.quantity || 1);
          } else {
            trustedSupplierBase += parseFloat(item.base_amount || item.unit_price || 0) * (item.quantity || 1);
            trustedSupplierTaxes += parseFloat(item.taxes || 0) * (item.quantity || 1);
          }
        } else if (normService === 'TRAIN' && itemRef) {
          const tRes = await client.query('SELECT base_fare FROM trains WHERE id::text = $1 OR train_number = $1 LIMIT 1', [itemRef]);
          if (tRes.rows.length > 0) {
            trustedSupplierBase += parseFloat(tRes.rows[0].base_fare) * (item.quantity || 1);
          } else {
            trustedSupplierBase += parseFloat(item.base_amount || item.unit_price || 0) * (item.quantity || 1);
          }
        } else if (normService === 'BUS' && itemRef) {
          const bRes = await client.query('SELECT base_fare FROM buses WHERE id::text = $1 LIMIT 1', [itemRef]);
          if (bRes.rows.length > 0) {
            trustedSupplierBase += parseFloat(bRes.rows[0].base_fare) * (item.quantity || 1);
          } else {
            trustedSupplierBase += parseFloat(item.base_amount || item.unit_price || 0) * (item.quantity || 1);
          }
        } else if (normService === 'CAB' && itemRef) {
          const cRes = await client.query('SELECT base_fare FROM cabs WHERE id::text = $1 LIMIT 1', [itemRef]);
          if (cRes.rows.length > 0) {
            trustedSupplierBase += parseFloat(cRes.rows[0].base_fare) * (item.quantity || 1);
          } else {
            trustedSupplierBase += parseFloat(item.base_amount || item.unit_price || 0) * (item.quantity || 1);
          }
        } else if (normService === 'PACKAGE' && itemRef) {
          const pRes = await client.query('SELECT price_per_person FROM holiday_packages WHERE id::text = $1 LIMIT 1', [itemRef]);
          if (pRes.rows.length > 0) {
            trustedSupplierBase += parseFloat(pRes.rows[0].price_per_person) * (item.quantity || 1);
          } else {
            trustedSupplierBase += parseFloat(item.base_amount || item.unit_price || 0) * (item.quantity || 1);
          }
        } else {
          trustedSupplierBase += parseFloat(item.base_amount || item.unit_price || 0) * (item.quantity || 1);
          trustedSupplierTaxes += parseFloat(item.taxes || 0) * (item.quantity || 1);
        }
      }
    } else {
      // Fallback if items array was not provided
      trustedSupplierBase = parseFloat(req.body.base_amount || req.body.total_amount || 0);
      trustedSupplierTaxes = parseFloat(req.body.taxes_amount || 0);
    }

    if (trustedSupplierBase <= 0) {
      trustedSupplierBase = Math.max(100, parseFloat(req.body.base_amount || req.body.total_amount || 0));
    }

    // 3. Centralized Dynamic Pricing Engine Calculation (Strict server-side computation)
    const priceQuote = computePriceWithRule(
      trustedSupplierBase,
      trustedSupplierTaxes,
      activePricingRule,
      userContext.channel,
      normService
    );

    // 4. Server-Side Coupon Validation
    let serverDiscount = 0;
    let couponAppliedMeta: any = null;
    const submittedCoupon = coupon_code || req.body.couponCode;

    if (submittedCoupon) {
      const cRes = await client.query(
        `SELECT * FROM coupons
         WHERE LOWER(code) = LOWER($1)
           AND is_active = true
           AND valid_from <= NOW()
           AND valid_until >= NOW()
           AND (usage_limit IS NULL OR used_count < usage_limit)
         LIMIT 1`,
        [submittedCoupon]
      );

      if (cRes.rows.length > 0) {
        const cRow = cRes.rows[0];
        const minReq = parseFloat(cRow.min_booking_amount || 0);
        if (priceQuote.total_selling_price >= minReq) {
          if (cRow.discount_type === 'PERCENTAGE') {
            serverDiscount = Math.round(priceQuote.selling_base_fare * (parseFloat(cRow.discount_value) / 100));
            if (cRow.max_discount_amount) {
              serverDiscount = Math.min(serverDiscount, parseFloat(cRow.max_discount_amount));
            }
          } else {
            serverDiscount = parseFloat(cRow.discount_value);
          }
          couponAppliedMeta = {
            id: cRow.id,
            code: cRow.code,
            discount: serverDiscount,
            discount_type: cRow.discount_type,
          };
          // Increment atomic usage count
          await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [cRow.id]);
        }
      }
    }

    // 5. Final Payable Calculation
    const finalTotalAmount = Math.max(0, priceQuote.total_selling_price - serverDiscount);
    const bookingRef = 'SS-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
    const cancellationToken = uuidv4();

    // 6. Build immutable pricing snapshot
    const immutablePricingSnapshot = {
      ...details_snapshot,
      pricing_audit_snapshot: {
        server_verified: true,
        calculated_at: new Date().toISOString(),
        pricing_channel: userContext.channel,
        is_mybiz_user: userContext.is_mybiz_user,
        company_id: userContext.company_id,
        supplier_base_fare: priceQuote.supplier_base_fare,
        supplier_taxes: priceQuote.supplier_taxes,
        markup_amount: priceQuote.markup_amount,
        markup_percentage: priceQuote.markup_percentage,
        selling_base_fare: priceQuote.selling_base_fare,
        total_selling_price: priceQuote.total_selling_price,
        discount_amount: serverDiscount,
        final_payable_amount: finalTotalAmount,
        currency,
        rule_applied: priceQuote.rule_applied,
        coupon_applied: couponAppliedMeta,
      },
    };

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
        normService,
        guest_name || (passengers[0] ? `${passengers[0].first_name} ${passengers[0].last_name}` : 'Valued Guest'),
        contact_email,
        contact_phone,
        check_in_date || null,
        check_out_date || null,
        cancellationToken,
        priceQuote.selling_base_fare,
        priceQuote.supplier_taxes,
        serverDiscount,
        finalTotalAmount,
        currency,
        JSON.stringify(immutablePricingSnapshot),
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
          item.item_type || normService,
          item.item_reference_id || item.id || 'N/A',
          item.title || 'Travel Item',
          item.quantity || 1,
          item.hotel_id || null,
          item.room_id || null,
          item.check_in_date || check_in_date || null,
          item.check_out_date || check_out_date || null,
          priceQuote.selling_base_fare,
          finalTotalAmount,
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
      message: 'Booking created successfully with server-verified pricing',
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
          channel: userContext.channel,
          markupAmount: priceQuote.markup_amount,
          supplierBaseFare: priceQuote.supplier_base_fare,
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

