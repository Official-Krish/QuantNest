import { cx, type LocalTheme } from "./shared";

const EXAMPLE_PROMPTS = [
  "For HDFC, trigger a Gmail alert when price drops below 1000 and include current price, day low, and volume in the message.",
  "Monitor RELIANCE on 15m timeframe and send a Discord alert when RSI crosses below 30 with symbol, RSI value, and timestamp.",
  "Every day at 9:15 PM, send a WhatsApp summary of NIFTY 50 top gainers and losers with percentage change and closing price.",
  "For BTCUSDT, execute a sell signal when price breaks below the 20 EMA and also send a fallback Gmail alert if execution fails.",
];

type ChatEmptyStateProps = {
  panel: string;
  muted: string;
  theme: LocalTheme;
  onExampleClick?: (example: string) => void;
};

export function ChatEmptyState({
  panel,
  muted,
  theme,
  onExampleClick,
}: ChatEmptyStateProps) {
  return (
    <div className="flex min-h-[calc(100vh-360px)] flex-col gap-4">
      <div className={cx("rounded-2xl border px-5 py-5", panel)}>
        <div className="text-sm font-medium text-[#f17463]">Start a new workflow</div>
        <div className={cx("mt-2 text-sm leading-7", muted)}>
          Describe the workflow, then keep refining it in chat. Every edit creates a version in the right-side history.
        </div>
      </div>

      <div>
        <div className={cx("mb-3 text-xs font-medium uppercase tracking-[0.12em]", muted)}>
          Get started with examples
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              onClick={() => onExampleClick?.(example)}
              className={cx(
                "rounded-xl border px-4 py-3 text-left text-sm transition-colors hover:border-[#f17463]/50 hover:bg-[#f17463]/5 cursor-pointer",
                theme === "dark"
                  ? "border-neutral-800 text-neutral-300"
                  : "border-neutral-200 text-neutral-700",
              )}
            >
              <div className="font-medium">{example}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center py-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full bg-[#f17463]/25 blur-[10px]"
              aria-hidden="true"
            />
            <img
              src="/Logo.png"
              width={40}
              height={40}
              alt="QuantNest logo"
              className="relative rounded-full opacity-95"
            />
          </div>
          <div className={cx("text-[10px] font-medium uppercase tracking-[0.14em]", muted)}>
            Ready When You Are
          </div>
          <div className={cx("text-xs", muted)}>
            Pick an example or write a prompt to generate your first workflow.
          </div>
        </div>
      </div>
    </div>
  );
}
