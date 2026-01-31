import BusinessCashFlow from "@/src/components/business-cashflow";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function BusinessCashFlowPage() {
  return <BusinessCashFlow />;
}
