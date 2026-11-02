import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Enforce admin for all admin routes
router.use(authenticateToken, requireRole('ADMIN'));

// GET /admin/overview
router.get('/overview', async (req, res) => {
  try {
    const usersCount = await query('SELECT COUNT(*) FROM users');
    const bookingsCount = await query('SELECT COUNT(*) FROM bookings');
    const revenueRes = await query("SELECT COALESCE(SUM(total_amount), 0) as rev FROM bookings WHERE status = 'CONFIRMED'");
    const confirmedCount = await query("SELECT COUNT(*) FROM bookings WHERE status = 'CONFIRMED'");
    const pendingCount = await query("SELECT COUNT(*) FROM bookings WHERE status = 'PENDING'");
    const cancelledCount = await query("SELECT COUNT(*) FROM bookings WHERE status = 'CANCELLED'");

    // B2B vs B2C Split
    const b2bBookingsRes = await query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as rev 
       FROM bookings 
       WHERE status = 'CONFIRMED' 
         AND details_snapshot->'pricing_audit_snapshot'->>'pricing_channel' = 'B2B'`
    );
    const b2bCount = parseInt(b2bBookingsRes.rows[0].count, 10);
    const b2bRev = parseFloat(b2bBookingsRes.rows[0].rev);
    const totalRev = parseFloat(revenueRes.rows[0].rev);
    const totalConfirmed = parseInt(confirmedCount.rows[0].count, 10);

    const b2cCount = Math.max(0, totalConfirmed - b2bCount);
    const b2cRev = Math.max(0, totalRev - b2bRev);

    const flightsCount = await query('SELECT COUNT(*) FROM flights');
    const hotelsCount = await query('SELECT COUNT(*) FROM hotels');
    const busesCount = await query('SELECT COUNT(*) FROM buses');
    const packagesCount = await query('SELECT COUNT(*) FROM holiday_packages');

    const companiesCount = await query('SELECT COUNT(*) FROM mybiz_companies');
    const partnersCount = await query('SELECT COUNT(*) FROM partner_profiles');
    const pricingRulesCount = await query('SELECT COUNT(*) FROM pricing_rules WHERE is_active = true');

    // Category-wise performance
    const categoryPerf = await query(
      `SELECT service_type, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
       FROM bookings 
       WHERE status = 'CONFIRMED' 
       GROUP BY service_type`
    );

    return res.json({
      success: true,
      data: {
        total_users: parseInt(usersCount.rows[0].count, 10),
        total_bookings: parseInt(bookingsCount.rows[0].count, 10),
        total_revenue: totalRev,
        confirmed_bookings: totalConfirmed,
        pending_bookings: parseInt(pendingCount.rows[0].count, 10),
        cancelled_bookings: parseInt(cancelledCount.rows[0].count, 10),
        b2c_bookings: b2cCount,
        b2b_bookings: b2bCount,
        b2c_revenue: b2cRev,
        b2b_revenue: b2bRev,
        total_companies: parseInt(companiesCount.rows[0].count, 10),
        total_partners: parseInt(partnersCount.rows[0].count, 10),
        active_pricing_rules: parseInt(pricingRulesCount.rows[0].count, 10),
        total_flights: parseInt(flightsCount.rows[0].count, 10),
        total_hotels: parseInt(hotelsCount.rows[0].count, 10),
        total_buses: parseInt(busesCount.rows[0].count, 10),
        total_packages: parseInt(packagesCount.rows[0].count, 10),
        category_performance: categoryPerf.rows.map((r) => ({
          service: r.service_type,
          bookings: parseInt(r.count, 10),
          revenue: parseFloat(r.revenue),
        })),
        adapter_mode: 'NODE_NATIVE_SIMULATOR',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/bookings
router.get('/bookings', async (req, res) => {
  try {
    const { status, service_type } = req.query;
    let conditions: string[] = [];
    let values: any[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`status = $${idx}`);
      values.push(status);
      idx++;
    }
    if (service_type) {
      conditions.push(`service_type = $${idx}`);
      values.push(service_type);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(`SELECT * FROM bookings ${where} ORDER BY created_at DESC LIMIT 100`, values);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/bookings/:id/status
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
    return res.json({ success: true, message: 'Status updated' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/users
router.get('/users', async (req, res) => {
  try {
    const result = await query('SELECT id, email, full_name, phone, role, is_active, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 100');
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/users/:id/status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;
    await query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [is_active, req.params.id]);
    return res.json({ success: true, message: 'User status updated' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const result = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Pending Properties
router.get('/properties/pending', async (req, res) => {
  try {
    const result = await query("SELECT * FROM hotels WHERE publication_status = 'PENDING_APPROVAL'");
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/properties/:id/approve', async (req: AuthenticatedRequest, res) => {
  try {
    await query(
      "UPDATE hotels SET publication_status = 'APPROVED', approved_at = NOW(), approved_by_user_id = $1 WHERE id = $2",
      [req.user!.id, req.params.id]
    );
    return res.json({ success: true, message: 'Property approved' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/properties/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    await query(
      "UPDATE hotels SET publication_status = 'REJECTED', admin_rejection_reason = $1, updated_at = NOW() WHERE id = $2",
      [reason || 'Rejected by administrator', req.params.id]
    );
    return res.json({ success: true, message: 'Property rejected' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/payments
router.get('/payments', async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || '100', 10);
    const result = await query(
      `SELECT p.*, b.booking_reference, b.service_type, b.contact_email, b.guest_name
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/companies
router.get('/companies', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, COUNT(e.id) as employee_count
       FROM mybiz_companies c
       LEFT JOIN mybiz_employees e ON e.company_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/companies/:id/status
router.patch('/companies/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;
    await query('UPDATE mybiz_companies SET is_active = $1, updated_at = NOW() WHERE id = $2', [is_active, req.params.id]);
    return res.json({ success: true, message: 'Company status updated' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/partners
router.get('/partners', async (req, res) => {
  try {
    const result = await query(
      `SELECT pp.*, u.email as user_email, u.full_name as owner_name,
              COUNT(h.id) as property_count
       FROM partner_profiles pp
       JOIN users u ON pp.user_id = u.id
       LEFT JOIN hotels h ON h.partner_id = pp.id
       GROUP BY pp.id, u.id
       ORDER BY pp.created_at DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/partners/:id/status
router.patch('/partners/:id/status', async (req, res) => {
  try {
    const { status, is_verified, rejection_reason } = req.body;
    await query(
      `UPDATE partner_profiles SET
        status = COALESCE($1, status),
        is_verified = COALESCE($2, is_verified),
        rejection_reason = $3,
        updated_at = NOW()
       WHERE id = $4`,
      [status, is_verified, rejection_reason || null, req.params.id]
    );
    return res.json({ success: true, message: 'Partner status updated' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/coupons
router.get('/coupons', async (req, res) => {
  try {
    const result = await query('SELECT * FROM coupons ORDER BY created_at DESC');
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/coupons
router.post('/coupons', async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type = 'PERCENTAGE',
      discount_value,
      min_booking_amount = 0,
      max_discount_amount = null,
      applicable_services = ['FLIGHT', 'HOTEL', 'BUS', 'TRAIN', 'CAB', 'PACKAGE'],
      usage_limit = 1000,
      valid_until = null,
      is_active = true,
    } = req.body;

    if (!code || discount_value === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required' });
    }

    const insertRes = await query(
      `INSERT INTO coupons (
        code, description, discount_type, discount_value, min_booking_amount,
        max_discount_amount, applicable_services, usage_limit, valid_until, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW() + INTERVAL '1 year'), $10)
      RETURNING *`,
      [
        code.toUpperCase(),
        description || `Promotional coupon ${code.toUpperCase()}`,
        discount_type,
        discount_value,
        min_booking_amount,
        max_discount_amount,
        JSON.stringify(applicable_services),
        usage_limit,
        valid_until,
        is_active,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: insertRes.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /admin/coupons/:id
router.delete('/coupons/:id', async (req, res) => {
  try {
    await query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    return res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

