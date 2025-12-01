// Detect deployment platform and construct base URL
const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : undefined;
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const localUrl = "https://dev.askmymoney.ai";

// Priority: Railway > Vercel > Local development
export const baseURL = railwayUrl || vercelUrl || localUrl;

