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

### 1. MCP Server (`app/[transport]/route.ts`)

- **mcp-handler**: Uses `createMcpHandler()` with Better Auth OAuth.
- **Tool Registration**: Register tools with `server.tool()` and resources with `server.resource()`.
- **AppType Export**: Exports `type AppType` for frontend type inference.

**Adding a Tool:**

```typescript
// app/[transport]/route.ts
server.tool(
  "tool_name",
  "Tool description",
  { name: z.string().optional() },
  async (args) => {
    return {
      content: [{ type: "text", text: "Hello!" }],
      structuredContent: { greeting: "Hello", name: args.name },
    };
  }
);
```

### 2. Frontend Widgets (`app/widgets/*` & `src/components/*`)

- **Pages**: `app/widgets/my-widget/page.tsx` renders the widget component.
- **Components**: `src/components/my-widget/index.tsx` contains the logic.
- **Hooks**: **ALWAYS** import from `@/src/skybridge` (not `skybridge/web` directly).

**Widget Pattern:**

```tsx
"use client";
import { useToolInfo } from "@/src/skybridge";
import type { MyContentType } from "@/lib/types/tool-responses";

export default function MyWidget() {
  const { output } = useToolInfo();
  const data = output as { structuredContent: MyContentType } | undefined;

  if (!data?.structuredContent) {
    return <div>Loading...</div>;
  }

  return <div>{data.structuredContent.greeting}</div>;
}
```

### 3. Skybridge Glue (`src/skybridge.ts`)

- **Single Source of Truth**: Re-exports Skybridge hooks for consistent imports.
- **Typed useCallTool**: Generated via `generateHelpers<AppType>()` for tool name autocomplete.
- **Direct Re-exports**: `useToolInfo`, `useWidgetState`, `useTheme`, `useDisplayMode`.

### 4. Authentication (`lib/auth/index.ts`)

- **Better Auth**: Handles OAuth 2.1 interaction with ChatGPT.
- **Stripe**: Optional subscription support via plugin.
- **Helper**: Use `requireAuth(session, "feature")` in tools to enforcing login/billing.

### 5. Database (`lib/db/schema.ts`)

- **Drizzle ORM**: Type-safe database definition.
- **Migrations**: `pnpm db:push` to sync schema changes.

## Best Practices

1.  **Import from Skybridge**: Always use `@/src/skybridge` for hooks, never `skybridge/web` directly.
2.  **Type Casting**: Cast `output` to your content type: `output as { structuredContent: MyType } | undefined`.
3.  **No Magic Strings**: Tool names in `useCallTool("tool_name")` are validated against `AppType`.
4.  **Bootstrap**: `app/layout.tsx` includes `<NextChatSDKBootstrap>`. Do not remove it.
5.  **Feature Flags**: Use `lib/config/features.ts` to toggle optional modules like Subscriptions.
