/**
 * Seed Test Account for OpenAI App Review
 *
 * Creates a test account with static financial data so OpenAI reviewers
 * can test the app with username/password credentials.
 *
 * No Plaid API calls — all data is inserted directly into the database.
 *
 * Usage: TEST_ACCOUNT_PASSWORD=xxx pnpm seed:test
 *
 * Required env vars:
 *   TEST_ACCOUNT_PASSWORD - Password for the test account
 *   DATABASE_URL, ENCRYPTION_KEY, BETTER_AUTH_SECRET
 */

import "dotenv/config";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  user as userTable,
  passkey,
  plaidItems,
  plaidAccounts,
  plaidTransactions,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EncryptionService } from "@/lib/services/encryption-service";
import { createId } from "@paralleldrive/cuid2";
import {
  TEST_STATIC_TOKEN,
  TEST_ITEM_ID,
  TEST_ACCOUNT_IDS,
  TEST_ACCOUNT_EMAIL,
} from "@/lib/services/test-account-data";

const TEST_EMAIL = process.env.TEST_ACCOUNT_EMAIL || TEST_ACCOUNT_EMAIL;
const TEST_USERNAME = "test_user";
const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD;
const TEST_NAME = "Test User";

// ---------------------------------------------------------------------------
// Transaction generation helpers
// ---------------------------------------------------------------------------
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

interface TxTemplate {
  merchantName: string;
  name: string;
  amount: string; // positive = expense, negative = income
  categoryPrimary: string;
  categoryDetailed: string;
  paymentChannel: "online" | "in store" | "other";
  accountId: string;
}

const recurringTx: (TxTemplate & { dayOfMonth: number })[] = [
  { merchantName: "Parkview Apartments", name: "Rent Payment", amount: "1450.00", categoryPrimary: "RENT_AND_UTILITIES", categoryDetailed: "RENT_AND_UTILITIES_RENT", paymentChannel: "other", accountId: TEST_ACCOUNT_IDS.checking, dayOfMonth: 1 },
  { merchantName: "DTE Energy", name: "Electric Bill", amount: "134.22", categoryPrimary: "RENT_AND_UTILITIES", categoryDetailed: "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.checking, dayOfMonth: 18 },
  { merchantName: "Comcast", name: "Internet Service", amount: "79.99", categoryPrimary: "RENT_AND_UTILITIES", categoryDetailed: "RENT_AND_UTILITIES_INTERNET_AND_CABLE", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.checking, dayOfMonth: 22 },
  { merchantName: "Netflix", name: "Netflix", amount: "15.49", categoryPrimary: "ENTERTAINMENT", categoryDetailed: "ENTERTAINMENT_TV_AND_MOVIES", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.credit, dayOfMonth: 12 },
  { merchantName: "Spotify", name: "Spotify Premium", amount: "10.99", categoryPrimary: "ENTERTAINMENT", categoryDetailed: "ENTERTAINMENT_MUSIC_AND_AUDIO", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.credit, dayOfMonth: 5 },
  { merchantName: "Amazon Web Services", name: "AWS Services", amount: "25.12", categoryPrimary: "GENERAL_SERVICES", categoryDetailed: "GENERAL_SERVICES_OTHER_GENERAL_SERVICES", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.credit, dayOfMonth: 1 },
  { merchantName: "ACME Corp", name: "Direct Deposit - Payroll", amount: "-3200.00", categoryPrimary: "INCOME", categoryDetailed: "INCOME_WAGES", paymentChannel: "other", accountId: TEST_ACCOUNT_IDS.checking, dayOfMonth: 15 },
];

const oneOffTx: (TxTemplate & { daysAgo: number })[] = [
  // Groceries
  { merchantName: "Whole Foods", name: "Whole Foods Market", amount: "87.34", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_GROCERIES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 2 },
  { merchantName: "Trader Joe's", name: "Trader Joe's", amount: "52.18", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_GROCERIES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 9 },
  { merchantName: "Kroger", name: "Kroger", amount: "63.42", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_GROCERIES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 16 },
  { merchantName: "Whole Foods", name: "Whole Foods Market", amount: "94.11", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_GROCERIES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 23 },
  { merchantName: "Trader Joe's", name: "Trader Joe's", amount: "41.56", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_GROCERIES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 30 },
  { merchantName: "Kroger", name: "Kroger", amount: "78.93", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_GROCERIES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 37 },
  { merchantName: "Whole Foods", name: "Whole Foods Market", amount: "55.27", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_GROCERIES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 44 },
  { merchantName: "Trader Joe's", name: "Trader Joe's", amount: "67.89", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_GROCERIES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 51 },
  // Restaurants
  { merchantName: "Chipotle", name: "Chipotle Mexican Grill", amount: "14.25", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_RESTAURANT", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 1 },
  { merchantName: "Starbucks", name: "Starbucks", amount: "6.45", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_COFFEE", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 3 },
  { merchantName: "Panera Bread", name: "Panera Bread", amount: "12.89", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_RESTAURANT", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 7 },
  { merchantName: "Starbucks", name: "Starbucks", amount: "5.75", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_COFFEE", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 10 },
  { merchantName: "Chipotle", name: "Chipotle Mexican Grill", amount: "15.50", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_RESTAURANT", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 14 },
  { merchantName: "Domino's", name: "Domino's Pizza", amount: "22.47", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_RESTAURANT", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 20 },
  { merchantName: "Starbucks", name: "Starbucks", amount: "7.20", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_COFFEE", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 25 },
  // Transportation
  { merchantName: "Shell", name: "Shell Oil", amount: "45.80", categoryPrimary: "TRANSPORTATION", categoryDetailed: "TRANSPORTATION_GAS", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.checking, daysAgo: 5 },
  { merchantName: "Shell", name: "Shell Oil", amount: "42.15", categoryPrimary: "TRANSPORTATION", categoryDetailed: "TRANSPORTATION_GAS", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.checking, daysAgo: 19 },
  { merchantName: "Uber", name: "Uber Trip", amount: "18.42", categoryPrimary: "TRANSPORTATION", categoryDetailed: "TRANSPORTATION_TAXIS_AND_RIDE_SHARES", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 11 },
  // Shopping
  { merchantName: "Amazon", name: "Amazon.com", amount: "34.99", categoryPrimary: "GENERAL_MERCHANDISE", categoryDetailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 4 },
  { merchantName: "Target", name: "Target", amount: "56.32", categoryPrimary: "GENERAL_MERCHANDISE", categoryDetailed: "GENERAL_MERCHANDISE_DEPARTMENT_STORES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 12 },
  { merchantName: "Amazon", name: "Amazon.com", amount: "19.99", categoryPrimary: "GENERAL_MERCHANDISE", categoryDetailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 28 },
  // Health
  { merchantName: "CVS Pharmacy", name: "CVS Pharmacy", amount: "23.45", categoryPrimary: "MEDICAL", categoryDetailed: "MEDICAL_PHARMACIES_AND_SUPPLEMENTS", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 8 },
  { merchantName: "Planet Fitness", name: "Planet Fitness", amount: "24.99", categoryPrimary: "PERSONAL_CARE", categoryDetailed: "PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.checking, daysAgo: 6 },
  // Transfers
  { merchantName: null as unknown as string, name: "Transfer to Savings", amount: "500.00", categoryPrimary: "TRANSFER_OUT", categoryDetailed: "TRANSFER_OUT_SAVINGS", paymentChannel: "other", accountId: TEST_ACCOUNT_IDS.checking, daysAgo: 15 },
  { merchantName: null as unknown as string, name: "Transfer from Checking", amount: "-500.00", categoryPrimary: "TRANSFER_IN", categoryDetailed: "TRANSFER_IN_SAVINGS", paymentChannel: "other", accountId: TEST_ACCOUNT_IDS.savings, daysAgo: 15 },
  // Second payroll
  { merchantName: "ACME Corp", name: "Direct Deposit - Payroll", amount: "-3200.00", categoryPrimary: "INCOME", categoryDetailed: "INCOME_WAGES", paymentChannel: "other", accountId: TEST_ACCOUNT_IDS.checking, daysAgo: 45 },
  // More groceries/restaurants in older period
  { merchantName: "Whole Foods", name: "Whole Foods Market", amount: "71.23", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_GROCERIES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 58 },
  { merchantName: "Chipotle", name: "Chipotle Mexican Grill", amount: "13.80", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_RESTAURANT", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 62 },
  { merchantName: "Target", name: "Target", amount: "42.18", categoryPrimary: "GENERAL_MERCHANDISE", categoryDetailed: "GENERAL_MERCHANDISE_DEPARTMENT_STORES", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 70 },
  { merchantName: "Shell", name: "Shell Oil", amount: "39.50", categoryPrimary: "TRANSPORTATION", categoryDetailed: "TRANSPORTATION_GAS", paymentChannel: "in store", accountId: TEST_ACCOUNT_IDS.checking, daysAgo: 33 },
  // Pending transaction
  { merchantName: "Amazon", name: "Amazon.com - Pending", amount: "47.99", categoryPrimary: "GENERAL_MERCHANDISE", categoryDetailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", paymentChannel: "online", accountId: TEST_ACCOUNT_IDS.credit, daysAgo: 0 },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!TEST_PASSWORD) {
    console.error("ERROR: TEST_ACCOUNT_PASSWORD env var is required");
    process.exit(1);
  }

  console.log("Seeding test account...\n");

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
      console.log(`   Sign-up failed: ${error.message}. Checking DB...`);
      const users = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, TEST_EMAIL))
        .limit(1);
      if (users.length > 0) {
        userId = users[0].id;
      } else {
        throw error;
      }
    }
  }

  // Step 2: Insert a dummy passkey record
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

  // Step 3: Insert plaidItems with the sentinel access token
  console.log("3. Creating Plaid item with static token...");
  const existingItem = await db.query.plaidItems.findFirst({
    where: eq(plaidItems.itemId, TEST_ITEM_ID),
  });

  if (existingItem) {
    console.log(`   Item already exists: ${TEST_ITEM_ID}`);
  } else {
    await db.insert(plaidItems).values({
      userId,
      itemId: TEST_ITEM_ID,
      accessToken: EncryptionService.encrypt(TEST_STATIC_TOKEN),
      institutionId: "ins_test_demo",
      institutionName: "Demo National Bank",
      status: "active",
    });
    console.log(`   Inserted item: ${TEST_ITEM_ID}`);
  }

  // Step 4: Insert plaidAccounts
  console.log("4. Seeding accounts...");
  const accountRows = [
    {
      accountId: TEST_ACCOUNT_IDS.checking,
      itemId: TEST_ITEM_ID,
      userId,
      name: "Checking - Primary",
      mask: "4521",
      officialName: "Personal Checking Account",
      currentBalance: "4250.75",
      availableBalance: "3892.41",
      isoCurrencyCode: "USD",
      type: "depository",
      subtype: "checking",
    },
    {
      accountId: TEST_ACCOUNT_IDS.savings,
      itemId: TEST_ITEM_ID,
      userId,
      name: "Savings - Emergency Fund",
      mask: "8834",
      officialName: "High-Yield Savings",
      currentBalance: "12500.00",
      availableBalance: "12500.00",
      isoCurrencyCode: "USD",
      type: "depository",
      subtype: "savings",
    },
    {
      accountId: TEST_ACCOUNT_IDS.credit,
      itemId: TEST_ITEM_ID,
      userId,
      name: "Chase Sapphire Preferred",
      mask: "3019",
      officialName: "Sapphire Preferred Card",
      currentBalance: "1847.32",
      availableBalance: "8152.68",
      isoCurrencyCode: "USD",
      type: "credit",
      subtype: "credit card",
    },
    {
      accountId: TEST_ACCOUNT_IDS.investment,
      itemId: TEST_ITEM_ID,
      userId,
      name: "Fidelity 401(k)",
      mask: "7762",
      officialName: "401(k) Retirement Account",
      currentBalance: "45230.00",
      availableBalance: null,
      isoCurrencyCode: "USD",
      type: "investment",
      subtype: "401k",
    },
  ];

  for (const acct of accountRows) {
    await db
      .insert(plaidAccounts)
      .values(acct)
      .onConflictDoNothing();
  }
  console.log(`   Seeded ${accountRows.length} accounts`);

  // Step 5: Insert plaidTransactions
  console.log("5. Seeding transactions...");
  let txCount = 0;

  // Recurring transactions (generate for last 3 months)
  for (const tx of recurringTx) {
    for (let monthsAgo = 0; monthsAgo < 3; monthsAgo++) {
      const d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      d.setDate(tx.dayOfMonth);
      d.setHours(12, 0, 0, 0);

      // Skip future dates
      if (d > new Date()) continue;

      const txId = `test-tx-${tx.merchantName?.replace(/\s/g, "-").toLowerCase() || "transfer"}-${monthsAgo}-${tx.dayOfMonth}`;
      await db
        .insert(plaidTransactions)
        .values({
          transactionId: txId,
          accountId: tx.accountId,
          userId,
          amount: tx.amount,
          isoCurrencyCode: "USD",
          categoryPrimary: tx.categoryPrimary,
          categoryDetailed: tx.categoryDetailed,
          categoryConfidence: "VERY_HIGH",
          date: d,
          merchantName: tx.merchantName || null,
          paymentChannel: tx.paymentChannel,
          pending: false,
          name: tx.name,
        })
        .onConflictDoNothing();
      txCount++;
    }
  }

  // One-off transactions
  for (const tx of oneOffTx) {
    const d = daysAgo(tx.daysAgo);
    const isPending = tx.daysAgo === 0;
    const txId = `test-tx-oneoff-${tx.merchantName?.replace(/\s/g, "-").toLowerCase() || "transfer"}-${tx.daysAgo}`;

    await db
      .insert(plaidTransactions)
      .values({
        transactionId: txId,
        accountId: tx.accountId,
        userId,
        amount: tx.amount,
        isoCurrencyCode: "USD",
        categoryPrimary: tx.categoryPrimary,
        categoryDetailed: tx.categoryDetailed,
        categoryConfidence: "HIGH",
        date: d,
        merchantName: tx.merchantName || null,
        paymentChannel: tx.paymentChannel,
        pending: isPending,
        name: tx.name,
      })
      .onConflictDoNothing();
    txCount++;
  }

  console.log(`   Seeded ${txCount} transactions`);

  console.log("\nTest account ready!");
  console.log(`   Username: ${TEST_USERNAME}`);
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log("   Password: (from TEST_ACCOUNT_PASSWORD env var)");

  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
