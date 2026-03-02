import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { generateDailyPerformanceAnalysis } from "../ai-models";
import type { NodeType } from "../types";
import { getZerodhaTradeSummary, getZerodhaTradesForCsv } from "./reporting/zerodhaReportData";

interface GoogleDriveDailyCsvMetadata {
    googleClientEmail?: string;
    googlePrivateKey?: string;
    googleDriveFolderId?: string;
    filePrefix?: string;
    aiConsent?: boolean;
}

interface CreateGoogleDriveDailyCsvInput {
    workflowId: string;
    userId: string;
    nodes: NodeType[];
    metadata: GoogleDriveDailyCsvMetadata;
}

function escapeCsv(value: unknown): string {
    const raw = String(value ?? "");
    if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
        return `"${raw.replace(/"/g, "\"\"")}"`;
    }
    return raw;
}

function toIstDayKey(date: Date): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

export async function createGoogleDriveDailyTradesCsv(input: CreateGoogleDriveDailyCsvInput): Promise<string> {
    const clientEmail = String(input.metadata?.googleClientEmail || "").trim();
    const privateKeyRaw = String(input.metadata?.googlePrivateKey || "").trim();
    if (!clientEmail || !privateKeyRaw) {
        throw new Error("Missing Google service account credentials");
    }
    if (input.metadata?.aiConsent !== true) {
        throw new Error("AI consent is required for Google Drive AI insights");
    }
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

    const allTrades = await getZerodhaTradesForCsv({
        workflowId: input.workflowId,
        userId: input.userId,
        nodes: input.nodes,
    });
    const summary = await getZerodhaTradeSummary({
        workflowId: input.workflowId,
        userId: input.userId,
        nodes: input.nodes,
    });
    const ai = await generateDailyPerformanceAnalysis(
        {
            workflowId: input.workflowId,
            date: toIstDayKey(new Date()),
            ...summary,
        },
        {
            provider: "gemini",
            model: "gemini-2.5-flash",
        },
    );
    const aiMistakes = ai.mistakes.slice(0, 3).join(" | ");
    const aiSuggestions = ai.suggestions.slice(0, 3).join(" | ");

    const todayKey = toIstDayKey(new Date());
    const todaysTrades = allTrades.filter((trade) => {
        if (!trade.fillTime) return false;
        return toIstDayKey(new Date(trade.fillTime)) === todayKey;
    });

    const headers = [
        "tradeId",
        "orderId",
        "symbol",
        "exchange",
        "side",
        "quantity",
        "averagePrice",
        "value",
        "fillTime",
        "aiConfidence",
        "aiConfidenceScore",
        "aiMistakes",
        "aiSuggestions",
    ];

    const rows = todaysTrades.map((trade) =>
        [
            trade.tradeId,
            trade.orderId,
            trade.symbol,
            trade.exchange,
            trade.side,
            trade.quantity,
            trade.averagePrice,
            trade.value,
            trade.fillTime,
            ai.confidence,
            ai.confidenceScore,
            aiMistakes,
            aiSuggestions,
        ].map(escapeCsv).join(","),
    );

    const fallbackRows = rows.length
        ? rows
        : [[
            "NO_TRADES",
            "",
            "",
            "",
            "",
            0,
            0,
            0,
            todayKey,
            ai.confidence,
            ai.confidenceScore,
            aiMistakes,
            aiSuggestions,
        ].map(escapeCsv).join(",")];

    const csv = [headers.join(","), ...fallbackRows].join("\n");
    const filePrefix = String(input.metadata?.filePrefix || "quantnest-trades").trim();
    const fileName = `${filePrefix}-${todayKey}.csv`;

    const auth = new GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: ["https://www.googleapis.com/auth/drive"],
    });
    const authClient = await auth.getClient();

    const drive = google.drive({
        version: "v3",
        auth: authClient as any,
    });

    const folderId = String(input.metadata?.googleDriveFolderId || "").trim();
    const result = await drive.files.create({
        requestBody: {
            name: fileName,
            mimeType: "text/csv",
            ...(folderId ? { parents: [folderId] } : {}),
        },
        media: {
            mimeType: "text/csv",
            body: csv,
        },
        fields: "id,name,webViewLink",
    });

    return result.data.id || fileName;
}
