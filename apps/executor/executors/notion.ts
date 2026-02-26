import { ExecutionModel } from "@quantnest-trading/db/client";
import { generateDailyPerformanceAnalysis } from "../ai-models/gemini";
import type { NodeType } from "../types";
import { Client } from "@notionhq/client";

interface NotionDailyReportMetadata {
    notionApiKey?: string;
    parentPageId?: string;
}

interface CreateNotionReportInput {
    workflowId: string;
    nodes: NodeType[];
    metadata: NotionDailyReportMetadata;
}

const NOTION_VERSION = "2025-09-03";
const REPORT_TIMEZONE = "Asia/Kolkata";
const REPORT_CUTOFF_MINUTES = 15 * 60 + 30; // 3:30 PM

function toDateLabel(date: Date): string {
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function asText(content: string) {
    return {
        type: "text",
        text: { content },
    } as const;
}

function normalizeNotionId(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    const lastSegment = trimmed.split("/").pop() || trimmed;
    return lastSegment.split("?")[0] || trimmed;
}

function getNowInTimezone(timeZone: string): { hour: number; minute: number; dayKey: string } {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(now);

    const map: Record<string, string> = {};
    for (const part of parts) {
        if (part.type !== "literal") {
            map[part.type] = part.value;
        }
    }

    const year = map.year || "1970";
    const month = map.month || "01";
    const day = map.day || "01";
    const hour = Number(map.hour || "0");
    const minute = Number(map.minute || "0");

    return {
        hour,
        minute,
        dayKey: `${year}-${month}-${day}`,
    };
}

function getDayKey(date: Date, timeZone: string): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

export function isNotionReportWindowOpen(): boolean {
    const now = getNowInTimezone(REPORT_TIMEZONE);
    return now.hour * 60 + now.minute >= REPORT_CUTOFF_MINUTES;
}

export async function wasNotionReportCreatedToday(workflowId: string, nodeId: string): Promise<boolean> {
    const now = new Date();
    const todayKey = getDayKey(now, REPORT_TIMEZONE);
    const lookbackStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const executions = await ExecutionModel.find({
        workflowId,
        startTime: { $gte: lookbackStart },
        steps: {
            $elemMatch: {
                nodeId,
                nodeType: "Notion Daily Report",
                status: "Success",
            },
        },
    }).select({ startTime: 1, steps: 1 });

    return executions.some((execution: any) => {
        const executionDayKey = getDayKey(new Date(execution.startTime), REPORT_TIMEZONE);
        if (executionDayKey !== todayKey) {
            return false;
        }
        return (execution.steps || []).some(
            (step: any) =>
                step?.nodeId === nodeId &&
                step?.nodeType === "Notion Daily Report" &&
                step?.status === "Success" &&
                String(step?.message || "").toLowerCase().includes("notion report created"),
        );
    });
}

export async function createNotionDailyReport(input: CreateNotionReportInput): Promise<string> {
    const notionApiKey = input.metadata?.notionApiKey?.trim();
    if (!notionApiKey) {
        throw new Error("Missing Notion API key");
    }
    const notion = new Client({
        auth: notionApiKey,
        notionVersion: NOTION_VERSION,
    });

    const hasZerodhaAction = input.nodes.some(
        (node) =>
            String(node.data?.kind || "").toLowerCase() === "action" &&
            String(node.type || "").toLowerCase() === "zerodha",
    );
    if (!hasZerodhaAction) {
        throw new Error("Notion Daily Report is only supported when a Zerodha action node exists");
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const executions = await ExecutionModel.find({
        workflowId: input.workflowId,
        startTime: { $gte: dayStart, $lte: now },
        status: { $in: ["Success", "Failed"] },
    }).sort({ startTime: -1 });

    const totalRuns = executions.length;
    const successfulRuns = executions.filter((execution) => execution.status === "Success").length;
    const failedRuns = executions.filter((execution) => execution.status === "Failed").length;
    const winRate = totalRuns > 0 ? Number(((successfulRuns / totalRuns) * 100).toFixed(1)) : 0;

    const sampleFailures = executions
        .flatMap((execution: any) => execution.steps || [])
        .filter((step: any) => step?.status === "Failed")
        .map((step: any) => String(step?.message || "").trim())
        .filter(Boolean)
        .slice(0, 3);

    const ai = await generateDailyPerformanceAnalysis({
        workflowId: input.workflowId,
        date: now.toISOString().slice(0, 10),
        totalRuns,
        successfulRuns,
        failedRuns,
        winRate,
        sampleFailures,
    });

    const title = `Daily Report - ${toDateLabel(now)}`;

    const parentPageId = input.metadata?.parentPageId?.trim();
    const parent = parentPageId
        ? { type: "page_id", page_id: normalizeNotionId(parentPageId) }
        : { workspace: true };

    const children: any[] = [
        {
            object: "block",
            type: "heading_2",
            heading_2: {
                rich_text: [asText("Win rate")],
            },
        },
        {
            object: "block",
            type: "paragraph",
            paragraph: {
                rich_text: [asText(`${winRate}% (${successfulRuns}/${totalRuns} successful runs)`)],
            },
        },
        {
            object: "block",
            type: "heading_2",
            heading_2: {
                rich_text: [asText("Mistakes")],
            },
        },
    ];

    ai.mistakes.forEach((mistake) => {
        children.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
                rich_text: [asText(mistake)],
            },
        });
    });

    children.push({
        object: "block",
        type: "heading_2",
        heading_2: {
            rich_text: [asText("Improvement suggestions")],
        },
    });

    ai.suggestions.forEach((suggestion) => {
        children.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
                rich_text: [asText(suggestion)],
            },
        });
    });

    children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
            rich_text: [asText(`AI Confidence: ${ai.confidenceScore}/10 (${ai.confidence})`)],
        },
    });

    const result = await notion.pages.create({
        parent: parent as any,
        properties: {
            title: {
                title: [asText(title)],
            },
        },
        children: children as any,
    });
    return result.id || "created";
}
