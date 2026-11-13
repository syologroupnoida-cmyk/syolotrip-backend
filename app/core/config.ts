import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export const config = {
  env: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT || '8000', 10),
  secretKey: process.env.SECRET_KEY || 'dev-secret-key-super-secure-token-ss-journey-2026-production-grade',
  tokenExpiryMinutes: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '1440', 10),
  databaseUrl: (process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/traveler_db')
    .replace('postgresql+asyncpg://', 'postgresql://')
    .replace('postgres://', 'postgresql://'),
  useMockProviders: process.env.USE_MOCK_PROVIDERS === 'true',
};

