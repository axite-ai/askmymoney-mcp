import ManageSubscription from "@/src/components/manage-subscription";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function ManageSubscriptionPage() {
  return <ManageSubscription />;
}
