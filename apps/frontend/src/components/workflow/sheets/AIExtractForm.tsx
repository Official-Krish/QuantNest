import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIExtractMetadataSchema } from "@quantnest-trading/types";

const DEFAULT_MODELS = [
  { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
  { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
  { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
  { label: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
];

interface AIExtractFormProps {
  metadata: Record<string, unknown>;
  setMetadata: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

export const AIExtractForm = ({
  metadata,
  setMetadata,
}: AIExtractFormProps) => {
  const fields = (metadata.fields as string[]) ?? [];

  const validationErrors = useMemo(() => {
    const result = AIExtractMetadataSchema.safeParse(metadata);
    if (!result.success) {
      return result.error.flatten().fieldErrors;
    }
    return {};
  }, [metadata]);

  const set = (key: string, value: unknown) => {
    setMetadata((current) => ({ ...current, [key]: value }));
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
          placeholder="Extract the key metrics from the market data below."
        />
        {fieldError("systemPrompt") && (
          <p className="text-xs text-red-400">{fieldError("systemPrompt")}</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Fields to Extract (one per line)
        </p>
        <textarea
          value={fields.join("\n")}
          onChange={(e) =>
            set(
              "fields",
              e.target.value.split("\n").filter((f) => f.trim().length > 0),
            )
          }
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-[#f17463]/50 focus:outline-none"
          rows={4}
          placeholder={`price\nsentiment\nvolume\nvolatility`}
        />
        {fieldError("fields") && (
          <p className="text-xs text-red-400">{fieldError("fields")}</p>
        )}
      </div>

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
  );
};
