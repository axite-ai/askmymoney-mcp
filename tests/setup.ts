import '@testing-library/jest-dom/vitest';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock environment variables
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.BETTER_AUTH_URL = 'http://localhost:3000/api/auth';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_DATABASE = 'askmymoney_test';
process.env.POSTGRES_USER = 'postgres';
process.env.POSTGRES_PASSWORD = 'postgres';
process.env.POSTGRES_SSL = 'false';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';
process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';
process.env.PLAID_ENV = 'sandbox';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Setup MSW (Mock Service Worker)
beforeAll(() => {
  // Additional setup if needed
});

afterEach(() => {
  cleanup(); // Cleanup React Testing Library
  vi.clearAllMocks(); // Clear all mocks between tests
});

afterAll(() => {
  // Global cleanup
});
