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
  } else if (action === 'REQUEST_CHANGES') {
    if (!reason || !reason.trim()) {
      throw new Error('Specific feedback/reason is required when requesting property changes.');
    }

    await query(
      `UPDATE hotels
       SET publication_status = 'CHANGES_REQUESTED',
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
           VALUES ($1, $2, 'Property Changes Requested', $3, 'CHANGES_REQUESTED', $4)`,
          [
            property.partner_id,
            vendorUserId,
            `Admin requested updates for "${property.name}": ${reason.trim()}. Please review and update your listing.`,
            propertyId,
          ]
        );
      }
    }

    await query(
      `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
       VALUES ('PROPERTY', $1, 'PROPERTY_REQUEST_CHANGES', $2, 'ADMIN', $3)`,
      [propertyId, adminUserId, JSON.stringify({ reason: reason.trim() })]
    );

    return { success: true, message: `Changes requested for property "${property.name}". Notification sent to vendor.` };
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

/**
 * 9. Mark All Admin Notifications as Read
 */
export async function markAllAdminNotificationsRead() {
  await query('UPDATE admin_notifications SET is_read = true WHERE is_read = false');
}

/**
 * 10. Vendor Overview Dashboard Metrics & Queues
 */
export async function getAdminVendorOverview() {
  const [
    totalVendorsRes,
    newRegRes,
    pendingKycRes,
    approvedVendorsRes,
    rejectedVendorsRes,
    suspendedVendorsRes,
    totalPropertiesRes,
    pendingPropertiesRes,
    approvedPropertiesRes,
    rejectedPropertiesRes,
    unreadNotifRes,
    recentVendorsRes,
    pendingApprovalsRes,
    recentActivityRes,
  ] = await Promise.all([
    query('SELECT COUNT(*) as c FROM partner_profiles'),
    query("SELECT COUNT(*) as c FROM partner_profiles WHERE created_at >= NOW() - INTERVAL '30 days'"),
    query("SELECT COUNT(*) as c FROM partner_profiles WHERE kyc_status IN ('KYC_SUBMITTED', 'PENDING_REVIEW')"),
    query("SELECT COUNT(*) as c FROM partner_profiles WHERE kyc_status = 'KYC_APPROVED' AND is_verified = true"),
    query("SELECT COUNT(*) as c FROM partner_profiles WHERE kyc_status = 'KYC_REJECTED'"),
    query("SELECT COUNT(*) as c FROM partner_profiles WHERE onboarding_status = 'ACCOUNT_SUSPENDED' OR status = 'SUSPENDED'"),
    query('SELECT COUNT(*) as c FROM hotels WHERE partner_id IS NOT NULL'),
    query("SELECT COUNT(*) as c FROM hotels WHERE partner_id IS NOT NULL AND publication_status IN ('SUBMITTED', 'UNDER_REVIEW')"),
    query("SELECT COUNT(*) as c FROM hotels WHERE partner_id IS NOT NULL AND publication_status = 'APPROVED'"),
    query("SELECT COUNT(*) as c FROM hotels WHERE partner_id IS NOT NULL AND publication_status = 'REJECTED'"),
    query('SELECT COUNT(*) as c FROM admin_notifications WHERE is_read = false'),
    // Recent 5 registered vendors
    query(`
      SELECT p.id, p.business_name, p.owner_name, p.phone, p.city, p.state, p.kyc_status, p.onboarding_status, p.created_at, u.email as user_email
      FROM partner_profiles p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 6
    `),
    // Pending Approvals queue (KYC + Properties)
    query(`
      SELECT 
        h.id as item_id,
        h.name as title,
        h.property_type as category,
        h.city,
        h.submission_date as submitted_at,
        h.publication_status as status,
        p.id as vendor_id,
        p.business_name as vendor_name,
        'PROPERTY' as approval_type
      FROM hotels h
      JOIN partner_profiles p ON h.partner_id = p.id
      WHERE h.publication_status IN ('SUBMITTED', 'UNDER_REVIEW')
      UNION ALL
      SELECT
        p.id as item_id,
        p.business_name as title,
        p.property_type as category,
        p.city,
        p.kyc_submitted_at as submitted_at,
        p.kyc_status as status,
        p.id as vendor_id,
        p.business_name as vendor_name,
        'KYC' as approval_type
      FROM partner_profiles p
      WHERE p.kyc_status IN ('KYC_SUBMITTED', 'PENDING_REVIEW')
      ORDER BY submitted_at DESC NULLS LAST
      LIMIT 10
    `),
    // Recent Activity
    query(`
      SELECT a.*, u.email as actor_email
      FROM vendor_audit_logs a
      LEFT JOIN users u ON a.actor_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 12
    `),
  ]);

  const metrics = {
    total_vendors: parseInt(totalVendorsRes.rows[0]?.c || '0', 10),
    new_registrations: parseInt(newRegRes.rows[0]?.c || '0', 10),
    pending_kyc: parseInt(pendingKycRes.rows[0]?.c || '0', 10),
    approved_vendors: parseInt(approvedVendorsRes.rows[0]?.c || '0', 10),
    rejected_vendors: parseInt(rejectedVendorsRes.rows[0]?.c || '0', 10),
    suspended_vendors: parseInt(suspendedVendorsRes.rows[0]?.c || '0', 10),
    total_properties: parseInt(totalPropertiesRes.rows[0]?.c || '0', 10),
    pending_properties: parseInt(pendingPropertiesRes.rows[0]?.c || '0', 10),
    approved_properties: parseInt(approvedPropertiesRes.rows[0]?.c || '0', 10),
    rejected_properties: parseInt(rejectedPropertiesRes.rows[0]?.c || '0', 10),
    unread_notifications: parseInt(unreadNotifRes.rows[0]?.c || '0', 10),
  };

  const badges = {
    applications: metrics.new_registrations,
    kyc: metrics.pending_kyc,
    property_approvals: metrics.pending_properties,
    notifications: metrics.unread_notifications,
  };

  return {
    metrics,
    badges,
    recent_vendors: recentVendorsRes.rows,
    pending_approvals: pendingApprovalsRes.rows,
    recent_activity: recentActivityRes.rows,
  };
}

/**
 * 11. List All Properties Across All Vendors
 */
export async function getAdminAllVendorProperties(filters: {
  search?: string;
  status?: string;
  property_type?: string;
  page?: number;
  limit?: number;
}) {
  const { search, status, property_type, page = 1, limit = 20 } = filters;
  const offset = (Math.max(1, page) - 1) * limit;

  const conditions: string[] = ['h.partner_id IS NOT NULL'];
  const values: any[] = [];
  let idx = 1;

  if (search) {
    conditions.push(`(h.name ILIKE $${idx} OR h.city ILIKE $${idx} OR p.business_name ILIKE $${idx} OR p.owner_name ILIKE $${idx})`);
    values.push(`%${search.trim()}%`);
    idx++;
  }

  if (status && status !== 'ALL') {
    if (status === 'PENDING') {
      conditions.push(`h.publication_status IN ('SUBMITTED', 'UNDER_REVIEW')`);
    } else if (status === 'APPROVED') {
      conditions.push(`h.publication_status = 'APPROVED'`);
    } else if (status === 'REJECTED') {
      conditions.push(`h.publication_status = 'REJECTED'`);
    } else if (status === 'INACTIVE') {
      conditions.push(`(h.is_active = false OR h.publication_status = 'INACTIVE')`);
    } else {
      conditions.push(`h.publication_status = $${idx++}`);
      values.push(status);
    }
  }

  if (property_type && property_type !== 'ALL') {
    conditions.push(`h.property_type = $${idx++}`);
    values.push(property_type);
  }

  const whereClause = conditions.join(' AND ');

  const countRes = await query(
    `SELECT COUNT(*) as total
     FROM hotels h
     JOIN partner_profiles p ON h.partner_id = p.id
     WHERE ${whereClause}`,
    values
  );
  const total = parseInt(countRes.rows[0]?.total || '0', 10);

  const dataRes = await query(
    `SELECT 
       h.*,
       p.business_name as partner_business_name,
       p.owner_name as partner_owner_name,
       p.phone as partner_phone,
       p.city as partner_city,
       p.kyc_status as partner_kyc_status,
       (SELECT COUNT(*) FROM hotel_rooms r WHERE r.hotel_id = h.id) as rooms_count
     FROM hotels h
     JOIN partner_profiles p ON h.partner_id = p.id
     WHERE ${whereClause}
     ORDER BY h.created_at DESC
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
 * 12. Get Detailed Vendor Property for Admin Review
 */
export async function getAdminVendorPropertyDetail(propertyId: string) {
  const propRes = await query(
    `SELECT 
       h.*,
       p.business_name as partner_business_name,
       p.owner_name as partner_owner_name,
       p.phone as partner_phone,
       p.city as partner_city,
       p.state as partner_state,
       p.kyc_status as partner_kyc_status,
       p.is_verified as partner_is_verified,
       u.email as partner_email
     FROM hotels h
     JOIN partner_profiles p ON h.partner_id = p.id
     JOIN users u ON p.user_id = u.id
     WHERE h.id = $1`,
    [propertyId]
  );
  if (propRes.rows.length === 0) {
    throw new Error('Property not found');
  }

  const property = propRes.rows[0];

  const roomsRes = await query(
    `SELECT * FROM hotel_rooms WHERE hotel_id = $1 ORDER BY price_per_night ASC`,
    [propertyId]
  );

  const auditRes = await query(
    `SELECT a.*, u.email as actor_email
     FROM vendor_audit_logs a
     LEFT JOIN users u ON a.actor_id = u.id
     WHERE a.entity_id = $1
     ORDER BY a.created_at DESC LIMIT 15`,
    [propertyId]
  );

  return {
    property,
    rooms: roomsRes.rows,
    auditLogs: auditRes.rows,
  };
}

/**
 * 13. Review Initial Vendor Application (Registration Stage)
 */
export async function reviewVendorApplication(
  adminUserId: string,
  vendorId: string,
  payload: { action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO'; reason?: string; notes?: string }
) {
  const { action, reason, notes } = payload;
  const vendorRes = await query('SELECT * FROM partner_profiles WHERE id = $1', [vendorId]);
  if (vendorRes.rows.length === 0) {
    throw new Error('Vendor application not found');
  }
  const vendor = vendorRes.rows[0];

  if (action === 'APPROVE') {
    await query(
      `UPDATE partner_profiles
       SET onboarding_status = 'APPLICATION_APPROVED',
           admin_notes = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [notes || 'Vendor registration approved. Ready for KYC.', vendorId]
    );

    await query(
      `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type)
       VALUES ($1, $2, 'Partner Registration Approved', 'Your partner registration has been approved. Please submit your business KYC documents to unlock property listings.', 'APPLICATION_APPROVED')`,
      [vendorId, vendor.user_id]
    );

    await query(
      `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
       VALUES ('VENDOR', $1, 'APPLICATION_APPROVE', $2, 'ADMIN', $3)`,
      [vendorId, adminUserId, JSON.stringify({ action: 'APPROVE', notes })]
    );

    return { success: true, message: 'Vendor application approved.' };
  } else if (action === 'REJECT') {
    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is mandatory when rejecting a vendor application.');
    }

    await query(
      `UPDATE partner_profiles
       SET onboarding_status = 'APPLICATION_REJECTED',
           status = 'REJECTED',
           rejection_reason = $1,
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [reason.trim(), notes || null, vendorId]
    );

    await query(
      `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type)
       VALUES ($1, $2, 'Partner Registration Application Update', $3, 'APPLICATION_REJECTED')`,
      [vendorId, vendor.user_id, `Your partner registration was not accepted: ${reason.trim()}`]
    );

    await query(
      `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
       VALUES ('VENDOR', $1, 'APPLICATION_REJECT', $2, 'ADMIN', $3)`,
      [vendorId, adminUserId, JSON.stringify({ action: 'REJECT', reason: reason.trim() })]
    );

    return { success: true, message: 'Vendor application rejected.' };
  } else if (action === 'REQUEST_INFO') {
    if (!notes || !notes.trim()) {
      throw new Error('Please specify the information required from the vendor.');
    }

    await query(
      `UPDATE partner_profiles
       SET onboarding_status = 'INFO_REQUESTED',
           admin_notes = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [notes.trim(), vendorId]
    );

    await query(
      `INSERT INTO vendor_notifications (vendor_id, user_id, title, message, type)
       VALUES ($1, $2, 'Additional Information Requested', $3, 'INFO_REQUESTED')`,
      [vendorId, vendor.user_id, `Admin requested details: ${notes.trim()}`]
    );

    await query(
      `INSERT INTO vendor_audit_logs (entity_type, entity_id, action, actor_id, actor_role, details)
       VALUES ('VENDOR', $1, 'APPLICATION_REQUEST_INFO', $2, 'ADMIN', $3)`,
      [vendorId, adminUserId, JSON.stringify({ action: 'REQUEST_INFO', notes: notes.trim() })]
    );

    return { success: true, message: 'Information request sent to vendor.' };
  }

  throw new Error(`Unknown review action: ${action}`);
}

/**
 * 14. Get KYC Document File for Secure Preview
 */
export async function getVendorDocumentFile(docId: string) {
  const docRes = await query('SELECT * FROM vendor_kyc_documents WHERE id = $1', [docId]);
  if (docRes.rows.length === 0) {
    throw new Error('Document not found');
  }
  return docRes.rows[0];
}

