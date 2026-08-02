import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  message = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorStateProps) => (
  <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
      <AlertTriangle className="h-5 w-5 text-red-400" />
    </div>
    <div>
      <p className="text-sm font-medium text-red-200">{message}</p>
      <p className="mt-1 text-xs text-red-400">{description}</p>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/10"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    )}
  </div>
);
