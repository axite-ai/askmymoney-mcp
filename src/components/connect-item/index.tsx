"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Clock,
  Trending,
  ShieldCheck,
  Flash,
  Business,
  Trash,
  Expand,
} from "@openai/apps-sdk-ui/components/Icon";
import { Button, ButtonLink } from "@openai/apps-sdk-ui/components/Button";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { Alert } from "@openai/apps-sdk-ui/components/Alert";
import { EmptyMessage } from "@openai/apps-sdk-ui/components/EmptyMessage";
import { AnimateLayout } from "@openai/apps-sdk-ui/components/Transition";
import {
  useToolInfo,
  useDisplayMode,
  useOpenAiGlobal,
  useOpenExternal,
} from "@/src/mcp-ui-hooks";
import { checkWidgetAuth } from "@/src/utils/widget-auth-check";
import { cn } from "@/lib/utils/cn";
import dynamic from "next/dynamic";

const SubscriptionRequired = dynamic(() => import("@/src/components/subscription-required"), { ssr: false });
import { WidgetLoadingSkeleton } from "@/src/components/shared/widget-loading-skeleton";
import {
  type ConnectedItem,
  type ConnectItemStatus,
} from "@/app/(app)/widgets/connect-item/actions";

// Data from structuredContent (visible to model)
interface ConnectItemContent {
  planLimits?: {
    current: number;
    max: number;
    maxFormatted: string;
    planName: string;
    subscriptionsEnabled?: boolean;
  };
  canConnect?: boolean;
  // Auth error fields (checked by checkWidgetAuth)
  message?: string;
  error_message?: string;
  featureName?: string;
}

// Data from _meta (widget only)
interface ConnectItemMetadata {
  items: ConnectedItem[];
  baseUrl?: string;
  authNonce?: string;
}

const features = [
  { icon: Business, text: "Banks, credit cards, investments & more" },
  { icon: ShieldCheck, text: "Bank-level encryption & security" },
  { icon: Flash, text: "Real-time balance updates" },
  { icon: Trending, text: "AI-powered spending insights" },
];

function InstitutionLogo({ logo, size = 20 }: { logo?: string | null; size?: number }) {
  if (logo) {
    return (
      <img
        src={logo.startsWith('data:') ? logo : `data:image/png;base64,${logo}`}
        alt=""
        width={size}
        height={size}
        className="rounded"
      />
    );
  }
  return <Business style={{ width: size, height: size }} />;
}

type ActionType = 'error' | 'expiring' | 'new_accounts';

const ACTION_TYPE_COLORS: Record<ActionType, 'danger' | 'warning' | 'info'> = {
  error: 'danger',
  new_accounts: 'info',
  expiring: 'warning',
};

const ACTION_TYPE_TEXT_COLORS: Record<ActionType, string> = {
  error: 'text-danger',
  new_accounts: 'text-info',
  expiring: 'text-warning',
};

export default function ConnectItem() {
  const toolInfo = useToolInfo();
  const [displayMode, requestDisplayMode] = useDisplayMode();
  const maxHeight = useOpenAiGlobal("maxHeight") as number | string | undefined;
  const openExternal = useOpenExternal();
  const isFullscreen = displayMode === "fullscreen";

  // Extract data from toolInfo
  // Note: toolInfo.output IS the structuredContent directly in Skybridge
  const toolOutput = toolInfo.isSuccess
    ? (toolInfo.output as ConnectItemContent | undefined)
    : undefined;
  const toolMetadata = toolInfo.isSuccess
    ? (toolInfo.responseMetadata as unknown as ConnectItemMetadata)
    : undefined;

  const [status, setStatus] = useState<ConnectItemStatus | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Open connect page for both connecting and managing accounts
  const handleOpenConnectPage = (itemId?: string, mode?: string) => {
    const authNonce = toolMetadata?.authNonce;
    const baseUrl = toolMetadata?.baseUrl || window.location.origin;

    if (!authNonce) {
      setErrorMessage("Authentication token not available. Please try again.");
      return;
    }

    const params = new URLSearchParams({ nonce: authNonce });
    if (itemId) params.set("itemId", itemId);
    if (mode) params.set("mode", mode);

    openExternal(`${baseUrl}/connect-bank?${params.toString()}`);
  };

  // Optimistically dismiss new accounts prompt in widget
  const handleDismissNewAccounts = (itemId: string) => {
    if (!status) return;
    setStatus({
      ...status,
      items: status.items.map((item) =>
        item.id === itemId
          ? { ...item, newAccountsAvailable: null }
          : item
      ),
    });
  };

  // Load status from props (MCP tool response only)
  useEffect(() => {
    // First, check for auth errors passed in props from a failed tool call.
    // This is the only time we trust the props for auth status.
    const authComponent = checkWidgetAuth(toolOutput);
    if (authComponent) {
      setAuthError("Subscription required");
      setLoading(false);
      return;
    }

    const items = toolMetadata?.items;
    const planLimits = toolOutput?.planLimits;

    if (items && planLimits) {
      // Status provided in props (tool was called successfully)
      setStatus({
        items: items,
        planLimits: {
          ...planLimits,
          subscriptionsEnabled: planLimits.subscriptionsEnabled ?? true,
        },
        deletionStatus: { canDelete: true },
        canConnect: toolOutput?.canConnect ?? true,
      });
      setLoading(false);
    } else {
      // No props yet - still loading from MCP tool call
      // Don't call server actions - they fail auth in ChatGPT iframe
      setLoading(true);
    }
  }, [toolOutput, toolMetadata]);

  // Show loading skeleton while fetching
  if (loading) {
    return <WidgetLoadingSkeleton />;
  }

  // Show subscription required if auth error from server action OR from initial props
  if (authError) {
    return <SubscriptionRequired />;
  }

  // Determine if item needs attention and what action to show
  const getItemActionRequired = (item: ConnectedItem): {
    type: ActionType;
    message: string;
    actionLabel: string;
  } | null => {
    if (item.status === 'error') {
      return {
        type: 'error',
        message: 'Your bank requires you to sign in again to restore access.',
        actionLabel: 'Re-authenticate',
      };
    }

    if (item.newAccountsAvailable && !item.newAccountsAvailable.dismissed) {
      return {
        type: 'new_accounts',
        message: 'New accounts available. Add them to track all your finances.',
        actionLabel: 'Add Accounts',
      };
    }

    if (item.consentExpiresAt) {
      const daysUntilExpiration = Math.ceil(
        (new Date(item.consentExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiration <= 7 && daysUntilExpiration > 0) {
        return {
          type: 'expiring',
          message: `Access expires in ${daysUntilExpiration} ${daysUntilExpiration === 1 ? 'day' : 'days'}. Renew to keep your data up to date.`,
          actionLabel: 'Renew Access',
        };
      }
    }

    return null;
  };

  const getStatusBadge = (item: ConnectedItem) => {
    const action = getItemActionRequired(item);

    if (action) {
      switch (action.type) {
        case 'error':
          return <Badge color="danger">Action Required</Badge>;
        case 'new_accounts':
          return <Badge color="info">New Accounts</Badge>;
        case 'expiring':
          return <Badge color="warning">Expiring Soon</Badge>;
      }
    }

    switch (item.status) {
      case "active":
        return <Badge color="success">Connected</Badge>;
      case "pending":
        return (
          <Badge color="warning">
            <Clock className="w-3 h-3 mr-1" />
            Connecting...
          </Badge>
        );
      default:
        return null;
    }
  };

  // Render compact inline version with account list
  if (!isFullscreen) {
    return (
      <div
        className="antialiased w-full relative flex flex-col h-full min-h-[400px] p-4 sm:p-6 text-default bg-transparent"
        style={{ maxHeight: "400px" }}
      >
        {/* Fullscreen toggle */}
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

        {/* Compact Header */}
        <div className="mb-4">
          <h2 className="heading-lg mb-1">Manage Accounts</h2>
          <p className="text-secondary text-sm">
            {status?.items && status.items.length > 0
              ? `${status.planLimits.current} of ${status.planLimits.maxFormatted} accounts connected`
              : "Connect your first financial account"}
          </p>
        </div>

        {/* Compact Item List */}
        {status?.items && status.items.length > 0 ? (
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {status.items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-subtle bg-surface flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-1.5 rounded-lg bg-surface-secondary text-secondary shrink-0">
                    <InstitutionLogo logo={item.institutionLogo} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{item.institutionName || "Financial Institution"}</p>
                      {getStatusBadge(item)}
                    </div>
                    <p className="text-xs text-secondary">
                      {item.accountCount} {item.accountCount === 1 ? "account" : "accounts"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  color="danger"
                  size="sm"
                  onClick={() => handleOpenConnectPage(item.id, 'delete')}
                  className="shrink-0 ml-2"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-secondary opacity-50" />
              <p className="text-sm text-secondary">No accounts connected yet</p>
            </div>
          </div>
        )}

        {/* Primary Action */}
        <div className="mt-auto">
          {status?.canConnect ? (
            <Button
              color="primary"
              size="lg"
              onClick={() => handleOpenConnectPage()}
              className="w-full"
            >
              <Plus className="mr-2" />
              {status?.items && status.items.length > 0 ? "Connect Account" : "Connect First Account"}
            </Button>
          ) : (
            <p className="text-xs text-center text-warning">
              Account limit reached ({status?.planLimits.current}/{status?.planLimits.maxFormatted})
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="antialiased w-full relative bg-transparent text-default p-8"
      style={{
        maxHeight: maxHeight ?? undefined,
        height: maxHeight ?? undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-surface-secondary text-secondary">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="heading-lg mb-1">Manage Financial Accounts</h2>
            <p className="text-secondary text-sm">
              {status?.items && status.items.length > 0
                ? `${status.planLimits.current} of ${status.planLimits.maxFormatted} accounts connected`
                : "Connect your first financial account"}
            </p>
          </div>
        </div>

      </div>

      {/* Error Messages */}
      {errorMessage && (
        <div className="mb-6">
          <Alert
            color="danger"
            description={errorMessage}
            actions={
              <Button size="sm" variant="soft" color="danger" onClick={() => setErrorMessage(null)}>
                Dismiss
              </Button>
            }
          />
        </div>
      )}

      {/* Connected Items List */}
      {status?.items && status.items.length > 0 ? (
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-3 text-secondary">
            Connected Accounts
          </h3>
          <div className="space-y-3">
            {status.items.map((item) => {
              const actionRequired = getItemActionRequired(item);

              return (
                <AnimateLayout>
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-subtle bg-surface hover:border-default transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 gap-3">
                        <div className="p-2 rounded-lg bg-surface-secondary text-secondary">
                          <InstitutionLogo logo={item.institutionLogo} size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{item.institutionName || "Financial Institution"}</p>
                            {getStatusBadge(item)}
                          </div>
                          <p className="text-xs text-secondary">
                            {item.accountCount} {item.accountCount === 1 ? "account" : "accounts"} • Connected {new Date(item.connectedAt).toLocaleDateString()}
                          </p>

                          {/* Show action-specific message */}
                          {actionRequired && (
                            <p className={cn("text-xs mt-1", ACTION_TYPE_TEXT_COLORS[actionRequired.type])}>
                              {actionRequired.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {/* Show update button if action required */}
                        {actionRequired && (
                          <Button
                            variant="soft"
                            size="sm"
                            color={ACTION_TYPE_COLORS[actionRequired.type]}
                            onClick={() => handleOpenConnectPage(
                              item.id,
                              actionRequired.type === 'new_accounts' ? 'new_accounts' : undefined
                            )}
                          >
                            {actionRequired.actionLabel}
                          </Button>
                        )}
                        {actionRequired?.type === 'new_accounts' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            color="secondary"
                            onClick={() => handleDismissNewAccounts(item.id)}
                          >
                            Dismiss
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          color="danger"
                          size="sm"
                          onClick={() => handleOpenConnectPage(item.id, 'delete')}
                          className="shrink-0"
                        >
                          <Trash className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </AnimateLayout>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyMessage className="mb-8">
          <EmptyMessage.Icon color="secondary">
            <CreditCard />
          </EmptyMessage.Icon>
          <EmptyMessage.Title>No accounts connected</EmptyMessage.Title>
          <EmptyMessage.Description>Connect your first financial account to get started</EmptyMessage.Description>
        </EmptyMessage>
      )}

      {/* Plan Status & Actions */}
      <div className="space-y-6">
        {/* Plan Progress */}
        {status?.planLimits && (
          <div className="p-4 rounded-xl bg-surface-secondary border border-subtle">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-default">
                {status.planLimits.planName.charAt(0).toUpperCase() + status.planLimits.planName.slice(1)} Plan
              </span>
              <span className="text-sm text-secondary">
                {status.planLimits.current} / {status.planLimits.maxFormatted} accounts
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-surface-tertiary">
              <div
                className="h-full bg-success transition-all duration-300"
                style={{
                  // Handle Infinity max (enterprise plan) - show full bar or based on current
                  width: status.planLimits.max === Infinity || !isFinite(status.planLimits.max)
                    ? (status.planLimits.current > 0 ? '10%' : '0%') // Show minimal progress for unlimited
                    : `${Math.min((status.planLimits.current / status.planLimits.max) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status?.canConnect ? (
            <Button
              color="primary"
              size="lg"
              onClick={() => handleOpenConnectPage()}
              className="flex-1 h-12"
            >
              <Plus className="mr-2" />
              {status.items && status.items.length > 0 ? "Connect Another Account" : "Connect Your First Account"}
            </Button>
          ) : (
            <div className="flex-1 flex gap-4 items-center p-4 rounded-xl border border-warning bg-surface-secondary">
              <div className="flex-1">
                <p className="font-semibold text-warning mb-1">
                  Account Limit Reached
                </p>
                <p className="text-sm text-secondary">
                  {status?.planLimits?.subscriptionsEnabled === false
                    ? `You've reached the maximum of ${status.planLimits.max} free accounts. Remove an existing connection to add a new one.`
                    : "Remove an account or upgrade your plan to connect more."}
                </p>
              </div>
              {status?.planLimits?.subscriptionsEnabled !== false && (
                <ButtonLink
                  href="/pricing"
                  color="primary"
                  size="md"
                >
                  Upgrade Plan
                </ButtonLink>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Features (show if no items connected) */}
      {status?.items?.length === 0 && (
        <div className="mt-8 pt-8 border-t border-subtle">
          <p className="font-semibold mb-4 text-default">
            What you'll get:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-1 rounded bg-success-surface shrink-0 mt-0.5">
                  <feature.icon className="w-4 h-4 text-success" />
                </div>
                <span className="text-sm text-secondary leading-snug">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
