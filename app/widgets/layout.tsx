"use client";

import { useEffect, useState, type ReactNode } from "react";
import { WidgetErrorBoundary } from "@/src/components/shared/error-boundary";

/**
 * Widgets Layout - Client-Only Rendering with Error Boundary
 *
 * All widget pages require browser context (window.openai) from the ChatGPT SDK.
 * This layout ensures widgets only render on the client, preventing SSR errors
 * from Skybridge hooks that depend on browser APIs.
 *
 * The error boundary catches any runtime errors in widgets and provides
 * a graceful fallback UI with retry functionality.
 */
export default function WidgetsLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR - widgets need browser context
  if (!mounted) {
    return null;
  }

  return (
    <WidgetErrorBoundary>
      {children}
    </WidgetErrorBoundary>
  );
}
