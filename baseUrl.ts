// Detect deployment platform and construct base URL
// Priority: Explicit BASE_URL > BETTER_AUTH_URL > Railway > Vercel
const explicitUrl = process.env.BASE_URL;
const betterAuthUrl = process.env.BETTER_AUTH_URL;
const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : process.env.RAILWAY_STATIC_URL
  ? `https://${process.env.RAILWAY_STATIC_URL}`
  : undefined;
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;

// Priority: Explicit > Better Auth URL > Railway > Vercel
// No localhost fallback - URL must be explicitly configured
export const baseURL =
  explicitUrl || betterAuthUrl || railwayUrl || vercelUrl || "";

