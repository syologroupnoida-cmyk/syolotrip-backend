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

    const flightsCount = await query('SELECT COUNT(*) FROM flights');
    const hotelsCount = await query('SELECT COUNT(*) FROM hotels');
    const busesCount = await query('SELECT COUNT(*) FROM buses');
    const packagesCount = await query('SELECT COUNT(*) FROM holiday_packages');

    return res.json({
      success: true,
      data: {
        total_users: parseInt(usersCount.rows[0].count, 10),
        total_bookings: parseInt(bookingsCount.rows[0].count, 10),
        total_revenue: parseFloat(revenueRes.rows[0].rev),
        confirmed_bookings: parseInt(confirmedCount.rows[0].count, 10),
        pending_bookings: parseInt(pendingCount.rows[0].count, 10),
        cancelled_bookings: parseInt(cancelledCount.rows[0].count, 10),
        total_flights: parseInt(flightsCount.rows[0].count, 10),
        total_hotels: parseInt(hotelsCount.rows[0].count, 10),
        total_buses: parseInt(busesCount.rows[0].count, 10),
        total_packages: parseInt(packagesCount.rows[0].count, 10),
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

export default router;
