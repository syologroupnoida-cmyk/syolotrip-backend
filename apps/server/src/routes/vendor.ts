import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/index.js';
import {
  registerVendor,
  getVendorDashboardOverview,
  updateVendorProfile,
  submitKYCApplication,
  getVendorKYCDetails,
  createVendorProperty,
  getVendorProperties,
  getVendorNotifications,
  markVendorNotificationRead,
} from '../services/vendorService.js';

const router = Router();

// ==========================================
// 1. POST /api/v1/vendor/register — Public Basic Vendor Registration
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const {
      full_name,
      business_name,
      email,
      phone,
      password,
      property_type = 'Hotel',
      city,
      state = '',
      agree_terms,
    } = req.body;

    const result = await registerVendor({
      full_name,
      business_name,
      email,
      phone,
      password,
      property_type,
      city,
      state,
      agree_terms,
    });

    return res.status(201).json({
      success: true,
      message: 'Vendor account registered successfully. Please complete your KYC verification.',
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// All subsequent vendor routes require authentication
router.use(authenticateToken);

// ==========================================
// 2. GET /api/v1/vendor/dashboard — Vendor Dashboard Overview
// ==========================================
router.get('/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await getVendorDashboardOverview(req.user!.id);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. GET /api/v1/vendor/profile — Vendor Profile Details
// ==========================================
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const partnerRes = await query('SELECT * FROM partner_profiles WHERE user_id = $1', [req.user!.id]);
    if (partnerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }
    return res.json({ success: true, data: partnerRes.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. PUT /api/v1/vendor/profile — Update Permitted Profile Fields
// ==========================================
router.put('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await updateVendorProfile(req.user!.id, req.body);
    return res.json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. GET /api/v1/vendor/kyc — Current KYC Status & Documents
// ==========================================
router.get('/kyc', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await getVendorKYCDetails(req.user!.id);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. POST /api/v1/vendor/kyc/submit — Submit / Resubmit KYC Application
// ==========================================
router.post('/kyc/submit', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await submitKYCApplication(req.user!.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'KYC application submitted successfully. Verification is pending admin review.',
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. GET /api/v1/vendor/properties — List Vendor's Properties
// ==========================================
router.get('/properties', async (req: AuthenticatedRequest, res) => {
  try {
    const properties = await getVendorProperties(req.user!.id);
    return res.json({ success: true, data: properties });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 8. POST /api/v1/vendor/properties — Create Property (Gated by KYC Approval!)
// ==========================================
router.post('/properties', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await createVendorProperty(req.user!.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Property created and submitted for admin review.',
      data: result,
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// ==========================================
// 9. GET /api/v1/vendor/notifications — List Vendor Notifications
// ==========================================
router.get('/notifications', async (req: AuthenticatedRequest, res) => {
  try {
    const notifications = await getVendorNotifications(req.user!.id);
    return res.json({ success: true, data: notifications });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 10. PATCH /api/v1/vendor/notifications/:id/read — Mark Notification Read
// ==========================================
router.patch('/notifications/:id/read', async (req: AuthenticatedRequest, res) => {
  try {
    await markVendorNotificationRead(req.user!.id, req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 11. GET /api/v1/vendor/kyc/documents/:id — Secure Document Viewer (Restricted Access)
// ==========================================
router.get('/kyc/documents/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const docId = req.params.id;
    const docRes = await query(
      `SELECT d.*, p.user_id as vendor_user_id
       FROM vendor_kyc_documents d
       JOIN partner_profiles p ON d.vendor_id = p.id
       WHERE d.id = $1`,
      [docId]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = docRes.rows[0];

    // Authorization: Must be owner vendor or Admin
    const isOwner = doc.vendor_user_id === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied to this document' });
    }

    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ success: false, message: 'Document file missing on disk' });
    }

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
    const fileStream = fs.createReadStream(doc.file_path);
    fileStream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

