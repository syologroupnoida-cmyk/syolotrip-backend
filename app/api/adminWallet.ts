import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import {
  adminAdjustBalance,
  setWalletFreezeState,
  runReconciliationReport,
  updateWalletConfig,
  ACCOUNTS,
} from '../services/walletService.js';

const router = Router();

// Enforce admin authentication for all admin wallet operations
router.use(authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'));

// ==========================================
// 1. GET /api/v1/admin/wallet/overview
// ==========================================
router.get('/overview', async (req: AuthenticatedRequest, res) => {
  try {
    const acctRes = await query(`
      SELECT 
        COUNT(id) as total_wallets,
        COUNT(id) FILTER (WHERE status = 'ACTIVE') as active_wallets,
        COUNT(id) FILTER (WHERE status = 'FROZEN') as frozen_wallets,
        COALESCE(SUM(cash_available_balance + cash_reserved_balance), 0) as total_cash_liabilities,
        COALESCE(SUM(promotional_available_balance + promotional_reserved_balance), 0) as total_promo_liabilities,
        COALESCE(SUM(cash_reserved_balance + promotional_reserved_balance), 0) as total_reserved
      FROM wallet_accounts
    `);

    const stats = acctRes.rows[0];

    // Transaction sums
    const txRes = await query(`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'CASH_TOPUP' AND status = 'COMPLETED'), 0) as total_topups,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'BOOKING_PAYMENT' AND status = 'COMPLETED'), 0) as total_cash_spent,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'PROMOTIONAL_REDEMPTION' AND status = 'COMPLETED'), 0) as total_promo_redeemed,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'BOOKING_REFUND' AND status = 'COMPLETED'), 0) as total_refunds,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'CASHBACK_CREDIT' AND status = 'COMPLETED'), 0) as total_cashback_awarded
      FROM wallet_transactions
    `);
    const txStats = txRes.rows[0];

    // Expiring within 30 days
    const expiringRes = await query(`
      SELECT COALESCE(SUM(remaining_amount), 0) as expiring_soon
      FROM promotional_credit_lots
      WHERE status = 'ACTIVE' AND remaining_amount > 0 AND expiry_date <= (NOW() + INTERVAL '30 days')
    `);

    // Quick reconciliation status
    const recon = await runReconciliationReport();

    return res.json({
      success: true,
      data: {
        metrics: {
          totalWallets: parseInt(stats.total_wallets || '0', 10),
          activeWallets: parseInt(stats.active_wallets || '0', 10),
          frozenWallets: parseInt(stats.frozen_wallets || '0', 10),
          totalCashLiabilities: parseFloat(stats.total_cash_liabilities || 0),
          totalPromoLiabilities: parseFloat(stats.total_promo_liabilities || 0),
          totalReserved: parseFloat(stats.total_reserved || 0),
          totalTopups: parseFloat(txStats.total_topups || 0),
          totalCashSpent: parseFloat(txStats.total_cash_spent || 0),
          totalPromoRedeemed: parseFloat(txStats.total_promo_redeemed || 0),
          totalRefunds: parseFloat(txStats.total_refunds || 0),
          totalCashbackAwarded: parseFloat(txStats.total_cashback_awarded || 0),
          expiringSoonAmount: parseFloat(expiringRes.rows[0].expiring_soon || 0),
        },
        reconciliation: {
          isFullyReconciled: recon.isFullyReconciled,
          cashVariance: recon.cashVariance,
          promoVariance: recon.promoVariance,
          unbalancedJournalsCount: recon.unbalancedJournalsCount,
          staleReservationsCount: recon.staleReservationsCount,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. GET /api/v1/admin/wallet/customers
// ==========================================
router.get('/customers', async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const offset = (page - 1) * limit;

    const { search, status } = req.query;

    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(u.email ILIKE $${idx} OR u.full_name ILIKE $${idx} OR u.phone ILIKE $${idx} OR w.id::text ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    if (status) {
      conditions.push(`w.status = $${idx++}`);
      values.push(status);
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(
      `SELECT COUNT(w.id) as total
       FROM wallet_accounts w
       JOIN users u ON w.customer_id = u.id
       WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].total || '0', 10);

    const listRes = await query(
      `SELECT 
         w.id as wallet_id,
         w.customer_id,
         u.full_name,
         u.email,
         u.phone,
         w.currency,
         w.cash_available_balance,
         w.cash_reserved_balance,
         w.promotional_available_balance,
         w.promotional_reserved_balance,
         w.status,
         w.freeze_reason,
         w.frozen_at,
         w.created_at,
         w.updated_at
       FROM wallet_accounts w
       JOIN users u ON w.customer_id = u.id
       WHERE ${whereClause}
       ORDER BY w.updated_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]
    );

    return res.json({
      success: true,
      data: {
        items: listRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. GET /api/v1/admin/wallet/customers/:id
// ==========================================
router.get('/customers/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = req.params.id;

    const acctRes = await query(
      `SELECT w.*, u.full_name, u.email, u.phone 
       FROM wallet_accounts w
       JOIN users u ON w.customer_id = u.id
       WHERE w.customer_id = $1 OR w.id::text = $1`,
      [customerId]
    );

    if (acctRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Wallet account not found' });
    }

    const wallet = acctRes.rows[0];

    // Recent 20 transactions
    const txRes = await query(
      `SELECT * FROM wallet_transactions WHERE wallet_account_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [wallet.id]
    );

    // Active promotional credit lots
    const lotsRes = await query(
      `SELECT * FROM promotional_credit_lots WHERE wallet_account_id = $1 ORDER BY expiry_date ASC`,
      [wallet.id]
    );

    // Active reservations
    const resvRes = await query(
      `SELECT * FROM wallet_reservations WHERE wallet_account_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [wallet.id]
    );

    return res.json({
      success: true,
      data: {
        wallet,
        transactions: txRes.rows,
        promotionalLots: lotsRes.rows,
        reservations: resvRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. POST /api/v1/admin/wallet/customers/:id/freeze
// ==========================================
router.post('/customers/:id/freeze', async (req: AuthenticatedRequest, res) => {
  try {
    const { freeze, reason } = req.body;
    const adminUser = req.user!;

    await setWalletFreezeState({
      adminUserId: adminUser.id,
      adminEmail: adminUser.email,
      customerId: req.params.id,
      freeze: Boolean(freeze),
      reason: reason || 'Administrative compliance review',
    });

    return res.json({
      success: true,
      message: `Wallet successfully ${freeze ? 'frozen' : 'unfrozen'}`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. POST /api/v1/admin/wallet/adjust
// ==========================================
router.post('/adjust', async (req: AuthenticatedRequest, res) => {
  try {
    const { customer_id, wallet_type, direction, amount, reason, reference_id } = req.body;
    const adminUser = req.user!;

    if (!customer_id || !wallet_type || !direction || !amount) {
      return res.status(400).json({
        success: false,
        message: 'customer_id, wallet_type (CASH|PROMOTIONAL), direction (CREDIT|DEBIT), amount, and reason are required',
      });
    }

    const result = await adminAdjustBalance({
      adminUserId: adminUser.id,
      adminEmail: adminUser.email,
      customerId: customer_id,
      walletType: wallet_type.toUpperCase(),
      direction: direction.toUpperCase(),
      amount: parseFloat(amount),
      reason: reason || 'Administrative adjustment',
      referenceId: reference_id,
    });

    return res.json({
      success: true,
      message: `Successfully adjusted ${wallet_type} balance by ${direction} ₹${amount}`,
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. GET /api/v1/admin/wallet/transactions
// ==========================================
router.get('/transactions', async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const offset = (page - 1) * limit;

    const { wallet_type, transaction_type, search } = req.query;

    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let idx = 1;

    if (wallet_type) {
      conditions.push(`t.wallet_type = $${idx++}`);
      values.push(String(wallet_type).toUpperCase());
    }
    if (transaction_type) {
      conditions.push(`t.transaction_type = $${idx++}`);
      values.push(String(transaction_type));
    }
    if (search) {
      conditions.push(`(u.email ILIKE $${idx} OR u.full_name ILIKE $${idx} OR t.transaction_id ILIKE $${idx} OR t.reference_id ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(
      `SELECT COUNT(t.id) as total
       FROM wallet_transactions t
       JOIN users u ON t.customer_id = u.id
       WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].total || '0', 10);

    const txRes = await query(
      `SELECT t.*, u.full_name, u.email, u.phone
       FROM wallet_transactions t
       JOIN users u ON t.customer_id = u.id
       WHERE ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]
    );

    return res.json({
      success: true,
      data: {
        items: txRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. Promotional Campaigns CRUD
// ==========================================
router.get('/campaigns', async (req: AuthenticatedRequest, res) => {
  try {
    const campRes = await query('SELECT * FROM promotional_campaigns ORDER BY created_at DESC');
    return res.json({ success: true, data: campRes.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/campaigns', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      code,
      campaign_type = 'CASHBACK',
      reward_type = 'PERCENTAGE',
      reward_value,
      max_reward_amount,
      min_booking_amount = 0,
      applicable_services = ['FLIGHT', 'HOTEL', 'VILLA', 'PACKAGE', 'TRAIN', 'BUS', 'CAB', 'TOUR', 'VISA', 'INSURANCE'],
      validity_days = 90,
    } = req.body;

    if (!name || !code || !reward_value) {
      return res.status(400).json({ success: false, message: 'name, unique code, and reward_value are required' });
    }

    const newCamp = await query(
      `INSERT INTO promotional_campaigns (
        name, code, campaign_type, reward_type, reward_value, max_reward_amount,
        min_booking_amount, applicable_services, validity_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        name,
        code.trim().toUpperCase(),
        campaign_type,
        reward_type,
        parseFloat(reward_value),
        max_reward_amount ? parseFloat(max_reward_amount) : null,
        parseFloat(min_booking_amount || 0),
        JSON.stringify(applicableServicesFromInput(applicable_services)),
        parseInt(validity_days || '90', 10),
      ]
    );

    return res.status(201).json({ success: true, message: 'Campaign created successfully', data: newCamp.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/campaigns/:id/toggle', async (req: AuthenticatedRequest, res) => {
  try {
    const { is_active } = req.body;
    await query('UPDATE promotional_campaigns SET is_active = $1, updated_at = NOW() WHERE id = $2', [
      Boolean(is_active),
      req.params.id,
    ]);
    return res.json({ success: true, message: 'Campaign status updated' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

function applicableServicesFromInput(input: any): string[] {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch (e) { return [input]; }
  }
  return ['FLIGHT', 'HOTEL', 'VILLA', 'PACKAGE', 'TRAIN', 'BUS', 'CAB', 'TOUR', 'VISA', 'INSURANCE'];
}

// ==========================================
// 8. Financial Reconciliation Report
// ==========================================
router.get('/reconciliation', async (req: AuthenticatedRequest, res) => {
  try {
    const report = await runReconciliationReport();
    return res.json({ success: true, data: report });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 9. Feature Flags & Configuration
// ==========================================
router.get('/config', async (req: AuthenticatedRequest, res) => {
  try {
    const configRes = await query('SELECT * FROM wallet_config ORDER BY key ASC');
    return res.json({ success: true, data: configRes.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/config', async (req: AuthenticatedRequest, res) => {
  try {
    const { key, value, description } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'key and value are required' });
    }

    await updateWalletConfig(key, String(value), description);

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, 'WALLET_CONFIG_CHANGE', 'wallet_config', $2, $3, NOW())`,
      [req.user!.id, key, JSON.stringify({ admin_email: req.user!.email, key, value })]
    );

    return res.json({ success: true, message: `Configuration ${key} updated to ${value}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
