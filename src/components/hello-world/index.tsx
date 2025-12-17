"use client";

import { useToolInfo } from "@/src/skybridge";
import type { HelloWorldContent } from "@/lib/types/tool-responses";

export default function HelloWorldWidget() {
  // @ts-ignore - The AppType inference is powerful but for a clean template start
  // we are skipping the strict type connection here for simplicity.
  const { output } = useToolInfo();
  const toolOutput = output?.structuredContent as HelloWorldContent;

  if (!toolOutput) {
    return <div className="p-4">Loading...</div>;
  }

  const { greeting, name, timestamp } = toolOutput;

  return (
    <div className="p-6 bg-surface text-default rounded-lg border border-default">
      <h2 className="text-2xl font-bold mb-4">{greeting}</h2>
      <div className="space-y-2">
        <p>
          <span className="font-semibold">Name:</span> {name}
        </p>
        <p>
          <span className="font-semibold">Time:</span> {new Date(timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
