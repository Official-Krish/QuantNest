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
        ? "bg-[#ececec] text-neutral-800"
        : "bg-[#eef1f5] text-neutral-800";

  return (
    <div
      className={cx(
        "flex gap-2.5 transition-opacity duration-200",
        pending ? "opacity-85" : "opacity-100",
        isUser ? "justify-end" : "justify-start",
      )}
    >
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
              : assistantTone,
          )}
        >
          {typing ? (
            <TypewriterEffect
              words={[
                { text: "QuantNest" },
                { text: "AI" },
                { text: "is" },
                { text: "thinking..." },
              ]}
              className={cx(
                "!my-0 !flex !items-center !text-left !text-[13px] !font-medium !leading-6",
                theme === "dark" ? "!text-neutral-800" : "!text-neutral-700",
              )}
              cursorClassName="!h-4 !w-[3px] !bg-[#f17463]"
            />
          ) : animate && !isUser ? (
            <TypewriterEffect
              words={content.split(/\s+/).filter(Boolean).map((word) => ({ text: word }))}
              className={cx(
                "!my-0 !block !text-left !text-[13px] !font-normal !leading-6",
                theme === "dark" ? "!text-neutral-800" : "!text-neutral-700",
              )}
              cursorClassName="!h-4 !w-[3px] !bg-[#f17463]"
            />
          ) : (
            <div className="whitespace-pre-wrap">{content}</div>
          )}
        </div>
        <div className={cx("mt-1 px-1 text-[10px]", theme === "dark" ? "text-neutral-500" : "text-neutral-500")}>
          {typing
            ? "QuantNest AI"
            : kind === "validation"
              ? "Validation"
              : role === "user"
                ? "You"
                : "QuantNest AI"}{" "}
          .{" "}
          {new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          {pending && !typing ? " . Sending..." : ""}
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
