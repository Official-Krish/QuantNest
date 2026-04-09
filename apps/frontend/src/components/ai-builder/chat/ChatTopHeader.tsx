import { ArrowUpRight, Home, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cx, type LocalTheme } from "./shared";
import { useNavigate } from "react-router-dom";
import { OrangeButton } from "@/components/ui/button-orange";

type ChatTopHeaderProps = {
  border: string;
  muted: string;
  heading: string;
  theme: LocalTheme;
  compact?: boolean;
  title: string;
  canOpenBuilder: boolean;
  canShareChat: boolean;
  onGoHome: () => void;
  onOpenSetup: () => void;
  onImportChat: () => void;
  onShareChat: () => void;
};

export function ChatTopHeader({
  border,
  muted,
  heading,
  theme,
  compact = false,
  title,
  canOpenBuilder,
  canShareChat,
  onGoHome,
  onOpenSetup,
  onImportChat,
  onShareChat,
}: ChatTopHeaderProps) {
  const naviagte = useNavigate();
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

          <div
            onClick={() => naviagte("/")}
            className={cx(
              "hidden items-center gap-2 rounded-xl border px-2 py-1 sm:flex cursor-pointer",
              theme === "dark"
                ? "border-neutral-800 bg-[#0f0f0f]"
                : "border-neutral-200 bg-white",
            )}
          >
            <img
              src="/Logo.png"
              alt="QuantNest"
              className="h-7 w-7 object-cover rounded-full"
            />
            <span
              className={cx(
                "text-[12px] font-semibold tracking-[0.02em]",
                theme === "dark" ? "text-neutral-100" : "text-neutral-800",
              )}
            >
              QuantNest
            </span>
          </div>

          <div className="min-w-0">
            <div className={cx("flex items-center gap-2 text-[14px] font-semibold", heading)}>
              <span className="truncate">{title}</span>
            </div>
            <div className={cx("mt-0.5 text-[12px]", muted)}>AI Strategy Builder</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            onClick={onImportChat}
            className="h-10 rounded-2xl border border-neutral-700 bg-transparent px-4 text-[13px] text-neutral-200 hover:bg-neutral-800 cursor-pointer"
          >
            Import Chat
          </Button>

          <Button
            type="button"
            onClick={onShareChat}
            disabled={!canShareChat}
            className="h-10 rounded-2xl border border-neutral-700 bg-transparent px-4 text-[13px] text-neutral-200 hover:bg-neutral-800 cursor-pointer"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Chat
          </Button>

          <OrangeButton
            onClick={onOpenSetup}
            disabled={!canOpenBuilder}
            className="h-10 shrink-0 whitespace-nowrap rounded-2xl px-4 text-[13px] text-white"
          >
            <span className="inline-flex items-center gap-2">
              <span>Open in Builder</span>
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </OrangeButton>
        </div>
      </div>
    </div>
  );
}
