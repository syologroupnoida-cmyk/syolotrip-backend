import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import {
  calculateSellingPrice,
  simulatePricingQuote,
  PricingChannel,
  CalculationType,
} from '../services/pricingEngine.js';

const router = Router();

// Enforce admin for all pricing management routes
router.use(authenticateToken, requireRole('ADMIN'));

// GET /api/v1/admin/pricing/rules
router.get('/rules', async (req, res) => {
  try {
    const { channel, service_type } = req.query;
    let conditions: string[] = [];
    let values: any[] = [];
    let idx = 1;

    if (channel) {
      conditions.push(`(channel = $${idx} OR channel = 'ALL')`);
      values.push(channel);
      idx++;
    }
    if (service_type) {
      conditions.push(`(service_type = $${idx} OR service_type = 'ALL')`);
      values.push(service_type);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT pr.*, u.email as created_by_email, c.name as company_name
       FROM pricing_rules pr
       LEFT JOIN users u ON pr.created_by_user_id = u.id
       LEFT JOIN mybiz_companies c ON pr.company_id = c.id
       ${where}
       ORDER BY pr.priority ASC, pr.created_at DESC`,
      values
    );

    const rules = result.rows.map((r) => ({
      ...r,
      value: parseFloat(r.value),
      min_markup_amount: r.min_markup_amount ? parseFloat(r.min_markup_amount) : null,
      max_markup_amount: r.max_markup_amount ? parseFloat(r.max_markup_amount) : null,
    }));

    return res.json({ success: true, data: rules });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/admin/pricing/rules
router.post('/rules', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      channel = 'B2C',
      service_type = 'ALL',
      company_id = null,
      calculation_type = 'PERCENTAGE_MARKUP',
      value,
      min_markup_amount = 0,
      max_markup_amount = null,
      priority = 100,
      valid_from = new Date().toISOString(),
      valid_until = null,
      is_active = true,
      description = '',
      reason = 'Admin created new pricing rule',
    } = req.body;

    if (!name || value === undefined) {
      return res.status(400).json({ success: false, message: 'Rule name and value are required' });
    }

    const admin = req.user!;
    const insertRes = await query(
      `INSERT INTO pricing_rules (
        name, channel, service_type, company_id, calculation_type, value,
        min_markup_amount, max_markup_amount, priority, valid_from, valid_until,
        is_active, description, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        name,
        channel,
        service_type.toUpperCase(),
        company_id || null,
        calculation_type,
        value,
        min_markup_amount || 0,
        max_markup_amount || null,
        priority,
        valid_from || new Date().toISOString(),
        valid_until || null,
        is_active,
        description,
        admin.id,
      ]
    );

    const newRule = insertRes.rows[0];

    // Log in pricing audit trail
    await query(
      `INSERT INTO pricing_audit_logs (rule_id, admin_id, admin_email, action, previous_state, new_state, reason)
       VALUES ($1, $2, $3, 'CREATE', '{}'::jsonb, $4, $5)`,
      [newRule.id, admin.id, admin.email, JSON.stringify(newRule), reason]
    );

    return res.status(201).json({
      success: true,
      message: 'Pricing rule created successfully',
      data: {
        ...newRule,
        value: parseFloat(newRule.value),
        min_markup_amount: newRule.min_markup_amount ? parseFloat(newRule.min_markup_amount) : null,
        max_markup_amount: newRule.max_markup_amount ? parseFloat(newRule.max_markup_amount) : null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/admin/pricing/rules/:id
router.put('/rules/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const ruleId = req.params.id;
    const admin = req.user!;
    const prevRes = await query('SELECT * FROM pricing_rules WHERE id = $1', [ruleId]);
    if (prevRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }
    const previousRule = prevRes.rows[0];

    const {
      name,
      channel,
      service_type,
      company_id,
      calculation_type,
      value,
      min_markup_amount,
      max_markup_amount,
      priority,
      valid_from,
      valid_until,
      is_active,
      description,
      reason = 'Admin updated pricing rule',
    } = req.body;

    const updateRes = await query(
      `UPDATE pricing_rules SET
        name = COALESCE($1, name),
        channel = COALESCE($2, channel),
        service_type = COALESCE($3, service_type),
        company_id = $4,
        calculation_type = COALESCE($5, calculation_type),
        value = COALESCE($6, value),
        min_markup_amount = $7,
        max_markup_amount = $8,
        priority = COALESCE($9, priority),
        valid_from = COALESCE($10, valid_from),
        valid_until = $11,
        is_active = COALESCE($12, is_active),
        description = COALESCE($13, description),
        updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [
        name,
        channel,
        service_type ? service_type.toUpperCase() : null,
        company_id !== undefined ? company_id : previousRule.company_id,
        calculation_type,
        value,
        min_markup_amount !== undefined ? min_markup_amount : previousRule.min_markup_amount,
        max_markup_amount !== undefined ? max_markup_amount : previousRule.max_markup_amount,
        priority,
        valid_from,
        valid_until !== undefined ? valid_until : previousRule.valid_until,
        is_active,
        description,
        ruleId,
      ]
    );

    const updatedRule = updateRes.rows[0];

    // Log update audit
    await query(
      `INSERT INTO pricing_audit_logs (rule_id, admin_id, admin_email, action, previous_state, new_state, reason)
       VALUES ($1, $2, $3, 'UPDATE', $4, $5, $6)`,
      [ruleId, admin.id, admin.email, JSON.stringify(previousRule), JSON.stringify(updatedRule), reason]
    );

    return res.json({
      success: true,
      message: 'Pricing rule updated successfully',
      data: {
        ...updatedRule,
        value: parseFloat(updatedRule.value),
        min_markup_amount: updatedRule.min_markup_amount ? parseFloat(updatedRule.min_markup_amount) : null,
        max_markup_amount: updatedRule.max_markup_amount ? parseFloat(updatedRule.max_markup_amount) : null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/admin/pricing/rules/:id/toggle
router.patch('/rules/:id/toggle', async (req: AuthenticatedRequest, res) => {
  try {
    const ruleId = req.params.id;
    const admin = req.user!;
    const prevRes = await query('SELECT * FROM pricing_rules WHERE id = $1', [ruleId]);
    if (prevRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }
    const previousRule = prevRes.rows[0];
    const newStatus = !previousRule.is_active;

    await query('UPDATE pricing_rules SET is_active = $1, updated_at = NOW() WHERE id = $2', [newStatus, ruleId]);

    // Log toggle
    await query(
      `INSERT INTO pricing_audit_logs (rule_id, admin_id, admin_email, action, previous_state, new_state, reason)
       VALUES ($1, $2, $3, 'TOGGLE', $4, $5, $6)`,
      [
        ruleId,
        admin.id,
        admin.email,
        JSON.stringify({ is_active: previousRule.is_active }),
        JSON.stringify({ is_active: newStatus }),
        `Admin toggled rule status to ${newStatus ? 'ACTIVE' : 'INACTIVE'}`,
      ]
    );

    return res.json({
      success: true,
      message: `Pricing rule ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { id: ruleId, is_active: newStatus },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/admin/pricing/rules/:id
router.delete('/rules/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const ruleId = req.params.id;
    const admin = req.user!;
    const prevRes = await query('SELECT * FROM pricing_rules WHERE id = $1', [ruleId]);
    if (prevRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }
    const previousRule = prevRes.rows[0];

    await query('DELETE FROM pricing_rules WHERE id = $1', [ruleId]);

    // Log delete audit
    await query(
      `INSERT INTO pricing_audit_logs (rule_id, admin_id, admin_email, action, previous_state, new_state, reason)
       VALUES ($1, $2, $3, 'DELETE', $4, '{}'::jsonb, $5)`,
      [ruleId, admin.id, admin.email, JSON.stringify(previousRule), 'Admin deleted pricing rule']
    );

    return res.json({ success: true, message: 'Pricing rule deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/admin/pricing/simulate
router.post('/simulate', async (req, res) => {
  try {
    const {
      base_fare = 5000,
      taxes = 750,
      channel = 'B2C',
      service_type = 'FLIGHT',
      company_id = null,
      custom_rule = null,
    } = req.body;

    const result = await simulatePricingQuote({
      baseFare: parseFloat(base_fare),
      taxes: parseFloat(taxes),
      channel: channel as PricingChannel,
      serviceType: service_type,
      companyId: company_id,
      ruleOverride: custom_rule
        ? {
            calculation_type: custom_rule.calculation_type as CalculationType,
            value: parseFloat(custom_rule.value),
            min_markup_amount: custom_rule.min_markup_amount ? parseFloat(custom_rule.min_markup_amount) : undefined,
            max_markup_amount: custom_rule.max_markup_amount ? parseFloat(custom_rule.max_markup_amount) : undefined,
          }
        : undefined,
    });

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/pricing/comparison
router.get('/comparison', async (req, res) => {
  try {
    const baseFare = parseFloat((req.query.base_fare as string) || '5000');
    const taxes = parseFloat((req.query.taxes as string) || '750');
    const serviceType = (req.query.service_type as string) || 'FLIGHT';

    const b2cQuote = await calculateSellingPrice({
      baseFare,
      taxes,
      channel: 'B2C',
      serviceType,
    });

    const b2bQuote = await calculateSellingPrice({
      baseFare,
      taxes,
      channel: 'B2B',
      serviceType,
    });

    return res.json({
      success: true,
      data: {
        base_fare: baseFare,
        taxes,
        service_type: serviceType,
        b2c: b2cQuote,
        b2b: b2bQuote,
        difference: {
          markup_difference: Number((b2cQuote.markup_amount - b2bQuote.markup_amount).toFixed(2)),
          total_price_difference: Number((b2cQuote.total_selling_price - b2bQuote.total_selling_price).toFixed(2)),
          b2b_savings_percentage:
            b2cQuote.total_selling_price > 0
              ? Number(
                  (
                    ((b2cQuote.total_selling_price - b2bQuote.total_selling_price) /
                      b2cQuote.total_selling_price) *
                    100
                  ).toFixed(2)
                )
              : 0,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/pricing/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const result = await query(
      `SELECT pal.*, pr.name as rule_name
       FROM pricing_audit_logs pal
       LEFT JOIN pricing_rules pr ON pal.rule_id = pr.id
       ORDER BY pal.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
