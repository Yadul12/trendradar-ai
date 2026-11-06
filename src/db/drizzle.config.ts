import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  ''
).trim();

const sslMode = (process.env.DATABASE_SSL || '').trim().toLowerCase();
const ssl =
  sslMode === 'disable' || sslMode === 'false' || sslMode === 'off'
    ? false
    : sslMode === 'no-verify'
      ? { rejectUnauthorized: false }
      : sslMode === 'require' ||
          sslMode === 'true' ||
          sslMode === 'on' ||
          sslMode === 'verify-full'
        ? { rejectUnauthorized: true }
        : undefined;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: databaseUrl
    ? ssl === undefined
      ? { url: databaseUrl }
      : { url: databaseUrl, ssl }
    : {
        host: process.env.SQL_HOST || 'localhost',
        user: process.env.SQL_ADMIN_USER || process.env.SQL_USER || 'postgres',
        password:
          process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || '',
        database: process.env.SQL_DB_NAME || 'postgres',
        ssl: false,
      },
  verbose: true,
});
