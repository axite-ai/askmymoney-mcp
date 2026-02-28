import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  // Use current window origin - never hardcode localhost
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  plugins: [
    passkeyClient(),
  ],
});

// Destructured exports for convenience
export const {
  signIn,
  signOut,
  useSession,
} = authClient;

