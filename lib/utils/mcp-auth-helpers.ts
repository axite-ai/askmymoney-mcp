/**
 * MCP Tool Authentication Helpers
 *
 * DRY helpers to check authentication requirements in MCP tools.
 * Reduces boilerplate and ensures consistency across all tools.
 */

import { hasActiveSubscription } from "./subscription-helpers";
import { UserService } from "../services/user-service";
import {
  createLoginPromptResponse,
  createSubscriptionRequiredResponse,
  createPlaidRequiredResponse,
  createSecurityRequiredResponse,
} from "./auth-responses";
import { auth } from "../auth";
import { db } from "@/lib/db";
import { passkey } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface AuthRequirements {
  /** Require active subscription (default: true) */
  requireSubscription?: boolean;
  /** Require Plaid bank connection (default: true) */
  requirePlaid?: boolean;
  /** Require 2FA or Passkey to be enabled (default: true) */
  requireSecurity?: boolean;
  /** Request headers (required for Plaid check to extract MCP token) */
  headers?: Headers;
}

/**
 * Check authentication requirements and return error response if needed.
 * Returns null if all checks pass.
 *
 * @param session - MCP session from withMcpAuth
 * @param featureName - Name of the feature being accessed (for error messages)
 * @param options - Auth requirement options
 * @returns Auth error response or null if all checks pass
 *
 * @example
 * ```typescript
 * server.registerTool("get_transactions", config, async () => {
 *   const authCheck = await requireAuth(session, "transactions", {
 *     requireSubscription: true,
 *     requirePlaid: true,
 *     headers: req.headers,
 *   });
 *   if (authCheck) return authCheck;
 *
 *   // ... actual tool logic
 * });
 * ```
 */
export async function requireAuth(
  session: { userId: string } | null | undefined,
  featureName: string,
  options: AuthRequirements = {}
) {
  const { requireSubscription = true, requirePlaid = true, requireSecurity = true, headers } = options;

  console.log(`[requireAuth] Checking auth for ${featureName}:`, {
    hasSession: !!session,
    userId: session?.userId,
    requireSubscription,
    requirePlaid,
    requireSecurity,
  });

  // Check 1: Session exists (OAuth authentication)
  if (!session) {
    console.log(`[requireAuth] No session, returning login prompt`);
    return createLoginPromptResponse(featureName);
  }

  // Check 2: Security (2FA or Passkey) enabled (if required)
  if (requireSecurity) {
    try {
      // 1. Check 2FA status from user object
      const user = await auth.api.getSession({
        headers: headers || new Headers(),
      });
      const twoFactorEnabled = user?.user?.twoFactorEnabled;

      // 2. Check Passkeys from database
      let hasPasskey = false;
      if (!twoFactorEnabled) {
        // Only query DB if 2FA is not enabled (optimization)
        const passkeys = await db.select().from(passkey).where(eq(passkey.userId, session.userId)).limit(1);
        hasPasskey = passkeys.length > 0;
      }

      console.log(`[requireAuth] Security check:`, {
        required: true,
        twoFactorEnabled,
        hasPasskey,
        userId: session.userId,
      });

      if (!twoFactorEnabled && !hasPasskey) {
        console.log(`[requireAuth] Security not enabled, returning Security Required response`);
        return createSecurityRequiredResponse(featureName, session.userId, headers);
      }
    } catch (error) {
      console.error(`[requireAuth] Error checking security status:`, error);
      // Fail closed
      return createSecurityRequiredResponse(featureName, session.userId, headers);
    }
  }

  // Check 3: Active subscription (if required)
  if (requireSubscription) {
    const hasSubscription = await hasActiveSubscription(session.userId);
    console.log(`[requireAuth] Subscription check:`, {
      required: true,
      hasSubscription,
    });

    if (!hasSubscription) {
      console.log(`[requireAuth] No subscription, returning subscription required response`);
      return createSubscriptionRequiredResponse(featureName, session.userId);
    }
  }

  // Check 4: Plaid connection (if required)
  if (requirePlaid) {
    const accessTokens = await UserService.getUserAccessTokens(session.userId);
    console.log(`[requireAuth] Plaid check:`, {
      required: true,
      tokenCount: accessTokens.length,
    });

    if (accessTokens.length === 0) {
      if (!headers) {
        throw new Error(
          `[requireAuth] Headers required for Plaid check but not provided for feature: ${featureName}`
        );
      }
      console.log(`[requireAuth] No Plaid tokens, returning Plaid required response`);
      return await createPlaidRequiredResponse(session.userId, headers);
    }
  }

  // All checks passed
  console.log(`[requireAuth] All checks passed for ${featureName}`);
  return null;
}
