import type { RiskLimits } from "@quantnest-trading/types";

function hasAnyLimit(riskLimits?: RiskLimits): boolean {
  if (!riskLimits) return false;
  return Object.values(riskLimits).some(
    (value) => value !== undefined && value !== "",
  );
}

export const RiskBadge = ({
  riskLimits,
  className = "",
}: {
  riskLimits?: RiskLimits;
  className?: string;
}) => {
  if (!hasAnyLimit(riskLimits)) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-red-300 ${className}`}
      title="Risk guardrails configured on this node"
    >
      <span className="size-1 rounded-full bg-red-400" />
      Risk
    </span>
  );
};
