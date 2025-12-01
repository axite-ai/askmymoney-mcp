"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Input } from "@openai/apps-sdk-ui/components/Input";
import { Alert } from "@openai/apps-sdk-ui/components/Alert";
import { ShieldCheck } from "@openai/apps-sdk-ui/components/Icon";
import { authClient } from "@/lib/auth/client";
import QRCode from "react-qr-code";

function Setup2FAContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Enable 2FA and get TOTP URI
    enable2FA();
  }, []);

  const enable2FA = async () => {
    try {
      setLoading(true);

      const { data, error } = await authClient.twoFactor.enable({
        password: "", // Not needed for social login if skipVerificationOnEnable is false? Actually might be needed if user has password.
        // For OAuth users, they don't have a password.
        // But Better Auth might require it.
        // If so, we might need to rely on Passkeys for them.
        // Let's assume for now this works or we will catch error.
      });

      if (error) {
        throw new Error(error.message || "Failed to enable 2FA");
      }

      setTotpUri(data.totpURI);
      setBackupCodes(data.backupCodes || []);

    } catch (err) {
      console.error("2FA enable error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: verificationCode,
      });

      if (error) {
        throw new Error(error.message || "Invalid code");
      }

      // Show backup codes before continuing
      setShowBackupCodes(true);

    } catch (err) {
      console.error("Verification error:", err);
      setError(err instanceof Error ? err.message : "Invalid code");
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const callbackURL = searchParams.get("callbackURL");
    if (callbackURL) {
      window.location.href = callbackURL;
    } else {
      router.push("/");
    }
  };

  if (showBackupCodes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center heading-lg text-default">
              Save Your Backup Codes
            </h2>
            <p className="mt-2 text-center text-sm text-secondary">
              Store these codes in a safe place.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="bg-surface-secondary p-6 rounded-lg border border-subtle">
              <div className="grid grid-cols-2 gap-3 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-default">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleContinue}
              color="primary"
              size="xl"
              block
            >
              I've saved my backup codes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center heading-lg text-default">
            Set up Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-secondary">
            Scan the QR code with your authenticator app
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <Alert color="danger" description={error} />
          )}

          {loading && !totpUri ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : totpUri ? (
            <>
              <div className="flex justify-center bg-white p-6 rounded-lg">
                <QRCode value={totpUri} size={200} />
              </div>

              <div className="text-center">
                <p className="text-xs font-mono bg-surface-secondary p-3 rounded break-all text-default">
                  {totpUri}
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-default mb-2">
                    Enter the 6-digit code
                  </label>
                  <Input
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={loading}
                    placeholder="000000"
                    size="lg"
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  loading={loading}
                  color="primary"
                  size="xl"
                  block
                >
                  Verify and Continue
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Setup2FAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <Setup2FAContent />
    </Suspense>
  );
}
