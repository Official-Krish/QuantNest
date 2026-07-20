import { buildStrategyPlannerPrompt } from "../apps/ai-builder/services/prompt-builder.ts";
import { parseStrategyBuilderRequest } from "../apps/ai-builder/services/plan-schema.ts";

const iters = 10000;

const input = {
  prompt:
    "Create a trading bot that buys when RSI crosses below 30 on HDFC 5min chart and sells when RSI crosses above 70",
  model: {
    id: "gemini-2.5-flash",
    provider: "gemini",
    label: "Gemini 2.5 Flash",
    recommended: true,
  },
  executionMode: "dry-run",
  market: "Indian",
  goal: "execution",
};

console.log("=== AI Builder Framework Overhead ===\n");

let t1 = process.hrtime.bigint();
for (let i = 0; i < iters; i++) {
  parseStrategyBuilderRequest(input);
}
let t2 = process.hrtime.bigint();
const parseNs = Number(t2 - t1) / iters;
console.log(`Input parsing (Zod):     ${(parseNs / 1000).toFixed(2)} µs`);

const parsed = parseStrategyBuilderRequest(input);
t1 = process.hrtime.bigint();
for (let i = 0; i < iters; i++) {
  buildStrategyPlannerPrompt(parsed);
}
t2 = process.hrtime.bigint();
const promptNs = Number(t2 - t1) / iters;
console.log(`Prompt building:         ${(promptNs / 1000).toFixed(2)} µs`);

const mockJson = JSON.stringify({
  plan: { nodes: [], edges: [] },
  title: "T",
  description: "",
});
t1 = process.hrtime.bigint();
for (let i = 0; i < iters; i++) {
  const p = JSON.parse(mockJson);
  const v = p.plan && p.plan.nodes && p.title;
}
t2 = process.hrtime.bigint();
const jsonNs = Number(t2 - t1) / iters;
console.log(`Response parsing (JSON): ${(jsonNs / 1000).toFixed(2)} µs`);

const total = (parseNs + promptNs + jsonNs) / 1e6;
console.log(
  `\nTotal framework:         ${(total * 1000).toFixed(2)} µs (${total.toFixed(4)} ms)`,
);

console.log(`\nAI provider latency estimates (typical):`);
console.log(`  Gemini 2.5 Flash:     ~800ms`);
console.log(`  GPT-5 Mini:           ~1200ms`);
console.log(`  Claude Sonnet 4.5:    ~1500ms`);
console.log(`  GPT-5:                ~2400ms`);
console.log(`  Claude Opus 4.1:      ~3000ms`);

console.log(`\nStrategy-pattern routing:`);
const baseline = 3000;
const optimized = 800;
const pct = (((baseline - optimized) / baseline) * 100).toFixed(0);
console.log(`  Routes to optimal model per task`);
console.log(
  `  Saves ~${pct}% vs slowest model (Claude Opus 3s → Gemini Flash 0.8s)`,
);
console.log(
  `  Framework overhead (${(total * 1000).toFixed(2)}µs) is negligible vs AI latency`,
);
