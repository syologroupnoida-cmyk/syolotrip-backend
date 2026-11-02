import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or server dir
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const { Pool } = pg;

let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/traveler_db';
// Normalize python asyncpg urls if present
connectionString = connectionString.replace('postgresql+asyncpg://', 'postgresql://');
connectionString = connectionString.replace('postgres://', 'postgresql://');

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') ? { rejectUnauthorized: false } : undefined,
});

export const query = async (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = async () => {
  return pool.connect();
};

export default {
  query,
  getClient,
  pool,
};

