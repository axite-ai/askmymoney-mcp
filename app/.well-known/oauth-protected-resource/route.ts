import { oAuthProtectedResourceMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";

// OAuth Protected Resource Metadata
// Required for MCP clients to discover resource server capabilities
export const GET = oAuthProtectedResourceMetadata(auth);
