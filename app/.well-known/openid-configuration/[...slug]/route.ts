import { oAuthDiscoveryMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";

// Catch-all for OpenID configuration requests with path segments (e.g., /mcp)
export const GET = oAuthDiscoveryMetadata(auth);
