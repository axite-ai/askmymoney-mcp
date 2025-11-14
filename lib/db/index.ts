/**
 * Drizzle Database Instance
 *
 * Provides a type-safe database connection using Drizzle ORM with PostgreSQL.
 * This instance is used by Better Auth via the Drizzle adapter.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Create PostgreSQL connection pool
export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'askmymoney',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Add error handling for the pool
pool.on('error', (error) => {
  console.error('[Postgres] Unexpected error on idle client', error);
});

// Create Drizzle database instance with schema
export const db = drizzle(pool, { schema });

// Export schema for use in other parts of the app
export { schema };
