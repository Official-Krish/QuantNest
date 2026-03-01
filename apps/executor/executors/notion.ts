import { Client } from "@notionhq/client";
import { generateDailyPerformanceAnalysis } from "../ai-models";
import type { NodeType } from "../types";
import {
    asNotionText,
    isNotionReportWindowOpen,
    normalizeNotionId,
    NOTION_VERSION,
    toDateLabel,
    wasNotionReportCreatedToday,
} from "./reporting/helpers";
import { getZerodhaTradeSummary } from "./reporting/zerodhaReportData";

interface NotionDailyReportMetadata {
    notionApiKey?: string;
    parentPageId?: string;
    aiConsent?: boolean;
}

interface CreateNotionReportInput {
    workflowId: string;
    userId: string;
    nodes: NodeType[];
    metadata: NotionDailyReportMetadata;
}

export { isNotionReportWindowOpen, wasNotionReportCreatedToday };

export async function createNotionDailyReport(input: CreateNotionReportInput): Promise<string> {
    const notionApiKey = input.metadata?.notionApiKey?.trim();
    if (!notionApiKey) {
        throw new Error("Missing Notion API key");
    }
    if (input.metadata?.aiConsent !== true) {
        throw new Error("AI consent is required for Notion trade analysis");
    }

    const notion = new Client({
        auth: notionApiKey,
        notionVersion: NOTION_VERSION,
    });

    const summary = await getZerodhaTradeSummary({
        workflowId: input.workflowId,
        userId: input.userId,
        nodes: input.nodes,
    });

    const ai = await generateDailyPerformanceAnalysis({
        workflowId: input.workflowId,
        date: new Date().toISOString().slice(0, 10),
        ...summary,
    }, {
        provider: "gemini",
        model: "gemini-2.5-flash",
    });

    const title = `Daily Report - ${toDateLabel(new Date())}`;
    const parentPageId = input.metadata?.parentPageId?.trim();
    const parent = parentPageId
        ? { type: "page_id", page_id: normalizeNotionId(parentPageId) }
        : { workspace: true };

    const children: any[] = [
        {
            object: "block",
            type: "heading_2",
            heading_2: {
                rich_text: [asNotionText("Trade performance snapshot")],
            },
        },
        {
            object: "block",
            type: "paragraph",
            paragraph: {
                rich_text: [asNotionText(
                    `Order completion: ${summary.completionRate}% (${summary.completedOrders}/${summary.totalOrders}). ` +
                    `Rejection rate: ${summary.rejectionRate}%. Trades analysed (30d): ${summary.last30DayTradeCount}.`,
                )],
            },
        },
        {
            object: "block",
            type: "paragraph",
            paragraph: {
                rich_text: [asNotionText(
                    `PnL context -> Realized: ${summary.realizedPnl}, Unrealized: ${summary.unrealizedPnl}, Holdings PnL: ${summary.holdingsPnl}.`,
                )],
            },
        },
        {
            object: "block",
            type: "heading_2",
            heading_2: {
                rich_text: [asNotionText("Mistakes")],
            },
        },
    ];

    ai.mistakes.forEach((mistake) => {
        children.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
                rich_text: [asNotionText(mistake)],
            },
        });
    });

    children.push({
        object: "block",
        type: "heading_2",
        heading_2: {
            rich_text: [asNotionText("Improvement suggestions")],
        },
    });

    ai.suggestions.forEach((suggestion) => {
        children.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
                rich_text: [asNotionText(suggestion)],
            },
        });
    });

    children.push({
        object: "block",
        type: "heading_2",
        heading_2: {
            rich_text: [asNotionText("Top traded symbols (30d)")],
        },
    });

    if (!summary.topSymbols.length) {
        children.push({
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: [asNotionText("No recent trade symbols available from Zerodha account.")] },
        });
    } else {
        summary.topSymbols.forEach((item) => {
            children.push({
                object: "block",
                type: "bulleted_list_item",
                bulleted_list_item: {
                    rich_text: [asNotionText(`${item.symbol} (${item.side}) -> qty ${item.quantity}, avg ${item.avgPrice}`)],
                },
            });
        });
    }

    children.push({
        object: "block",
        type: "heading_2",
        heading_2: {
            rich_text: [asNotionText("Historical market context (30d)")],
        },
    });

    if (!summary.historicalContext.length) {
        children.push({
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: [asNotionText("No historical price context available for traded symbols.")] },
        });
    } else {
        summary.historicalContext.forEach((item) => {
            children.push({
                object: "block",
                type: "bulleted_list_item",
                bulleted_list_item: {
                    rich_text: [asNotionText(
                        `${item.symbol} -> 30d change: ${item.changePct30d ?? "N/A"}%, last close: ${item.lastClose ?? "N/A"}`,
                    )],
                },
            });
        });
    }

    children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
            rich_text: [asNotionText(`AI Confidence: ${ai.confidenceScore}/10 (${ai.confidence})`)],
        },
    });

    const result = await notion.pages.create({
        parent: parent as any,
        properties: {
            title: {
                title: [asNotionText(title)],
            },
        },
        children: children as any,
    });

    return result.id || "created";
}
