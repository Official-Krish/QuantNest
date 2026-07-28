import { AiMemoryModel } from "@quantnest-trading/db/client";

export interface StoredMemory {
  key: string;
  value: Record<string, unknown>;
  updatedAt: Date;
}

export async function readMemory(
  userId: string,
  workflowId: string,
  nodeId: string,
  key = "default",
): Promise<StoredMemory | null> {
  try {
    const doc = await AiMemoryModel.findOne({
      userId,
      workflowId,
      nodeId,
      key,
    }).lean();
    if (!doc) return null;

    if (doc.ttl && new Date() > new Date(doc.ttl)) {
      await AiMemoryModel.deleteOne({ _id: doc._id });
      return null;
    }

    return {
      key: doc.key,
      value: (doc.value ?? {}) as Record<string, unknown>,
      updatedAt: doc.updatedAt ?? doc.createdAt,
    };
  } catch (error) {
    console.error("Error reading AI memory:", error);
    return null;
  }
}

export async function writeMemory(
  userId: string,
  workflowId: string,
  nodeId: string,
  value: Record<string, unknown>,
  ttlHours = 24,
  key = "default",
): Promise<void> {
  try {
    const ttl =
      ttlHours > 0 ? new Date(Date.now() + ttlHours * 3600 * 1000) : undefined;
    await AiMemoryModel.findOneAndUpdate(
      { userId, workflowId, nodeId, key },
      {
        $set: {
          userId,
          workflowId,
          nodeId,
          key,
          value,
          ttl,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error("Error writing AI memory:", error);
  }
}

export async function clearMemory(
  userId: string,
  workflowId: string,
  nodeId: string,
  key?: string,
): Promise<void> {
  try {
    const filter: Record<string, unknown> = { userId, workflowId, nodeId };
    if (key) filter.key = key;
    await AiMemoryModel.deleteMany(filter);
  } catch (error) {
    console.error("Error clearing AI memory:", error);
  }
}

export async function collectMemoryContext(
  userId: string,
  workflowId: string,
  nodeId: string,
  metadata: { memoryEnabled?: boolean; memoryTtl?: number },
): Promise<string> {
  if (!metadata.memoryEnabled) return "";

  const stored = await readMemory(userId, workflowId, nodeId);
  if (!stored) return "";

  const ageHours = Math.round(
    (Date.now() - new Date(stored.updatedAt).getTime()) / 3600000,
  );

  return `[Previous Execution Context]:
This is what the AI decided in its last run (${ageHours}h ago):
${JSON.stringify(stored.value, null, 2)}`;
}
