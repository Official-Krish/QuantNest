import { GoogleGenAI } from "@google/genai";

export const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSIONS = 768;

const MODEL_TASK_TYPE = "RETRIEVAL_DOCUMENT";
const QUERY_TASK_TYPE = "RETRIEVAL_QUERY";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn("Embeddings disabled: GOOGLE_API_KEY is not configured.");
    return null;
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function toArrayOfNumbers(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is number => typeof item === "number");
}

export async function embedTexts(
  texts: string[],
  taskType: string = MODEL_TASK_TYPE,
): Promise<number[][]> {
  const clean = texts.map((t) => (typeof t === "string" ? t : "").trim());
  if (clean.length === 0) return [];

  const ai = getClient();
  if (!ai) return [];

  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: clean,
      config: {
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    });

    const embeddings = response.embeddings ?? [];
    return embeddings
      .map((e) => toArrayOfNumbers(e.values))
      .filter((e): e is number[] => e !== null && e.length > 0);
  } catch (error) {
    console.error("Embedding failed:", error);
    return [];
  }
}

export async function embedText(
  text: string,
  taskType: string = QUERY_TASK_TYPE,
): Promise<number[] | null> {
  const embeddings = await embedTexts([text], taskType);
  return embeddings[0] ?? null;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
