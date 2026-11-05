import { query } from '../db/index.js';

export interface AdminVendorFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * 1. List Vendor Applications for Admin
 */
export async function getAdminVendorApplications(filters: AdminVendorFilters = {}) {
  const { search, status, page = 1, limit = 20 } = filters;
  const offset = (Math.max(1, page) - 1) * limit;

  const conditions: string[] = ['1=1'];
  const values: any[] = [];
  let idx = 1;

  if (search) {
    conditions.push(`(p.business_name ILIKE $${idx} OR u.email ILIKE $${idx} OR p.owner_name ILIKE $${idx} OR p.city ILIKE $${idx})`);
    values.push(`%${search.trim()}%`);
    idx++;
  }

  if (status && status !== 'ALL') {
    if (status === 'PENDING_REVIEW' || status === 'PENDING') {
      conditions.push(`(p.kyc_status IN ('KYC_SUBMITTED', 'PENDING_REVIEW') OR p.onboarding_status = 'PENDING_REVIEW')`);
    } else if (status === 'APPROVED') {
      conditions.push(`(p.kyc_status = 'KYC_APPROVED' AND p.is_verified = true)`);
    } else if (status === 'REJECTED') {
      conditions.push(`p.kyc_status = 'KYC_REJECTED'`);
    } else if (status === 'SUSPENDED') {
      conditions.push(`p.onboarding_status = 'ACCOUNT_SUSPENDED'`);
    } else {
      conditions.push(`p.kyc_status = $${idx++}`);
      values.push(status);
    }
  }

  const whereClause = conditions.join(' AND ');

  const countRes = await query(
    `SELECT COUNT(*) as total
     FROM partner_profiles p
     JOIN users u ON p.user_id = u.id
     WHERE ${whereClause}`,
    values
  );
  const total = parseInt(countRes.rows[0].total || '0', 10);

  const dataRes = await query(
    `SELECT 
       p.id, p.user_id, p.business_name, p.owner_name, p.property_type,
       p.phone, p.city, p.state, p.country, p.status, p.onboarding_status,
       p.kyc_status, p.is_verified, p.rejection_reason, p.created_at, p.kyc_submitted_at,
       u.email as user_email, u.full_name as user_full_name,
       (SELECT COUNT(*) FROM hotels h WHERE h.partner_id = p.id) as properties_count,
       (SELECT COUNT(*) FROM vendor_kyc_documents d WHERE d.vendor_id = p.id) as documents_count
     FROM partner_profiles p
     JOIN users u ON p.user_id = u.id
     WHERE ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return {
    items: dataRes.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 2. Get Detailed Vendor Application
 */
export async function getAdminVendorDetails(vendorId: string) {
  const vendorRes = await query(
    `SELECT 
       p.*, u.email as user_email, u.full_name as user_full_name, u.role as user_role
     FROM partner_profiles p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $1`,
    [vendorId]
  );
  if (vendorRes.rows.length === 0) {
    throw new Error('Vendor application not found');
  }
  const vendor = vendorRes.rows[0];

  // KYC Application
  const kycRes = await query(
    `SELECT * FROM vendor_kyc_applications WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [vendorId]
  );
  const kycApplication = kycRes.rows[0] || null;

  // KYC Documents
  let documents: any[] = [];
  if (kycApplication) {
    const docsRes = await query(
      `SELECT id, document_section, document_type, document_number_masked, file_name, file_size, mime_type, verification_status, created_at
       FROM vendor_kyc_documents WHERE application_id = $1 ORDER BY created_at ASC`,
      [kycApplication.id]
    );
    documents = docsRes.rows;
  }

  // Vendor Properties
  const propsRes = await query(
    `SELECT h.*, COUNT(r.id) as rooms_count
     FROM hotels h
     LEFT JOIN hotel_rooms r ON r.hotel_id = h.id
     WHERE h.partner_id = $1
     GROUP BY h.id
     ORDER BY h.created_at DESC`,
    [vendorId]
  );

  // Audit Logs
  const auditRes = await query(
    `SELECT a.*, u.email as actor_email
     FROM vendor_audit_logs a
     LEFT JOIN users u ON a.actor_id = u.id
     WHERE a.entity_id = $1 OR a.entity_id = $2
     ORDER BY a.created_at DESC LIMIT 20`,
    [vendorId, kycApplication?.id || vendorId]
  );

  return {
    vendor,
    kycApplication,
    documents,
    properties: propsRes.rows,
    auditLogs: auditRes.rows,
  };
}

/**
 * 3. Review Vendor KYC Application (Approve, Reject, or Request Info)
 */
export async function reviewVendorKYC(
  adminUserId: string,
  vendorId: string,
  payload: {
    action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
    reason?: string;
    notes?: string;
  }
) {
  const { action, reason, notes } = payload;

  const vendorRes = await query('SELECT * FROM partner_profiles WHERE id = $1', [vendorId]);
  if (vendorRes.rows.length === 0) {
    throw new Error('Vendor profile not found');
  }
  const vendor = vendorRes.rows[0];

  const kycRes = await query(
    'SELECT id FROM vendor_kyc_applications WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 1',
    [vendorId]
  );
  const kycAppId = kycRes.rows[0]?.id;

  if (action === 'APPROVE') {
    // 1. Update Partner Profile
    await query(
      `UPDATE partner_profiles
       SET kyc_status = 'KYC_APPROVED',
           onboarding_status = 'APPROVED',
           status = 'ACTIVE',
           is_verified = true,
           kyc_approved_at = NOW(),
           kyc_reviewed_by = $1,
           admin_notes = $2,
           rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $3`,
      [adminUserId, notes || 'KYC approved by admin.', vendorId]
    );

    // 2. Update KYC Application if exists
    if (kycAppId) {
      await query(
        `UPDATE vendor_kyc_applications
         SET status = 'APPROVED',
             reviewed_at = NOW(),
             reviewed_by = $1,
             admin_review_notes = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [adminUserId, notes || 'Approved', kycAppId]
      );
    }

    // 3. Persistent Vendor Notification
    await query(
      `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type)
       VALUES ($1, $2, 'KYC Approved — Property Listing Unlocked!', 'Congratulations! Your KYC verification has been approved. You now have full access to list your hotel and homestay properties.', 'KYC_APPROVED')`,
      [vendorId, vendor.user_id]
    );

    // 4. Audit Log
    await query(
      `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
       VALUES ('KYC', $1, 'KYC_APPROVE', $2, 'ADMIN', $3)`,
      [vendorId, adminUserId, JSON.stringify({ action: 'APPROVE', notes })]
    );

    return { success: true, message: 'Vendor KYC approved successfully. Property listing is now unlocked.' };
  } else if (action === 'REJECT') {
    if (!reason || !reason.trim()) {
      throw new Error('A detailed rejection reason is mandatory when rejecting KYC.');
    }

    await query(
      `UPDATE partner_profiles
       SET kyc_status = 'KYC_REJECTED',
           onboarding_status = 'REJECTED',
           is_verified = false,
           rejection_reason = $1,
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [reason.trim(), notes || null, vendorId]
    );

    if (kycAppId) {
      await query(
        `UPDATE vendor_kyc_applications
         SET status = 'REJECTED',
             rejection_reason = $1,
             admin_review_notes = $2,
             reviewed_at = NOW(),
             reviewed_by = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [reason.trim(), notes || null, adminUserId, kycAppId]
      );
    }

    // Vendor notification with reason
    await query(
      `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type)
       VALUES ($1, $2, 'KYC Verification Needs Correction', $3, 'KYC_REJECTED')`,
      [
        vendorId,
        vendor.user_id,
        `Your KYC application was not approved. Reason: ${reason.trim()}. Please review your documents and resubmit.`,
      ]
    );

    await query(
      `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
       VALUES ('KYC', $1, 'KYC_REJECT', $2, 'ADMIN', $3)`,
      [vendorId, adminUserId, JSON.stringify({ action: 'REJECT', reason: reason.trim() })]
    );

    return { success: true, message: 'Vendor KYC rejected. Notification sent to vendor.' };
  } else if (action === 'REQUEST_INFO') {
    if (!notes || !notes.trim()) {
      throw new Error('Please specify the additional documents or information required.');
    }

    await query(
      `UPDATE partner_profiles
       SET kyc_status = 'ADDITIONAL_INFORMATION_REQUIRED',
           admin_notes = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [notes.trim(), vendorId]
    );

    if (kycAppId) {
      await query(
        `UPDATE vendor_kyc_applications
         SET status = 'ADDITIONAL_INFO_REQUIRED',
             admin_review_notes = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [notes.trim(), kycAppId]
      );
    }

    await query(
      `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type)
       VALUES ($1, $2, 'Additional KYC Documents Required', $3, 'ADDITIONAL_INFO_REQUIRED')`,
      [vendorId, vendor.user_id, `Additional information requested: ${notes.trim()}`]
    );

    await query(
      `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
       VALUES ('KYC', $1, 'KYC_REQUEST_INFO', $2, 'ADMIN', $3)`,
      [vendorId, adminUserId, JSON.stringify({ action: 'REQUEST_INFO', notes: notes.trim() })]
    );

    return { success: true, message: 'Request for additional information sent to vendor.' };
  }

  throw new Error(`Unknown review action: ${action}`);
}

/**
 * 4. Suspend or Reinstate Vendor Account
 */
export async function toggleVendorSuspension(adminUserId: string, vendorId: string, suspend: boolean, reason?: string) {
  const newStatus = suspend ? 'ACCOUNT_SUSPENDED' : 'APPROVED';

  await query(
    `UPDATE partner_profiles
     SET onboarding_status = $1,
         status = $2,
         admin_notes = $3,
         updated_at = NOW()
     WHERE id = $4`,
    [newStatus, suspend ? 'SUSPENDED' : 'ACTIVE', reason || null, vendorId]
  );

  // Deactivate or reactivate vendor's properties
  await query(
    `UPDATE hotels SET is_active = $1 WHERE partner_id = $2`,
    [!suspend, vendorId]
  );

  const vendor = (await query('SELECT user_id, business_name FROM partner_profiles WHERE id = $1', [vendorId])).rows[0];

  if (vendor) {
    await query(
      `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type)
       VALUES ($1, $2, $3, $4, 'ACCOUNT_SUSPENDED')`,
      [
        vendorId,
        vendor.user_id,
        suspend ? 'Account Suspended' : 'Account Reinstated',
        suspend
          ? `Your vendor account has been suspended. Reason: ${reason || 'Terms violation / administrative review'}. All active property listings have been temporarily unlisted.`
          : 'Your vendor account has been reinstated. Your approved listings are active again.',
      ]
    );
  }

  await query(
    `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
     VALUES ('VENDOR', $1, $2, $3, 'ADMIN', $4)`,
    [vendorId, suspend ? 'VENDOR_SUSPEND' : 'VENDOR_REINSTATE', adminUserId, JSON.stringify({ suspend, reason })]
  );

  return { success: true, message: `Vendor account ${suspend ? 'suspended' : 'reinstated'}.` };
}

/**
 * 5. List Property Approval Requests for Admin
 */
export async function getAdminPropertyApprovalRequests() {
  const propsRes = await query(
    `SELECT 
       h.*, 
       p.business_name as partner_business_name,
       p.owner_name as partner_owner_name,
       p.phone as partner_phone,
       p.kyc_status as partner_kyc_status,
       COUNT(r.id) as room_count
     FROM hotels h
     JOIN partner_profiles p ON h.partner_id = p.id
     LEFT JOIN hotel_rooms r ON r.hotel_id = h.id
     WHERE h.publication_status IN ('SUBMITTED', 'UNDER_REVIEW')
     GROUP BY h.id, p.id
     ORDER BY h.submission_date DESC NULLS LAST, h.created_at DESC`
  );

  return propsRes.rows;
}

/**
 * 6. Review Vendor Property Submission (Approve or Reject)
 */
export async function reviewVendorProperty(
  adminUserId: string,
  propertyId: string,
  payload: { action: 'APPROVE' | 'REJECT'; reason?: string }
) {
  const { action, reason } = payload;

  const propRes = await query('SELECT * FROM hotels WHERE id = $1', [propertyId]);
  if (propRes.rows.length === 0) {
    throw new Error('Property not found');
  }
  const property = propRes.rows[0];

  if (action === 'APPROVE') {
    await query(
      `UPDATE hotels
       SET publication_status = 'APPROVED',
           is_active = true,
           approved_at = NOW(),
           approved_by_user_id = $1,
           admin_rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [adminUserId, propertyId]
    );

    // Notify vendor
    if (property.partner_id) {
      const pRes = await query('SELECT user_id FROM partner_profiles WHERE id = $1', [property.partner_id]);
      const vendorUserId = pRes.rows[0]?.user_id;
      if (vendorUserId) {
        await query(
          `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type, reference_id)
           VALUES ($1, $2, 'Property Listing Approved & Live!', $3, 'PROPERTY_APPROVED', $4)`,
          [
            property.partner_id,
            vendorUserId,
            `Congratulations! Your property "${property.name}" has been approved by admin and is now live on SS Journey for bookings.`,
            propertyId
          ]
        );
      }
    }

    await query(
      `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
       VALUES ('PROPERTY', $1, 'PROPERTY_APPROVE', $2, 'ADMIN', '{}'::jsonb)`,
      [propertyId, adminUserId]
    );

    return { success: true, message: `Property "${property.name}" approved and live.` };
  } else if (action === 'REJECT') {
    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is mandatory when rejecting a property listing.');
    }

    await query(
      `UPDATE hotels
       SET publication_status = 'REJECTED',
           is_active = false,
           admin_rejection_reason = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [reason.trim(), propertyId]
    );

    if (property.partner_id) {
      const pRes = await query('SELECT user_id FROM partner_profiles WHERE id = $1', [property.partner_id]);
      const vendorUserId = pRes.rows[0]?.user_id;
      if (vendorUserId) {
        await query(
          `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type, reference_id)
           VALUES ($1, $2, 'Property Listing Needs Changes', $3, 'PROPERTY_REJECTED', $4)`,
          [
            property.partner_id,
            vendorUserId,
            `Your property submission "${property.name}" was not approved. Reason: ${reason.trim()}. Please make the required updates and resubmit.`,
            propertyId
          ]
        );
      }
    }

    await query(
      `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
       VALUES ('PROPERTY', $1, 'PROPERTY_REJECT', $2, 'ADMIN', $3)`,
      [propertyId, adminUserId, JSON.stringify({ reason: reason.trim() })]
    );

    return { success: true, message: `Property rejected. Notification sent to vendor.` };
  }

  throw new Error(`Unknown action: ${action}`);
}

/**
 * 7. Get Persistent Admin Notifications
 */
export async function getAdminNotifications() {
  const notifRes = await query(
    `SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 50`
  );
  const unreadRes = await query(
    `SELECT COUNT(*) as unread_count FROM admin_notifications WHERE is_read = false`
  );

  return {
    items: notifRes.rows,
    unreadCount: parseInt(unreadRes.rows[0]?.unread_count || '0', 10),
  };
}

/**
 * 8. Mark Admin Notification Read
 */
export async function markAdminNotificationRead(notificationId: string) {
  await query('UPDATE admin_notifications SET is_read = true WHERE id = $1', [notificationId]);
}

