import { AiStrategySessionModel } from "@quantnest-trading/db/client";
import {
  aiStrategyDraftSessionSchema,
  aiStrategyDraftSummarySchema,
  aiStrategySetupStateSchema,
} from "@quantnest-trading/types/ai";
import type {
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
  AiStrategyConversationMessage,
  AiStrategyDraftSession,
  AiStrategyDraftSummary,
  AiStrategySetupState,
} from "@quantnest-trading/types/ai";
import { AiBuilderError } from "../errors";

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

function deriveTitle(request: AiStrategyBuilderRequest, response: AiStrategyBuilderResponse) {
  return (
    response.plan.workflowName?.trim() ||
    request.prompt.trim().slice(0, 80) ||
    "Untitled AI draft"
  );
}

function buildAssistantMessages(response: AiStrategyBuilderResponse, now: string): AiStrategyConversationMessage[] {
  const messages: AiStrategyConversationMessage[] = [
    {
      id: createId("msg"),
      role: "assistant",
      kind: "result",
      content: response.plan.summary,
      createdAt: now,
      metadata: {
        workflowName: response.plan.workflowName,
        provider: response.provider,
        model: response.model,
      },
    },
  ];

  if (response.validation.issues.length > 0) {
    messages.push({
      id: createId("msg"),
      role: "assistant",
      kind: "validation",
      content: response.validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("\n"),
      createdAt: now,
      metadata: {
        issueCount: response.validation.issues.length,
      },
    });
  }

  return messages;
}

function buildDraftSession(
  draftId: string,
  request: AiStrategyBuilderRequest,
  response: AiStrategyBuilderResponse,
  input: {
    createdAt?: string;
    updatedAt?: string;
    edits?: AiStrategyDraftSession["edits"];
    messages?: AiStrategyConversationMessage[];
    setupState?: AiStrategySetupState;
    workflowId?: string;
  } = {},
): AiStrategyDraftSession {
  const createdAt = input.createdAt || new Date().toISOString();
  const updatedAt = input.updatedAt || createdAt;

  return aiStrategyDraftSessionSchema.parse({
    draftId,
    title: deriveTitle(request, response),
    status: deriveStatus(response),
    createdAt,
    updatedAt,
    request,
    response,
    edits: input.edits || [],
    messages:
      input.messages || [
        {
          id: createId("msg"),
          role: "user",
          kind: "prompt",
          content: request.prompt,
          createdAt,
          metadata: {
            market: request.market,
            goal: request.goal,
          },
        },
        ...buildAssistantMessages(response, createdAt),
      ],
    setupState: input.setupState,
    workflowId: input.workflowId,
  });
}

class AiDraftStore {
  async create(
    userId: string,
    request: AiStrategyBuilderRequest,
    response: AiStrategyBuilderResponse,
  ): Promise<AiStrategyDraftSession> {
    const doc = new AiStrategySessionModel({
      userId,
      title: deriveTitle(request, response),
      status: deriveStatus(response),
      sessionData: {},
    });

    const draft = buildDraftSession(String(doc._id), request, response);
    doc.title = draft.title;
    doc.status = draft.status;
    doc.sessionData = draft;
    await doc.save();
    return draft;
  }

  async get(userId: string, draftId: string): Promise<AiStrategyDraftSession> {
    const doc = await AiStrategySessionModel.findOne({ _id: draftId, userId }).lean();
    if (!doc) {
      throw new AiBuilderError("DRAFT_NOT_FOUND", "AI draft session was not found.", 404);
    }

    const parsed = aiStrategyDraftSessionSchema.safeParse(doc.sessionData);
    if (!parsed.success) {
      const issueDetails = parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
        expected: "expected" in issue ? issue.expected : undefined,
        received: "received" in issue ? issue.received : undefined,
      }));

      console.error("Failed to parse draft session data", {
        draftId,
        userId,
        issues: issueDetails,
        issuesJson: JSON.stringify(issueDetails),
      });
      throw new AiBuilderError("INVALID_DRAFT_DATA", "Stored draft session data is invalid.", 500, {
        issues: issueDetails,
      });
    }
    return parsed.data;
  }

  async update(
    userId: string,
    draftId: string,
    request: AiStrategyBuilderRequest,
    response: AiStrategyBuilderResponse,
    instruction?: string,
  ): Promise<AiStrategyDraftSession> {
    const existing = await this.get(userId, draftId);
    const updatedAt = new Date().toISOString();
    const nextMessages = [...existing.messages];
    const nextEdits = [...existing.edits];

    if (instruction) {
      nextEdits.push({
        id: createId("edit"),
        instruction,
        createdAt: updatedAt,
      });

      nextMessages.push({
        id: createId("msg"),
        role: "user",
        kind: "edit",
        content: instruction,
        createdAt: updatedAt,
      });
    }

    nextMessages.push(...buildAssistantMessages(response, updatedAt));

    const next = buildDraftSession(draftId, request, response, {
      createdAt: existing.createdAt,
      updatedAt,
      edits: nextEdits,
      messages: nextMessages,
      setupState: existing.setupState,
      workflowId: existing.workflowId,
    });

    await AiStrategySessionModel.updateOne(
      { _id: draftId, userId },
      {
        $set: {
          title: next.title,
          status: next.status,
          sessionData: next,
        },
      },
    );

    return next;
  }

  async updateSetupState(
    userId: string,
    draftId: string,
    setupState: AiStrategySetupState,
  ): Promise<AiStrategyDraftSession> {
    const existing = await this.get(userId, draftId);
    const next = aiStrategyDraftSessionSchema.parse({
      ...existing,
      updatedAt: new Date().toISOString(),
      setupState: aiStrategySetupStateSchema.parse({
        ...(existing.setupState || {}),
        ...setupState,
      }),
    });

    await AiStrategySessionModel.updateOne(
      { _id: draftId, userId },
      {
        $set: {
          title: next.title,
          status: next.status,
          sessionData: next,
        },
      },
    );

    return next;
  }
}

export const aiDraftStore = new AiDraftStore();
