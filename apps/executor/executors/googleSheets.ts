import { google } from "googleapis";
import type { ExecutionContext } from "../workflow/execute.context";

interface GoogleSheetsReportMetadata {
    sheetUrl?: string;
    sheetId?: string;
    sheetName?: string;
}

interface CreateGoogleSheetsExecutionReportInput {
    workflowId: string;
    userId: string;
    metadata: GoogleSheetsReportMetadata;
    context?: ExecutionContext;
}

const SPREADSHEET_ID_REGEX = /^[A-Za-z0-9-_]{20,}$/;

function extractSpreadsheetId(sheetUrl: string) {
    const value = String(sheetUrl || "").trim();
    if (!value) return null;
    if (SPREADSHEET_ID_REGEX.test(value)) return value;

    try {
        const url = new URL(value);
        const match = url.pathname.match(/\/spreadsheets\/d\/([A-Za-z0-9-_]+)/i);
        return match?.[1] || null;
    } catch {
        return null;
    }
}

function normalizePrivateKey(privateKey: string) {
    return privateKey.replace(/\\n/g, "\n").trim();
}

function getGoogleSheetsServiceAccountCredentials() {
    const clientEmail = String(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || "").trim();
    const privateKey = normalizePrivateKey(String(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY || ""));
    if (!clientEmail || !privateKey) {
        throw new Error(
            "Google Sheets service account is not configured on executor. Set GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL and GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY.",
        );
    }
    return { clientEmail, privateKey };
}

export async function createGoogleSheetsExecutionReport(
    input: CreateGoogleSheetsExecutionReportInput,
): Promise<string> {
    const spreadsheetId =
        String(input.metadata?.sheetId || "").trim() ||
        extractSpreadsheetId(String(input.metadata?.sheetUrl || ""));
    if (!spreadsheetId) {
        throw new Error("Missing spreadsheet ID. Verify Sheet URL in node configuration.");
    }

    const { clientEmail, privateKey } = getGoogleSheetsServiceAccountCredentials();

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const range = `${String(input.metadata?.sheetName || "Sheet1").trim() || "Sheet1"}!A:H`;

    const details = input.context?.details;
    const aiContext = details?.aiContext;

    const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
            values: [[
                new Date().toISOString(),
                input.workflowId,
                input.userId,
                details?.symbol || aiContext?.symbol || "",
                details?.tradeType || input.context?.eventType || "",
                details?.quantity ?? "",
                details?.targetPrice ?? aiContext?.targetPrice ?? "",
                details?.condition || aiContext?.condition || "",
            ]],
        },
    });

    return appendResponse.data.updates?.updatedRange || `${spreadsheetId}:${range}`;
}
