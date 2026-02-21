'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePlaidLink } from 'react-plaid-link';
import {
  createPlaidLinkToken,
  checkPlanLimit,
  getConnectedItems,
  removeItem,
  dismissNewAccounts
} from './actions';
import { useTheme } from '@/src/mcp-ui-hooks';
import { cn } from '@/lib/utils/cn';
import {
  Business,
  Plus,
  Trash,
  Reload,
  Error as ErrorIcon,
  CheckCircle,
  Clock,
  Trending,
  ShieldCheck,
  Flash
} from '@openai/apps-sdk-ui/components/Icon';
import { Button, ButtonLink } from "@openai/apps-sdk-ui/components/Button";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";

interface PlaidLinkPageProps {
  linkToken: string | null;
  error: string | null;
  updateModeItemId?: string | null;
}

interface ConnectedItem {
  id: string;
  itemId: string;
  institutionId: string | null;
  institutionName: string | null;
  institutionLogo?: string | null;
  status: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  consentExpiresAt?: string | null;
  newAccountsAvailable?: { detectedAt: string; dismissed?: boolean } | null;
  createdAt?: string;
  accountCount?: number;
}

interface DeletionInfo {
  canDelete: boolean;
  daysUntilNext?: number;
}

interface PlanInfo {
  current: number;
  max: number;
  maxFormatted: string;
  plan: string;
  subscriptionsEnabled?: boolean;
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

function formatAccountSummary(accountCount: number | undefined, createdAt: string | undefined): string {
  const countPart = accountCount !== undefined && accountCount > 0
    ? `${accountCount} ${accountCount === 1 ? 'account' : 'accounts'} \u2022 `
    : '';
  const datePart = `Connected ${createdAt ? new Date(createdAt).toLocaleDateString() : 'recently'}`;
  return `${countPart}${datePart}`;
}

/**
 * Reusable full-page centered status screen used by delete mode and update mode.
 */
function StatusPage({
  pageBackground,
  icon,
  iconBg,
  title,
  description,
  children,
}: {
  pageBackground: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={pageBackground}>
      <div className="max-w-md w-full text-center">
        <div className={cn("mb-6 p-4 rounded-full inline-flex", iconBg)}>
          {icon}
        </div>
        <h1 className="text-2xl font-bold mb-3 text-default">{title}</h1>
        <p className="text-secondary mb-8">{description}</p>
        {children}
      </div>
    </div>
  );
}

export default function ConnectBankClient() {
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isDark = theme === 'dark';

  // Mode detection from URL params
  const itemIdParam = searchParams.get('itemId');
  const modeParam = searchParams.get('mode');
  const isDeleteMode = modeParam === 'delete' && itemIdParam !== null;
  const isUpdateMode = itemIdParam !== null && !isDeleteMode;

  const pageBackground = cn(
    "min-h-screen flex items-center justify-center p-4",
    isDark ? "bg-linear-to-br from-gray-900 to-gray-800" : "bg-linear-to-br from-gray-50 to-gray-100"
  );

  const [pageData, setPageData] = useState<PlaidLinkPageProps>({
    linkToken: null,
    error: null,
    updateModeItemId: null,
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [connectedItems, setConnectedItems] = useState<ConnectedItem[]>([]);
  const [deletionInfo, setDeletionInfo] = useState<DeletionInfo | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [updateLinkError, setUpdateLinkError] = useState<string | null>(null);
  const limitCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const connectedItemsRef = useRef(connectedItems.length);

  const authNonce = searchParams.get('nonce');

  const stopPolling = () => {
    if (limitCheckInterval.current) {
      clearInterval(limitCheckInterval.current);
      limitCheckInterval.current = null;
    }
  };

  // Load connected items
  const loadConnectedItems = async () => {
    try {
      const result = await getConnectedItems(authNonce || undefined);
      if (result.success) {
        setConnectedItems(result.items);
        setDeletionInfo(result.deletionInfo);
        setPlanInfo(result.planInfo);
      }
    } catch (error) {
      console.error('[Connect Bank] Error loading items:', error);
    } finally {
      setItemsLoaded(true);
    }
  };

  useEffect(() => {
    loadConnectedItems();
  }, [authNonce]);

  // Keep ref in sync with connectedItems
  useEffect(() => {
    connectedItemsRef.current = connectedItems.length;
  }, [connectedItems]);

  // Delete mode ref (no auto-trigger; user confirms via inline UI)
  const deleteTriggered = useRef(false);

  // Initialize link token (only when user clicks connect, not on page load)
  const initializeLinkToken = async () => {
    try {
      console.log('[Connect Bank] Fetching Plaid link token...');

      const linkTokenResult = await createPlaidLinkToken(
        authNonce || undefined,
        itemIdParam || undefined,
        modeParam || undefined
      );

      if (!linkTokenResult.success) {
        // Don't block the entire page - just show error on left side
        if (linkTokenResult.error.includes('Account limit reached')) {
          setLimitReached(true);
          return;
        }
        if (linkTokenResult.error.includes('Authentication required')) {
          throw new Error('Please sign in first. Return to ChatGPT and authenticate.');
        }
        throw new Error(linkTokenResult.error);
      }

      setPageData({ linkToken: linkTokenResult.linkToken, error: null });
    } catch (error) {
      setPageData({
        linkToken: null,
        error: error instanceof Error ? error.message : 'Failed to load'
      });
    }
  };

  // Load link token on mount (but don't fail if at limit)
  useEffect(() => {
    initializeLinkToken();
  }, [authNonce]);

  const { open, ready, exit } = usePlaidLink({
    token: pageData.linkToken || '',
    onSuccess: async (public_token, metadata) => {
      console.log('Plaid Link onSuccess (Multi-Item Link):', { metadata });
      stopPolling();

      const institutionName = metadata?.institution?.name || 'Account';

      // Show success and reload items
      setIsSuccess(true);
      setUpdateLinkError(null);

      if (isUpdateMode) {
        const modeMessages: Record<string, string> = {
          error: `${institutionName} has been re-authenticated successfully.`,
          expiring: `Your access to ${institutionName} has been renewed.`,
          new_accounts: `New accounts from ${institutionName} have been added.`,
        };
        setSuccessMessage(modeMessages[modeParam || 'error'] || `${institutionName} has been updated.`);
      } else {
        setSuccessMessage(
          pageData.updateModeItemId
            ? `${institutionName} has been re-authenticated!`
            : `${institutionName} has been connected!`
        );
      }

      // Reload connected items after a short delay (only auto-dismiss for normal mode)
      if (!isUpdateMode) {
        setTimeout(() => {
          loadConnectedItems();
          setIsSuccess(false);
          setSuccessMessage(null);
        }, 2000);
      } else {
        loadConnectedItems();
      }
    },
    onExit: (err, metadata) => {
      console.log('Plaid Link exit:', err, metadata);
      stopPolling();

      if (err != null) {
        const errorMsg = err.display_message || err.error_message || 'Connection failed';
        if (isUpdateMode) {
          setUpdateLinkError(errorMsg);
        } else {
          setPageData((prev) => ({
            ...prev,
            error: errorMsg,
          }));
        }
      } else if (metadata?.status === 'requires_questions') {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          loadConnectedItems();
        }, 2000);
      }
    },
  });

  // Poll for plan limits while Link is open
  useEffect(() => {
    const checkLimit = async () => {
      try {
        const result = await checkPlanLimit(authNonce || undefined);

        if (result.success) {
          // Check for new items (Multi-Item Link updates)
          // We use a ref for current count to avoid stale closures in the interval
          if (result.itemCount > connectedItemsRef.current) {
            console.log('[Connect Bank] Detected new item, refreshing list...');
            await loadConnectedItems();
          }

          if (result.limitReached) {
            console.log('[Connect Bank] Plan limit reached, closing Link');
            setLimitReached(true);
            if (exit) exit({ force: true });
            stopPolling();
          }
        } else {
          console.error('[Connect Bank] Plan limit check failed:', result.error);
        }
      } catch (error) {
        console.error('[Connect Bank] Error checking plan limit:', error);
      }
    };

    if (!ready) return;

    checkLimit();
    limitCheckInterval.current = setInterval(checkLimit, 2000);

    return stopPolling;
  }, [ready, exit, authNonce]);

  const handleConnect = () => {
    if (ready) {
      open();
    }
  };

  const handleUpdateItem = async (itemId: string, mode?: string) => {
    try {
      // Create link token for update mode
      const result = await createPlaidLinkToken(authNonce || undefined, itemId, mode);

      if (!result.success) {
        setPageData((prev) => ({ ...prev, error: result.error }));
        return;
      }

      setPageData({
        linkToken: result.linkToken,
        error: null,
        updateModeItemId: itemId,
      });

      // Open link in update mode
      if (ready) {
        open();
      }
    } catch (error) {
      console.error('[Connect Bank] Error updating item:', error);
      setPageData((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start update'
      }));
    }
  };

  const handleDeleteItem = async (itemId: string, institutionName: string | null, skipConfirm = false) => {
    if (!skipConfirm && !confirm(`Are you sure you want to disconnect ${institutionName || 'this account'}?`)) {
      return;
    }

    setDeletingItemId(itemId);
    setPageData((prev) => ({ ...prev, error: null }));

    try {
      const result = await removeItem(itemId, authNonce || undefined);

      if (result.success) {
        setSuccessMessage(`Successfully disconnected ${institutionName || 'account'}`);
        await loadConnectedItems();
      } else {
        setPageData((prev) => ({ ...prev, error: result.error }));
      }
    } catch (error) {
      setPageData((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to disconnect account'
      }));
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleDismissNewAccounts = async (itemId: string) => {
    try {
      const result = await dismissNewAccounts(itemId, authNonce || undefined);
      if (result.success) {
        await loadConnectedItems();
      } else {
        setPageData((prev) => ({ ...prev, error: result.error }));
      }
    } catch (error) {
      console.error('[Connect Bank] Error dismissing new accounts:', error);
    }
  };

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
          return (
            <Badge color="danger" size="sm">
              <ErrorIcon className="w-3 h-3 mr-1" />
              Action Required
            </Badge>
          );
        case 'new_accounts':
          return (
            <Badge color="info" size="sm">
              New Accounts
            </Badge>
          );
        case 'expiring':
          return (
            <Badge color="warning" size="sm">
              <Clock className="w-3 h-3 mr-1" />
              Expiring Soon
            </Badge>
          );
      }
    }

    switch (item.status) {
      case 'active':
        return (
          <Badge color="success" size="sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge color="warning" size="sm">
            <Clock className="w-3 h-3 mr-1" />
            Connecting...
          </Badge>
        );
      default:
        return null;
    }
  };

  // === Delete Mode: Focused single-column layout (mirrors update mode) ===
  if (isDeleteMode) {
    const deleteTargetItem = connectedItems.find(i => i.id === itemIdParam);

    // Loading state
    if (!itemsLoaded) {
      return (
        <div className={pageBackground}>
          <div className="text-center">
            <div className="mb-4 mx-auto w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-secondary" />
            <p className="text-secondary text-sm">Loading account details...</p>
          </div>
        </div>
      );
    }

    // Success state after deletion
    if (successMessage) {
      return (
        <StatusPage
          pageBackground={pageBackground}
          icon={<CheckCircle className="w-12 h-12 text-success" />}
          iconBg="bg-success-soft"
          title="Account Disconnected"
          description={successMessage}
        >
          <Button onClick={() => window.close()} color="success" size="xl" block>
            Return to ChatGPT
          </Button>
        </StatusPage>
      );
    }

    // Error state
    if (pageData.error) {
      return (
        <StatusPage
          pageBackground={pageBackground}
          icon={<ErrorIcon className="w-12 h-12 text-danger" />}
          iconBg="bg-danger-soft"
          title="Disconnection Failed"
          description={pageData.error}
        >
          <div className="space-y-3">
            <Button
              onClick={() => {
                setPageData(prev => ({ ...prev, error: null }));
                deleteTriggered.current = false;
              }}
              color="danger"
              size="xl"
              block
            >
              Try Again
            </Button>
            <Button onClick={() => window.close()} variant="ghost" color="secondary" size="lg" block>
              Return to ChatGPT
            </Button>
          </div>
        </StatusPage>
      );
    }

    // Item not found
    if (!deleteTargetItem) {
      return (
        <StatusPage
          pageBackground={pageBackground}
          icon={<Business className="w-12 h-12 text-tertiary" />}
          iconBg="bg-surface-secondary"
          title="Account Not Found"
          description="This account could not be found. It may have already been disconnected."
        >
          <Button onClick={() => window.close()} variant="ghost" color="secondary" size="xl" block>
            Return to ChatGPT
          </Button>
        </StatusPage>
      );
    }

    // Inline confirmation (matches update mode layout: top bar + centered card + item detail)
    const institutionName = deleteTargetItem.institutionName || 'Financial Institution';
    return (
      <div className={cn("min-h-screen flex flex-col p-4", isDark ? "bg-linear-to-br from-gray-900 to-gray-800" : "bg-linear-to-br from-gray-50 to-gray-100")}>
        {/* Top bar */}
        <div className="flex justify-end mb-8">
          <Button
            variant="ghost"
            color="secondary"
            onClick={() => window.close()}
          >
            Return to ChatGPT
          </Button>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4 p-4 rounded-full inline-flex bg-danger-soft">
                <Trash className={cn("w-10 h-10 text-danger", deletingItemId && "animate-pulse")} />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-default">Disconnect Account</h1>
              <Badge color="danger">Permanent Action</Badge>
            </div>

            {/* Item card */}
            <div className="p-4 rounded-lg border mb-6 bg-surface border-subtle">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-surface-secondary text-secondary">
                  <InstitutionLogo logo={deleteTargetItem.institutionLogo} size={20} />
                </div>
                <div>
                  <p className="font-medium text-default">{institutionName}</p>
                  <p className="text-xs text-secondary">
                    {formatAccountSummary(deleteTargetItem.accountCount, deleteTargetItem.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-secondary text-sm mb-8 text-center">
              This will revoke data access from {institutionName} and stop syncing transactions. Your existing transaction history will remain available.
            </p>

            {/* Action buttons */}
            <Button
              onClick={() => handleDeleteItem(deleteTargetItem.id, deleteTargetItem.institutionName, true)}
              disabled={!!deletingItemId}
              color="danger"
              size="xl"
              block
            >
              {deletingItemId ? 'Disconnecting...' : `Disconnect ${institutionName}`}
            </Button>

            <Button
              onClick={() => window.close()}
              disabled={!!deletingItemId}
              variant="ghost"
              color="secondary"
              size="lg"
              block
              className="mt-3"
            >
              Cancel
            </Button>

            {/* Footer hint */}
            <p className="text-xs text-tertiary text-center mt-4">
              You can reconnect this account at any time through ChatGPT.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === Update Mode: Focused single-column layout ===
  if (isUpdateMode) {
    const updateTargetItem = connectedItems.find(i => i.id === itemIdParam);
    const targetAction = updateTargetItem ? getItemActionRequired(updateTargetItem) : null;
    const effectiveMode = modeParam || targetAction?.type || 'error';

    const modeConfig = {
      error: {
        title: 'Fix Your Bank Connection',
        Icon: ErrorIcon,
        badgeText: 'Action Required',
        badgeColor: 'danger' as const,
        buttonText: 'Fix Connection',
        buttonColor: 'danger' as const,
        iconColor: 'text-danger',
        bgColor: 'bg-danger-soft',
        getExplanation: (name: string) =>
          `Your ${name} connection has stopped working. Your bank requires you to sign in again to restore access.`,
      },
      expiring: {
        title: 'Renew Your Bank Connection',
        Icon: Clock,
        badgeText: 'Expiring Soon',
        badgeColor: 'warning' as const,
        buttonText: 'Renew Access',
        buttonColor: 'warning' as const,
        iconColor: 'text-warning',
        bgColor: 'bg-warning-soft',
        getExplanation: (name: string) => {
          if (updateTargetItem?.consentExpiresAt) {
            const days = Math.ceil(
              (new Date(updateTargetItem.consentExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return `Your access to ${name} expires in ${days} ${days === 1 ? 'day' : 'days'}. Without renewal, we can no longer sync your financial data.`;
          }
          return `Your access to ${name} is expiring soon. Without renewal, we can no longer sync your financial data.`;
        },
      },
      new_accounts: {
        title: 'Add New Accounts',
        Icon: Plus,
        badgeText: 'New Accounts',
        badgeColor: 'info' as const,
        buttonText: 'Add Accounts',
        buttonColor: 'info' as const,
        iconColor: 'text-info',
        bgColor: 'bg-info-soft',
        getExplanation: (name: string) =>
          `We detected new accounts at ${name} that aren't currently linked. Choose which to add.`,
      },
    };

    const config = modeConfig[effectiveMode as keyof typeof modeConfig] || modeConfig.error;
    const institutionName = updateTargetItem?.institutionName || 'your bank';

    // Update mode: Loading state
    if (!itemsLoaded) {
      return (
        <div className={pageBackground}>
          <div className="text-center">
            <div className="mb-4 mx-auto w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-secondary" />
            <p className="text-secondary text-sm">Preparing your bank connection...</p>
          </div>
        </div>
      );
    }

    // Update mode: Success state (after Plaid Link completes)
    if (isSuccess && successMessage) {
      return (
        <StatusPage
          pageBackground={pageBackground}
          icon={<CheckCircle className="w-12 h-12 text-success" />}
          iconBg="bg-success-soft"
          title="All Done"
          description={successMessage}
        >
          <Button onClick={() => window.close()} color="success" size="xl" block>
            Return to ChatGPT
          </Button>
        </StatusPage>
      );
    }

    // Update mode: Error state (after Plaid Link exits with error)
    if (updateLinkError) {
      return (
        <StatusPage
          pageBackground={pageBackground}
          icon={<ErrorIcon className="w-12 h-12 text-danger" />}
          iconBg="bg-danger-soft"
          title="Connection Failed"
          description={updateLinkError}
        >
          <div className="space-y-3">
            <Button
              onClick={() => {
                setUpdateLinkError(null);
                initializeLinkToken();
              }}
              color="danger"
              size="xl"
              block
            >
              Try Again
            </Button>
            <Button onClick={() => window.close()} variant="ghost" color="secondary" size="lg" block>
              Return to ChatGPT
            </Button>
          </div>
        </StatusPage>
      );
    }

    // Update mode: Already fixed
    if (updateTargetItem && updateTargetItem.status === 'active' && !targetAction) {
      return (
        <StatusPage
          pageBackground={pageBackground}
          icon={<CheckCircle className="w-12 h-12 text-success" />}
          iconBg="bg-success-soft"
          title="Already Working"
          description={`Your ${updateTargetItem.institutionName || 'bank'} connection is working correctly. No action is needed.`}
        >
          <Button onClick={() => window.close()} color="success" size="xl" block>
            Return to ChatGPT
          </Button>
        </StatusPage>
      );
    }

    // Update mode: Item not found
    if (!updateTargetItem) {
      return (
        <StatusPage
          pageBackground={pageBackground}
          icon={<Business className="w-12 h-12 text-tertiary" />}
          iconBg="bg-surface-secondary"
          title="Connection Not Found"
          description="This bank connection could not be found. It may have been removed or is no longer available."
        >
          <Button onClick={() => window.close()} variant="ghost" color="secondary" size="xl" block>
            Return to ChatGPT
          </Button>
        </StatusPage>
      );
    }

    // Update mode: Action needed (primary state)
    const ModeIcon = config.Icon;
    return (
      <div className={cn("min-h-screen flex flex-col p-4", isDark ? "bg-linear-to-br from-gray-900 to-gray-800" : "bg-linear-to-br from-gray-50 to-gray-100")}>
        {/* Top bar */}
        <div className="flex justify-end mb-8">
          <Button
            variant="ghost"
            color="secondary"
            onClick={() => window.close()}
          >
            Return to ChatGPT
          </Button>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className={cn("mb-4 p-4 rounded-full inline-flex", config.bgColor)}>
                <ModeIcon className={cn("w-10 h-10", config.iconColor)} />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-default">{config.title}</h1>
              <Badge color={config.badgeColor}>{config.badgeText}</Badge>
            </div>

            {/* Item card */}
            <div className="p-4 rounded-lg border mb-6 bg-surface border-subtle">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-surface-secondary text-secondary">
                  <InstitutionLogo logo={updateTargetItem.institutionLogo} size={20} />
                </div>
                <div>
                  <p className="font-medium text-default">{updateTargetItem.institutionName || 'Financial Institution'}</p>
                  <p className="text-xs text-secondary">
                    {formatAccountSummary(updateTargetItem.accountCount, updateTargetItem.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-secondary text-sm mb-8 text-center">
              {config.getExplanation(institutionName)}
            </p>

            {/* Action button */}
            <Button
              onClick={handleConnect}
              disabled={!ready}
              color={config.buttonColor}
              size="xl"
              block
            >
              {!ready ? 'Preparing...' : config.buttonText}
            </Button>

            {/* Footer hint */}
            <p className="text-xs text-tertiary text-center mt-4">
              Opens a secure window via Plaid to verify your identity.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Only show full-page error for critical issues (not limit reached)
  if (pageData.error && !pageData.error.includes('Account limit')) {
    return (
      <div className={pageBackground}>
        <div className={cn("max-w-md w-full rounded-xl shadow-2xl p-8 border", isDark ? "bg-gray-800 border-red-500/30" : "bg-white border-red-300")}>
          <div className="text-center">
            <div className="mb-6">
              <svg className={cn("w-20 h-20 mx-auto", isDark ? "text-red-400" : "text-red-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className={cn("text-2xl font-bold mb-3", isDark ? "text-white" : "text-black")}>Unable to Connect</h1>
            <p className={cn("mb-6", isDark ? "text-red-300" : "text-red-700")}>{pageData.error}</p>
            <button onClick={() => window.close()} className={cn("inline-block font-semibold py-3 px-6 rounded-lg transition-all", isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-black")}>
              Return to ChatGPT
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen p-6", isDark ? "bg-linear-to-br from-gray-900 to-gray-800" : "bg-linear-to-br from-gray-50 to-gray-100")}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className={cn("text-3xl font-bold", isDark ? "text-white" : "text-black")}>
            Manage Financial Accounts
          </h1>
          <Button
            variant="ghost"
            color="secondary"
            onClick={() => window.close()}
          >
            Return to ChatGPT
          </Button>
        </div>

        {/* Success Message */}
        {(successMessage || isSuccess) && (
          <div className="mb-6 p-4 rounded-lg border flex items-start bg-success-soft border-success-surface">
            <CheckCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-success" />
            <p className="text-sm font-medium text-success-soft">
              {successMessage || 'Account connected successfully!'}
            </p>
          </div>
        )}

        {/* Limit Reached Message */}
        {limitReached && (
          <div className="mb-6 p-4 rounded-lg border flex items-start bg-warning-soft border-warning-surface">
            <ErrorIcon className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-warning" />
            <div className="flex-1">
              <p className="text-sm font-medium text-warning">
                Account limit reached ({planInfo?.current}/{planInfo?.maxFormatted})
              </p>
              <p className="text-xs mt-1 text-warning-soft">
                {planInfo?.subscriptionsEnabled === false
                  ? 'Remove an existing connection to add a new one.'
                  : 'Remove an account or upgrade your plan to connect more.'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Connect New Account */}
          <div className="rounded-xl shadow-lg p-6 border bg-surface border-subtle">
            <div className="flex items-start mb-6">
              <div className="p-3 rounded-xl mr-4 shrink-0 bg-success-soft">
                <Plus className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1 text-default">Connect New Account</h2>
                <p className="text-sm text-secondary">
                  {planInfo ? `${planInfo.current} of ${planInfo.maxFormatted} accounts connected` : 'Loading...'}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="mb-6 p-4 rounded-lg border bg-surface-secondary border-subtle">
              <p className="text-sm font-semibold mb-3 text-default">
                What you'll get:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <feature.icon className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-success" />
                    <span className="text-sm text-secondary">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Progress */}
            {planInfo && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-secondary">
                    {planInfo.plan.charAt(0).toUpperCase() + planInfo.plan.slice(1)} Plan
                  </span>
                  <span className="text-sm text-tertiary">
                    {planInfo.current} / {planInfo.maxFormatted}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-surface-tertiary">
                  <div
                    className="h-full bg-success transition-all duration-300"
                    style={{
                      width: `${Math.min((planInfo.current / planInfo.max) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={!ready || limitReached}
              color="success"
              size="xl"
              block
            >
              {limitReached ? 'Limit Reached' : !ready ? 'Loading...' : 'Connect Bank Account'}
            </Button>

            {limitReached && planInfo?.subscriptionsEnabled !== false && (
              <ButtonLink
                href="/pricing"
                color="primary"
                size="xl"
                block
                className="mt-3"
              >
                Upgrade Plan
              </ButtonLink>
            )}
          </div>

          {/* Right: Connected Accounts */}
          <div className="rounded-xl shadow-lg p-6 border bg-surface border-subtle">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start">
                <div className="p-3 rounded-xl mr-4 shrink-0 bg-info-soft">
                  <Business className="h-6 w-6 text-info" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1 text-default">Connected Accounts</h2>
                  <p className="text-sm text-secondary">
                    {connectedItems.length} account{connectedItems.length !== 1 ? 's' : ''} connected
                  </p>
                </div>
              </div>
            </div>

            {/* Deletion Rate Limit Warning */}
            {deletionInfo && !deletionInfo.canDelete && (
              <div className="mb-4 p-3 rounded-lg border bg-warning-soft border-warning-surface">
                <div className="flex items-start">
                  <Clock className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-warning" />
                  <p className="text-xs text-warning-soft">
                    Next deletion available in {deletionInfo.daysUntilNext} days
                  </p>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {connectedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Business className="w-12 h-12 mx-auto mb-3 opacity-50 text-tertiary" />
                  <p className="text-sm text-secondary">No accounts connected yet</p>
                  <p className="text-xs mt-1 text-tertiary">Connect your first account to get started</p>
                </div>
              ) : (
                connectedItems.map((item) => {
                  const actionRequired = getItemActionRequired(item);

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border bg-surface-secondary border-subtle"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-secondary"><InstitutionLogo logo={item.institutionLogo} size={16} /></span>
                            <p className="font-medium text-default">{item.institutionName || 'Financial Institution'}</p>
                            {getStatusBadge(item)}
                          </div>
                          <p className="text-xs text-secondary">
                            {formatAccountSummary(item.accountCount, item.createdAt)}
                          </p>
                          {actionRequired && (
                            <p className={cn("text-xs mt-2", ACTION_TYPE_TEXT_COLORS[actionRequired.type])}>
                              {actionRequired.message}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          {actionRequired && (
                            <Button
                              variant="ghost"
                              size="sm"
                              color={ACTION_TYPE_COLORS[actionRequired.type]}
                              onClick={() => handleUpdateItem(
                                item.id,
                                actionRequired.type === 'new_accounts' ? 'new_accounts' : undefined
                              )}
                              title={actionRequired.actionLabel}
                            >
                              <Reload className="w-4 h-4" />
                              <span className="ml-1 text-xs">{actionRequired.actionLabel}</span>
                            </Button>
                          )}
                          {actionRequired?.type === 'new_accounts' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              color="secondary"
                              onClick={() => handleDismissNewAccounts(item.id)}
                              title="Dismiss"
                            >
                              <span className="text-xs">Dismiss</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            color="danger"
                            onClick={() => handleDeleteItem(item.id, item.institutionName)}
                            disabled={deletingItemId === item.id || (deletionInfo !== null && !deletionInfo.canDelete)}
                            title={
                              deletionInfo && !deletionInfo.canDelete
                                ? `Next deletion available in ${deletionInfo.daysUntilNext} days`
                                : "Disconnect account"
                            }
                          >
                            {deletingItemId === item.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                            ) : (
                              <Trash className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
