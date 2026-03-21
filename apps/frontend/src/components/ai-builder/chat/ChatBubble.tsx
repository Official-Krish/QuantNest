import { Sparkles } from "lucide-react";
import { cx, type LocalTheme } from "./shared";

type ChatBubbleProps = {
  role: "user" | "assistant" | "system";
  content: string;
  kind: string;
  timestamp: string;
  theme: LocalTheme;
};

export function ChatBubble({ role, content, kind, timestamp, theme }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cx("flex gap-2.5 transition-opacity duration-200", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div
          className={cx(
            "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            theme === "dark" ? "bg-[#f8ede8] text-[#f17463]" : "bg-[#fff1ea] text-[#f17463]",
          )}
        >
          <Sparkles className="h-4 w-4" />
        </div>
      ) : null}

      <div className="max-w-[74%]">
        <div
          className={cx(
            "rounded-3xl px-3.5 py-2.5 text-[13px] leading-6",
            isUser
              ? theme === "dark"
                ? "bg-[#121212] text-white"
                : "bg-[#151515] text-white"
              : kind === "validation"
                ? theme === "dark"
                  ? "border border-amber-500/30 bg-amber-500/8 text-amber-100"
                  : "border border-amber-300 bg-amber-50 text-amber-900"
                : theme === "dark"
                  ? "bg-[#ececec] text-neutral-800"
                  : "bg-[#eef1f5] text-neutral-800",
          )}
        >
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        <div className={cx("mt-1 px-1 text-[10px]", theme === "dark" ? "text-neutral-500" : "text-neutral-500")}>
          {kind === "validation" ? "Validation" : role === "user" ? "You" : "QuantNest AI"} .{" "}
          {new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>

      {isUser ? (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#151515] text-[10px] font-semibold text-white">
          Y
        </div>
      ) : null}
    </div>
  );
}
