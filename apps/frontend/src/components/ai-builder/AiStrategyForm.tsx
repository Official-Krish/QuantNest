import { useState } from "react";
import type { AiStrategyFormProps } from "./types";
import {
  AdvancedConstraintsSection,
  BasicSelectGrid,
  CompatibilityWarning,
  ExecutionSettingsSection,
  FormHeader,
  PreferredActionsSection,
  PromptField,
} from "./formSections";

export function AiStrategyForm({
  prompt,
  onPromptChange,
  market,
  onMarketChange,
  goal,
  onGoalChange,
  riskPreference,
  onRiskPreferenceChange,
  brokerExecution,
  onBrokerExecutionChange,
  allowDirectExecution,
  onAllowDirectExecutionChange,
  selectedActions,
  onToggleAction,
  constraints,
  onConstraintsChange,
  models,
  loadingModels,
  selectedProvider,
  onProviderChange,
  selectedModel,
  onModelChange,
  providerModels,
  canGenerate,
  generating,
  error,
  onGenerate,
  onBack,
}: AiStrategyFormProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="rounded-[12px] border border-neutral-800 bg-[#0d0d0d] p-8 text-[#e8e8e8] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <FormHeader />

      <div className="grid gap-6 md:grid-cols-2">
        <PromptField prompt={prompt} onPromptChange={onPromptChange} />

        <BasicSelectGrid
          market={market}
          onMarketChange={onMarketChange}
          goal={goal}
          onGoalChange={onGoalChange}
          riskPreference={riskPreference}
          onRiskPreferenceChange={onRiskPreferenceChange}
          models={models}
          loadingModels={loadingModels}
          selectedProvider={selectedProvider}
          onProviderChange={onProviderChange}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          providerModels={providerModels}
        />

        <div className="md:col-span-2">
          <div className="my-1 h-px bg-[#222]" />
        </div>

        <PreferredActionsSection
          selectedActions={selectedActions}
          onToggleAction={onToggleAction}
          brokerExecution={brokerExecution}
        />

        <ExecutionSettingsSection
          brokerExecution={brokerExecution}
          onBrokerExecutionChange={onBrokerExecutionChange}
          allowDirectExecution={allowDirectExecution}
          onAllowDirectExecutionChange={onAllowDirectExecutionChange}
        />

        <CompatibilityWarning
          brokerExecution={brokerExecution}
          selectedActions={selectedActions}
          allowDirectExecution={allowDirectExecution}
          goal={goal}
        />

        <AdvancedConstraintsSection
          advancedOpen={advancedOpen}
          onToggle={() => setAdvancedOpen((current) => !current)}
          constraints={constraints}
          onConstraintsChange={onConstraintsChange}
        />
      </div>

      {error ? (
        <div className="mt-5 rounded-[8px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || generating}
          className="cursor-pointer rounded-[8px] bg-[#e07b3e] px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? "Generating workflow..." : "Generate workflow"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-[8px] border border-[#333] bg-transparent px-4 py-2.5 text-[14px] text-[#888] transition-colors hover:border-[#555] hover:text-[#cfcfcf]"
        >
          Back
        </button>
        <span className="ml-auto text-[11px] text-[#555]">* required</span>
      </div>
    </div>
  );
}
