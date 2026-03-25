import type { ReactNode } from "react"

type UseCaseSkeletonVariant =
  | "research"
  | "backtest"
  | "execution"
  | "options"

interface UseCaseSkeletonProps {
  variant?: UseCaseSkeletonVariant
}

const ORANGE = "#f17463"
const ORANGE_DIM = "rgba(241,116,99,0.18)"
const ORANGE_MED = "rgba(241,116,99,0.45)"

export const UseCaseSkeleton = ({ variant = "research" }: UseCaseSkeletonProps) => {
  const renderContent = (): ReactNode => {
    switch (variant) {
      case "research":
      default:
        return (
          <div className="relative flex h-full w-full flex-col gap-3 p-5 justify-between">
            {/* Top bar */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: ORANGE }}
                />
                <div className="h-2 w-16 rounded-full bg-white/20" />
              </div>
              <div className="h-6 w-14 rounded-md bg-white/6 border border-white/8" />
            </div>

            {/* Chart bars */}
            <div className="flex items-end gap-1.5 h-20">
              {[38, 55, 42, 70, 52, 88, 60, 74, 45, 91].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: h > 70
                      ? `linear-gradient(to top, ${ORANGE}, rgba(241,116,99,0.5))`
                      : h > 50
                        ? ORANGE_DIM
                        : "rgba(255,255,255,0.07)",
                    boxShadow: h > 70 ? `0 0 8px ${ORANGE_DIM}` : "none",
                  }}
                />
              ))}
            </div>

            {/* Condition node */}
            <div className="rounded-lg border border-white/8 bg-white/4 px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: ORANGE_DIM, color: ORANGE }}
                >
                  CONDITION
                </span>
                <div className="h-2 w-10 rounded bg-white/10" />
                <div className="h-2 w-10 rounded bg-white/10" />
              </div>
              <div className="h-2.5 w-4/5 rounded bg-white/15 mb-1" />
              <div className="h-2 w-3/5 rounded bg-white/8" />
            </div>

            {/* Bottom hint */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-2 rounded-full" style={{ background: ORANGE }} />
              <div className="h-2 w-24 rounded-full bg-white/10" />
              <div className="h-2 w-16 rounded-full bg-white/7" />
            </div>
          </div>
        )

      case "backtest":
        return (
          <div className="relative flex h-full w-full flex-col gap-3 p-5">
            {/* Mini equity curve */}
            <div className="relative h-24 w-full overflow-hidden rounded-lg border border-white/8 bg-black/40">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 200 70"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Flat/down section */}
                <path
                  d="M0,55 C15,52 25,58 40,50 C55,42 60,55 75,48"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
                {/* Breakout up */}
                <path
                  d="M75,48 C90,40 100,30 120,20 C140,10 160,8 200,5"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="2"
                />
                <path
                  d="M75,48 C90,40 100,30 120,20 C140,10 160,8 200,5 L200,70 L75,70 Z"
                  fill="url(#btGrad)"
                />
                {/* Entry marker */}
                <circle cx="75" cy="48" r="3" fill={ORANGE} />
                <line x1="75" y1="48" x2="75" y2="70" stroke={ORANGE} strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
              </svg>

              {/* Entry label */}
              <div
                className="absolute bottom-1.5 left-[35%] text-[9px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: ORANGE_DIM, color: ORANGE }}
              >
                Entry
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Win Rate", value: "67%", positive: true },
                { label: "Max DD", value: "-8.2%", positive: false },
                { label: "Sharpe", value: "1.84", positive: true },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-white/8 bg-white/4 px-2 py-2 text-center"
                >
                  <div className="text-[9px] text-white/30 mb-1">{s.label}</div>
                  <div
                    className="text-[13px] font-bold"
                    style={{ color: s.positive ? ORANGE : "#ef4444" }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Trade log rows */}
            <div className="space-y-1.5">
              {[
                { side: "BUY", symbol: "HDFC", pnl: "+2.4%", pos: true },
                { side: "SELL", symbol: "NIFTY", pnl: "-0.8%", pos: false },
                { side: "BUY", symbol: "TSLA", pnl: "+5.1%", pos: true },
              ].map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-white/6 bg-white/3 px-2.5 py-1.5"
                >
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: t.pos ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                      color: t.pos ? "#34d399" : "#ef4444",
                    }}
                  >
                    {t.side}
                  </span>
                  <span className="text-[10px] text-white/50 flex-1">{t.symbol}</span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: t.pos ? "#34d399" : "#ef4444" }}
                  >
                    {t.pnl}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )

      case "execution":
        return (
          <div className="relative flex h-full w-full flex-col gap-3 p-5">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: ORANGE_DIM, color: ORANGE }}
              >
                LIVE
              </span>
              <div className="h-2 w-20 rounded-full bg-white/12" />
              <div className="ml-auto h-2 w-12 rounded-full bg-white/8" />
            </div>

            {/* Order rows */}
            <div className="space-y-1.5">
              {[
                { broker: "Zerodha", symbol: "HDFC", qty: "10", status: "Filled", pos: true },
                { broker: "Groww", symbol: "NIFTY50", qty: "1", status: "Pending", pos: null },
                { broker: "Zerodha", symbol: "AAPL", qty: "5", status: "Filled", pos: true },
                { broker: "Lighter", symbol: "ETH", qty: "0.5", status: "Failed", pos: false },
              ].map((o, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-white/6 bg-white/4 px-3 py-2"
                >
                  {/* Broker dot */}
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ background: i === 3 ? "#ef4444" : ORANGE }}
                  />
                  <span className="text-[10px] text-white/40 w-12 flex-shrink-0">{o.broker}</span>
                  <span className="text-[10px] text-white/70 font-medium flex-1">{o.symbol}</span>
                  <span className="text-[10px] text-white/30">{o.qty}</span>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: o.pos === true
                        ? "rgba(52,211,153,0.15)"
                        : o.pos === false
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(255,255,255,0.08)",
                      color: o.pos === true ? "#34d399" : o.pos === false ? "#ef4444" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {o.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer summary */}
            <div className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/3 px-3 py-2">
              <div>
                <div className="text-[9px] text-white/30 mb-0.5">Total P&L</div>
                <div className="text-[12px] font-bold" style={{ color: "#34d399" }}>+₹4,280</div>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div>
                <div className="text-[9px] text-white/30 mb-0.5">Orders</div>
                <div className="text-[12px] font-bold text-white/70">3 / 4</div>
              </div>
              <div className="ml-auto">
                <div
                  className="h-6 w-16 rounded-full text-[10px] font-semibold flex items-center justify-center"
                  style={{ background: ORANGE_DIM, color: ORANGE }}
                >
                  Running
                </div>
              </div>
            </div>
          </div>
        )

      case "options":
        return (
          <div className="relative flex h-full w-full flex-col gap-3 p-5">
            {/* Header tabs */}
            <div className="flex items-center gap-1.5">
              {["Call", "Put", "Spread"].map((t, i) => (
                <div
                  key={t}
                  className="rounded-md px-2.5 py-1 text-[10px] font-medium"
                  style={
                    i === 0
                      ? { background: ORANGE_DIM, color: ORANGE, border: `1px solid ${ORANGE_MED}` }
                      : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }
                  }
                >
                  {t}
                </div>
              ))}
            </div>

            {/* Payoff curve */}
            <div className="relative h-28 w-full overflow-hidden rounded-lg border border-white/8 bg-black/40">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 200 80"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Baseline */}
                <line x1="0" y1="60" x2="200" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                {/* Payoff curve — call option shape */}
                <path
                  d="M0,60 L70,60 Q90,60 100,55 C120,40 150,20 200,8"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="2"
                />
                <path
                  d="M0,60 L70,60 Q90,60 100,55 C120,40 150,20 200,8 L200,80 L0,80 Z"
                  fill="url(#optGrad)"
                />
                {/* Strike marker */}
                <line x1="85" y1="20" x2="85" y2="80" stroke={ORANGE} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
              </svg>
              {/* Strike label */}
              <div
                className="absolute top-2 left-[40%] text-[9px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: ORANGE_DIM, color: ORANGE }}
              >
                Strike
              </div>
            </div>

            {/* Chain rows */}
            <div className="space-y-1">
              {[
                { strike: "19,500", ce: "142", pe: "38", iv: "18.2%" },
                { strike: "19,600", ce: "98",  pe: "62", iv: "17.8%" },
                { strike: "19,700", ce: "54",  pe: "96", iv: "19.1%" },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-white/6 bg-white/3 px-2.5 py-1.5 text-[10px]"
                >
                  <span style={{ color: "#34d399" }} className="w-10">{row.ce}</span>
                  <span className="flex-1 text-center text-white/50 font-medium">{row.strike}</span>
                  <span style={{ color: "#ef4444" }} className="w-8 text-right">{row.pe}</span>
                  <span className="text-white/25 w-10 text-right">{row.iv}</span>
                </div>
              ))}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="relative flex flex-1 w-full h-full min-h-24 overflow-hidden rounded-xl border border-white/10 bg-black">
      {/* Dot grid texture */}
      <div className="absolute inset-0 bg-dot-white/[0.06] bg-size-[14px_14px] opacity-80" />

      {/* Ambient glows */}
      <div
        className="absolute -top-16 left-4 h-40 w-40 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(241,116,99,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-16 right-4 h-40 w-40 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(241,116,99,0.08) 0%, transparent 70%)" }}
      />

      {renderContent()}

      {/* Inner ring vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/8" />
    </div>
  )
}