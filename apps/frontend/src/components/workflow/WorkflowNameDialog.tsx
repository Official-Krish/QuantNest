import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Input } from "../ui/input";
import type { RiskLimits } from "@quantnest-trading/types";
import { useState } from "react";

export interface WorkflowNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowName: string;
  onChangeName: (value: string) => void;
  onSubmit: () => void;
  showRiskPanel?: boolean;
  riskLimits?: RiskLimits;
  onChangeRiskLimits?: (limits: RiskLimits) => void;
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

function WorkflowRiskPanel({
  riskLimits,
  onChange,
}: {
  riskLimits: RiskLimits;
  onChange: (limits: RiskLimits) => void;
}) {
  const [open, setOpen] = useState(
    Object.values(riskLimits).some((v) => v !== undefined && v !== ""),
  );

  const update = (patch: Partial<RiskLimits>) =>
    onChange({ ...riskLimits, ...patch });

  const renderLimit = (
    label: string,
    helper: string,
    key: keyof RiskLimits,
    placeholder: string,
  ) => (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <Input
        type="number"
        min={0}
        value={(riskLimits as any)[key] ?? ""}
        onChange={(e) =>
          update({ [key]: toNumber(e.target.value) } as Partial<RiskLimits>)
        }
        className="bg-neutral-800 text-neutral-200 placeholder-neutral-500"
        placeholder={placeholder}
      />
      <p className="text-[11px] text-neutral-500">{helper}</p>
    </div>
  );

  return (
    <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-red-300/80">
          Workflow Risk Guardrails
        </span>
        <span className="text-xs text-neutral-400">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-neutral-400">
            Applied to every broker node in this workflow. A node's own limits
            can only tighten these. Blocks are hard — orders are never placed.
          </p>
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
              "Max Daily Exposure",
              "Cross-broker daily cap.",
              "maxDailyExposure",
              "e.g., 100000",
            )}
            {renderLimit(
              "Max Slippage (bps)",
              "Slippage cap for swaps.",
              "maxSlippageBps",
              "e.g., 200",
            )}
          </div>
          {renderLimit(
            "Approval Threshold",
            "Orders above this notional pause and require approval.",
            "requireApprovalAbove",
            "e.g., 10000",
          )}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Approval Prompt
            </p>
            <Input
              value={(riskLimits as any).approvalPrompt ?? ""}
              onChange={(e) => update({ approvalPrompt: e.target.value })}
              className="bg-neutral-800 text-neutral-200 placeholder-neutral-500"
              placeholder="Why should this order be approved?"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export const WorkflowNameDialog = ({
  open,
  onOpenChange,
  workflowName,
  onChangeName,
  onSubmit,
  showRiskPanel = false,
  riskLimits = DEFAULT_RISK_LIMITS,
  onChangeRiskLimits,
}: WorkflowNameDialogProps) => {
  const MIN_WORKFLOW_NAME_LENGTH = 3;

  const handleSubmit = () => {
    if (workflowName.trim().length >= MIN_WORKFLOW_NAME_LENGTH) onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 text-neutral-200 border border-neutral-800 max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-neutral-100">
            Name your workflow
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Give your workflow a descriptive name to identify it later.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={workflowName}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="e.g., NIFTY Swing Trading Strategy"
            className="bg-neutral-800 text-neutral-200 placeholder-neutral-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }
            }}
            autoFocus
          />
          {workflowName.trim().length > 0 &&
          workflowName.trim().length < MIN_WORKFLOW_NAME_LENGTH ? (
            <p className="mt-2 text-xs text-amber-300">
              Workflow name must be at least {MIN_WORKFLOW_NAME_LENGTH}{" "}
              characters.
            </p>
          ) : null}

          {showRiskPanel && onChangeRiskLimits && (
            <WorkflowRiskPanel
              riskLimits={riskLimits}
              onChange={onChangeRiskLimits}
            />
          )}
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={workflowName.trim().length < MIN_WORKFLOW_NAME_LENGTH}
            className="px-4 py-2 ml-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded-lg hover:scale-103 disabled:opacity-50 transform transition duration-300 cursor-pointer"
          >
            Continue
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
