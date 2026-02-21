import HelloWorldWidget from "@/src/components/hello-world";

// Widget pages require ChatGPT SDK context at runtime - skip static generation
export const dynamic = "force-dynamic";

export default function HelloWorldPage() {
  return (
    <>
      <HelloWorldWidget />
    </>
  );
}
