"use client";

import React from "react";
import { useWidgetProps } from "@/app/hooks/use-widget-props";
import { LocaleFormatter } from "@/lib/utils/locale-formatter";
import type { OpenAIMetadata } from "@/lib/types";

interface SpendingCategory {
  name: string;
  amount: number;
  currency?: string | null;
}

type SpendingInsightsToolOutput = Record<string, unknown> & {
  categories?: SpendingCategory[];
  metadata?: OpenAIMetadata;
};

export default function SpendingInsights() {
  const toolOutput = useWidgetProps<SpendingInsightsToolOutput>();
  const formatter = React.useMemo(
    () => new LocaleFormatter(toolOutput?.metadata),
    [toolOutput?.metadata]
  );
  const rawCategories = toolOutput?.categories;

  if (!Array.isArray(rawCategories)) {
    return <p>No spending data available</p>;
  }

  const categories = rawCategories.filter(
    (category): category is SpendingCategory =>
      Boolean(category) &&
      typeof category.name === "string" &&
      typeof category.amount === "number"
  );

  if (categories.length === 0) {
    return <p>No spending data available</p>;
  }

  return (
    <div className="insights">
      {categories.map((category) => {
        const currency = category.currency ?? "USD";
        return (
          <div key={category.name} className="category">
            <div className="category-name">{category.name}</div>
            <div className="category-amount">
              {formatter.formatCurrency(Math.abs(category.amount), currency)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
