import { Router } from 'express';
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
} from '../services/adminVendorService.js';

const router = Router();

// Strict Admin RBAC Gate
router.use(authenticateToken);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

// ==========================================
// 1. GET /api/v1/admin/vendors — List Vendor Applications
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
// 2. GET /api/v1/admin/vendors/properties/pending — Property Approval Queue
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
// 3. POST /api/v1/admin/vendors/properties/:id/review — Approve / Reject Property
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
// 4. GET /api/v1/admin/vendors/:id — Detailed Application & KYC Documents
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
// 5. POST /api/v1/admin/vendors/:id/review — Approve / Reject / Request KYC Info
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
// 6. POST /api/v1/admin/vendors/:id/suspend — Suspend / Reinstate Vendor Account
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

// ==========================================
// 7. GET /api/v1/admin/notifications — Persistent Admin Notifications
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
// 8. PATCH /api/v1/admin/notifications/:id/read — Mark Notification Read
// ==========================================
router.patch('/system/notifications/:id/read', async (req: AuthenticatedRequest, res) => {
  try {
    await markAdminNotificationRead(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

