import { createUserNotification } from "@quantnest-trading/executor-utils";
import { createGoogleDriveDailyTradesCsv } from "../../executors/googleDrive";
import { createGoogleSheetsExecutionReport } from "../../executors/googleSheets";
import { createNotionDailyReport, isNotionReportWindowOpen, wasNotionReportCreatedToday } from "../../executors/notion";
import { wasDailyActionCreatedToday } from "../../executors/reporting/helpers";
import { shouldSkipActionByCondition } from "../execute.context";
import { pushStep, type ActionHandler } from "./shared";

export const notionActionHandler: ActionHandler = async ({
  node,
  nodes,
  context,
  nextCondition,
  steps,
  resolvedMetadata,
}) => {
  try {
    if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
      return;
    }
    if (!context.workflowId) throw new Error("Workflow ID is required to generate daily report");
    if (!context.userId) throw new Error("User ID is required to generate daily report");
    if (!isNotionReportWindowOpen()) return;
    if (await wasNotionReportCreatedToday(context.workflowId, node.nodeId)) return;

    const reportId = await createNotionDailyReport({
      workflowId: context.workflowId,
      userId: context.userId,
      nodes,
      metadata: {
        notionApiKey: (resolvedMetadata as any)?.notionApiKey,
        parentPageId: (resolvedMetadata as any)?.parentPageId,
        aiConsent: (resolvedMetadata as any)?.aiConsent,
      },
    });

    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: "Notion Daily Report",
      status: "Success",
      message: `Notion report created (${reportId})`,
    });
  } catch (error: any) {
    console.error("Notion report execution error:", error);
    if (context.userId) {
      await createUserNotification({
        userId: context.userId,
        workflowId: context.workflowId,
        type: "notion_report_failed",
        severity: "error",
        title: "Notion report creation failed",
        message: error?.message || "The Notion reporting action failed.",
        metadata: { nodeId: node.nodeId },
        dedupeKey: `notion-report-failed:${context.workflowId}:${node.nodeId}`,
        dedupeWindowHours: 6,
      });
    }
    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: "Notion Daily Report",
      status: "Failed",
      message: error?.message || "Failed to create Notion report",
    });
  }
};

export const googleDriveActionHandler: ActionHandler = async ({
  node,
  nodes,
  context,
  nextCondition,
  steps,
  resolvedMetadata,
}) => {
  try {
    if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
      return;
    }
    if (!context.workflowId) throw new Error("Workflow ID is required to export Google Drive CSV");
    if (!context.userId) throw new Error("User ID is required to export Google Drive CSV");
    if (!isNotionReportWindowOpen()) return;
    if (await wasDailyActionCreatedToday(context.workflowId, node.nodeId, "Google Drive Daily CSV")) {
      return;
    }

    const fileId = await createGoogleDriveDailyTradesCsv({
      workflowId: context.workflowId,
      userId: context.userId,
      nodes,
      metadata: {
        googleClientEmail: (resolvedMetadata as any)?.googleClientEmail,
        googlePrivateKey: (resolvedMetadata as any)?.googlePrivateKey,
        googleDriveFolderId: (resolvedMetadata as any)?.googleDriveFolderId,
        filePrefix: (resolvedMetadata as any)?.filePrefix,
        aiConsent: (resolvedMetadata as any)?.aiConsent,
      },
    });

    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: "Google Drive Daily CSV",
      status: "Success",
      message: `Drive CSV uploaded (${fileId})`,
    });
  } catch (error: any) {
    console.error("Google Drive CSV export error:", error);
    if (context.userId) {
      await createUserNotification({
        userId: context.userId,
        workflowId: context.workflowId,
        type: "google_drive_upload_failed",
        severity: "error",
        title: "Google Drive upload failed",
        message: error?.message || "The daily CSV export could not be uploaded to Google Drive.",
        metadata: { nodeId: node.nodeId },
        dedupeKey: `gdrive-upload-failed:${context.workflowId}:${node.nodeId}`,
        dedupeWindowHours: 6,
      });
    }
    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: "Google Drive Daily CSV",
      status: "Failed",
      message: error?.message || "Failed to upload daily CSV to Google Drive",
    });
  }
};

export const googleSheetsActionHandler: ActionHandler = async ({
  node,
  context,
  nextCondition,
  steps,
  resolvedMetadata,
}) => {
  try {
    if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
      return;
    }
    if (!context.workflowId) throw new Error("Workflow ID is required to append Google Sheets report");
    if (!context.userId) throw new Error("User ID is required to append Google Sheets report");

    const updatedRange = await createGoogleSheetsExecutionReport({
      workflowId: context.workflowId,
      userId: context.userId,
      metadata: {
        sheetUrl: (resolvedMetadata as any)?.sheetUrl,
        sheetId: (resolvedMetadata as any)?.sheetId,
        sheetName: (resolvedMetadata as any)?.sheetName,
      },
      context,
    });

    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: "Google Sheets Report",
      status: "Success",
      message: `Google Sheets row appended (${updatedRange})`,
    });
  } catch (error: any) {
    console.error("Google Sheets report append error:", error);
    if (context.userId) {
      await createUserNotification({
        userId: context.userId,
        workflowId: context.workflowId,
        type: "google_sheets_report_failed",
        severity: "error",
        title: "Google Sheets report failed",
        message: error?.message || "Failed to append workflow report row to Google Sheets.",
        metadata: { nodeId: node.nodeId },
        dedupeKey: `google-sheets-report-failed:${context.workflowId}:${node.nodeId}`,
        dedupeWindowHours: 6,
      });
    }
    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: "Google Sheets Report",
      status: "Failed",
      message: error?.message || "Failed to append Google Sheets row",
    });
  }
};
