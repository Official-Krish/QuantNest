import { ArrowUpRight, Eye, EyeOff, Home } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cx, type LocalTheme } from "./shared";

type ChatTopHeaderProps = {
  border: string;
  muted: string;
  heading: string;
  theme: LocalTheme;
  compact?: boolean;
  title: string;
  canOpenBuilder: boolean;
  canTogglePreview: boolean;
  showPreview: boolean;
  onGoHome: () => void;
  onOpenSetup: () => void;
  onTogglePreview: () => void;
};

export function ChatTopHeader({
  border,
  muted,
  heading,
  theme,
  compact = false,
  title,
  canOpenBuilder,
  canTogglePreview,
  showPreview,
  onGoHome,
  onOpenSetup,
  onTogglePreview,
}: ChatTopHeaderProps) {
  return (
    <div className={cx("border-b px-5 py-3", border)}>
      <div className={cx("mx-auto flex w-full min-w-0 items-center justify-between gap-4", compact ? "max-w-245" : "max-w-295")}>
        <div className="flex min-w-0 items-center gap-2.5">
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
          <div className="min-w-0">
            <div className={cx("flex items-center gap-2 text-[14px] font-semibold", heading)}>
              <span className="truncate">{title}</span>
            </div>
            <div className={cx("mt-0.5 text-[12px]", muted)}>AI Strategy Builder</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canTogglePreview ? (
            <motion.button
              type="button"
              onClick={onTogglePreview}
              className={cx(
                "flex h-10 items-center gap-1.5 rounded-2xl border px-3 text-[12px] cursor-pointer",
                theme === "dark"
                  ? "border-neutral-700 bg-black text-neutral-300 hover:border-[#f17463]/50 hover:text-[#f17463]"
                  : "border-neutral-300 bg-white text-neutral-600 hover:border-[#f17463]/40 hover:text-[#f17463]",
              )}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.16 }}
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </motion.button>
          ) : null}

          <Button
            onClick={onOpenSetup}
            disabled={!canOpenBuilder}
            className="h-10 rounded-2xl bg-black px-4 text-[13px] text-white hover:bg-[#111111] cursor-pointer"
          >
            Open in Builder
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
