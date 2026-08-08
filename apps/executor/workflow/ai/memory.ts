import {
  AiMemoryModel,
  MemoryDocumentModel,
} from "@quantnest-trading/db/client";
import {
  cosineSimilarity,
  embedText,
  embedTexts,
} from "@quantnest-trading/embeddings";

export type MemorySource = "node" | "trade" | "note";

export interface StoreMemoryDocumentsInput {
  userId: string;
  workflowId?: string;
  nodeId?: string;
  source: MemorySource;
  content: string;
  metadata?: Record<string, unknown>;
  ttlHours?: number;
}

export interface RetrieveMemoryContextInput {
  userId: string;
  workflowId?: string;
  query: string;
  k?: number;
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

function chunkText(text: string, size = 500, overlap = 50): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  const chunks: string[] = [];
  const step = Math.max(size - overlap, 1);
  for (let i = 0; i < clean.length; i += step) {
    chunks.push(clean.slice(i, i + size));
  }
  return chunks;
}

export async function storeMemoryDocuments(
  input: StoreMemoryDocumentsInput,
): Promise<void> {
  const { userId, workflowId, nodeId, source, content, metadata, ttlHours } =
    input;
  if (!userId || !content?.trim()) return;

  try {
    const chunks = chunkText(content);
    if (chunks.length === 0) return;

    const embeddings = await embedTexts(chunks);
    const ttl =
      ttlHours && ttlHours > 0
        ? new Date(Date.now() + ttlHours * 3600 * 1000)
        : undefined;

    const docs = chunks.map((chunk, index) => ({
      userId,
      workflowId,
      nodeId,
      source,
      content: chunk,
      embedding: embeddings[index] ?? undefined,
      metadata: metadata ?? {},
      ttl,
    }));

    await MemoryDocumentModel.insertMany(docs);
  } catch (error) {
    console.error("Error storing memory documents:", error);
  }
}

export async function retrieveMemoryContext(
  input: RetrieveMemoryContextInput,
): Promise<string> {
  const { userId, workflowId, query, k = 3 } = input;
  if (!userId || !query?.trim()) return "";

  try {
    const queryEmbedding = await embedText(query);
    if (!queryEmbedding) return "";

    const filter: Record<string, unknown> = { userId };
    if (workflowId) filter.workflowId = workflowId;

    const docs = await MemoryDocumentModel.find(filter)
      .select({
        content: 1,
        source: 1,
        workflowId: 1,
        nodeId: 1,
        embedding: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const scored: Array<{
      content: string;
      source: MemorySource;
      score: number;
      createdAt?: Date;
    }> = [];

    for (const doc of docs) {
      if (!doc.embedding || doc.embedding.length === 0) continue;
      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      if (score <= 0) continue;
      scored.push({
        content: doc.content,
        source: doc.source as MemorySource,
        score,
        createdAt: doc.createdAt,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.max(1, Math.min(10, k)));

    if (top.length === 0) return "";

    const lines = top.map(
      (entry, i) =>
        `[${i + 1}] (${entry.source}, score ${entry.score.toFixed(3)}) ${
          entry.content
        }`,
    );

    return `[Relevant Memory]:
Top relevant prior records retrieved from your knowledge base:
${lines.join("\n\n")}`;
  } catch (error) {
    console.error("Error retrieving memory context:", error);
    return "";
  }
}
