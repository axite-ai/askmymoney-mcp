import AccountBalances from "@/src/components/account-balances";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function AccountBalancesPage() {
  return <AccountBalances />;
}
