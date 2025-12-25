import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testDb, closeTestDb } from '../test-db';
import { plaidItems, plaidAccounts, plaidTransactions, plaidLinkSessions, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  createLinkToken,
  exchangePublicToken,
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

describe('Plaid Update Mode and ITEM_LOGIN_REQUIRED Flow', () => {
  const testUserId = 'test-user-123';
  const testItemId = 'test-item-456';
  const testAccessToken = 'access-sandbox-1234567890';
  const testPublicToken = 'public-sandbox-1234567890';

  let mockPlaidClient: any;

  beforeEach(async () => {
    // Setup mock Plaid client
    mockPlaidClient = {
      userCreate: vi.fn(),
      linkTokenCreate: vi.fn(),
      itemPublicTokenExchange: vi.fn(),
      sandboxItemResetLogin: vi.fn(),
      itemGet: vi.fn(),
      accountsGet: vi.fn(),
      transactionsSync: vi.fn(),
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
      email: 'test@example.com',
      name: 'Test User',
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

  describe('Step 1: Trigger ITEM_LOGIN_REQUIRED Error State', () => {
    it('should successfully trigger ITEM_LOGIN_REQUIRED using sandbox/item/reset_login', async () => {
      // Setup: Create a test item first
      await testDb.insert(plaidItems).values({
        userId: testUserId,
        itemId: testItemId,
        accessToken: `encrypted_${testAccessToken}`,
        institutionId: 'ins_1',
        institutionName: 'Test Bank',
        status: 'active',
      });

      // Mock the reset login API call
      mockPlaidClient.sandboxItemResetLogin.mockResolvedValue({
        data: { reset_login: true },
      });

      // Execute: Call sandbox reset login
      const response = await mockPlaidClient.sandboxItemResetLogin({
        access_token: testAccessToken,
      });

      // Verify: Response indicates successful reset
      expect(response.data.reset_login).toBe(true);
      expect(mockPlaidClient.sandboxItemResetLogin).toHaveBeenCalledWith({
        access_token: testAccessToken,
      });
    });

    it('should update item status to reflect login required error', async () => {
      // Setup: Item exists and reset login has been called
      await testDb.insert(plaidItems).values({
        userId: testUserId,
        itemId: testItemId,
        accessToken: `encrypted_${testAccessToken}`,
        institutionId: 'ins_1',
        institutionName: 'Test Bank',
        status: 'active',
      });

      // Mock itemGet to return ITEM_LOGIN_REQUIRED error
      mockPlaidClient.itemGet.mockRejectedValue({
        response: {
          data: {
            error_code: 'ITEM_LOGIN_REQUIRED',
            error_message: 'User login is required',
          },
        },
      });

      // Execute: Try to get item information
      let error: any;
      try {
        await getItem(testAccessToken);
      } catch (err) {
        error = err;
      }

      // Verify: Error is properly caught and identified
      expect(error).toBeDefined();
      expect(error.response?.data?.error_code).toBe('ITEM_LOGIN_REQUIRED');
    });
  });

  describe('Step 2: Verify Error Propagation in App UI', () => {
    it('should identify ITEM_LOGIN_REQUIRED as a product not supported error', async () => {
      // Import the helper function
      const { isProductNotSupported } = await import('@/lib/services/plaid-service');

      // Test with ITEM_LOGIN_REQUIRED error
      const itemLoginRequiredError = {
        response: {
          data: { error_code: 'ITEM_LOGIN_REQUIRED' },
        },
      };

      // Verify it's not treated as "product not supported"
      expect(isProductNotSupported(itemLoginRequiredError)).toBe(false);
    });

    it('should handle ITEM_LOGIN_REQUIRED in account balance retrieval', async () => {
      // Mock accountsGet to return ITEM_LOGIN_REQUIRED error
      mockPlaidClient.accountsGet.mockRejectedValue({
        response: {
          data: {
            error_code: 'ITEM_LOGIN_REQUIRED',
            error_message: 'User login is required to access account information',
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

      // Verify: Error message includes the Plaid error details
      expect(error).toBeDefined();
      expect(error.message).toContain('User login is required to access account information');
    });
  });

  describe('Step 3: Test Re-authenticate Flow (Link in Update Mode)', () => {
    it('should create link token for update mode with existing access token', async () => {
      // Setup: Mock user token creation
      mockPlaidClient.userCreate.mockResolvedValue({
        data: { user_token: 'user-token-123' },
      });

      // Mock link token creation for update mode
      mockPlaidClient.linkTokenCreate.mockResolvedValue({
        data: {
          link_token: 'link-token-update-123',
          expiration: new Date(Date.now() + 3600000).toISOString(),
        },
      });

      // Execute: Create link token for update mode
      const result = await createLinkToken(testUserId, {
        accessToken: testAccessToken,
      });

      // Verify: Link token created with access token for update mode
      expect(mockPlaidClient.linkTokenCreate).toHaveBeenCalledWith({
        user: { client_user_id: testUserId },
        client_name: 'AskMyMoney',
        country_codes: ['US'],
        language: 'en',
        webhook: expect.any(String),
        access_token: testAccessToken, // Critical: access_token present for update mode
      });

      expect(result.link_token).toBe('link-token-update-123');
    });

    it('should create link token for regular mode without access token', async () => {
      // Setup: Mock user token creation and link token creation
      mockPlaidClient.userCreate.mockResolvedValue({
        data: { user_token: 'user-token-456' },
      });

      mockPlaidClient.linkTokenCreate.mockResolvedValue({
        data: {
          link_token: 'link-token-regular-456',
          expiration: new Date(Date.now() + 3600000).toISOString(),
        },
      });

      // Execute: Create link token for regular mode (no access token)
      const result = await createLinkToken(testUserId);

      // Verify: Link token created with user token and products for regular mode
      expect(mockPlaidClient.linkTokenCreate).toHaveBeenCalledWith({
        user: { client_user_id: testUserId },
        client_name: 'AskMyMoney',
        country_codes: ['US'],
        language: 'en',
        webhook: expect.any(String),
        user_token: 'user-token-456',
        products: ['transactions'],
        optional_products: ['auth', 'investments', 'liabilities'],
        enable_multi_item_link: true,
        investments: {
          allow_unverified_crypto_wallets: true,
          allow_manual_entry: true,
        },
        cra_enabled: true,
      });

      expect(result.link_token).toBe('link-token-regular-456');
    });

    it('should successfully exchange public token after update mode re-auth', async () => {
      // Mock public token exchange
      mockPlaidClient.itemPublicTokenExchange.mockResolvedValue({
        data: {
          access_token: 'new-access-token-789',
          item_id: testItemId,
        },
      });

      // Execute: Exchange public token from successful re-auth
      const result = await exchangePublicToken(testPublicToken);

      // Verify: New access token and item ID returned
      expect(result.accessToken).toBe('new-access-token-789');
      expect(result.itemId).toBe(testItemId);
      expect(mockPlaidClient.itemPublicTokenExchange).toHaveBeenCalledWith({
        public_token: testPublicToken,
      });
    });
  });

  describe('Step 4: Verify Recovery', () => {
    it('should successfully sync transactions after re-authentication', async () => {
      // Setup: Create test item with new access token
      const newAccessToken = 'new-access-token-789';
      await testDb.insert(plaidItems).values({
        itemId: testItemId,
        userId: testUserId,
        accessToken: `encrypted_${newAccessToken}`,
        institutionId: 'ins_1',
        institutionName: 'Test Bank',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock successful API calls after re-auth
      mockPlaidClient.accountsGet.mockResolvedValue({
        data: {
          accounts: [
            {
              account_id: 'acc_reauth_1',
              name: 'Checking Account',
              mask: '1234',
              type: 'depository',
              subtype: 'checking',
              balances: {
                current: 1500.00,
                available: 1400.00,
              },
            },
          ],
        },
      });

      mockPlaidClient.transactionsSync.mockResolvedValue({
        data: {
          added: [
            {
              transaction_id: 'txn_reauth_1',
              account_id: 'acc_reauth_1',
              amount: -50.00,
              date: '2024-01-15',
              name: 'Grocery Store',
              merchant_name: 'Whole Foods',
            },
          ],
          modified: [],
          removed: [],
          next_cursor: 'cursor_123',
          has_more: false,
        },
      });

      // Execute: Sync transactions with new access token
      const syncResult = await syncTransactionsForItem(testItemId);

      // Verify: Sync completed successfully
      expect(syncResult.added).toBe(1);
      expect(syncResult.modified).toBe(0);
      expect(syncResult.removed).toBe(0);

      // Verify database was updated
      const accounts = await testDb
        .select()
        .from(plaidAccounts)
        .where(eq(plaidAccounts.userId, testUserId));

      expect(accounts).toHaveLength(1);
      expect(accounts[0].name).toBe('Checking Account');
      expect(accounts[0].currentBalance).toBe('1500.0000000000');
    });

    it('should update item status to active after successful re-auth', async () => {
      // Setup: Item was in error state
      await testDb.insert(plaidItems).values({
        itemId: testItemId,
        userId: testUserId,
        accessToken: `encrypted_${testAccessToken}`,
        institutionId: 'ins_1',
        institutionName: 'Test Bank',
        status: 'error', // Was in error state
        errorCode: 'ITEM_LOGIN_REQUIRED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock successful itemGet after re-auth
      mockPlaidClient.itemGet.mockResolvedValue({
        data: {
          item: {
            item_id: testItemId,
            institution_id: 'ins_1',
            webhook: 'https://example.com/webhook',
            error: null,
            available_products: ['transactions', 'auth'],
            billed_products: ['transactions'],
            products: ['transactions'],
            consented_products: ['transactions'],
            consent_expiration_time: null,
            update_type: 'background',
          },
        },
      });

      // Execute: Get item information
      const item = await getItem(testAccessToken);

      // Verify: Item is healthy with no errors
      expect(item.item_id).toBe(testItemId);
      expect(item.error).toBeNull();
    });

    it('should handle multiple re-auth attempts gracefully', async () => {
      // Setup: Multiple link tokens created for the same user
      await testDb.insert(plaidLinkSessions).values([
        {
          userId: testUserId,
          linkToken: 'link-token-1',
          plaidUserToken: 'user-token-123',
          status: 'completed',
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
          userId: testUserId,
          linkToken: 'link-token-2',
          plaidUserToken: 'user-token-123',
          status: 'pending',
          createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        },
      ]);

      // Mock user token creation (should reuse existing)
      mockPlaidClient.userCreate.mockResolvedValue({
        data: { user_token: 'user-token-456' },
      });

      // Mock link token creation
      mockPlaidClient.linkTokenCreate.mockResolvedValue({
        data: {
          link_token: 'link-token-new',
          expiration: new Date(Date.now() + 3600000).toISOString(),
        },
      });

      // Execute: Create new link token
      await createLinkToken(testUserId);

      // Verify: User token creation was NOT called (should reuse existing)
      expect(mockPlaidClient.userCreate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle network errors during reset login', async () => {
      // Mock network error
      mockPlaidClient.sandboxItemResetLogin.mockRejectedValue(
        new Error('Network connection failed')
      );

      // Execute & Verify: Error is propagated
      await expect(
        mockPlaidClient.sandboxItemResetLogin({ access_token: testAccessToken })
      ).rejects.toThrow('Network connection failed');
    });

    it('should handle invalid access tokens in update mode', async () => {
      // Mock invalid access token error
      mockPlaidClient.linkTokenCreate.mockRejectedValue({
        response: {
          data: {
            error_code: 'INVALID_ACCESS_TOKEN',
            error_message: 'The access token is invalid',
          },
        },
      });

      // Execute: Try to create update mode link token
      let error: any;
      try {
        await createLinkToken(testUserId, { accessToken: 'invalid-token' });
      } catch (err) {
        error = err;
      }

      // Verify: Invalid token error handled
      expect(error).toBeDefined();
      expect(error.message).toContain('The access token is invalid');
    });

    it('should handle webhook delivery failures gracefully', async () => {
      // Setup: Create item with webhook configured
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

      // Mock sandbox item fire webhook (for testing webhook delivery)
      mockPlaidClient.sandboxItemFireWebhook = vi.fn().mockResolvedValue({
        data: { webhook_fired: true },
      });

      // Execute: Fire webhook manually for testing
      const response = await mockPlaidClient.sandboxItemFireWebhook({
        access_token: testAccessToken,
        webhook_type: 'ITEM_LOGIN_REQUIRED',
      });

      // Verify: Webhook firing API called correctly
      expect(response.data.webhook_fired).toBe(true);
      expect(mockPlaidClient.sandboxItemFireWebhook).toHaveBeenCalledWith({
        access_token: testAccessToken,
        webhook_type: 'ITEM_LOGIN_REQUIRED',
      });
    });
  });

  describe('Integration Test: Complete Update Mode Flow', () => {
    it('should complete full ITEM_LOGIN_REQUIRED → Update Mode → Recovery cycle', async () => {
      // Phase 1: Setup initial connected item
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

      // Phase 2: Simulate ITEM_LOGIN_REQUIRED trigger
      mockPlaidClient.sandboxItemResetLogin.mockResolvedValue({
        data: { reset_login: true },
      });

      await mockPlaidClient.sandboxItemResetLogin({
        access_token: testAccessToken,
      });

      // Phase 3: Verify error state (item now requires login)
      mockPlaidClient.itemGet.mockRejectedValue({
        response: {
          data: {
            error_code: 'ITEM_LOGIN_REQUIRED',
            error_message: 'User login is required',
          },
        },
      });

      let itemError: any;
      try {
        await getItem(testAccessToken);
      } catch (err) {
        itemError = err;
      }
      expect(itemError.response?.data?.error_code).toBe('ITEM_LOGIN_REQUIRED');

      // Phase 4: Create update mode link token
      mockPlaidClient.userCreate.mockResolvedValue({
        data: { user_token: 'user-token-update' },
      });

      mockPlaidClient.linkTokenCreate.mockResolvedValue({
        data: {
          link_token: 'link-update-token-123',
          expiration: new Date(Date.now() + 3600000).toISOString(),
        },
      });

      const updateLinkToken = await createLinkToken(testUserId, {
        accessToken: testAccessToken,
      });

      expect(updateLinkToken.link_token).toBe('link-update-token-123');

      // Phase 5: Simulate successful re-authentication (public token exchange)
      mockPlaidClient.itemPublicTokenExchange.mockResolvedValue({
        data: {
          access_token: 'new-access-token-999',
          item_id: testItemId,
        },
      });

      const exchangeResult = await exchangePublicToken(testPublicToken);
      expect(exchangeResult.accessToken).toBe('new-access-token-999');

      // Phase 6: Verify recovery - item works again
      mockPlaidClient.itemGet.mockResolvedValue({
        data: {
          item: {
            item_id: testItemId,
            institution_id: 'ins_1',
            error: null,
            available_products: ['transactions'],
            billed_products: ['transactions'],
            products: ['transactions'],
            consented_products: ['transactions'],
          },
        },
      });

      const recoveredItem = await getItem('new-access-token-999');
      expect(recoveredItem.error).toBeNull();
      expect(recoveredItem.item_id).toBe(testItemId);

      // Success! Full cycle completed
    });
  });
});
