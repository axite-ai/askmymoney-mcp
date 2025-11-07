# Testing Quick Start

This document provides a quick overview of the test suite and common commands.

## Quick Commands

```bash
# Run all tests
pnpm test:all

# Run integration tests in watch mode (recommended during development)
pnpm test:watch

# Run with coverage report
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Interactive test UI (great for debugging)
pnpm test:ui
```

## What Gets Tested

### ✅ MCP Tools
All financial tools exposed through the MCP server:
- Free tools: `get_financial_tips`, `calculate_budget`
- Authenticated tools: `get_account_balances`, `get_transactions`, `get_spending_insights`, `check_account_health`

### ✅ Three-Tier Authorization
Every authenticated tool is tested against:
1. OAuth session validation
2. Active subscription check
3. Plaid account linking verification

### ✅ Authentication Flows
Complete OAuth 2.1 implementation:
- Authorization code flow
- Token exchange and refresh
- Session management
- API key authentication

### ✅ Subscription Management
End-to-end Stripe integration:
- Checkout session creation
- Webhook handling
- Plan limits (basic: 3 accounts, pro: 10, enterprise: unlimited)
- Trial periods and cancellations

### ✅ External Integrations
Mocked but realistic testing of:
- Plaid API (accounts, transactions, insights)
- Stripe API (subscriptions, customers, webhooks)
- Database operations (PostgreSQL)
- Redis caching

### ✅ User Journeys (E2E)
Critical flows tested end-to-end:
- User login and registration
- OAuth flow with ChatGPT
- Subscription purchase
- Plaid account linking
- Widget rendering in ChatGPT

## Test Structure

```
tests/
├── integration/          # Business logic tests (fast, no browser)
│   ├── mcp-tools-free.test.ts
│   ├── mcp-tools-authenticated.test.ts
│   ├── auth-flows.test.ts
│   ├── subscription-flows.test.ts
│   └── services.test.ts
├── e2e/                 # User journey tests (slower, real browser)
│   └── critical-flows.spec.ts
├── mocks/               # Mock data for external APIs
│   ├── plaid.ts
│   ├── stripe.ts
│   └── database.ts
└── utils/               # Test helpers
    └── test-helpers.ts
```

## Adding Tests for New Features

### 1. Create a test file
```bash
# For business logic
touch tests/integration/my-feature.test.ts

# For user flows
touch tests/e2e/my-flow.spec.ts
```

### 2. Write your test
```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should work correctly', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### 3. Run your test
```bash
# Run in watch mode
pnpm test:watch

# Or run specific file
pnpm vitest tests/integration/my-feature.test.ts
```

## Before Committing

Always run the full test suite:

```bash
pnpm test:all
```

This ensures:
- All integration tests pass
- All E2E tests pass
- No regressions in existing functionality

## Debugging Failed Tests

### Integration Tests
```bash
# Use interactive UI
pnpm test:ui

# Or run with console output
pnpm vitest --reporter=verbose
```

### E2E Tests
```bash
# Run with visible browser
pnpm test:e2e:headed

# Use Playwright Inspector
pnpm test:e2e --debug
```

## Coverage Reports

```bash
# Generate HTML coverage report
pnpm test:coverage

# Open coverage/index.html in your browser
```

**Coverage goals:**
- Integration tests: 80%+ line coverage
- E2E tests: 100% of critical user paths

## Common Test Patterns

### Testing MCP Tools
```typescript
it('should require active subscription', async () => {
  const session = { userId: 'user_no_sub' };
  const hasSubscription = false;

  expect(hasSubscription).toBe(false);
  // Tool should return subscription required response
});
```

### Testing with Mocks
```typescript
import { mockPlaidResponses } from '../mocks/plaid';

const response = mockPlaidResponses.accountsGet('test-token');
expect(response.accounts).toHaveLength(3);
```

### Testing User Flows (E2E)
```typescript
test('should display pricing page', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('text=/pro/i')).toBeVisible();
});
```

## Continuous Integration

Tests automatically run on:
- Every push to GitHub
- Every pull request
- Before deployment

See `.github/workflows/test.yml` for CI configuration.

## Learn More

For detailed documentation, see [tests/README.md](tests/README.md)
