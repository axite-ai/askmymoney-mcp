import {
  generateHelpers,
  useToolInfo as useToolInfoBase,
  useWidgetState,
  useTheme,
  useDisplayMode,
  useSendFollowUpMessage
} from "skybridge/web";
import type { AppType } from "@/app/[transport]/route";

const { useCallTool: typedUseCallTool } = generateHelpers<AppType>();

// Export Typed Hooks
export const useCallTool = typedUseCallTool;

// Export Standard Hooks (augmented with Types if needed, or raw)
// Export Standard Hooks (augmented with Types if needed, or raw)
// We cast useToolInfo to return 'any' or a broad type to avoid complex inference
// issues in the template, allowing the developer to cast it in the component
// or let it infer if Skybridge supports it natively.
export const useToolInfo = useToolInfoBase;
export {
  useWidgetState,
  useTheme,
  useDisplayMode,
  useSendFollowUpMessage
};
