"use client";

import { useEffect } from "react";
import { useTheme } from "@/src/mcp-ui-hooks";
import { applyDocumentTheme } from "@openai/apps-sdk-ui/theme";

export function ThemeSync() {
  const theme = useTheme();

  useEffect(() => {
    if (theme && (theme === "light" || theme === "dark")) {
      applyDocumentTheme(theme);
    }
  }, [theme]);

  return null;
}
