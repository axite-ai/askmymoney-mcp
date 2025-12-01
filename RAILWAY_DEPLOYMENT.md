# Railway Deployment Guide

This guide covers deploying AskMyMoney to Railway.app.

## Prerequisites

1. Railway account (https://railway.app)
2. PostgreSQL and Redis databases provisioned in Railway
3. All required API keys (Plaid, Stripe, Google OAuth, etc.)

## Deployment Steps

### 1. Create a New Project in Railway

1. Go to https://railway.app/new
2. Select "Deploy from GitHub repo"
3. Connect your repository

### 2. Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically create and link the database
3. Note: Railway automatically sets `DATABASE_URL` - you don't need to set individual `POSTGRES_*` variables

### 3. Add Redis Database

1. In your Railway project, click "New" → "Database" → "Redis"
2. Railway will automatically create and link Redis
3. Note: Railway automatically sets `REDIS_URL`

### 4. Configure Environment Variables

In your Railway service settings, add the following environment variables:

#### Required Environment Variables

```bash
# Better Auth
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=https://<your-railway-domain>.railway.app
BETTER_AUTH_API_KEY=<generate with: npx tsx --env-file=.env scripts/generate-api-key.ts>

# Plaid API
PLAID_CLIENT_ID=<your_plaid_client_id>
PLAID_SECRET=<your_plaid_secret>
PLAID_ENV=sandbox  # or development/production

# Google OAuth
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

# Stripe
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<your_stripe_webhook_secret>
STRIPE_BASIC_PRICE_ID=<price_id>
STRIPE_PRO_PRICE_ID=<price_id>
STRIPE_ENTERPRISE_PRICE_ID=<price_id>
STRIPE_BILLING_PORTAL_URL=<your_billing_portal_url>

# Encryption
ENCRYPTION_KEY=<generate with: openssl rand -hex 32>

# Email (Resend)
RESEND_API_KEY=<your_resend_api_key>
EMAIL_FROM=noreply@yourdomain.com
```

#### Optional: Database Configuration (if not using Railway's auto-linked databases)

If you're using external databases instead of Railway's built-in ones:

```bash
# PostgreSQL (Railway auto-sets DATABASE_URL, but if using external DB):
POSTGRES_HOST=<host>
POSTGRES_PORT=5432
POSTGRES_DB=<database_name>
POSTGRES_USER=<username>
POSTGRES_PASSWORD=<password>
POSTGRES_SSL=true

# Redis (Railway auto-sets REDIS_URL, but if using external Redis):
REDIS_URL=redis://<host>:<port>
```

### 5. Configure Build and Start Commands

Railway should auto-detect these from `package.json`, but verify:

- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`

### 6. Configure Google OAuth Redirect URIs

In your Google Cloud Console (https://console.cloud.google.com/apis/credentials):

1. Add your Railway domain to authorized redirect URIs:
   - `https://<your-railway-domain>.railway.app/api/auth/callback/google`

### 7. Configure Stripe Webhooks

In your Stripe Dashboard (https://dashboard.stripe.com/webhooks):

1. Add a webhook endpoint:
   - URL: `https://<your-railway-domain>.railway.app/api/stripe/webhook`
   - Events to listen for: All subscription events

### 8. Run Database Migrations

After deployment, you need to run database migrations:

1. In Railway, open the service's "Deploy" tab
2. Click "Variables" and temporarily add: `DATABASE_URL` (should already be set by Railway)
3. Open the service shell (click the three dots → "Shell")
4. Run: `pnpm db:migrate`

### 9. Deploy

1. Push to your GitHub repository
2. Railway will automatically build and deploy
3. Check the deployment logs for any errors

## Verifying the Deployment

1. Check that your app is accessible at `https://<your-railway-domain>.railway.app`
2. Test the MCP endpoint: `https://<your-railway-domain>.railway.app/mcp`
3. Test OAuth: Try logging in via Google OAuth
4. Check Railway logs for any errors

## Troubleshooting

### 502 Bad Gateway Errors

If you see 502 errors, check:

1. **Environment variables are set correctly** - Railway requires `BETTER_AUTH_URL` to be set to your Railway domain
2. **Database connections** - Ensure PostgreSQL and Redis are accessible
3. **Build succeeded** - Check Railway build logs
4. **Port binding** - Railway automatically sets the PORT, Next.js should bind to it

### OAuth Redirect Errors

1. Verify `BETTER_AUTH_URL` matches your Railway domain exactly
2. Check Google OAuth redirect URIs include your Railway domain
3. Ensure Railway domain is HTTPS (should be automatic)

### Asset Loading Failures

The app automatically detects Railway deployment via the `RAILWAY_PUBLIC_DOMAIN` environment variable (automatically set by Railway). If assets still fail to load:

1. Verify `RAILWAY_PUBLIC_DOMAIN` is set in Railway's environment variables (should be automatic)
2. Verify the domain matches your service URL

### Database Connection Issues

Railway auto-links databases and sets connection strings. If you see connection errors:

1. Verify PostgreSQL service is running
2. Verify Redis service is running
3. Check Railway's "Variables" tab shows `DATABASE_URL` and `REDIS_URL`

## Custom Domain Setup

To use a custom domain:

1. In Railway, go to your service settings
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed by Railway
5. Update environment variables:
   - `BETTER_AUTH_URL=https://yourdomain.com`
6. Update OAuth redirect URIs in Google Cloud Console
7. Update Stripe webhook endpoint URL

## Important Notes

- Railway provides automatic HTTPS for all deployments
- Railway automatically injects `PORT` environment variable - Next.js will use it
- Database backups are available in Railway's dashboard
- Railway provides automatic deployments on git push
- Check Railway's pricing for database and bandwidth limits

## Monitoring

Railway provides built-in monitoring:

1. **Logs**: View real-time logs in the Railway dashboard
2. **Metrics**: CPU, memory, and network usage
3. **Deployments**: Track deployment history and rollback if needed

## Need Help?

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Better Auth Documentation: https://www.better-auth.com/docs
