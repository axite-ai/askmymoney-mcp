import SubscriptionRequired from "@/src/components/subscription-required";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function SubscriptionRequiredPage() {
  return <SubscriptionRequired />;
}
