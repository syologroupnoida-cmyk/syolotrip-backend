import { Router } from 'express';
import { query } from '../db/index.js';
import { optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import {
  detectUserPricingChannel,
  resolvePricingRule,
  computePriceWithRule,
} from '../services/pricingEngine.js';

const router = Router();

// GET /flights
router.get('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { from_city, to_city, from_code, to_code, cabin_class, max_price, non_stop } = req.query;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const offset = (page - 1) * limit;

    // Detect pricing channel (B2B corporate vs B2C retail)
    const userContext = await detectUserPricingChannel(req.user?.id);
    const activeRule = await resolvePricingRule(userContext.channel, 'FLIGHT', userContext.company_id);

    let conditions: string[] = ['is_active = true'];
    let values: any[] = [];
    let idx = 1;

    if (from_city) {
      conditions.push(`(LOWER(origin_city) LIKE LOWER($${idx}) OR LOWER(origin_name) LIKE LOWER($${idx}))`);
      values.push(`%${from_city}%`);
      idx++;
    }
    if (to_city) {
      conditions.push(`(LOWER(destination_city) LIKE LOWER($${idx}) OR LOWER(destination_name) LIKE LOWER($${idx}))`);
      values.push(`%${to_city}%`);
      idx++;
    }
    if (from_code) {
      conditions.push(`LOWER(origin_code) = LOWER($${idx})`);
      values.push(from_code);
      idx++;
    }
    if (to_code) {
      conditions.push(`LOWER(destination_code) = LOWER($${idx})`);
      values.push(to_code);
      idx++;
    }
    if (cabin_class) {
      conditions.push(`LOWER(cabin_class) = LOWER($${idx})`);
      values.push(cabin_class);
      idx++;
    }
    if (max_price) {
      conditions.push(`total_price <= $${idx}`);
      values.push(parseFloat(max_price as string));
      idx++;
    }
    if (non_stop === 'true' || non_stop === true as any) {
      conditions.push(`stops = 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as total FROM flights ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const queryStr = `
      SELECT * FROM flights
      ${whereClause}
      ORDER BY total_price ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const result = await query(queryStr, [...values, limit, offset]);

    const items = result.rows.map((row) => {
      const rawBaseFare = parseFloat(row.base_fare);
      const rawTaxes = parseFloat(row.taxes);

      // Centralized Dynamic Pricing Engine Calculation
      const priceQuote = computePriceWithRule(
        rawBaseFare,
        rawTaxes,
        activeRule,
        userContext.channel,
        'FLIGHT'
      );

      return {
        id: row.id,
        airline: row.airline,
        airline_code: row.airline_code,
        flight_number: row.flight_number,
        aircraft: row.aircraft,
        origin: {
          code: row.origin_code,
          name: row.origin_name,
          city: row.origin_city,
          country: row.origin_country,
        },
        destination: {
          code: row.destination_code,
          name: row.destination_name,
          city: row.destination_city,
          country: row.destination_country,
        },
        departure_time: row.departure_time,
        arrival_time: row.arrival_time,
        duration_minutes: row.duration_minutes,
        stops: row.stops,
        stops_info: row.stops_info,
        cabin_class: row.cabin_class,
        available_seats: row.available_seats,
        // Calculated Dynamic Selling Prices
        base_fare: priceQuote.selling_base_fare,
        taxes: priceQuote.supplier_taxes,
        total_price: priceQuote.total_selling_price,
        // Transparent supplier breakdown
        supplier_base_fare: priceQuote.supplier_base_fare,
        markup_amount: priceQuote.markup_amount,
        pricing_channel: userContext.channel,
        pricing_rule_applied: priceQuote.rule_applied,
        currency: row.currency,
        logo_url: row.logo_url,
        baggage_info: row.baggage_info,
        tags: row.tags,
        is_simulated: row.is_simulated,
      };
    });

    return res.json({
      success: true,
      data: {
        items,
        pricing_context: {
          channel: userContext.channel,
          is_b2b: userContext.is_mybiz_user,
          company_name: userContext.company_name,
          rule_applied: activeRule ? { id: activeRule.id, name: activeRule.name, type: activeRule.calculation_type, value: activeRule.value } : null,
        },
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /flights/:id
router.get('/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query('SELECT * FROM flights WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Flight not found' });
    }
    const row = result.rows[0];

    const userContext = await detectUserPricingChannel(req.user?.id);
    const activeRule = await resolvePricingRule(userContext.channel, 'FLIGHT', userContext.company_id);
    const rawBaseFare = parseFloat(row.base_fare);
    const rawTaxes = parseFloat(row.taxes);
    const priceQuote = computePriceWithRule(
      rawBaseFare,
      rawTaxes,
      activeRule,
      userContext.channel,
      'FLIGHT'
    );

    return res.json({
      success: true,
      data: {
        id: row.id,
        airline: row.airline,
        airline_code: row.airline_code,
        flight_number: row.flight_number,
        aircraft: row.aircraft,
        origin: {
          code: row.origin_code,
          name: row.origin_name,
          city: row.origin_city,
          country: row.origin_country,
        },
        destination: {
          code: row.destination_code,
          name: row.destination_name,
          city: row.destination_city,
          country: row.destination_country,
        },
        departure_time: row.departure_time,
        arrival_time: row.arrival_time,
        duration_minutes: row.duration_minutes,
        stops: row.stops,
        stops_info: row.stops_info,
        cabin_class: row.cabin_class,
        available_seats: row.available_seats,
        // Dynamic selling price
        base_fare: priceQuote.selling_base_fare,
        taxes: priceQuote.supplier_taxes,
        total_price: priceQuote.total_selling_price,
        supplier_base_fare: priceQuote.supplier_base_fare,
        markup_amount: priceQuote.markup_amount,
        pricing_channel: userContext.channel,
        pricing_rule_applied: priceQuote.rule_applied,
        currency: row.currency,
        logo_url: row.logo_url,
        baggage_info: row.baggage_info,
        tags: row.tags,
        is_simulated: row.is_simulated,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

