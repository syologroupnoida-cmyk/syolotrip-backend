import { query } from '../db/index.js';

export type PricingChannel = 'B2C' | 'B2B';
export type ServiceType = 'FLIGHT' | 'HOTEL' | 'TRAIN' | 'BUS' | 'CAB' | 'PACKAGE' | 'ALL';
export type CalculationType = 'PERCENTAGE_MARKUP' | 'FIXED_MARKUP' | 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT';

export interface PricingRule {
  id: string;
  name: string;
  channel: 'B2C' | 'B2B' | 'ALL';
  service_type: ServiceType;
  company_id?: string | null;
  calculation_type: CalculationType;
  value: number;
  min_markup_amount?: number | null;
  max_markup_amount?: number | null;
  priority: number;
  valid_from: string;
  valid_until?: string | null;
  is_active: boolean;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceBreakdownResult {
  supplier_base_fare: number;
  supplier_taxes: number;
  markup_amount: number;
  markup_percentage: number;
  selling_base_fare: number;
  total_selling_price: number;
  platform_margin: number;
  channel: PricingChannel;
  service_type: string;
  rule_applied: {
    id: string;
    name: string;
    calculation_type: CalculationType;
    value: number;
    channel: string;
    priority: number;
  } | null;
}

/**
 * Decimal / Integer Paise Arithmetic:
 * Converts a floating-point rupee value to integer paise to ensure zero floating point drift.
 */
function toPaise(rupees: number): number {
  return Math.round(Number(rupees || 0) * 100);
}

function toRupees(paise: number): number {
  return Number((paise / 100).toFixed(2));
}

/**
 * Resolves the highest-priority active pricing rule for a given channel and service.
 * Precedence Order:
 * 1. Specific company rule for the exact service
 * 2. Specific company rule for 'ALL' services
 * 3. Channel rule for the exact service
 * 4. Channel rule for 'ALL' services
 * 5. Global ('ALL' channels) rule for the exact service
 * 6. Global ('ALL' channels) rule for 'ALL' services
 */
export async function resolvePricingRule(
  channel: PricingChannel,
  serviceType: string,
  companyId?: string | null
): Promise<PricingRule | null> {
  const normService = serviceType.toUpperCase();
  const now = new Date().toISOString();

  let sql = `
    SELECT * FROM pricing_rules
    WHERE is_active = true
      AND (valid_from IS NULL OR valid_from <= $1)
      AND (valid_until IS NULL OR valid_until >= $1)
      AND (channel = $2 OR channel = 'ALL')
      AND (service_type = $3 OR service_type = 'ALL')
  `;
  const params: any[] = [now, channel, normService];

  if (companyId) {
    sql += ` AND (company_id = $4 OR company_id IS NULL)`;
    params.push(companyId);
  } else {
    sql += ` AND company_id IS NULL`;
  }

  // Precedence sorting:
  // 1. Company-specific matches first (company_id IS NOT NULL DESC)
  // 2. Exact service_type match over 'ALL' (service_type = $normService DESC)
  // 3. Exact channel match over 'ALL' (channel = $channel DESC)
  // 4. Configured priority ASC (lower integer = higher priority)
  // 5. Most recently created rule first
  sql += `
    ORDER BY
      CASE WHEN company_id IS NOT NULL THEN 1 ELSE 2 END ASC,
      CASE WHEN service_type = $3 THEN 1 ELSE 2 END ASC,
      CASE WHEN channel = $2 THEN 1 ELSE 2 END ASC,
      priority ASC,
      created_at DESC
    LIMIT 1
  `;

  const result = await query(sql, params);
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    value: parseFloat(row.value),
    min_markup_amount: row.min_markup_amount ? parseFloat(row.min_markup_amount) : null,
    max_markup_amount: row.max_markup_amount ? parseFloat(row.max_markup_amount) : null,
  };
}

/**
 * Calculates selling price using trusted base fares and a specified or resolved pricing rule.
 */
export function computePriceWithRule(
  supplierBaseFare: number,
  supplierTaxes: number = 0,
  rule: PricingRule | null,
  channel: PricingChannel,
  serviceType: string
): PriceBreakdownResult {
  const basePaise = toPaise(supplierBaseFare);
  const taxesPaise = toPaise(supplierTaxes);

  if (!rule) {
    // Fallback: No rule configured, zero markup
    return {
      supplier_base_fare: toRupees(basePaise),
      supplier_taxes: toRupees(taxesPaise),
      markup_amount: 0,
      markup_percentage: 0,
      selling_base_fare: toRupees(basePaise),
      total_selling_price: toRupees(basePaise + taxesPaise),
      platform_margin: 0,
      channel,
      service_type: serviceType,
      rule_applied: null,
    };
  }

  let markupPaise = 0;
  const ruleVal = Number(rule.value || 0);

  switch (rule.calculation_type) {
    case 'PERCENTAGE_MARKUP':
      markupPaise = Math.round(basePaise * (ruleVal / 100));
      break;
    case 'FIXED_MARKUP':
      markupPaise = toPaise(ruleVal);
      break;
    case 'PERCENTAGE_DISCOUNT':
      markupPaise = -Math.round(basePaise * (ruleVal / 100));
      break;
    case 'FIXED_DISCOUNT':
      markupPaise = -toPaise(ruleVal);
      break;
    default:
      markupPaise = 0;
  }

  // Apply minimum constraint if defined
  if (rule.min_markup_amount !== undefined && rule.min_markup_amount !== null) {
    const minPaise = toPaise(rule.min_markup_amount);
    if (markupPaise < minPaise) {
      markupPaise = minPaise;
    }
  }

  // Apply maximum constraint if defined
  if (rule.max_markup_amount !== undefined && rule.max_markup_amount !== null) {
    const maxPaise = toPaise(rule.max_markup_amount);
    if (markupPaise > maxPaise) {
      markupPaise = maxPaise;
    }
  }

  // Selling base fare cannot fall below 0
  const sellingBasePaise = Math.max(0, basePaise + markupPaise);
  const totalSellingPaise = sellingBasePaise + taxesPaise;

  const finalMarkup = toRupees(markupPaise);
  const markupPercent = basePaise > 0 ? Number(((markupPaise / basePaise) * 100).toFixed(2)) : 0;

  return {
    supplier_base_fare: toRupees(basePaise),
    supplier_taxes: toRupees(taxesPaise),
    markup_amount: finalMarkup,
    markup_percentage: markupPercent,
    selling_base_fare: toRupees(sellingBasePaise),
    total_selling_price: toRupees(totalSellingPaise),
    platform_margin: finalMarkup,
    channel,
    service_type: serviceType,
    rule_applied: {
      id: rule.id,
      name: rule.name,
      calculation_type: rule.calculation_type,
      value: rule.value,
      channel: rule.channel,
      priority: rule.priority,
    },
  };
}

/**
 * Full calculation workflow: Resolves rule dynamically from DB, then computes price.
 */
export async function calculateSellingPrice(params: {
  baseFare: number;
  taxes?: number;
  channel: PricingChannel;
  serviceType: string;
  companyId?: string | null;
  ruleOverride?: PricingRule | null;
}): Promise<PriceBreakdownResult> {
  const { baseFare, taxes = 0, channel, serviceType, companyId, ruleOverride } = params;
  const rule = ruleOverride !== undefined ? ruleOverride : await resolvePricingRule(channel, serviceType, companyId);
  return computePriceWithRule(baseFare, taxes, rule, channel, serviceType);
}

/**
 * Simulator function for Admin Simulator and side-by-side B2C vs B2B comparison.
 */
export async function simulatePricingQuote(params: {
  baseFare: number;
  taxes?: number;
  channel: PricingChannel;
  serviceType: string;
  companyId?: string | null;
  ruleOverride?: {
    calculation_type: CalculationType;
    value: number;
    min_markup_amount?: number;
    max_markup_amount?: number;
  };
}): Promise<PriceBreakdownResult> {
  let rule: PricingRule | null = null;
  if (params.ruleOverride) {
    rule = {
      id: 'simulation-override',
      name: 'Simulator Custom Rule',
      channel: params.channel,
      service_type: params.serviceType as ServiceType,
      calculation_type: params.ruleOverride.calculation_type,
      value: params.ruleOverride.value,
      min_markup_amount: params.ruleOverride.min_markup_amount || null,
      max_markup_amount: params.ruleOverride.max_markup_amount || null,
      priority: 1,
      valid_from: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } else {
    rule = await resolvePricingRule(params.channel, params.serviceType, params.companyId);
  }

  return computePriceWithRule(params.baseFare, params.taxes || 0, rule, params.channel, params.serviceType);
}

export interface UserChannelContext {
  channel: PricingChannel;
  company_id: string | null;
  company_name: string | null;
  is_mybiz_user: boolean;
}

/**
 * Robustly detects whether a user qualifies for B2B corporate pricing
 * based on verified myBiz corporate accounts in the database.
 * Never trusts a client-side parameter.
 */
export async function detectUserPricingChannel(userId?: string | null): Promise<UserChannelContext> {
  if (!userId) {
    return { channel: 'B2C', company_id: null, company_name: null, is_mybiz_user: false };
  }
  try {
    const result = await query(
      `SELECT e.company_id, c.name as company_name, c.is_active as company_active
       FROM mybiz_employees e
       JOIN mybiz_companies c ON e.company_id = c.id
       WHERE e.user_id = $1 AND e.status = 'ACTIVE' AND c.is_active = true
       LIMIT 1`,
      [userId]
    );
    if (result.rows.length > 0) {
      return {
        channel: 'B2B',
        company_id: result.rows[0].company_id,
        company_name: result.rows[0].company_name,
        is_mybiz_user: true,
      };
    }
  } catch (err) {
    // On query failure, fallback safely to B2C
  }
  return { channel: 'B2C', company_id: null, company_name: null, is_mybiz_user: false };
}
