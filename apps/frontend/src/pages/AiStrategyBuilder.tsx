import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiCreateAiStrategyDraft,
  apiEditAiStrategyDraft,
  apiGetAiModels,
  apiGetAiStrategyDraft,
} from "@/http";
import type {
  AiModelDescriptor,
  AiStrategyBuilderRequest,
  AiStrategyDraftSession,
} from "@/types/api";
import { AiPlanReview } from "@/components/ai-builder/AiPlanReview";
import { AiStrategyForm } from "@/components/ai-builder/AiStrategyForm";
import {
  AI_ALLOWED_NODE_TYPES,
  DEFAULT_AI_CONSTRAINTS,
} from "@/components/ai-builder/constants";
import { normalizeGeneratedNodes } from "@/components/ai-builder/utils";
import { AiPlanSetupDialog } from "@/components/ai-builder/AiPlanSetupDialog";
import type { AiMetadataOverrides } from "@/components/ai-builder/types";

const LAST_DRAFT_STORAGE_KEY = "ai-builder-v2-last-draft-id";

function toRequestPayload(input: {
  prompt: string;
  market: AiStrategyBuilderRequest["market"];
  goal: AiStrategyBuilderRequest["goal"];
  riskPreference: AiStrategyBuilderRequest["riskPreference"];
  brokerExecution: boolean;
  allowDirectExecution: boolean;
  selectedActions: string[];
  constraints: string;
  selectedProvider: string;
  selectedModel: string;
}): AiStrategyBuilderRequest {
  return {
    prompt: input.prompt.trim(),
    market: input.market,
    goal: input.goal,
    riskPreference: input.riskPreference,
    brokerExecution: input.brokerExecution,
    allowDirectExecution: input.allowDirectExecution,
    preferredActions: input.selectedActions as AiStrategyBuilderRequest["preferredActions"],
    constraints: input.constraints
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean),
    model: {
      provider: input.selectedProvider,
      model: input.selectedModel,
    },
    allowedNodeTypes: AI_ALLOWED_NODE_TYPES,
  };
}

export const AiStrategyBuilder = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<AiModelDescriptor[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AiStrategyDraftSession | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [metadataOverrides, setMetadataOverrides] = useState<AiMetadataOverrides>({});
  const [editInstruction, setEditInstruction] = useState("");
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [market, setMarket] = useState<AiStrategyBuilderRequest["market"]>("Indian");
  const [goal, setGoal] = useState<AiStrategyBuilderRequest["goal"]>("alerts");
  const [riskPreference, setRiskPreference] =
    useState<AiStrategyBuilderRequest["riskPreference"]>("balanced");
  const [brokerExecution, setBrokerExecution] = useState(false);
  const [allowDirectExecution, setAllowDirectExecution] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [constraints, setConstraints] = useState(DEFAULT_AI_CONSTRAINTS);
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
    setHasSavedDraft(Boolean(window.localStorage.getItem(LAST_DRAFT_STORAGE_KEY)));
  }, []);

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

  const syncDraftToForm = (nextDraft: AiStrategyDraftSession) => {
    setDraft(nextDraft);
    setWorkflowName(nextDraft.response.plan.workflowName);
    setPrompt(nextDraft.request.prompt);
    setMarket(nextDraft.request.market);
    setGoal(nextDraft.request.goal);
    setRiskPreference(nextDraft.request.riskPreference ?? "balanced");
    setBrokerExecution(Boolean(nextDraft.request.brokerExecution));
    setAllowDirectExecution(Boolean(nextDraft.request.allowDirectExecution));
    setSelectedActions([...(nextDraft.request.preferredActions || [])]);
    setConstraints((nextDraft.request.constraints || []).join("\n") || DEFAULT_AI_CONSTRAINTS);
    setSelectedProvider(String(nextDraft.request.model?.provider || selectedProvider));
    setSelectedModel(String(nextDraft.request.model?.model || selectedModel));
    window.localStorage.setItem(LAST_DRAFT_STORAGE_KEY, nextDraft.draftId);
    setHasSavedDraft(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const nextDraft = await apiCreateAiStrategyDraft(
        toRequestPayload({
          prompt,
          market,
          goal,
          riskPreference,
          brokerExecution,
          allowDirectExecution,
          selectedActions,
          constraints,
          selectedProvider,
          selectedModel,
        }),
      );
      syncDraftToForm(nextDraft);
      setMetadataOverrides({});
      setEditInstruction("");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to generate workflow draft.");
    } finally {
      setGenerating(false);
    }
  };

  const handleResumeDraft = async () => {
    const draftId = window.localStorage.getItem(LAST_DRAFT_STORAGE_KEY);
    if (!draftId) return;

    setLoadingDraft(true);
    setError(null);
    try {
      const savedDraft = await apiGetAiStrategyDraft(draftId);
      syncDraftToForm(savedDraft);
    } catch (e: any) {
      window.localStorage.removeItem(LAST_DRAFT_STORAGE_KEY);
      setHasSavedDraft(false);
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to resume saved draft.");
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleApplyEdit = async () => {
    if (!draft || editInstruction.trim().length < 4) return;

    setEditing(true);
    setError(null);
    try {
      const nextDraft = await apiEditAiStrategyDraft(draft.draftId, {
        instruction: editInstruction.trim(),
        model: {
          provider: selectedProvider,
          model: selectedModel,
        },
      });
      syncDraftToForm(nextDraft);
      setEditInstruction("");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to apply AI edit.");
    } finally {
      setEditing(false);
    }
  };

  const openInBuilder = () => {
    if (!draft) return;
    navigate("/create/builder", {
      state: {
        generatedPlan: {
          workflowName,
          marketType: draft.response.plan.marketType,
          nodes: normalizeGeneratedNodes(draft.response.plan, metadataOverrides),
          edges: draft.response.plan.edges,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-black px-6 pb-10 pt-24 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
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
            generating={generating || loadingDraft}
            error={error}
            onGenerate={handleGenerate}
            onBack={() => navigate("/create/onboarding")}
          />

          <AiPlanReview
            draft={draft}
            generating={generating || loadingDraft}
            editing={editing}
            editInstruction={editInstruction}
            onEditInstructionChange={setEditInstruction}
            onApplyEdit={handleApplyEdit}
            onResumeDraft={handleResumeDraft}
            resumableDraft={hasSavedDraft}
            onOpenInBuilder={() => {
              if (!draft) return;
              setWorkflowName(draft.response.plan.workflowName);
              setSetupOpen(true);
            }}
          />
        </div>

        <div className="mx-auto mt-6 max-w-[720px] rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100 lg:mx-0">
          <p className="font-medium uppercase tracking-[0.16em] text-amber-300">
            Beta / Testing Phase
          </p>
          <ul className="mt-3 space-y-2 text-amber-100/90">
            <li>v2 drafts now support iterative edits, branching flows, and saved sessions.</li>
            <li>Always review generated nodes, thresholds, and action metadata before saving.</li>
            <li>Do not rely on generated workflows for live trading without manual verification.</li>
          </ul>
        </div>
      </div>

      <AiPlanSetupDialog
        open={setupOpen}
        result={draft}
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
