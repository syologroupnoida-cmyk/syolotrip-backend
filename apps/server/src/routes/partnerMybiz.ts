import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const mybizRouter = Router();
mybizRouter.use(authenticateToken);

// GET /mybiz/context
mybizRouter.get('/context', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const empRes = await query(
      `SELECT e.*, c.name as company_name, c.billing_email, c.credit_limit, c.used_credit 
       FROM mybiz_employees e
       JOIN mybiz_companies c ON e.company_id = c.id
       WHERE e.user_id = $1 OR LOWER(e.email) = LOWER($2)
       LIMIT 1`,
      [user.id, user.email]
    );

    if (empRes.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          has_corporate_account: false,
          is_mybiz_user: false,
          company: null,
          employee: null,
          policy: null,
        },
      });
    }

    const emp = empRes.rows[0];
    const polRes = await query('SELECT * FROM mybiz_travel_policies WHERE company_id = $1 LIMIT 1', [emp.company_id]);

    return res.json({
      success: true,
      data: {
        has_corporate_account: true,
        is_mybiz_user: true,
        company: {
          id: emp.company_id,
          name: emp.company_name,
          billing_email: emp.billing_email,
          credit_limit: parseFloat(emp.credit_limit || '100000'),
          used_credit: parseFloat(emp.used_credit || '0'),
        },
        employee: {
          id: emp.id,
          role: emp.role,
          department: emp.department,
          designation: emp.designation,
          monthly_budget: parseFloat(emp.monthly_budget || '50000'),
          used_budget: parseFloat(emp.used_budget_this_month || '0'),
        },
        policy: polRes.rows[0] || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /mybiz/register
mybizRouter.post('/register', async (req: AuthenticatedRequest, res) => {
  try {
    const { name, industry, company_size, billing_email, billing_phone, city, country = 'India' } = req.body;
    const user = req.user!;

    const compRes = await query(
      `INSERT INTO mybiz_companies (name, industry, company_size, billing_email, billing_phone, city, country, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, industry, company_size, billing_email || user.email, billing_phone || user.phone, city, country, user.id]
    );
    const company = compRes.rows[0];

    // Add user as admin employee
    await query(
      `INSERT INTO mybiz_employees (company_id, user_id, email, full_name, role, status)
       VALUES ($1, $2, $3, $4, 'ADMIN', 'ACTIVE')`,
      [company.id, user.id, user.email, user.full_name]
    );

    // Create default policy
    await query(`INSERT INTO mybiz_travel_policies (company_id) VALUES ($1)`, [company.id]);

    return res.status(201).json({
      success: true,
      message: 'MyBiz company registered successfully',
      data: company,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /mybiz/company
mybizRouter.get('/company', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const resComp = await query(
      `SELECT c.* FROM mybiz_companies c 
       JOIN mybiz_employees e ON e.company_id = c.id 
       WHERE e.user_id = $1 OR c.created_by_user_id = $1
       LIMIT 1`,
      [user.id]
    );
    return res.json({ success: true, data: resComp.rows[0] || null });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= PARTNER ROUTER =================
export const partnerRouter = Router();
partnerRouter.use(authenticateToken);

// POST /partner/register
partnerRouter.post('/register', async (req: AuthenticatedRequest, res) => {
  try {
    const { business_name, business_type, phone, city, address, country = 'India', tax_id } = req.body;
    const user = req.user!;

    const existing = await query('SELECT * FROM partner_profiles WHERE user_id = $1', [user.id]);
    if (existing.rows.length > 0) {
      return res.json({ success: true, data: existing.rows[0] });
    }

    const inserted = await query(
      `INSERT INTO partner_profiles (user_id, business_name, business_type, phone, city, address, country, tax_id, status, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'VERIFIED', true)
       RETURNING *`,
      [user.id, business_name, business_type || 'HOTELIER', phone || user.phone, city, address, country, tax_id]
    );

    await query("UPDATE users SET role = 'PARTNER' WHERE id = $1", [user.id]);

    return res.status(201).json({
      success: true,
      message: 'Partner profile registered successfully',
      data: inserted.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /partner/profile
partnerRouter.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query('SELECT * FROM partner_profiles WHERE user_id = $1', [req.user!.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner profile not found' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /partner/properties
partnerRouter.get('/properties', async (req: AuthenticatedRequest, res) => {
  try {
    const prof = await query('SELECT id FROM partner_profiles WHERE user_id = $1', [req.user!.id]);
    if (prof.rows.length === 0) {
      return res.json({ success: true, data: [] });
    }
    const result = await query('SELECT * FROM hotels WHERE partner_id = $1', [prof.rows[0].id]);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

