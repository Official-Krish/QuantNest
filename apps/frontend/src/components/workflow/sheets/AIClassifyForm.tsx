import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Brain, Database, Globe } from "lucide-react";
import { AIClassifyMetadataSchema } from "@quantnest-trading/types";

const DEFAULT_MODELS = [
  { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
  { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
  { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
  { label: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
];

interface AIClassifyFormProps {
  metadata: Record<string, unknown>;
  setMetadata: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  useOpenClaw?: boolean;
}

export const AIClassifyForm = ({
  metadata,
  setMetadata,
  useOpenClaw = false,
}: AIClassifyFormProps) => {
  const [labelText, setLabelText] = useState(() =>
    ((metadata.labels as string[]) ?? []).join("\n"),
  );

  const set = (key: string, value: unknown) => {
    setMetadata((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    const desired = useOpenClaw ? "openclaw" : "gemini";
    if ((metadata.provider as string) !== desired) {
      set("provider", desired);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useOpenClaw]);

  const validationErrors = useMemo(() => {
    const result = AIClassifyMetadataSchema.safeParse(metadata);
    if (!result.success) {
      return result.error.flatten().fieldErrors;
    }
    return {};
  }, [metadata]);

  const handleLabelsChange = (text: string) => {
    setLabelText(text);
    set("labels", text.split("\n"));
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
          placeholder="Classify the market condition into one of the categories below."
        />
        {fieldError("systemPrompt") && (
          <p className="text-xs text-red-400">{fieldError("systemPrompt")}</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Labels (one per line)
        </p>
        <textarea
          value={labelText}
          onChange={(e) => handleLabelsChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-[#f17463]/50 focus:outline-none"
          rows={4}
          placeholder={`BULLISH\nBEARISH\nNEUTRAL`}
        />
        {fieldError("labels") && (
          <p className="text-xs text-red-400">{fieldError("labels")}</p>
        )}
      </div>

      {useOpenClaw && (
        <div className="space-y-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-orange-400">
            <Globe className="h-3 w-3" /> Local Agent
          </p>
          <p className="text-xs text-neutral-400">
            AI runs through your local QuantNest Agent (OpenClaw). Pick the
            model in the workflow&apos;s OpenClaw settings.
          </p>
        </div>
      )}

      {!useOpenClaw && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Model
          </p>
          <Select
            value={(metadata.model as string) ?? ""}
            onValueChange={(v) => set("model", v)}
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
              placeholder="e.g. Review the classification before applying."
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
    </div>
  );
};
