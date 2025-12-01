"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Alert } from "@openai/apps-sdk-ui/components/Alert";
import { ShieldCheck } from "@openai/apps-sdk-ui/components/Icon";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    console.log("Login page loaded. OAuth Parameters:", {
      client_id: searchParams.get("client_id"),
      response_type: searchParams.get("response_type"),
      redirect_uri: searchParams.get("redirect_uri"),
      state: searchParams.get("state"),
      scope: searchParams.get("scope"),
      code_challenge: searchParams.get("code_challenge"),
      code_challenge_method: searchParams.get("code_challenge_method"),
      resource: searchParams.get("resource"),
    });

    // Passkey Conditional UI
    const initPasskey = async () => {
      if (!window.PublicKeyCredential?.isConditionalMediationAvailable) {
        return;
      }
      const available = await window.PublicKeyCredential.isConditionalMediationAvailable();
      if (available) {
        authClient.signIn.passkey({ autoFill: true });
      }
    };
    initPasskey();
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      // Determine the final destination
      // If we have a client_id (MCP flow), redirect back to authorize endpoint
      // Otherwise go to home
      const finalRedirect = searchParams.has("client_id")
        ? `/api/auth/mcp/authorize?${searchParams.toString()}`
        : "/";

      // Redirect to onboarding first to ensure security setup
      const onboardingURL = `/onboarding?callbackURL=${encodeURIComponent(finalRedirect)}`;

      console.log("[Login] Starting Google OAuth flow with callback:", onboardingURL);

      await authClient.signIn.social({
        provider: "google",
        callbackURL: onboardingURL,
        newUserCallbackURL: onboardingURL,
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const callbackURL = searchParams.has("client_id")
        ? `/api/auth/mcp/authorize?${searchParams.toString()}`
        : "/";

      const { error } = await authClient.signIn.passkey({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = callbackURL;
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Passkey sign-in error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center heading-lg text-default">
            Welcome to AskMyMoney
          </h2>
          <p className="mt-2 text-center text-sm text-secondary">
            Sign in with Google or Passkey to continue
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <Alert
              color="danger"
              description={error}
            />
          )}

          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              loading={loading}
              color="primary"
              size="xl"
              block
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-subtle" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-secondary">Or</span>
              </div>
            </div>

            <Button
              onClick={handlePasskeySignIn}
              disabled={loading}
              loading={loading}
              color="secondary"
              size="xl"
              block
            >
              <ShieldCheck className="w-5 h-5 mr-2" />
              Sign in with Passkey
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary">
              <ShieldCheck className="w-4 h-4 inline-block mr-1 align-text-bottom" />
              Secure authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
