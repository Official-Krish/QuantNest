import { createUserNotification } from "@quantnest-trading/executor-utils";
import { createGoogleDriveDailyTradesCsv } from "../../executors/googleDrive";
import { createGoogleSheetsExecutionReport } from "../../executors/googleSheets";
import {
  createNotionDailyReport,
  isNotionReportWindowOpen,
  wasNotionReportCreatedToday,
} from "../../executors/notion";
import { wasDailyActionCreatedToday } from "../../executors/reporting/helpers";
import { shouldSkipActionByCondition } from "../execute.context";
import { ActionConfigurationError, executeActionWithRetry } from "./shared";
import type { IActionHandler } from "./base.handler";
import type { ActionHandlerParams } from "./shared";

class NotionHandler implements IActionHandler {
  readonly handlerId = "notion-daily-report" as const;

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, nodes, context, nextCondition, steps, resolvedMetadata } =
      params;

    if (
      shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)
    ) {
      return;
    }

    await executeActionWithRetry({
      node,
      context,
      steps,
      nodeTypeLabel: "Notion Daily Report",
      retryPolicy: (resolvedMetadata as any)?.retryPolicy,
      operation: async () => {
        if (!context.workflowId)
          throw new ActionConfigurationError(
            "Workflow ID is required to generate daily report",
          );
        if (!context.userId)
          throw new ActionConfigurationError(
            "User ID is required to generate daily report",
          );

        if (context.executionMode === "dry-run") {
          return {
            message: "[Dry Run] Would create Notion daily report",
            simulatedPayload: {
              service: "notion-daily-report",
              workflowId: context.workflowId,
              nodeId: node.nodeId,
              metadata: {
                parentPageId: (resolvedMetadata as any)?.parentPageId,
                aiConsent: (resolvedMetadata as any)?.aiConsent,
              },
            },
          };
        }

        if (!isNotionReportWindowOpen())
          throw new ActionConfigurationError("Notion report window is closed.");
        if (await wasNotionReportCreatedToday(context.workflowId, node.nodeId))
          throw new ActionConfigurationError(
            "Notion report already created today.",
          );

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

        return `Notion report created (${reportId})`;
      },
      onFinalFailure: async (error) => {
        console.error("Notion report execution error:", error);
        if (context.userId) {
          await createUserNotification({
            userId: context.userId,
            workflowId: context.workflowId,
            type: "notion_report_failed",
            severity: "error",
            title: "Notion report creation failed",
            message:
              error instanceof Error
                ? error.message
                : "The Notion reporting action failed.",
            metadata: { nodeId: node.nodeId },
            dedupeKey: `notion-report-failed:${context.workflowId}:${node.nodeId}`,
            dedupeWindowHours: 6,
          });
        }
      },
    });
  }
}

class GoogleDriveHandler implements IActionHandler {
  readonly handlerId = "google-drive-daily-csv" as const;

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, nodes, context, nextCondition, steps, resolvedMetadata } =
      params;

    if (
      shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)
    ) {
      return;
    }

    await executeActionWithRetry({
      node,
      context,
      steps,
      nodeTypeLabel: "Google Drive Daily CSV",
      retryPolicy: (resolvedMetadata as any)?.retryPolicy,
      operation: async () => {
        if (!context.workflowId)
          throw new ActionConfigurationError(
            "Workflow ID is required to export Google Drive CSV",
          );
        if (!context.userId)
          throw new ActionConfigurationError(
            "User ID is required to export Google Drive CSV",
          );

        if (context.executionMode === "dry-run") {
          return {
            message: "[Dry Run] Would export daily CSV to Google Drive",
            simulatedPayload: {
              service: "google-drive-daily-csv",
              workflowId: context.workflowId,
              nodeId: node.nodeId,
              metadata: {
                googleDriveFolderId: (resolvedMetadata as any)
                  ?.googleDriveFolderId,
                filePrefix: (resolvedMetadata as any)?.filePrefix,
                aiConsent: (resolvedMetadata as any)?.aiConsent,
              },
            },
          };
        }

        if (!isNotionReportWindowOpen())
          throw new ActionConfigurationError(
            "Google Drive report window is closed.",
          );
        if (
          await wasDailyActionCreatedToday(
            context.workflowId,
            node.nodeId,
            "Google Drive Daily CSV",
          )
        ) {
          throw new ActionConfigurationError(
            "Google Drive CSV report already created today.",
          );
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

        return `Drive CSV uploaded (${fileId})`;
      },
      onFinalFailure: async (error) => {
        console.error("Google Drive CSV export error:", error);
        if (context.userId) {
          await createUserNotification({
            userId: context.userId,
            workflowId: context.workflowId,
            type: "google_drive_upload_failed",
            severity: "error",
            title: "Google Drive upload failed",
            message:
              error instanceof Error
                ? error.message
                : "The daily CSV export could not be uploaded to Google Drive.",
            metadata: { nodeId: node.nodeId },
            dedupeKey: `gdrive-upload-failed:${context.workflowId}:${node.nodeId}`,
            dedupeWindowHours: 6,
          });
        }
      },
    });
  }
}

class GoogleSheetsHandler implements IActionHandler {
  readonly handlerId = "google-sheets-report" as const;

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, context, nextCondition, steps, resolvedMetadata } = params;

    if (
      shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)
    ) {
      return;
    }

    await executeActionWithRetry({
      node,
      context,
      steps,
      nodeTypeLabel: "Google Sheets Report",
      retryPolicy: (resolvedMetadata as any)?.retryPolicy,
      operation: async () => {
        if (!context.workflowId)
          throw new ActionConfigurationError(
            "Workflow ID is required to append Google Sheets report",
          );
        if (!context.userId)
          throw new ActionConfigurationError(
            "User ID is required to append Google Sheets report",
          );

        if (context.executionMode === "dry-run") {
          return {
            message: "[Dry Run] Would append execution row to Google Sheets",
            simulatedPayload: {
              service: "google-sheets-report",
              workflowId: context.workflowId,
              nodeId: node.nodeId,
              metadata: {
                sheetUrl: (resolvedMetadata as any)?.sheetUrl,
                sheetId: (resolvedMetadata as any)?.sheetId,
                sheetName: (resolvedMetadata as any)?.sheetName,
              },
            },
          };
        }

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

        return `Google Sheets row appended (${updatedRange})`;
      },
      onFinalFailure: async (error) => {
        console.error("Google Sheets report append error:", error);
        if (context.userId) {
          await createUserNotification({
            userId: context.userId,
            workflowId: context.workflowId,
            type: "google_sheets_report_failed",
            severity: "error",
            title: "Google Sheets report failed",
            message:
              error instanceof Error
                ? error.message
                : "Failed to append workflow report row to Google Sheets.",
            metadata: { nodeId: node.nodeId },
            dedupeKey: `google-sheets-report-failed:${context.workflowId}:${node.nodeId}`,
            dedupeWindowHours: 6,
          });
        }
      },
    });
  }
}

export const notionHandler: IActionHandler = new NotionHandler();
export const googleDriveHandler: IActionHandler = new GoogleDriveHandler();
export const googleSheetsHandler: IActionHandler = new GoogleSheetsHandler();
