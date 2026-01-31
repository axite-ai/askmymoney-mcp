import { testDb } from './test-db';
import { plaidItems, plaidAccounts, plaidTransactions, plaidLinkSessions, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { vi } from 'vitest';

// Test data builders
export const createTestUser = (overrides: Partial<typeof user.$inferInsert> = {}) => ({
  id: `test-user-${Date.now()}`,
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestItem = (userId: string, overrides: Partial<typeof plaidItems.$inferInsert> = {}) => ({
  userId,
  itemId: `test-item-${Date.now()}`,
  accessToken: `encrypted_access-sandbox-${Date.now()}`,
  institutionId: 'ins_1',
  institutionName: 'Test Bank',
  status: 'active' as const,
  ...overrides,
});

export const createTestAccount = (userId: string, itemId: string, overrides: Partial<typeof plaidAccounts.$inferInsert> = {}) => ({
  userId,
  itemId,
  accountId: `acc_${Date.now()}`,
  name: 'Checking Account',
  mask: '1234',
  type: 'depository' as const,
  subtype: 'checking' as const,
  currentBalance: '1500.00',
  availableBalance: '1400.00',
  ...overrides,
});

// Mock setup utilities
export const createMockPlaidClient = () => ({
  userCreate: vi.fn(),
  linkTokenCreate: vi.fn(),
  itemPublicTokenExchange: vi.fn(),
  sandboxItemResetLogin: vi.fn(),
  sandboxItemFireWebhook: vi.fn(),
  itemGet: vi.fn(),
  accountsGet: vi.fn(),
  transactionsSync: vi.fn(),
});

export const setupPlaidMocks = (mockClient: any) => {
  // Default successful responses
  mockClient.userCreate.mockResolvedValue({
    data: { user_token: 'user-token-123' },
  });

  mockClient.linkTokenCreate.mockResolvedValue({
    data: {
      link_token: 'link-token-123',
      expiration: new Date(Date.now() + 3600000).toISOString(),
    },
  });

  mockClient.itemPublicTokenExchange.mockResolvedValue({
    data: {
      access_token: 'new-access-token-123',
      item_id: 'test-item-123',
    },
  });

  mockClient.sandboxItemResetLogin.mockResolvedValue({
    data: { reset_login: true },
  });

  mockClient.sandboxItemFireWebhook.mockResolvedValue({
    data: { webhook_fired: true },
  });

  mockClient.itemGet.mockResolvedValue({
    data: {
      item: {
        item_id: 'test-item-123',
        institution_id: 'ins_1',
        error: null,
        available_products: ['transactions'],
        billed_products: ['transactions'],
        products: ['transactions'],
        consented_products: ['transactions'],
      },
    },
  });

  mockClient.accountsGet.mockResolvedValue({
    data: {
      accounts: [{
        account_id: 'acc_123',
        name: 'Checking Account',
        mask: '1234',
        type: 'depository',
        subtype: 'checking',
        balances: {
          current: 1500.00,
          available: 1400.00,
        },
      }],
    },
  });

  mockClient.transactionsSync.mockResolvedValue({
    data: {
      added: [{
        transaction_id: 'txn_123',
        account_id: 'acc_123',
        amount: -50.00,
        date: '2024-01-15',
        name: 'Grocery Store',
        merchant_name: 'Whole Foods',
      }],
      modified: [],
      removed: [],
      next_cursor: 'cursor_123',
      has_more: false,
    },
  });
};

// Database cleanup utilities
export const cleanupTestData = async (userId: string) => {
  // Clean up in correct order to respect foreign key constraints
  await testDb.delete(plaidTransactions).where(eq(plaidTransactions.userId, userId));
  await testDb.delete(plaidAccounts).where(eq(plaidAccounts.userId, userId));
  await testDb.delete(plaidItems).where(eq(plaidItems.userId, userId));
  await testDb.delete(plaidLinkSessions).where(eq(plaidLinkSessions.userId, userId));
  await testDb.delete(user).where(eq(user.id, userId));
};

// Error response helpers
export const createPlaidError = (errorCode: string, message: string) => ({
  response: {
    data: {
      error_code: errorCode,
      error_message: message,
    },
  },
});

export const createItemLoginRequiredError = () => createPlaidError('ITEM_LOGIN_REQUIRED', 'User login is required');

export const createInvalidTokenError = () => createPlaidError('INVALID_ACCESS_TOKEN', 'The access token is invalid');

export const createProductNotSupportedError = () => createPlaidError('PRODUCTS_NOT_SUPPORTED', 'Institution does not support this product');

export const createRateLimitError = () => createPlaidError('RATE_LIMIT_EXCEEDED', 'Too many requests');

// Test assertion helpers
export const expectError = (error: any, expectedCode?: string) => {
  expect(error).toBeDefined();
  if (expectedCode) {
    expect(error.response?.data?.error_code).toBe(expectedCode);
  }
};

export const expectSuccess = (result: any) => {
  expect(result).toBeDefined();
  expect(result).not.toBeNull();
};




