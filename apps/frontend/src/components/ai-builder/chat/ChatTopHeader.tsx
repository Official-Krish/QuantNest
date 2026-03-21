import { ArrowUpRight, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cx, type LocalTheme } from "./shared";

type ChatTopHeaderProps = {
  border: string;
  muted: string;
  heading: string;
  theme: LocalTheme;
  title: string;
  canOpenBuilder: boolean;
  onGoHome: () => void;
  onOpenSetup: () => void;
};

export function ChatTopHeader({
  border,
  muted,
  heading,
  theme,
  title,
  canOpenBuilder,
  onGoHome,
  onOpenSetup,
}: ChatTopHeaderProps) {
  return (
    <div className={cx("border-b px-4 py-2.5", border)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onGoHome}
            className={cx(
              "flex h-7 w-7 items-center justify-center rounded-lg border cursor-pointer",
              theme === "dark" ? "border-neutral-700 bg-[#111111] text-neutral-300" : "border-neutral-200 bg-white text-neutral-600",
            )}
          >
            <Home className="h-3.5 w-3.5" />
          </button>
          <div>
            <div className={cx("flex items-center gap-2 text-[13px] font-medium", heading)}>
              <Sparkles className="h-4 w-4 text-[#f17463]" />
              {title}
            </div>
            <div className={cx("mt-0.5 text-[11px]", muted)}>AI Strategy Builder</div>
          </div>
        </div>

        <Button
          onClick={onOpenSetup}
          disabled={!canOpenBuilder}
          className="h-9 rounded-2xl bg-black px-4 text-[13px] text-white hover:bg-[#111111] cursor-pointer"
        >
          Open in Builder
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
