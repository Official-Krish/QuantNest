import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  X,
  Bot,
  ShieldCheck,
  Brain,
  Database,
  Globe,
} from "lucide-react";
import { AIDecisionMetadataSchema } from "@quantnest-trading/types";

const PROVIDERS = [
  { label: "Gemini", value: "gemini" },
  { label: "OpenClaw", value: "openclaw" },
];

const DEFAULT_MODELS = [
  { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
  { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
  { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
  { label: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
];

const ROLES = [
  { label: "Market Analyst", value: "analyst" },
  { label: "Risk Manager", value: "risk-manager" },
  { label: "Trader", value: "trader" },
  { label: "Custom", value: "custom" },
];

interface AIDecisionFormProps {
  metadata: Record<string, unknown>;
  setMetadata: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

export const AIDecisionForm = ({
  metadata,
  setMetadata,
}: AIDecisionFormProps) => {
  const outputSchema =
    (metadata.outputSchema as Array<{
      fieldName: string;
      choices: string[];
    }>) ?? [];

  const validationErrors = useMemo(() => {
    const result = AIDecisionMetadataSchema.safeParse(metadata);
    if (!result.success) {
      return result.error.flatten().fieldErrors;
    }
    return {};
  }, [metadata]);

  const set = (key: string, value: unknown) => {
    setMetadata((current) => ({ ...current, [key]: value }));
  };

  const addSchemaField = () => {
    const updated = [...outputSchema, { fieldName: "", choices: [""] }];
    set("outputSchema", updated);
  };

  const removeSchemaField = (index: number) => {
    const updated = outputSchema.filter((_, i) => i !== index);
    set("outputSchema", updated);
  };

  const updateSchemaField = (
    index: number,
    field: string,
    value: string | string[],
  ) => {
    const updated = outputSchema.map((f, i) =>
      i === index ? { ...f, [field]: value } : f,
    );
    set("outputSchema", updated);
  };

  const fieldError = (key: string) => {
    const errs = validationErrors[key as keyof typeof validationErrors];
    return errs && errs.length > 0 ? errs[0] : null;
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          System Prompt
        </p>
        <textarea
          value={(metadata.systemPrompt as string) ?? ""}
          onChange={(e) => set("systemPrompt", e.target.value)}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-[#f17463]/50 focus:outline-none"
          rows={3}
          placeholder="You are a trading assistant. Based on the market data, decide whether to buy, sell, or hold."
        />
        {fieldError("systemPrompt") && (
          <p className="text-xs text-red-400">{fieldError("systemPrompt")}</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Provider
        </p>
        <Select
          value={(metadata.provider as string) ?? "gemini"}
          onValueChange={(v) => set("provider", v)}
        >
          <SelectTrigger className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            {PROVIDERS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(metadata.provider as string) === "openclaw" && (
        <div className="space-y-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-orange-400">
            <Globe className="h-3 w-3" /> Local Agent
          </p>
          <p className="text-xs text-neutral-400">
            Execution routes through your local QuantNest Agent via WebSocket.
            No URL or token needed.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Role
        </p>
        <Select
          value={(metadata.role as string) ?? "analyst"}
          onValueChange={(v) => set("role", v)}
        >
          <SelectTrigger className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            {ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(metadata.provider as string) !== "openclaw" && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Model
          </p>
          <Select
            value={(metadata.model as string) ?? ""}
            onValueChange={(v) => set("model", v === "__custom__" ? "" : v)}
          >
            <SelectTrigger className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
              {DEFAULT_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError("model") && (
            <p className="text-xs text-red-400">{fieldError("model")}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Temperature
          </p>
          <Input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={(metadata.temperature as number) ?? 0.2}
            onChange={(e) => set("temperature", Number(e.target.value))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Max Tokens
          </p>
          <Input
            type="number"
            min={1}
            max={8192}
            value={(metadata.maxTokens as number) ?? 512}
            onChange={(e) => set("maxTokens", Number(e.target.value))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Min Confidence
          </p>
          <Input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={(metadata.minConfidence as number) ?? 0}
            onChange={(e) => set("minConfidence", Number(e.target.value))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Context Depth
          </p>
          <Input
            type="number"
            min={1}
            max={10}
            value={(metadata.contextDepth as number) ?? 3}
            onChange={(e) => set("contextDepth", Number(e.target.value))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            placeholder="3"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
        <Checkbox
          id="enableTools-decision"
          checked={(metadata.enableTools as boolean) ?? false}
          onCheckedChange={(v) => set("enableTools", v === true)}
          className="cursor-pointer"
        />
        <label
          htmlFor="enableTools-decision"
          className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"
        >
          <Bot className="h-3.5 w-3.5 text-neutral-500" />
          Enable tools (market data access)
        </label>
      </div>

      {/* ---- Phase 3: Approval, Reasoning, Memory ---- */}
      <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/30 p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Advanced
        </p>

        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
          <Checkbox
            id="approvalRequired"
            checked={(metadata.approvalRequired as boolean) ?? false}
            onCheckedChange={(v) => set("approvalRequired", v === true)}
            className="cursor-pointer"
          />
          <label
            htmlFor="approvalRequired"
            className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-neutral-500" />
            Require approval before execution
          </label>
        </div>
        {(metadata.approvalRequired as boolean) && (
          <div className="space-y-2 pl-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500">
              Approval prompt
            </p>
            <textarea
              value={(metadata.approvalPrompt as string) ?? ""}
              onChange={(e) => set("approvalPrompt", e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-[#f17463]/50 focus:outline-none"
              rows={2}
              placeholder="e.g. Review the trade decision before execution."
            />
          </div>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
          <Checkbox
            id="reasoningEnabled"
            checked={(metadata.reasoningEnabled as boolean) ?? false}
            onCheckedChange={(v) => set("reasoningEnabled", v === true)}
            className="cursor-pointer"
          />
          <label
            htmlFor="reasoningEnabled"
            className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"
          >
            <Brain className="h-3.5 w-3.5 text-neutral-500" />
            Enable chain-of-thought reasoning
          </label>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
          <Checkbox
            id="memoryEnabled"
            checked={(metadata.memoryEnabled as boolean) ?? false}
            onCheckedChange={(v) => set("memoryEnabled", v === true)}
            className="cursor-pointer"
          />
          <label
            htmlFor="memoryEnabled"
            className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"
          >
            <Database className="h-3.5 w-3.5 text-neutral-500" />
            Persist memory across runs
          </label>
        </div>
        {(metadata.memoryEnabled as boolean) && (
          <div className="space-y-2 pl-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500">
              Memory TTL (hours)
            </p>
            <Input
              type="number"
              min={1}
              max={8760}
              value={(metadata.memoryTtl as number) ?? 24}
              onChange={(e) => set("memoryTtl", Number(e.target.value))}
              className="border-neutral-800 bg-neutral-950 text-sm text-neutral-100"
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Output Schema
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addSchemaField}
            className="h-7 cursor-pointer text-xs text-[#f17463] hover:bg-[#f17463]/10"
          >
            <Plus className="mr-1 h-3 w-3" /> Add Field
          </Button>
        </div>
        {outputSchema.map((field, i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-neutral-400">
                Field {i + 1}
              </p>
              <button
                type="button"
                onClick={() => removeSchemaField(i)}
                className="cursor-pointer text-neutral-500 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <Input
              value={field.fieldName}
              onChange={(e) =>
                updateSchemaField(i, "fieldName", e.target.value)
              }
              className="mt-2 border-neutral-800 bg-neutral-950 text-sm text-neutral-100"
              placeholder="e.g. action"
            />
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500">
              Allowed values (one per line)
            </p>
            <textarea
              value={field.choices.join("\n")}
              onChange={(e) =>
                updateSchemaField(i, "choices", e.target.value.split("\n"))
              }
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-[#f17463]/50 focus:outline-none"
              rows={3}
              placeholder={`BUY\nSELL\nHOLD`}
            />
          </div>
        ))}
        {outputSchema.length === 0 && (
          <p className="text-xs text-neutral-500">
            Add at least one field to define the output structure.
          </p>
        )}
      </div>
    </div>
  );
};
