import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetExamples, hasAuthSession } from "@/http";
import type { WorkflowExample } from "@/types/api";
import { ArrowRight } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { toast } from "sonner";
import { ExampleCard } from "../components/examples/ExampleCard";
import {
  ExampleCreateDialog,
  type ExampleMetadataOverrides,
} from "../components/examples/ExampleCreateDialog";
import { AppBackground } from "@/components/background";

function buildDraftNodes(
  example: WorkflowExample,
  metadataOverrides: ExampleMetadataOverrides,
) {
  return example.nodes.map((node) => {
    const nodeId = String((node as any).nodeId || (node as any).id || "");

    return {
      ...(node as any),
      id: nodeId,
      nodeId,
      data: {
        ...((node as any).data || {}),
        metadata: {
          ...(((node as any).data?.metadata || {}) as Record<string, unknown>),
          ...(metadataOverrides[nodeId] || {}),
        },
      },
    };
  });
}

function inferMarketType(example: WorkflowExample): "Indian" | "Crypto" {
  const hasCryptoNode = example.nodes.some((node) => {
    const rawMarket = String(
      (node as any)?.data?.metadata?.marketType || "",
    ).toLowerCase();
    return rawMarket === "crypto" || rawMarket === "web3";
  });

  if (hasCryptoNode) return "Crypto";
  if (example.market === "Crypto") return "Crypto";
  return "Indian";
}

export const Examples = () => {
  const navigate = useNavigate();
  const [examples, setExamples] = useState<WorkflowExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExample, setSelectedExample] =
    useState<WorkflowExample | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [executionMode, setExecutionMode] = useState<"live" | "dry-run">(
    "live",
  );
  const [metadataOverrides, setMetadataOverrides] =
    useState<ExampleMetadataOverrides>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadExamples = async () => {
      try {
        const res = await apiGetExamples();
        setExamples(res.examples);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Could not load examples.");
      } finally {
        setLoading(false);
      }
    };

    void loadExamples();
  }, []);

  const onUseExample = (example: WorkflowExample) => {
    if (!hasAuthSession()) {
      window.location.href = "/signup";
      return;
    }

    setSelectedExample(example);
    setWorkflowName(example.title);
    setExecutionMode("live");
    setMetadataOverrides({});
  };

  const onCreateFromExample = async () => {
    if (!selectedExample || !workflowName.trim()) return;

    setCreating(true);
    try {
      navigate("/create/builder", {
        state: {
          generatedPlan: {
            workflowName: workflowName.trim(),
            marketType: inferMarketType(selectedExample),
            executionMode,
            nodes: buildDraftNodes(selectedExample, metadataOverrides),
            edges: selectedExample.edges,
          },
        },
      });

      toast.success("Template loaded", {
        description: "Review details in builder and save when ready.",
      });

      setSelectedExample(null);
      setWorkflowName("");
      setExecutionMode("live");
      setMetadataOverrides({});
    } catch (e: any) {
      toast.error("Could not load template", {
        description:
          e?.response?.data?.message ?? "Failed to open template in builder.",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-black px-6 pb-16 pt-32 text-white md:px-10">
      <AppBackground />
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-4xl border border-neutral-800 bg-neutral-950/80 p-8 md:p-10">
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#f17463]/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-60 w-60 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#f17463]">
              Example workflows
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
              Real workflow patterns you can adapt, not empty templates
            </h1>
            <p className="text-base leading-7 text-neutral-400 md:text-lg">
              These examples show how QuantNest can be used for alerts,
              execution, reporting, and AI-assisted review. Treat them as
              production-style starting points and adapt the trigger, logic, and
              action chain to your setup.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
              onClick={() => {
                window.location.href = hasAuthSession()
                  ? "/create/onboarding"
                  : "/signup";
              }}
            >
              Start from scratch
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState
            variant="card"
            message="Loading example workflows..."
            className="mt-8"
          />
        ) : error ? (
          <div className="mt-8 rounded-[1.75rem] border border-red-500/20 bg-red-500/5 p-8 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {examples.map((example) => (
              <ExampleCard
                key={example.slug}
                example={example}
                onUse={onUseExample}
              />
            ))}
          </div>
        )}
      </div>

      <ExampleCreateDialog
        selectedExample={selectedExample}
        workflowName={workflowName}
        executionMode={executionMode}
        creating={creating}
        onWorkflowNameChange={setWorkflowName}
        onExecutionModeChange={setExecutionMode}
        onOpenChange={(open) => {
          if (!open && !creating) {
            setSelectedExample(null);
            setWorkflowName("");
            setExecutionMode("live");
            setMetadataOverrides({});
          }
        }}
        onCreate={() => void onCreateFromExample()}
        metadataOverrides={metadataOverrides}
        onMetadataOverridesChange={setMetadataOverrides}
      />
    </div>
  );
};
