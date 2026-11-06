import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { Pool as PoolType, PoolConfig } from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

declare global {
  var _postgresPool: PoolType | undefined;
  var _schemaInitialized: boolean | undefined;
}

export function resolveSslConfig(): PoolConfig['ssl'] {
  const mode = (process.env.DATABASE_SSL || '').trim().toLowerCase();
  switch (mode) {
    case 'disable':
    case 'false':
    case 'off':
      return false;
    case 'no-verify':
      return { rejectUnauthorized: false };
    case 'require':
    case 'true':
    case 'on':
    case 'verify-full':
      return { rejectUnauthorized: true };
    default:
      return undefined;
  }
}

export function hasDatabaseConfig(): boolean {
  const connUrl = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ''
  ).trim();
  const sqlHost = (process.env.SQL_HOST || '').trim();
  return Boolean(connUrl || sqlHost);
}

export const createPool = (): PoolType => {
  if (!global._postgresPool) {
    const connectionString = (
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      ''
    ).trim();

    const poolConfig: PoolConfig = connectionString
      ? {
          connectionString,
          ssl: resolveSslConfig(),
          max: Number(process.env.DATABASE_POOL_MAX) || 10,
          connectionTimeoutMillis: 15000,
          idleTimeoutMillis: 30000,
        }
      : {
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          ssl: resolveSslConfig(),
          max: Number(process.env.DATABASE_POOL_MAX) || 10,
          connectionTimeoutMillis: 15000,
          idleTimeoutMillis: 30000,
        };

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });

export async function ensureDatabaseSchema(): Promise<void> {
  if (global._schemaInitialized || !hasDatabaseConfig()) {
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY NOT NULL,
      "uid" text NOT NULL UNIQUE,
      "email" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "monitored_keywords" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "keyword" text NOT NULL,
      "category" text NOT NULL,
      "priority" text DEFAULT 'High' NOT NULL,
      "active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "trends" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "title" text NOT NULL,
      "category" text NOT NULL,
      "source_url" text NOT NULL,
      "source_type" text DEFAULT 'Manual Entry' NOT NULL,
      "is_verified_source" boolean DEFAULT false NOT NULL,
      "priority" text DEFAULT 'High' NOT NULL,
      "status" text DEFAULT 'Emerging' NOT NULL,
      "score_trend_relevance" integer DEFAULT 80 NOT NULL,
      "score_recency" integer DEFAULT 85 NOT NULL,
      "score_audience_interest" integer DEFAULT 75 NOT NULL,
      "score_engagement_potential" integer DEFAULT 80 NOT NULL,
      "score_brand_relevance" integer DEFAULT 85 NOT NULL,
      "opportunity_score" integer DEFAULT 81 NOT NULL,
      "score_explanation" text NOT NULL,
      "verified_summary" text NOT NULL,
      "why_gaining_attention" text NOT NULL,
      "prediction_market_relevance" text NOT NULL,
      "audience_interest_analysis" text NOT NULL,
      "suggested_content_angle" text NOT NULL,
      "recommended_platform" text NOT NULL,
      "suggested_hook" text NOT NULL,
      "supporting_links" text DEFAULT '[]' NOT NULL,
      "detected_at" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "social_metrics" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "platform" text NOT NULL,
      "post_title" text NOT NULL,
      "category" text NOT NULL,
      "content_format" text NOT NULL,
      "published_date" text NOT NULL,
      "reach" integer DEFAULT 0 NOT NULL,
      "impressions" integer DEFAULT 0 NOT NULL,
      "likes" integer DEFAULT 0 NOT NULL,
      "comments" integer DEFAULT 0 NOT NULL,
      "shares" integer DEFAULT 0 NOT NULL,
      "engagement_rate" double precision DEFAULT 0 NOT NULL,
      "click_through_rate" double precision DEFAULT 0 NOT NULL,
      "audience_retention" double precision DEFAULT 0 NOT NULL,
      "data_origin" text DEFAULT 'Manual Entry' NOT NULL,
      "created_at" timestamp DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "ai_recommendations" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "recommendation_type" text NOT NULL,
      "title" text NOT NULL,
      "target_platform" text NOT NULL,
      "impact_estimate" text NOT NULL,
      "data_explanation" text NOT NULL,
      "actionable_step" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "calendar_items" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "trend_id" integer REFERENCES "trends"("id") ON DELETE SET NULL,
      "title" text NOT NULL,
      "scheduled_date" text NOT NULL,
      "scheduled_time" text DEFAULT '14:00 UTC' NOT NULL,
      "platform" text NOT NULL,
      "content_format" text NOT NULL,
      "status" text DEFAULT 'Ideation' NOT NULL,
      "priority" text DEFAULT 'High' NOT NULL,
      "category" text NOT NULL,
      "hook_draft" text DEFAULT '' NOT NULL,
      "checklist_json" text DEFAULT '[]' NOT NULL,
      "created_at" timestamp DEFAULT now()
    );
  `);
  global._schemaInitialized = true;
}
