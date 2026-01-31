/**
 * Auth Nonce Utility
 *
 * Generates and verifies short-lived, HMAC-signed nonces that encode a userId.
 * Used to pass authentication context to popup windows (e.g., /connect-bank)
 * without exposing the raw MCP Bearer token in URLs.
 *
 * The nonce is signed with the server's auth secret and expires after 30 minutes.
 */

import crypto from 'crypto';

const NONCE_SECRET = process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET || '';
const NONCE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Create a signed auth nonce encoding a userId.
 * Format: base64url(payload).signature
 */
export function createAuthNonce(userId: string): string {
  if (!NONCE_SECRET) {
    throw new Error('Auth secret not configured');
  }

  const payload = JSON.stringify({
    sub: userId,
    exp: Date.now() + NONCE_EXPIRY_MS,
  });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = crypto
    .createHmac('sha256', NONCE_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${sig}`;
}

/**
 * Verify a signed auth nonce and return the userId if valid.
 * Returns null if the nonce is invalid, expired, or tampered with.
 */
export function verifyAuthNonce(nonce: string): string | null {
  if (!NONCE_SECRET || !nonce) return null;

  const parts = nonce.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  // Verify HMAC signature with timing-safe comparison
  const expectedSig = crypto
    .createHmac('sha256', NONCE_SECRET)
    .update(payloadB64)
    .digest('base64url');

  if (sig.length !== expectedSig.length) return null;

  const sigValid = crypto.timingSafeEqual(
    Buffer.from(sig),
    Buffer.from(expectedSig)
  );
  if (!sigValid) return null;

  // Parse and validate expiry
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
