import PlaidRequired from "@/src/components/plaid-required";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function PlaidRequiredPage() {
  return <PlaidRequired />;
}
