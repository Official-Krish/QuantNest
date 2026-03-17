import { Button } from "@/components/ui/button";
import type { AiModelDescriptor, AiStrategyBuilderRequest } from "@/types/api";
import { AI_ACTION_OPTIONS } from "./constants";

type Props = {
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
}: Props) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5">
      <label className="text-sm font-medium text-neutral-200">Strategy prompt</label>
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        rows={7}
        className="mt-2 w-full rounded-2xl border border-neutral-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600"
        placeholder="Buy HDFC when RSI on 5m drops below 30 and 15m EMA20 stays above EMA50, then notify me on Gmail and create a Notion report."
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-neutral-200">Market</label>
          <select
            value={market}
            onChange={(e) => onMarketChange(e.target.value as AiStrategyBuilderRequest["market"])}
            className="mt-2 w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="Indian">Indian</option>
            <option value="Crypto">Crypto</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-200">Goal</label>
          <select
            value={goal}
            onChange={(e) => onGoalChange(e.target.value as AiStrategyBuilderRequest["goal"])}
            className="mt-2 w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="alerts">Alerts</option>
            <option value="execution">Execution</option>
            <option value="reporting">Reporting</option>
            <option value="journaling">Journaling</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-200">Risk preference</label>
          <select
            value={riskPreference}
            onChange={(e) =>
              onRiskPreferenceChange(e.target.value as AiStrategyBuilderRequest["riskPreference"])
            }
            className="mt-2 w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-200">Model</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <select
              value={selectedProvider}
              onChange={(e) => onProviderChange(e.target.value)}
              disabled={loadingModels}
              className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-sm text-white"
            >
              {[...new Set(models.map((entry) => String(entry.provider)))].map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={loadingModels}
              className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-sm text-white"
            >
              {providerModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-sm text-neutral-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={brokerExecution}
            onChange={(e) => onBrokerExecutionChange(e.target.checked)}
          />
          Broker execution
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allowDirectExecution}
            onChange={(e) => onAllowDirectExecutionChange(e.target.checked)}
          />
          Allow direct execution
        </label>
      </div>

      <div className="mt-5">
        <label className="text-sm font-medium text-neutral-200">Preferred actions</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {AI_ACTION_OPTIONS.map((action) => {
            const active = selectedActions.includes(action);
            return (
              <button
                key={action}
                type="button"
                onClick={() => onToggleAction(action)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  active
                    ? "border-[#f17463] bg-[#f17463]/10 text-[#f17463]"
                    : "border-neutral-800 bg-black text-neutral-300"
                }`}
              >
                {action}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <label className="text-sm font-medium text-neutral-200">Constraints</label>
        <textarea
          value={constraints}
          onChange={(e) => onConstraintsChange(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-neutral-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600"
        />
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button
          onClick={onGenerate}
          disabled={!canGenerate || generating}
          className="bg-white text-neutral-900 hover:bg-neutral-200 cursor-pointer"
        >
          {generating ? "Generating..." : "Generate workflow"}
        </Button>
        <Button
          variant="outline"
          className="border-neutral-700 bg-neutral-900/50 text-neutral-200 hover:bg-neutral-900 hover:text-neutral-200 cursor-pointer"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
