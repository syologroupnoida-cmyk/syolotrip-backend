import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../db/index.js';

export interface WalletBalances {
  walletId: string;
  customerId: string;
  currency: string;
  cashAvailable: number;
  cashReserved: number;
  promoAvailable: number;
  promoReserved: number;
  totalEligible: number;
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED';
  freezeReason?: string | null;
}

export interface LedgerEntrySpec {
  accountCode: string;
  walletAccountId?: string | null;
  debitAmount: number;
  creditAmount: number;
  currency?: string;
}

export interface ReserveFundsParams {
  customerId: string;
  bookingId: string;
  cashRequested: number;
  promoRequested: number;
  serviceType: string;
  bookingAmount: number;
  idempotencyKey?: string;
}

export interface PromotionalLotItem {
  id: string;
  lotReference: string;
  rewardSource: string;
  originalAmount: number;
  remainingAmount: number;
  expiryDate: string;
  applicableServices: string[];
  minBookingAmount: number;
  maxUsableAmount?: number | null;
  status: string;
}

// Chart of Accounts Constants
export const ACCOUNTS = {
  GATEWAY_CLEARING: '1010_GATEWAY_CLEARING',
  CASH_WALLET_LIABILITY: '2010_CASH_WALLET_LIABILITY',
  PROMO_WALLET_LIABILITY: '2020_PROMO_WALLET_LIABILITY',
  PROMO_MARKETING_EXPENSE: '5010_PROMO_MARKETING_EXPENSE',
  BOOKING_SETTLEMENT: '2030_BOOKING_SETTLEMENT',
  REFUND_CLEARING: '2040_REFUND_CLEARING',
  WALLET_ADJUSTMENT: '4010_WALLET_ADJUSTMENT',
};

// ==========================================
// 1. Feature Flag / Config Accessors
// ==========================================
export async function getWalletConfig(key: string, defaultValue: string = 'false'): Promise<string> {
  try {
    const res = await query('SELECT value FROM wallet_config WHERE key = $1', [key]);
    if (res.rows.length > 0) {
      return res.rows[0].value;
    }
    return defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

export async function isFeatureEnabled(key: string, defaultVal: boolean = false): Promise<boolean> {
  const val = await getWalletConfig(key, defaultVal ? 'true' : 'false');
  return val.trim().toLowerCase() === 'true';
}

export async function updateWalletConfig(key: string, value: string, description?: string): Promise<void> {
  await query(
    `INSERT INTO wallet_config (key, value, description, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (key) DO UPDATE
     SET value = EXCLUDED.value, description = COALESCE(EXCLUDED.description, wallet_config.description), updated_at = NOW()`,
    [key, value, description || null]
  );
}

// ==========================================
// 2. Double-Entry Verification Helper
// ==========================================
export function assertBalancedJournal(entries: LedgerEntrySpec[]): void {
  let totalDebits = 0;
  let totalCredits = 0;

  for (const e of entries) {
    if (e.debitAmount < 0 || e.creditAmount < 0) {
      throw new Error(`Negative amounts not permitted in ledger entry: debit=${e.debitAmount}, credit=${e.creditAmount}`);
    }
    totalDebits += Math.round(e.debitAmount * 100);
    totalCredits += Math.round(e.creditAmount * 100);
  }

  if (totalDebits !== totalCredits) {
    throw new Error(
      `Double-entry imbalance detected: Total Debits (₹${(totalDebits / 100).toFixed(2)}) != Total Credits (₹${(totalCredits / 100).toFixed(2)})`
    );
  }
}

// ==========================================
// 3. Wallet Account Lifecycle & Balance Lookup
// ==========================================
export async function getOrCreateWallet(client: any, customerId: string, forUpdate: boolean = false): Promise<any> {
  const selectQuery = forUpdate
    ? 'SELECT * FROM wallet_accounts WHERE customer_id = $1 FOR UPDATE'
    : 'SELECT * FROM wallet_accounts WHERE customer_id = $1';

  let res = await client.query(selectQuery, [customerId]);
  if (res.rows.length === 0) {
    const insertRes = await client.query(
      `INSERT INTO wallet_accounts (customer_id, currency, cash_available_balance, cash_reserved_balance, promotional_available_balance, promotional_reserved_balance, status)
       VALUES ($1, 'INR', 0.00, 0.00, 0.00, 0.00, 'ACTIVE')
       ON CONFLICT (customer_id) DO NOTHING
       RETURNING *`,
      [customerId]
    );
    if (insertRes.rows.length > 0) {
      return insertRes.rows[0];
    }
    res = await client.query(selectQuery, [customerId]);
  }
  return res.rows[0];
}

export async function getWalletBalances(customerId: string): Promise<WalletBalances> {
  const isEnabled = await isFeatureEnabled('WALLET_ENABLED', true);
  if (!isEnabled) {
    throw new Error('Wallet subsystem is currently disabled by system administrator');
  }

  const client = await getClient();
  try {
    const wallet = await getOrCreateWallet(client, customerId, false);
    const cashAvail = parseFloat(wallet.cash_available_balance || 0);
    const cashRes = parseFloat(wallet.cash_reserved_balance || 0);
    const promoAvail = parseFloat(wallet.promotional_available_balance || 0);
    const promoRes = parseFloat(wallet.promotional_reserved_balance || 0);

    return {
      walletId: wallet.id,
      customerId: wallet.customer_id,
      currency: wallet.currency || 'INR',
      cashAvailable: cashAvail,
      cashReserved: cashRes,
      promoAvailable: promoAvail,
      promoReserved: promoRes,
      totalEligible: Math.round((cashAvail + promoAvail) * 100) / 100,
      status: wallet.status || 'ACTIVE',
      freezeReason: wallet.freeze_reason,
    };
  } finally {
    client.release();
  }
}

// ==========================================
// 4. Promotional Lots & FIFO Eligibility
// ==========================================
export async function getEligiblePromotionalCredits(
  client: any,
  customerId: string,
  serviceType: string,
  bookingAmount: number
): Promise<{ eligibleTotal: number; applicableLots: any[] }> {
  const isPromoEnabled = await isFeatureEnabled('PROMOTIONAL_WALLET_ENABLED', true);
  if (!isPromoEnabled) {
    return { eligibleTotal: 0, applicableLots: [] };
  }

  const normService = serviceType.toUpperCase();

  // Expire outdated lots first
  await client.query(
    `UPDATE promotional_credit_lots
     SET status = 'EXPIRED', updated_at = NOW()
     WHERE customer_id = $1 AND status = 'ACTIVE' AND expiry_date <= NOW()`,
    [customerId]
  );

  const lotsRes = await client.query(
    `SELECT * FROM promotional_credit_lots
     WHERE customer_id = $1
       AND status = 'ACTIVE'
       AND remaining_amount > 0
       AND expiry_date > NOW()
       AND (min_booking_amount <= $2 OR min_booking_amount IS NULL)
     ORDER BY expiry_date ASC`,
    [customerId, bookingAmount]
  );

  let eligibleTotal = 0;
  const applicableLots: any[] = [];

  for (const lot of lotsRes.rows) {
    let services: string[] = [];
    if (typeof lot.applicable_services === 'string') {
      try { services = JSON.parse(lot.applicable_services); } catch (e) { services = []; }
    } else if (Array.isArray(lot.applicable_services)) {
      services = lot.applicable_services;
    }

    const matchesService =
      services.length === 0 ||
      services.map((s) => s.toUpperCase()).includes(normService) ||
      services.includes('ALL');

    if (matchesService) {
      let lotCap = parseFloat(lot.remaining_amount);
      if (lot.max_usable_amount) {
        lotCap = Math.min(lotCap, parseFloat(lot.max_usable_amount));
      }
      if (lotCap > 0) {
        eligibleTotal += lotCap;
        applicableLots.push({
          ...lot,
          usableFromLot: lotCap,
        });
      }
    }
  }

  return {
    eligibleTotal: Math.round(eligibleTotal * 100) / 100,
    applicableLots,
  };
}

// ==========================================
// 5. Reservation Engine (Atomic Pre-Commit)
// ==========================================
export async function reserveWalletFunds(params: ReserveFundsParams): Promise<{
  reservationId: string;
  reservationReference: string;
  cashReserved: number;
  promoReserved: number;
  expiresAt: string;
}> {
  const { customerId, bookingId, cashRequested, promoRequested, serviceType, bookingAmount, idempotencyKey } = params;

  const isWalletEnabled = await isFeatureEnabled('WALLET_ENABLED', true);
  const isPaymentEnabled = await isFeatureEnabled('WALLET_PAYMENT_ENABLED', true);
  if (!isWalletEnabled || !isPaymentEnabled) {
    throw new Error('Wallet payments are temporarily disabled for platform maintenance');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Check if an active reservation already exists for this booking
    const existingRes = await client.query(
      `SELECT * FROM wallet_reservations WHERE booking_id = $1 AND status = 'PENDING' AND expires_at > NOW()`,
      [bookingId]
    );
    if (existingRes.rows.length > 0) {
      const row = existingRes.rows[0];
      await client.query('COMMIT');
      return {
        reservationId: row.id,
        reservationReference: row.reservation_reference,
        cashReserved: parseFloat(row.cash_reserved),
        promoReserved: parseFloat(row.promotional_reserved),
        expiresAt: row.expires_at,
      };
    }

    const wallet = await getOrCreateWallet(client, customerId, true);
    if (wallet.status !== 'ACTIVE') {
      throw new Error(`Wallet is ${wallet.status}. Cannot process payments. Reason: ${wallet.freeze_reason || 'N/A'}`);
    }

    const cashAvail = parseFloat(wallet.cash_available_balance || 0);
    const promoAvail = parseFloat(wallet.promotional_available_balance || 0);

    const safeCashReq = Math.max(0, Math.round(cashRequested * 100) / 100);
    const safePromoReq = Math.max(0, Math.round(promoRequested * 100) / 100);

    if (safeCashReq > cashAvail) {
      throw new Error(`Insufficient cash wallet balance (Requested: ₹${safeCashReq}, Available: ₹${cashAvail})`);
    }

    // Verify promotional lots eligibility
    let promoToReserve = 0;
    const lotsReservedList: { lot_id: string; amount: number }[] = [];

    if (safePromoReq > 0) {
      const { eligibleTotal, applicableLots } = await getEligiblePromotionalCredits(
        client,
        customerId,
        serviceType,
        bookingAmount
      );

      if (safePromoReq > eligibleTotal || safePromoReq > promoAvail) {
        throw new Error(
          `Requested promotional credits exceed eligible amount for ${serviceType} (Requested: ₹${safePromoReq}, Eligible: ₹${eligibleTotal})`
        );
      }

      let remainingToDeduct = safePromoReq;
      for (const lot of applicableLots) {
        if (remainingToDeduct <= 0) break;
        const take = Math.min(lot.usableFromLot, remainingToDeduct);
        lotsReservedList.push({ lot_id: lot.id, amount: take });
        remainingToDeduct -= take;
        promoToReserve += take;
      }
    }

    // Atomically reserve balances
    await client.query(
      `UPDATE wallet_accounts
       SET cash_available_balance = cash_available_balance - $1,
           cash_reserved_balance = cash_reserved_balance + $1,
           promotional_available_balance = promotional_available_balance - $2,
           promotional_reserved_balance = promotional_reserved_balance + $2,
           updated_at = NOW()
       WHERE id = $3`,
      [safeCashReq, promoToReserve, wallet.id]
    );

    const ref = 'RES-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
    const reservationRes = await client.query(
      `INSERT INTO wallet_reservations (
        reservation_reference, customer_id, wallet_account_id, booking_id,
        cash_reserved, promotional_reserved, lots_reserved, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW() + INTERVAL '15 minutes')
      RETURNING *`,
      [ref, customerId, wallet.id, bookingId, safeCashReq, promoToReserve, JSON.stringify(lotsReservedList)]
    );

    await client.query('COMMIT');
    const r = reservationRes.rows[0];

    return {
      reservationId: r.id,
      reservationReference: r.reservation_reference,
      cashReserved: parseFloat(r.cash_reserved),
      promoReserved: parseFloat(r.promotional_reserved),
      expiresAt: r.expires_at,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// 6. Commit Wallet Reservation & Ledger Journal
// ==========================================
export async function commitWalletReservation(params: {
  reservationId: string;
  paymentId?: string;
  externalClient?: any;
}): Promise<{ journalId: string; transactionReference: string }> {
  const { reservationId, paymentId, externalClient } = params;
  const client = externalClient || (await getClient());
  const shouldManageTx = !externalClient;

  try {
    if (shouldManageTx) await client.query('BEGIN');

    const resRes = await client.query(
      `SELECT r.*, w.customer_id, w.currency 
       FROM wallet_reservations r
       JOIN wallet_accounts w ON r.wallet_account_id = w.id
       WHERE r.id = $1 FOR UPDATE`,
      [reservationId]
    );

    if (resRes.rows.length === 0) {
      throw new Error(`Wallet reservation ${reservationId} not found`);
    }

    const resv = resRes.rows[0];
    if (resv.status === 'COMMITTED') {
      // Idempotent return
      const jRes = await client.query(
        `SELECT id, transaction_reference FROM wallet_journals WHERE related_booking_id = $1 LIMIT 1`,
        [resv.booking_id]
      );
      if (shouldManageTx) await client.query('COMMIT');
      return {
        journalId: jRes.rows[0]?.id || 'EXISTING',
        transactionReference: jRes.rows[0]?.transaction_reference || 'EXISTING',
      };
    }

    if (resv.status !== 'PENDING') {
      throw new Error(`Reservation is in state ${resv.status}, cannot commit`);
    }

    const cashReserved = parseFloat(resv.cash_reserved || 0);
    const promoReserved = parseFloat(resv.promotional_reserved || 0);
    const totalDeducted = Math.round((cashReserved + promoReserved) * 100) / 100;

    // 1. Clear reservation balances from wallet_accounts
    await client.query(
      `UPDATE wallet_accounts
       SET cash_reserved_balance = cash_reserved_balance - $1,
           promotional_reserved_balance = promotional_reserved_balance - $2,
           updated_at = NOW()
       WHERE id = $3`,
      [cashReserved, promoReserved, resv.wallet_account_id]
    );

    // 2. Consume promotional credit lots
    const lotsReserved: { lot_id: string; amount: number }[] =
      typeof resv.lots_reserved === 'string' ? JSON.parse(resv.lots_reserved) : resv.lots_reserved || [];

    for (const lotAlloc of lotsReserved) {
      await client.query(
        `UPDATE promotional_credit_lots
         SET remaining_amount = GREATEST(0, remaining_amount - $1),
             status = CASE WHEN remaining_amount - $1 <= 0 THEN 'EXHAUSTED' ELSE status END,
             updated_at = NOW()
         WHERE id = $2`,
        [lotAlloc.amount, lotAlloc.lot_id]
      );
    }

    // 3. Create Double-Entry Journal
    const txRef = 'TX-BOOK-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
    const journalRes = await client.query(
      `INSERT INTO wallet_journals (
        transaction_reference, transaction_type, status, description,
        related_booking_id, related_payment_id, completed_at
      ) VALUES ($1, 'BOOKING_PAYMENT', 'POSTED', $2, $3, $4, NOW())
      RETURNING *`,
      [txRef, `Wallet payment applied to booking #${resv.booking_id}`, resv.booking_id, paymentId || null]
    );
    const journal = journalRes.rows[0];

    // 4. Ledger Entries: Total Debits == Total Credits
    const ledgerEntries: LedgerEntrySpec[] = [];
    if (cashReserved > 0) {
      ledgerEntries.push({
        accountCode: ACCOUNTS.CASH_WALLET_LIABILITY,
        walletAccountId: resv.wallet_account_id,
        debitAmount: cashReserved,
        creditAmount: 0.00,
      });
    }
    if (promoReserved > 0) {
      ledgerEntries.push({
        accountCode: ACCOUNTS.PROMO_WALLET_LIABILITY,
        walletAccountId: resv.wallet_account_id,
        debitAmount: promoReserved,
        creditAmount: 0.00,
      });
    }
    if (totalDeducted > 0) {
      ledgerEntries.push({
        accountCode: ACCOUNTS.BOOKING_SETTLEMENT,
        debitAmount: 0.00,
        creditAmount: totalDeducted,
      });
    }

    assertBalancedJournal(ledgerEntries);

    for (const le of ledgerEntries) {
      await client.query(
        `INSERT INTO wallet_ledger_entries (
          journal_id, account_code, wallet_account_id, debit_amount, credit_amount, currency
        ) VALUES ($1, $2, $3, $4, $5, 'INR')`,
        [journal.id, le.accountCode, le.walletAccountId || null, le.debitAmount, le.creditAmount]
      );
    }

    // 5. Customer Readable Transactions
    if (cashReserved > 0) {
      await client.query(
        `INSERT INTO wallet_transactions (
          transaction_id, customer_id, wallet_account_id, journal_id, wallet_type,
          direction, transaction_type, amount, currency, status, description,
          reference_id, booking_id, payment_id, completed_at
        ) VALUES ($1, $2, $3, $4, 'CASH', 'DEBIT', 'BOOKING_PAYMENT', $5, 'INR', 'COMPLETED', $6, $7, $8, $9, NOW())`,
        [
          'TXC-' + uuidv4().slice(0, 8),
          resv.customer_id,
          resv.wallet_account_id,
          journal.id,
          cashReserved,
          'Paid towards travel booking',
          txRef,
          resv.booking_id,
          paymentId || null,
        ]
      );
    }

    if (promoReserved > 0) {
      await client.query(
        `INSERT INTO wallet_transactions (
          transaction_id, customer_id, wallet_account_id, journal_id, wallet_type,
          direction, transaction_type, amount, currency, status, description,
          reference_id, booking_id, payment_id, completed_at
        ) VALUES ($1, $2, $3, $4, 'PROMOTIONAL', 'DEBIT', 'PROMOTIONAL_REDEMPTION', $5, 'INR', 'COMPLETED', $6, $7, $8, $9, NOW())`,
        [
          'TXP-' + uuidv4().slice(0, 8),
          resv.customer_id,
          resv.wallet_account_id,
          journal.id,
          promoReserved,
          'Promotional credits redeemed',
          txRef,
          resv.booking_id,
          paymentId || null,
        ]
      );
    }

    // 6. Mark reservation COMMITTED
    await client.query(
      `UPDATE wallet_reservations SET status = 'COMMITTED', updated_at = NOW() WHERE id = $1`,
      [reservationId]
    );

    // 7. Update booking mixed payment columns
    await client.query(
      `UPDATE bookings 
       SET cash_wallet_amount = $1, promotional_wallet_amount = $2, updated_at = NOW()
       WHERE id = $3`,
      [cashReserved, promoReserved, resv.booking_id]
    );

    if (shouldManageTx) await client.query('COMMIT');

    return {
      journalId: journal.id,
      transactionReference: txRef,
    };
  } catch (err) {
    if (shouldManageTx) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (shouldManageTx) client.release();
  }
}

// ==========================================
// 7. Release Wallet Reservation (Rollback)
// ==========================================
export async function releaseWalletReservation(params: {
  reservationId: string;
  reason?: string;
  externalClient?: any;
}): Promise<void> {
  const { reservationId, reason, externalClient } = params;
  const client = externalClient || (await getClient());
  const shouldManageTx = !externalClient;

  try {
    if (shouldManageTx) await client.query('BEGIN');

    const resRes = await client.query(
      `SELECT * FROM wallet_reservations WHERE id = $1 FOR UPDATE`,
      [reservationId]
    );

    if (resRes.rows.length === 0) return;
    const resv = resRes.rows[0];

    if (resv.status !== 'PENDING') return;

    const cashReserved = parseFloat(resv.cash_reserved || 0);
    const promoReserved = parseFloat(resv.promotional_reserved || 0);

    // Return reserved amounts back to available
    await client.query(
      `UPDATE wallet_accounts
       SET cash_available_balance = cash_available_balance + $1,
           cash_reserved_balance = cash_reserved_balance - $1,
           promotional_available_balance = promotional_available_balance + $2,
           promotional_reserved_balance = promotional_reserved_balance - $2,
           updated_at = NOW()
       WHERE id = $3`,
      [cashReserved, promoReserved, resv.wallet_account_id]
    );

    await client.query(
      `UPDATE wallet_reservations SET status = 'RELEASED', updated_at = NOW() WHERE id = $1`,
      [reservationId]
    );

    if (shouldManageTx) await client.query('COMMIT');
  } catch (err) {
    if (shouldManageTx) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (shouldManageTx) client.release();
  }
}

// ==========================================
// 8. Cash Top-Up (Gated by CASH_TOPUP_ENABLED)
// ==========================================
export async function creditCashTopup(params: {
  customerId: string;
  amount: number;
  razorpayPaymentId?: string;
  idempotencyKey?: string;
  adminOverride?: boolean;
}): Promise<any> {
  const { customerId, amount, razorpayPaymentId, idempotencyKey, adminOverride } = params;

  if (amount <= 0) throw new Error('Top-up amount must be strictly greater than 0');

  const isCashTopupEnabled = await isFeatureEnabled('CASH_TOPUP_ENABLED', false);
  if (!isCashTopupEnabled && !adminOverride) {
    throw new Error(
      'Direct customer stored-value top-up is temporarily disabled pending regulatory PPI license review. Travel credits and booking refunds remain active.'
    );
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Idempotency guard
    if (idempotencyKey) {
      const existing = await client.query(
        `SELECT * FROM wallet_journals WHERE idempotency_key = $1`,
        [idempotencyKey]
      );
      if (existing.rows.length > 0) {
        await client.query('COMMIT');
        return { message: 'Already processed (idempotent)', journal: existing.rows[0] };
      }
    }

    const wallet = await getOrCreateWallet(client, customerId, true);
    if (wallet.status !== 'ACTIVE') {
      throw new Error(`Wallet is ${wallet.status}. Cannot accept top-ups.`);
    }

    const cleanAmount = Math.round(amount * 100) / 100;
    const txRef = 'TOPUP-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);

    // Double-entry journal
    const journalRes = await client.query(
      `INSERT INTO wallet_journals (
        transaction_reference, transaction_type, status, description, idempotency_key, completed_at
      ) VALUES ($1, 'CASH_TOPUP', 'POSTED', $2, $3, NOW())
      RETURNING *`,
      [txRef, `Cash wallet top-up via payment ${razorpayPaymentId || 'DIRECT'}`, idempotencyKey || null]
    );
    const journal = journalRes.rows[0];

    const entries: LedgerEntrySpec[] = [
      {
        accountCode: ACCOUNTS.GATEWAY_CLEARING,
        debitAmount: cleanAmount,
        creditAmount: 0.00,
      },
      {
        accountCode: ACCOUNTS.CASH_WALLET_LIABILITY,
        walletAccountId: wallet.id,
        debitAmount: 0.00,
        creditAmount: cleanAmount,
      },
    ];

    assertBalancedJournal(entries);

    for (const le of entries) {
      await client.query(
        `INSERT INTO wallet_ledger_entries (journal_id, account_code, wallet_account_id, debit_amount, credit_amount, currency)
         VALUES ($1, $2, $3, $4, $5, 'INR')`,
        [journal.id, le.accountCode, le.walletAccountId || null, le.debitAmount, le.creditAmount]
      );
    }

    // Update wallet account balance
    await client.query(
      `UPDATE wallet_accounts
       SET cash_available_balance = cash_available_balance + $1, updated_at = NOW()
       WHERE id = $2`,
      [cleanAmount, wallet.id]
    );

    const txRes = await client.query(
      `INSERT INTO wallet_transactions (
        transaction_id, customer_id, wallet_account_id, journal_id, wallet_type,
        direction, transaction_type, amount, currency, status, description,
        reference_id, idempotency_key, completed_at
      ) VALUES ($1, $2, $3, $4, 'CASH', 'CREDIT', 'CASH_TOPUP', $5, 'INR', 'COMPLETED', $6, $7, $8, NOW())
      RETURNING *`,
      [
        'TX-TOP-' + uuidv4().slice(0, 8),
        customerId,
        wallet.id,
        journal.id,
        cleanAmount,
        'Cash balance top-up',
        txRef,
        idempotencyKey || null,
      ]
    );

    await client.query('COMMIT');
    return txRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// 9. Award Promotional Credit / Cashback
// ==========================================
export async function awardPromotionalCredit(params: {
  customerId: string;
  amount: number;
  rewardSource: string;
  campaignId?: string;
  validityDays?: number;
  applicableServices?: string[];
  minBookingAmount?: number;
  bookingId?: string;
  idempotencyKey?: string;
  description?: string;
}): Promise<any> {
  const {
    customerId,
    amount,
    rewardSource,
    campaignId,
    validityDays = 90,
    applicableServices = ['FLIGHT', 'HOTEL', 'VILLA', 'PACKAGE', 'TRAIN', 'BUS', 'CAB', 'TOUR', 'VISA', 'INSURANCE'],
    minBookingAmount = 0,
    bookingId,
    idempotencyKey,
    description,
  } = params;

  if (amount <= 0) return null;

  const isPromoEnabled = await isFeatureEnabled('PROMOTIONAL_WALLET_ENABLED', true);
  if (!isPromoEnabled) return null;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    if (idempotencyKey) {
      const existing = await client.query('SELECT * FROM wallet_journals WHERE idempotency_key = $1', [idempotencyKey]);
      if (existing.rows.length > 0) {
        await client.query('COMMIT');
        return { message: 'Already awarded', journal: existing.rows[0] };
      }
    }

    const wallet = await getOrCreateWallet(client, customerId, true);
    const cleanAmount = Math.round(amount * 100) / 100;
    const lotRef = 'LOT-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
    const txRef = 'REWARD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Create Promotional Credit Lot
    const lotRes = await client.query(
      `INSERT INTO promotional_credit_lots (
        customer_id, wallet_account_id, lot_reference, reward_source, original_amount,
        remaining_amount, currency, campaign_id, applicable_services, min_booking_amount,
        issue_date, expiry_date, status
      ) VALUES ($1, $2, $3, $4, $5, $5, 'INR', $6, $7, $8, NOW(), NOW() + ($9 || ' days')::INTERVAL, 'ACTIVE')
      RETURNING *`,
      [
        customerId,
        wallet.id,
        lotRef,
        rewardSource,
        cleanAmount,
        campaignId || null,
        JSON.stringify(applicableServices),
        minBookingAmount,
        validityDays,
      ]
    );

    // 2. Double-entry Journal
    const journalRes = await client.query(
      `INSERT INTO wallet_journals (
        transaction_reference, transaction_type, status, description,
        idempotency_key, related_booking_id, completed_at
      ) VALUES ($1, 'PROMOTIONAL_CREDIT', 'POSTED', $2, $3, $4, NOW())
      RETURNING *`,
      [txRef, description || `Promotional reward from ${rewardSource}`, idempotencyKey || null, bookingId || null]
    );
    const journal = journalRes.rows[0];

    const entries: LedgerEntrySpec[] = [
      {
        accountCode: ACCOUNTS.PROMO_MARKETING_EXPENSE,
        debitAmount: cleanAmount,
        creditAmount: 0.00,
      },
      {
        accountCode: ACCOUNTS.PROMO_WALLET_LIABILITY,
        walletAccountId: wallet.id,
        debitAmount: 0.00,
        creditAmount: cleanAmount,
      },
    ];

    assertBalancedJournal(entries);

    for (const le of entries) {
      await client.query(
        `INSERT INTO wallet_ledger_entries (journal_id, account_code, wallet_account_id, debit_amount, credit_amount, currency)
         VALUES ($1, $2, $3, $4, $5, 'INR')`,
        [journal.id, le.accountCode, le.walletAccountId || null, le.debitAmount, le.creditAmount]
      );
    }

    // 3. Update wallet promotional balance
    await client.query(
      `UPDATE wallet_accounts
       SET promotional_available_balance = promotional_available_balance + $1, updated_at = NOW()
       WHERE id = $2`,
      [cleanAmount, wallet.id]
    );

    // 4. Log customer transaction
    await client.query(
      `INSERT INTO wallet_transactions (
        transaction_id, customer_id, wallet_account_id, journal_id, wallet_type,
        direction, transaction_type, amount, currency, status, description,
        reference_id, booking_id, idempotency_key, completed_at
      ) VALUES ($1, $2, $3, $4, 'PROMOTIONAL', 'CREDIT', $5, $6, 'INR', 'COMPLETED', $7, $8, $9, $10, NOW())`,
      [
        'TX-PRO-' + uuidv4().slice(0, 8),
        customerId,
        wallet.id,
        journal.id,
        rewardSource === 'BOOKING_CASHBACK' ? 'CASHBACK_CREDIT' : 'PROMOTIONAL_CREDIT',
        cleanAmount,
        description || 'Promotional travel credit received',
        txRef,
        bookingId || null,
        idempotencyKey || null,
      ]
    );

    // 5. Update campaign totals if campaignId provided
    if (campaignId) {
      await client.query(
        `UPDATE promotional_campaigns
         SET total_issued = total_issued + $1, updated_at = NOW()
         WHERE id = $2`,
        [cleanAmount, campaignId]
      );
    }

    await client.query('COMMIT');
    return lotRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// 10. Booking Cashback Auto-Evaluation
// ==========================================
export async function evaluateAndAwardBookingCashback(bookingId: string): Promise<any> {
  try {
    const bRes = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bRes.rows.length === 0) return null;
    const b = bRes.rows[0];

    if (b.status !== 'CONFIRMED' && b.status !== 'COMPLETED') return null;
    if (!b.user_id) return null;

    const totalAmount = parseFloat(b.total_amount || 0);

    // Find active cashback campaign
    const campRes = await query(
      `SELECT * FROM promotional_campaigns
       WHERE campaign_type = 'CASHBACK'
         AND is_active = true
         AND start_date <= NOW()
         AND end_date >= NOW()
         AND min_booking_amount <= $1
       ORDER BY reward_value DESC LIMIT 1`,
      [totalAmount]
    );

    if (campRes.rows.length === 0) return null;
    const camp = campRes.rows[0];

    let cashbackAmount = 0;
    if (camp.reward_type === 'PERCENTAGE') {
      cashbackAmount = Math.round(totalAmount * (parseFloat(camp.reward_value) / 100));
      if (camp.max_reward_amount) {
        cashbackAmount = Math.min(cashbackAmount, parseFloat(camp.max_reward_amount));
      }
    } else {
      cashbackAmount = parseFloat(camp.reward_value);
    }

    if (cashbackAmount <= 0) return null;

    return await awardPromotionalCredit({
      customerId: b.user_id,
      amount: cashbackAmount,
      rewardSource: 'BOOKING_CASHBACK',
      campaignId: camp.id,
      validityDays: camp.validity_days || 90,
      applicableServices: camp.applicable_services || [],
      bookingId: b.id,
      idempotencyKey: `CASHBACK-BOOKING-${b.id}`,
      description: `5% Booking Cashback on Ref: ${b.booking_reference}`,
    });
  } catch (err) {
    console.warn('Failed to evaluate cashback for booking:', err);
    return null;
  }
}

// ==========================================
// 11. Cancellation & Source-Preserving Refund Engine
// ==========================================
export async function processBookingRefund(params: {
  bookingId: string;
  refundAmount: number;
  reason?: string;
  adminUserId?: string;
}): Promise<any> {
  const { bookingId, refundAmount, reason, adminUserId } = params;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const bRes = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [bookingId]);
    if (bRes.rows.length === 0) throw new Error('Booking not found');
    const b = bRes.rows[0];

    const customerId = b.user_id;
    if (!customerId) {
      throw new Error('Guest booking has no customer wallet account associated');
    }

    const totalPaid = parseFloat(b.total_amount || 0);
    const origCash = parseFloat(b.cash_wallet_amount || 0);
    const origPromo = parseFloat(b.promotional_wallet_amount || 0);
    const origGateway = Math.max(0, totalPaid - (origCash + origPromo));

    const cleanRefund = Math.min(totalPaid, Math.max(0, Math.round(refundAmount * 100) / 100));
    if (cleanRefund <= 0) {
      await client.query('COMMIT');
      return { message: 'Zero refund amount eligible' };
    }

    // Allocate refund strictly according to source contributions
    let refundToCash = 0;
    let refundToPromo = 0;
    let refundToGateway = 0;

    let remainingRefund = cleanRefund;

    // 1. Restore cash wallet contribution first
    if (origCash > 0 && remainingRefund > 0) {
      refundToCash = Math.min(origCash, remainingRefund);
      remainingRefund -= refundToCash;
    }

    // 2. Restore promotional wallet credits (with active validity)
    if (origPromo > 0 && remainingRefund > 0) {
      refundToPromo = Math.min(origPromo, remainingRefund);
      remainingRefund -= refundToPromo;
    }

    // 3. Remaining amount goes to gateway clearing
    if (remainingRefund > 0) {
      refundToGateway = Math.min(origGateway, remainingRefund);
      remainingRefund -= refundToGateway;
    }

    const wallet = await getOrCreateWallet(client, customerId, true);
    const txRef = 'REFUND-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Double-entry journal
    const journalRes = await client.query(
      `INSERT INTO wallet_journals (
        transaction_reference, transaction_type, status, description,
        related_booking_id, created_by, completed_at
      ) VALUES ($1, 'BOOKING_REFUND', 'POSTED', $2, $3, $4, NOW())
      RETURNING *`,
      [txRef, `Refund for cancelled booking #${b.booking_reference}: ${reason || 'Customer Cancellation'}`, b.id, adminUserId || null]
    );
    const journal = journalRes.rows[0];

    const entries: LedgerEntrySpec[] = [
      {
        accountCode: ACCOUNTS.BOOKING_SETTLEMENT,
        debitAmount: cleanRefund,
        creditAmount: 0.00,
      },
    ];

    if (refundToCash > 0) {
      entries.push({
        accountCode: ACCOUNTS.CASH_WALLET_LIABILITY,
        walletAccountId: wallet.id,
        debitAmount: 0.00,
        creditAmount: refundToCash,
      });
    }

    if (refundToPromo > 0) {
      entries.push({
        accountCode: ACCOUNTS.PROMO_WALLET_LIABILITY,
        walletAccountId: wallet.id,
        debitAmount: 0.00,
        creditAmount: refundToPromo,
      });
    }

    if (refundToGateway > 0) {
      entries.push({
        accountCode: ACCOUNTS.REFUND_CLEARING,
        debitAmount: 0.00,
        creditAmount: refundToGateway,
      });
    }

    assertBalancedJournal(entries);

    for (const le of entries) {
      await client.query(
        `INSERT INTO wallet_ledger_entries (journal_id, account_code, wallet_account_id, debit_amount, credit_amount, currency)
         VALUES ($1, $2, $3, $4, $5, 'INR')`,
        [journal.id, le.accountCode, le.walletAccountId || null, le.debitAmount, le.creditAmount]
      );
    }

    // Update balances
    if (refundToCash > 0) {
      await client.query(
        `UPDATE wallet_accounts
         SET cash_available_balance = cash_available_balance + $1, updated_at = NOW()
         WHERE id = $2`,
        [refundToCash, wallet.id]
      );

      await client.query(
        `INSERT INTO wallet_transactions (
          transaction_id, customer_id, wallet_account_id, journal_id, wallet_type,
          direction, transaction_type, amount, currency, status, description,
          reference_id, booking_id, completed_at
        ) VALUES ($1, $2, $3, $4, 'CASH', 'CREDIT', 'BOOKING_REFUND', $5, 'INR', 'COMPLETED', $6, $7, $8, NOW())`,
        [
          'TXR-C-' + uuidv4().slice(0, 8),
          customerId,
          wallet.id,
          journal.id,
          refundToCash,
          `Refund credited to Cash Wallet (Ref: ${b.booking_reference})`,
          txRef,
          b.id,
        ]
      );
    }

    if (refundToPromo > 0) {
      await client.query(
        `UPDATE wallet_accounts
         SET promotional_available_balance = promotional_available_balance + $1, updated_at = NOW()
         WHERE id = $2`,
        [refundToPromo, wallet.id]
      );

      // Re-create promotional lot with fresh 60 days validity
      await client.query(
        `INSERT INTO promotional_credit_lots (
          customer_id, wallet_account_id, lot_reference, reward_source, original_amount,
          remaining_amount, currency, issue_date, expiry_date, status
        ) VALUES ($1, $2, $3, 'BOOKING_REFUND', $4, $4, 'INR', NOW(), NOW() + INTERVAL '60 days', 'ACTIVE')`,
        [customerId, wallet.id, 'LOT-REF-' + Math.random().toString(36).substring(2, 8).toUpperCase(), refundToPromo]
      );

      await client.query(
        `INSERT INTO wallet_transactions (
          transaction_id, customer_id, wallet_account_id, journal_id, wallet_type,
          direction, transaction_type, amount, currency, status, description,
          reference_id, booking_id, completed_at
        ) VALUES ($1, $2, $3, $4, 'PROMOTIONAL', 'CREDIT', 'BOOKING_REFUND', $5, 'INR', 'COMPLETED', $6, $7, $8, NOW())`,
        [
          'TXR-P-' + uuidv4().slice(0, 8),
          customerId,
          wallet.id,
          journal.id,
          refundToPromo,
          `Promotional credits restored from booking #${b.booking_reference}`,
          txRef,
          b.id,
        ]
      );
    }

    await client.query('COMMIT');

    return {
      success: true,
      refundTotal: cleanRefund,
      refundToCash,
      refundToPromo,
      refundToGateway,
      transactionReference: txRef,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// 12. Admin Discretionary Balance Adjustments
// ==========================================
export async function adminAdjustBalance(params: {
  adminUserId: string;
  adminEmail: string;
  customerId: string;
  walletType: 'CASH' | 'PROMOTIONAL';
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  referenceId?: string;
}): Promise<any> {
  const { adminUserId, adminEmail, customerId, walletType, direction, amount, reason, referenceId } = params;

  if (amount <= 0) throw new Error('Adjustment amount must be positive');
  if (!reason || reason.trim().length < 5) throw new Error('A detailed reason is mandatory for admin adjustments');

  const cleanAmount = Math.round(amount * 100) / 100;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const wallet = await getOrCreateWallet(client, customerId, true);
    const txRef = 'ADJ-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const isCash = walletType === 'CASH';

    if (direction === 'DEBIT') {
      const currentAvail = isCash
        ? parseFloat(wallet.cash_available_balance)
        : parseFloat(wallet.promotional_available_balance);
      if (cleanAmount > currentAvail) {
        throw new Error(`Cannot debit ₹${cleanAmount}; customer only has ₹${currentAvail} available in ${walletType} wallet`);
      }
    }

    // Double-entry journal
    const journalRes = await client.query(
      `INSERT INTO wallet_journals (
        transaction_reference, transaction_type, status, description, created_by, completed_at
      ) VALUES ($1, $2, 'POSTED', $3, $4, NOW())
      RETURNING *`,
      [
        txRef,
        isCash ? 'ADMIN_CASH_ADJUSTMENT' : 'ADMIN_PROMOTIONAL_ADJUSTMENT',
        `Admin adjustment: ${direction} ₹${cleanAmount} to ${walletType} wallet. Reason: ${reason}`,
        adminUserId,
      ]
    );
    const journal = journalRes.rows[0];

    const liabilityAccount = isCash ? ACCOUNTS.CASH_WALLET_LIABILITY : ACCOUNTS.PROMO_WALLET_LIABILITY;
    const entries: LedgerEntrySpec[] = [];

    if (direction === 'CREDIT') {
      entries.push({
        accountCode: ACCOUNTS.WALLET_ADJUSTMENT,
        debitAmount: cleanAmount,
        creditAmount: 0.00,
      });
      entries.push({
        accountCode: liabilityAccount,
        walletAccountId: wallet.id,
        debitAmount: 0.00,
        creditAmount: cleanAmount,
      });
    } else {
      // DEBIT
      entries.push({
        accountCode: liabilityAccount,
        walletAccountId: wallet.id,
        debitAmount: cleanAmount,
        creditAmount: 0.00,
      });
      entries.push({
        accountCode: ACCOUNTS.WALLET_ADJUSTMENT,
        debitAmount: 0.00,
        creditAmount: cleanAmount,
      });
    }

    assertBalancedJournal(entries);

    for (const le of entries) {
      await client.query(
        `INSERT INTO wallet_ledger_entries (journal_id, account_code, wallet_account_id, debit_amount, credit_amount, currency)
         VALUES ($1, $2, $3, $4, $5, 'INR')`,
        [journal.id, le.accountCode, le.walletAccountId || null, le.debitAmount, le.creditAmount]
      );
    }

    // Update balances
    const balanceCol = isCash ? 'cash_available_balance' : 'promotional_available_balance';
    const sign = direction === 'CREDIT' ? '+' : '-';

    await client.query(
      `UPDATE wallet_accounts
       SET ${balanceCol} = ${balanceCol} ${sign} $1, updated_at = NOW()
       WHERE id = $2`,
      [cleanAmount, wallet.id]
    );

    // If crediting promotional wallet, create a promotional credit lot (valid 90 days)
    if (!isCash && direction === 'CREDIT') {
      await client.query(
        `INSERT INTO promotional_credit_lots (
          customer_id, wallet_account_id, lot_reference, reward_source, original_amount,
          remaining_amount, currency, issue_date, expiry_date, status
        ) VALUES ($1, $2, $3, 'ADMIN_GOODWILL', $4, $4, 'INR', NOW(), NOW() + INTERVAL '90 days', 'ACTIVE')`,
        [customerId, wallet.id, 'LOT-ADJ-' + Math.random().toString(36).substring(2, 8).toUpperCase(), cleanAmount]
      );
    }

    // Customer Transaction record
    await client.query(
      `INSERT INTO wallet_transactions (
        transaction_id, customer_id, wallet_account_id, journal_id, wallet_type,
        direction, transaction_type, amount, currency, status, description,
        reference_id, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INR', 'COMPLETED', $9, $10, NOW())`,
      [
        'TXA-' + uuidv4().slice(0, 8),
        customerId,
        wallet.id,
        journal.id,
        walletType,
        direction,
        isCash ? 'ADMIN_CASH_ADJUSTMENT' : 'ADMIN_PROMOTIONAL_ADJUSTMENT',
        cleanAmount,
        reason,
        referenceId || txRef,
      ]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, 'WALLET_ADJUSTMENT', 'wallet_accounts', $2, $3, NOW())`,
      [
        adminUserId,
        wallet.id,
        JSON.stringify({
          admin_email: adminEmail,
          customer_id: customerId,
          wallet_type: walletType,
          direction,
          amount: cleanAmount,
          reason,
          reference_id: referenceId,
          journal_id: journal.id,
        }),
      ]
    );

    await client.query('COMMIT');
    return { success: true, transactionReference: txRef, amount: cleanAmount };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// 13. Freeze / Unfreeze Wallet Account
// ==========================================
export async function setWalletFreezeState(params: {
  adminUserId: string;
  adminEmail: string;
  customerId: string;
  freeze: boolean;
  reason: string;
}): Promise<void> {
  const { adminUserId, adminEmail, customerId, freeze, reason } = params;
  if (freeze && (!reason || reason.trim().length < 5)) {
    throw new Error('A detailed reason is mandatory when freezing a customer wallet');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const wallet = await getOrCreateWallet(client, customerId, true);

    const newStatus = freeze ? 'FROZEN' : 'ACTIVE';
    await client.query(
      `UPDATE wallet_accounts
       SET status = $1, freeze_reason = $2, frozen_at = $3, frozen_by = $4, updated_at = NOW()
       WHERE id = $5`,
      [newStatus, freeze ? reason : null, freeze ? new Date().toISOString() : null, freeze ? adminUserId : null, wallet.id]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, $2, 'wallet_accounts', $3, $4, NOW())`,
      [
        adminUserId,
        freeze ? 'WALLET_FREEZE' : 'WALLET_UNFREEZE',
        wallet.id,
        JSON.stringify({ admin_email: adminEmail, customer_id: customerId, reason }),
      ]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// 14. Comprehensive Reconciliation Report
// ==========================================
export async function runReconciliationReport(): Promise<{
  cashLiabilitiesFromAccounts: number;
  cashLiabilitiesFromLedger: number;
  cashVariance: number;
  promoLiabilitiesFromAccounts: number;
  promoLiabilitiesFromLedger: number;
  promoVariance: number;
  totalJournals: number;
  unbalancedJournalsCount: number;
  unbalancedJournals: any[];
  staleReservationsCount: number;
  isFullyReconciled: boolean;
}> {
  // 1. Sum balances from wallet_accounts
  const acctRes = await query(`
    SELECT 
      COALESCE(SUM(cash_available_balance + cash_reserved_balance), 0) as total_cash,
      COALESCE(SUM(promotional_available_balance + promotional_reserved_balance), 0) as total_promo
    FROM wallet_accounts
  `);
  const cashAccts = parseFloat(acctRes.rows[0].total_cash || 0);
  const promoAccts = parseFloat(acctRes.rows[0].total_promo || 0);

  // 2. Net credits minus debits from wallet_ledger_entries
  const ledgerRes = await query(`
    SELECT 
      account_code,
      COALESCE(SUM(credit_amount) - SUM(debit_amount), 0) as net_liability
    FROM wallet_ledger_entries
    WHERE account_code IN ('${ACCOUNTS.CASH_WALLET_LIABILITY}', '${ACCOUNTS.PROMO_WALLET_LIABILITY}')
    GROUP BY account_code
  `);

  let cashLedger = 0;
  let promoLedger = 0;
  for (const row of ledgerRes.rows) {
    if (row.account_code === ACCOUNTS.CASH_WALLET_LIABILITY) cashLedger = parseFloat(row.net_liability);
    if (row.account_code === ACCOUNTS.PROMO_WALLET_LIABILITY) promoLedger = parseFloat(row.net_liability);
  }

  // 3. Detect any unbalanced journals in the database
  const journalBalanceRes = await query(`
    SELECT j.id, j.transaction_reference, 
           SUM(le.debit_amount) as total_debit, 
           SUM(le.credit_amount) as total_credit,
           ABS(SUM(le.debit_amount) - SUM(le.credit_amount)) as diff
    FROM wallet_journals j
    JOIN wallet_ledger_entries le ON j.id = le.journal_id
    GROUP BY j.id, j.transaction_reference
    HAVING ABS(SUM(le.debit_amount) - SUM(le.credit_amount)) > 0.001
  `);

  // 4. Stale reservations (pending and expired)
  const staleRes = await query(`
    SELECT COUNT(*) as cnt FROM wallet_reservations 
    WHERE status = 'PENDING' AND expires_at < NOW()
  `);
  const staleCount = parseInt(staleRes.rows[0].cnt || '0', 10);

  const cashVariance = Math.round((cashAccts - cashLedger) * 100) / 100;
  const promoVariance = Math.round((promoAccts - promoLedger) * 100) / 100;
  const totalJournalsRes = await query('SELECT COUNT(*) as cnt FROM wallet_journals');
  const totalJournals = parseInt(totalJournalsRes.rows[0].cnt || '0', 10);

  const isFullyReconciled =
    Math.abs(cashVariance) === 0 &&
    Math.abs(promoVariance) === 0 &&
    journalBalanceRes.rows.length === 0;

  return {
    cashLiabilitiesFromAccounts: cashAccts,
    cashLiabilitiesFromLedger: cashLedger,
    cashVariance,
    promoLiabilitiesFromAccounts: promoAccts,
    promoLiabilitiesFromLedger: promoLedger,
    promoVariance,
    totalJournals,
    unbalancedJournalsCount: journalBalanceRes.rows.length,
    unbalancedJournals: journalBalanceRes.rows,
    staleReservationsCount: staleCount,
    isFullyReconciled,
  };
}

