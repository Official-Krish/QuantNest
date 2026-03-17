import type { AiModelDescriptor, AiModelRequestOptions } from "@quantnest-trading/types/ai";
import type { StrategyPlannerProvider } from "../types";

export const GEMINI_MODELS: AiModelDescriptor[] = [
  {
    id: "gemini-2.5-flash",
    provider: "gemini",
    label: "Gemini 2.5 Flash",
    capabilities: ["strategy-builder"],
    recommended: true,
  },
  {
    id: "gemini-2.5-pro",
    provider: "gemini",
    label: "Gemini 2.5 Pro",
    capabilities: ["strategy-builder"],
  },
];

export const OPENAI_MODELS: AiModelDescriptor[] = [
  {
    id: "gpt-5-mini",
    provider: "openai",
    label: "GPT-5 Mini",
    capabilities: ["strategy-builder"],
    recommended: true,
  },
  {
    id: "gpt-5",
    provider: "openai",
    label: "GPT-5",
    capabilities: ["strategy-builder"],
  },
];

export const ANTHROPIC_MODELS: AiModelDescriptor[] = [
  {
    id: "claude-sonnet-4-5",
    provider: "anthropic",
    label: "Claude Sonnet 4.5",
    capabilities: ["strategy-builder"],
    recommended: true,
  },
  {
    id: "claude-opus-4-1",
    provider: "anthropic",
    label: "Claude Opus 4.1",
    capabilities: ["strategy-builder"],
  },
];

export function listSupportedModels(providers: StrategyPlannerProvider[]): AiModelDescriptor[] {
  return providers.flatMap((provider) => provider.models);
}

export function resolvePlannerProvider(
  providers: StrategyPlannerProvider[],
  options?: AiModelRequestOptions,
): { provider: StrategyPlannerProvider; model: AiModelDescriptor } {
  const allModels = listSupportedModels(providers);
  const requestedModelId = options?.model?.trim();
  const requestedProvider = options?.provider?.trim().toLowerCase();

  if (requestedModelId) {
    const model = allModels.find((entry) => entry.id === requestedModelId);
    if (!model) {
      throw new Error(`Unsupported AI model: ${requestedModelId}`);
    }
    const provider = providers.find((entry) => entry.provider === model.provider);
    if (!provider) {
      throw new Error(`Provider not configured for model: ${requestedModelId}`);
    }
    return { provider, model };
  }

  if (requestedProvider) {
    const provider = providers.find((entry) => entry.provider === requestedProvider);
    if (!provider) {
      throw new Error(`Unsupported AI provider: ${requestedProvider}`);
    }
    const model = provider.models.find((entry) => entry.recommended) ?? provider.models[0];
    if (!model) {
      throw new Error(`No models configured for provider: ${requestedProvider}`);
    }
    return { provider, model };
  }

  const defaultModel = allModels.find((entry) => entry.recommended) ?? allModels[0];
  if (!defaultModel) {
    throw new Error("No AI models are configured.");
  }
  const defaultProvider = providers.find((entry) => entry.provider === defaultModel.provider);
  if (!defaultProvider) {
    throw new Error(`Provider not configured for model: ${defaultModel.id}`);
  }

  return { provider: defaultProvider, model: defaultModel };
}
