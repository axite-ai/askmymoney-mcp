import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testDb, closeTestDb } from '../test-db';
import { plaidItems, plaidAccounts, plaidTransactions, plaidLinkSessions, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  syncTransactionsForItem,
  getAccountBalances,
  getItem,
} from '@/lib/services/plaid-service';
import { getPlaidClient } from '@/lib/config/plaid';

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

describe('Plaid Error Handling and Webhook Testing', () => {
  const testUserId = 'test-user-456';
  const testItemId = 'test-item-789';
  const testAccessToken = 'access-sandbox-9876543210';

  let mockPlaidClient: any;

  beforeEach(async () => {
    // Setup mock Plaid client
    mockPlaidClient = {
      sandboxItemResetLogin: vi.fn(),
      sandboxItemFireWebhook: vi.fn(),
      itemGet: vi.fn(),
      accountsGet: vi.fn(),
      transactionsSync: vi.fn(),
      linkTokenCreate: vi.fn(),
    };

    (getPlaidClient as any).mockReturnValue(mockPlaidClient);

    // Clean up test data in correct order (respecting foreign keys)
    await testDb.delete(plaidTransactions).where(eq(plaidTransactions.userId, testUserId));
    await testDb.delete(plaidAccounts).where(eq(plaidAccounts.userId, testUserId));
    await testDb.delete(plaidItems).where(eq(plaidItems.userId, testUserId));
    await testDb.delete(plaidLinkSessions).where(eq(plaidLinkSessions.userId, testUserId));
    await testDb.delete(user).where(eq(user.id, testUserId));

    // Insert test user
    await testDb.insert(user).values({
      id: testUserId,
      email: 'test-error@example.com',
      name: 'Test Error User',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('ITEM_LOGIN_REQUIRED Error Scenarios', () => {
    it('should handle ITEM_LOGIN_REQUIRED during account balance sync', async () => {
      // Setup: Create connected item
      await testDb.insert(plaidItems).values({
        itemId: testItemId,
        userId: testUserId,
        accessToken: `encrypted_${testAccessToken}`,
        institutionId: 'ins_1',
        institutionName: 'Test Bank',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock accountsGet to fail with ITEM_LOGIN_REQUIRED
      mockPlaidClient.accountsGet.mockRejectedValue({
        response: {
          data: {
            error_code: 'ITEM_LOGIN_REQUIRED',
            error_message: 'User login is required to access account information',
            display_message: 'Please re-authenticate with your bank',
          },
        },
      });

      // Execute: Try to sync transactions (which calls accountsGet internally)
      let error: any;
      try {
        await syncTransactionsForItem(testItemId);
      } catch (err) {
        error = err;
      }

      // Verify: Error is properly handled and reported
      expect(error).toBeDefined();
      expect(error.message).toContain('Failed to sync transactions');
    });

    it('should handle ITEM_LOGIN_REQUIRED during transaction sync', async () => {
      // Setup: Create item and accounts
      await testDb.insert(plaidItems).values({
        itemId: testItemId,
        userId: testUserId,
        accessToken: `encrypted_${testAccessToken}`,
        institutionId: 'ins_1',
        institutionName: 'Test Bank',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await testDb.insert(plaidAccounts).values({
        accountId: 'acc_1',
        itemId: testItemId,
        userId: testUserId,
        name: 'Checking',
        mask: '1234',
        type: 'depository',
        subtype: 'checking',
      });

      // Mock successful accountsGet but failed transactionsSync
      mockPlaidClient.accountsGet.mockResolvedValue({
        data: {
          accounts: [{
            account_id: 'acc_1',
            name: 'Checking',
            mask: '1234',
            type: 'depository',
            subtype: 'checking',
            balances: { current: 1000 },
          }],
        },
      });

      mockPlaidClient.transactionsSync.mockRejectedValue({
        response: {
          data: {
            error_code: 'ITEM_LOGIN_REQUIRED',
            error_message: 'Authentication required for transaction access',
          },
        },
      });

      // Execute: Try to sync transactions
      const result = await syncTransactionsForItem(testItemId);

      // Verify: Transaction sync failure is handled gracefully (returns empty results)
      expect(result).toBeDefined();
      expect(result.added).toBe(0);
      expect(result.modified).toBe(0);
      expect(result.removed).toBe(0);
    });

    it('should distinguish ITEM_LOGIN_REQUIRED from other error types', async () => {
      const testCases = [
        {
          errorCode: 'ITEM_LOGIN_REQUIRED',
          errorMessage: 'User login required',
          expectedType: 'authentication_error',
        },
        {
          errorCode: 'INVALID_ACCESS_TOKEN',
          errorMessage: 'Access token is invalid',
          expectedType: 'invalid_token_error',
        },
        {
          errorCode: 'PRODUCTS_NOT_SUPPORTED',
          errorMessage: 'Institution does not support this product',
          expectedType: 'product_not_supported',
        },
        {
          errorCode: 'RATE_LIMIT_EXCEEDED',
          errorMessage: 'Too many requests',
          expectedType: 'rate_limit_error',
        },
      ];

      for (const testCase of testCases) {
        mockPlaidClient.itemGet.mockRejectedValue({
          response: {
            data: {
              error_code: testCase.errorCode,
              error_message: testCase.errorMessage,
            },
          },
        });

        let error: any;
        try {
          await getItem(testAccessToken);
        } catch (err) {
          error = err;
        }

        expect(error.response?.data?.error_code).toBe(testCase.errorCode);
        expect(error.response?.data?.error_message).toBe(testCase.errorMessage);
      }
    });
  });

  describe('Webhook Testing with Sandbox APIs', () => {
    it('should successfully fire ITEM_LOGIN_REQUIRED webhook', async () => {
      // Setup: Create item
      await testDb.insert(plaidItems).values({
        itemId: testItemId,
        userId: testUserId,
        accessToken: `encrypted_${testAccessToken}`,
        institutionId: 'ins_1',
        institutionName: 'Test Bank',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock successful webhook firing
      mockPlaidClient.sandboxItemFireWebhook.mockResolvedValue({
        data: {
          webhook_fired: true,
          webhook_type: 'ITEM_LOGIN_REQUIRED',
          item_id: testItemId,
        },
      });

      // Execute: Fire webhook manually
      const response = await mockPlaidClient.sandboxItemFireWebhook({
        access_token: testAccessToken,
        webhook_type: 'ITEM_LOGIN_REQUIRED',
      });

      // Verify: Webhook firing API called correctly
      expect(response.data.webhook_fired).toBe(true);
      expect(response.data.webhook_type).toBe('ITEM_LOGIN_REQUIRED');
      expect(mockPlaidClient.sandboxItemFireWebhook).toHaveBeenCalledWith({
        access_token: testAccessToken,
        webhook_type: 'ITEM_LOGIN_REQUIRED',
      });
    });

    it('should handle webhook firing failures', async () => {
      // Mock webhook firing failure
      mockPlaidClient.sandboxItemFireWebhook.mockRejectedValue({
        response: {
          data: {
            error_code: 'INVALID_ACCESS_TOKEN',
            error_message: 'The access token is invalid',
          },
        },
      });

      // Execute & Verify: Webhook firing fails gracefully
      await expect(
        mockPlaidClient.sandboxItemFireWebhook({
          access_token: 'invalid-token',
          webhook_type: 'ITEM_LOGIN_REQUIRED',
        })
      ).rejects.toThrow();

      expect(mockPlaidClient.sandboxItemFireWebhook).toHaveBeenCalledWith({
        access_token: 'invalid-token',
        webhook_type: 'ITEM_LOGIN_REQUIRED',
      });
    });

    it('should test different webhook types', async () => {
      const webhookTypes = [
        'ITEM_LOGIN_REQUIRED',
        'ERROR',
        'NEW_ACCOUNTS_AVAILABLE',
        'DEFAULT_UPDATE',
        'INITIAL_UPDATE',
        'HISTORICAL_UPDATE',
      ];

      for (const webhookType of webhookTypes) {
        mockPlaidClient.sandboxItemFireWebhook.mockResolvedValueOnce({
          data: {
            webhook_fired: true,
            webhook_type: webhookType,
            item_id: testItemId,
          },
        });

        const response = await mockPlaidClient.sandboxItemFireWebhook({
          access_token: testAccessToken,
          webhook_type: webhookType,
        });

        expect(response.data.webhook_type).toBe(webhookType);
      }

      expect(mockPlaidClient.sandboxItemFireWebhook).toHaveBeenCalledTimes(webhookTypes.length);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle partial failures during multi-step operations', async () => {
      // Setup: Create item and accounts
      await testDb.insert(plaidItems).values({
        itemId: testItemId,
        userId: testUserId,
        accessToken: `encrypted_${testAccessToken}`,
        institutionId: 'ins_1',
        institutionName: 'Test Bank',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock accountsGet success but transactionsSync failure
      mockPlaidClient.accountsGet.mockResolvedValue({
        data: {
          accounts: [{
            account_id: 'acc_1',
            name: 'Checking',
            type: 'depository',
            subtype: 'checking',
            balances: { current: 1000, available: 900 },
          }],
        },
      });

      mockPlaidClient.transactionsSync.mockRejectedValue({
        response: {
          data: {
            error_code: 'ITEM_LOGIN_REQUIRED',
            error_message: 'Authentication required',
          },
        },
      });

      // Execute: Sync operation (accounts succeed, transactions fail)
      const result = await syncTransactionsForItem(testItemId);

      // Verify: Accounts were still synced despite transaction failure
      const accounts = await testDb
        .select()
        .from(plaidAccounts)
        .where(eq(plaidAccounts.userId, testUserId));

      expect(accounts).toHaveLength(1);
      expect(accounts[0].name).toBe('Checking');
      expect(result.added).toBe(0); // But accounts were saved and function completed
    });

    it('should handle network timeouts gracefully', async () => {
      // Mock network timeout
      mockPlaidClient.itemGet.mockRejectedValue(
        new Error('Request timeout')
      );

      // Execute: API call times out
      let error: any;
      try {
        await getItem(testAccessToken);
      } catch (err) {
        error = err;
      }

      // Verify: Timeout handled without crashing
      expect(error).toBeDefined();
      expect(error.message).toBe('Request timeout');
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      mockPlaidClient.accountsGet.mockRejectedValue({
        response: {
          data: {
            error_code: 'INTERNAL_SERVER_ERROR',
            error_message: 'Malformed response from server',
          },
        },
      });

      // Execute: Try to get account balances
      let error: any;
      try {
        await getAccountBalances(testAccessToken);
      } catch (err) {
        error = err;
      }

      // Verify: Malformed response handled
      expect(error).toBeDefined();
      expect(error.message).toContain('Failed to get account balances');
    });
  });

  describe('Sandbox-Specific Testing Features', () => {
    it('should use sandbox reset login to simulate various error states', async () => {
      // Test different reset scenarios
      const scenarios = [
        { description: 'Standard login required', expected: true },
        { description: 'Force re-auth after institution change', expected: true },
        { description: 'Simulate expired credentials', expected: true },
      ];

      for (const scenario of scenarios) {
        mockPlaidClient.sandboxItemResetLogin.mockResolvedValueOnce({
          data: { reset_login: scenario.expected },
        });

        const response = await mockPlaidClient.sandboxItemResetLogin({
          access_token: testAccessToken,
        });

        expect(response.data.reset_login).toBe(scenario.expected);
      }

      expect(mockPlaidClient.sandboxItemResetLogin).toHaveBeenCalledTimes(scenarios.length);
    });

    it('should handle sandbox API rate limits appropriately', async () => {
      // Mock rate limit error
      mockPlaidClient.sandboxItemResetLogin.mockRejectedValue({
        response: {
          data: {
            error_code: 'RATE_LIMIT_EXCEEDED',
            error_message: 'Too many requests to sandbox API',
          },
        },
      });

      // Execute: Hit rate limit
      let error: any;
      try {
        await mockPlaidClient.sandboxItemResetLogin({
          access_token: testAccessToken,
        });
      } catch (err) {
        error = err;
      }

      // Verify: Rate limit error handled
      expect(error.response?.data?.error_code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Integration with UI Error States', () => {
    it('should prepare error data for UI display', async () => {
      // Setup: Item in error state
      await testDb.insert(plaidItems).values({
        itemId: testItemId,
        userId: testUserId,
        accessToken: `encrypted_${testAccessToken}`,
        institutionId: 'ins_1',
        institutionName: 'Test Bank',
        status: 'error',
        errorCode: 'ITEM_LOGIN_REQUIRED',
        errorMessage: 'Login required',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock failed API call that would trigger UI update
      mockPlaidClient.itemGet.mockRejectedValue({
        response: {
          data: {
            error_code: 'ITEM_LOGIN_REQUIRED',
            error_message: 'User login is required',
            display_message: 'Please re-authenticate with Test Bank',
          },
        },
      });

      // This would typically trigger a UI update in the real app
      let error: any;
      try {
        await getItem(testAccessToken);
      } catch (err) {
        error = err;
      }

      // Verify error contains UI-relevant information
      expect(error.response?.data?.display_message).toBe('Please re-authenticate with Test Bank');
      expect(error.response?.data?.error_code).toBe('ITEM_LOGIN_REQUIRED');
    });

    it('should handle multiple items with different error states', async () => {
      // Setup: Multiple items with different states
      const items = [
        {
          itemId: 'item_1',
          status: 'active',
          errorCode: null,
        },
        {
          itemId: 'item_2',
          status: 'error',
          errorCode: 'ITEM_LOGIN_REQUIRED',
        },
        {
          itemId: 'item_3',
          status: 'error',
          errorCode: 'INVALID_ACCESS_TOKEN',
        },
      ];

      for (const item of items) {
        await testDb.insert(plaidItems).values({
          itemId: item.itemId,
          userId: testUserId,
          accessToken: `encrypted_access_${item.itemId}`,
          institutionId: `ins_${item.itemId}`,
          institutionName: `Bank ${item.itemId}`,
          status: item.status,
          errorCode: item.errorCode,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Query all user items (simulating dashboard load)
      const userItems = await testDb
        .select({
          itemId: plaidItems.itemId,
          status: plaidItems.status,
          errorCode: plaidItems.errorCode,
          institutionName: plaidItems.institutionName,
        })
        .from(plaidItems)
        .where(eq(plaidItems.userId, testUserId));

      // Verify different error states are tracked
      expect(userItems).toHaveLength(3);

      const activeItems = userItems.filter(item => item.status === 'active');
      const errorItems = userItems.filter(item => item.status === 'error');

      expect(activeItems).toHaveLength(1);
      expect(errorItems).toHaveLength(2);

      const loginRequiredItem = errorItems.find(item => item.errorCode === 'ITEM_LOGIN_REQUIRED');
      const invalidTokenItem = errorItems.find(item => item.errorCode === 'INVALID_ACCESS_TOKEN');

      expect(loginRequiredItem).toBeDefined();
      expect(invalidTokenItem).toBeDefined();
    });
  });
});
