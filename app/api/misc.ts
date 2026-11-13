import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

export const couponsRouter = Router();

// POST /coupons/validate
couponsRouter.post('/validate', async (req, res) => {
  try {
    const { code, service_type, booking_amount } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code required' });
    }

    const result = await query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) AND is_active = true', [code]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    const coupon = result.rows[0];
    const now = new Date();
    if (new Date(coupon.valid_from) > now || new Date(coupon.valid_until) < now) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    const amount = parseFloat(booking_amount || '0');
    if (amount < parseFloat(coupon.min_booking_amount || '0')) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking amount of ${coupon.currency || 'INR'} ${coupon.min_booking_amount} required`,
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = (amount * parseFloat(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount) {
        discount = Math.min(discount, parseFloat(coupon.max_discount_amount));
      }
    } else {
      discount = parseFloat(coupon.discount_value);
    }

    return res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        code: coupon.code,
        discount_amount: Math.round(discount),
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value),
        description: coupon.description,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /coupons/active
couponsRouter.get('/active', async (req, res) => {
  try {
    const result = await query(
      'SELECT code, description, discount_type, discount_value, min_booking_amount, max_discount_amount, valid_until FROM coupons WHERE is_active = true AND valid_until > NOW() LIMIT 20'
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= WISHLIST =================
export const wishlistRouter = Router();

wishlistRouter.use(authenticateToken);

wishlistRouter.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query('SELECT * FROM wishlist_items WHERE user_id = $1 ORDER BY created_at DESC', [req.user!.id]);
    return res.json({
      success: true,
      data: {
        items: result.rows,
        count: result.rows.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

wishlistRouter.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { service_type, item_id, title, subtitle, image, price, currency = 'INR', rating, location, badge, metadata = {} } = req.body;
    const result = await query(
      `INSERT INTO wishlist_items (user_id, service_type, item_id, title, subtitle, image, price, currency, rating, location, badge, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (user_id, service_type, item_id) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [req.user!.id, service_type, item_id, title, subtitle, image, price || 0, currency, rating, location, badge, JSON.stringify(metadata)]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

wishlistRouter.delete('/:itemKey', async (req: AuthenticatedRequest, res) => {
  try {
    await query('DELETE FROM wishlist_items WHERE user_id = $1 AND (item_id = $2 OR id::text = $2)', [req.user!.id, req.params.itemKey]);
    return res.json({ success: true, data: { removed: true } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

wishlistRouter.delete('/', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query('DELETE FROM wishlist_items WHERE user_id = $1', [req.user!.id]);
    return res.json({ success: true, data: { cleared_count: result.rowCount } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= LOCATIONS & MAP API =================
export { locationsRouter } from './locations.js';
