import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Enforce admin for all admin routes
router.use(authenticateToken, requireRole('ADMIN'));

// GET /admin/overview & /admin/dashboard-stats
router.get('/overview', async (req, res) => {
  try {
    const { date_range, channel, service } = req.query;

    let dateCondition = '';
    if (date_range === 'today') {
      dateCondition = "AND created_at >= CURRENT_DATE";
    } else if (date_range === 'week') {
      dateCondition = "AND created_at >= (NOW() - INTERVAL '7 days')";
    } else if (date_range === 'month') {
      dateCondition = "AND created_at >= (NOW() - INTERVAL '30 days')";
    } else if (date_range === 'year') {
      dateCondition = "AND created_at >= (NOW() - INTERVAL '365 days')";
    }

    let serviceCondition = '';
    if (service && service !== 'ALL') {
      serviceCondition = `AND service_type = '${service}'`;
    }

    let channelCondition = '';
    if (channel === 'B2B') {
      channelCondition = "AND details_snapshot->'pricing_audit_snapshot'->>'pricing_channel' = 'B2B'";
    } else if (channel === 'B2C') {
      channelCondition = "AND (details_snapshot->'pricing_audit_snapshot'->>'pricing_channel' = 'B2C' OR details_snapshot->'pricing_audit_snapshot' IS NULL)";
    }

    // Core Counts
    const usersCount = await query('SELECT COUNT(*) FROM users WHERE role = \'CUSTOMER\' OR role IS NULL');
    const partnersCount = await query('SELECT COUNT(*) FROM partner_profiles');
    const bookingsCount = await query(`SELECT COUNT(*) FROM bookings WHERE 1=1 ${dateCondition} ${serviceCondition} ${channelCondition}`);
    const confirmedCount = await query(`SELECT COUNT(*) FROM bookings WHERE status = 'CONFIRMED' ${dateCondition} ${serviceCondition} ${channelCondition}`);
    const pendingCount = await query(`SELECT COUNT(*) FROM bookings WHERE status = 'PENDING' ${dateCondition} ${serviceCondition} ${channelCondition}`);
    const cancelledCount = await query(`SELECT COUNT(*) FROM bookings WHERE status = 'CANCELLED' ${dateCondition} ${serviceCondition} ${channelCondition}`);
    const revenueRes = await query(`SELECT COALESCE(SUM(total_amount), 0) as rev FROM bookings WHERE status = 'CONFIRMED' ${dateCondition} ${serviceCondition} ${channelCondition}`);
    const totalRev = parseFloat(revenueRes.rows[0].rev);

    // Platform Earnings Estimation (Average 5.5% platform markup across confirmed bookings)
    const platformEarnings = Math.round(totalRev * 0.055);

    // B2B vs B2C Split
    const b2bBookingsRes = await query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as rev 
       FROM bookings 
       WHERE status = 'CONFIRMED' 
         AND details_snapshot->'pricing_audit_snapshot'->>'pricing_channel' = 'B2B'
         ${dateCondition} ${serviceCondition}`
    );
    const b2bCount = parseInt(b2bBookingsRes.rows[0].count, 10);
    const b2bRev = parseFloat(b2bBookingsRes.rows[0].rev);
    const totalConfirmed = parseInt(confirmedCount.rows[0].count, 10);
    const b2cCount = Math.max(0, totalConfirmed - b2bCount);
    const b2cRev = Math.max(0, totalRev - b2bRev);

    // Inventory Counts Across All 10 Services
    const invFlights = await query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM flights');
    const invHotels = await query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM hotels WHERE property_type = 'HOTEL'");
    const invVillas = await query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM hotels WHERE property_type IN ('VILLA', 'HOMESTAY', 'RESORT')");
    const invPackages = await query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true AND publication_status = \'PUBLISHED\') as active FROM holiday_packages');
    const invTrains = await query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM trains');
    const invBuses = await query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM buses');
    const invCabs = await query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM cabs');
    const invTours = await query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM tours');
    const invVisa = await query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM visa_requirements');
    const invInsurance = await query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM travel_insurance_plans');

    // Master Reference Counts
    const masterAirports = await query('SELECT COUNT(*) as total FROM airports');
    const masterStations = await query('SELECT COUNT(*) as total FROM railway_stations');
    const masterTerminals = await query('SELECT COUNT(*) as total FROM bus_terminals');
    const masterDestinations = await query('SELECT COUNT(*) as total FROM destinations');
    const masterCountries = await query('SELECT COUNT(*) as total FROM countries');

    // Pending Approvals
    const pendingProperties = await query("SELECT COUNT(*) FROM hotels WHERE publication_status = 'PENDING_APPROVAL'");
    const pendingPartners = await query("SELECT COUNT(*) FROM partner_profiles WHERE status = 'PENDING'");
    const pendingTrips = await query("SELECT COUNT(*) FROM mybiz_trip_requests WHERE status = 'PENDING'");

    // Payment Stats
    const paymentStats = await query(
      `SELECT 
         COUNT(*) as total_payments,
         COUNT(*) FILTER (WHERE status = 'SUCCESS' OR status = 'COMPLETED') as successful_payments,
         COUNT(*) FILTER (WHERE status = 'REFUNDED') as refunded_payments,
         COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS' OR status = 'COMPLETED'), 0) as collected_amount,
         COALESCE(SUM(amount) FILTER (WHERE status = 'REFUNDED'), 0) as refunded_amount
       FROM payments`
    );

    // Category Performance
    const categoryPerf = await query(
      `SELECT service_type, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
       FROM bookings 
       WHERE status = 'CONFIRMED' ${dateCondition} ${channelCondition}
       GROUP BY service_type`
    );

    // Sales and Revenue Timeline (Last 7 intervals)
    const timelineRes = await query(
      `SELECT 
         TO_CHAR(created_at, 'YYYY-MM-DD') as date,
         COUNT(*) as bookings,
         COALESCE(SUM(total_amount), 0) as revenue
       FROM bookings
       WHERE created_at >= (NOW() - INTERVAL '14 days')
       GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
       ORDER BY date ASC`
    );

    // Recent Transactions
    const recentTransactions = await query(
      `SELECT p.id, p.payment_reference, p.amount, p.currency, p.status, p.payment_method, p.created_at,
              b.booking_reference, b.service_type, b.guest_name, b.contact_email
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       ORDER BY p.created_at DESC
       LIMIT 10`
    );

    // Recent Bookings
    const recentBookings = await query(
      `SELECT id, booking_reference, service_type, status, guest_name, contact_email, total_amount, currency, created_at
       FROM bookings
       ORDER BY created_at DESC
       LIMIT 10`
    );

    // Recent Registrations
    const recentUsers = await query(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`
    );

    return res.json({
      success: true,
      data: {
        total_customers: parseInt(usersCount.rows[0].count, 10),
        total_partners: parseInt(partnersCount.rows[0].count, 10),
        total_bookings: parseInt(bookingsCount.rows[0].count, 10),
        total_revenue: totalRev,
        platform_earnings: platformEarnings,
        confirmed_bookings: totalConfirmed,
        pending_bookings: parseInt(pendingCount.rows[0].count, 10),
        cancelled_bookings: parseInt(cancelledCount.rows[0].count, 10),
        b2c_bookings: b2cCount,
        b2b_bookings: b2bCount,
        b2c_revenue: b2cRev,
        b2b_revenue: b2bRev,
        pending_approvals: {
          properties: parseInt(pendingProperties.rows[0].count, 10),
          partners: parseInt(pendingPartners.rows[0].count, 10),
          trip_requests: parseInt(pendingTrips.rows[0].count, 10),
          total:
            parseInt(pendingProperties.rows[0].count, 10) +
            parseInt(pendingPartners.rows[0].count, 10) +
            parseInt(pendingTrips.rows[0].count, 10),
        },
        payment_stats: {
          total: parseInt(paymentStats.rows[0].total_payments, 10),
          successful: parseInt(paymentStats.rows[0].successful_payments, 10),
          refunded: parseInt(paymentStats.rows[0].refunded_payments, 10),
          collected_amount: parseFloat(paymentStats.rows[0].collected_amount),
          refunded_amount: parseFloat(paymentStats.rows[0].refunded_amount),
        },
        inventory_overview: {
          flights: { total: parseInt(invFlights.rows[0].total, 10), active: parseInt(invFlights.rows[0].active, 10) },
          hotels: { total: parseInt(invHotels.rows[0].total, 10), active: parseInt(invHotels.rows[0].active, 10) },
          villas: { total: parseInt(invVillas.rows[0].total, 10), active: parseInt(invVillas.rows[0].active, 10) },
          packages: { total: parseInt(invPackages.rows[0].total, 10), active: parseInt(invPackages.rows[0].active, 10) },
          trains: { total: parseInt(invTrains.rows[0].total, 10), active: parseInt(invTrains.rows[0].active, 10) },
          buses: { total: parseInt(invBuses.rows[0].total, 10), active: parseInt(invBuses.rows[0].active, 10) },
          cabs: { total: parseInt(invCabs.rows[0].total, 10), active: parseInt(invCabs.rows[0].active, 10) },
          tours: { total: parseInt(invTours.rows[0].total, 10), active: parseInt(invTours.rows[0].active, 10) },
          visa: { total: parseInt(invVisa.rows[0].total, 10), active: parseInt(invVisa.rows[0].active, 10) },
          insurance: { total: parseInt(invInsurance.rows[0].total, 10), active: parseInt(invInsurance.rows[0].active, 10) },
        },
        master_data_overview: {
          airports: parseInt(masterAirports.rows[0].total, 10),
          stations: parseInt(masterStations.rows[0].total, 10),
          terminals: parseInt(masterTerminals.rows[0].total, 10),
          destinations: parseInt(masterDestinations.rows[0].total, 10),
          countries: parseInt(masterCountries.rows[0].total, 10),
        },
        category_performance: categoryPerf.rows.map((r) => ({
          service: r.service_type,
          bookings: parseInt(r.count, 10),
          revenue: parseFloat(r.revenue),
        })),
        sales_timeline: timelineRes.rows.map((r) => ({
          date: r.date,
          bookings: parseInt(r.bookings, 10),
          revenue: parseFloat(r.revenue),
        })),
        recent_transactions: recentTransactions.rows,
        recent_bookings: recentBookings.rows,
        recent_registrations: recentUsers.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/bookings
router.get('/bookings', async (req, res) => {
  try {
    const { status, service_type, search, channel } = req.query;
    let conditions: string[] = [];
    let values: any[] = [];
    let idx = 1;

    if (status && status !== 'ALL') {
      conditions.push(`status = $${idx}`);
      values.push(status);
      idx++;
    }
    if (service_type && service_type !== 'ALL') {
      conditions.push(`service_type = $${idx}`);
      values.push(service_type);
      idx++;
    }
    if (channel === 'B2B') {
      conditions.push("details_snapshot->'pricing_audit_snapshot'->>'pricing_channel' = 'B2B'");
    } else if (channel === 'B2C') {
      conditions.push("(details_snapshot->'pricing_audit_snapshot'->>'pricing_channel' = 'B2C' OR details_snapshot->'pricing_audit_snapshot' IS NULL)");
    }
    if (search) {
      conditions.push(
        `(LOWER(booking_reference) LIKE LOWER($${idx}) OR LOWER(guest_name) LIKE LOWER($${idx}) OR LOWER(contact_email) LIKE LOWER($${idx}) OR contact_phone LIKE $${idx})`
      );
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(`SELECT * FROM bookings ${where} ORDER BY created_at DESC LIMIT 200`, values);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/bookings/:id (Complete Booking Details)
router.get('/bookings/:id', async (req, res) => {
  try {
    const bookingRes = await query('SELECT * FROM bookings WHERE id = $1 OR booking_reference = $1', [req.params.id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const booking = bookingRes.rows[0];

    // Fetch items
    const itemsRes = await query('SELECT * FROM booking_items WHERE booking_id = $1', [booking.id]);
    // Fetch passengers
    const paxRes = await query('SELECT * FROM passengers WHERE booking_id = $1', [booking.id]);
    // Fetch payments
    const payRes = await query('SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC', [booking.id]);

    return res.json({
      success: true,
      data: {
        ...booking,
        items: itemsRes.rows,
        passengers: paxRes.rows,
        payments: payRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/bookings/:id/status
router.patch('/bookings/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { status, cancellation_reason } = req.body;
    const bookingRes = await query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const prevBooking = bookingRes.rows[0];

    await query(
      `UPDATE bookings 
       SET status = $1, 
           cancellation_reason = COALESCE($2, cancellation_reason), 
           updated_at = NOW() 
       WHERE id = $3`,
      [status, cancellation_reason || null, req.params.id]
    );

    // If cancelled, record refund simulation status if payment exists
    if (status === 'CANCELLED') {
      await query(
        `UPDATE payments SET status = 'REFUNDED', updated_at = NOW() WHERE booking_id = $1 AND (status = 'SUCCESS' OR status = 'COMPLETED')`,
        [req.params.id]
      );
    }

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, previous_state, new_state, reason, created_at)
       VALUES ($1, $2, 'BOOKING_STATUS_CHANGE', 'bookings', $3, $4, $5, $6, NOW())`,
      [
        req.user?.id || null,
        req.user?.email || 'admin@traveler.com',
        req.params.id,
        JSON.stringify({ status: prevBooking.status }),
        JSON.stringify({ status, cancellation_reason }),
        cancellation_reason || 'Status changed by administrator',
      ]
    );

    return res.json({ success: true, message: `Booking status updated to ${status}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/customers
router.get('/customers', async (req, res) => {
  try {
    const { search, status } = req.query;
    let conditions: string[] = ["u.role = 'CUSTOMER' OR u.role IS NULL"];
    let values: any[] = [];
    let idx = 1;

    if (status === 'ACTIVE') {
      conditions.push('u.is_active = true');
    } else if (status === 'SUSPENDED') {
      conditions.push('u.is_active = false');
    }

    if (search) {
      conditions.push(`(LOWER(u.email) LIKE LOWER($${idx}) OR LOWER(u.full_name) LIKE LOWER($${idx}) OR u.phone LIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const sql = `
      SELECT 
        u.id, u.email, u.full_name, u.phone, u.role, u.is_active, u.is_verified, u.created_at,
        COUNT(b.id) as total_bookings,
        COUNT(b.id) FILTER (WHERE b.status = 'CONFIRMED') as confirmed_bookings,
        COALESCE(SUM(b.total_amount) FILTER (WHERE b.status = 'CONFIRMED'), 0) as total_spend
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      ${where}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 200
    `;
    const result = await query(sql, values);

    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        ...r,
        total_bookings: parseInt(r.total_bookings, 10),
        confirmed_bookings: parseInt(r.confirmed_bookings, 10),
        total_spend: parseFloat(r.total_spend),
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/customers/:id/status
router.patch('/customers/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { is_active, reason } = req.body;
    await query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [is_active, req.params.id]);

    await query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, new_state, reason, created_at)
       VALUES ($1, $2, 'CUSTOMER_STATUS_CHANGE', 'users', $3, $4, $5, NOW())`,
      [
        req.user?.id || null,
        req.user?.email || 'admin@traveler.com',
        req.params.id,
        JSON.stringify({ is_active }),
        reason || (is_active ? 'Account reactivated' : 'Account suspended'),
      ]
    );

    return res.json({ success: true, message: `Customer status updated to ${is_active ? 'Active' : 'Suspended'}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/roles
router.get('/roles', async (req, res) => {
  try {
    const adminUsers = await query(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM users
       WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_ADMIN', 'INVENTORY_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_ADMIN')
       ORDER BY created_at ASC`
    );

    const availableRoles = [
      { id: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full platform administrative control including role management' },
      { id: 'OPERATIONS_ADMIN', label: 'Operations Admin', description: 'Bookings, inventory management, trip approvals, and partner dispatch' },
      { id: 'INVENTORY_MANAGER', label: 'Inventory Manager', description: 'Catalog services, routes, stations, and bulk data imports' },
      { id: 'FINANCE_ADMIN', label: 'Finance Admin', description: 'Payments, refunds, pricing markups, corporate billing, and invoicing' },
      { id: 'MARKETING_ADMIN', label: 'Marketing Admin', description: 'Coupons, promotions, offers, and package showcase banners' },
      { id: 'SUPPORT_ADMIN', label: 'Support Admin', description: 'Customer profiles, partner verifications, and customer service' },
    ];

    return res.json({
      success: true,
      data: {
        roles: availableRoles.map((r) => r.id),
        available_roles: availableRoles,
        users: adminUsers.rows,
        admin_users: adminUsers.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/users/:id/role
router.patch('/users/:id/role', async (req: AuthenticatedRequest, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = [
      'SUPER_ADMIN', 'ADMIN', 'OPERATIONS_ADMIN', 'INVENTORY_MANAGER',
      'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_ADMIN', 'CUSTOMER', 'PARTNER'
    ];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role assignment' });
    }

    const prevUserRes = await query('SELECT role, email FROM users WHERE id = $1', [req.params.id]);
    if (prevUserRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, req.params.id]);

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, previous_state, new_state, created_at)
       VALUES ($1, $2, 'ROLE_CHANGE', 'users', $3, $4, $5, NOW())`,
      [
        req.user?.id || null,
        req.user?.email || 'admin@traveler.com',
        req.params.id,
        JSON.stringify({ role: prevUserRes.rows[0].role }),
        JSON.stringify({ role }),
      ]
    );

    return res.json({ success: true, message: `User role updated to ${role}` });
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

// ================= INVENTORY & PACKAGE MANAGEMENT =================

// GET /admin/packages
router.get('/packages', async (req, res) => {
  try {
    const { status, search, region, theme } = req.query;
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
    const offset = (page - 1) * limit;

    let conditions: string[] = ['1=1'];
    let values: any[] = [];
    let idx = 1;

    if (status && status !== 'ALL') {
      conditions.push(`publication_status = $${idx}`);
      values.push(status);
      idx++;
    }

    if (region && region !== 'ALL') {
      conditions.push(`LOWER(region) = LOWER($${idx})`);
      values.push(region);
      idx++;
    }

    if (theme && theme !== 'ALL') {
      conditions.push(`LOWER(theme) = LOWER($${idx})`);
      values.push(theme);
      idx++;
    }

    if (search) {
      conditions.push(
        `(LOWER(title) LIKE LOWER($${idx}) OR LOWER(destination) LIKE LOWER($${idx}) OR LOWER(COALESCE(package_id, '')) LIKE LOWER($${idx}))`
      );
      values.push(`%${search}%`);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) as total FROM holiday_packages ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const result = await query(
      `SELECT * FROM holiday_packages ${whereClause} ORDER BY created_at DESC, price_per_person ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    const items = result.rows.map((r) => ({
      id: r.id,
      package_id: r.package_id,
      title: r.title,
      destination: r.destination,
      region: r.region || 'National',
      theme: r.theme || 'Explorer',
      package_type: r.package_type || 'Holiday',
      duration: r.duration || `${r.duration_nights}N / ${r.duration_days}D`,
      duration_days: r.duration_days,
      duration_nights: r.duration_nights,
      price_per_person: parseFloat(r.price_per_person),
      old_price: r.old_price ? parseFloat(r.old_price) : null,
      discount_percent: r.discount_percent || 0,
      currency: r.currency || 'INR',
      publication_status: r.publication_status || 'DRAFT',
      is_active: r.is_active,
      featured_image: r.featured_image,
      rating: parseFloat(r.rating) || 4.8,
      available_capacity: r.available_capacity || 20,
      created_at: r.created_at,
    }));

    return res.json({
      success: true,
      data: {
        items,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/packages
router.post('/packages', async (req, res) => {
  try {
    const {
      title,
      destination,
      region = 'National',
      theme = 'Explorer',
      package_type = 'Holiday',
      duration_days = 5,
      duration_nights = 4,
      price_per_person,
      overview = '',
      inclusions = [],
      exclusions = [],
      featured_image,
      publication_status = 'DRAFT',
    } = req.body;

    if (!title || !destination || !price_per_person) {
      return res.status(400).json({ success: false, message: 'Title, destination, and price are required' });
    }

    const durationStr = `${duration_nights} Nights / ${duration_days} Days`;
    const defaultImage =
      featured_image || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80';

    const insertRes = await query(
      `INSERT INTO holiday_packages (
        title, destination, region, theme, package_type, duration, duration_days, duration_nights,
        price_per_person, overview, inclusions, exclusions, featured_image, publication_status, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
      RETURNING *`,
      [
        title,
        destination,
        region,
        theme,
        package_type,
        durationStr,
        duration_days,
        duration_nights,
        price_per_person,
        overview,
        JSON.stringify(inclusions),
        JSON.stringify(exclusions),
        defaultImage,
        publication_status,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: insertRes.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/packages/:id/status
router.patch('/packages/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED.' });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id);
    let result;
    if (isUuid) {
      result = await query(
        'UPDATE holiday_packages SET publication_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, req.params.id]
      );
    } else {
      result = await query(
        'UPDATE holiday_packages SET publication_status = $1, updated_at = NOW() WHERE package_id = $2 RETURNING *',
        [status, req.params.id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    return res.json({
      success: true,
      message: `Package status updated to ${status}`,
      data: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/packages/bulk-status
router.post('/packages/bulk-status', async (req, res) => {
  try {
    const { status, package_ids } = req.body;
    if (!status || !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    let updateRes;
    if (Array.isArray(package_ids) && package_ids.length > 0) {
      updateRes = await query(
        `UPDATE holiday_packages SET publication_status = $1, updated_at = NOW()
         WHERE id = ANY($2::uuid[]) OR package_id = ANY($3::varchar[])
         RETURNING id, package_id`,
        [status, package_ids.filter((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(id)), package_ids]
      );
    } else {
      // Bulk update all packages
      updateRes = await query(
        'UPDATE holiday_packages SET publication_status = $1, updated_at = NOW() RETURNING id, package_id',
        [status]
      );
    }

    return res.json({
      success: true,
      message: `Successfully updated ${updateRes.rows.length} packages to ${status}`,
      count: updateRes.rows.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /admin/inventory/:itemType/:itemId
router.delete('/inventory/:itemType/:itemId', async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const tableMap: Record<string, string> = {
      flights: 'flights',
      hotels: 'hotels',
      trains: 'trains',
      buses: 'buses',
      cabs: 'cabs',
      packages: 'holiday_packages',
    };

    const targetTable = tableMap[itemType];
    if (!targetTable) {
      return res.status(400).json({ success: false, message: 'Invalid inventory type' });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);
    if (isUuid) {
      await query(`DELETE FROM ${targetTable} WHERE id = $1`, [itemId]);
    } else {
      await query(`DELETE FROM ${targetTable} WHERE package_id = $1 OR id::text = $1`, [itemId]);
    }

    return res.json({ success: true, message: `${itemType} item deleted successfully` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/inventory/:itemType/:itemId
router.patch('/inventory/:itemType/:itemId', async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const { price, base_fare, price_per_person, starting_price, is_active, available_capacity, available_seats } = req.body;

    const tableMap: Record<string, string> = {
      flights: 'flights',
      hotels: 'hotels',
      trains: 'trains',
      buses: 'buses',
      cabs: 'cabs',
      packages: 'holiday_packages',
    };

    const targetTable = tableMap[itemType];
    if (!targetTable) {
      return res.status(400).json({ success: false, message: 'Invalid inventory type' });
    }

    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let idx = 1;

    if (is_active !== undefined) {
      updates.push(`is_active = $${idx}`);
      values.push(Boolean(is_active));
      idx++;
    }

    if (itemType === 'packages') {
      const p = price !== undefined ? price : price_per_person;
      if (p !== undefined) {
        updates.push(`price_per_person = $${idx}`);
        values.push(parseFloat(p));
        idx++;
      }
      if (available_capacity !== undefined) {
        updates.push(`available_capacity = $${idx}`);
        values.push(parseInt(available_capacity, 10));
        idx++;
      }
    } else if (itemType === 'hotels') {
      const p = price !== undefined ? price : starting_price;
      if (p !== undefined) {
        updates.push(`starting_price = $${idx}`);
        values.push(parseFloat(p));
        idx++;
      }
    } else {
      const p = price !== undefined ? price : base_fare;
      if (p !== undefined) {
        updates.push(`base_fare = $${idx}`);
        values.push(parseFloat(p));
        idx++;
      }
      if (available_seats !== undefined) {
        updates.push(`available_seats = $${idx}`);
        values.push(parseInt(available_seats, 10));
        idx++;
      }
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);
    const idColumn = isUuid ? 'id' : (itemType === 'packages' ? 'package_id' : 'id::text');

    values.push(itemId);
    const sql = `UPDATE ${targetTable} SET ${updates.join(', ')} WHERE ${idColumn} = $${idx} RETURNING *`;
    const updateRes = await query(sql, values);

    return res.json({
      success: true,
      message: `${itemType} item updated successfully`,
      data: updateRes.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

