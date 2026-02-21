import Liabilities from "@/src/components/liabilities";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function LiabilitiesPage() {
  return <Liabilities />;
}
