import { google } from "googleapis";

const SHEET_ID_REGEX = /^[A-Za-z0-9-_]{20,}$/;

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n").trim();
}

function getGoogleSheetsServiceAccountCredentials() {
  const clientEmail = String(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || "").trim();
  const privateKey = normalizePrivateKey(String(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY || ""));

  if (!clientEmail || !privateKey) {
    throw new Error("Google Sheets integration is temporarily unavailable.");
  }

  return { clientEmail, privateKey };
}

export function getGoogleSheetsServiceAccountEmail() {
  return String(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || "").trim();
}

export function extractSpreadsheetId(input: string) {
  const value = String(input || "").trim();
  if (!value) return null;

  if (SHEET_ID_REGEX.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    if (!/docs\.google\.com$/i.test(url.hostname)) {
      return null;
    }
    const match = url.pathname.match(/\/spreadsheets\/d\/([A-Za-z0-9-_]+)/i);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function extractSheetGid(input: string) {
  try {
    const url = new URL(String(input || "").trim());
    const gid = url.searchParams.get("gid");
    if (!gid) return null;
    const parsed = Number(gid);
    return Number.isInteger(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function verifyGoogleSheetAccess(params: {
  sheetUrl: string;
}) {
  const sheetId = extractSpreadsheetId(params.sheetUrl);
  if (!sheetId) {
    throw new Error("Invalid Google Sheet URL. Paste a docs.google.com/spreadsheets URL.");
  }

  const { clientEmail, privateKey } = getGoogleSheetsServiceAccountCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: false,
      fields: "spreadsheetId,properties.title,sheets(properties(sheetId,title))",
    });

    const gid = extractSheetGid(params.sheetUrl);
    const availableSheets = response.data.sheets || [];
    const selectedSheet =
      (gid !== null
        ? availableSheets.find((sheet) => Number(sheet.properties?.sheetId) === gid)
        : undefined) || availableSheets[0];

    return {
      sheetId: response.data.spreadsheetId || sheetId,
      spreadsheetTitle: response.data.properties?.title || "Untitled Spreadsheet",
      sheetName: selectedSheet?.properties?.title || "Sheet1",
      serviceAccountEmail: clientEmail,
    };
  } catch (error: any) {
    const rawMessage = String(error?.message || "");
    const lowerMessage = rawMessage.toLowerCase();
    const status = Number(error?.code || error?.status || error?.response?.status || 0);
    if (
      status === 403 ||
      status === 404 ||
      lowerMessage.includes("caller does not have permission") ||
      lowerMessage.includes("insufficient permission") ||
      lowerMessage.includes("permission denied") ||
      lowerMessage.includes("requested entity was not found") ||
      lowerMessage.includes("the caller does not have permission")
    ) {
      throw new Error(
        "Please add our service account email in Google Sheet Share settings (Editor access) and try again.",
      );
    }

    if (
      rawMessage.includes("BAD_BASE64_DECODE") ||
      rawMessage.includes("PEM routines") ||
      rawMessage.includes("DECODER")
    ) {
      throw new Error("Google Sheets integration is temporarily unavailable.");
    }

    throw new Error(rawMessage || "Failed to verify Google Sheet access.");
  }
}
