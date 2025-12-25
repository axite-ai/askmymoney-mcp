import { beforeEach, afterEach, vi } from 'vitest';
import { testDb } from './test-db';
import { getPlaidClient } from '@/lib/config/plaid';
import { createMockPlaidClient, setupPlaidMocks, cleanupTestData } from './test-helpers';

// Global test setup
let mockPlaidClient: any;

// Setup mocks before each test
beforeEach(() => {
  // Mock Plaid client
  vi.mock('@/lib/config/plaid', () => ({
    getPlaidClient: vi.fn(),
  }));

  // Mock encryption service
  vi.mock('@/lib/services/encryption-service', () => ({
    EncryptionService: {
      encrypt: vi.fn((value) => `encrypted_${value}`),
      decrypt: vi.fn((value) => value.replace('encrypted_', '')),
    },
  }));

  // Create and setup mock client
  mockPlaidClient = createMockPlaidClient();
  setupPlaidMocks(mockPlaidClient);
  (getPlaidClient as any).mockReturnValue(mockPlaidClient);
});

// Cleanup after each test
afterEach(async () => {
  vi.clearAllMocks();
});

// Export for use in tests
export { mockPlaidClient, testDb, cleanupTestData };


