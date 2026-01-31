/**
 * Type definitions for AskMyMoney tool-specific structured content
 */

import type { AccountBase, Transaction } from "plaid";
import type { MCPToolResponse, OpenAIResponseMetadata } from "./mcp-responses";
import { z } from "zod";

// ============================================================================
// COMMON AUTH/ERROR TYPES
// ============================================================================

/**
 * Common Auth Challenge Content
 * Used when a tool requires authentication or subscription
 */
export interface AuthChallengeContent {
  message: string;
  featureName?: string;
  error_message?: string;
  pricingUrl?: string;
  baseUrl?: string;
  setupUrl?: string;
}

/**
 * Auth Challenge Response Type
 * Returned by requireAuth() helper and auth response builders
 */
export type AuthChallengeResponse = MCPToolResponse<AuthChallengeContent, OpenAIResponseMetadata>;

/**
 * Common Auth/Error Response Schema
 * Used when a tool requires authentication, subscription, or bank connection
 */
export const AuthResponseSchema = z.union([
  // Login prompt
  z.object({
    message: z.string(),
  }),
  // Subscription required
  z.object({
    featureName: z.string(),
    error_message: z.string(),
    pricingUrl: z.string(),
  }),
  // Plaid required
  z.object({
    baseUrl: z.string(),
    message: z.string(),
  }),
]);

// ============================================================================
// HELLO WORLD EXAMPLE
// ============================================================================

/**
 * Hello World Widget Content
 * Example widget showing basic MCP integration
 */
export interface HelloWorldContent {
  greeting: string;
  name: string;
  timestamp: string;
}

export type HelloWorldResponse = MCPToolResponse<HelloWorldContent, OpenAIResponseMetadata>;

/**
 * Structured content for account balances
 */
export interface AccountBalancesContent {
  accounts: AccountBase[];
  totalBalance: number;
  lastUpdated: string;
}

/**
 * Structured content for transactions
 */
export interface TransactionsContent {
  transactions: Transaction[];
  totalTransactions: number;
  displayedTransactions: number;
  dateRange: {
    start: string;
    end: string;
  };
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
    nextOffset: number | null;
  };
  metadata?: {
    categoryBreakdown: Array<{
      category: string;
      count: number;
      total: number;
    }>;
    topMerchants: Array<{
      merchantId: string;
      name: string;
      count: number;
      total: number;
    }>;
    summary: {
      totalSpending: number;
      totalIncome: number;
      netCashFlow: number;
      pendingCount: number;
      averageTransaction: number;
    };
  };
}

export const TransactionsSchema = z.union([
  z.object({
    transactions: z.array(z.any()),
    totalTransactions: z.number().int(),
    displayedTransactions: z.number().int(),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }),
    pagination: z
      .object({
        limit: z.number().int(),
        offset: z.number().int(),
        hasMore: z.boolean(),
        nextOffset: z.number().int().nullable(),
      })
      .optional(),
    metadata: z
      .object({
        categoryBreakdown: z.array(
          z.object({
            category: z.string(),
            count: z.number().int(),
            total: z.number(),
          })
        ),
        topMerchants: z.array(
          z.object({
            merchantId: z.string(),
            name: z.string(),
            count: z.number().int(),
            total: z.number(),
          })
        ),
        summary: z.object({
          totalSpending: z.number(),
          totalIncome: z.number(),
          netCashFlow: z.number(),
          pendingCount: z.number().int(),
          averageTransaction: z.number(),
        }),
      })
      .optional(),
  }),
  AuthResponseSchema,
]);

/**
 * Structured content for spending insights
 */
export interface SpendingInsightsContent {
  categories: Array<{
    name: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  totalSpending: number;
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Structured content for account health check
 */
export interface AccountHealthContent {
  accounts: Array<{
    accountId: string;
    accountName: string;
    accountType: string;
    balance: number;
    available: number;
    status: "healthy" | "attention_needed";
    warnings: string[];
  }>;
  overallStatus: "healthy" | "attention_needed";
  summary: {
    totalAccounts: number;
    accountsWithWarnings: number;
    totalBalance: number;
  };
}

export const AccountHealthSchema = z.union([
  z.object({
    accounts: z.array(
      z.object({
        accountId: z.string(),
        accountName: z.string(),
        accountType: z.string(),
        balance: z.number(),
        available: z.number(),
        status: z.enum(["healthy", "attention_needed"]),
        warnings: z.array(z.string()),
      })
    ),
    overallStatus: z.enum(["healthy", "attention_needed"]),
    summary: z.object({
      totalAccounts: z.number().int(),
      accountsWithWarnings: z.number().int(),
      totalBalance: z.number(),
    }),
  }),
  AuthResponseSchema,
]);

/**
 * Structured content for subscription/Plaid required errors
 */
export interface RequiredFeatureContent {
  featureName: string;
  error_message: string;
  pricingUrl: string;
  userId: string | undefined;
}

/**
 * Structured content for financial tips
 */
export interface FinancialTipsContent {
  topic: string;
  tips: Array<{
    title: string;
    description: string;
    category: string;
  }>;
  resources: string[];
}

export const FinancialTipsSchema = z.object({
  topic: z.string(),
  tips: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
    })
  ),
  resources: z.array(z.string()),
});

/**
 * Structured content for budget calculation
 */
export interface BudgetCalculationContent {
  monthlyIncome: number;
  needs: {
    amount: number;
    percentage: number;
  };
  wants: {
    amount: number;
    percentage: number;
  };
  savings: {
    amount: number;
    percentage: number;
  };
  debtPayment?: {
    amount: number;
    percentage: number;
  };
  recommendations: string[];
}

export const BudgetCalculationSchema = z.object({
  monthlyIncome: z.number(),
  needs: z.object({
    amount: z.number(),
    percentage: z.number(),
  }),
  wants: z.object({
    amount: z.number(),
    percentage: z.number(),
  }),
  savings: z.object({
    amount: z.number(),
    percentage: z.number(),
  }),
  debtPayment: z
    .object({
      amount: z.number(),
      percentage: z.number(),
    })
    .optional(),
  recommendations: z.array(z.string()),
});

/**
 * Simple message content for acknowledgments
 */
export interface MessageContent {
  message: string;
}

/**
 * Structured content for subscription management
 */
export interface SubscriptionManagementContent {
  billingPortalUrl: string;
  currentPlan?: string;
  message: string;
}

export const SubscriptionManagementSchema = z.object({
  billingPortalUrl: z.string(),
  currentPlan: z.string().optional(),
  message: z.string(),
});

/**
 * Structured content for investment holdings
 */
export interface InvestmentHoldingsContent {
  accounts: Array<{
    account_id: string;
    name: string;
    type: string;
    subtype: string;
    mask: string | null;
    balances: {
      current: number | null;
      available: number | null;
      iso_currency_code: string;
    };
  }>;
  holdings: Array<{
    account_id: string;
    security_id: string;
    cost_basis: number | null;
    institution_price: number;
    institution_price_as_of: string | null;
    institution_value: number;
    iso_currency_code: string;
    quantity: number;
    unofficial_currency_code: string | null;
  }>;
  securities: Array<{
    security_id: string;
    isin: string | null;
    cusip: string | null;
    sedol: string | null;
    institution_security_id: string | null;
    institution_id: string | null;
    proxy_security_id: string | null;
    name: string;
    ticker_symbol: string | null;
    is_cash_equivalent: boolean;
    type: string;
    close_price: number | null;
    close_price_as_of: string | null;
    iso_currency_code: string;
    unofficial_currency_code: string | null;
  }>;
  totalValue: number;
  lastUpdated: string;
}

/**
 * Structured content for liabilities (credit cards, loans, mortgages)
 */
export interface LiabilitiesContent {
  accounts: Array<{
    account_id: string;
    name: string;
    official_name: string | null;
    type: string;
    subtype: string;
    mask: string | null;
    balances: {
      current: number | null;
      available: number | null;
      limit: number | null;
      iso_currency_code: string;
    };
  }>;
  credit: Array<{
    account_id: string;
    aprs: Array<{
      apr_percentage: number;
      apr_type: string;
      balance_subject_to_apr: number | null;
      interest_charge_amount: number | null;
    }>;
    is_overdue: boolean | null;
    last_payment_amount: number | null;
    last_payment_date: string | null;
    last_statement_issue_date: string | null;
    last_statement_balance: number | null;
    minimum_payment_amount: number | null;
    next_payment_due_date: string | null;
  }>;
  student: Array<{
    account_id: string;
    account_number: string | null;
    disbursement_dates: string[] | null;
    expected_payoff_date: string | null;
    guarantor: string | null;
    interest_rate_percentage: number;
    is_overdue: boolean | null;
    last_payment_amount: number | null;
    last_payment_date: string | null;
    last_statement_issue_date: string | null;
    loan_name: string | null;
    loan_status: {
      end_date: string | null;
      type: string | null;
    };
    minimum_payment_amount: number | null;
    next_payment_due_date: string | null;
    origination_date: string | null;
    origination_principal_amount: number | null;
    outstanding_interest_amount: number | null;
    payment_reference_number: string | null;
    pslf_status: {
      estimated_eligibility_date: string | null;
      payments_made: number | null;
      payments_remaining: number | null;
    } | null;
    repayment_plan: {
      description: string | null;
      type: string | null;
    };
    sequence_number: string | null;
    servicer_address: {
      city: string | null;
      country: string | null;
      postal_code: string | null;
      region: string | null;
      street: string | null;
    };
    ytd_interest_paid: number | null;
    ytd_principal_paid: number | null;
  }>;
  mortgage: Array<{
    account_id: string;
    account_number: string | null;
    current_late_fee: number | null;
    escrow_balance: number | null;
    has_pmi: boolean | null;
    has_prepayment_penalty: boolean | null;
    interest_rate: {
      percentage: number | null;
      type: string | null;
    };
    last_payment_amount: number | null;
    last_payment_date: string | null;
    loan_type_description: string | null;
    loan_term: string | null;
    maturity_date: string | null;
    next_monthly_payment: number | null;
    next_payment_due_date: string | null;
    origination_date: string | null;
    origination_principal_amount: number | null;
    past_due_amount: number | null;
    property_address: {
      city: string | null;
      country: string | null;
      postal_code: string | null;
      region: string | null;
      street: string | null;
    };
    ytd_interest_paid: number | null;
    ytd_principal_paid: number | null;
  }>;
  summary: {
    totalDebt: number;
    totalMinimumPayment: number;
    accountsOverdue: number;
    nextPaymentDue: string | null;
  };
  lastUpdated: string;
}

export const LiabilitiesSchema = z.union([
  z.object({
    accounts: z.array(z.any()).optional(),
    credit: z.array(z.any()).optional(),
    student: z.array(z.any()).optional(),
    mortgage: z.array(z.any()).optional(),
    summary: z.object({
      totalDebt: z.number(),
      totalMinimumPayment: z.number(),
      accountsOverdue: z.number().int(),
      nextPaymentDue: z.string().nullable(),
    }),
    lastUpdated: z.string(),
  }),
  AuthResponseSchema,
]);

/**
 * Type-safe response helpers for each tool
 */
export type AccountBalancesResponse = MCPToolResponse<
  AccountBalancesContent,
  OpenAIResponseMetadata
>;

export type TransactionsResponse = MCPToolResponse<
  TransactionsContent,
  OpenAIResponseMetadata
>;

export type SpendingInsightsResponse = MCPToolResponse<
  SpendingInsightsContent,
  OpenAIResponseMetadata
>;

export type AccountHealthResponse = MCPToolResponse<
  AccountHealthContent,
  OpenAIResponseMetadata
>;

export type RequiredFeatureResponse = MCPToolResponse<
  RequiredFeatureContent,
  OpenAIResponseMetadata
>;

export type FinancialTipsResponse = MCPToolResponse<
  FinancialTipsContent,
  OpenAIResponseMetadata
>;

export type BudgetCalculationResponse = MCPToolResponse<
  BudgetCalculationContent,
  OpenAIResponseMetadata
>;

export type MessageResponse = MCPToolResponse<
  MessageContent,
  OpenAIResponseMetadata
>;

export type SubscriptionManagementResponse = MCPToolResponse<
  SubscriptionManagementContent,
  OpenAIResponseMetadata
>;

export type InvestmentHoldingsResponse = MCPToolResponse<
  InvestmentHoldingsContent,
  OpenAIResponseMetadata
>;

export type LiabilitiesResponse = MCPToolResponse<
  LiabilitiesContent,
  OpenAIResponseMetadata
>;

/**
 * Structured content for connect item management
 */
export interface ConnectItemContent {
  items: Array<{
    id: string;
    institutionId: string | null;
    institutionName: string | null;
    institutionLogo?: string;
    accountCount: number;
    status: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    connectedAt: string;
  }>;
  planLimits: {
    current: number;
    max: number;
    maxFormatted: string;
    planName: string;
  };
  deletionStatus: {
    canDelete: boolean;
    lastDeletionDate?: string;
    daysUntilNext?: number;
  };
  canConnect: boolean;

}

export const ConnectItemSchema = z.union([
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        institutionId: z.string().nullable(),
        institutionName: z.string().nullable(),
        institutionLogo: z.string().optional(),
        accountCount: z.number().int(),
        status: z.string().nullable(),
        errorCode: z.string().nullable(),
        errorMessage: z.string().nullable(),
        connectedAt: z.string(),
      })
    ),
    planLimits: z.object({
      current: z.number().int(),
      max: z.number().int(),
      maxFormatted: z.string(),
      planName: z.string(),
    }),
    deletionStatus: z.object({
      canDelete: z.boolean(),
      lastDeletionDate: z.string().optional(),
      daysUntilNext: z.number().optional(),
    }),
    canConnect: z.boolean(),
  }),
  AuthResponseSchema,
]);

export type ConnectItemResponse = MCPToolResponse<
  ConnectItemContent,
  OpenAIResponseMetadata
>;

/**
 * Enhanced structured content for account overview dashboard
 * Includes trends, projections, and health metrics
 */
export interface AccountOverviewContent {
  summary: {
    totalBalance: number;
    accountCount: number;
    healthScore: number; // 0-100
    trend: "improving" | "stable" | "declining";
  };
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    subtype: string;
    balance: number;
    available: number;
    currencyCode: string;
  }>;
  projections?: Array<{
    month: number;
    projectedBalance: number;
    confidence: "high" | "medium" | "low";
  }>;
}

export const AccountOverviewSchema = z.union([
  z.object({
    summary: z.object({
      totalBalance: z.number(),
      accountCount: z.number().int(),
      healthScore: z.number().int().min(0).max(100),
      trend: z.enum(["improving", "stable", "declining"]),
    }),
    accounts: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        subtype: z.string(),
        balance: z.number(),
        available: z.number(),
        currencyCode: z.string(),
      })
    ),
    projections: z
      .array(
        z.object({
          month: z.number().int(),
          projectedBalance: z.number(),
          confidence: z.enum(["high", "medium", "low"]),
        })
      )
      .optional(),
  }),
  AuthResponseSchema,
]);

export type AccountOverviewResponse = MCPToolResponse<
  AccountOverviewContent,
  OpenAIResponseMetadata
>;

/**
 * Enhanced spending analysis with anomaly detection and comparisons
 */
export interface SpendingAnalysisContent {
  totalSpent: number;
  topCategories: Array<{
    category: string;
    amount: number;
    transactionCount: number;
    percentOfTotal: number;
  }>;
  trend: "spending_more" | "spending_less" | "consistent";
  anomalyCount: number;
  averageTransactionAmount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export const SpendingAnalysisSchema = z.union([
  z.object({
    totalSpent: z.number(),
    topCategories: z.array(
      z.object({
        category: z.string(),
        amount: z.number(),
        transactionCount: z.number().int(),
        percentOfTotal: z.number(),
      })
    ),
    trend: z.enum(["spending_more", "spending_less", "consistent"]),
    anomalyCount: z.number().int(),
    averageTransactionAmount: z.number(),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }),
  }),
  AuthResponseSchema,
]);

export type SpendingAnalysisResponse = MCPToolResponse<
  SpendingAnalysisContent,
  OpenAIResponseMetadata
>;

/**
 * Recurring payments and subscription tracking
 */
export interface RecurringPaymentsContent {
  monthlyTotal: number;
  subscriptionCount: number;
  upcomingPayments: Array<{
    name: string;
    amount: number;
    nextDate: string;
    frequency: string;
    confidence?: "high" | "medium" | "low";
  }>;
  highestSubscription?: {
    name: string;
    amount: number;
    frequency: string;
  };
}

export const RecurringPaymentsSchema = z.union([
  z.object({
    monthlyTotal: z.number(),
    subscriptionCount: z.number().int(),
    upcomingPayments: z.array(
      z.object({
        name: z.string(),
        amount: z.number(),
        nextDate: z.string(),
        frequency: z.string(),
        confidence: z.enum(["high", "medium", "low"]).optional(),
      })
    ),
    highestSubscription: z
      .object({
        name: z.string(),
        amount: z.number(),
        frequency: z.string(),
      })
      .optional(),
  }),
  AuthResponseSchema,
]);

export type RecurringPaymentsResponse = MCPToolResponse<
  RecurringPaymentsContent,
  OpenAIResponseMetadata
>;

/**
 * Business cash flow analysis with runway calculations
 */
export interface BusinessCashFlowContent {
  runway: {
    months: number;
    endDate: string;
    confidence: "high" | "medium" | "critical";
  };
  currentPeriod: {
    revenue: number;
    expenses: number;
    net: number;
    burnRate: number;
  };
  projections: Array<{
    period: string;
    projectedNet: number;
    confidence: "high" | "medium" | "low";
  }>;
  healthStatus: "positive" | "stable" | "critical";
}

export const BusinessCashFlowSchema = z.union([
  z.object({
    runway: z.object({
      months: z.number(),
      endDate: z.string(),
      confidence: z.enum(["high", "medium", "critical"]),
    }),
    currentPeriod: z.object({
      revenue: z.number(),
      expenses: z.number(),
      net: z.number(),
      burnRate: z.number(),
    }),
    projections: z.array(
      z.object({
        period: z.string(),
        projectedNet: z.number(),
        confidence: z.enum(["high", "medium", "low"]),
      })
    ),
    healthStatus: z.enum(["positive", "stable", "critical"]),
  }),
  AuthResponseSchema,
]);

export type BusinessCashFlowResponse = MCPToolResponse<
  BusinessCashFlowContent,
  OpenAIResponseMetadata
>;

/**
 * Smart expense categorization with tax mapping
 */
export interface ExpenseCategorizationContent {
  categorized: number;
  needsReview: number;
  taxCategories: Record<string, number>;
  totalAmount: number;
}

export const ExpenseCategorizationSchema = z.union([
  z.object({
    categorized: z.number().int(),
    needsReview: z.number().int(),
    taxCategories: z.record(z.string(), z.number()),
    totalAmount: z.number(),
  }),
  AuthResponseSchema,
]);

export type ExpenseCategorizationResponse = MCPToolResponse<
  ExpenseCategorizationContent,
  OpenAIResponseMetadata
>;


/**
 * ACH payment risk assessment
 */
export interface PaymentRiskContent {
  riskScore: {
    overall: number; // 0-100
    bankInitiated: number;
    customerInitiated: number;
  };
  recommendation: "proceed" | "review" | "decline";
  balanceSufficient: boolean | null;
}

export const PaymentRiskSchema = z.union([
  z.object({
    riskScore: z.object({
      overall: z.number().min(0).max(100),
      bankInitiated: z.number(),
      customerInitiated: z.number(),
    }),
    recommendation: z.enum(["proceed", "review", "decline"]),
    balanceSufficient: z.boolean().nullable(),
  }),
  AuthResponseSchema,
]);

export type PaymentRiskResponse = MCPToolResponse<
  PaymentRiskContent,
  OpenAIResponseMetadata
>;

/**
 * Enhanced investment portfolio with performance metrics
 */
export interface InvestmentPortfolioContent {
  totalValue: number;
  totalGainLoss: number;
  percentReturn: number;
  accountCount: number;
  holdingCount: number;
  assetAllocation?: Record<string, number>;
}

export const InvestmentPortfolioSchema = z.union([
  z.object({
    totalValue: z.number(),
    totalGainLoss: z.number(),
    percentReturn: z.number(),
    accountCount: z.number().int(),
    holdingCount: z.number().int(),
    assetAllocation: z.record(z.string(), z.number()).optional(),
  }),
  AuthResponseSchema,
]);

export type InvestmentPortfolioResponse = MCPToolResponse<
  InvestmentPortfolioContent,
  OpenAIResponseMetadata
>;
