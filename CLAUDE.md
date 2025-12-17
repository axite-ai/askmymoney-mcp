# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Axite MCP Template** is a production-ready starter template for building ChatGPT MCP applications using **Next.js 15**, **Skybridge**, and **Better Auth**.

It is designed to be **Type-Safe End-to-End**:
- Backend tools define their shape.
- `Skybridge` infers these types (`AppType`).
- Frontend widgets import these types for full autocomplete.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (with Turbopack)
pnpm dev

# Production build
pnpm build

# Type checking (CRITICAL: Run this often)
pnpm typecheck

# Database operations
pnpm db:push         # Push schema to database
pnpm db:studio       # Launch Drizzle Studio GUI
```

## Architecture

### 1. MCP Server (`app/mcp/route.ts`)

- **Based on Skybridge**: Extends `McpServer` from `skybridge/server`.
- **Next.js Aware**: Uses custom `NextMcpServer` class to fetch widget HTML from Next.js dynamic routes.
- **Factory Pattern**: `createAxiteServer` creates the server instance.
- **AppType Export**: Exports `type AppType` which the frontend uses for type inference.

**Adding a Tool & Widget:**

```typescript
// app/mcp/route.ts
server.registerWidget(
  "tool_name",
  { title: "Widget Title", widgetPath: "/widgets/path" },
  {
    description: "Tool description",
    inputSchema: z.object({ ... })
  },
  async (args) => {
    return createSuccessResponse("Text result", { structured: "data" });
  }
);
```

### 2. Frontend Widgets (`app/widgets/*` & `src/components/*`)

- **Pages**: `app/widgets/my-widget/page.tsx` renders the widget component.
- **Components**: `src/components/my-widget/index.tsx` contains the logic.
- **Hooks**: **ALWAYS** use typed hooks from `@/src/skybridge` (not raw SDK hooks).

**Widget Pattern:**

```tsx
"use client";
import { useToolInfo } from "@/src/skybridge";

export default function MyWidget() {
  const { output } = useToolInfo(); // Typed automatically!
  // ...
}
```

### 3. Skybridge Glue (`src/skybridge.ts`)

- **Single Source of Truth**: This file connects the backend types to the frontend hooks.
- **Generated Hooks**: `useCallTool` is generated via `generateHelpers<AppType>()`.
- **Exports**: Re-exports useful hooks like `useWidgetState`, `useTheme`, `useDisplayMode`.

### 4. Authentication (`lib/auth/index.ts`)

- **Better Auth**: Handles OAuth 2.1 interaction with ChatGPT.
- **Stripe**: Optional subscription support via plugin.
- **Helper**: Use `requireAuth(session, "feature")` in tools to enforcing login/billing.

### 5. Database (`lib/db/schema.ts`)

- **Drizzle ORM**: Type-safe database definition.
- **Migrations**: `pnpm db:push` to sync schema changes.

## Best Practices

1.  **Strict Typing**: Do not manually type `ToolOutput` interfaces in widgets. Rely on inference from `useToolInfo()`.
2.  **No Magic Strings**: Tool names in `useCallTool("tool_name")` are checked against the backend definition.
3.  **Bootstrap**: `app/layout.tsx` includes `<NextChatSDKBootstrap>`. Do not remove it; it patches the browser environment for the ChatGPT iframe.
4.  **Feature Flags**: Use `lib/config/features.ts` to toggle optional modules like Subscriptions.
