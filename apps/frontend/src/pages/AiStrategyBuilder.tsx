import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiGenerateAiStrategyPlan,
  apiGetAiModels,
} from "@/http";
import type {
  AiModelDescriptor,
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
} from "@/types/api";
import { AiPlanReview } from "@/components/ai-builder/AiPlanReview";
import { AiStrategyForm } from "@/components/ai-builder/AiStrategyForm";
import {
  AI_ALLOWED_NODE_TYPES,
  DEFAULT_AI_CONSTRAINTS,
} from "@/components/ai-builder/constants";
import {
  type AiMetadataOverrides,
  normalizeGeneratedNodes,
} from "@/components/ai-builder/utils";
import { AiPlanSetupDialog } from "@/components/ai-builder/AiPlanSetupDialog";

export const AiStrategyBuilder = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<AiModelDescriptor[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiStrategyBuilderResponse | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [metadataOverrides, setMetadataOverrides] = useState<AiMetadataOverrides>({});
  const [prompt, setPrompt] = useState("");
  const [market, setMarket] = useState<AiStrategyBuilderRequest["market"]>("Indian");
  const [goal, setGoal] = useState<AiStrategyBuilderRequest["goal"]>("alerts");
  const [riskPreference, setRiskPreference] = useState<AiStrategyBuilderRequest["riskPreference"]>("balanced");
  const [brokerExecution, setBrokerExecution] = useState(false);
  const [allowDirectExecution, setAllowDirectExecution] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [constraints, setConstraints] = useState(DEFAULT_AI_CONSTRAINTS);
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
    const loadModels = async () => {
      setLoadingModels(true);
      setError(null);
      try {
        const res = await apiGetAiModels();
        setModels(res.models);
        const preferred = res.models.find((entry) => entry.recommended) ?? res.models[0];
        if (preferred) {
          setSelectedProvider(String(preferred.provider));
          setSelectedModel(preferred.id);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to load AI models.");
      } finally {
        setLoadingModels(false);
      }
    };

    void loadModels();
  }, []);

  const providerModels = useMemo(
    () => models.filter((entry) => String(entry.provider) === selectedProvider),
    [models, selectedProvider],
  );

  useEffect(() => {
    if (!providerModels.some((entry) => entry.id === selectedModel)) {
      setSelectedModel(providerModels[0]?.id || "");
    }
  }, [providerModels, selectedModel]);

  const canGenerate = prompt.trim().length >= 12 && !!selectedModel && !loadingModels;

  const toggleAction = (action: string) => {
    setSelectedActions((current) =>
      current.includes(action)
        ? current.filter((entry) => entry !== action)
        : [...current, action],
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const payload: AiStrategyBuilderRequest = {
        prompt: prompt.trim(),
        market,
        goal,
        riskPreference,
        brokerExecution,
        allowDirectExecution,
        preferredActions: selectedActions as AiStrategyBuilderRequest["preferredActions"],
        constraints: constraints
          .split("\n")
          .map((entry) => entry.trim())
          .filter(Boolean),
        model: {
          provider: selectedProvider,
          model: selectedModel,
        },
        allowedNodeTypes: AI_ALLOWED_NODE_TYPES,
      };

      const plan = await apiGenerateAiStrategyPlan(payload);
      setResult(plan);
      setWorkflowName(plan.plan.workflowName);
      setMetadataOverrides({});
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to generate workflow plan.");
    } finally {
      setGenerating(false);
    }
  };

  const openInBuilder = () => {
    if (!result) return;
    navigate("/create/builder", {
      state: {
        generatedPlan: {
          workflowName,
          marketType: result.plan.marketType,
          nodes: normalizeGeneratedNodes(result.plan, metadataOverrides),
          edges: result.plan.edges,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-black px-6 pb-10 pt-24 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-neutral-800 bg-linear-to-b from-neutral-950 via-black to-neutral-950/80 p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
            AI strategy builder
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-50 md:text-4xl">
            Describe the workflow. Generate the first draft.
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-neutral-400">
            The AI generates a workflow plan, not a saved workflow. You still review it, fill credentials, and save through the normal builder.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <AiStrategyForm
              prompt={prompt}
              onPromptChange={setPrompt}
              market={market}
              onMarketChange={setMarket}
              goal={goal}
              onGoalChange={setGoal}
              riskPreference={riskPreference}
              onRiskPreferenceChange={setRiskPreference}
              brokerExecution={brokerExecution}
              onBrokerExecutionChange={setBrokerExecution}
              allowDirectExecution={allowDirectExecution}
              onAllowDirectExecutionChange={setAllowDirectExecution}
              selectedActions={selectedActions}
              onToggleAction={toggleAction}
              constraints={constraints}
              onConstraintsChange={setConstraints}
              models={models}
              loadingModels={loadingModels}
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              providerModels={providerModels}
              canGenerate={canGenerate}
              generating={generating}
              error={error}
              onGenerate={handleGenerate}
              onBack={() => navigate("/create/onboarding")}
            />

            <AiPlanReview
              result={result}
              onOpenInBuilder={() => {
                if (!result) return;
                setWorkflowName(result.plan.workflowName);
                setSetupOpen(true);
              }}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
            <p className="font-medium uppercase tracking-[0.16em] text-amber-300">
              Beta / Testing Phase
            </p>
            <ul className="mt-3 space-y-2 text-amber-100/90">
              <li>AI can misunderstand trigger conditions, execution order, or asset details.</li>
              <li>Always review generated nodes, thresholds, and action metadata before saving.</li>
              <li>Do not rely on generated workflows for live trading without manual verification.</li>
            </ul>
          </div>
        </div>
      </div>

      <AiPlanSetupDialog
        open={setupOpen}
        result={result}
        workflowName={workflowName}
        metadataOverrides={metadataOverrides}
        onOpenChange={setSetupOpen}
        onWorkflowNameChange={setWorkflowName}
        onMetadataOverridesChange={setMetadataOverrides}
        onContinue={openInBuilder}
      />
    </div>
  );
};

export default AiStrategyBuilder;
