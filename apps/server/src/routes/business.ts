import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db/index.js';
import { generateAccessToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const businessRouter = Router();

// ==========================================
// 1. PUBLIC BUSINESS REGISTRATION
// ==========================================
businessRouter.post('/register', async (req, res) => {
  try {
    const {
      account_type = 'CORPORATE', // 'CORPORATE' | 'AGENCY'
      company_name,
      legal_name,
      billing_email,
      contact_person_name,
      contact_person_phone,
      password,
      industry = 'General Business',
      company_size = '11-50',
      address,
      city = 'Delhi',
      state = 'Delhi',
      country = 'India',
      postal_code,
      gstin,
      pan,
      website,
    } = req.body;

    const name = (company_name || legal_name || '').trim();
    const email = (billing_email || '').trim().toLowerCase();
    const contactName = (contact_person_name || 'Business Admin').trim();
    const phone = (contact_person_phone || '').trim();

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Company name, business email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this email already exists. Please log in or use a distinct business email.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = account_type === 'AGENCY' ? 'AGENCY_ADMIN' : 'BUSINESS_ADMIN';

    // 1. Create User
    const userRes = await query(
      `INSERT INTO users (email, full_name, phone, hashed_password, role, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, true, false)
       RETURNING id, email, full_name, phone, role, is_active, created_at`,
      [email, contactName, phone || null, hashedPassword, assignedRole]
    );
    const user = userRes.rows[0];

    // 2. Create Company
    const compRes = await query(
      `INSERT INTO mybiz_companies (
        name, account_type, industry, company_size, billing_email, billing_phone,
        address, city, state, country, postal_code, gstin, pan,
        contact_person_name, contact_person_phone, website,
        verification_status, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'PENDING', $17)
      RETURNING *`,
      [
        name,
        account_type,
        industry,
        company_size,
        email,
        phone || null,
        address || null,
        city,
        state,
        country,
        postal_code || null,
        gstin ? gstin.toUpperCase().trim() : null,
        pan ? pan.toUpperCase().trim() : null,
        contactName,
        phone || null,
        website || null,
        user.id,
      ]
    );
    const company = compRes.rows[0];

    // 3. Create Admin Employee / Agent record
    const empRole = account_type === 'AGENCY' ? 'AGENCY_ADMIN' : 'BUSINESS_OWNER';
    const empRes = await query(
      `INSERT INTO mybiz_employees (
        company_id, user_id, email, full_name, phone,
        department, designation, role, status, monthly_budget, booking_permission
      ) VALUES ($1, $2, $3, $4, $5, 'Executive', 'Account Owner', $6, 'ACTIVE', 100000.0, 'CAN_BOOK')
      RETURNING *`,
      [company.id, user.id, email, contactName, phone || null, empRole]
    );
    const employee = empRes.rows[0];

    // 4. Create Default Travel Policy
    const policyName = `${name} Default Policy`;
    await query(
      `INSERT INTO mybiz_travel_policies (
        company_id, policy_name, flight_class, max_flight_budget_domestic,
        max_flight_budget_international, hotel_max_star_rating, hotel_max_price_per_night,
        requires_approval_above, auto_approve_under
      ) VALUES ($1, $2, 'ECONOMY', 15000.0, 75000.0, 4, 8000.0, 10000.0, 5000.0)`,
      [company.id, policyName]
    );

    // 5. Notify Admin
    try {
      await query(
        `INSERT INTO admin_notifications (type, title, message, reference_id, is_read)
         VALUES ('BUSINESS_REGISTRATION', $1, $2, $3, false)`,
        [
          `New ${account_type === 'AGENCY' ? 'Travel Agency' : 'Corporate'} Registered`,
          `${name} (${email}) registered as ${account_type}. Review verification application.`,
          company.id,
        ]
      );
    } catch {}

    const token = generateAccessToken({ sub: user.id, role: user.role, email: user.email });

    return res.status(201).json({
      success: true,
      message: 'Business account registered successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
        company,
        employee,
      },
    });
  } catch (err: any) {
    console.error('B2B Register Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
});

// ==========================================
// 2. PUBLIC BUSINESS LOGIN
// ==========================================
businessRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Lookup business company and employee record
    const empRes = await query(
      `SELECT e.*, c.name as company_name, c.account_type, c.verification_status, c.is_active as company_is_active,
              c.credit_limit, c.used_credit, c.gstin, c.city, c.state
       FROM mybiz_employees e
       JOIN mybiz_companies c ON e.company_id = c.id
       WHERE e.user_id = $1 OR (LOWER(e.email) = LOWER($2) AND e.company_id = c.id)
       LIMIT 1`,
      [user.id, user.email]
    );

    if (empRes.rows.length === 0) {
      // Also check if user created a company directly
      const ownerComp = await query(
        `SELECT * FROM mybiz_companies WHERE created_by_user_id = $1 LIMIT 1`,
        [user.id]
      );
      if (ownerComp.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'This account is not associated with any registered SS Journey myBiz company.',
        });
      }
    }

    const empData = empRes.rows[0] || null;
    const token = generateAccessToken({ sub: user.id, role: user.role, email: user.email });

    return res.json({
      success: true,
      message: 'Business login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
        },
        company: empData
          ? {
              id: empData.company_id,
              name: empData.company_name,
              account_type: empData.account_type,
              verification_status: empData.verification_status,
              credit_limit: parseFloat(empData.credit_limit || '100000'),
              used_credit: parseFloat(empData.used_credit || '0'),
              gstin: empData.gstin,
              city: empData.city,
              state: empData.state,
            }
          : null,
        employee: empData
          ? {
              id: empData.id,
              role: empData.role,
              department: empData.department,
              designation: empData.designation,
              booking_permission: empData.booking_permission,
              monthly_budget: parseFloat(empData.monthly_budget || '50000'),
              used_budget: parseFloat(empData.used_budget_this_month || '0'),
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error('B2B Login Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
});

// ==========================================
// 3. AUTHENTICATED BUSINESS CONTEXT MIDDLEWARE
// ==========================================
export interface BusinessRequest extends AuthenticatedRequest {
  businessCompany?: any;
  businessEmployee?: any;
}

const requireBusinessContext = async (req: BusinessRequest, res: any, next: any) => {
  try {
    const user = req.user!;
    const empRes = await query(
      `SELECT e.*, c.name as company_name, c.account_type, c.verification_status, c.is_active as company_is_active,
              c.credit_limit, c.used_credit, c.billing_email, c.billing_phone, c.address, c.city, c.state, c.country,
              c.gstin, c.pan, c.website, c.company_size, c.industry
       FROM mybiz_employees e
       JOIN mybiz_companies c ON e.company_id = c.id
       WHERE e.user_id = $1 OR LOWER(e.email) = LOWER($2)
       LIMIT 1`,
      [user.id, user.email]
    );

    if (empRes.rows.length === 0) {
      // Check if user is company creator
      const compRes = await query(
        `SELECT * FROM mybiz_companies WHERE created_by_user_id = $1 LIMIT 1`,
        [user.id]
      );
      if (compRes.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have an active myBiz business membership.',
        });
      }
      req.businessCompany = compRes.rows[0];
      req.businessEmployee = {
        id: 'owner',
        role: 'BUSINESS_OWNER',
        full_name: user.full_name,
        email: user.email,
        booking_permission: 'CAN_BOOK',
      };
      return next();
    }

    const row = empRes.rows[0];
    req.businessCompany = {
      id: row.company_id,
      name: row.company_name,
      account_type: row.account_type || 'CORPORATE',
      verification_status: row.verification_status || 'PENDING',
      is_active: row.company_is_active,
      credit_limit: parseFloat(row.credit_limit || '100000'),
      used_credit: parseFloat(row.used_credit || '0'),
      billing_email: row.billing_email,
      billing_phone: row.billing_phone,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      gstin: row.gstin,
      pan: row.pan,
      website: row.website,
      company_size: row.company_size,
      industry: row.industry,
    };

    req.businessEmployee = {
      id: row.id,
      role: row.role,
      department: row.department,
      designation: row.designation,
      booking_permission: row.booking_permission || 'CAN_BOOK',
      monthly_budget: parseFloat(row.monthly_budget || '50000'),
      used_budget_this_month: parseFloat(row.used_budget_this_month || '0'),
      full_name: row.full_name,
      email: row.email,
    };

    next();
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// All endpoints below this line require authentication & business context
businessRouter.use(authenticateToken);
businessRouter.use(requireBusinessContext as any);

// ==========================================
// 4. BUSINESS CONTEXT
// ==========================================
businessRouter.get('/context', async (req: BusinessRequest, res) => {
  try {
    const polRes = await query(
      'SELECT * FROM mybiz_travel_policies WHERE company_id = $1 LIMIT 1',
      [req.businessCompany.id]
    );

    return res.json({
      success: true,
      data: {
        company: req.businessCompany,
        employee: req.businessEmployee,
        policy: polRes.rows[0] || null,
        is_mybiz_user: true,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. BUSINESS DASHBOARD METRICS (Real Database Data)
// ==========================================
businessRouter.get('/dashboard', async (req: BusinessRequest, res) => {
  try {
    const companyId = req.businessCompany.id;

    // 1. Total bookings & total spend
    const bookingsStatRes = await query(
      `SELECT 
         COUNT(*) as total_bookings,
         COALESCE(SUM(total_amount), 0) as total_spend,
         COUNT(CASE WHEN status IN ('CONFIRMED', 'PENDING') AND created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_active,
         COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_count
       FROM bookings 
       WHERE company_id = $1`,
      [companyId]
    );
    const bStats = bookingsStatRes.rows[0];

    // 2. Upcoming Trips
    const upcomingTripsRes = await query(
      `SELECT COUNT(*) as upcoming_count
       FROM bookings 
       WHERE company_id = $1 AND status = 'CONFIRMED' AND created_at >= NOW() - INTERVAL '60 days'`,
      [companyId]
    );

    // 3. Pending Approvals
    const approvalsStatRes = await query(
      `SELECT COUNT(*) as pending_approvals
       FROM mybiz_trip_requests 
       WHERE company_id = $1 AND status = 'PENDING'`,
      [companyId]
    );

    // 4. Active Employees / Agents
    const empStatRes = await query(
      `SELECT COUNT(*) as active_count
       FROM mybiz_employees 
       WHERE company_id = $1 AND status = 'ACTIVE'`,
      [companyId]
    );

    // 5. Invoices & Outstanding
    const invoiceStatRes = await query(
      `SELECT 
         COUNT(*) as total_invoices,
         COALESCE(SUM(CASE WHEN status = 'PENDING' THEN total_amount ELSE 0 END), 0) as pending_invoice_amount
       FROM mybiz_invoices 
       WHERE company_id = $1`,
      [companyId]
    );
    const invStats = invoiceStatRes.rows[0];

    // 6. Recent Bookings (limit 5)
    const recentBookingsRes = await query(
      `SELECT b.id, b.booking_reference, b.service_type, b.total_amount, b.currency, b.status, b.created_at,
              COALESCE(e.full_name, 'Company Booker') as booked_by_name
       FROM bookings b
       LEFT JOIN mybiz_employees e ON b.booked_by_employee_id = e.id
       WHERE b.company_id = $1
       ORDER BY b.created_at DESC
       LIMIT 5`,
      [companyId]
    );

    // 7. Recent Trip Requests (limit 5)
    const recentRequestsRes = await query(
      `SELECT r.*, e.full_name as employee_name, e.department
       FROM mybiz_trip_requests r
       JOIN mybiz_employees e ON r.employee_id = e.id
       WHERE r.company_id = $1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [companyId]
    );

    // 8. Recent Invoices (limit 5)
    const recentInvoicesRes = await query(
      `SELECT * FROM mybiz_invoices 
       WHERE company_id = $1
       ORDER BY invoice_date DESC
       LIMIT 5`,
      [companyId]
    );

    // 9. Spend Trend (Last 6 months grouped)
    const spendTrendRes = await query(
      `SELECT 
         TO_CHAR(created_at, 'Mon YYYY') as month_label,
         DATE_TRUNC('month', created_at) as month_date,
         COALESCE(SUM(total_amount), 0) as monthly_spend,
         COUNT(*) as booking_count
       FROM bookings
       WHERE company_id = $1 AND status != 'CANCELLED' AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'Mon YYYY')
       ORDER BY month_date ASC`,
      [companyId]
    );

    return res.json({
      success: true,
      data: {
        company: req.businessCompany,
        employee: req.businessEmployee,
        metrics: {
          totalBookings: parseInt(bStats.total_bookings || '0', 10),
          totalSpend: parseFloat(bStats.total_spend || '0'),
          upcomingTrips: parseInt(upcomingTripsRes.rows[0].upcoming_count || '0', 10),
          pendingApprovals: parseInt(approvalsStatRes.rows[0].pending_approvals || '0', 10),
          activeMembers: parseInt(empStatRes.rows[0].active_count || '0', 10),
          pendingInvoiceAmount: parseFloat(invStats.pending_invoice_amount || '0'),
          totalInvoices: parseInt(invStats.total_invoices || '0', 10),
          creditLimit: req.businessCompany.credit_limit,
          usedCredit: req.businessCompany.used_credit,
          availableCredit: Math.max(0, req.businessCompany.credit_limit - req.businessCompany.used_credit),
        },
        recentBookings: recentBookingsRes.rows,
        recentTripRequests: recentRequestsRes.rows,
        recentInvoices: recentInvoicesRes.rows,
        spendTrend: spendTrendRes.rows,
      },
    });
  } catch (err: any) {
    console.error('B2B Dashboard Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. COMPANY PROFILE & SETTINGS
// ==========================================
businessRouter.get('/company', async (req: BusinessRequest, res) => {
  try {
    const compRes = await query('SELECT * FROM mybiz_companies WHERE id = $1', [req.businessCompany.id]);
    return res.json({ success: true, data: compRes.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

businessRouter.put('/company', async (req: BusinessRequest, res) => {
  try {
    const {
      name,
      billing_email,
      billing_phone,
      contact_person_name,
      contact_person_phone,
      address,
      city,
      state,
      country,
      postal_code,
      gstin,
      pan,
      website,
      industry,
      company_size,
    } = req.body;

    const updated = await query(
      `UPDATE mybiz_companies
       SET name = COALESCE($1, name),
           billing_email = COALESCE($2, billing_email),
           billing_phone = COALESCE($3, billing_phone),
           contact_person_name = COALESCE($4, contact_person_name),
           contact_person_phone = COALESCE($5, contact_person_phone),
           address = COALESCE($6, address),
           city = COALESCE($7, city),
           state = COALESCE($8, state),
           country = COALESCE($9, country),
           postal_code = COALESCE($10, postal_code),
           gstin = COALESCE($11, gstin),
           pan = COALESCE($12, pan),
           website = COALESCE($13, website),
           industry = COALESCE($14, industry),
           company_size = COALESCE($15, company_size),
           updated_at = NOW()
       WHERE id = $16
       RETURNING *`,
      [
        name,
        billing_email,
        billing_phone,
        contact_person_name,
        contact_person_phone,
        address,
        city,
        state,
        country,
        postal_code,
        gstin ? gstin.toUpperCase().trim() : null,
        pan ? pan.toUpperCase().trim() : null,
        website,
        industry,
        company_size,
        req.businessCompany.id,
      ]
    );

    return res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: updated.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. EMPLOYEES & AGENTS MANAGEMENT
// ==========================================
businessRouter.get('/employees', async (req: BusinessRequest, res) => {
  try {
    const employees = await query(
      `SELECT e.*, 
              (SELECT COUNT(*) FROM bookings b WHERE b.booked_by_employee_id = e.id OR b.agent_id = e.id) as booking_count,
              (SELECT COALESCE(SUM(b.total_amount), 0) FROM bookings b WHERE b.booked_by_employee_id = e.id OR b.agent_id = e.id) as total_spent
       FROM mybiz_employees e
       WHERE e.company_id = $1
       ORDER BY e.created_at ASC`,
      [req.businessCompany.id]
    );

    return res.json({ success: true, data: employees.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

businessRouter.post('/employees', async (req: BusinessRequest, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      department = 'General',
      designation = 'Team Member',
      role = 'EMPLOYEE',
      monthly_budget = 50000.0,
      booking_permission = 'CAN_BOOK',
      commission_rate = 0.0,
    } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if already in this company
    const existingEmp = await query(
      'SELECT id FROM mybiz_employees WHERE company_id = $1 AND LOWER(email) = $2',
      [req.businessCompany.id, cleanEmail]
    );
    if (existingEmp.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A member with this email already belongs to your business roster.',
      });
    }

    // Link or create user
    let userId: string | null = null;
    const userRes = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      // Auto-create invited user account with temporary hash
      const tempHash = await bcrypt.hash('Welcome@SSJourney2026', 10);
      const newUser = await query(
        `INSERT INTO users (email, full_name, phone, hashed_password, role, is_active, is_verified)
         VALUES ($1, $2, $3, $4, 'CUSTOMER', true, true)
         RETURNING id`,
        [cleanEmail, full_name.trim(), phone?.trim() || null, tempHash]
      );
      userId = newUser.rows[0].id;
    }

    const inserted = await query(
      `INSERT INTO mybiz_employees (
        company_id, user_id, email, full_name, phone,
        department, designation, role, status, monthly_budget,
        booking_permission, commission_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', $9, $10, $11)
      RETURNING *`,
      [
        req.businessCompany.id,
        userId,
        cleanEmail,
        full_name.trim(),
        phone?.trim() || null,
        department,
        designation,
        role,
        monthly_budget,
        booking_permission,
        commission_rate,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Member added to business roster successfully',
      data: inserted.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

businessRouter.put('/employees/:id', async (req: BusinessRequest, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      phone,
      department,
      designation,
      role,
      status,
      monthly_budget,
      booking_permission,
      commission_rate,
    } = req.body;

    const updated = await query(
      `UPDATE mybiz_employees
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           department = COALESCE($3, department),
           designation = COALESCE($4, designation),
           role = COALESCE($5, role),
           status = COALESCE($6, status),
           monthly_budget = COALESCE($7, monthly_budget),
           booking_permission = COALESCE($8, booking_permission),
           commission_rate = COALESCE($9, commission_rate),
           updated_at = NOW()
       WHERE id = $10 AND company_id = $11
       RETURNING *`,
      [
        full_name,
        phone,
        department,
        designation,
        role,
        status,
        monthly_budget,
        booking_permission,
        commission_rate,
        id,
        req.businessCompany.id,
      ]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found in your business' });
    }

    return res.json({
      success: true,
      message: 'Member details updated successfully',
      data: updated.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

businessRouter.delete('/employees/:id', async (req: BusinessRequest, res) => {
  try {
    const { id } = req.params;
    const deleted = await query(
      `DELETE FROM mybiz_employees WHERE id = $1 AND company_id = $2 RETURNING id`,
      [id, req.businessCompany.id]
    );
    if (deleted.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    return res.json({ success: true, message: 'Member removed from company' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 8. APPROVAL WORKFLOW & TRIP REQUESTS
// ==========================================
businessRouter.get('/trip-requests', async (req: BusinessRequest, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT r.*, e.full_name as employee_name, e.email as employee_email, e.department,
             u.full_name as approver_name
      FROM mybiz_trip_requests r
      JOIN mybiz_employees e ON r.employee_id = e.id
      LEFT JOIN users u ON r.approved_by_user_id = u.id
      WHERE r.company_id = $1
    `;
    const params: any[] = [req.businessCompany.id];

    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` AND r.status = $2`;
    }
    sql += ` ORDER BY r.created_at DESC`;

    const requests = await query(sql, params);
    return res.json({ success: true, data: requests.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

businessRouter.post('/trip-requests', async (req: BusinessRequest, res) => {
  try {
    const {
      service_type,
      destination,
      travel_date_from,
      travel_date_to,
      estimated_amount,
      purpose_of_travel,
      project_code,
      booking_details = {},
    } = req.body;

    if (!service_type || !estimated_amount) {
      return res.status(400).json({
        success: false,
        message: 'Service type and estimated amount are required',
      });
    }

    const inserted = await query(
      `INSERT INTO mybiz_trip_requests (
        company_id, employee_id, service_type, destination,
        travel_date_from, travel_date_to, estimated_amount,
        purpose_of_travel, project_code, booking_details, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
      RETURNING *`,
      [
        req.businessCompany.id,
        req.businessEmployee.id,
        service_type.toUpperCase(),
        destination || 'Business Destination',
        travel_date_from || null,
        travel_date_to || null,
        estimated_amount,
        purpose_of_travel || 'Client Meeting & Project Visit',
        project_code || 'BIZ-DEFAULT',
        JSON.stringify(booking_details),
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Trip approval request submitted for manager review',
      data: inserted.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

businessRouter.post('/trip-requests/:id/approve', async (req: BusinessRequest, res) => {
  try {
    const { id } = req.params;
    const { comment = 'Approved according to corporate travel policy' } = req.body;

    const updated = await query(
      `UPDATE mybiz_trip_requests
       SET status = 'APPROVED',
           approval_comment = $1,
           approved_by_user_id = $2,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND company_id = $4
       RETURNING *`,
      [comment, req.user!.id, id, req.businessCompany.id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip request not found' });
    }

    return res.json({
      success: true,
      message: 'Trip request approved successfully',
      data: updated.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

businessRouter.post('/trip-requests/:id/reject', async (req: BusinessRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const updated = await query(
      `UPDATE mybiz_trip_requests
       SET status = 'REJECTED',
           approval_comment = $1,
           approved_by_user_id = $2,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND company_id = $4
       RETURNING *`,
      [reason.trim(), req.user!.id, id, req.businessCompany.id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip request not found' });
    }

    return res.json({
      success: true,
      message: 'Trip request rejected',
      data: updated.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 9. CORPORATE TRAVEL POLICIES
// ==========================================
businessRouter.get('/policy', async (req: BusinessRequest, res) => {
  try {
    const polRes = await query(
      'SELECT * FROM mybiz_travel_policies WHERE company_id = $1 LIMIT 1',
      [req.businessCompany.id]
    );

    if (polRes.rows.length === 0) {
      // Create initial policy
      const created = await query(
        `INSERT INTO mybiz_travel_policies (company_id) VALUES ($1) RETURNING *`,
        [req.businessCompany.id]
      );
      return res.json({ success: true, data: created.rows[0] });
    }

    return res.json({ success: true, data: polRes.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

businessRouter.put('/policy', async (req: BusinessRequest, res) => {
  try {
    const {
      policy_name,
      flight_class,
      max_flight_budget_domestic,
      max_flight_budget_international,
      hotel_max_star_rating,
      hotel_max_price_per_night,
      requires_approval_above,
      auto_approve_under,
      allowed_services,
      rules,
    } = req.body;

    const updated = await query(
      `UPDATE mybiz_travel_policies
       SET policy_name = COALESCE($1, policy_name),
           flight_class = COALESCE($2, flight_class),
           max_flight_budget_domestic = COALESCE($3, max_flight_budget_domestic),
           max_flight_budget_international = COALESCE($4, max_flight_budget_international),
           hotel_max_star_rating = COALESCE($5, hotel_max_star_rating),
           hotel_max_price_per_night = COALESCE($6, hotel_max_price_per_night),
           requires_approval_above = COALESCE($7, requires_approval_above),
           auto_approve_under = COALESCE($8, auto_approve_under),
           allowed_services = COALESCE($9, allowed_services),
           rules = COALESCE($10, rules),
           updated_at = NOW()
       WHERE company_id = $11
       RETURNING *`,
      [
        policy_name,
        flight_class,
        max_flight_budget_domestic,
        max_flight_budget_international,
        hotel_max_star_rating,
        hotel_max_price_per_night,
        requires_approval_above,
        auto_approve_under,
        allowed_services ? JSON.stringify(allowed_services) : null,
        rules ? JSON.stringify(rules) : null,
        req.businessCompany.id,
      ]
    );

    return res.json({
      success: true,
      message: 'Travel policy updated successfully',
      data: updated.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Pre-booking policy validation check
businessRouter.post('/policy/validate', async (req: BusinessRequest, res) => {
  try {
    const { service_type, amount, travel_class, star_rating } = req.body;

    const polRes = await query(
      'SELECT * FROM mybiz_travel_policies WHERE company_id = $1 LIMIT 1',
      [req.businessCompany.id]
    );
    const policy = polRes.rows[0];

    const violations: string[] = [];
    let requiresApproval = false;

    if (policy) {
      const amt = parseFloat(amount || '0');

      if (policy.requires_approval_above && amt > parseFloat(policy.requires_approval_above)) {
        requiresApproval = true;
      }

      if (service_type === 'FLIGHT') {
        if (travel_class && policy.flight_class && travel_class.toUpperCase() !== policy.flight_class.toUpperCase() && travel_class.toUpperCase() !== 'ECONOMY') {
          violations.push(`Preferred flight class is ${policy.flight_class}. Selected: ${travel_class}`);
        }
        if (policy.max_flight_budget_domestic && amt > parseFloat(policy.max_flight_budget_domestic)) {
          violations.push(`Flight fare (₹${amt}) exceeds domestic cap of ₹${policy.max_flight_budget_domestic}`);
        }
      }

      if (service_type === 'HOTEL') {
        if (policy.hotel_max_price_per_night && amt > parseFloat(policy.hotel_max_price_per_night)) {
          violations.push(`Hotel price (₹${amt}) exceeds allowed ₹${policy.hotel_max_price_per_night}/night cap`);
        }
        if (star_rating && policy.hotel_max_star_rating && star_rating > policy.hotel_max_star_rating) {
          violations.push(`Hotel rating (${star_rating}★) exceeds maximum allowed ${policy.hotel_max_star_rating}★`);
        }
      }
    }

    return res.json({
      success: true,
      data: {
        is_compliant: violations.length === 0,
        requires_approval: requiresApproval || violations.length > 0,
        violations,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 10. BUSINESS BOOKINGS
// ==========================================
businessRouter.get('/bookings', async (req: BusinessRequest, res) => {
  try {
    const bookings = await query(
      `SELECT b.*, COALESCE(e.full_name, 'Company Administrator') as employee_name,
              e.department, e.email as employee_email
       FROM bookings b
       LEFT JOIN mybiz_employees e ON b.booked_by_employee_id = e.id
       WHERE b.company_id = $1
       ORDER BY b.created_at DESC`,
      [req.businessCompany.id]
    );

    return res.json({ success: true, data: bookings.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 11. INVOICES & BILLING
// ==========================================
businessRouter.get('/invoices', async (req: BusinessRequest, res) => {
  try {
    const invoices = await query(
      `SELECT * FROM mybiz_invoices 
       WHERE company_id = $1
       ORDER BY invoice_date DESC`,
      [req.businessCompany.id]
    );

    return res.json({ success: true, data: invoices.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

businessRouter.get('/invoices/:id', async (req: BusinessRequest, res) => {
  try {
    const { id } = req.params;
    const invRes = await query(
      `SELECT * FROM mybiz_invoices WHERE id = $1 AND company_id = $2`,
      [id, req.businessCompany.id]
    );

    if (invRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.json({ success: true, data: invRes.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 12. REPORTS & ANALYTICS
// ==========================================
businessRouter.get('/reports', async (req: BusinessRequest, res) => {
  try {
    const companyId = req.businessCompany.id;

    // Service-wise spend breakdown
    const serviceSpend = await query(
      `SELECT service_type, 
              COUNT(*) as booking_count, 
              COALESCE(SUM(total_amount), 0) as total_amount
       FROM bookings 
       WHERE company_id = $1 AND status != 'CANCELLED'
       GROUP BY service_type
       ORDER BY total_amount DESC`,
      [companyId]
    );

    // Department-wise spend
    const deptSpend = await query(
      `SELECT COALESCE(e.department, 'Direct / Admin') as department,
              COUNT(b.id) as booking_count,
              COALESCE(SUM(b.total_amount), 0) as total_amount
       FROM bookings b
       LEFT JOIN mybiz_employees e ON b.booked_by_employee_id = e.id
       WHERE b.company_id = $1 AND b.status != 'CANCELLED'
       GROUP BY e.department
       ORDER BY total_amount DESC`,
      [companyId]
    );

    // Top spenders
    const topSpenders = await query(
      `SELECT COALESCE(e.full_name, 'Administrator') as employee_name,
              e.email, e.department,
              COUNT(b.id) as booking_count,
              COALESCE(SUM(b.total_amount), 0) as total_amount
       FROM bookings b
       LEFT JOIN mybiz_employees e ON b.booked_by_employee_id = e.id
       WHERE b.company_id = $1 AND b.status != 'CANCELLED'
       GROUP BY e.full_name, e.email, e.department
       ORDER BY total_amount DESC
       LIMIT 10`,
      [companyId]
    );

    return res.json({
      success: true,
      data: {
        service_breakdown: serviceSpend.rows,
        department_breakdown: deptSpend.rows,
        top_spenders: topSpenders.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

