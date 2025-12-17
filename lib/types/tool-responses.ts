/**
 * Type definitions for tool-specific structured content
 * TEMPLATE: Define your own tool response types here
 */

import type { MCPToolResponse, OpenAIResponseMetadata } from "./mcp-responses";
import { z } from "zod";

// ============================================================================
// COMMON AUTH/ERROR RESPONSES
// ============================================================================

/**
 * Common Auth Challenge Content
 * Used when a tool requires authentication or subscription
 */
export interface AuthChallengeContent extends Record<string, unknown> {
  message: string;
  featureName?: string;
  error_message?: string;
  pricingUrl?: string;
  baseUrl?: string;
  setupUrl?: string;
}

/**
 * Auth Challenge Response Type
 * Returned by requireAuth() helper and auth response builders
 */
export type AuthChallengeResponse = MCPToolResponse<
  AuthChallengeContent,
  OpenAIResponseMetadata
>;

/**
 * Common Auth/Error Response Schema (for validation)
 * Used when a tool requires authentication or subscription
 */
export const AuthResponseSchema = z.union([
  // Login prompt
  z.object({
    message: z.string(),
  }),
  // Subscription required
  z.object({
    featureName: z.string(),
    error_message: z.string(),
    pricingUrl: z.string(),
  }),
  // Security required
  z.object({
    message: z.string(),
    baseUrl: z.string(),
    featureName: z.string(),
    setupUrl: z.string(),
  }),
]);

// ============================================================================
// EXAMPLE TOOL RESPONSE TYPES
// TEMPLATE: Replace these with your own tool response types
// ============================================================================

/**
 * Hello World Content
 * A simple example tool response
 */
export interface HelloWorldContent extends Record<string, unknown> {
  greeting: string;
  name: string;
  timestamp: string;
}

export type HelloWorldResponse = MCPToolResponse<
  HelloWorldContent,
  OpenAIResponseMetadata
>;
