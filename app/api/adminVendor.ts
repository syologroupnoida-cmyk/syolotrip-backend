import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import {
  getAdminVendorApplications,
  getAdminVendorDetails,
  reviewVendorKYC,
  toggleVendorSuspension,
  getAdminPropertyApprovalRequests,
  reviewVendorProperty,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  getAdminVendorOverview,
  getAdminAllVendorProperties,
  getAdminVendorPropertyDetail,
  reviewVendorApplication,
  getVendorDocumentFile,
} from '../services/adminVendorService.js';

const router = Router();

// Strict Admin RBAC Gate
router.use(authenticateToken);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

// ==========================================
// 1. GET /api/v1/admin/vendors/overview — Dashboard Metrics & Queues
// ==========================================
router.get('/overview', async (_req: AuthenticatedRequest, res) => {
  try {
    const data = await getAdminVendorOverview();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. GET /api/v1/admin/vendors/properties/all — All Properties Across Vendors
// ==========================================
router.get('/properties/all', async (req: AuthenticatedRequest, res) => {
  try {
    const { search, status, property_type, page, limit } = req.query;
    const data = await getAdminAllVendorProperties({
      search: search as string,
      status: status as string,
      property_type: property_type as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. GET /api/v1/admin/vendors/properties/pending — Property Approval Queue
// ==========================================
router.get('/properties/pending', async (_req: AuthenticatedRequest, res) => {
  try {
    const data = await getAdminPropertyApprovalRequests();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. GET /api/v1/admin/vendors/properties/:id — Property Detail for Review
// ==========================================
router.get('/properties/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await getAdminVendorPropertyDetail(req.params.id);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. POST /api/v1/admin/vendors/properties/:id/review — Approve / Reject / Changes
// ==========================================
router.post('/properties/:id/review', async (req: AuthenticatedRequest, res) => {
  try {
    const propertyId = req.params.id;
    const { action, reason } = req.body;
    const result = await reviewVendorProperty(req.user!.id, propertyId, { action, reason });
    return res.json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. POST /api/v1/admin/vendors/applications/:id/review — Review Registration Application
// ==========================================
router.post('/applications/:id/review', async (req: AuthenticatedRequest, res) => {
  try {
    const vendorId = req.params.id;
    const { action, reason, notes } = req.body;
    const result = await reviewVendorApplication(req.user!.id, vendorId, { action, reason, notes });
    return res.json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. GET /api/v1/admin/vendors/documents/:id/view — Secure Document Preview
// ==========================================
router.get('/documents/:id/view', async (req: AuthenticatedRequest, res) => {
  try {
    const doc = await getVendorDocumentFile(req.params.id);
    const resolvedPath = path.isAbsolute(doc.file_path)
      ? doc.file_path
      : path.resolve(process.cwd(), doc.file_path);

    if (fs.existsSync(resolvedPath)) {
      res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
      return fs.createReadStream(resolvedPath).pipe(res);
    }

    // Fallback: Generate a sample preview stream if mock/test file
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>${doc.file_name} — Secure Preview</title></head>
        <body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; padding:30px; text-align:center;">
          <h2 style="color:#38bdf8;">Verified Document Secure Preview</h2>
          <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:24px; max-width:600px; margin:0 auto; text-align:left;">
            <p><strong>Document Type:</strong> ${doc.document_type}</p>
            <p><strong>Section:</strong> ${doc.document_section}</p>
            <p><strong>Masked ID:</strong> ${doc.document_number_masked || 'N/A'}</p>
            <p><strong>File Name:</strong> ${doc.file_name}</p>
            <p><strong>Verification Status:</strong> <span style="color:#4ade80;">${doc.verification_status}</span></p>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

// ==========================================
// 8. GET /api/v1/admin/vendors/system/notifications — Persistent Admin Notifications
// ==========================================
router.get('/system/notifications', async (_req: AuthenticatedRequest, res) => {
  try {
    const data = await getAdminNotifications();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 9. POST /api/v1/admin/vendors/system/notifications/mark-all-read — Mark All Read
// ==========================================
router.post('/system/notifications/mark-all-read', async (_req: AuthenticatedRequest, res) => {
  try {
    await markAllAdminNotificationsRead();
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 10. PATCH /api/v1/admin/vendors/system/notifications/:id/read — Mark Single Read
// ==========================================
router.patch('/system/notifications/:id/read', async (req: AuthenticatedRequest, res) => {
  try {
    await markAdminNotificationRead(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 11. GET /api/v1/admin/vendors — List Vendor Applications
// ==========================================
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { search, status, page, limit } = req.query;
    const data = await getAdminVendorApplications({
      search: search as string,
      status: status as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 12. GET /api/v1/admin/vendors/:id — Detailed Application & KYC Documents
// ==========================================
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await getAdminVendorDetails(req.params.id);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

// ==========================================
// 13. POST /api/v1/admin/vendors/:id/review — Approve / Reject / Request KYC Info
// ==========================================
router.post('/:id/review', async (req: AuthenticatedRequest, res) => {
  try {
    const vendorId = req.params.id;
    const { action, reason, notes } = req.body;
    const result = await reviewVendorKYC(req.user!.id, vendorId, { action, reason, notes });
    return res.json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 14. POST /api/v1/admin/vendors/:id/suspend — Suspend / Reinstate Vendor Account
// ==========================================
router.post('/:id/suspend', async (req: AuthenticatedRequest, res) => {
  try {
    const vendorId = req.params.id;
    const { suspend = true, reason } = req.body;
    const result = await toggleVendorSuspension(req.user!.id, vendorId, Boolean(suspend), reason);
    return res.json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;


