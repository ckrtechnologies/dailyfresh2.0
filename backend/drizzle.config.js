import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dbCredentials = process.env.DATABASE_URL 
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'db.ckrtechnologies.in',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.POOLER_TENANT_ID 
        ? `${process.env.DB_USER}.${process.env.POOLER_TENANT_ID}`
        : process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false,
    };

export default defineConfig({
  schema: path.join(__dirname, 'src/db/schema.js'),
  out: path.join(__dirname, 'drizzle'),
  dialect: 'postgresql',
  schemaFilter: ['dailyfresh'],
  dbCredentials,
  verbose: true,
  strict: true,
});
