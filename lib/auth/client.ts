import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/verify-2fa";
      },
    }),
  ],
});
