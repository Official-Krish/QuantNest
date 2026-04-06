import { SQL } from "bun";
import { createUserNotification } from "@quantnest-trading/executor-utils";
import { shouldSkipActionByCondition } from "../execute.context";
import { pushStep, type ActionHandler } from "./shared";

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

export const postgresActionHandler: ActionHandler = async ({
  node,
  context,
  nextCondition,
  steps,
  resolvedMetadata,
}) => {
  let db: SQL | null = null;

  try {
    if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
      return;
    }

    const connectionString = String((resolvedMetadata as any)?.connectionString || "").trim();
    const tableName = String((resolvedMetadata as any)?.tableName || "").trim();
    const payload = parseJsonPayload((resolvedMetadata as any)?.jsonPayload);

    if (!connectionString) {
      throw new Error("Postgres connection string is required.");
    }

    if (!tableName) {
      throw new Error("Postgres table name is required.");
    }

    db = new SQL(connectionString);

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

    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: "Postgres",
      status: "Success",
      message: `Inserted workflow payload into ${tableName}`,
    });
  } catch (error: any) {
    console.error("Postgres action execution error:", error);
    if (context.userId) {
      await createUserNotification({
        userId: context.userId,
        workflowId: context.workflowId,
        type: "postgres_action_failed",
        severity: "error",
        title: "Postgres action failed",
        message: error?.message || "Failed to insert workflow payload into Postgres.",
        metadata: { nodeId: node.nodeId },
        dedupeKey: `postgres-action-failed:${context.workflowId}:${node.nodeId}`,
        dedupeWindowHours: 2,
      });
    }
    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: "Postgres",
      status: "Failed",
      message: error?.message || "Failed to execute Postgres action",
    });
  } finally {
    await db?.close();
  }
};