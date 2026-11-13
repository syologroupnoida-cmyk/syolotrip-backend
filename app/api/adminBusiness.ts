import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const adminBusinessRouter = Router();

// Require admin authentication
adminBusinessRouter.use(authenticateToken);
adminBusinessRouter.use((req: AuthenticatedRequest, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
});

// GET /api/v1/admin/business/companies
adminBusinessRouter.get('/companies', async (req, res) => {
  try {
    const { account_type, status, search } = req.query;
    let sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM mybiz_employees e WHERE e.company_id = c.id) as employee_count,
             (SELECT COUNT(*) FROM bookings b WHERE b.company_id = c.id) as booking_count,
             (SELECT COALESCE(SUM(total_amount), 0) FROM bookings b WHERE b.company_id = c.id) as total_spent
      FROM mybiz_companies c
      WHERE 1=1
    `;
    const params: any[] = [];

    if (account_type && account_type !== 'ALL') {
      params.push(account_type);
      sql += ` AND c.account_type = $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` AND c.verification_status = $${params.length}`;
    }

    if (search) {
      params.push(`%${String(search).trim()}%`);
      sql += ` AND (c.name ILIKE $${params.length} OR c.billing_email ILIKE $${params.length} OR c.contact_person_name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY c.created_at DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/business/companies/:id
adminBusinessRouter.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const compRes = await query('SELECT * FROM mybiz_companies WHERE id = $1', [id]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const company = compRes.rows[0];
    const employees = await query('SELECT * FROM mybiz_employees WHERE company_id = $1 ORDER BY created_at ASC', [id]);
    const bookings = await query('SELECT * FROM bookings WHERE company_id = $1 ORDER BY created_at DESC LIMIT 15', [id]);
    const policy = await query('SELECT * FROM mybiz_travel_policies WHERE company_id = $1 LIMIT 1', [id]);
    const invoices = await query('SELECT * FROM mybiz_invoices WHERE company_id = $1 ORDER BY invoice_date DESC LIMIT 10', [id]);

    return res.json({
      success: true,
      data: {
        company,
        employees: employees.rows,
        bookings: bookings.rows,
        policy: policy.rows[0] || null,
        invoices: invoices.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/admin/business/companies/:id/verify
adminBusinessRouter.post('/companies/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await query(
      `UPDATE mybiz_companies
       SET verification_status = 'VERIFIED',
           verified_at = NOW(),
           rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.json({
      success: true,
      message: 'Business verification approved successfully',
      data: updated.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/admin/business/companies/:id/reject
adminBusinessRouter.post('/companies/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Verification criteria not met' } = req.body;

    const updated = await query(
      `UPDATE mybiz_companies
       SET verification_status = 'REJECTED',
           rejection_reason = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reason, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.json({
      success: true,
      message: 'Business verification rejected',
      data: updated.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/admin/business/companies/:id/suspend
adminBusinessRouter.post('/companies/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend = true } = req.body;

    const updated = await query(
      `UPDATE mybiz_companies
       SET is_active = $1,
           verification_status = CASE WHEN $1 = false THEN 'SUSPENDED' ELSE 'VERIFIED' END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [!suspend, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.json({
      success: true,
      message: suspend ? 'Company suspended' : 'Company reactivated',
      data: updated.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/admin/business/companies/:id/credit
adminBusinessRouter.put('/companies/:id/credit', async (req, res) => {
  try {
    const { id } = req.params;
    const { credit_limit } = req.body;

    const updated = await query(
      `UPDATE mybiz_companies
       SET credit_limit = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [credit_limit, id]
    );

    return res.json({
      success: true,
      message: 'Credit limit updated successfully',
      data: updated.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

