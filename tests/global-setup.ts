import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { config } from 'dotenv';

// Test database setup
export default async function globalSetup() {
  // Load .env.test file manually since vitest config might not be working
  config({ path: '.env.test' });

  console.log('Global setup - Available env vars:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
    POSTGRES_DB: process.env.POSTGRES_DB,
  });

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found. Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES')));
    throw new Error('DATABASE_URL environment variable is required');
  }

  const testDbName = 'axite_mcp_test';

  // Connect to postgres to manage databases
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL.replace(/\/[^\/]+$/, '/postgres'),
  });

  try {
    // Drop test database if it exists
    await pool.query(`DROP DATABASE IF EXISTS "${testDbName}" WITH (FORCE);`);

    // Create test database
    await pool.query(`CREATE DATABASE "${testDbName}";`);

    console.log(`✅ Created test database: ${testDbName}`);

    // Connect to test database for migrations
    const testConnectionString = process.env.DATABASE_URL.replace(/\/[^\/]+$/, `/${testDbName}`);
    const testClient = postgres(testConnectionString, { prepare: false });
    const testDb = drizzle(testClient);

    // Run migrations
    await migrate(testDb, { migrationsFolder: './drizzle' });
    console.log('✅ Applied migrations to test database');

    await testClient.end();
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}
