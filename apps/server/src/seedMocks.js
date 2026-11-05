import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const { Client } = pg;

async function seedMocks() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/traveler_db';
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to PostgreSQL:', connectionString);

  // ==========================================
  // 1. MOCK VENDOR ACCOUNT
  // ==========================================
  const vendorEmail = 'vendor.demo@ssjourney.com';
  const vendorPass = await bcrypt.hash('Vendor@123456', 10);

  let userRes = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [vendorEmail]);
  let vendorUserId;
  if (userRes.rows.length === 0) {
    const insUser = await client.query(
      `INSERT INTO users (email, hashed_password, full_name, phone, role, is_active, is_verified)
       VALUES ($1, $2, 'Vikramaditya Rathore', '+91 98765 43210', 'PARTNER', true, true)
       RETURNING id`,
      [vendorEmail, vendorPass]
    );
    vendorUserId = insUser.rows[0].id;
  } else {
    vendorUserId = userRes.rows[0].id;
    await client.query(
      'UPDATE users SET hashed_password = $1, role = \'PARTNER\', is_active = true WHERE id = $2',
      [vendorPass, vendorUserId]
    );
  }
  console.log('Vendor User ID:', vendorUserId);

  let partRes = await client.query('SELECT id FROM partner_profiles WHERE user_id = $1', [vendorUserId]);
  let partnerProfileId;
  if (partRes.rows.length === 0) {
    const insPart = await client.query(
      `INSERT INTO partner_profiles (
         user_id, business_name, owner_name, business_type, property_type,
         phone, city, state, address, country, tax_id, status, onboarding_status,
         kyc_status, is_verified, kyc_approved_at, verified_at, created_at, updated_at
       ) VALUES (
         $1, 'Royal Heritage Retreat & Spa', 'Vikramaditya Rathore', 'HOTELIER', 'HOTEL',
         '+91 98765 43210', 'Udaipur', 'Rajasthan', 'Lake Pichola Waterfront, Haridas Ji Ki Magri', 'India',
         '08AAACR1234F1Z8', 'VERIFIED', 'ACTIVE', 'KYC_APPROVED', true, NOW(), NOW(), NOW(), NOW()
       ) RETURNING id`,
      [vendorUserId]
    );
    partnerProfileId = insPart.rows[0].id;
  } else {
    partnerProfileId = partRes.rows[0].id;
    await client.query(
      `UPDATE partner_profiles SET
         business_name = 'Royal Heritage Retreat & Spa',
         owner_name = 'Vikramaditya Rathore',
         status = 'VERIFIED',
         onboarding_status = 'ACTIVE',
         kyc_status = 'KYC_APPROVED',
         is_verified = true,
         kyc_approved_at = NOW(),
         verified_at = NOW()
       WHERE id = $1`,
      [partnerProfileId]
    );
  }
  console.log('Partner Profile ID:', partnerProfileId);

  // Insert mock KYC application if missing
  let kycAppRes = await client.query('SELECT id FROM vendor_kyc_applications WHERE vendor_id = $1', [partnerProfileId]);
  let kycAppId;
  if (kycAppRes.rows.length === 0) {
    const insApp = await client.query(
      `INSERT INTO vendor_kyc_applications (
         vendor_id, user_id, business_structure, legal_business_name, trade_name,
         gstin, pan_number, registered_address, city, state, pincode, status,
         submitted_at, reviewed_at
       ) VALUES (
         $1, $2, 'PRIVATE_LIMITED', 'Royal Heritage Hospitality Pvt Ltd', 'Royal Heritage Retreat & Spa',
         '08AAACR1234F1Z8', 'AAACR1234F', 'Lake Pichola Waterfront, Haridas Ji Ki Magri', 'Udaipur', 'Rajasthan', '313001',
         'APPROVED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
       ) RETURNING id`,
      [partnerProfileId, vendorUserId]
    );
    kycAppId = insApp.rows[0].id;
  } else {
    kycAppId = kycAppRes.rows[0].id;
  }

  // Insert mock KYC documents if missing
  const kycDocs = await client.query('SELECT id FROM vendor_kyc_documents WHERE vendor_id = $1', [partnerProfileId]);
  if (kycDocs.rows.length === 0) {
    await client.query(
      `INSERT INTO vendor_kyc_documents (
         application_id, vendor_id, document_section, document_type, document_number_masked,
         file_name, file_path, file_size, mime_type, verification_status
       ) VALUES
       ($1, $2, 'IDENTITY', 'PAN_CARD', 'XXXXX1234F', 'pan_card_vikram.pdf', 'uploads/kyc/pan_mock.pdf', 102400, 'application/pdf', 'APPROVED'),
       ($1, $2, 'ADDRESS', 'GST_CERTIFICATE', '08XXXXX1234F1Z8', 'gst_cert_royal.pdf', 'uploads/kyc/gst_mock.pdf', 204800, 'application/pdf', 'APPROVED'),
       ($1, $2, 'OWNERSHIP', 'PROPERTY_TITLE_DEED', 'REG-UDP-88219', 'deed_royal_lake.pdf', 'uploads/kyc/deed_mock.pdf', 307200, 'application/pdf', 'APPROVED')`,
      [kycAppId, partnerProfileId]
    );
  }

  // Insert mock property for this partner if missing
  const propRes = await client.query('SELECT id FROM hotels WHERE partner_id = $1', [partnerProfileId]);
  let hotelId;
  if (propRes.rows.length === 0) {
    const insHotel = await client.query(
      `INSERT INTO hotels (
         partner_id, name, property_type, star_rating, guest_rating, rating_label, review_count,
         address, city, state, country, overview, featured_image, starting_price,
         currency, is_active, featured, publication_status
       ) VALUES (
         $1, 'Royal Heritage Palace Udaipur', 'HOTEL', 5, 9.6, 'Exceptional', 184,
         'Lake Pichola Waterfront', 'Udaipur', 'Rajasthan', 'India',
         'Overlooking the sparkling waters of Lake Pichola, Royal Heritage Palace offers panoramic views of the City Palace, private lakeside balconies, authentic Mewari dining, and personalized butler service.',
         'https://images.unsplash.com/photo-1566073771259-6a8506099945',
         12500, 'INR', true, true, 'PUBLISHED'
       ) RETURNING id`,
      [partnerProfileId]
    );
    hotelId = insHotel.rows[0].id;

    // Insert rooms
    await client.query(
      `INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, max_occupancy, price_per_night, taxes_per_night, available_rooms, is_available)
       VALUES
       ($1, 'Maharaja Heritage Suite', 'Royal King Bed', 3, 22000, 2640, 4, true),
       ($1, 'Deluxe Lake View Room', 'King Bed', 2, 12500, 1500, 8, true)`,
      [hotelId]
    );
  } else {
    hotelId = propRes.rows[0].id;
  }
  console.log('Hotel ID:', hotelId);

  // Insert vendor notification
  await client.query(
    `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type, is_read, created_at)
     VALUES ($1, $2, 'Property Verification Approved', 'Congratulations! Your property Royal Heritage Palace Udaipur is verified and live on SS Journey.', 'KYC_APPROVED', false, NOW())
     ON CONFLICT DO NOTHING`,
    [partnerProfileId, vendorUserId]
  );

  // ==========================================
  // 2. MOCK MYBIZ CORPORATE ACCOUNT
  // ==========================================
  const corpEmail = 'corp.admin@ssjourney.com';
  const corpPass = await bcrypt.hash('CorpPass123!', 10);

  let corpUserRes = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [corpEmail]);
  let corpUserId;
  if (corpUserRes.rows.length === 0) {
    const insUser = await client.query(
      `INSERT INTO users (email, hashed_password, full_name, phone, role, is_active, is_verified)
       VALUES ($1, $2, 'Arjun Mehta', '+91 98111 55566', 'BUSINESS_ADMIN', true, true)
       RETURNING id`,
      [corpEmail, corpPass]
    );
    corpUserId = insUser.rows[0].id;
  } else {
    corpUserId = corpUserRes.rows[0].id;
    await client.query(
      'UPDATE users SET hashed_password = $1, role = \'BUSINESS_ADMIN\', is_active = true WHERE id = $2',
      [corpPass, corpUserId]
    );
  }
  console.log('Corp User ID:', corpUserId);

  let compRes = await client.query('SELECT id FROM mybiz_companies WHERE billing_email = $1', [corpEmail]);
  let corpCompanyId;
  if (compRes.rows.length === 0) {
    const insComp = await client.query(
      `INSERT INTO mybiz_companies (
         name, account_type, billing_email, contact_person_name, contact_person_phone,
         gstin, pan, industry, company_size, address, city, state, country, postal_code,
         credit_limit, used_credit, verification_status, verified_at, is_active
       ) VALUES (
         'Acme Technologies India Pvt Ltd', 'CORPORATE', $1, 'Arjun Mehta', '+91 98111 55566',
         '29AAACA1234F1Z5', 'AAACA1234F', 'Technology & IT', '201-500',
         'RMZ Infinity, Tower D, Old Madras Road', 'Bengaluru', 'Karnataka', 'India', '560016',
         500000, 145200, 'VERIFIED', NOW(), true
       ) RETURNING id`,
      [corpEmail]
    );
    corpCompanyId = insComp.rows[0].id;
  } else {
    corpCompanyId = compRes.rows[0].id;
    await client.query(
      `UPDATE mybiz_companies SET
         name = 'Acme Technologies India Pvt Ltd',
         account_type = 'CORPORATE',
         verification_status = 'VERIFIED',
         credit_limit = 500000,
         used_credit = 145200,
         verified_at = NOW(),
         is_active = true
       WHERE id = $1`,
      [corpCompanyId]
    );
  }
  console.log('Corp Company ID:', corpCompanyId);

  // Clean previous employees for this company
  await client.query('DELETE FROM mybiz_employees WHERE company_id = $1', [corpCompanyId]);

  // Insert corp admin employee entry
  await client.query(
    `INSERT INTO mybiz_employees (company_id, user_id, email, full_name, department, designation, role, status)
     VALUES ($1, $2, $3, 'Arjun Mehta', 'Executive', 'VP of Operations', 'BIZ_ADMIN', 'ACTIVE')`,
    [corpCompanyId, corpUserId, corpEmail]
  );

  // Add other team members
  await client.query(
    `INSERT INTO mybiz_employees (company_id, email, full_name, department, designation, role, status)
     VALUES
     ($1, 'priya.sharma@acme.com', 'Priya Sharma', 'Human Resources', 'Travel Operations Manager', 'BIZ_APPROVER', 'ACTIVE'),
     ($1, 'rohan.verma@acme.com', 'Rohan Verma', 'Engineering', 'Principal Architect', 'BIZ_EMPLOYEE', 'ACTIVE'),
     ($1, 'ananya.sen@acme.com', 'Ananya Sen', 'Sales & Consulting', 'Senior Account Director', 'BIZ_EMPLOYEE', 'ACTIVE')`,
    [corpCompanyId]
  );

  // Insert or update travel policy
  await client.query(
    `INSERT INTO mybiz_travel_policies (company_id, policy_name, rules, is_active)
     VALUES ($1, 'Acme Standard Enterprise Travel Policy', '{"flight_max_budget": 25000, "hotel_max_price_per_night": 9000, "hotel_star_rating_allowed": [3, 4, 5], "cabin_class_allowed": ["ECONOMY", "PREMIUM_ECONOMY"], "advance_booking_days": 3, "require_approval_above": 10000}', true)
     ON CONFLICT (company_id) DO UPDATE SET is_active = true`,
    [corpCompanyId]
  );

  // Insert mock pending trip request
  await client.query(
    `INSERT INTO mybiz_trip_requests (company_id, employee_id, service_type, destination, travel_date_from, travel_date_to, estimated_amount, purpose_of_travel, status)
     SELECT $1, id, 'FLIGHT', 'Mumbai', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', 14500, 'Quarterly client review meeting at Taj Santacruz', 'PENDING'
     FROM mybiz_employees WHERE company_id = $1 AND email = 'rohan.verma@acme.com'
     LIMIT 1`,
    [corpCompanyId]
  );

  // Insert mock invoice
  await client.query(
    `INSERT INTO mybiz_invoices (company_id, invoice_number, amount, tax_amount, total_amount, status, due_date, items)
     VALUES ($1, 'INV-ACME-2026-10', 123051, 22149, 145200, 'PAID', CURRENT_DATE - INTERVAL '5 days', '[{"service": "FLIGHT", "booking_ref": "SSJ-CORP-8821", "traveler": "Arjun Mehta", "amount": 28400}, {"service": "HOTEL", "booking_ref": "SSJ-CORP-9144", "traveler": "Ananya Sen", "amount": 42000}]'::jsonb)
     ON CONFLICT (invoice_number) DO NOTHING`,
    [corpCompanyId]
  );

  // ==========================================
  // 3. MOCK MYBIZ TRAVEL AGENCY ACCOUNT
  // ==========================================
  const agencyEmail = 'agency.admin@ssjourney.com';
  const agencyPass = await bcrypt.hash('AgencyPass123!', 10);

  let agencyUserRes = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [agencyEmail]);
  let agencyUserId;
  if (agencyUserRes.rows.length === 0) {
    const insUser = await client.query(
      `INSERT INTO users (email, hashed_password, full_name, phone, role, is_active, is_verified)
       VALUES ($1, $2, 'Sunita Chawla', '+91 98222 77788', 'AGENCY_ADMIN', true, true)
       RETURNING id`,
      [agencyEmail, agencyPass]
    );
    agencyUserId = insUser.rows[0].id;
  } else {
    agencyUserId = agencyUserRes.rows[0].id;
    await client.query(
      'UPDATE users SET hashed_password = $1, role = \'AGENCY_ADMIN\', is_active = true WHERE id = $2',
      [agencyPass, agencyUserId]
    );
  }
  console.log('Agency User ID:', agencyUserId);

  let agencyCompRes = await client.query('SELECT id FROM mybiz_companies WHERE billing_email = $1', [agencyEmail]);
  let agencyCompanyId;
  if (agencyCompRes.rows.length === 0) {
    const insComp = await client.query(
      `INSERT INTO mybiz_companies (
         name, account_type, billing_email, contact_person_name, contact_person_phone,
         gstin, pan, industry, company_size, address, city, state, country, postal_code,
         credit_limit, used_credit, verification_status, verified_at, is_active
       ) VALUES (
         'Skyline Horizons Travel Agency', 'AGENCY', $1, 'Sunita Chawla', '+91 98222 77788',
         '27AAACS5678B1Z2', 'AAACS5678B', 'Travel & Tourism', '11-50',
         'Nariman Point Business Chambers', 'Mumbai', 'Maharashtra', 'India', '400021',
         1000000, 320000, 'VERIFIED', NOW(), true
       ) RETURNING id`,
      [agencyEmail]
    );
    agencyCompanyId = insComp.rows[0].id;
  } else {
    agencyCompanyId = agencyCompRes.rows[0].id;
    await client.query(
      `UPDATE mybiz_companies SET
         name = 'Skyline Horizons Travel Agency',
         account_type = 'AGENCY',
         verification_status = 'VERIFIED',
         credit_limit = 1000000,
         used_credit = 320000,
         verified_at = NOW(),
         is_active = true
       WHERE id = $1`,
      [agencyCompanyId]
    );
  }
  console.log('Agency Company ID:', agencyCompanyId);

  // Clean previous employees for this agency
  await client.query('DELETE FROM mybiz_employees WHERE company_id = $1', [agencyCompanyId]);

  // Insert agency admin
  await client.query(
    `INSERT INTO mybiz_employees (company_id, user_id, email, full_name, department, designation, role, status, commission_rate, booking_permission)
     VALUES ($1, $2, $3, 'Sunita Chawla', 'Operations', 'Agency Principal', 'BIZ_ADMIN', 'ACTIVE', 10.0, 'FULL_BOOKING')`,
    [agencyCompanyId, agencyUserId, agencyEmail]
  );

  // Insert sub-agents
  await client.query(
    `INSERT INTO mybiz_employees (company_id, email, full_name, department, designation, role, status, commission_rate, booking_permission)
     VALUES
     ($1, 'karan.singh@skyline.com', 'Karan Singh', 'Ticketing', 'Senior Ticketing Agent', 'BIZ_EMPLOYEE', 'ACTIVE', 7.5, 'FULL_BOOKING'),
     ($1, 'neha.patel@skyline.com', 'Neha Patel', 'Corporate Desk', 'Corporate Booking Specialist', 'BIZ_EMPLOYEE', 'ACTIVE', 5.0, 'FULL_BOOKING')`,
    [agencyCompanyId]
  );

  await client.end();
  console.log('>>> ALL MOCK ACCOUNTS SEEDED SUCCESSFULLY! <<<');
}

seedMocks().catch(e => {
  console.error('Error seeding mocks:', e);
  process.exit(1);
});
