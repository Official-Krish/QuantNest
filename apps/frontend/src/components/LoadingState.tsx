import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "card";
  height?: "sm" | "md" | "lg" | string;
  className?: string;
}

const spinnerSizes = {
  sm: "h-4 w-4 border-[1.5px]",
  md: "h-5 w-5 border-2",
  lg: "h-6 w-6 border-2",
};

const heights: Record<string, string> = {
  sm: "h-40",
  md: "h-64",
  lg: "min-h-80",
};

export const LoadingState = ({
  message,
  size = "md",
  variant = "default",
  height = "sm",
  className,
}: LoadingStateProps) => {
  const textColor =
    height === "md" || height === "lg" ? "text-zinc-500" : "text-neutral-400";

  const spinner = (
    <span
      className={cn(
        "animate-spin rounded-full border-neutral-600 border-t-transparent",
        spinnerSizes[size],
      )}
    />
  );

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-[1.75rem] border border-neutral-800 bg-neutral-950/70 p-8 text-sm text-neutral-400",
          className,
        )}
      >
        {message ?? "Loading..."}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center text-sm",
        heights[height] ?? height,
        textColor,
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {spinner}
        <span>{message ?? "Loading..."}</span>
      </div>
    </div>
  );
};
