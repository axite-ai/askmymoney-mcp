import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get("origin");

  // List of allowed origins (ChatGPT sandbox, Claude, etc.)
  const allowedOrigins = [
    /^https:\/\/.*\.oaiusercontent\.com$/,  // ChatGPT sandbox
    /^https:\/\/chatgpt\.com$/,
    /^https:\/\/chat\.openai\.com$/,
    /^https:\/\/.*\.claude\.ai$/,
    /^https:\/\/claude\.com$/,
  ];

  // Check if origin is allowed
  const isAllowedOrigin = origin && (
    allowedOrigins.some(pattern => pattern.test(origin)) ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  );

  // Determine which origin to use in response
  const allowOrigin = isAllowedOrigin ? origin : "*";

  // Handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Credentials": isAllowedOrigin ? "true" : "false",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Get the response
  const response = NextResponse.next();

  // Set CORS headers for all requests
  response.headers.set("Access-Control-Allow-Origin", allowOrigin);
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");

  // Expose headers that OAuth/MCP clients need
  response.headers.set("Access-Control-Expose-Headers", "WWW-Authenticate, Location, Content-Type, Authorization");

  return response;
}

export const config = {
  matcher: [
    // Match all API routes and well-known routes
    "/api/:path*",
    "/.well-known/:path*",
    "/mcp/:path*",
  ],
};
