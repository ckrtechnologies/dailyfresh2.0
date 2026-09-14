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

// Intelligent host resolver:
// If running on Linux VPS and host is configured as db.ckrtechnologies.in or 45.122.121.248,
// redirect to 127.0.0.1 to avoid Linux hairpin NAT connection drops / 10s timeouts.
const resolveHost = (targetHost) => {
  if (!targetHost) return '127.0.0.1';
  if (process.platform === 'linux' && (targetHost === 'db.ckrtechnologies.in' || targetHost === '45.122.121.248')) {
    console.log(`[DB] Linux VPS detected: automatically routing ${targetHost} -> 127.0.0.1 for local loopback speed`);
    return '127.0.0.1';
  }
  return targetHost;
};

if (process.env.DB_HOST && process.env.DB_PASSWORD) {
  const baseUser = process.env.DB_USER || 'dailyfresh_user';
  const user = baseUser.includes('.') ? baseUser : `${baseUser}.${tenantId}`;
  const host = resolveHost(process.env.DB_HOST);

  poolConfig = {
    host,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    user,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 90000,
    connectionTimeoutMillis: 90000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 90000,
  };
} else if (process.env.DATABASE_URL) {
  let connStr = process.env.DATABASE_URL;
  try {
    const url = new URL(connStr);
    if (url.username && !url.username.includes('.')) {
      url.username = `${url.username}.${tenantId}`;
    }
    url.hostname = resolveHost(url.hostname);
    connStr = url.toString();
  } catch (_) {}

  poolConfig = {
    connectionString: connStr,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
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
