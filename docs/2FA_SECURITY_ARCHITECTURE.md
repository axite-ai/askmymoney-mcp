# 2FA Security Architecture - Defense in Depth

This document explains how two-factor authentication (2FA) is enforced throughout the AskMyMoney application using a defense-in-depth approach.

---

## Overview

**Core Principle:** 2FA is **mandatory** for all users and is enforced at **three independent layers** to prevent bypass attacks.

### Why Multiple Layers?

1. **Edge middleware can be bypassed** - Direct API calls skip edge runtime
2. **Client-side checks are unreliable** - Never trust the client
3. **Defense in depth** - Multiple independent security controls
4. **Fail-closed** - Any error results in access denial

---

## Layer 1: Edge Middleware (UX Layer Only)

**File:** `middleware.ts`

**Purpose:** Cookie existence check for basic routing (UX only, **provides NO security**)

**How it works:**
```typescript
// Runs on Vercel Edge Runtime (fast, global)
// Edge runtime CANNOT validate sessions or check 2FA status
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // WARNING: This only checks if cookie exists, NOT if it's valid
  // Cannot check twoFactorEnabled due to edge runtime limitations
  if (sessionCookie) {
    // User has a session cookie (may or may not be valid)
    // Cannot redirect to 2FA setup - don't know their 2FA status
  }

  return NextResponse.next();
}
```

**Characteristics:**
- ✅ Fast - Runs on edge before request reaches server
- ✅ Basic routing - Can redirect logged-out users
- ❌ **No security** - Only checks cookie existence
- ❌ **Cannot check 2FA** - Edge runtime can't access database
- ❌ **Can be bypassed** - Anyone can create a cookie
- ❌ Edge runtime limitations - No Node.js crypto, database, etc.

**Security Level:** **None** (routing helper only)

**Important:** Due to edge runtime limitations, we **cannot** check `twoFactorEnabled` status in middleware. All 2FA enforcement happens at API and data layers.

---

## Layer 2: MCP Tool Authentication (API Security)

**File:** `lib/utils/mcp-auth-helpers.ts`

**Purpose:** Block access to MCP tools (ChatGPT/Claude API endpoints) without 2FA

**How it works:**
```typescript
export async function requireAuth(
  session: { userId: string } | null | undefined,
  featureName: string,
  options: AuthRequirements = {}
) {
  const { require2FA = true } = options;

  // Check 2: 2FA enabled (CRITICAL SECURITY CHECK)
  if (require2FA) {
    try {
      const user = await auth.api.getSession({ headers });
      const has2FA = user?.user?.twoFactorEnabled;

      if (!has2FA) {
        // Return error response - access denied
        return create2FARequiredResponse(featureName, session.userId);
      }
    } catch (error) {
      // Fail closed - deny access if check fails
      return create2FARequiredResponse(featureName, session.userId);
    }
  }

  // All checks passed
  return null;
}
```

**Usage in MCP tools:**
```typescript
server.registerTool("get_transactions", config, async () => {
  // First check: Auth (including 2FA)
  const authCheck = await requireAuth(session, "transactions", {
    requireSubscription: true,
    requirePlaid: true,
    require2FA: true,  // Default: true
    headers: req.headers,
  });
  if (authCheck) return authCheck; // Blocked!

  // Business logic only runs if 2FA check passes
  const transactions = await getTransactions();
  return createSuccessResponse("...", transactions);
});
```

**Characteristics:**
- ✅ **Primary security layer** - Blocks data access
- ✅ Fail-closed - Errors deny access
- ✅ Granular control - Per-tool configuration
- ✅ Consistent - All tools use same helper
- ✅ Database-backed - Checks `user.twoFactorEnabled` field

**Security Level:** **High** (primary defense)

---

## Layer 3: Server Actions (Data Mutation Security)

**File:** `app/connect-bank/actions.ts` (and other server actions)

**Purpose:** Protect data mutations (create, update, delete) with direct 2FA checks

**How it works:**
```typescript
export const createPlaidLinkToken = async (
  mcpToken?: string,
  itemId?: string
): Promise<LinkTokenResult> => {
  try {
    // Check 1: Authentication
    const mcpSession = await auth.api.getMcpSession({ headers: authHeaders });
    if (!mcpSession?.userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Check 2: 2FA Enabled (CRITICAL SECURITY CHECK)
    const fullSession = await auth.api.getSession({ headers: authHeaders });
    if (!fullSession?.user?.twoFactorEnabled) {
      return {
        success: false,
        error: 'Two-factor authentication is required.',
      };
    }

    // Check 3: Subscription (if needed)
    // ...

    // Business logic only runs if all checks pass
    const linkToken = await createLinkToken(userId);
    return { success: true, linkToken };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
};
```

**Where it's applied:**
- ✅ `createPlaidLinkToken` - Connecting bank accounts
- ✅ `exchangePublicToken` - Finalizing account connections
- ✅ `deleteItem` - Removing connected accounts
- ⚠️ **Add to other server actions as needed**

**Characteristics:**
- ✅ **Defense in depth** - Independent of other layers
- ✅ Protects mutations - Create, update, delete operations
- ✅ Fail-closed - Errors prevent action
- ✅ Direct database check - No dependency on middleware
- ✅ Cannot be bypassed - Runs in server runtime

**Security Level:** **High** (last line of defense)

---

## Security Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Makes Request                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Middleware (Edge)                                  │
│  ⚠️  Check: sessionCookie exists?                            │
│  ⚠️  NO 2FA CHECK - Edge runtime cannot access database     │
│  ✓ Always Pass: Continue to server                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: MCP Tool Auth (FIRST REAL SECURITY CHECK)         │
│  ✓ Check: requireAuth() → user.twoFactorEnabled?            │
│  ✗ Fail: Return create2FARequiredResponse()                 │
│  ✓ Pass: Execute tool logic                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Server Actions (SECOND REAL SECURITY CHECK)       │
│  ✓ Check: getSession().user.twoFactorEnabled?               │
│  ✗ Fail: Return { success: false, error: '2FA required' }   │
│  ✓ Pass: Execute mutation                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         v
                  ┌──────────────┐
                  │ Access Granted│
                  └──────────────┘
```

---

## Attack Scenarios & Mitigations

### Scenario 1: Bypass Middleware via Direct API Call

**Attack:**
```bash
curl https://askmymoney.app/api/auth/mcp/get_transactions \
  -H "Authorization: Bearer $TOKEN"
```

**Defense:**
- ❌ Middleware bypassed (no redirect)
- ✅ **Layer 2 blocks** - `requireAuth()` checks 2FA in tool handler
- ✅ Access denied - Tool returns `create2FARequiredResponse()`

**Result:** ✅ Attack blocked

---

### Scenario 2: Bypass Middleware via Server Action

**Attack:**
```javascript
// Malicious client calls server action directly
await createPlaidLinkToken(mcpToken);
```

**Defense:**
- ❌ Middleware bypassed (server action call)
- ✅ **Layer 3 blocks** - Server action checks `twoFactorEnabled` directly
- ✅ Returns `{ success: false, error: '2FA required' }`

**Result:** ✅ Attack blocked

---

### Scenario 3: Database Error During 2FA Check

**Attack:** Database becomes unavailable during 2FA check

**Defense (Fail-Closed):**
```typescript
try {
  const user = await auth.api.getSession({ headers });
  const has2FA = user?.user?.twoFactorEnabled;

  if (!has2FA) {
    return create2FARequiredResponse(...);
  }
} catch (error) {
  // Database error - FAIL CLOSED
  return create2FARequiredResponse(...); // Deny access
}
```

**Result:** ✅ Access denied (fail-closed)

---

### Scenario 4: Tampered Session Cookie

**Attack:** User modifies session cookie to set `twoFactorEnabled: true`

**Defense:**
- Session cookies are signed by Better Auth (HMAC)
- Tampering invalidates signature → session rejected
- Even if somehow accepted, database query re-checks `twoFactorEnabled`

**Result:** ✅ Attack blocked

---

## Configuration

### Default Behavior

**2FA is required by default** for all protected resources:

```typescript
// MCP Tools - 2FA required by default
const authCheck = await requireAuth(session, "feature");
// Equivalent to:
const authCheck = await requireAuth(session, "feature", {
  require2FA: true,  // DEFAULT
});
```

### Disabling 2FA Check (Not Recommended)

If you need to disable 2FA for a specific tool (rare):

```typescript
const authCheck = await requireAuth(session, "public_feature", {
  require2FA: false,  // ONLY for truly public features
  requireSubscription: false,
  requirePlaid: false,
});
```

**Warning:** Only disable for features that:
- Don't access sensitive data
- Don't perform mutations
- Are truly public

---

## Monitoring & Logging

All 2FA checks are logged:

```typescript
console.log(`[requireAuth] 2FA check:`, {
  required: true,
  has2FA,
  userId,
});
```

**Monitor for:**
- High volume of 2FA denials → Possible attack
- 2FA check errors → Database issues
- Users stuck at setup → UX problem

---

## Testing 2FA Enforcement

### Test 1: Access Without 2FA (Should Fail)

1. Create test user via Google OAuth
2. Don't complete 2FA setup
3. Try accessing MCP tool:
   ```typescript
   await client.tools.get_transactions();
   ```
4. **Expected:** Returns `create2FARequiredResponse()`

### Test 2: Bypass Middleware (Should Fail)

1. Get valid Bearer token
2. Make direct API call:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
        https://app/api/auth/mcp/get_balances
   ```
3. **Expected:** 401 or 2FA required response

### Test 3: Server Action Without 2FA (Should Fail)

1. User without 2FA
2. Call server action:
   ```typescript
   await createPlaidLinkToken(token);
   ```
3. **Expected:** `{ success: false, error: '2FA required' }`

### Test 4: Complete Flow (Should Succeed)

1. User signs in with Google
2. Completes 2FA setup
3. Accesses MCP tools
4. **Expected:** Full access granted

---

## Database Schema

2FA status stored in two places:

### User Table
```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  two_factor_enabled BOOLEAN DEFAULT FALSE,  -- Key field
  -- ... other fields
);
```

### Two Factor Table
```sql
CREATE TABLE two_factor (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  secret TEXT NOT NULL,        -- Encrypted TOTP secret
  backup_codes TEXT NOT NULL,  -- Encrypted backup codes
);
```

**Relationship:**
- `user.two_factor_enabled = true` → User has completed 2FA setup
- `two_factor.user_id` → Stores TOTP secret and backup codes
- Both must exist for 2FA to work

---

## Troubleshooting

### Issue: User Can Access Without 2FA

**Diagnosis:**
1. Check `user.two_factor_enabled` in database
2. Check logs for 2FA check execution
3. Verify `requireAuth()` is called in tool

**Fix:**
- Ensure all MCP tools call `requireAuth()`
- Ensure server actions check `twoFactorEnabled`
- Verify middleware is configured

### Issue: False Positives (2FA Required When Enabled)

**Diagnosis:**
1. Check `user.two_factor_enabled` value
2. Check if `two_factor` record exists
3. Check session is loading user data

**Fix:**
- Verify database relationship
- Check Better Auth session loading
- Clear and recreate session

### Issue: Database Errors During Check

**Diagnosis:**
1. Check database connectivity
2. Check Better Auth logs
3. Verify schema is up-to-date

**Fix:**
- Run `pnpm db:push`
- Check database credentials
- Verify schema migration

---

## Best Practices

### ✅ DO

1. **Always use `requireAuth()`** in MCP tools
2. **Add 2FA checks to server actions** that mutate data
3. **Fail closed** - Deny access on errors
4. **Log all 2FA checks** for monitoring
5. **Keep middleware lightweight** - Edge runtime limitations

### ❌ DON'T

1. **Don't rely only on middleware** - Can be bypassed
2. **Don't trust client-side checks** - Always verify server-side
3. **Don't disable 2FA** unless absolutely necessary
4. **Don't catch and ignore** 2FA check errors
5. **Don't assume session data** - Always query database

---

## Summary

AskMyMoney enforces 2FA using **defense in depth**:

| Layer | Purpose | Security | Can Bypass? | Can Check 2FA? |
|-------|---------|----------|-------------|----------------|
| Middleware | Basic routing | **None** | ✅ Yes | ❌ No (edge runtime) |
| MCP Tool Auth | API security | **High** | ❌ No | ✅ Yes (database) |
| Server Actions | Data security | **High** | ❌ No | ✅ Yes (database) |

**Key Takeaway:**

- **Layer 1 (Middleware)** provides NO security - it's edge runtime and cannot validate sessions or check 2FA
- **Layers 2 & 3 (API/Data)** provide REAL security - they enforce 2FA via database checks
- Even if middleware is completely bypassed, the API and data layers prevent unauthorized access
- This is why defense in depth is critical - we don't rely on any single layer

---

**Security is not a checkbox - it's a continuous process. Monitor, test, and improve these controls regularly.**
