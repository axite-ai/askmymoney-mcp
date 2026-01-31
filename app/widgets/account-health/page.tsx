import AccountHealth from "@/src/components/account-health";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function AccountHealthPage() {
  return <AccountHealth />;
}
