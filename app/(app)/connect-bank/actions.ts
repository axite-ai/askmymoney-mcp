'use server';

import { db } from '@/lib/db';
import { user, passkey, plaidItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hasActiveSubscription, getEffectivePlan } from '@/lib/utils/subscription-helpers';
import { createLinkToken, exchangePublicToken, getInstitutionLogo, plaidClient } from '@/lib/services/plaid-service';
import { UserService, type PlaidItem } from '@/lib/services/user-service';
import { ItemDeletionService } from '@/lib/services/item-deletion-service';
import { getMaxAccountsForPlan, formatAccountLimit } from '@/lib/utils/plan-limits';
import { FEATURES } from '@/lib/config/features';
import { verifyAuthNonce } from '@/lib/utils/auth-nonce';

type LinkTokenResult =
  | { success: true; linkToken: string; expiration: string }
  | { success: false; error: string };

type ExchangeTokenResult =
  | { success: true; itemId: string; institutionName: string | null | undefined }
  | { success: false; error: string };

type PlanLimitResult =
  | { success: true; limitReached: boolean; itemCount: number; maxAccounts: number }
  | { success: false; error: string };

type PlaidMetadata = {
  institution?: {
    institution_id?: string | null;
    name?: string | null;
  } | null;
  accounts?: Array<{
    id: string;
    name: string;
    mask: string | null;
    type: string;
    subtype: string | null;
  }>;
};

/**
 * Resolve the authenticated userId from a signed auth nonce.
 * Returns null if the nonce is missing, invalid, or expired.
 */
function resolveUserId(authNonce?: string): string | null {
  if (!authNonce) return null;
  return verifyAuthNonce(authNonce);
}

export const createPlaidLinkToken = async (
  authNonce?: string,
  itemId?: string,
  mode?: string
): Promise<LinkTokenResult> => {
  try {
    // Check 1: Authentication via signed nonce
    const userId = resolveUserId(authNonce);

    if (!userId) {
      return {
        success: false,
        error: 'Authentication required. Please sign in first through ChatGPT.',
      };
    }

    // Check 2: Security (Passkey) Enabled (CRITICAL SECURITY CHECK)
    const passkeys = await db.select().from(passkey).where(eq(passkey.userId, userId)).limit(1);
    const hasPasskey = passkeys.length > 0;

    if (!hasPasskey) {
      console.log('[Server Action] Passkey not enabled for user:', userId);
      return {
        success: false,
        error: 'Security setup required. Please set up a passkey in your account settings.',
      };
    }

    // Check 3: Active Subscription
    const hasSubscription = await hasActiveSubscription(userId);
    if (!hasSubscription) {
      return {
        success: false,
        error: 'Active subscription required. Please subscribe first.',
      };
    }

    // If itemId provided, we're in update mode (re-authentication)
    if (itemId) {
      console.log('[Server Action] Creating link token for update mode, itemId:', itemId);

      // Get the item's access token
      const items = await UserService.getUserPlaidItems(userId);
      const item = items.find((i) => i.id === itemId);

      if (!item) {
        return {
          success: false,
          error: 'Item not found or access denied.',
        };
      }

      // Create link token for update mode
      const linkTokenData = await createLinkToken(userId, {
        accessToken: item.accessToken,
        accountSelectionEnabled: mode === 'new_accounts',
      });

      return {
        success: true,
        linkToken: linkTokenData.link_token,
        expiration: linkTokenData.expiration,
      };
    }

    // Check 4: Account limits (based on subscription plan)
    // CRITICAL: Use countUserItems to include pending/error items
    // This prevents users from bypassing limits by starting multiple Link flows
    // before ITEM_READY webhooks fire
    const itemCount = await UserService.countUserItems(userId);

    // Get user's effective plan (returns 'free' when subscriptions disabled)
    const plan = await getEffectivePlan(userId);
    const maxAccounts = getMaxAccountsForPlan(plan);

    if (!plan || maxAccounts === null) {
      return {
        success: false,
        error: "Active subscription required to connect financial accounts",
      };
    }

    if (itemCount >= maxAccounts) {
      // Check if user can delete an item to make room
      const deletionInfo = await ItemDeletionService.getDeletionInfo(userId);

      const isFree = !FEATURES.SUBSCRIPTIONS;

      if (!deletionInfo.canDelete) {
        return {
          success: false,
          error: isFree
            ? `You've reached the maximum of ${maxAccounts} free accounts. Remove an existing connection to add a new one (next deletion available in ${deletionInfo.daysUntilNext} days).`
            : `Account limit reached. You can delete another financial account in ${deletionInfo.daysUntilNext} days, or upgrade your plan now.`,
        };
      }

      return {
        success: false,
        error: isFree
          ? `You've reached the maximum of ${maxAccounts} free accounts. Remove an existing connection to add a new one.`
          : `Account limit reached. Your plan allows ${maxAccounts} financial account(s). Please upgrade or remove an existing connection.`,
      };
    }

    // All checks passed - create link token
    const linkTokenData = await createLinkToken(userId);

    return {
      success: true,
      linkToken: linkTokenData.link_token,
      expiration: linkTokenData.expiration,
    };
  } catch (error) {
    console.error('[Server Action] createPlaidLinkToken error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize bank connection',
    };
  }
};

export const exchangePlaidPublicToken = async (
  publicToken: string,
  metadata: PlaidMetadata,
  authNonce?: string
): Promise<ExchangeTokenResult> => {
  try {
    // Check 1: Authentication via signed nonce
    const userId = resolveUserId(authNonce);

    if (!userId) {
      return {
        success: false,
        error: 'Authentication required. Please sign in first through ChatGPT.',
      };
    }

    // Check 2: Active Subscription
    const hasSubscription = await hasActiveSubscription(userId);
    if (!hasSubscription) {
      return {
        success: false,
        error: 'Active subscription required. Please subscribe first.',
      };
    }

    if (!publicToken) {
      return {
        success: false,
        error: 'Missing public token',
      };
    }

    // Extract institution info from metadata
    const institutionId = metadata?.institution?.institution_id;
    const institutionName = metadata?.institution?.name;

    // NOTE: We show connected items in the UI, so users can see duplicates
    // No need for programmatic duplicate detection - trust the user

    // Exchange public token for access token
    const { accessToken, itemId } = await exchangePublicToken(publicToken);

    // Fetch institution logo (non-blocking, falls back to null)
    const institutionLogo = institutionId
      ? await getInstitutionLogo(institutionId)
      : null;

    // Save the Plaid item to database with status 'active'
    await UserService.savePlaidItem(
      userId,
      itemId,
      accessToken,
      institutionId || undefined,
      institutionName || undefined,
      institutionLogo
    );

    // CRITICAL: Call /transactions/sync immediately (even if no data yet)
    // This ensures Plaid knows to send future SYNC_UPDATES_AVAILABLE webhooks
    try {
      await plaidClient.transactionsSync({
        access_token: accessToken,
        // cursor: undefined on first call
      });
      console.log('[Server Action] Initial transaction sync triggered for item', itemId);
    } catch (error) {
      console.error('[Server Action] Failed to trigger initial sync for item', itemId, error);
      // Don't fail the exchange - webhook ITEM_READY will retry
    }

    console.log('[Server Action] Successfully connected Plaid item', {
      userId,
      itemId,
      institutionName,
    });

    // Send email notification
    try {
      const { EmailService } = await import("@/lib/services/email-service");
      const { plaidItems } = await import("@/lib/db/schema");
      const { count } = await import("drizzle-orm");

      // Get user details and count of connected accounts
      const [userDetails] = await db
        .select({ email: user.email, name: user.name })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      const [itemCount] = await db
        .select({ count: count() })
        .from(plaidItems)
        .where(
          and(
            eq(plaidItems.userId, userId),
            eq(plaidItems.status, 'active')
          )
        );

      const accountCount = Number(itemCount?.count || 0);
      const isFirstAccount = accountCount === 1;

      if (userDetails?.email && institutionName) {
        const userName = userDetails.name || "there";

        await EmailService.sendBankConnectionConfirmation(
          userDetails.email,
          userName,
          institutionName,
          isFirstAccount
        );

        console.log('[Server Action] Bank connection email sent to', userDetails.email);
      }
    } catch (error) {
      console.error('[Server Action] Failed to send bank connection email:', error);
      // Don't throw - email failure shouldn't block connection
    }

    return {
      success: true,
      itemId,
      institutionName,
    };
  } catch (error) {
    console.error('[Server Action] exchangePlaidPublicToken error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect bank account',
    };
  }
};

/**
 * Check if user has reached their plan limit
 * Used for polling during Multi-Item Link sessions
 */
export const checkPlanLimit = async (authNonce?: string): Promise<PlanLimitResult> => {
  try {
    const userId = resolveUserId(authNonce);

    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Get current item count
    const itemCount = await UserService.countUserItems(userId);

    // Get user's effective plan (returns 'free' when subscriptions disabled)
    const plan = await getEffectivePlan(userId);
    const maxAccounts = getMaxAccountsForPlan(plan);

    if (!plan || maxAccounts === null) {
      return {
        success: false,
        error: "Active subscription required",
      };
    }

    return {
      success: true,
      limitReached: itemCount >= maxAccounts,
      itemCount,
      maxAccounts,
    };
  } catch (error) {
    console.error('[Server Action] checkPlanLimit error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check plan limit',
    };
  }
};

/**
 * Get list of connected items for account management UI
 * Returns items with proper structure for frontend display
 */
export const getConnectedItems = async (authNonce?: string) => {
  try {
    const userId = resolveUserId(authNonce);

    if (!userId) {
      return {
        success: false as const,
        error: 'Authentication required',
      };
    }

    // Get all items from database (activeOnly = false to show pending/error items)
    const items = await UserService.getUserPlaidItems(userId, false);

    // Get deletion rate limit info
    const deletionInfo = await ItemDeletionService.getDeletionInfo(userId);

    // Get plan info for limits (returns 'free' when subscriptions disabled)
    const plan = await getEffectivePlan(userId);
    const maxAccounts = getMaxAccountsForPlan(plan);

    if (!plan || maxAccounts === null) {
      return {
        success: false as const,
        error: "Active subscription required to view connected items",
      };
    }

    return {
      success: true as const,
      items: items.map((item: PlaidItem) => ({
        id: item.id,
        itemId: item.itemId,
        institutionId: item.institutionId,
        institutionName: item.institutionName,
        institutionLogo: item.institutionLogo,
        status: item.status,
        errorCode: item.errorCode,
        errorMessage: item.errorMessage,
        consentExpiresAt: item.consentExpiresAt?.toISOString() || null,
        newAccountsAvailable: item.newAccountsAvailable,
        createdAt: item.createdAt?.toISOString(),
      })),
      deletionInfo,
      planInfo: {
        plan,
        current: items.length,
        max: maxAccounts,
        maxFormatted: formatAccountLimit(maxAccounts),
        subscriptionsEnabled: FEATURES.SUBSCRIPTIONS,
      },
    };
  } catch (error) {
    console.error('[Server Action] getConnectedItems error:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to get connected items',
    };
  }
};

/**
 * Remove/delete a Plaid item with proper cleanup
 * Uses ItemDeletionService which handles rate limits and Plaid API calls
 */
export const removeItem = async (itemId: string, authNonce?: string) => {
  try {
    const userId = resolveUserId(authNonce);

    if (!userId) {
      return {
        success: false as const,
        error: 'Authentication required',
      };
    }

    // Delete with rate limit check (calls /item/remove and soft deletes in DB)
    await ItemDeletionService.deleteItemWithRateLimit(userId, itemId);

    return {
      success: true as const,
    };
  } catch (error) {
    console.error('[Server Action] removeItem error:', error);

    // Handle rate limit errors with helpful info
    if (error instanceof Error && error.message.includes('rate limit')) {
      const rateUserId = resolveUserId(authNonce);
      if (rateUserId) {
        try {
          const info = await ItemDeletionService.getDeletionInfo(rateUserId);
          return {
            success: false as const,
            error: error.message,
            daysUntilNext: info.daysUntilNext,
          };
        } catch {
          // Fall through to generic error
        }
      }
    }

    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to remove item',
    };
  }
};

/**
 * Dismiss the "new accounts available" prompt for a Plaid item
 */
export const dismissNewAccounts = async (itemId: string, authNonce?: string) => {
  try {
    const userId = resolveUserId(authNonce);

    if (!userId) {
      return { success: false as const, error: 'Authentication required' };
    }

    // Update only if the item belongs to this user (WHERE clause ensures ownership)
    const [updated] = await db
      .update(plaidItems)
      .set({ newAccountsAvailable: null })
      .where(
        and(
          eq(plaidItems.id, itemId),
          eq(plaidItems.userId, userId)
        )
      )
      .returning({ id: plaidItems.id });

    if (!updated) {
      return { success: false as const, error: 'Item not found or access denied' };
    }

    return { success: true as const };
  } catch (error) {
    console.error('[Server Action] dismissNewAccounts error:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to dismiss',
    };
  }
};
