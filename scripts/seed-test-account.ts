/**
 * Seed Test Account for OpenAI App Review
 *
 * Creates a test account with Plaid sandbox data so OpenAI reviewers
 * can test the app with username/password credentials.
 *
 * Usage: pnpm seed:test
 *
 * Required env vars:
 *   TEST_ACCOUNT_PASSWORD - Password for the test account
 *   PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV=sandbox
 *   DATABASE_URL, ENCRYPTION_KEY, BETTER_AUTH_SECRET
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, passkey, plaidAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlaidClient } from "@/lib/config/plaid";
import { UserService } from "@/lib/services/user-service";
import { syncTransactionsForItem } from "@/lib/services/plaid-service";
import { Products, CountryCode } from "plaid";
import { createId } from "@paralleldrive/cuid2";

const TEST_EMAIL = process.env.TEST_ACCOUNT_EMAIL || "test@askmymoney.ai";
const TEST_USERNAME = "test_user";
const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD;
const TEST_NAME = "Test User";

// Plaid sandbox institution: First Platypus Bank
const SANDBOX_INSTITUTION_ID = "ins_109508";

async function main() {
  if (!TEST_PASSWORD) {
    console.error("ERROR: TEST_ACCOUNT_PASSWORD env var is required");
    process.exit(1);
  }

  console.log("🔧 Seeding test account...\n");

  // Step 1: Create or find the test user
  console.log("1. Creating test user...");
  let userId: string;

  const existingUser = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, TEST_EMAIL))
    .limit(1);

  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    console.log(`   User already exists: ${userId}`);
  } else {
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: TEST_EMAIL,
          name: TEST_NAME,
          password: TEST_PASSWORD,
          username: TEST_USERNAME,
        },
      });
      userId = result.user.id;
      console.log(`   Created user: ${userId}`);
    } catch (error: any) {
      // If sign-up fails (e.g., user exists without username), try direct DB approach
      console.log(`   Sign-up failed: ${error.message}. Trying direct approach...`);
      const users = await db.select().from(userTable).where(eq(userTable.email, TEST_EMAIL)).limit(1);
      if (users.length > 0) {
        userId = users[0].id;
      } else {
        throw error;
      }
    }
  }

  // Step 2: Insert a dummy passkey record (satisfies security check)
  console.log("2. Setting up passkey bypass...");
  const existingPasskey = await db
    .select()
    .from(passkey)
    .where(eq(passkey.userId, userId))
    .limit(1);

  if (existingPasskey.length > 0) {
    console.log("   Passkey record already exists");
  } else {
    await db.insert(passkey).values({
      id: createId(),
      name: "Test Passkey",
      publicKey: "test-public-key-for-review-account",
      userId,
      credentialID: `test-credential-${createId()}`,
      counter: 0,
      deviceType: "singleDevice",
      backedUp: false,
      createdAt: new Date(),
    });
    console.log("   Inserted dummy passkey record");
  }

  // Step 3: Connect Plaid sandbox institution
  console.log("3. Connecting Plaid sandbox bank...");
  const existingItems = await UserService.getUserPlaidItems(userId);

  if (existingItems.length > 0) {
    console.log(`   Already has ${existingItems.length} connected item(s)`);
  } else {
    const plaidClient = getPlaidClient();

    // Create a sandbox public token
    const { data: tokenData } = await plaidClient.sandboxPublicTokenCreate({
      institution_id: SANDBOX_INSTITUTION_ID,
      initial_products: [
        Products.Transactions,
        Products.Auth,
        Products.Identity,
        Products.Investments,
        Products.Liabilities,
      ],
    });

    console.log(`   Created sandbox public token for ${SANDBOX_INSTITUTION_ID}`);

    // Exchange for access token
    const { data: exchangeData } = await plaidClient.itemPublicTokenExchange({
      public_token: tokenData.public_token,
    });

    const { access_token: accessToken, item_id: itemId } = exchangeData;
    console.log(`   Exchanged for access token (item: ${itemId})`);

    // Save the item
    await UserService.savePlaidItem(
      userId,
      itemId,
      accessToken,
      SANDBOX_INSTITUTION_ID,
      "First Platypus Bank",
      null
    );
    console.log("   Saved Plaid item to database");

    // Fetch and save accounts
    const { data: accountsData } = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    for (const account of accountsData.accounts) {
      await db
        .insert(plaidAccounts)
        .values({
          itemId,
          userId,
          accountId: account.account_id,
          name: account.name,
          officialName: account.official_name || null,
          mask: account.mask || null,
          type: account.type,
          subtype: account.subtype || null,
          currentBalance: account.balances.current?.toString() || null,
          availableBalance: account.balances.available?.toString() || null,
          isoCurrencyCode: account.balances.iso_currency_code || "USD",
        })
        .onConflictDoNothing();
    }
    console.log(`   Saved ${accountsData.accounts.length} accounts`);

    // Sync transactions
    console.log("4. Syncing transactions...");
    await syncTransactionsForItem(itemId);
    console.log("   Transactions synced");
  }

  console.log("\n✅ Test account ready!");
  console.log(`   Username: ${TEST_USERNAME}`);
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log("   Password: (from TEST_ACCOUNT_PASSWORD env var)");

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
