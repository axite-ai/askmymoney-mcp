import ExpenseCategorizer from "@/src/components/expense-categorizer";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function ExpenseCategorizerPage() {
  return <ExpenseCategorizer />;
}
