import { oAuthProtectedResourceMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";

// Catch-all for OAuth Protected Resource Metadata requests with path segments (e.g., /mcp)
export const GET = oAuthProtectedResourceMetadata(auth);
