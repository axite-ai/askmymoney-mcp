/**
 * Subscription Helper Functions
 *
 * Utilities for checking subscription status, tiers, and limits using Better Auth Stripe plugin.
 * When FEATURES.SUBSCRIPTIONS is disabled, all users get free-tier access (2 accounts).
 */

import { db } from "@/lib/db";
import { subscription } from "@/lib/db/schema";
import { eq, and, inArray, desc, count as drizzleCount } from "drizzle-orm";
import { FEATURES } from "@/lib/config/features";
import { PLAN_LIMITS, FREE_PLAN_NAME, type PlanName } from "@/lib/utils/plan-limits";

/**
 * Get user's subscription from Better Auth Stripe plugin
 *
 * Queries the database directly since we're already on the server side with a validated userId.
 * The auth.api methods are designed for external API calls with session cookies.
 */
export async function getUserSubscription(userId: string) {
  console.log('[Subscription] Querying database for user subscription...');

  try {
    // First, check ALL subscriptions for this user (any status)
    const allSubs = await db
      .select()
      .from(subscription)
      .where(eq(subscription.referenceId, userId));

    console.log('[Subscription] All subscriptions for user (any status):', {
      userId,
      count: allSubs.length,
      subscriptions: allSubs,
      statuses: allSubs.map(s => s.status)
    });

    // Also check if there are ANY subscriptions in the table
    const [totalSubsCount] = await db
      .select({ total: drizzleCount() })
      .from(subscription);

    console.log('[Subscription] Total subscriptions in database:', totalSubsCount);

    // Query for active subscriptions for this user
    const result = await db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.referenceId, userId),
          inArray(subscription.status, ['active', 'trialing'])
        )
      )
      .orderBy(desc(subscription.periodStart))
      .limit(1);

    console.log('[Subscription] Active subscription query result:', {
      userId,
      count: result.length,
      hasSubscription: !!result[0],
      subscription: result[0]
    });

    return result[0] || null;
  } catch (error) {
    console.error(`[Subscription] Error fetching subscription for userId: ${userId}`, error);
    return null;
  }
}

/**
 * Check if user has an active subscription.
 * When subscriptions are disabled, returns a synthetic subscription-like object
 * so callers that check truthiness still pass.
 */
export async function hasActiveSubscription(userId: string) {
  if (!FEATURES.SUBSCRIPTIONS) {
    return { status: 'active' as const, plan: FREE_PLAN_NAME };
  }

  const sub = await getUserSubscription(userId);
  if (sub?.status === 'active' || sub?.status === 'trialing') {
    return sub;
  }
  return null;
}

/**
 * Get user's subscription tier (plan name)
 * Returns 'free' when subscriptions are disabled.
 */
export async function getSubscriptionTier(userId: string): Promise<string | null> {
  if (!FEATURES.SUBSCRIPTIONS) {
    return FREE_PLAN_NAME;
  }

  const sub = await getUserSubscription(userId);
  return sub?.plan || null;
}

/**
 * Get subscription limits based on tier.
 * Uses PLAN_LIMITS as single source of truth.
 */
export async function getSubscriptionLimits(userId: string) {
  const tier = await getSubscriptionTier(userId);
  if (!tier) return null;

  const limits = PLAN_LIMITS[tier as PlanName];
  return limits ? { maxAccounts: limits.maxAccounts } : null;
}

/**
 * Check if user can connect more accounts based on their subscription limits
 */
export async function canConnectMoreAccounts(userId: string, currentAccountCount: number): Promise<boolean> {
  const limits = await getSubscriptionLimits(userId);

  if (!limits) {
    return false;
  }

  return currentAccountCount < limits.maxAccounts;
}

/**
 * Get effective plan for user.
 * Returns 'free' when subscriptions are disabled, otherwise the subscription tier.
 */
export async function getEffectivePlan(userId: string): Promise<string | null> {
  return getSubscriptionTier(userId);
}
