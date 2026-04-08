import { useEffect, useState } from "react";
import { apiGetMarketStatus } from "@/http";
import type { marketStatus } from "@/types/api";

interface MarketStatusBadgeProps {
  marketType?: "Indian" | "Crypto" | null;
  showDeferredHint?: boolean;
}

export function MarketStatusBadge({
  marketType,
  showDeferredHint = true,
}: MarketStatusBadgeProps) {
  const [marketStatus, setMarketStatus] = useState<marketStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMarketStatus = async () => {
      try {
        const res = await apiGetMarketStatus();
        if (!cancelled) {
          setMarketStatus(res.marketStatus);
        }
      } catch {
        if (!cancelled) {
          setMarketStatus(null);
        }
      }
    };

    void loadMarketStatus();
    const interval = window.setInterval(() => {
      void loadMarketStatus();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (marketType !== "Indian" || !marketStatus) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${
          marketStatus.isOpen
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : "border-rose-500/40 bg-rose-500/10 text-rose-200"
        }`}
        title={marketStatus.nextOpenTime || marketStatus.message}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${marketStatus.isOpen ? "bg-emerald-300" : "bg-rose-300"}`}
        />
        <span>Indian Market {marketStatus.isOpen ? "Open" : "Closed"}</span>
      </div>

      {!marketStatus.isOpen && showDeferredHint ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Workflow will run when market opens{marketStatus.nextOpenTime ? ` (${marketStatus.nextOpenTime})` : ""}.
        </p>
      ) : null}
    </div>
  );
}