"use client";

import { useSession } from "@/lib/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { signIn } from "@/lib/auth/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackURL") || "/";
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push(callbackUrl);
    }
  }, [session, router, callbackUrl]);

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
                // Determine the correct callback URL
                // If we're in an OAuth flow (have client_id), we must redirect back to the authorize endpoint
                // with all the original query parameters to complete the handshake.
                const finalRedirect = searchParams.has("client_id")
                  ? `/api/auth/mcp/authorize?${searchParams.toString()}`
                  : callbackUrl; // Fallback to provided callback or home

                signIn.social({
                    provider: "google",
                    callbackURL: finalRedirect,
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
