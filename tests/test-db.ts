import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';

// Test database connection
const testDbName = process.env.POSTGRES_DB || 'axite_mcp_test';
const testConnectionString = (process.env.DATABASE_URL || '').replace(/\/[^\/]+$/, `/${testDbName}`);

if (!testConnectionString) {
  throw new Error('DATABASE_URL environment variable is required for tests');
}

// Create test database connection
const client = postgres(testConnectionString, {
  prepare: false,
  max: 1, // Single connection for tests
});

// Create Drizzle instance for tests
export const testDb = drizzle(client, { schema });

// Cleanup function for tests
export async function closeTestDb() {
  try {
    await client.end();
    console.log('✅ Closed test database connection');
  } catch (error) {
    console.warn('⚠️ Failed to close test database connection:', error);
  }
}




