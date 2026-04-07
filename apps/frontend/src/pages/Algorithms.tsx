import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiGetPracticalAlgos,
  hasAuthSession,
} from "@/http";
import type { WorkflowExample } from "@/types/api";
import { ArrowRight } from "lucide-react";
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
    const rawMarket = String((node as any)?.data?.metadata?.marketType || "").toLowerCase();
    return rawMarket === "crypto" || rawMarket === "web3";
  });

  if (hasCryptoNode) return "Crypto";
  if (example.market === "Crypto") return "Crypto";
  return "Indian";
}

export const Algorithms = () => {
  const navigate = useNavigate();
  const [algorithms, setAlgorithms] = useState<WorkflowExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<WorkflowExample | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [executionMode, setExecutionMode] = useState<"live" | "dry-run">("live");
  const [metadataOverrides, setMetadataOverrides] = useState<ExampleMetadataOverrides>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadAlgorithms = async () => {
      try {
        const res = await apiGetPracticalAlgos();
        setAlgorithms(res.examples);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Could not load practical algorithms.");
      } finally {
        setLoading(false);
      }
    };

    void loadAlgorithms();
  }, []);

  const onUseAlgorithm = (algorithm: WorkflowExample) => {
    if (!hasAuthSession()) {
      window.location.href = "/signup";
      return;
    }

    setSelectedAlgorithm(algorithm);
    setWorkflowName(algorithm.title);
    setExecutionMode("live");
    setMetadataOverrides({});
  };

  const onCreateFromAlgorithm = async () => {
    if (!selectedAlgorithm || !workflowName.trim()) return;

    setCreating(true);
    try {
      navigate("/create/builder", {
        state: {
          generatedPlan: {
            workflowName: workflowName.trim(),
            marketType: inferMarketType(selectedAlgorithm),
            executionMode,
            nodes: buildDraftNodes(selectedAlgorithm, metadataOverrides),
            edges: selectedAlgorithm.edges,
          },
        },
      });

      toast.success("Template loaded", {
        description: "Review details in builder and save when ready.",
      });

      setSelectedAlgorithm(null);
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
              Practical trading algorithms
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
              Real-trader strategies ready to launch
            </h1>
            <p className="text-base leading-7 text-neutral-400 md:text-lg">
              These practical algorithms represent patterns and confirmations that real traders use
              for breakout detection, mean reversion, and risk management. Use them as proven
              starting points, adapt them to your market conditions, and combine them with your
              own signal filters and confirmations.
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
              Create workflow from scratch
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[1.75rem] border border-neutral-800 bg-neutral-950/70 p-8 text-sm text-neutral-400">
            Loading practical algorithms...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[1.75rem] border border-red-500/20 bg-red-500/5 p-8 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {algorithms.map((algorithm) => (
              <ExampleCard
                key={algorithm.slug}
                example={algorithm}
                onUse={onUseAlgorithm}
              />
            ))}
          </div>
        )}
      </div>

      <ExampleCreateDialog
        selectedExample={selectedAlgorithm}
        workflowName={workflowName}
        executionMode={executionMode}
        creating={creating}
        onWorkflowNameChange={setWorkflowName}
        onExecutionModeChange={setExecutionMode}
        onOpenChange={(open) => {
          if (!open && !creating) {
            setSelectedAlgorithm(null);
            setWorkflowName("");
            setExecutionMode("live");
            setMetadataOverrides({});
          }
        }}
        onCreate={() => void onCreateFromAlgorithm()}
        metadataOverrides={metadataOverrides}
        onMetadataOverridesChange={setMetadataOverrides}
      />
    </div>
  );
};
