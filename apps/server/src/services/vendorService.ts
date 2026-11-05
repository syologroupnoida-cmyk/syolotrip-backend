import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { query } from '../db/index.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'kyc');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed MIME types and max size (10 MB)
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface VendorRegisterPayload {
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  password: string;
  property_type: 'Hotel' | 'Homestay' | string;
  city: string;
  state: string;
  agree_terms: boolean;
}

export interface KYCDocumentInput {
  section: 'IDENTITY' | 'ADDRESS' | 'OWNERSHIP' | 'ADDITIONAL';
  document_type: string;
  document_number_masked?: string;
  file_name: string;
  mime_type: string;
  base64_data: string; // base64 payload
}

export interface KYCSubmissionPayload {
  business_structure: 'INDIVIDUAL' | 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLP' | 'PRIVATE_LIMITED';
  legal_business_name: string;
  trade_name?: string;
  gstin?: string;
  pan_number?: string;
  registered_address: string;
  city: string;
  state: string;
  pincode: string;
  submission_notes?: string;
  documents: KYCDocumentInput[];
}

export interface VendorPropertyPayload {
  name: string;
  property_type: 'HOTEL' | 'HOMESTAY';
  star_rating?: number;
  address: string;
  city: string;
  state?: string;
  country?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  overview: string;
  amenities?: string[];
  featured_image: string;
  images?: string[];
  starting_price: number;
  rooms: Array<{
    room_type: string;
    bed_type?: string;
    max_occupancy?: number;
    price_per_night: number;
    taxes_per_night?: number;
    available_rooms?: number;
    amenities?: string[];
  }>;
}

/**
 * 1. Register a new Property Vendor
 */
export async function registerVendor(payload: VendorRegisterPayload) {
  const { full_name, business_name, email, phone, password, property_type, city, state, agree_terms } = payload;

  if (!email || !password || !full_name || !business_name) {
    throw new Error('Full Name, Business Name, Email and Password are required');
  }
  if (!agree_terms) {
    throw new Error('Acceptance of Terms & Conditions and Privacy Policy is required');
  }

  // Check existing user
  const existingUser = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
  if (existingUser.rows.length > 0) {
    throw new Error('An account with this email address already exists. Please log in.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const normalizedPropType = property_type?.toUpperCase().includes('HOMESTAY') ? 'HOMESTAY' : 'HOTEL';

  // 1. Create User with role PARTNER
  const userRes = await query(
    `INSERT INTO users (email, hashed_password, full_name, phone, role, is_active, is_verified)
     VALUES ($1, $2, $3, $4, 'PARTNER', true, false)
     RETURNING id, email, full_name, role`,
    [email.trim().toLowerCase(), hashedPassword, full_name.trim(), phone.trim()]
  );
  const user = userRes.rows[0];

  // 2. Create Partner Profile with unverified KYC
  const partnerRes = await query(
    `INSERT INTO partner_profiles (
       user_id, business_name, owner_name, business_type, property_type,
       phone, city, state, status, onboarding_status, kyc_status, is_verified
     )
     VALUES ($1, $2, $3, 'HOTELIER', $4, $5, $6, $7, 'PENDING', 'REGISTERED', 'KYC_INCOMPLETE', false)
     RETURNING *`,
    [user.id, business_name.trim(), full_name.trim(), normalizedPropType, phone.trim(), city.trim(), state?.trim() || '']
  );
  const partner = partnerRes.rows[0];

  // 3. Create Persistent Admin Notification
  await query(
    `INSERT INTO admin_notifications (title, message, type, vendor_id, link_url)
     VALUES ($1, $2, 'VENDOR_REGISTERED', $3, $4)`,
    [
      `New Vendor Registration: ${business_name}`,
      `${full_name} registered a new ${normalizedPropType} vendor account (${email}). KYC is pending submission.`,
      partner.id,
      `/admin/vendors/${partner.id}`
    ]
  );

  // 4. Create Vendor Welcome Notification
  await query(
    `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type)
     VALUES ($1, $2, $3, $4, 'REGISTRATION')`,
    [
      partner.id,
      user.id,
      'Welcome to SS Journey Partner Program!',
      'Your vendor account has been created. Please complete your KYC verification to unlock property listing access.'
    ]
  );

  // 5. Log Audit Trail
  await query(
    `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
     VALUES ('VENDOR', $1, 'REGISTER', $2, 'PARTNER', $3)`,
    [partner.id, user.id, JSON.stringify({ business_name, property_type: normalizedPropType, email })]
  );

  return { user, partner };
}

/**
 * 2. Get Vendor Dashboard Overview
 */
export async function getVendorDashboardOverview(userId: string) {
  const partnerRes = await query('SELECT * FROM partner_profiles WHERE user_id = $1', [userId]);
  if (partnerRes.rows.length === 0) {
    throw new Error('Vendor partner profile not found');
  }
  const partner = partnerRes.rows[0];

  // Properties stats
  const propRes = await query(
    `SELECT 
       COUNT(*) as total_properties,
       COUNT(CASE WHEN publication_status = 'APPROVED' THEN 1 END) as approved_properties,
       COUNT(CASE WHEN publication_status IN ('SUBMITTED', 'UNDER_REVIEW') THEN 1 END) as pending_properties,
       COUNT(CASE WHEN publication_status = 'REJECTED' THEN 1 END) as rejected_properties
     FROM hotels WHERE partner_id = $1`,
    [partner.id]
  );
  const stats = propRes.rows[0];

  // Recent 5 properties
  const recentPropsRes = await query(
    `SELECT id, name, property_type, city, starting_price, publication_status, admin_rejection_reason, created_at
     FROM hotels WHERE partner_id = $1
     ORDER BY created_at DESC LIMIT 5`,
    [partner.id]
  );

  // Unread notifications count
  const notifRes = await query(
    `SELECT COUNT(*) as unread_count FROM vendor_notifications WHERE vendor_id = $1 AND is_read = false`,
    [partner.id]
  );

  // Latest KYC application status
  const kycRes = await query(
    `SELECT id, status, legal_business_name, submitted_at, reviewed_at, rejection_reason, admin_review_notes
     FROM vendor_kyc_applications WHERE vendor_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [partner.id]
  );
  const latestKyc = kycRes.rows[0] || null;

  // Onboarding checklist
  const isKycApproved = partner.kyc_status === 'KYC_APPROVED' && partner.is_verified;
  const isKycSubmitted = partner.kyc_status === 'KYC_SUBMITTED' || partner.kyc_status === 'PENDING_REVIEW';
  const hasProperties = parseInt(stats.total_properties, 10) > 0;

  const onboardingChecklist = [
    { id: 'registration', title: 'Vendor Account Registration', status: 'COMPLETED', step: 1 },
    { id: 'profile', title: 'Business Profile Information', status: 'COMPLETED', step: 2 },
    {
      id: 'kyc',
      title: 'KYC Document Verification',
      status: isKycApproved ? 'COMPLETED' : isKycSubmitted ? 'UNDER_REVIEW' : 'PENDING',
      step: 3,
    },
    {
      id: 'admin_review',
      title: 'Admin Identity Clearance',
      status: isKycApproved ? 'COMPLETED' : isKycSubmitted ? 'UNDER_REVIEW' : 'LOCKED',
      step: 4,
    },
    {
      id: 'property_listing',
      title: 'List Hotel / Homestay Properties',
      status: isKycApproved ? (hasProperties ? 'COMPLETED' : 'UNLOCKED') : 'LOCKED',
      step: 5,
    },
  ];

  return {
    partner: {
      id: partner.id,
      userId: partner.user_id,
      businessName: partner.business_name,
      ownerName: partner.owner_name,
      propertyType: partner.property_type,
      city: partner.city,
      state: partner.state,
      phone: partner.phone,
      onboardingStatus: partner.onboarding_status,
      kycStatus: partner.kyc_status,
      isVerified: partner.is_verified,
      propertyListingUnlocked: isKycApproved,
      createdAt: partner.created_at,
    },
    stats: {
      totalProperties: parseInt(stats.total_properties, 10) || 0,
      approvedProperties: parseInt(stats.approved_properties, 10) || 0,
      pendingProperties: parseInt(stats.pending_properties, 10) || 0,
      rejectedProperties: parseInt(stats.rejected_properties, 10) || 0,
      unreadNotifications: parseInt(notifRes.rows[0]?.unread_count, 10) || 0,
    },
    latestKyc,
    onboardingChecklist,
    recentProperties: recentPropsRes.rows,
  };
}

/**
 * 3. Update Vendor Profile
 */
export async function updateVendorProfile(userId: string, payload: {
  business_name?: string;
  owner_name?: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
}) {
  const partnerRes = await query('SELECT id FROM partner_profiles WHERE user_id = $1', [userId]);
  if (partnerRes.rows.length === 0) {
    throw new Error('Vendor partner profile not found');
  }
  const partnerId = partnerRes.rows[0].id;

  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (payload.business_name) {
    updates.push(`business_name = $${idx++}`);
    values.push(payload.business_name.trim());
  }
  if (payload.owner_name) {
    updates.push(`owner_name = $${idx++}`);
    values.push(payload.owner_name.trim());
  }
  if (payload.phone) {
    updates.push(`phone = $${idx++}`);
    values.push(payload.phone.trim());
  }
  if (payload.city) {
    updates.push(`city = $${idx++}`);
    values.push(payload.city.trim());
  }
  if (payload.state) {
    updates.push(`state = $${idx++}`);
    values.push(payload.state.trim());
  }
  if (payload.address) {
    updates.push(`address = $${idx++}`);
    values.push(payload.address.trim());
  }

  if (updates.length === 0) {
    const current = await query('SELECT * FROM partner_profiles WHERE id = $1', [partnerId]);
    return current.rows[0];
  }

  updates.push(`updated_at = NOW()`);
  values.push(partnerId);

  const updatedRes = await query(
    `UPDATE partner_profiles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return updatedRes.rows[0];
}

/**
 * 4. Submit or Resubmit Flexible KYC Application
 */
export async function submitKYCApplication(userId: string, payload: KYCSubmissionPayload) {
  const partnerRes = await query('SELECT * FROM partner_profiles WHERE user_id = $1', [userId]);
  if (partnerRes.rows.length === 0) {
    throw new Error('Vendor partner profile not found');
  }
  const partner = partnerRes.rows[0];

  const {
    business_structure,
    legal_business_name,
    trade_name,
    gstin,
    pan_number,
    registered_address,
    city,
    state,
    pincode,
    submission_notes,
    documents = []
  } = payload;

  if (!legal_business_name || !registered_address || !city || !state || !pincode) {
    throw new Error('Legal Business Name, Address, City, State and Pincode are required');
  }

  if (documents.length === 0) {
    throw new Error('At least one identity or ownership document must be uploaded');
  }

  // 1. Create KYC Application
  const appRes = await query(
    `INSERT INTO vendor_kyc_applications (
       vendor_id, user_id, business_structure, legal_business_name, trade_name,
       gstin, pan_number, registered_address, city, state, pincode,
       status, submission_notes, submitted_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING_REVIEW', $12, NOW())
     RETURNING *`,
    [
      partner.id,
      userId,
      business_structure || 'INDIVIDUAL',
      legal_business_name.trim(),
      trade_name?.trim() || null,
      gstin?.trim() || null,
      pan_number?.trim() || null,
      registered_address.trim(),
      city.trim(),
      state.trim(),
      pincode.trim(),
      submission_notes?.trim() || null
    ]
  );
  const application = appRes.rows[0];

  // 2. Process and Save Encrypted / Masked Documents
  const savedDocuments = [];
  for (const doc of documents) {
    if (!doc.file_name || !doc.base64_data) continue;

    // Validate mime type
    const mime = doc.mime_type?.toLowerCase() || 'application/pdf';
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      throw new Error(`Invalid file type for ${doc.file_name}. Only PDF, JPG, JPEG, and PNG are supported.`);
    }

    // Strip data URI prefix if present
    const base64Clean = doc.base64_data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File ${doc.file_name} exceeds the maximum allowed size of 10 MB.`);
    }

    // Secure random storage filename
    const fileExt = mime.includes('pdf') ? '.pdf' : mime.includes('png') ? '.png' : '.jpg';
    const secureStorageFileName = `kyc_${partner.id}_${crypto.randomBytes(16).toString('hex')}${fileExt}`;
    const destinationPath = path.join(UPLOADS_DIR, secureStorageFileName);

    await fs.promises.writeFile(destinationPath, buffer);

    // Save metadata
    const docRes = await query(
      `INSERT INTO vendor_kyc_documents (
         application_id, vendor_id, document_section, document_type,
         document_number_masked, file_name, file_path, file_size, mime_type, verification_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
       RETURNING id, document_section, document_type, document_number_masked, file_name, file_size, mime_type, verification_status`,
      [
        application.id,
        partner.id,
        doc.section || 'IDENTITY',
        doc.document_type || 'ID_PROOF',
        doc.document_number_masked || 'XXXX-XXXX-MASKED',
        doc.file_name,
        destinationPath,
        buffer.length,
        mime
      ]
    );
    savedDocuments.push(docRes.rows[0]);
  }

  // 3. Update Partner Profile KYC status
  await query(
    `UPDATE partner_profiles
     SET kyc_status = 'KYC_SUBMITTED', onboarding_status = 'PENDING_REVIEW', kyc_submitted_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [partner.id]
  );

  // 4. Create Persistent Admin Notification
  await query(
    `INSERT INTO admin_notifications (title, message, type, vendor_id, link_url)
     VALUES ($1, $2, 'KYC_SUBMITTED', $3, $4)`,
    [
      `KYC Submitted: ${legal_business_name}`,
      `Vendor ${partner.business_name} submitted ${savedDocuments.length} KYC documents for verification.`,
      partner.id,
      `/admin/vendors/${partner.id}`
    ]
  );

  // 5. Create Vendor Notification
  await query(
    `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type, reference_id)
     VALUES ($1, $2, $3, $4, 'KYC_SUBMITTED', $5)`,
    [
      partner.id,
      userId,
      'KYC Application Submitted',
      'Your KYC verification application has been submitted and is currently under review by our compliance team. We will notify you once verified.',
      application.id
    ]
  );

  // 6. Audit Trail
  await query(
    `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
     VALUES ('KYC', $1, 'KYC_SUBMIT', $2, 'PARTNER', $3)`,
    [application.id, userId, JSON.stringify({ documentsCount: savedDocuments.length, legalName: legal_business_name })]
  );

  return { application, documents: savedDocuments };
}

/**
 * 5. Get KYC Status and Documents for Vendor
 */
export async function getVendorKYCDetails(userId: string) {
  const partnerRes = await query('SELECT id, kyc_status, onboarding_status, rejection_reason FROM partner_profiles WHERE user_id = $1', [userId]);
  if (partnerRes.rows.length === 0) {
    throw new Error('Vendor partner profile not found');
  }
  const partner = partnerRes.rows[0];

  const appRes = await query(
    `SELECT * FROM vendor_kyc_applications WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [partner.id]
  );
  const application = appRes.rows[0] || null;

  let documents: any[] = [];
  if (application) {
    const docsRes = await query(
      `SELECT id, document_section, document_type, document_number_masked, file_name, file_size, mime_type, verification_status, created_at
       FROM vendor_kyc_documents WHERE application_id = $1 ORDER BY created_at ASC`,
      [application.id]
    );
    documents = docsRes.rows;
  }

  return {
    kycStatus: partner.kyc_status,
    onboardingStatus: partner.onboarding_status,
    application,
    documents,
  };
}

/**
 * 6. Create Vendor Property (Strictly Blocked Until KYC Approval!)
 */
export async function createVendorProperty(userId: string, payload: VendorPropertyPayload) {
  const partnerRes = await query('SELECT * FROM partner_profiles WHERE user_id = $1', [userId]);
  if (partnerRes.rows.length === 0) {
    throw new Error('Vendor partner profile not found');
  }
  const partner = partnerRes.rows[0];

  // ── STRICT BUSINESS GATE: KYC MUST BE APPROVED BEFORE LISTING PROPERTIES ──
  if (partner.kyc_status !== 'KYC_APPROVED' || !partner.is_verified) {
    const err = new Error(
      'Property listing is locked. You must complete your KYC verification and receive admin approval before creating property listings.'
    );
    (err as any).statusCode = 403;
    throw err;
  }

  const {
    name,
    property_type = 'HOTEL',
    star_rating = 4,
    address,
    city,
    state = '',
    country = 'India',
    neighborhood = '',
    latitude = null,
    longitude = null,
    overview,
    amenities = ['Free WiFi', 'Air Conditioning', 'Room Service', 'Daily Housekeeping'],
    featured_image,
    images = [],
    starting_price,
    rooms = []
  } = payload;

  if (!name || !address || !city || !overview || !starting_price || !featured_image) {
    throw new Error('Property Name, Address, City, Overview, Starting Price, and Featured Image are required');
  }

  const normPropType = property_type?.toUpperCase().includes('HOMESTAY') ? 'HOMESTAY' : 'HOTEL';

  // 1. Insert Hotel Record with publication_status = 'SUBMITTED'
  const hotelRes = await query(
    `INSERT INTO hotels (
       name, property_type, partner_id, publication_status, star_rating,
       address, city, state, country, neighborhood, latitude, longitude,
       overview, amenities, tags, featured_image, images, starting_price,
       currency, is_simulated, is_active, submission_date
     )
     VALUES ($1, $2, $3, 'SUBMITTED', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'INR', false, false, NOW())
     RETURNING *`,
    [
      name.trim(),
      normPropType,
      partner.id,
      star_rating,
      address.trim(),
      city.trim(),
      state.trim(),
      country,
      neighborhood?.trim() || null,
      latitude,
      longitude,
      overview.trim(),
      JSON.stringify(amenities),
      JSON.stringify([normPropType, city.trim()]),
      featured_image,
      JSON.stringify(images),
      starting_price
    ]
  );
  const property = hotelRes.rows[0];

  // 2. Insert Room Categories if provided
  const createdRooms = [];
  if (rooms && rooms.length > 0) {
    for (const r of rooms) {
      const roomRes = await query(
        `INSERT INTO hotel_rooms (
           hotel_id, room_type, bed_type, max_occupancy, price_per_night,
           taxes_per_night, available_rooms, amenities, is_available
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING *`,
        [
          property.id,
          r.room_type || 'Standard Room',
          r.bed_type || 'King Bed',
          r.max_occupancy || 2,
          r.price_per_night || starting_price,
          r.taxes_per_night || 0,
          r.available_rooms || 5,
          JSON.stringify(r.amenities || ['Free WiFi', 'Air Conditioning'])
        ]
      );
      createdRooms.push(roomRes.rows[0]);
    }
  } else {
    // Insert a default standard room category
    const roomRes = await query(
      `INSERT INTO hotel_rooms (
         hotel_id, room_type, bed_type, max_occupancy, price_per_night, taxes_per_night, available_rooms, amenities, is_available
       )
       VALUES ($1, 'Standard Room', 'King Bed', 2, $2, 0, 5, $3, true)
       RETURNING *`,
      [property.id, starting_price, JSON.stringify(['Free WiFi', 'Air Conditioning'])]
    );
    createdRooms.push(roomRes.rows[0]);
  }

  // 3. Persistent Admin Notification for Property Approval Request
  await query(
    `INSERT INTO admin_notifications (title, message, type, vendor_id, property_id, link_url)
     VALUES ($1, $2, 'PROPERTY_SUBMITTED', $3, $4, $5)`,
    [
      `Property Submitted for Review: ${name}`,
      `Vendor ${partner.business_name} submitted new ${normPropType} "${name}" in ${city} for admin review.`,
      partner.id,
      property.id,
      `/admin/properties/${property.id}`
    ]
  );

  // 4. Vendor Notification
  await query(
    `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type, reference_id)
     VALUES ($1, $2, $3, $4, 'PROPERTY_SUBMITTED', $5)`,
    [
      partner.id,
      userId,
      'Property Submitted for Review',
      `Your property "${name}" has been submitted for admin review. Once approved, it will be published and available for travelers to book.`,
      property.id
    ]
  );

  // 5. Audit Trail
  await query(
    `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
     VALUES ('PROPERTY', $1, 'PROPERTY_SUBMIT', $2, 'PARTNER', $3)`,
    [property.id, userId, JSON.stringify({ propertyName: name, roomsCount: createdRooms.length })]
  );

  return { property, rooms: createdRooms };
}

/**
 * 7. Get Vendor's Properties
 */
export async function getVendorProperties(userId: string) {
  const partnerRes = await query('SELECT id FROM partner_profiles WHERE user_id = $1', [userId]);
  if (partnerRes.rows.length === 0) {
    return [];
  }
  const partnerId = partnerRes.rows[0].id;

  const propsRes = await query(
    `SELECT h.*, 
            COUNT(r.id) as room_categories_count
     FROM hotels h
     LEFT JOIN hotel_rooms r ON r.hotel_id = h.id
     WHERE h.partner_id = $1
     GROUP BY h.id
     ORDER BY h.created_at DESC`,
    [partnerId]
  );

  return propsRes.rows;
}

/**
 * 8. Get Vendor Notifications
 */
export async function getVendorNotifications(userId: string) {
  const partnerRes = await query('SELECT id FROM partner_profiles WHERE user_id = $1', [userId]);
  if (partnerRes.rows.length === 0) {
    return [];
  }
  const partnerId = partnerRes.rows[0].id;

  const notifRes = await query(
    `SELECT * FROM vendor_notifications WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [partnerId]
  );

  return notifRes.rows;
}

/**
 * 9. Mark Vendor Notification Read
 */
export async function markVendorNotificationRead(userId: string, notificationId: string) {
  const partnerRes = await query('SELECT id FROM partner_profiles WHERE user_id = $1', [userId]);
  if (partnerRes.rows.length === 0) return;

  await query(
    `UPDATE vendor_notifications SET is_read = true WHERE id = $1 AND vendor_id = $2`,
    [notificationId, partnerRes.rows[0].id]
  );
}
