"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@openai/apps-sdk-ui/components/Button";

interface ErrorFallbackProps {
  error?: string;
  onRetry: () => void;
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 gap-4 min-h-[200px]">
      <AlertCircle className="w-12 h-12 text-warning" />
      <div className="text-center space-y-1">
        <p className="text-primary font-medium">Something went wrong</p>
        {error && (
          <p className="text-secondary text-sm max-w-[280px]">{error}</p>
        )}
      </div>
      <Button variant="outline" color="secondary" onClick={onRetry} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}

interface WidgetErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging - could be sent to an error tracking service
    console.error("[WidgetErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback
          error={this.state.error?.message}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Export the fallback separately for custom use cases
export { ErrorFallback };
