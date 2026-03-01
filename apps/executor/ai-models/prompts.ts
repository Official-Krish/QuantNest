import type { DailyPerformanceInput } from "./types";

export function buildTradeReasoningPrompt(payload: Record<string, unknown>): string {
    return [
        "You are a trading assistant for notifications.",
        "Given the JSON payload, explain setup briefly and responsibly.",
        "Return STRICT JSON only with keys:",
        "{\"reasoning\":\"string\",\"riskFactors\":\"string\",\"confidence\":\"Low|Medium|High\",\"confidenceScore\":1-10}",
        "Constraints:",
        "- Keep reasoning + riskFactors concise; total under 120 words.",
        "- Mention key indicators only if present in payload.",
        "- Be factual. No guarantees.",
        "",
        JSON.stringify(payload),
    ].join("\n");
}

export function buildDailyPerformancePrompt(input: DailyPerformanceInput): string {
    return [
        "You are a trading performance analyst.",
        "Given daily workflow stats, return STRICT JSON only.",
        "Schema:",
        "{\"mistakes\":[\"string\"],\"suggestions\":[\"string\"],\"confidence\":\"Low|Medium|High\",\"confidenceScore\":1-10}",
        "Rules:",
        "- Keep each bullet short and practical.",
        "- mistakes max 3 items; suggestions max 3 items.",
        "- No markdown, no extra keys.",
        "",
        JSON.stringify(input),
    ].join("\n");
}
