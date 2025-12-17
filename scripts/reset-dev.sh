#!/bin/bash
# Reset development databases (PostgreSQL + Redis) for fresh OAuth testing
# Usage: pnpm reset:dev

set -e

echo "🔄 Resetting development databases..."

# Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set. Loading from .env..."
  if [ -f .env ]; then
    export $(grep -E '^(DATABASE_URL|REDIS_URL)=' .env | xargs)
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is required"
  exit 1
fi

# Clear Redis
echo "🗑️  Clearing Redis cache..."
if [ -n "$REDIS_URL" ]; then
  redis-cli -u "$REDIS_URL" FLUSHALL > /dev/null 2>&1 && echo "   ✓ Redis cleared" || echo "   ⚠ Could not clear Redis"
else
  echo "   ⚠ REDIS_URL not set, skipping Redis"
fi

# Clear PostgreSQL tables (in correct order for foreign keys)
echo "🗑️  Clearing PostgreSQL tables..."
psql "$DATABASE_URL" <<EOF
-- Clear OAuth-related tables
DELETE FROM oauth_access_token;
DELETE FROM oauth_consent;
DELETE FROM oauth_application;

-- Clear auth tables
DELETE FROM session;
DELETE FROM verification;
DELETE FROM apikey;
DELETE FROM passkey;
DELETE FROM account;

-- Clear subscriptions
DELETE FROM subscription;

-- Clear users (must be last due to foreign keys)
DELETE FROM "user";

-- Clear JWKS (forces new key generation)
DELETE FROM jwks;
EOF

echo "   ✓ PostgreSQL cleared"

echo ""
echo "✅ Development databases reset!"
echo ""
echo "Next steps:"
echo "  1. Remove MCP server from ChatGPT"
echo "  2. Re-add with your ngrok URL"
echo "  3. Try connecting again"
