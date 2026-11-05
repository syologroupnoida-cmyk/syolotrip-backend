import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { initDbSchema } from './db/schema.js';
import { query } from './db/index.js';
import { ingestAllReferenceData } from './db/ingestReferenceData.js';

import authRouter from './routes/auth.js';
import flightsRouter from './routes/flights.js';
import hotelsRouter from './routes/hotels.js';
import { trainsRouter, busesRouter, cabsRouter, packagesRouter } from './routes/travel.js';
import bookingsRouter from './routes/bookings.js';
import paymentsRouter from './routes/payments.js';
import adminRouter from './routes/admin.js';
import { adminServicesRouter } from './routes/adminServices.js';
import { adminImportExportRouter } from './routes/adminImportExport.js';
import pricingRouter from './routes/pricing.js';
import { couponsRouter, wishlistRouter, locationsRouter } from './routes/misc.js';
import { mybizRouter, partnerRouter } from './routes/partnerMybiz.js';
import { villasRouter, toursRouter, visaRouter, insuranceRouter } from './routes/servicesExtra.js';
import customerRouter from './routes/customer.js';
import walletRouter from './routes/wallet.js';
import adminWalletRouter from './routes/adminWallet.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all local dev origins, vercel previews, and non-browser clients
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|.*\.vercel\.app)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive CORS
    },
    credentials: true,
  })
);

// Health check endpoints
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SS Journey Node API',
    version: '1.0.0',
    environment: process.env.ENVIRONMENT || 'development',
  });
});

app.get('/api/v1/health', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await query('SELECT 1');
  } catch (err) {
    dbStatus = 'disconnected';
  }

  res.json({
    success: true,
    data: {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      version: '1.0.0',
      environment: process.env.ENVIRONMENT || 'development',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      services: {
        flights_provider: 'node_native',
        hotels_provider: 'node_native',
        buses_provider: 'node_native',
        packages_provider: 'node_native',
      },
    },
    message: 'System health checked successfully',
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes under /api/v1
const apiV1 = express.Router();
apiV1.use('/auth', authRouter);
apiV1.use('/flights', flightsRouter);
apiV1.use('/hotels', hotelsRouter);
apiV1.use('/trains', trainsRouter);
apiV1.use('/buses', busesRouter);
apiV1.use('/cabs', cabsRouter);
apiV1.use('/packages', packagesRouter);
apiV1.use('/bookings', bookingsRouter);
apiV1.use('/payments', paymentsRouter);
apiV1.use('/admin/services', adminServicesRouter);
apiV1.use('/admin/io', adminImportExportRouter);
apiV1.use('/admin', adminRouter);
apiV1.use('/admin/pricing', pricingRouter);
apiV1.use('/coupons', couponsRouter);
apiV1.use('/wishlist', wishlistRouter);
apiV1.use('/locations', locationsRouter);
apiV1.use('/villas', villasRouter);
apiV1.use('/tours', toursRouter);
apiV1.use('/visa', visaRouter);
apiV1.use('/insurance', insuranceRouter);
apiV1.use('/mybiz', mybizRouter);
apiV1.use('/partner', partnerRouter);
apiV1.use('/customer', customerRouter);
apiV1.use('/wallet', walletRouter);
apiV1.use('/admin/wallet', adminWalletRouter);

app.use('/api/v1', apiV1);

// Initialize DB schema and start server
async function startServer() {
  try {
    console.log('[NODE-BACKEND] Initializing database schema...');
    await initDbSchema();
    console.log('[NODE-BACKEND] Database schema initialized successfully.');

    // Auto-ingest master reference datasets if empty
    const airportCountRes = await query('SELECT count(*) FROM airports');
    if (parseInt(airportCountRes.rows[0]?.count || '0', 10) === 0) {
      console.log('[NODE-BACKEND] Seeding reference datasets...');
      await ingestAllReferenceData();
      console.log('[NODE-BACKEND] Reference datasets seeded successfully.');
    }
  } catch (err: any) {
    console.warn('[NODE-BACKEND] Database warning on startup:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[NODE-BACKEND] Server listening on port ${PORT}`);
    console.log(`[NODE-BACKEND] API docs / endpoints mounted at http://localhost:${PORT}/api/v1`);
  });
}

startServer();

export default app;

