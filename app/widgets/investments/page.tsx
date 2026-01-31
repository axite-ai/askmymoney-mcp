import Investments from "@/src/components/investments";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function InvestmentsPage() {
  return <Investments />;
}
