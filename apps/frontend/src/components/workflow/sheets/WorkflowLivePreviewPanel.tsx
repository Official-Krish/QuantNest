import type { WorkflowLivePreview } from "@/types/api";

function formatValue(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "N/A";
  }

  if (Math.abs(value) >= 1000) {
    return value.toFixed(2);
  }

  return value.toFixed(2);
}

export function WorkflowLivePreviewPanel({
  preview,
  loading,
  error,
  title = "Live Preview",
}: {
  preview: WorkflowLivePreview | null;
  loading: boolean;
  error: string | null;
  title?: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
            {title}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Live values use the same market and indicator stack already powering workflow evaluation.
          </p>
        </div>
        <div
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
            preview?.conditionMet
              ? "bg-emerald-500/12 text-emerald-300"
              : "bg-neutral-900 text-neutral-400"
          }`}
        >
          {preview?.conditionMet ? "Condition met" : "Monitoring"}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-neutral-800 bg-black/30 px-3 py-3 text-xs text-neutral-400">
          Fetching live market numbers...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {preview ? (
        <>
          {typeof preview.currentPrice === "number" ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="rounded-xl border border-neutral-800 bg-black/30 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Current price</div>
                <div className="mt-1 text-lg font-semibold text-neutral-100">{formatValue(preview.currentPrice)}</div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-black/30 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Distance to target</div>
                <div className="mt-1 text-lg font-semibold text-neutral-100">{formatValue(preview.distanceToTarget)}</div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-black/30 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Last checked</div>
                <div className="mt-1 text-sm font-medium text-neutral-100">
                  {new Date(preview.evaluatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
                </div>
              </div>
            </div>
          ) : null}

          {preview.indicatorSnapshot.length ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {preview.indicatorSnapshot.map((entry) => (
                <div key={`${entry.symbol}-${entry.timeframe}-${entry.indicator}-${entry.period || 0}`} className="rounded-xl border border-neutral-800 bg-black/30 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    {entry.indicator}{entry.period ? ` (${entry.period})` : ""} • {entry.symbol} • {entry.timeframe}
                  </div>
                  <div className="mt-1 text-base font-semibold text-neutral-100">{formatValue(entry.value)}</div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
