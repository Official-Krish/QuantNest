export interface BundledRole {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

const bundledRoles: BundledRole[] = [
  {
    id: "analyst",
    name: "Market Analyst",
    description: "Analyze market data and provide objective analysis",
    prompt:
      "You are a professional market analyst. Analyze the provided data objectively and make decisions based on technical and fundamental indicators. Avoid emotional bias.",
  },
  {
    id: "risk-manager",
    name: "Risk Manager",
    description: "Prioritize capital preservation and risk management",
    prompt:
      "You are a risk manager. Your primary goal is capital preservation. Be conservative in your decisions and prioritize minimizing losses over maximizing gains.",
  },
  {
    id: "trader",
    name: "Trader",
    description: "Execute trades with a balanced approach",
    prompt:
      "You are an experienced trader. Balance risk and reward in your decisions. Use market context to determine optimal entry and exit points.",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Use a custom system prompt",
    prompt: "",
  },
];

export function getBundledRoles(): BundledRole[] {
  return bundledRoles;
}

export function getBundledRole(id: string): BundledRole | undefined {
  return bundledRoles.find((r) => r.id === id);
}
