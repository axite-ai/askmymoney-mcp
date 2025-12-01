# Google OAuth + 2FA Setup Guide

This guide explains how to set up Google OAuth authentication and mandatory two-factor authentication (2FA) for AskMyMoney.

## Overview

AskMyMoney uses:
- **Google OAuth** for user authentication (email/password removed)
- **TOTP-based 2FA** (Time-based One-Time Passwords) for additional security
- **Backup codes** for account recovery

All users must complete 2FA setup after their first Google login.

---

## Prerequisites

- Access to [Google Cloud Console](https://console.cloud.google.com/)
- A Google account with permissions to create OAuth credentials
- PostgreSQL database (for storing user accounts and 2FA data)
- Redis instance (for rate limiting and session caching)

---

## Part 1: Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `AskMyMoney` (or your preferred name)
5. Click **"Create"**

### Step 2: Enable OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** user type (unless using Google Workspace)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: `AskMyMoney`
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. **Scopes**: Click "Add or Remove Scopes"
   - Add `userinfo.email`
   - Add `userinfo.profile`
   - Add `openid`
7. Click **"Save and Continue"**
8. **Test users** (optional during development):
   - Add your email address for testing
9. Click **"Save and Continue"**
10. Review and click **"Back to Dashboard"**

### Step 3: Create OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Choose **Application type**: **"Web application"**
4. Enter **Name**: `AskMyMoney Web Client`
5. **Authorized JavaScript origins**:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
6. **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
   - Add both if testing in dev and prod
7. Click **"Create"**
8. **Important**: Copy the **Client ID** and **Client Secret** - you'll need these for your `.env` file

### Step 4: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

**Security Note**: Never commit the `.env` file to version control. The `.env.example` file shows the format without sensitive values.

---

## Part 2: 2FA Architecture

### How It Works

1. **First-time users**:
   - Sign in with Google
   - Redirected to `/setup-2fa` page
   - Scan QR code with authenticator app (Google Authenticator, Authy, 1Password, etc.)
   - Enter 6-digit code to verify setup
   - Save 10 backup codes for recovery
   - Redirected to their destination

2. **Returning users**:
   - Sign in with Google
   - Redirected to `/verify-2fa` page
   - Enter 6-digit code from authenticator app
   - Can use backup code if device is lost
   - Redirected to their destination

### Database Schema

The 2FA system requires two additions to the database schema:

1. **User table** - Added field:
   ```sql
   two_factor_enabled BOOLEAN DEFAULT FALSE
   ```

2. **two_factor table** - New table:
   ```sql
   CREATE TABLE two_factor (
     id TEXT PRIMARY KEY,
     secret TEXT NOT NULL,        -- Encrypted TOTP secret
     backup_codes TEXT NOT NULL,  -- Encrypted backup codes
     user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
   );
   ```

### Security Features

- **TOTP standard**: 30-second periods, 6-digit codes (RFC 6238 compliant)
- **Encrypted storage**: Secrets and backup codes are encrypted at rest
- **Backup codes**: 10 single-use codes for account recovery
- **Issuer**: Shows "AskMyMoney" in authenticator apps
- **Verification required**: Users must verify TOTP before 2FA is enabled

---

## Part 3: User Flow

### Authentication Flow

```
┌─────────────────┐
│   User visits   │
│   /login page   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Click "Sign in │
│  with Google"   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Google OAuth   │
│  consent screen │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  First login?   │◄─── YES ──┐
└────────┬────────┘           │
         │                    │
         NO                   │
         │              ┌─────┴──────┐
         │              │ /setup-2fa │
         │              │  QR code   │
         │              │  Verify    │
         │              │  Backup    │
         │              └─────┬──────┘
         │                    │
         v                    v
┌─────────────────┐    ┌─────────────┐
│  /verify-2fa    │    │ 2FA enabled │
│  Enter code     │    └─────┬───────┘
└────────┬────────┘           │
         │                    │
         v                    v
┌─────────────────────────────┐
│     Access granted          │
│  Redirect to destination    │
└─────────────────────────────┘
```

### Middleware Protection

The Next.js middleware (`middleware.ts`) enforces 2FA:

- Checks all authenticated routes (except public paths)
- If user is logged in but doesn't have `twoFactorEnabled: true`, redirects to `/setup-2fa`
- Preserves OAuth callback URLs for seamless flow
- Public paths (login, 2FA pages, API routes) are exempt

---

## Part 4: Testing

### Local Development Testing

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Test Google OAuth**:
   - Visit `http://localhost:3000/login`
   - Click "Sign in with Google"
   - Complete Google consent flow
   - Verify redirect to `/setup-2fa`

3. **Test 2FA Setup**:
   - Open authenticator app on your phone
   - Scan the QR code displayed
   - Enter the 6-digit code
   - Save the backup codes shown

4. **Test 2FA Verification**:
   - Sign out and sign in again with Google
   - Verify redirect to `/verify-2fa`
   - Enter code from authenticator app
   - Verify access granted

5. **Test Backup Codes**:
   - Sign out and sign in with Google
   - On `/verify-2fa`, click "Use a backup code"
   - Enter one of your saved 10-character backup codes
   - Verify access granted

### Production Testing

1. **Update redirect URIs** in Google Cloud Console:
   - Add `https://yourdomain.com/api/auth/callback/google`

2. **Update environment variables**:
   ```bash
   BETTER_AUTH_URL=https://yourdomain.com
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

3. **Deploy and test** with real users

---

## Part 5: Troubleshooting

### Common Issues

#### 1. "redirect_uri_mismatch" Error

**Cause**: The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution**:
- Go to Google Cloud Console → Credentials
- Edit your OAuth client
- Ensure redirect URIs exactly match:
  - Dev: `http://localhost:3000/api/auth/callback/google`
  - Prod: `https://yourdomain.com/api/auth/callback/google`
- No trailing slashes!

#### 2. "Social provider google is missing clientId or clientSecret"

**Cause**: Environment variables not loaded.

**Solution**:
- Check `.env` file exists and has correct values
- Restart the development server: `pnpm dev`
- Verify variables with: `echo $GOOGLE_CLIENT_ID`

#### 3. QR Code Not Showing

**Cause**: 2FA enable API call failed.

**Solution**:
- Check browser console for errors
- Verify database has `two_factor` table: `pnpm db:studio`
- Check Better Auth logs for API errors

#### 4. "Invalid code" on Verification

**Cause**: Clock drift or incorrect code entry.

**Solution**:
- Ensure device clock is synced
- Try the next code from authenticator app
- Check TOTP period is 30 seconds (standard)

#### 5. Stuck in 2FA Setup Loop

**Cause**: Middleware redirecting before 2FA is fully enabled.

**Solution**:
- Check if `twoFactorEnabled` field is set to `true` in database
- Verify TOTP verification completed successfully
- Clear cookies and try again

---

## Part 6: API Endpoints

### Better Auth Provides These Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/sign-in/social/google` | GET | Initiates Google OAuth flow |
| `/api/auth/callback/google` | GET | Google OAuth callback |
| `/api/auth/two-factor/enable` | POST | Enable 2FA, get TOTP URI |
| `/api/auth/two-factor/verify` | POST | Verify TOTP code |
| `/api/auth/two-factor/verify-backup-code` | POST | Verify backup code |
| `/api/auth/two-factor/disable` | POST | Disable 2FA (requires password) |

**Note**: Email/password endpoints have been removed.

---

## Part 7: Recommended Authenticator Apps

- **Google Authenticator** (iOS/Android) - Simple, free
- **Authy** (iOS/Android/Desktop) - Cloud backup, multi-device
- **1Password** (All platforms) - Integrated password manager
- **Microsoft Authenticator** (iOS/Android) - Push notifications
- **Bitwarden** (All platforms) - Open source, self-hostable

All standard TOTP apps are compatible with AskMyMoney's implementation.

---

## Part 8: Security Best Practices

### For Developers

1. **Never log TOTP secrets** - They're like passwords
2. **Always use HTTPS in production** - OAuth requires it
3. **Rotate client secrets periodically** - Update in Google Console and `.env`
4. **Monitor failed 2FA attempts** - Could indicate brute force attacks
5. **Keep backup codes encrypted** - Better Auth handles this automatically

### For Users

1. **Save backup codes offline** - Print or write them down
2. **Don't share backup codes** - Each can only be used once
3. **Use different authenticator device than login device** - Better security
4. **Revoke Google access if compromised** - Go to Google Account settings
5. **Enable 2FA on your Google account too** - Layer security

---

## Part 9: Migration from Email/Password

If you had users with email/password authentication:

1. **Data retention**: Users must re-register with Google OAuth
2. **Communication**: Notify users of the change
3. **Grace period**: Consider running both auth methods briefly
4. **Account linking**: Implement email matching to preserve user data

**Note**: This implementation assumes a fresh start or complete migration.

---

## Support

For issues or questions:
- Check Better Auth docs: https://www.better-auth.com/docs/plugins/2fa
- Check Google OAuth docs: https://developers.google.com/identity/protocols/oauth2
- Review application logs for detailed error messages

---

## Summary

You've now configured:
✅ Google OAuth as the sole authentication method
✅ Mandatory TOTP-based 2FA for all users
✅ Backup codes for account recovery
✅ Middleware-enforced 2FA setup
✅ Secure, encrypted storage of secrets

Users will have a seamless experience with strong security guarantees.
