/**
 * Widget Authentication Check Helper
 *
 * DRY helper to check if widget should render auth prompts.
 * Returns the appropriate auth component or null if no auth issues.
 *
 * NOTE: Direct imports are required here (not dynamic imports with ssr: false)
 * because some of these components use server actions, and dynamic imports
 * break server action bindings when loaded through the Skybridge widget path.
 */

// TEMPLATE: Import your required shared components here.
// We have commented these out as they are implementation specific,
// but you should implement them if you need them.
// import SubscriptionRequired from "@/src/components/subscription-required";
// import SecurityRequired from "@/src/components/security-required";

/**
 * Check widget auth state and return appropriate component if auth is required.
 * Returns null if no auth issues detected.
 *
 * @param toolOutput - The widget props received from MCP tool response
 * @returns Auth component to render, or null if authenticated
 *
 * @example
 * ```typescript
 * export default function MyWidget() {
 *   const toolOutput = useWidgetProps<ToolOutput>();
 *
 *   const authComponent = checkWidgetAuth(toolOutput);
 *   if (authComponent) return authComponent;
 *
 *   // ... render actual widget content
 * }
 * ```
 */
export function checkWidgetAuth(toolOutput: any) {
  if (!toolOutput) return null;

  // TEMPLATE: Add your own checks here based on your tool's error responses.

  // Example: Check for Security required (Passkey)
  // if (toolOutput.message === "Security setup required") {
  //   return <SecurityRequired />;
  // }

  // Example: Check for subscription required
  // if (toolOutput.error_message === "Subscription required") {
  //   return <SubscriptionRequired />;
  // }

  // No auth issues
  return null;
}
