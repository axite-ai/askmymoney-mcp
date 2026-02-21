"use client";

import React, { useMemo, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Expand, Trending, ExternalLink } from "@openai/apps-sdk-ui/components/Icon";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { useToolInfo, useWidgetState, useDisplayMode, useOpenAiGlobal, useCallTool } from "@/src/mcp-ui-hooks";
import { formatCurrency, formatPercent } from "@/src/utils/format";
import { checkWidgetAuth } from "@/src/utils/widget-auth-check";
import { cn } from "@/lib/utils/cn";
import { EmptyMessage } from "@openai/apps-sdk-ui/components/EmptyMessage";
import { AnimateLayout } from "@openai/apps-sdk-ui/components/Transition";
import { WidgetLoadingSkeleton } from "@/src/components/shared/widget-loading-skeleton";
import { FollowUpButton, FOLLOW_UP_PROMPTS } from "@/src/components/shared/follow-up-button";
import { fadeSlideUp, staggerContainer, listItem } from "@/src/lib/animation-variants";
import type { SafeArea, UserAgent } from "@/src/mcp-ui-hooks";

interface Category {
  category: string;
  amount: number;
  percentage: number;
}

interface ToolOutput extends Record<string, unknown> {
  totalSpent?: number;
  categoryCount?: number;
  dateRange?: { start: string; end: string };
  message?: string;
  error_message?: string;
  featureName?: string;
}

interface ToolMetadata {
  allCategories: Category[];
}

interface SpendingUIState extends Record<string, unknown> {
  selectedIndex: number | null;
}

// SDK Color Tokens mapping
const CATEGORY_COLORS = [
  { from: "var(--color-blue-500)", to: "var(--color-blue-600)", text: "text-info" },
  { from: "var(--color-purple-500)", to: "var(--color-purple-600)", text: "text-discovery" },
  { from: "var(--color-red-500)", to: "var(--color-red-600)", text: "text-danger" },
  { from: "var(--color-orange-500)", to: "var(--color-orange-600)", text: "text-warning" },
  { from: "var(--color-green-500)", to: "var(--color-green-600)", text: "text-success" },
  { from: "var(--color-yellow-500)", to: "var(--color-yellow-600)", text: "text-caution" },
];

function getCategoryIcon(name: string) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("food") || lower.includes("restaurant")) return "🍽️";
  if (lower.includes("transport") || lower.includes("travel")) return "🚗";
  if (lower.includes("shop") || lower.includes("retail")) return "🛍️";
  if (lower.includes("entertainment") || lower.includes("recreation")) return "🎬";
  if (lower.includes("groceries") || lower.includes("supermarket")) return "🛒";
  if (lower.includes("health") || lower.includes("medical")) return "🏥";
  if (lower.includes("utilities") || lower.includes("bills")) return "💡";
  if (lower.includes("home") || lower.includes("rent")) return "🏠";
  if (lower.includes("transfer")) return "💸";
  return "💰";
}

interface CategoryBarProps {
  category: Category & { color: typeof CATEGORY_COLORS[0] };
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

function CategoryBar({ category, index, isSelected, onClick }: CategoryBarProps) {
  return (
    <div
      key={category.category}
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border border-subtle transition-all p-3 bg-surface hover:bg-surface-secondary/50",
        isSelected && "ring-1 ring-primary border-primary"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
          style={{
            backgroundColor: category.color.from,
            color: "white"
          }}
        >
          {getCategoryIcon(category.category)}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate text-default">
              {category.category}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-default block">
              {formatCurrency(Math.abs(category.amount))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-surface-tertiary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${category.percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
            className="h-full"
            style={{
              backgroundColor: category.color.to
            }}
          />
        </div>
        <span className="text-xs text-secondary w-8 text-right tabular-nums">
          {Math.round(category.percentage)}%
        </span>
      </div>
    </div>
  );
}

interface DonutChartProps {
  categories: Array<Category & { color: typeof CATEGORY_COLORS[0] }>;
  totalSpending: number;
  selectedIndex: number | null;
  onSelectCategory: (index: number) => void;
}

function DonutChart({
  categories,
  totalSpending,
  selectedIndex,
  onSelectCategory,
}: DonutChartProps) {
  const size = 200;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate total absolute amount to ensure percentages sum to 100 correctly for visual representation
  const totalAmount = categories.reduce((sum, cat) => sum + Math.abs(cat.amount), 0);

  let accumulatedPercentage = 0;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-secondary)"
          strokeWidth={strokeWidth}
        />

        {/* Category segments */}
        {categories.map((category, index) => {
          // Re-calculate percentage based on local total to ensure segments fit perfectly
          const percentage = (Math.abs(category.amount) / totalAmount) * 100;

          // SVG stroke-dasharray pattern: length of dash, length of gap
          // We need gap to be circumference to ensure it doesn't repeat
          const dashLength = (percentage / 100) * circumference;
          const gapLength = circumference; // Ensure gap is large enough
          const dashArray = `${dashLength} ${gapLength}`;

          // Stroke dashoffset determines where the dash starts
          // We start from 0 (at -90deg due to rotation) and offset backwards by accumulated amount
          const currentOffset = (accumulatedPercentage / 100) * circumference;
          // In SVG, positive offset moves start point counter-clockwise (which looks like backwards in our rotated view)
          // We want to "push" the start point back by the accumulated amount so it starts where previous ended
          // stroke-dashoffset is subtracted from the path start.
          // Since we rotate -90deg, 0 is at top.
          // Increasing offset moves the dash "backwards" along the path.
          // But wait, the standard trick is: dashoffset = circumference - current_value? No, that's for "filling up" animations.
          // For stacked segments:
          // Segment 1 starts at 0.
          // Segment 2 starts at (percentage1).
          // We achieve this by setting dashoffset to -accumulated_length.

          const offset = -1 * ((accumulatedPercentage / 100) * circumference);

          accumulatedPercentage += percentage;

          return (
            <motion.circle
              key={category.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={category.color.from}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              // strokeDashoffset needs to be negative to shift the start point clockwise
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
              className={cn(
                "cursor-pointer transition-all hover:opacity-80",
                selectedIndex !== null && selectedIndex !== index && "opacity-30"
              )}
              onClick={() => onSelectCategory(index)}
            />
          );
        })}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-xs font-medium text-secondary uppercase tracking-wide">
          Total Spent
        </div>
        <div className="text-2xl font-bold mt-1 text-default">
          {formatCurrency(totalSpending)}
        </div>
      </div>
    </div>
  );
}

export default function SpendingInsights() {
  const toolInfo = useToolInfo();
  const [uiState, setUiState] = useWidgetState<SpendingUIState>({
    selectedIndex: null,
  });

  const [displayMode, requestDisplayMode] = useDisplayMode();
  const maxHeight = useOpenAiGlobal("maxHeight") as number | undefined;
  const safeArea = useOpenAiGlobal("safeArea") as SafeArea | undefined;
  const userAgent = useOpenAiGlobal("userAgent") as UserAgent | undefined;
  const callTool = useCallTool();

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

  // Dynamic padding based on display mode
  const containerPadding = isInline ? 12 : isMobile ? 20 : 32;

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

  // Inter-widget tool call: show transactions for a category
  const showCategoryTransactions = useCallback(async (categoryName: string) => {
    try {
      await callTool("askmymoney_get_transactions", { category: categoryName });
    } catch (error) {
      console.error("[SpendingInsights] Failed to call transactions tool:", error);
    }
  }, [callTool]);

  // Extract data from toolInfo
  // Note: toolInfo.output IS the structuredContent directly in Skybridge
  const toolOutput = toolInfo.isSuccess
    ? (toolInfo.output as ToolOutput | undefined)
    : undefined;
  const toolMetadata = toolInfo.isSuccess
    ? (toolInfo.responseMetadata as unknown as ToolMetadata | undefined)
    : undefined;

  // Check for auth requirements
  const authComponent = checkWidgetAuth(toolOutput);
  if (authComponent) return authComponent;

  // Show loading state while waiting for tool output
  if (!toolOutput) {
    return <WidgetLoadingSkeleton />;
  }

  if (!toolMetadata && !toolOutput.totalSpent) {
    return (
      <EmptyMessage>
        <EmptyMessage.Title>No spending data available</EmptyMessage.Title>
      </EmptyMessage>
    );
  }

  const rawCategories = toolMetadata?.allCategories || [];
  const totalSpending = toolOutput?.totalSpent ?? rawCategories.reduce(
    (sum, cat) => sum + Math.abs(cat.amount),
    0
  );

  if (rawCategories.length === 0) {
    return (
      <EmptyMessage>
        <EmptyMessage.Title>No spending data available</EmptyMessage.Title>
      </EmptyMessage>
    );
  }

  const categoriesWithMetadata = rawCategories.map((cat, index) => ({
    ...cat,
    percentage: cat.percentage ?? (totalSpending > 0 ? (Math.abs(cat.amount) / totalSpending) * 100 : 0),
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]!,
  }));

  // Sort by amount descending
  categoriesWithMetadata.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

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
        style={{ padding: isFullscreen ? containerPadding : 20 }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="heading-lg mb-2">
            Spending Insights
          </h1>
          <div className="flex items-center gap-3">
            <Trending className="w-5 h-5 text-danger" />
            <p className="text-sm text-secondary">
              Breakdown of your spending by category
            </p>
          </div>
        </div>

        {/* Layout: Chart + Categories */}
        <div className={cn("flex gap-4", isFullscreen ? "flex-col" : "flex-row items-center")}>
          {/* Donut Chart */}
          <div className={cn("flex justify-center py-2 shrink-0", !isFullscreen && "max-w-[45%]")}>
            <div className={cn("relative", !isFullscreen && "scale-75 origin-center")}>
              <DonutChart
                categories={categoriesWithMetadata}
                totalSpending={totalSpending}
                selectedIndex={uiState?.selectedIndex ?? null}
                onSelectCategory={(index) =>
                  setUiState(s => s ? { ...s, selectedIndex: s.selectedIndex === index ? null : index } : null)
                }
              />
            </div>
          </div>

          {/* Categories List */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={cn("space-y-2 min-w-0", !isFullscreen && "flex-1")}
          >
            {(isFullscreen ? categoriesWithMetadata : categoriesWithMetadata.slice(0, 4)).map((category, index) => (
              <motion.div key={category.category} variants={listItem}>
                <CategoryBar
                  category={category}
                  index={index}
                  onClick={() =>
                    setUiState(s => s ? { ...s, selectedIndex: s.selectedIndex === index ? null : index } : null)
                  }
                  isSelected={uiState?.selectedIndex === index}
                />
                {/* Show "View Transactions" button when category is selected */}
                {isFullscreen && uiState?.selectedIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 ml-9"
                  >
                    <Button
                      variant="outline"
                      color="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        showCategoryTransactions(category.category);
                      }}
                      className="gap-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Transactions
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Follow-up Actions */}
        {isFullscreen && (
          <motion.div
            variants={fadeSlideUp}
            initial="initial"
            animate="animate"
            className="mt-6 flex flex-wrap gap-3"
          >
            <FollowUpButton
              prompt={FOLLOW_UP_PROMPTS.createBudget}
              label="Create Budget"
            />
            <FollowUpButton
              prompt={FOLLOW_UP_PROMPTS.compareMonths}
              label="Compare to Last Month"
            />
            <FollowUpButton
              prompt={FOLLOW_UP_PROMPTS.findSavings}
              label="Find Savings"
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
