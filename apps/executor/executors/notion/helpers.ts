import { ExecutionModel } from "@quantnest-trading/db/client";

export const NOTION_VERSION = "2025-09-03";
export const REPORT_TIMEZONE = "Asia/Kolkata";
const REPORT_CUTOFF_MINUTES = 15 * 60 + 30; // 3:30 PM IST

function getNowInTimezone(timeZone: string): { hour: number; minute: number } {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(new Date());

    const map: Record<string, string> = {};
    for (const part of parts) {
        if (part.type !== "literal") {
            map[part.type] = part.value;
        }
    }

    return {
        hour: Number(map.hour || "0"),
        minute: Number(map.minute || "0"),
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
                (step?.status === "Success" || step?.status === "Failed"),
        );
    });
}

export function toDateLabel(date: Date): string {
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function asNotionText(content: string) {
    return {
        type: "text",
        text: { content },
    } as const;
}

export function normalizeNotionId(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    const lastSegment = trimmed.split("/").pop() || trimmed;
    return lastSegment.split("?")[0] || trimmed;
}
