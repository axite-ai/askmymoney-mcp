/**
 * Feature Flags Configuration
 *
 * Control which features are enabled in your application.
 * TEMPLATE: Customize these flags based on your needs.
 */

/**
 * Feature flags for the application
 * Set these via environment variables to enable/disable features
 */
export const FEATURES = {
  /**
   * Enable passkey (WebAuthn) authentication
   * - When true: Users can set up passkeys for additional security
   * - When false: Passkey features are hidden
   */
  PASSKEYS: process.env.ENABLE_PASSKEYS !== "false", // Enabled by default

  /**
   * Enable paid subscription gates (Stripe integration)
   * - When true: Users must have an active subscription to access features
   * - When false: All authenticated users get free access with 2-account limit
   * Set ENABLE_SUBSCRIPTIONS=true in .env to re-enable paid gates
   */
  SUBSCRIPTIONS: process.env.ENABLE_SUBSCRIPTIONS === "true", // Disabled by default
} as const;

/**
 * Helper to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}
