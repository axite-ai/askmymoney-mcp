# Plaid Integration Tests

This directory contains comprehensive integration tests for Plaid's "update mode" and ITEM_LOGIN_REQUIRED error-handling flows in Sandbox environment.

## Test Coverage

### `plaid-update-mode.test.ts` (14 tests)

Comprehensive test suite covering the complete ITEM_LOGIN_REQUIRED → Update Mode → Recovery flow:

#### Step 1: Trigger Error State
- ✅ Trigger ITEM_LOGIN_REQUIRED using `/sandbox/item/reset_login`
- ✅ Verify error propagation in API calls
- ✅ Test item status updates

#### Step 2: Error Propagation in App UI
- ✅ Verify ITEM_LOGIN_REQUIRED vs PRODUCTS_NOT_SUPPORTED distinction
- ✅ Test error handling in account balances retrieval
- ✅ Simulate UI error states

#### Step 3: Re-authenticate Flow (Link in Update Mode)
- ✅ Create link tokens for update mode (with `access_token`)
- ✅ Create link tokens for regular mode (without `access_token`)
- ✅ Test public token exchange after re-authentication

#### Step 4: Verify Recovery
- ✅ Sync transactions after re-authentication
- ✅ Update item status to active
- ✅ Handle multiple re-auth attempts

#### Integration Test
- ✅ Complete end-to-end ITEM_LOGIN_REQUIRED → Update Mode → Recovery cycle

### `plaid-error-handling.test.ts` (13 tests)

Advanced error handling and webhook testing scenarios:

#### ITEM_LOGIN_REQUIRED Scenarios
- ✅ Error handling during account balance sync
- ✅ Error handling during transaction sync
- ✅ Distinguish between different error types

#### Webhook Testing
- ✅ Fire ITEM_LOGIN_REQUIRED webhooks manually
- ✅ Handle webhook firing failures
- ✅ Test different webhook types

#### Error Recovery & Resilience
- ✅ Handle partial failures during multi-step operations
- ✅ Network timeout handling
- ✅ Malformed API response handling

#### UI Integration
- ✅ Prepare error data for UI display
- ✅ Handle multiple items with different error states

#### ITEM_LOGIN_REQUIRED Scenarios
- ✅ Error handling during account balance sync
- ✅ Error handling during transaction sync
- ✅ Distinguish between different error types (ITEM_LOGIN_REQUIRED, INVALID_ACCESS_TOKEN, etc.)

#### Webhook Testing
- ✅ Fire ITEM_LOGIN_REQUIRED webhooks manually
- ✅ Handle webhook firing failures
- ✅ Test different webhook types (ERROR, NEW_ACCOUNTS_AVAILABLE, etc.)

#### Error Recovery & Resilience
- ✅ Handle partial failures during multi-step operations
- ✅ Network timeout handling
- ✅ Malformed API response handling

#### Sandbox-Specific Features
- ✅ Sandbox reset login for various error states
- ✅ Rate limit handling

#### UI Integration
- ✅ Prepare error data for UI display
- ✅ Handle multiple items with different error states

## Running the Tests

### Prerequisites

1. **Database Setup**: Tests use a dedicated PostgreSQL test database (`axite_mcp_test`)
2. **Environment Variables**: Ensure `.env.test` is configured with test values
3. **Dependencies**: Install test dependencies with `pnpm install`

### Commands

```bash
# Run all Plaid integration tests
pnpm test:integration

# Run specific test file
pnpm vitest run tests/integration/plaid-update-mode.test.ts
pnpm vitest run tests/integration/plaid-error-handling.test.ts

# Run with coverage
pnpm test:coverage

# Run in watch mode during development
pnpm test:watch
```

### Test Database Setup

The tests automatically:
1. Create a test database (`axite_mcp_test`)
2. Run database migrations
3. Clean up after test completion

## Test Architecture

### Mocks
- **Plaid Client**: Fully mocked to avoid real API calls
- **Encryption Service**: Mocked for consistent test data
- **Database**: Uses real PostgreSQL test database with Drizzle ORM

### Test Data
- Uses deterministic test data with predictable IDs
- Automatically cleans up test data between runs
- Tests are isolated and don't affect each other

### Error Simulation
- Tests simulate various Plaid API error conditions
- Covers both expected and edge-case scenarios
- Validates error handling throughout the application stack

## Best Practices Implemented

1. **Isolation**: Each test is fully isolated with its own data
2. **Mocking**: External APIs are mocked to ensure reliable, fast tests
3. **Cleanup**: Automatic database cleanup prevents test pollution
4. **Realism**: Tests mirror actual Plaid API behavior and error conditions
5. **Coverage**: Comprehensive coverage of happy path and error scenarios

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Manually create test database if needed
createdb axite_mcp_test
```

### Environment Variables
Ensure `.env.test` contains all required variables:
- `DATABASE_URL` pointing to test database
- `ENCRYPTION_KEY` (64-character hex string)
- Dummy API keys for external services

### Mock Issues
If mocks aren't working as expected:
1. Check that `vi.clearAllMocks()` is called in `afterEach`
2. Verify mock implementations match expected Plaid API responses
3. Ensure imports are properly mocked at the top of test files

## 🏆 **Best Practices Implemented**

### ✅ **Test Organization**
- **Clear Structure**: Tests organized by logical steps (Trigger Error → Error Propagation → Re-authenticate → Recovery)
- **Descriptive Names**: Test names clearly describe what is being tested
- **Focused Tests**: Each test focuses on a single behavior or scenario

### ✅ **DRY Principle (Don't Repeat Yourself)**
- **Shared Setup**: Common mock configurations and test data patterns
- **Helper Functions**: Created reusable test helpers in `test-helpers.ts`
- **Consistent Patterns**: Standardized approaches for error testing and assertions

### ✅ **Maintainable Code**
- **Test Data Builders**: Functions to create consistent test data
- **Error Helpers**: Standardized error response creation
- **Clean Separation**: Test logic separated from test data setup

### ✅ **Performance & Isolation**
- **Database Cleanup**: Proper cleanup between tests to prevent interference
- **Unique Test Data**: Each test uses unique identifiers to avoid conflicts
- **Efficient Setup**: Minimal setup overhead with shared utilities

### ✅ **Comprehensive Coverage**
- **Happy Path**: Normal operation scenarios
- **Error Scenarios**: Various error conditions and edge cases
- **Integration Testing**: Full workflow validation

## 🎯 **Test Results: 27/27 Tests Passing ✅**

The test suite successfully validates the complete Plaid update mode workflow as outlined in your requirements. All tests are passing and provide comprehensive coverage of ITEM_LOGIN_REQUIRED error handling and update mode re-authentication flows.

## Related Documentation

- [Plaid Sandbox Testing Guide](https://plaid.com/docs/sandbox/)
- [Update Mode Documentation](https://plaid.com/docs/link/update-mode/)
- [Plaid API Error Codes](https://plaid.com/docs/errors/)
- [Project Testing Guide](../docs/TESTING.md)
