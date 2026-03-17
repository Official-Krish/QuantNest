import type { AiModelDescriptor, AiStrategyBuilderRequest } from "@/types/api";
import { AI_ACTION_OPTIONS } from "./constants";

const BROKER_ACTIONS = ["zerodha", "groww", "lighter"];

export function FormHeader() {
  return (
    <div className="mb-7">
      <div className="mb-2 inline-block text-[11px] font-medium uppercase tracking-[0.08em] text-[#e07b3e]">
        AI Strategy Builder
      </div>
      <h1 className="text-[22px] font-medium text-white">Describe your workflow</h1>
      <p className="mt-1 text-[13px] leading-6 text-[#888]">
        The AI generates a workflow plan for review. You fill credentials and save through the
        normal builder.
      </p>
    </div>
  );
}

export function PromptField({
  prompt,
  onPromptChange,
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
}) {
  const promptTooShort = prompt.trim().length > 0 && prompt.trim().length < 12;

  return (
    <div className="md:col-span-2">
      <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.04em] text-[#888]">
        Strategy prompt <span className="text-[#e07b3e]">*</span>
      </label>
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        rows={5}
        className={`w-full rounded-[8px] border bg-[#1a1a1a] px-3 py-3 text-[14px] leading-6 text-[#e8e8e8] outline-none transition-colors placeholder:text-[#666] ${
          promptTooShort ? "border-amber-500/50" : "border-[#333]"
        } focus:border-[#e07b3e]`}
        placeholder="e.g. Buy HDFC when RSI on 5m drops below 30 and 15m EMA20 stays above EMA50, then notify me on Gmail and create a Notion report."
      />
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className={promptTooShort ? "text-amber-300" : "text-[#666]"}>
          {promptTooShort
            ? "Add more detail so AI can build a valid workflow."
            : "Good prompt = asset + trigger value + action + execution order."}
        </span>
      </div>
    </div>
  );
}

export function BasicSelectGrid({
  market,
  onMarketChange,
  goal,
  onGoalChange,
  riskPreference,
  onRiskPreferenceChange,
  models,
  loadingModels,
  selectedProvider,
  onProviderChange,
  selectedModel,
  onModelChange,
  providerModels,
}: {
  market: AiStrategyBuilderRequest["market"];
  onMarketChange: (value: AiStrategyBuilderRequest["market"]) => void;
  goal: AiStrategyBuilderRequest["goal"];
  onGoalChange: (value: AiStrategyBuilderRequest["goal"]) => void;
  riskPreference: AiStrategyBuilderRequest["riskPreference"];
  onRiskPreferenceChange: (value: AiStrategyBuilderRequest["riskPreference"]) => void;
  models: AiModelDescriptor[];
  loadingModels: boolean;
  selectedProvider: string;
  onProviderChange: (value: string) => void;
  selectedModel: string;
  onModelChange: (value: string) => void;
  providerModels: AiModelDescriptor[];
}) {
  const providers = [...new Set(models.map((entry) => String(entry.provider)))];

  return (
    <>
      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.04em] text-[#888]">
          Market
        </label>
        <select
          value={market}
          onChange={(e) => onMarketChange(e.target.value as AiStrategyBuilderRequest["market"])}
          className="w-full rounded-[8px] border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-[#e8e8e8] outline-none transition-colors focus:border-[#e07b3e]"
        >
          <option value="Indian">Indian</option>
          <option value="Crypto">Crypto</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.04em] text-[#888]">
          Goal
        </label>
        <select
          value={goal}
          onChange={(e) => onGoalChange(e.target.value as AiStrategyBuilderRequest["goal"])}
          className="w-full rounded-[8px] border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-[#e8e8e8] outline-none transition-colors focus:border-[#e07b3e]"
        >
          <option value="alerts">Alerts</option>
          <option value="execution">Execution</option>
          <option value="reporting">Reporting</option>
          <option value="journaling">Journaling</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.04em] text-[#888]">
          Risk preference
        </label>
        <select
          value={riskPreference}
          onChange={(e) => onRiskPreferenceChange(e.target.value as AiStrategyBuilderRequest["riskPreference"])}
          className="w-full rounded-[8px] border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-[#e8e8e8] outline-none transition-colors focus:border-[#e07b3e]"
        >
          <option value="conservative">Conservative</option>
          <option value="balanced">Balanced</option>
          <option value="aggressive">Aggressive</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.04em] text-[#888]">
          Model
        </label>
        <div className="flex gap-2">
          <select
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            disabled={loadingModels}
            className="w-[130px] shrink-0 rounded-[8px] border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-[#e8e8e8] outline-none transition-colors focus:border-[#e07b3e]"
          >
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={loadingModels}
            className="min-w-0 flex-1 rounded-[8px] border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-[#e8e8e8] outline-none transition-colors focus:border-[#e07b3e]"
          >
            {providerModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-[11px] text-[#666]">
          Pick the provider first, then the model used to draft the workflow plan.
        </p>
      </div>
    </>
  );
}

export function PreferredActionsSection({
  selectedActions,
  onToggleAction,
  brokerExecution,
}: {
  selectedActions: string[];
  onToggleAction: (action: string) => void;
  brokerExecution: boolean;
}) {
  return (
    <div className="md:col-span-2">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[#555]">
        Preferred actions
      </p>
      <p className="mb-3 text-[12px] text-[#666]">Select what AI is allowed to use in the draft.</p>
      <div className="flex flex-wrap gap-2">
        {AI_ACTION_OPTIONS.map((action) => {
          const active = selectedActions.includes(action);
          const brokerAction = BROKER_ACTIONS.includes(action);
          const dimmed = brokerAction && !brokerExecution;

          return (
            <button
              key={action}
              type="button"
              onClick={() => onToggleAction(action)}
              className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
                active
                  ? "border-[#e07b3e] bg-[rgba(224,123,62,.08)] text-[#e07b3e]"
                  : "border-[#333] bg-transparent text-[#888] hover:border-[#555] hover:text-[#cfcfcf]"
              } ${dimmed ? "opacity-60" : "opacity-100"}`}
            >
              {action}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ExecutionSettingsSection({
  brokerExecution,
  onBrokerExecutionChange,
  allowDirectExecution,
  onAllowDirectExecutionChange,
}: {
  brokerExecution: boolean;
  onBrokerExecutionChange: (value: boolean) => void;
  allowDirectExecution: boolean;
  onAllowDirectExecutionChange: (value: boolean) => void;
}) {
  return (
    <div className="md:col-span-2">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[#555]">
        Execution settings
      </p>
      <div className="space-y-2.5">
        <ToggleRow
          label="Broker execution"
          helper="Route orders through your connected broker API"
          checked={brokerExecution}
          onChange={onBrokerExecutionChange}
        />
        <ToggleRow
          label="Allow direct execution"
          helper="Execute trades without a manual confirmation step"
          checked={allowDirectExecution}
          onChange={onAllowDirectExecutionChange}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-[8px] border border-[#333] bg-[#1a1a1a] px-3.5 py-3">
      <div className="pr-4">
        <span className="block text-[13px] text-[#e8e8e8]">{label}</span>
        <span className="block text-[11px] text-[#666]">{helper}</span>
      </div>
      <span className="relative h-5 w-9 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-[#333] transition peer-checked:bg-[rgba(224,123,62,.3)]" />
        <span className="absolute left-[3px] top-[3px] h-3.5 w-3.5 rounded-full bg-[#888] transition peer-checked:translate-x-4 peer-checked:bg-[#e07b3e]" />
      </span>
    </label>
  );
}

export function CompatibilityWarning({
  brokerExecution,
  selectedActions,
  allowDirectExecution,
  goal,
}: {
  brokerExecution: boolean;
  selectedActions: string[];
  allowDirectExecution: boolean;
  goal: AiStrategyBuilderRequest["goal"];
}) {
  const hasBrokerAction = selectedActions.some((action) => BROKER_ACTIONS.includes(action));
  const hasCompatibilityWarning = (!brokerExecution && hasBrokerAction) || (!allowDirectExecution && goal === "execution");

  if (!hasCompatibilityWarning) return null;

  return (
    <div className="md:col-span-2 rounded-[8px] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-200">
      {!brokerExecution && hasBrokerAction ? (
        <p>Broker actions are selected while broker execution is off. AI may still prefer alerts or reporting-only alternatives.</p>
      ) : null}
      {!allowDirectExecution && goal === "execution" ? (
        <p className={!brokerExecution && hasBrokerAction ? "mt-2" : undefined}>
          Direct execution is disabled, so the draft may include review or notification steps instead of immediate order placement.
        </p>
      ) : null}
    </div>
  );
}

export function AdvancedConstraintsSection({
  advancedOpen,
  onToggle,
  constraints,
  onConstraintsChange,
}: {
  advancedOpen: boolean;
  onToggle: () => void;
  constraints: string;
  onConstraintsChange: (value: string) => void;
}) {
  return (
    <div className="md:col-span-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-[8px] border border-[#333] bg-[#121212] px-3.5 py-3 text-left text-[12px] uppercase tracking-[0.06em] text-[#888] transition-colors hover:border-[#555] hover:text-[#cfcfcf]"
      >
        <span>Advanced</span>
        <span>{advancedOpen ? "Hide" : "Show"}</span>
      </button>
      {advancedOpen ? (
        <div className="mt-3">
          <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.04em] text-[#888]">
            Constraints
          </label>
          <textarea
            value={constraints}
            onChange={(e) => onConstraintsChange(e.target.value)}
            rows={3}
            className="w-full rounded-[8px] border border-[#333] bg-[#1a1a1a] px-3 py-3 text-[14px] leading-6 text-[#e8e8e8] outline-none transition-colors placeholder:text-[#666] focus:border-[#e07b3e]"
          />
          <p className="mt-2 text-[11px] text-[#666]">
            Use constraints only for shape control, for example keep one trigger or prefer Gmail plus Notion.
          </p>
        </div>
      ) : null}
    </div>
  );
}
