import ConnectItem from "@/src/components/connect-item";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function ConnectItemPage() {
  return <ConnectItem />;
}
