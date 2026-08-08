import { Input } from "@/components/ui/input";
import type { RiskLimits } from "@quantnest-trading/types";

interface RiskGuardSectionProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

const DEFAULT_RISK_LIMITS: RiskLimits = {
  maxOrderAmount: undefined,
  maxQty: undefined,
  maxSlippageBps: undefined,
  maxDailyExposure: undefined,
  requireApprovalAbove: undefined,
  approvalPrompt: "",
};

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export const RiskGuardSection = ({
  metadata,
  setMetadata,
}: RiskGuardSectionProps) => {
  const riskLimits = {
    ...DEFAULT_RISK_LIMITS,
    ...(metadata.riskLimits || {}),
  } as RiskLimits;

  const updateRiskLimits = (patch: Partial<RiskLimits>) => {
    setMetadata((current: any) => ({
      ...current,
      riskLimits: {
        ...DEFAULT_RISK_LIMITS,
        ...(current.riskLimits || {}),
        ...patch,
      },
    }));
  };

  const hasAnyLimit = Object.values(riskLimits).some(
    (value) => value !== undefined && value !== "",
  );

  const renderLimit = (
    label: string,
    helper: string,
    key: keyof RiskLimits,
    placeholder: string,
  ) => (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="text-xs text-neutral-400">{helper}</p>
      <Input
        type="number"
        min={0}
        value={(riskLimits as any)[key] ?? ""}
        onChange={(e) =>
          updateRiskLimits({
            [key]: toNumber(e.target.value),
          } as Partial<RiskLimits>)
        }
        className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-red-300/80">
            Risk Guardrails
          </p>
          <p className="text-xs text-neutral-400">
            Orders that exceed a limit are hard-blocked — never placed. Notional
            limits use the live market price for Indian symbols.
          </p>
        </div>
        {hasAnyLimit && (
          <button
            type="button"
            onClick={() =>
              setMetadata((current: any) => ({
                ...current,
                riskLimits: DEFAULT_RISK_LIMITS,
              }))
            }
            className="shrink-0 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-400 transition-colors hover:text-red-300"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {renderLimit(
          "Max Qty",
          "Hard cap on units per order.",
          "maxQty",
          "e.g., 100",
        )}
        {renderLimit(
          "Max Order Amount",
          "Notional cap (qty × price).",
          "maxOrderAmount",
          "e.g., 50000",
        )}
        {renderLimit(
          "Max Slippage (bps)",
          "Slippage cap for swaps.",
          "maxSlippageBps",
          "e.g., 200",
        )}
        {renderLimit(
          "Max Daily Exposure",
          "Cross-broker daily cap (sums all orders).",
          "maxDailyExposure",
          "e.g., 100000",
        )}
      </div>

      {renderLimit(
        "Approval Threshold",
        "Orders above this notional pause and require approval.",
        "requireApprovalAbove",
        "e.g., 10000",
      )}

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Approval Prompt
        </p>
        <Input
          value={(riskLimits as any).approvalPrompt ?? ""}
          onChange={(e) => updateRiskLimits({ approvalPrompt: e.target.value })}
          className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="Why should this order be approved?"
        />
      </div>
    </div>
  );
};
