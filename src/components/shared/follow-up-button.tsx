"use client";

import { useState, useCallback } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { useSendFollowUpMessage } from "@/src/mcp-ui-hooks";
import { cn } from "@/lib/utils/cn";

interface FollowUpButtonProps {
  /** The prompt to send to ChatGPT */
  prompt: string;
  /** Button label text */
  label?: string;
  /** Button variant */
  variant?: "solid" | "outline" | "soft" | "ghost";
  /** Button color */
  color?: "primary" | "secondary" | "danger" | "success" | "info" | "discovery" | "caution" | "warning";
  /** Additional CSS classes */
  className?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Callback after sending */
  onSent?: () => void;
}

/**
 * Reusable button component for sending follow-up messages to ChatGPT
 * Uses useSendFollowUpMessage hook to trigger conversational flow
 */
export function FollowUpButton({
  prompt,
  label = "Ask ChatGPT",
  variant = "outline",
  color = "secondary",
  className,
  showIcon = true,
  onSent,
}: FollowUpButtonProps) {
  const sendFollowUp = useSendFollowUpMessage();
  const [isSending, setIsSending] = useState(false);

  const handleClick = useCallback(async () => {
    if (isSending) return;

    setIsSending(true);
    try {
      await sendFollowUp(prompt);
      onSent?.();
    } catch (error) {
      console.error("[FollowUpButton] Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  }, [prompt, sendFollowUp, isSending, onSent]);

  return (
    <Button
      variant={variant}
      color={color}
      onClick={handleClick}
      disabled={isSending}
      className={cn("gap-2", className)}
    >
      {isSending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : showIcon ? (
        <MessageSquare className="w-4 h-4" />
      ) : null}
      {label}
    </Button>
  );
}

/**
 * Preset follow-up prompts for common widget actions
 * Use these to ensure consistent UX across widgets
 */
export const FOLLOW_UP_PROMPTS = {
  // Account Balances
  createSavingsPlan: (goal?: string) =>
    goal
      ? `Help me create a savings plan to reach $${goal}`
      : "Help me create a savings plan based on my account balances",

  // Transactions
  analyzeSpending: (category: string) =>
    `Analyze my spending in ${category} this month`,
  categorizeTransactions:
    "Help me categorize my uncategorized transactions",

  // Spending Insights
  createBudget: "Create a budget based on this spending breakdown",
  compareMonths: "Compare my spending this month to last month",
  findSavings: "Find areas where I could reduce spending",

  // Recurring Payments
  findSubscriptionsToCancel:
    "Find subscriptions I could cancel to save money",
  optimizeSubscriptions:
    "Help me optimize my recurring payments",

  // Account Health
  improveScore: (metric: string) =>
    `Explain how to improve my ${metric} score`,
  healthOverview:
    "Give me a detailed overview of my financial health",

  // Business Cash Flow
  projectRunway: (reduction: number) =>
    `Project my runway if I reduce expenses by ${reduction}%`,
  optimizeCashFlow:
    "Help me optimize my business cash flow",

  // Investments
  analyzeDiversification:
    "Analyze the diversification of my portfolio",
  investmentRecommendations:
    "Suggest how I could improve my investment portfolio",

  // Liabilities
  createPayoffPlan:
    "Create a debt payoff plan for these accounts",
  prioritizeDebts:
    "Help me prioritize which debts to pay off first",
} as const;
