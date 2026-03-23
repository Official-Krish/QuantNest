import { Sparkles } from "lucide-react";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { cx, type LocalTheme } from "./shared";

type ChatBubbleProps = {
  role: "user" | "assistant" | "system";
  content: string;
  kind: string;
  timestamp: string;
  theme: LocalTheme;
  pending?: boolean;
  typing?: boolean;
  animate?: boolean;
};

export function ChatBubble({
  role,
  content,
  kind,
  timestamp,
  theme,
  pending = false,
  typing = false,
  animate = false,
}: ChatBubbleProps) {
  const isUser = role === "user";
  const assistantTone =
    kind === "validation"
      ? theme === "dark"
        ? "border border-amber-500/30 bg-amber-500/8 text-amber-100"
        : "border border-amber-300 bg-amber-50 text-amber-900"
      : theme === "dark"
        ? "border border-neutral-800 bg-[#111111] text-neutral-100 shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
        : "border border-neutral-200 bg-[#f8fafc] text-neutral-800";

  return (
    <div
      className={cx(
        "flex w-fit max-w-full gap-2.5 transition-opacity duration-200",
        pending ? "opacity-85" : "opacity-100",
        isUser ? "ml-auto justify-end" : "justify-start",
      )}
    >
      {!isUser ? (
        <div
          className={cx(
            "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            theme === "dark"
              ? "border-[#f17463]/20 bg-[#1b120e] text-[#f17463]"
              : "border-[#f17463]/15 bg-[#fff1ea] text-[#f17463]",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      ) : null}

      <div className={cx("w-fit", isUser ? "ml-auto max-w-[85%]" : "max-w-[78%]")}>
        <div
          className={cx(
            "rounded-3xl px-4 py-3 text-[14px] leading-7",
            isUser
              ? theme === "dark"
                ? "border border-neutral-800 bg-[#171717] text-white shadow-[0_6px_20px_rgba(0,0,0,0.18)]"
                : "border border-neutral-900 bg-[#151515] text-white"
              : assistantTone,
          )}
        >
          {typing ? (
            <TypewriterEffect
              words={[
                { text: "AI" },
                { text: "is" },
                { text: "thinking..." },
              ]}
              className={cx(
                "!my-0 !flex !items-center !text-left !text-[13px] !font-medium !leading-6",
                theme === "dark" ? "!text-neutral-100" : "!text-neutral-700",
              )}
              cursorClassName="!h-4 !w-[3px] !bg-[#f17463]"
            />
          ) : animate && !isUser ? (
            <TypewriterEffect
              words={content.split(/\s+/).filter(Boolean).map((word) => ({ text: word }))}
              className={cx(
                "!my-0 !block !text-left !text-[13px] !font-normal !leading-6",
                theme === "dark" ? "!text-neutral-100" : "!text-neutral-700",
              )}
              cursorClassName="!h-4 !w-[3px] !bg-[#f17463]"
            />
          ) : (
            <div className="whitespace-pre-wrap">{content}</div>
          )}
        </div>
        <div
          className={cx(
            "mt-1 flex items-center gap-1.5 px-1 text-[11px]",
            isUser ? "justify-end" : "justify-start",
            theme === "dark" ? "text-neutral-500" : "text-neutral-500",
          )}
        >
          <span>
            {typing
              ? "QuantNest AI"
              : kind === "validation"
                ? "Validation"
                : role === "user"
                  ? "You"
                  : "QuantNest AI"}
          </span>
          <span>•</span>
          <span>{new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          {pending && !typing ? (
            <>
              <span>•</span>
              <span>Sending...</span>
            </>
          ) : null}
        </div>
      </div>

      {isUser ? (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-neutral-800 bg-[#151515] text-[10px] font-semibold text-white">
          Y
        </div>
      ) : null}
    </div>
  );
}
