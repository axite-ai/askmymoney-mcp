import SpendingInsights from "@/src/components/spending-insights";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function SpendingInsightsPage() {
  return <SpendingInsights />;
}
