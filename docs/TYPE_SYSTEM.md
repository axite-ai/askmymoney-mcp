# MCP Response Type System

This document explains the type-safe response system for MCP tools, based on the OpenAI Apps SDK specification.

## Overview

The project uses a comprehensive type system to ensure all MCP tool responses are properly typed and compatible with both the MCP SDK and OpenAI's Apps SDK requirements.

## File Structure

```
lib/
├── types/
│   ├── mcp-responses.ts       # Core MCP response types
│   └── tool-responses.ts      # Application-specific structured content types
└── utils/
    ├── mcp-response-helpers.ts # Response builder functions
    └── auth-responses.ts       # Authentication-specific responses
```

## Core Types

### MCPContent (`lib/types/mcp-responses.ts`)

Represents individual content items that can be returned in MCP responses:

```typescript
export type MCPContent =
  | { type: "text"; text: string; _meta?: Record<string, unknown> }
  | { type: "image"; data: string; mimeType: string; _meta?: Record<string, unknown> }
  | { type: "audio"; data: string; mimeType: string; _meta?: Record<string, unknown> }
  | {
      type: "resource";
      resource:
        | { uri: string; text: string; mimeType?: string; _meta?: Record<string, unknown> }
        | { uri: string; blob: string; mimeType?: string; _meta?: Record<string, unknown> };
      _meta?: Record<string, unknown>;
    };
```

**Key Feature:** Uses literal types (`type: "text"`) instead of string types to ensure MCP SDK compatibility.

### OpenAIResponseMetadata

Contains all OpenAI-specific metadata fields for controlling widget behavior:

```typescript
export interface OpenAIResponseMetadata {
  "openai/outputTemplate"?: string;           // Widget template URI
  "openai/widgetAccessible"?: boolean;        // Can widget call tools?
  "openai/toolInvocation/invoking"?: string;  // Loading message
  "openai/toolInvocation/invoked"?: string;   // Complete message
  "openai/widgetDescription"?: string;        // Widget description
  "openai/widgetPrefersBorder"?: boolean;     // Show border?
  "openai/widgetCSP"?: { ... };              // CSP configuration
  "mcp/www_authenticate"?: string | string[]; // OAuth challenges
  // ... and more
}
```

### MCPToolResponse

Generic response type for all tool handlers:

```typescript
export interface MCPToolResponse<
  TStructuredContent = Record<string, unknown>,
  TMetadata = Record<string, unknown>
> {
  content: MCPContent[];              // What the model reads
  structuredContent?: TStructuredContent; // Data for widget + model
  _meta?: TMetadata & Partial<OpenAIResponseMetadata>; // Widget-only data
  isError?: boolean;                  // Error flag
}
```

## Helper Functions

### Response Builders (`lib/utils/mcp-response-helpers.ts`)

**createSuccessResponse**
```typescript
createSuccessResponse<T>(
  text: string,
  structuredContent: T,
  meta?: Partial<OpenAIResponseMetadata>
)
```

Creates a successful tool response with typed structured content.

**Example:**
```typescript
return createSuccessResponse(
  "Found 5 accounts with total balance of $12,345.67",
  {
    accounts: accountData,
    totalBalance: 12345.67,
    lastUpdated: new Date().toISOString()
  }
);
```

**createErrorResponse**
```typescript
createErrorResponse(
  message: string,
  meta?: Partial<OpenAIResponseMetadata>
)
```

Creates a type-safe error response.

**Example:**
```typescript
return createErrorResponse(
  "Failed to fetch account data: Network timeout"
);
```

### Content Item Builders

**createTextContent**
```typescript
createTextContent(text: string, meta?: Record<string, unknown>): MCPContent
```

**createImageContent**
```typescript
createImageContent(
  data: string,
  mimeType: string,
  meta?: Record<string, unknown>
): MCPContent
```

**createResourceContent**
```typescript
createResourceContent(
  uri: string,
  content: { text: string; mimeType?: string } | { blob: string; mimeType?: string },
  meta?: Record<string, unknown>
): MCPContent
```

### Authentication Responses (`lib/utils/auth-responses.ts`)

**createLoginPromptResponse**
```typescript
createLoginPromptResponse(featureName?: string)
```

Returns a login widget when user is not authenticated.

**createSubscriptionRequiredResponse**
```typescript
createSubscriptionRequiredResponse(featureName?: string, userId?: string)
```

Returns a subscription selection widget when user lacks an active subscription.

**createPlaidRequiredResponse**
```typescript
createPlaidRequiredResponse(userId: string, headers: Headers)
```

Returns a Plaid connection widget when user hasn't linked bank accounts.

## Application-Specific Types (`lib/types/tool-responses.ts`)

Define structured content shapes for each tool:

```typescript
export interface AccountBalancesContent {
  accounts: AccountBase[];
  totalBalance: number;
  lastUpdated: string;
}

export type AccountBalancesResponse = MCPToolResponse<
  AccountBalancesContent,
  OpenAIResponseMetadata
>;
```

## Usage Pattern

### 1. Define Structured Content Type

In `lib/types/tool-responses.ts`:

```typescript
export interface YourFeatureContent {
  data: SomeType[];
  count: number;
  timestamp: string;
}

export type YourFeatureResponse = MCPToolResponse<
  YourFeatureContent,
  OpenAIResponseMetadata
>;
```

### 2. Implement Tool Handler

In `app/mcp/route.ts`:

```typescript
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/mcp-response-helpers";
import {
  createLoginPromptResponse,
  createSubscriptionRequiredResponse,
  createPlaidRequiredResponse
} from "@/lib/utils/auth-responses";

server.registerTool(
  "your_tool_name",
  {
    title: "Your Tool Title",
    description: "What this tool does",
    inputSchema: {
      param1: z.string().describe("Parameter description"),
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/your-widget.html",
      "openai/toolInvocation/invoking": "Loading...",
      "openai/toolInvocation/invoked": "Complete!",
    },
    securitySchemes: [{ type: "oauth2", scopes: ["feature:read"] }],
  },
  async ({ param1 }) => {
    try {
      // Three-tier auth check
      if (!session) {
        return createLoginPromptResponse("your feature");
      }

      if (!(await hasActiveSubscription(session.userId))) {
        return createSubscriptionRequiredResponse("your feature", session.userId);
      }

      const accessTokens = await UserService.getUserAccessTokens(session.userId);
      if (accessTokens.length === 0) {
        return await createPlaidRequiredResponse(session.userId, req.headers);
      }

      // Business logic
      const result = await fetchYourData(param1, accessTokens);

      // Type-safe response
      return createSuccessResponse(
        `Processed ${result.count} items successfully`,
        {
          data: result.data,
          count: result.count,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : "Operation failed"
      );
    }
  }
);
```

## Benefits

1. **Type Safety**: TypeScript catches errors at compile time
2. **MCP SDK Compatibility**: Proper literal types prevent runtime errors
3. **Reduced Boilerplate**: Helper functions handle repetitive structure
4. **Consistency**: All responses follow the same pattern
5. **Documentation**: Type definitions serve as inline documentation
6. **Refactoring**: Changes to response structure are caught by TypeScript
7. **IntelliSense**: IDEs provide autocomplete for all fields

## Common Pitfalls

❌ **Don't** manually construct content objects:
```typescript
return {
  content: [{ type: "text", text: "Hello" }], // type inferred as string
  structuredContent: { data: [] }
};
```

✅ **Do** use helper functions:
```typescript
return createSuccessResponse("Hello", { data: [] });
```

❌ **Don't** skip defining structured content types:
```typescript
return createSuccessResponse("Hello", { randomField: "value" }); // No type safety
```

✅ **Do** define types first in `tool-responses.ts`:
```typescript
export interface YourContent {
  randomField: string;
}

return createSuccessResponse("Hello", { randomField: "value" }); // Type-safe
```

## Migration Guide

To migrate existing tools to the new type system:

1. Define structured content type in `lib/types/tool-responses.ts`
2. Replace manual response construction with `createSuccessResponse()` or `createErrorResponse()`
3. Replace auth responses with helper functions from `auth-responses.ts`
4. Run `pnpm typecheck` to verify type safety

## References

- [OpenAI Apps SDK - Build MCP Server](https://developers.openai.com/docs/apps-sdk/build/mcp-server)
- [MCP Specification - Tool Results](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#tool-result)
- [OpenAI Apps SDK - Reference](https://developers.openai.com/docs/apps-sdk/reference)
