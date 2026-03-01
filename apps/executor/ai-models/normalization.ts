import type { NotificationAiInsight } from "../types";
import type { DailyPerformanceAnalysis } from "./types";

export interface RawInsightResponse {
    reasoning?: string;
    riskFactors?: string;
    confidence?: string;
    confidenceScore?: number;
}

export function normalizeConfidence(value: string | undefined): "Low" | "Medium" | "High" {
    const normalized = (value || "").trim().toLowerCase();
    if (normalized === "low") return "Low";
    if (normalized === "high") return "High";
    return "Medium";
}

export function extractJsonBlock(text: string): string {
    const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
        return fenced[1];
    }
    return text.trim();
}

export function normalizeInsight(raw: RawInsightResponse): NotificationAiInsight | null {
    const reasoning = raw.reasoning?.trim();
    const riskFactors = raw.riskFactors?.trim();
    if (!reasoning || !riskFactors) {
        return null;
    }

    const score = Number(raw.confidenceScore);
    const boundedScore = Number.isFinite(score)
        ? Math.max(1, Math.min(10, Math.round(score)))
        : 5;

    return {
        reasoning,
        riskFactors,
        confidence: normalizeConfidence(raw.confidence),
        confidenceScore: boundedScore,
    };
}

export function normalizeDailyPerformanceAnalysis(
    raw: Partial<DailyPerformanceAnalysis>,
    fallback: DailyPerformanceAnalysis
): DailyPerformanceAnalysis {
    const mistakes = Array.isArray(raw.mistakes)
        ? raw.mistakes.map((m) => String(m).trim()).filter(Boolean).slice(0, 3)
        : [];
    const suggestions = Array.isArray(raw.suggestions)
        ? raw.suggestions.map((s) => String(s).trim()).filter(Boolean).slice(0, 3)
        : [];
    const score = Number(raw.confidenceScore);

    return {
        mistakes: mistakes.length ? mistakes : fallback.mistakes,
        suggestions: suggestions.length ? suggestions : fallback.suggestions,
        confidence: normalizeConfidence(raw.confidence),
        confidenceScore: Number.isFinite(score)
            ? Math.max(1, Math.min(10, Math.round(score)))
            : fallback.confidenceScore,
    };
}
