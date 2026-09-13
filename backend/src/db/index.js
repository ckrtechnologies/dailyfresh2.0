import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Build connection options: supports both discrete variables and DATABASE_URL
let poolConfig;
const tenantId = process.env.POOLER_TENANT_ID || 'your-tenant-id';

if (process.env.DB_HOST && process.env.DB_PASSWORD) {
  const baseUser = process.env.DB_USER || 'dailyfresh_user';
  const user = baseUser.includes('.') ? baseUser : `${baseUser}.${tenantId}`;

  poolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    user,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else if (process.env.DATABASE_URL) {
  let connStr = process.env.DATABASE_URL;
  try {
    const url = new URL(connStr);
    if (url.username && !url.username.includes('.')) {
      url.username = `${url.username}.${tenantId}`;
      connStr = url.toString();
    }
  } catch (_) {}

  poolConfig = {
    connectionString: connStr,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else {
  console.error('❌ Fatal: Neither DB_HOST/DB_PASSWORD nor DATABASE_URL is set in .env');
}

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('❌ [PostgreSQL Pool Error]:', err.message);
});

export const db = drizzle(pool, { schema });
export default db;
