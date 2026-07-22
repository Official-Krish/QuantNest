import { SQL } from "bun";
import { createUserNotification } from "@quantnest-trading/executor-utils";
import { shouldSkipActionByCondition } from "../execute.context";
import { ActionConfigurationError, executeActionWithRetry } from "./shared";
import type { IActionHandler } from "./base.handler";
import type { ActionHandlerParams } from "./shared";

function parseJsonPayload(rawPayload: unknown): Record<string, unknown> {
  const text = String(rawPayload || "").trim();
  if (!text) {
    return {};
  }

  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON payload must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

class PostgresHandler implements IActionHandler {
  readonly handlerId = "postgres" as const;

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
      source: "postgres",
      nodeTypeLabel: "Postgres",
      retryPolicy: (resolvedMetadata as any)?.retryPolicy,
      operation: async () => {
        const connectionString = String(
          (resolvedMetadata as any)?.connectionString || "",
        ).trim();
        const tableName = String(
          (resolvedMetadata as any)?.tableName || "",
        ).trim();
        const payload = parseJsonPayload(
          (resolvedMetadata as any)?.jsonPayload,
        );

        if (context.executionMode === "dry-run") {
          return {
            message: `[Dry Run] Would insert workflow payload into ${tableName || "<table>"}`,
            simulatedPayload: {
              service: "postgres",
              tableName,
              workflowId: context.workflowId || null,
              userId: context.userId || null,
              nodeId: node.nodeId,
              eventType: context.eventType || "workflow_execution",
              details: context.details || null,
              payload,
            },
          };
        }

        if (!connectionString) {
          throw new ActionConfigurationError(
            "Postgres connection string is required.",
          );
        }

        if (!tableName) {
          throw new ActionConfigurationError(
            "Postgres table name is required.",
          );
        }

        const db = new SQL(connectionString);
        try {
          const record = {
            workflowId: context.workflowId || null,
            userId: context.userId || null,
            nodeId: node.nodeId,
            eventType: context.eventType || "workflow_execution",
            executedAt: new Date().toISOString(),
            details: context.details || null,
            ...payload,
          };

          await db`INSERT INTO ${db(tableName)} ${db({ data: record })}`;
        } finally {
          await db.close();
        }

        return `Inserted workflow payload into ${tableName}`;
      },
      onFinalFailure: async (error) => {
        console.error("Postgres action execution error:", error);
        if (context.userId) {
          await createUserNotification({
            userId: context.userId,
            workflowId: context.workflowId,
            type: "postgres_action_failed",
            severity: "error",
            title: "Postgres action failed",
            message:
              error instanceof Error
                ? error.message
                : "Failed to insert workflow payload into Postgres.",
            metadata: { nodeId: node.nodeId },
            dedupeKey: `postgres-action-failed:${context.workflowId}:${node.nodeId}`,
            dedupeWindowHours: 2,
          });
        }
      },
    });
  }
}

export const postgresHandler: IActionHandler = new PostgresHandler();
