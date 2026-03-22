import type {
  AiModelDescriptor,
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
  AiStrategyDraftSession,
} from "@/types/api";

export type AiMetadataOverrides = Record<string, Record<string, unknown>>;

export type AiStrategyFormProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  market: AiStrategyBuilderRequest["market"];
  onMarketChange: (value: AiStrategyBuilderRequest["market"]) => void;
  goal: AiStrategyBuilderRequest["goal"];
  onGoalChange: (value: AiStrategyBuilderRequest["goal"]) => void;
  riskPreference: AiStrategyBuilderRequest["riskPreference"];
  onRiskPreferenceChange: (value: AiStrategyBuilderRequest["riskPreference"]) => void;
  brokerExecution: boolean;
  onBrokerExecutionChange: (value: boolean) => void;
  allowDirectExecution: boolean;
  onAllowDirectExecutionChange: (value: boolean) => void;
  selectedActions: string[];
  onToggleAction: (action: string) => void;
  constraints: string;
  onConstraintsChange: (value: string) => void;
  models: AiModelDescriptor[];
  loadingModels: boolean;
  selectedProvider: string;
  onProviderChange: (value: string) => void;
  selectedModel: string;
  onModelChange: (value: string) => void;
  providerModels: AiModelDescriptor[];
  canGenerate: boolean;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
  onBack: () => void;
};

export type AiPlanSetupDialogProps = {
  open: boolean;
  result: AiStrategyBuilderResponse | AiStrategyDraftSession | null;
  workflowName: string;
  metadataOverrides: AiMetadataOverrides;
  onOpenChange: (open: boolean) => void;
  onWorkflowNameChange: (value: string) => void;
  onMetadataOverridesChange: (value: AiMetadataOverrides) => void;
  onContinue: () => void;
};
