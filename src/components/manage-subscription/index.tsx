"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Settings,
  LinkExternalWebsite,
  CreditCard,
  FileDocument,
  CloseBold,
  Expand,
  ShieldCheck,
} from "@openai/apps-sdk-ui/components/Icon";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { AnimateLayout } from "@openai/apps-sdk-ui/components/Transition";
import { cn } from "@/lib/utils/cn";
import { useToolInfo, useDisplayMode, useOpenAiGlobal, useOpenExternal } from "@/src/mcp-ui-hooks";
import { checkWidgetAuth } from "@/src/utils/widget-auth-check";
import { WidgetLoadingSkeleton } from "@/src/components/shared/widget-loading-skeleton";

interface ManageSubscriptionContent {
  billingPortalUrl?: string;
  currentPlan?: string;
  message?: string;
}

export default function ManageSubscription() {
  const toolInfo = useToolInfo();
  const [displayMode, requestDisplayMode] = useDisplayMode();
  const maxHeight = useOpenAiGlobal("maxHeight") as number | string | undefined;
  const openExternal = useOpenExternal();
  const isFullscreen = displayMode === "fullscreen";

  // Extract data from toolInfo
  // Note: toolInfo.output IS the structuredContent directly in Skybridge
  const toolOutput = toolInfo.isSuccess
    ? (toolInfo.output as ManageSubscriptionContent | undefined)
    : undefined;

  // Check for auth requirements
  const authComponent = checkWidgetAuth(toolOutput);
  if (authComponent) return authComponent;

  // Show loading state while waiting for tool output
  if (!toolOutput) {
    return <WidgetLoadingSkeleton />;
  }

  const billingPortalUrl = toolOutput?.billingPortalUrl;
  const currentPlan = toolOutput?.currentPlan;

  const handleManageSubscription = () => {
    if (!billingPortalUrl) {
      return;
    }

    // Use openExternal from Skybridge (handles both ChatGPT and regular browser)
    openExternal(billingPortalUrl);
  };

  const features = [
    {
      icon: CreditCard,
      text: "View and update your payment methods",
    },
    {
      icon: Settings,
      text: "Change or cancel your subscription",
    },
    {
      icon: FileDocument,
      text: "View billing history and invoices",
    },
  ];

  if (!billingPortalUrl) {
    // Free plan - show informational card instead of error
    if (currentPlan === "Free") {
      return (
        <div
          className={cn(
            "antialiased w-full relative bg-transparent text-default",
            !isFullscreen && "overflow-hidden"
          )}
          style={{
            maxHeight: maxHeight ?? undefined,
            height: isFullscreen ? maxHeight ?? undefined : 400,
            minHeight: isFullscreen ? undefined : 400,
          }}
        >
          <div
            className={cn(
              "w-full h-full overflow-y-auto flex flex-col items-center justify-center",
              isFullscreen ? "p-8" : "p-6"
            )}
          >
            <AnimateLayout>
              <div
                key="free-plan-info"
                className="w-full max-w-md mx-auto text-center flex flex-col items-center"
              >
                <div className="p-4 rounded-2xl flex items-center justify-center flex-shrink-0 bg-success-solid text-white mb-6">
                  <ShieldCheck strokeWidth={1.5} className="h-8 w-8" />
                </div>
                <h2 className="heading-xl mb-2 text-default">Free Plan</h2>
                <p className="text-md text-secondary max-w-sm mx-auto mb-6">
                  You have free access with up to 2 connected financial accounts.
                </p>
                <div className="w-full p-4 rounded-xl border bg-success-soft border-success-surface">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-success">Current Plan</span>
                    <Badge color="success" size="lg" pill>Free</Badge>
                  </div>
                </div>
              </div>
            </AnimateLayout>
          </div>
        </div>
      );
    }

    // Paid subscriptions enabled but billing portal not configured - show error
    return (
      <div
        className={cn(
          "antialiased w-full relative bg-surface text-default",
          !isFullscreen && "overflow-hidden"
        )}
        style={{
          maxHeight: maxHeight ?? undefined,
          height: isFullscreen ? maxHeight ?? undefined : 400,
        }}
      >
        <div
          className={cn(
            "w-full h-full overflow-y-auto",
            isFullscreen ? "p-8" : "p-5"
          )}
        >
          <AnimateLayout>
            <div
              key="error-config"
              className="rounded-2xl border p-6 shadow-hairline bg-danger-soft border-danger-surface"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl flex items-center justify-center flex-shrink-0 bg-danger-surface">
                  <CloseBold
                    strokeWidth={1.5}
                    className="h-6 w-6 text-danger"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2 text-danger">
                    Configuration Error
                  </h2>
                  <p className="text-sm text-danger-soft">
                    Billing portal is not configured. Please contact support for
                    assistance.
                  </p>
                </div>
              </div>
            </div>
          </AnimateLayout>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "antialiased w-full relative bg-transparent text-default",
        !isFullscreen && "overflow-hidden"
      )}
      style={{
        maxHeight: maxHeight ?? undefined,
        height: isFullscreen ? maxHeight ?? undefined : 400,
        minHeight: isFullscreen ? undefined : 400,
      }}
    >
      {/* Expand button (inline mode only) */}
      {!isFullscreen && (
        <Button
          onClick={() => requestDisplayMode("fullscreen")}
          variant="ghost"
          color="secondary"
          size="sm"
          className="absolute top-4 right-4 z-20"
          aria-label="Expand to fullscreen"
        >
          <Expand className="h-4 w-4" />
        </Button>
      )}

      {/* Content */}
      <div
        className={cn(
          "w-full h-full overflow-y-auto flex flex-col items-center justify-center",
          isFullscreen ? "p-8" : "p-6"
        )}
      >
        {/* Main Card */}
        <AnimateLayout>
          <div
            key="manage-sub-content"
            className={cn(
              "w-full max-w-md mx-auto text-center flex flex-col items-center",
              isFullscreen && "items-start text-left max-w-2xl"
            )}
          >
            {/* Header with Icon */}
            <div
              className={cn(
                "mb-6 flex flex-col items-center",
                isFullscreen && "flex-row items-start gap-6"
              )}
            >
              <div className="p-4 rounded-2xl flex items-center justify-center flex-shrink-0 bg-discovery-solid text-white mb-4">
                <Settings strokeWidth={1.5} className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="heading-xl mb-2 text-default">
                  Manage Subscription
                </h2>
                <p className="text-md text-secondary max-w-sm mx-auto">
                  Update your plan, payment methods, or billing information
                </p>
              </div>
            </div>

            {isFullscreen && (
              <div className="w-full">
                {/* Current Plan Badge */}
                {currentPlan && (
                  <div className="mb-6 p-4 rounded-xl border bg-info-soft border-info-surface w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-info">
                        Current Plan
                      </span>
                      <Badge color="info" size="lg" pill>
                        {currentPlan}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Features List */}
                <div className="mb-8 space-y-3 w-full">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="p-2 rounded-lg flex items-center justify-center flex-shrink-0 bg-success-soft text-success">
                        <feature.icon strokeWidth={1.5} className="h-4 w-4" />
                      </div>
                      <p className="text-sm pt-1 text-secondary">
                        {feature.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="w-full max-w-xs mx-auto">
              <Button
                onClick={handleManageSubscription}
                color="primary"
                size="xl"
                block
              >
                Open Billing Portal
                <LinkExternalWebsite className="ml-2 h-4 w-4" />
              </Button>

              {/* Footer Note */}
              <p className="text-xs text-center mt-4 text-tertiary">
                Secure billing portal powered by Stripe
              </p>
            </div>
          </div>
        </AnimateLayout>
      </div>
    </div>
  );
}
