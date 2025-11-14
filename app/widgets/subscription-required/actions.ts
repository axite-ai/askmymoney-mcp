"use server";

import { baseURL } from "@/baseUrl";
import Stripe from "stripe";
import { Pool } from "pg";

type UpgradeResult =
  | { success: true; checkoutUrl: string }
  | { success: false; error: string };

// Plan to Stripe Price ID mapping
const PLAN_PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_BASIC_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
};

export async function upgradeSubscription(userId: string, plan: string): Promise<UpgradeResult> {
  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const planLower = plan.toLowerCase();
    const priceId = PLAN_PRICE_IDS[planLower];

    if (!priceId) {
      console.error("[Subscription Action] Invalid plan:", plan);
      return {
        success: false,
        error: `Invalid plan: ${plan}`,
      };
    }

    console.log("[Subscription Action] Creating checkout session:", {
      userId,
      plan: planLower,
      priceId,
    });

    // Initialize Stripe client
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-10-29.clover",
    });

    // Get user's Stripe customer ID from database
    // Better Auth stores this in the user table when createCustomerOnSignUp is true
    const pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

    let stripeCustomerId: string | null = null;

    try {
      const result = await pool.query(
        'SELECT "stripeCustomerId" FROM "user" WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "User not found",
        };
      }

      stripeCustomerId = result.rows[0].stripeCustomerId;

      // If no customer ID exists, create one
      if (!stripeCustomerId) {
        const userResult = await pool.query(
          'SELECT email, name FROM "user" WHERE id = $1',
          [userId]
        );

        const user = userResult.rows[0];
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId,
          },
        });

        stripeCustomerId = customer.id;

        // Update user with Stripe customer ID
        await pool.query(
          'UPDATE "user" SET "stripeCustomerId" = $1 WHERE id = $2',
          [stripeCustomerId, userId]
        );

        console.log("[Subscription Action] Created Stripe customer:", stripeCustomerId);
      }
    } finally {
      await pool.end();
    }

    // Create Stripe checkout session
    // CRITICAL: Must include metadata in BOTH places for Better Auth webhooks to work
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseURL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseURL}/pricing`,
      metadata: {
        referenceId: userId, // Checkout session metadata
        plan: planLower,
      },
      subscription_data: {
        metadata: {
          referenceId: userId, // CRITICAL: Better Auth webhooks look for referenceId here
          plan: planLower, // CRITICAL: Better Auth webhooks look for plan here
        },
      },
    });

    console.log("[Subscription Action] Checkout session created:", {
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

    if (!checkoutSession.url) {
      return {
        success: false,
        error: "No checkout URL returned from Stripe",
      };
    }

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
    };
  } catch (error) {
    console.error("[Subscription Action] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start subscription",
    };
  }
}
