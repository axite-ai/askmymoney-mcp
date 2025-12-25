/**
 * Helper functions for creating MCP tool responses
 * These helpers ensure proper typing for all MCP tool responses
 */

import type {
  MCPToolResponse,
  OpenAIResponseMetadata,
} from "@/lib/types/mcp-responses";
import type { AuthChallengeContent } from "@/lib/types/tool-responses";
import { createTextContent } from "@/lib/types/mcp-responses";
import { createUIResource } from '@mcp-ui/server';
import type { CreateUIResourceOptions } from '@mcp-ui/server';
import { baseURL } from "@/baseUrl";

/**
 * Creates a generic error response that matches AuthChallengeContent structure
 * This allows error responses to be compatible with tool response union types
 */
export const createErrorResponse = (
  message: string,
  meta?: Partial<OpenAIResponseMetadata>
): MCPToolResponse<AuthChallengeContent, OpenAIResponseMetadata> => ({
  content: [createTextContent(message)],
  structuredContent: {
    message,
  },
  isError: true,
  _meta: {
    "openai/toolInvocation/invoked": "Error occurred",
    ...meta
  }
});

/**
 * Creates a success response with structured content
 *
 * Following Vercel's Pattern 2 approach:
 * - Tools return text content + structuredContent + _meta
 * - Widgets are registered separately as resources
 * - ChatGPT fetches the widget via outputTemplate reference
 */
export const createSuccessResponse = <T extends Record<string, unknown>>(
  text: string,
  structuredContent: T,
  meta?: Partial<OpenAIResponseMetadata>
): MCPToolResponse<T, OpenAIResponseMetadata> => {
  return {
    content: [createTextContent(text)],
    structuredContent,
    isError: false,
    ...(meta && { _meta: meta as OpenAIResponseMetadata })
  };
};

/**
 * Creates an authentication challenge response
 */
export const createAuthChallengeResponse = (
  resourceMetadataUrl: string,
  errorDescription: string = "Authentication required"
): MCPToolResponse<{ error: string }, OpenAIResponseMetadata> => ({
  content: [createTextContent(errorDescription)],
  structuredContent: {
    error: "insufficient_scope"
  },
  isError: true,
  _meta: {
    "mcp/www_authenticate": `Bearer resource_metadata="${resourceMetadataUrl}", error="insufficient_scope", error_description="${errorDescription}"`
  }
});
