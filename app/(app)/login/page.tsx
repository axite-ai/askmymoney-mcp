"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "@/lib/auth/client";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showTestLogin, setShowTestLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getFinalRedirect = () => {
    if (searchParams.has("client_id")) {
      return `/api/auth/mcp/authorize?${searchParams.toString()}`;
    }
    return searchParams.get("callbackURL") || "/";
  };

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.username({
        username,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Skip onboarding for test accounts — go directly to callback
      router.push(getFinalRedirect());
    } catch {
      setError("Sign in failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-lg bg-surface text-foreground">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to connect your account
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => {
                const finalRedirect = getFinalRedirect();
                const onboardingURL = `/onboarding?callbackURL=${encodeURIComponent(finalRedirect)}`;

                signIn.social({
                    provider: "google",
                    callbackURL: onboardingURL,
                    newUserCallbackURL: onboardingURL,
                });
            }}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-4 py-3 text-black hover:bg-gray-100 transition-colors font-medium border border-gray-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Test credentials login - collapsible */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowTestLogin(!showTestLogin)}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              {showTestLogin ? "Hide" : "Sign in with test credentials"}
            </button>

            {showTestLogin && (
              <form onSubmit={handleTestLogin} className="mt-3 space-y-3">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  required
                />
                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-lg bg-surface text-foreground">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
