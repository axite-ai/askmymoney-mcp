import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";

const nextConfig: NextConfig = {
  assetPrefix: baseURL,
  // Allow cross-origin requests from ChatGPT sandbox for Server Actions
  experimental: {
    serverActions: {
      allowedOrigins: [
        "connector_*.web-sandbox.oaiusercontent.com",
        "*.web-sandbox.oaiusercontent.com",
        "web-sandbox.oaiusercontent.com",
        "chatgpt.com",
        "*.chatgpt.com",
      ],
    },
  },
  // Turbopack config to handle node modules (skybridge uses @babel/core which needs fs)
  turbopack: {
    resolveAlias: {
      // Stub out Node.js modules that @babel/core tries to use
      fs: { browser: "./src/stubs/empty.js" },
      path: { browser: "./src/stubs/empty.js" },
      module: { browser: "./src/stubs/empty.js" },
    },
  },
  serverExternalPackages: ["skybridge", "vite", "esbuild", "lightningcss"],
  // Skip ESLint during builds (run separately with pnpm lint)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack fallback for non-turbo builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        module: false,
      };
    }
    return config;
  },
};

export default nextConfig;
