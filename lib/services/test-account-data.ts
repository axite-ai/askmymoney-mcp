/**
 * Static test data for OpenAI app review.
 *
 * When the Plaid service layer detects the sentinel access token
 * "test-static-token", it returns pre-built responses from this
 * file instead of calling the live Plaid API.
 *
 * All test data lives in this single file for easy maintenance.
 */

import type { AccountBase, CreditCardLiability } from "plaid";
import { APRAprTypeEnum, AccountType, AccountSubtype } from "plaid";

export const TEST_STATIC_TOKEN = "test-static-token";
export const TEST_ACCOUNT_EMAIL = "test@askmymoney.ai";

export function isTestToken(token: string): boolean {
  return token === TEST_STATIC_TOKEN;
}

// ---------------------------------------------------------------------------
// Account IDs (shared between static responses and seed script)
// ---------------------------------------------------------------------------
export const TEST_ACCOUNT_IDS = {
  checking: "test-acct-checking-001",
  savings: "test-acct-savings-001",
  credit: "test-acct-credit-001",
  investment: "test-acct-invest-001",
};

export const TEST_ITEM_ID = "test-item-001";

// ---------------------------------------------------------------------------
// Shared account objects (used by balances, investments, and liabilities)
// ---------------------------------------------------------------------------
const TEST_ACCOUNTS: Record<string, AccountBase> = {
  checking: {
    account_id: TEST_ACCOUNT_IDS.checking,
    balances: { available: 3892.41, current: 4250.75, iso_currency_code: "USD", limit: null, unofficial_currency_code: null },
    mask: "4521",
    name: "Checking - Primary",
    official_name: "Personal Checking Account",
    type: AccountType.Depository,
    subtype: AccountSubtype.Checking,
    persistent_account_id: "persistent-checking-001",
  },
  savings: {
    account_id: TEST_ACCOUNT_IDS.savings,
    balances: { available: 12500.0, current: 12500.0, iso_currency_code: "USD", limit: null, unofficial_currency_code: null },
    mask: "8834",
    name: "Savings - Emergency Fund",
    official_name: "High-Yield Savings",
    type: AccountType.Depository,
    subtype: AccountSubtype.Savings,
    persistent_account_id: "persistent-savings-001",
  },
  credit: {
    account_id: TEST_ACCOUNT_IDS.credit,
    balances: { available: 8152.68, current: 1847.32, iso_currency_code: "USD", limit: 10000, unofficial_currency_code: null },
    mask: "3019",
    name: "Chase Sapphire Preferred",
    official_name: "Sapphire Preferred Card",
    type: AccountType.Credit,
    subtype: AccountSubtype.CreditCard,
    persistent_account_id: "persistent-credit-001",
  },
  investment: {
    account_id: TEST_ACCOUNT_IDS.investment,
    balances: { available: null, current: 45230.0, iso_currency_code: "USD", limit: null, unofficial_currency_code: null },
    mask: "7762",
    name: "Fidelity 401(k)",
    official_name: "401(k) Retirement Account",
    type: AccountType.Investment,
    subtype: AccountSubtype._401k,
    persistent_account_id: "persistent-invest-001",
  },
};

// ---------------------------------------------------------------------------
// getAccountBalances() — returns shape matching Plaid AccountsGetResponse.data
// ---------------------------------------------------------------------------
export function getTestAccountBalances(): { accounts: AccountBase[]; item: any; request_id: string } {
  return {
    accounts: Object.values(TEST_ACCOUNTS),
    item: {
      item_id: TEST_ITEM_ID,
      institution_id: "ins_test_demo",
      available_products: [],
      billed_products: ["transactions", "auth", "identity", "investments", "liabilities"],
      error: null,
      consent_expiration_time: null,
      update_type: "background",
    },
    request_id: "test-request-id",
  };
}

// ---------------------------------------------------------------------------
// getInvestmentHoldings() — returns shape matching investmentsHoldingsGet
// ---------------------------------------------------------------------------
export function getTestInvestmentHoldings() {
  const securities = [
    {
      security_id: "sec-aapl",
      isin: "US0378331005",
      cusip: "037833100",
      ticker_symbol: "AAPL",
      name: "Apple Inc.",
      type: "equity",
      close_price: 189.84,
      close_price_as_of: new Date().toISOString().split("T")[0],
      iso_currency_code: "USD",
      unofficial_currency_code: null,
      is_cash_equivalent: false,
    },
    {
      security_id: "sec-vti",
      isin: "US9229087690",
      cusip: "922908769",
      ticker_symbol: "VTI",
      name: "Vanguard Total Stock Market ETF",
      type: "etf",
      close_price: 262.45,
      close_price_as_of: new Date().toISOString().split("T")[0],
      iso_currency_code: "USD",
      unofficial_currency_code: null,
      is_cash_equivalent: false,
    },
    {
      security_id: "sec-vxus",
      isin: "US9219097683",
      cusip: "921909768",
      ticker_symbol: "VXUS",
      name: "Vanguard Total International Stock ETF",
      type: "etf",
      close_price: 58.72,
      close_price_as_of: new Date().toISOString().split("T")[0],
      iso_currency_code: "USD",
      unofficial_currency_code: null,
      is_cash_equivalent: false,
    },
    {
      security_id: "sec-bnd",
      isin: "US9219378356",
      cusip: "921937835",
      ticker_symbol: "BND",
      name: "Vanguard Total Bond Market ETF",
      type: "etf",
      close_price: 72.31,
      close_price_as_of: new Date().toISOString().split("T")[0],
      iso_currency_code: "USD",
      unofficial_currency_code: null,
      is_cash_equivalent: false,
    },
  ];

  return {
    accounts: [TEST_ACCOUNTS.investment],
    holdings: [
      {
        account_id: TEST_ACCOUNT_IDS.investment,
        security_id: "sec-aapl",
        institution_price: 189.84,
        institution_price_as_of: new Date().toISOString().split("T")[0],
        institution_value: 9492.0,
        cost_basis: 7200.0,
        quantity: 50,
        iso_currency_code: "USD",
        unofficial_currency_code: null,
      },
      {
        account_id: TEST_ACCOUNT_IDS.investment,
        security_id: "sec-vti",
        institution_price: 262.45,
        institution_price_as_of: new Date().toISOString().split("T")[0],
        institution_value: 20996.0,
        cost_basis: 18000.0,
        quantity: 80,
        iso_currency_code: "USD",
        unofficial_currency_code: null,
      },
      {
        account_id: TEST_ACCOUNT_IDS.investment,
        security_id: "sec-vxus",
        institution_price: 58.72,
        institution_price_as_of: new Date().toISOString().split("T")[0],
        institution_value: 8808.0,
        cost_basis: 7500.0,
        quantity: 150,
        iso_currency_code: "USD",
        unofficial_currency_code: null,
      },
      {
        account_id: TEST_ACCOUNT_IDS.investment,
        security_id: "sec-bnd",
        institution_price: 72.31,
        institution_price_as_of: new Date().toISOString().split("T")[0],
        institution_value: 5934.0,
        cost_basis: 6000.0,
        quantity: 82,
        iso_currency_code: "USD",
        unofficial_currency_code: null,
      },
    ],
    securities,
  };
}

// ---------------------------------------------------------------------------
// getLiabilities() — returns shape matching liabilitiesGet
// ---------------------------------------------------------------------------
export function getTestLiabilities(): { accounts: AccountBase[]; liabilities: { credit: CreditCardLiability[]; mortgage: null; student: null } } {
  return {
    accounts: [TEST_ACCOUNTS.credit],
    liabilities: {
      credit: [
        {
          account_id: TEST_ACCOUNT_IDS.credit,
          aprs: [
            {
              apr_percentage: 21.49,
              apr_type: APRAprTypeEnum.PurchaseApr,
              balance_subject_to_apr: 1847.32,
              interest_charge_amount: 33.1,
            },
          ],
          is_overdue: false,
          last_payment_amount: 250.0,
          last_payment_date: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 15);
            return d.toISOString().split("T")[0];
          })(),
          last_statement_balance: 2100.0,
          last_statement_issue_date: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 25);
            return d.toISOString().split("T")[0];
          })(),
          minimum_payment_amount: 35.0,
          next_payment_due_date: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 5);
            return d.toISOString().split("T")[0];
          })(),
        },
      ],
      mortgage: null,
      student: null,
    },
  };
}

// ---------------------------------------------------------------------------
// getRecurringTransactions() — returns shape matching transactionsRecurringGet
// ---------------------------------------------------------------------------
export function getTestRecurringTransactions() {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  function nextDate(dayOfMonth: number): string {
    const d = new Date();
    d.setDate(dayOfMonth);
    if (d < today) d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  }

  return {
    inflowStreams: [
      {
        stream_id: "recur-inflow-001",
        account_id: TEST_ACCOUNT_IDS.checking,
        description: "Direct Deposit - Employer",
        merchant_name: "ACME Corp",
        first_date: "2025-01-15",
        last_date: lastMonth.toISOString().split("T")[0],
        frequency: "BIWEEKLY",
        average_amount: { amount: -3200.0, iso_currency_code: "USD", unofficial_currency_code: null },
        last_amount: { amount: -3200.0, iso_currency_code: "USD", unofficial_currency_code: null },
        is_active: true,
        status: "MATURE",
        personal_finance_category: { primary: "INCOME", detailed: "INCOME_WAGES", confidence_level: "VERY_HIGH" },
      },
    ],
    outflowStreams: [
      {
        stream_id: "recur-outflow-001",
        account_id: TEST_ACCOUNT_IDS.checking,
        description: "Rent Payment",
        merchant_name: "Parkview Apartments",
        first_date: "2025-01-01",
        last_date: lastMonth.toISOString().split("T")[0],
        frequency: "MONTHLY",
        average_amount: { amount: 1450.0, iso_currency_code: "USD", unofficial_currency_code: null },
        last_amount: { amount: 1450.0, iso_currency_code: "USD", unofficial_currency_code: null },
        is_active: true,
        status: "MATURE",
        personal_finance_category: { primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_RENT", confidence_level: "VERY_HIGH" },
      },
      {
        stream_id: "recur-outflow-002",
        account_id: TEST_ACCOUNT_IDS.credit,
        description: "Netflix",
        merchant_name: "Netflix",
        first_date: "2025-02-12",
        last_date: lastMonth.toISOString().split("T")[0],
        frequency: "MONTHLY",
        average_amount: { amount: 15.49, iso_currency_code: "USD", unofficial_currency_code: null },
        last_amount: { amount: 15.49, iso_currency_code: "USD", unofficial_currency_code: null },
        is_active: true,
        status: "MATURE",
        personal_finance_category: { primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_TV_AND_MOVIES", confidence_level: "VERY_HIGH" },
      },
      {
        stream_id: "recur-outflow-003",
        account_id: TEST_ACCOUNT_IDS.credit,
        description: "Spotify Premium",
        merchant_name: "Spotify",
        first_date: "2025-03-05",
        last_date: lastMonth.toISOString().split("T")[0],
        frequency: "MONTHLY",
        average_amount: { amount: 10.99, iso_currency_code: "USD", unofficial_currency_code: null },
        last_amount: { amount: 10.99, iso_currency_code: "USD", unofficial_currency_code: null },
        is_active: true,
        status: "MATURE",
        personal_finance_category: { primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_MUSIC_AND_AUDIO", confidence_level: "VERY_HIGH" },
      },
      {
        stream_id: "recur-outflow-004",
        account_id: TEST_ACCOUNT_IDS.checking,
        description: "Electric Bill",
        merchant_name: "DTE Energy",
        first_date: "2025-01-18",
        last_date: lastMonth.toISOString().split("T")[0],
        frequency: "MONTHLY",
        average_amount: { amount: 127.5, iso_currency_code: "USD", unofficial_currency_code: null },
        last_amount: { amount: 134.22, iso_currency_code: "USD", unofficial_currency_code: null },
        is_active: true,
        status: "MATURE",
        personal_finance_category: { primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY", confidence_level: "VERY_HIGH" },
      },
      {
        stream_id: "recur-outflow-005",
        account_id: TEST_ACCOUNT_IDS.checking,
        description: "Internet Service",
        merchant_name: "Comcast",
        first_date: "2025-01-22",
        last_date: lastMonth.toISOString().split("T")[0],
        frequency: "MONTHLY",
        average_amount: { amount: 79.99, iso_currency_code: "USD", unofficial_currency_code: null },
        last_amount: { amount: 79.99, iso_currency_code: "USD", unofficial_currency_code: null },
        is_active: true,
        status: "MATURE",
        personal_finance_category: { primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_INTERNET_AND_CABLE", confidence_level: "VERY_HIGH" },
      },
      {
        stream_id: "recur-outflow-006",
        account_id: TEST_ACCOUNT_IDS.credit,
        description: "AWS Services",
        merchant_name: "Amazon Web Services",
        first_date: "2025-02-01",
        last_date: lastMonth.toISOString().split("T")[0],
        frequency: "MONTHLY",
        average_amount: { amount: 23.47, iso_currency_code: "USD", unofficial_currency_code: null },
        last_amount: { amount: 25.12, iso_currency_code: "USD", unofficial_currency_code: null },
        is_active: true,
        status: "MATURE",
        personal_finance_category: { primary: "GENERAL_SERVICES", detailed: "GENERAL_SERVICES_OTHER_GENERAL_SERVICES", confidence_level: "HIGH" },
      },
    ],
  };
}
