import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Protect all customer routes
router.use(authenticateToken);

// ==========================================
// 1. Dashboard Summary
// ==========================================
router.get('/dashboard-summary', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Run parallel queries for metrics
    const [
      bookingsCountRes,
      upcomingCountRes,
      completedCountRes,
      cancelledCountRes,
      totalSpentRes,
      wishlistCountRes,
      travellersCountRes,
      userRes,
      recentBookingsRes,
      upcomingTripRes,
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM bookings WHERE user_id = $1', [userId]),
      query(
        `SELECT COUNT(*) FROM bookings 
         WHERE user_id = $1 AND status IN ('CONFIRMED', 'PENDING')`,
        [userId]
      ),
      query("SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND status = 'COMPLETED'", [userId]),
      query("SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND status = 'CANCELLED'", [userId]),
      query(
        "SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE user_id = $1 AND status != 'CANCELLED'",
        [userId]
      ),
      query('SELECT COUNT(*) FROM wishlist_items WHERE user_id = $1', [userId]),
      query('SELECT COUNT(*) FROM saved_travellers WHERE user_id = $1', [userId]),
      query(
        `SELECT id, email, full_name, phone, role, is_active, is_verified, 
                date_of_birth, gender, address, city, state, pincode, 
                emergency_contact_name, emergency_contact_phone, created_at 
         FROM users WHERE id = $1`,
        [userId]
      ),
      query(
        `SELECT id, booking_reference, service_type, status, total_amount, currency, 
                created_at, check_in_date, check_out_date, guest_name 
         FROM bookings 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [userId]
      ),
      query(
        `SELECT b.*, json_agg(bi.*) as items 
         FROM bookings b
         LEFT JOIN booking_items bi ON b.id = bi.booking_id
         WHERE b.user_id = $1 AND b.status IN ('CONFIRMED', 'PENDING')
         GROUP BY b.id
         ORDER BY b.created_at DESC 
         LIMIT 1`,
        [userId]
      ),
    ]);

    const user = userRes.rows[0] || {};

    // Calculate profile completion percentage
    let profileFieldsFilled = 0;
    const keyProfileFields = [
      user.full_name,
      user.email,
      user.phone,
      user.gender,
      user.date_of_birth,
      user.address,
      user.city,
      user.pincode,
      user.emergency_contact_phone,
    ];
    for (const field of keyProfileFields) {
      if (field && String(field).trim().length > 0) {
        profileFieldsFilled += 1;
      }
    }
    const profileCompletionPercent = Math.min(100, Math.round((profileFieldsFilled / keyProfileFields.length) * 100));

    // Next upcoming trip
    let upcomingTrip = null;
    if (upcomingTripRes.rows.length > 0) {
      const b = upcomingTripRes.rows[0];
      upcomingTrip = {
        id: b.id,
        bookingReference: b.booking_reference,
        serviceType: b.service_type,
        status: b.status,
        totalAmount: parseFloat(b.total_amount || 0),
        currency: b.currency,
        checkInDate: b.check_in_date,
        checkOutDate: b.check_out_date,
        guestName: b.guest_name,
        contactEmail: b.contact_email,
        contactPhone: b.contact_phone,
        createdAt: b.created_at,
        items: (b.items || []).filter((i: any) => i !== null),
      };
    }

    return res.json({
      success: true,
      data: {
        metrics: {
          totalBookings: parseInt(bookingsCountRes.rows[0]?.count || '0', 10),
          upcomingTrips: parseInt(upcomingCountRes.rows[0]?.count || '0', 10),
          completedTrips: parseInt(completedCountRes.rows[0]?.count || '0', 10),
          cancelledTrips: parseInt(cancelledCountRes.rows[0]?.count || '0', 10),
          totalSpent: parseFloat(totalSpentRes.rows[0]?.total || 0),
          wishlistCount: parseInt(wishlistCountRes.rows[0]?.count || '0', 10),
          savedTravellersCount: parseInt(travellersCountRes.rows[0]?.count || '0', 10),
          profileCompletionPercent,
        },
        profile: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          dateOfBirth: user.date_of_birth,
          address: user.address,
          city: user.city,
          state: user.state,
          pincode: user.pincode,
          emergencyContactName: user.emergency_contact_name,
          emergencyContactPhone: user.emergency_contact_phone,
          isVerified: user.is_verified,
          createdAt: user.created_at,
        },
        upcomingTrip,
        recentBookings: recentBookingsRes.rows.map((b) => ({
          id: b.id,
          bookingReference: b.booking_reference,
          serviceType: b.service_type,
          status: b.status,
          totalAmount: parseFloat(b.total_amount || 0),
          currency: b.currency,
          createdAt: b.created_at,
          checkInDate: b.check_in_date,
          checkOutDate: b.check_out_date,
          guestName: b.guest_name,
        })),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. Customer Profile
// ==========================================
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const result = await query(
      `SELECT id, email, full_name, phone, role, is_active, is_verified, 
              date_of_birth, gender, address, city, state, pincode, 
              emergency_contact_name, emergency_contact_phone,
              marital_status, passport_number, passport_expiry, passport_issuing_country,
              pan_card_number, auto_insurance_preferences, frequent_flyer_details,
              created_at, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        phone: u.phone,
        role: u.role,
        isActive: u.is_active,
        isVerified: u.is_verified,
        dateOfBirth: u.date_of_birth,
        gender: u.gender,
        address: u.address,
        city: u.city,
        state: u.state,
        pincode: u.pincode,
        emergencyContactName: u.emergency_contact_name,
        emergencyContactPhone: u.emergency_contact_phone,
        maritalStatus: u.marital_status,
        passportNumber: u.passport_number,
        passportExpiry: u.passport_expiry,
        passportIssuingCountry: u.passport_issuing_country || 'India',
        panCardNumber: u.pan_card_number,
        autoInsurancePreferences: u.auto_insurance_preferences || {
          domestic_hotel: false,
          domestic_flight: false,
          international_hotel: false,
          international_flight: false,
        },
        frequentFlyerDetails: u.frequent_flyer_details || [],
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      fullName,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      emergencyContactName,
      emergencyContactPhone,
      maritalStatus,
      passportNumber,
      passportExpiry,
      passportIssuingCountry,
      panCardNumber,
      autoInsurancePreferences,
      frequentFlyerDetails,
    } = req.body;

    if (fullName !== undefined && (!fullName || String(fullName).trim().length < 2)) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters' });
    }

    const result = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           date_of_birth = COALESCE($3, date_of_birth),
           gender = COALESCE($4, gender),
           address = COALESCE($5, address),
           city = COALESCE($6, city),
           state = COALESCE($7, state),
           pincode = COALESCE($8, pincode),
           emergency_contact_name = COALESCE($9, emergency_contact_name),
           emergency_contact_phone = COALESCE($10, emergency_contact_phone),
           marital_status = COALESCE($11, marital_status),
           passport_number = COALESCE($12, passport_number),
           passport_expiry = COALESCE($13, passport_expiry),
           passport_issuing_country = COALESCE($14, passport_issuing_country),
           pan_card_number = COALESCE($15, pan_card_number),
           auto_insurance_preferences = COALESCE($16, auto_insurance_preferences),
           frequent_flyer_details = COALESCE($17, frequent_flyer_details),
           updated_at = NOW()
       WHERE id = $18
       RETURNING id, email, full_name, phone, role, is_active, is_verified, 
                 date_of_birth, gender, address, city, state, pincode, 
                 emergency_contact_name, emergency_contact_phone,
                 marital_status, passport_number, passport_expiry, passport_issuing_country,
                 pan_card_number, auto_insurance_preferences, frequent_flyer_details,
                 updated_at`,
      [
        fullName?.trim() || null,
        phone?.trim() || null,
        dateOfBirth || null,
        gender || null,
        address?.trim() || null,
        city?.trim() || null,
        state?.trim() || null,
        pincode?.trim() || null,
        emergencyContactName?.trim() || null,
        emergencyContactPhone?.trim() || null,
        maritalStatus?.trim() || null,
        passportNumber?.trim() || null,
        passportExpiry || null,
        passportIssuingCountry?.trim() || null,
        panCardNumber?.trim() || null,
        autoInsurancePreferences ? JSON.stringify(autoInsurancePreferences) : null,
        frequentFlyerDetails ? JSON.stringify(frequentFlyerDetails) : null,
        userId,
      ]
    );

    const u = result.rows[0];
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        phone: u.phone,
        role: u.role,
        isActive: u.is_active,
        isVerified: u.is_verified,
        dateOfBirth: u.date_of_birth,
        gender: u.gender,
        address: u.address,
        city: u.city,
        state: u.state,
        pincode: u.pincode,
        emergencyContactName: u.emergency_contact_name,
        emergencyContactPhone: u.emergency_contact_phone,
        maritalStatus: u.marital_status,
        passportNumber: u.passport_number,
        passportExpiry: u.passport_expiry,
        passportIssuingCountry: u.passport_issuing_country,
        panCardNumber: u.pan_card_number,
        autoInsurancePreferences: u.auto_insurance_preferences,
        frequentFlyerDetails: u.frequent_flyer_details,
        updatedAt: u.updated_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. Saved Travellers CRUD
// ==========================================
router.get('/travellers', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const result = await query(
      `SELECT id, title, first_name, last_name, gender, date_of_birth, passenger_type,
              phone, email, passport_number, passport_expiry, nationality,
              meal_preference, seat_preference, created_at, updated_at
       FROM saved_travellers
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );

    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        title: r.title,
        firstName: r.first_name,
        lastName: r.last_name,
        fullName: `${r.title ? r.title + ' ' : ''}${r.first_name} ${r.last_name}`.trim(),
        gender: r.gender,
        dateOfBirth: r.date_of_birth,
        passengerType: r.passenger_type,
        phone: r.phone,
        email: r.email,
        passportNumber: r.passport_number,
        passportExpiry: r.passport_expiry,
        nationality: r.nationality,
        mealPreference: r.meal_preference,
        seatPreference: r.seat_preference,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/travellers', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      passengerType,
      phone,
      email,
      passportNumber,
      passportExpiry,
      nationality,
      mealPreference,
      seatPreference,
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required for a traveller',
      });
    }

    const result = await query(
      `INSERT INTO saved_travellers (
        user_id, title, first_name, last_name, gender, date_of_birth, passenger_type,
        phone, email, passport_number, passport_expiry, nationality,
        meal_preference, seat_preference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        userId,
        title || 'Mr',
        firstName.trim(),
        lastName.trim(),
        gender || 'MALE',
        dateOfBirth || null,
        passengerType || 'ADULT',
        phone?.trim() || null,
        email?.trim() || null,
        passportNumber?.trim() || null,
        passportExpiry || null,
        nationality?.trim() || 'Indian',
        mealPreference?.trim() || null,
        seatPreference?.trim() || null,
      ]
    );

    const r = result.rows[0];
    return res.status(201).json({
      success: true,
      message: 'Traveller saved successfully',
      data: {
        id: r.id,
        title: r.title,
        firstName: r.first_name,
        lastName: r.last_name,
        fullName: `${r.title ? r.title + ' ' : ''}${r.first_name} ${r.last_name}`.trim(),
        gender: r.gender,
        dateOfBirth: r.date_of_birth,
        passengerType: r.passenger_type,
        phone: r.phone,
        email: r.email,
        passportNumber: r.passport_number,
        passportExpiry: r.passport_expiry,
        nationality: r.nationality,
        mealPreference: r.meal_preference,
        seatPreference: r.seat_preference,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/travellers/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const travellerId = req.params.id;
    const {
      title,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      passengerType,
      phone,
      email,
      passportNumber,
      passportExpiry,
      nationality,
      mealPreference,
      seatPreference,
    } = req.body;

    const existing = await query(
      'SELECT id FROM saved_travellers WHERE id = $1 AND user_id = $2',
      [travellerId, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Traveller not found or unauthorized' });
    }

    const result = await query(
      `UPDATE saved_travellers
       SET title = COALESCE($1, title),
           first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           gender = COALESCE($4, gender),
           date_of_birth = COALESCE($5, date_of_birth),
           passenger_type = COALESCE($6, passenger_type),
           phone = COALESCE($7, phone),
           email = COALESCE($8, email),
           passport_number = COALESCE($9, passport_number),
           passport_expiry = COALESCE($10, passport_expiry),
           nationality = COALESCE($11, nationality),
           meal_preference = COALESCE($12, meal_preference),
           seat_preference = COALESCE($13, seat_preference),
           updated_at = NOW()
       WHERE id = $14 AND user_id = $15
       RETURNING *`,
      [
        title,
        firstName?.trim(),
        lastName?.trim(),
        gender,
        dateOfBirth,
        passengerType,
        phone?.trim(),
        email?.trim(),
        passportNumber?.trim(),
        passportExpiry,
        nationality?.trim(),
        mealPreference?.trim(),
        seatPreference?.trim(),
        travellerId,
        userId,
      ]
    );

    const r = result.rows[0];
    return res.json({
      success: true,
      message: 'Traveller updated successfully',
      data: {
        id: r.id,
        title: r.title,
        firstName: r.first_name,
        lastName: r.last_name,
        fullName: `${r.title ? r.title + ' ' : ''}${r.first_name} ${r.last_name}`.trim(),
        gender: r.gender,
        dateOfBirth: r.date_of_birth,
        passengerType: r.passenger_type,
        phone: r.phone,
        email: r.email,
        passportNumber: r.passport_number,
        passportExpiry: r.passport_expiry,
        nationality: r.nationality,
        mealPreference: r.meal_preference,
        seatPreference: r.seat_preference,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/travellers/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const travellerId = req.params.id;

    const result = await query(
      'DELETE FROM saved_travellers WHERE id = $1 AND user_id = $2 RETURNING id',
      [travellerId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Traveller not found or unauthorized' });
    }

    return res.json({ success: true, message: 'Traveller removed successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. Payment & Transaction History
// ==========================================
router.get('/payments', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT p.id, p.payment_reference, p.payment_method, p.amount, p.currency, 
              p.status, p.is_demo, p.created_at,
              b.id as booking_id, b.booking_reference, b.service_type, 
              b.guest_name, b.status as booking_status, b.total_amount as booking_total
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE b.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        paymentReference: r.payment_reference,
        paymentMethod: r.payment_method,
        amount: parseFloat(r.amount || 0),
        currency: r.currency,
        status: r.status,
        isDemo: r.is_demo,
        createdAt: r.created_at,
        booking: {
          id: r.booking_id,
          bookingReference: r.booking_reference,
          serviceType: r.service_type,
          guestName: r.guest_name,
          bookingStatus: r.booking_status,
          totalAmount: parseFloat(r.booking_total || 0),
        },
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

