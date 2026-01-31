"use client";

import React, { useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Expand,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
} from "@openai/apps-sdk-ui/components/Icon";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { EmptyMessage } from "@openai/apps-sdk-ui/components/EmptyMessage";
import { AnimateLayout } from "@openai/apps-sdk-ui/components/Transition";
import { useToolInfo, useWidgetState, useDisplayMode, useOpenAiGlobal } from "@/src/mcp-ui-hooks";
import { formatCurrency } from "@/src/utils/format";
import { checkWidgetAuth } from "@/src/utils/widget-auth-check";
import { WidgetLoadingSkeleton } from "@/src/components/shared/widget-loading-skeleton";
import { FollowUpButton, FOLLOW_UP_PROMPTS } from "@/src/components/shared/follow-up-button";
import { cn } from "@/lib/utils/cn";
import { fadeSlideUp, staggerContainer, listItem } from "@/src/lib/animation-variants";
import type { AccountOverviewContent } from "@/lib/types/tool-responses";
import type { SafeArea, UserAgent } from "@/src/mcp-ui-hooks";

interface Account {
  account_id: string;
  name: string;
  type: string;
  subtype?: string;
  mask: string | null;
  balances: {
    current: number | null;
    available: number | null;
    iso_currency_code: string;
  };
}

interface Projection {
  month: number;
  projectedBalance: number;
  confidence: "high" | "medium" | "low";
}

interface ToolOutput extends AccountOverviewContent, Record<string, unknown> {}

interface BalancesUIState extends Record<string, unknown> {
  expandedAccountIds: string[];
}

function getAccountIcon(type: string, subtype?: string) {
  const iconType = (subtype || type).toLowerCase();

  if (iconType.includes("checking")) return "💳";
  if (iconType.includes("savings")) return "🏦";
  if (iconType.includes("credit")) return "💎";
  if (iconType.includes("investment") || iconType.includes("brokerage"))
    return "📈";
  if (iconType.includes("loan") || iconType.includes("mortgage")) return "🏠";
  return "💰";
}

function getHealthBadgeColor(score: number): "success" | "warning" | "danger" {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

function getTrendIcon(trend: string) {
  if (trend === "improving") return <ArrowUp className="w-4 h-4 text-success" />;
  if (trend === "declining") return <ArrowDown className="w-4 h-4 text-danger" />;
  return null;
}

interface AccountCardProps {
  account: Account;
  isExpanded: boolean;
  onToggle: () => void;
}

function AccountCard({ account, isExpanded, onToggle }: AccountCardProps) {
  const hasAvailable =
    account.balances.available !== null &&
    account.balances.available !== account.balances.current;

  return (
    <div
      className="p-4 cursor-pointer hover:bg-surface-secondary/50 transition-colors"
      onClick={hasAvailable ? onToggle : undefined}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-lg shrink-0">
            {getAccountIcon(account.type, account.subtype)}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-default truncate">
              {account.name}
            </h3>
            <p className="text-xs text-secondary truncate">
              {account.type} {account.mask && `• ${account.mask}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-semibold text-default">
              {formatCurrency(
                account.balances.current ?? 0,
                account.balances.iso_currency_code
              )}
            </div>
            {hasAvailable && (
              <div className="text-xs text-secondary">
                Current
              </div>
            )}
          </div>
          {hasAvailable && (
            <div className="text-secondary">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          )}
        </div>
      </div>

      <AnimateLayout>
        {hasAvailable && isExpanded ? (
          <div key="available-balance" className="mt-3 pt-3 border-t border-subtle flex justify-between items-center text-sm">
            <span className="text-secondary">Available Balance</span>
            <span className="font-medium text-success">
              {formatCurrency(
                account.balances.available!,
                account.balances.iso_currency_code
              )}
            </span>
          </div>
        ) : null}
      </AnimateLayout>
    </div>
  );
}

export default function AccountBalances() {
  const toolInfo = useToolInfo();
  const [uiState, setUiState] = useWidgetState<BalancesUIState>({
    expandedAccountIds: [],
  });

  const [displayMode, requestDisplayMode] = useDisplayMode();
  const maxHeight = useOpenAiGlobal("maxHeight") as number | undefined;
  const safeArea = useOpenAiGlobal("safeArea") as SafeArea | undefined;
  const userAgent = useOpenAiGlobal("userAgent") as UserAgent | undefined;

  const isFullscreen = displayMode === "fullscreen";
  const isInline = displayMode === "inline";
  const isMobile = userAgent?.device?.type === "mobile" || (typeof maxHeight === "number" && maxHeight < 720);

  // Safe area insets for mobile devices with notches
  const safeInsets = useMemo(() => ({
    paddingTop: safeArea?.insets?.top ?? 0,
    paddingBottom: safeArea?.insets?.bottom ?? 0,
    paddingLeft: safeArea?.insets?.left ?? 0,
    paddingRight: safeArea?.insets?.right ?? 0,
  }), [safeArea]);

  // Keyboard navigation for fullscreen mode
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        requestDisplayMode("inline");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, requestDisplayMode]);

  // Extract data from toolInfo
  // Note: toolInfo.output IS the structuredContent directly in Skybridge
  const toolOutput = toolInfo.isSuccess
    ? (toolInfo.output as ToolOutput | undefined)
    : undefined;
  const toolMetadata = toolInfo.isSuccess
    ? (toolInfo.responseMetadata as { projections?: Projection[] } | undefined)
    : undefined;

  const toggleAccountExpanded = (accountId: string) => {
    setUiState(prevState => {
      if (!prevState) return null;
      const currentlyExpanded = new Set(prevState.expandedAccountIds);
      if (currentlyExpanded.has(accountId)) {
        currentlyExpanded.delete(accountId);
      } else {
        currentlyExpanded.add(accountId);
      }
      return { ...prevState, expandedAccountIds: Array.from(currentlyExpanded) };
    });
  };

  // Show loading skeleton during initial load
  if (!toolOutput) {
    return <WidgetLoadingSkeleton />;
  }

  // Check for auth requirements
  const authComponent = checkWidgetAuth(toolOutput);
  if (authComponent) return authComponent;

  // Show empty state only if there's truly no data
  if (!toolOutput?.summary || !toolOutput?.accounts) {
    return (
      <EmptyMessage>
        <EmptyMessage.Title>No account data available</EmptyMessage.Title>
      </EmptyMessage>
    );
  }

  const { summary, accounts } = toolOutput;
  const projections = (toolMetadata?.projections ?? toolOutput.projections ?? []) as Projection[];

  // No data check
  if (!accounts || accounts.length === 0) {
    return (
      <EmptyMessage>
        <EmptyMessage.Title>No accounts found</EmptyMessage.Title>
      </EmptyMessage>
    );
  }

  // Dynamic padding based on display mode
  const containerPadding = isInline ? 12 : isMobile ? 20 : 32;

  return (
    <motion.div
      variants={fadeSlideUp}
      initial="initial"
      animate="animate"
      className={`antialiased w-full relative bg-transparent text-default ${!isFullscreen ? "overflow-hidden" : ""}`}
      style={{
        maxHeight: typeof maxHeight === "number" && maxHeight > 0 ? maxHeight : undefined,
        height: isFullscreen ? (typeof maxHeight === "number" && maxHeight > 0 ? maxHeight : "100vh") : 400,
        ...safeInsets,
      }}
    >
      {/* Fullscreen expand button */}
      {!isFullscreen && (
        <Button
          onClick={() => requestDisplayMode("fullscreen")}
          variant="ghost"
          color="secondary"
          size="sm"
          className="absolute top-4 right-4 z-20"
          aria-label="Expand to fullscreen"
        >
          <Expand className="h-4 w-4" />
        </Button>
      )}

      {/* Content */}
      <div
        className="w-full h-full overflow-y-auto"
        style={{ padding: isFullscreen ? containerPadding : 0 }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="heading-lg mb-2">
            Financial Overview
          </h1>
          <div className={cn("grid gap-4 mb-4", isFullscreen ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1")}>
            <div>
              <p className="text-sm text-secondary">
                Total Balance
              </p>
              <p className="text-3xl font-semibold mt-1 text-default">
                {formatCurrency(summary.totalBalance)}
              </p>
              <p className="text-xs mt-1 text-tertiary">
                {summary.accountCount} {summary.accountCount === 1 ? "account" : "accounts"}
              </p>
            </div>

            {/* Additional stats only in fullscreen */}
            {isFullscreen && (
              <>
                <div>
                  <p className="text-sm text-secondary mb-1">
                    Health Score
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge color={getHealthBadgeColor(summary.healthScore)} size="lg">
                      {summary.healthScore} / 100
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-secondary">
                    Trend
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {getTrendIcon(summary.trend)}
                    <span className="text-lg font-medium capitalize text-default">
                      {summary.trend}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Projections - only in fullscreen */}
        {isFullscreen && projections && projections.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-subtle bg-surface-secondary">
            <h2 className="text-sm font-medium mb-3 text-secondary">
              Cash Flow Projection
            </h2>
            <div className="space-y-2">
              {projections.map((proj) => (
                <div key={proj.month} className="flex items-center gap-3">
                  <span className="text-xs w-16 text-secondary">
                    Month {proj.month}
                  </span>
                  <div className="flex-1 h-2 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full",
                        proj.confidence === "high" ? "bg-success" :
                        proj.confidence === "medium" ? "bg-warning" : "bg-secondary"
                      )}
                      style={{ width: `${Math.min(100, (proj.projectedBalance / summary.totalBalance) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs w-24 text-right text-default">
                    {formatCurrency(proj.projectedBalance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account List */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="border border-subtle rounded-xl overflow-hidden bg-surface shadow-sm"
        >
          {accounts.map((account, index) => {
            const mappedAccount: Account = {
              account_id: account.id,
              name: account.name,
              type: account.type,
              subtype: account.subtype,
              mask: null,
              balances: {
                current: account.balance,
                available: account.available,
                iso_currency_code: account.currencyCode
              }
            };
            return (
              <motion.div
                key={account.id}
                variants={listItem}
                className={cn(index !== 0 && "border-t border-subtle")}
              >
                <AccountCard
                  account={mappedAccount}
                  isExpanded={uiState?.expandedAccountIds.includes(account.id) ?? false}
                  onToggle={() => toggleAccountExpanded(account.id)}
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Follow-up Actions */}
        {isFullscreen && (
          <motion.div
            variants={fadeSlideUp}
            initial="initial"
            animate="animate"
            className="mt-6 flex flex-wrap gap-3"
          >
            <FollowUpButton
              prompt={FOLLOW_UP_PROMPTS.createSavingsPlan()}
              label="Create Savings Plan"
            />
            <FollowUpButton
              prompt="Analyze my account balances and suggest how to optimize them"
              label="Optimize Accounts"
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
