import { vi } from 'vitest';

/**
 * Mock database client for testing
 */
export const createMockDbClient = () => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };

  return mockClient;
};

/**
 * Mock database pool for testing
 */
export const createMockDbPool = () => {
  const mockClient = createMockDbClient();

  const mockPool = {
    connect: vi.fn().mockResolvedValue(mockClient),
    query: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
  };

  return { mockPool, mockClient };
};

/**
 * Mock Redis client for testing
 */
export const createMockRedisClient = () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  setex: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  on: vi.fn(),
  quit: vi.fn().mockResolvedValue('OK'),
});

/**
 * Mock user data
 */
export const mockUsers = {
  withSubscription: {
    id: 'user_with_sub_123',
    email: 'subscribed@example.com',
    name: 'Subscribed User',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  withoutSubscription: {
    id: 'user_no_sub_456',
    email: 'free@example.com',
    name: 'Free User',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  withPlaid: {
    id: 'user_with_plaid_789',
    email: 'plaid@example.com',
    name: 'Plaid User',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

/**
 * Mock subscription data
 */
export const mockSubscriptions = {
  active: {
    id: 'sub_123',
    referenceId: mockUsers.withSubscription.id,
    stripeSubscriptionId: 'sub_stripe_123',
    plan: 'pro',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  trialing: {
    id: 'sub_456',
    referenceId: mockUsers.withPlaid.id,
    stripeSubscriptionId: 'sub_stripe_456',
    plan: 'pro',
    status: 'trialing',
    trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

/**
 * Mock Plaid items
 */
export const mockPlaidItems = {
  item1: {
    id: 'plaid_item_123',
    userId: mockUsers.withPlaid.id,
    plaidItemId: 'item_plaid_123',
    accessToken: 'access-sandbox-encrypted-token',
    institutionId: 'ins_1',
    institutionName: 'Chase Bank',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

/**
 * Setup database query responses for common scenarios
 */
export const setupDbMocks = (mockClient: ReturnType<typeof createMockDbClient>) => {
  // Default: no results
  mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

  return {
    // User queries
    mockUserQuery: (user: typeof mockUsers[keyof typeof mockUsers]) => {
      mockClient.query.mockResolvedValueOnce({ rows: [user], rowCount: 1 });
    },

    // Subscription queries
    mockSubscriptionQuery: (
      subscription: typeof mockSubscriptions[keyof typeof mockSubscriptions]
    ) => {
      mockClient.query.mockResolvedValueOnce({
        rows: [subscription],
        rowCount: 1,
      });
    },

    // Plaid items queries
    mockPlaidItemsQuery: (items: Array<typeof mockPlaidItems.item1>) => {
      mockClient.query.mockResolvedValueOnce({ rows: items, rowCount: items.length });
    },

    // No results
    mockNoResults: () => {
      mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    },
  };
};
