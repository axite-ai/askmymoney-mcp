import { oAuthDiscoveryMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";

// OAuth Authorization Server Metadata (RFC 8414)
// Some MCP clients request this endpoint for OAuth discovery
export const GET = oAuthDiscoveryMetadata(auth);
