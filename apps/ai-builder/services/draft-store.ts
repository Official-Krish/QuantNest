import type {
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
  AiStrategyDraftSession,
} from "@quantnest-trading/types/ai";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { AiBuilderError } from "../errors";

const STORE_PATH = resolve(process.cwd(), "apps/ai-builder/.data/strategy-drafts.json");

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function deriveStatus(response: AiStrategyBuilderResponse): AiStrategyDraftSession["status"] {
  if (!response.validation.canOpenInBuilder) {
    return "draft";
  }

  if (response.validation.missingInputsCount > 0) {
    return "needs-inputs";
  }

  return "ready";
}

class AiDraftStore {
  private readonly drafts = new Map<string, AiStrategyDraftSession>(this.loadDrafts());

  private loadDrafts() {
    try {
      if (!existsSync(STORE_PATH)) {
        return [];
      }

      const raw = readFileSync(STORE_PATH, "utf8").trim();
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as AiStrategyDraftSession[];
      return parsed.map((draft) => [draft.draftId, draft] as const);
    } catch {
      return [];
    }
  }

  private persist() {
    mkdirSync(dirname(STORE_PATH), { recursive: true });
    writeFileSync(
      STORE_PATH,
      JSON.stringify([...this.drafts.values()], null, 2),
      "utf8",
    );
  }

  create(request: AiStrategyBuilderRequest, response: AiStrategyBuilderResponse): AiStrategyDraftSession {
    const now = new Date().toISOString();
    const draft: AiStrategyDraftSession = {
      draftId: createId("draft"),
      status: deriveStatus(response),
      createdAt: now,
      updatedAt: now,
      request,
      response,
      edits: [],
    };

    this.drafts.set(draft.draftId, draft);
    this.persist();
    return draft;
  }

  get(draftId: string): AiStrategyDraftSession {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      throw new AiBuilderError("DRAFT_NOT_FOUND", "AI draft session was not found.", 404);
    }
    return draft;
  }

  update(
    draftId: string,
    request: AiStrategyBuilderRequest,
    response: AiStrategyBuilderResponse,
    instruction?: string,
  ): AiStrategyDraftSession {
    const existing = this.get(draftId);
    const updatedAt = new Date().toISOString();
    const edits = instruction
      ? [
          ...existing.edits,
          {
            id: createId("edit"),
            instruction,
            createdAt: updatedAt,
          },
        ]
      : existing.edits;

    const next: AiStrategyDraftSession = {
      ...existing,
      request,
      response,
      status: deriveStatus(response),
      updatedAt,
      edits,
    };

    this.drafts.set(draftId, next);
    this.persist();
    return next;
  }
}

export const aiDraftStore = new AiDraftStore();
