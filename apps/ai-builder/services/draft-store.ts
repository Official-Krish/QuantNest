import { AiStrategyDraftVersionModel, AiStrategySessionModel } from "@quantnest-trading/db/client";
import {
  AI_ALLOWED_NODE_TYPE_VALUES,
  AI_PREFERRED_ACTION_VALUES,
  aiStrategyDraftSessionSchema,
  aiStrategySetupStateSchema,
  aiStrategyWorkflowVersionSchema,
} from "@quantnest-trading/types/ai";
import type {
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
  AiStrategyConversationMessage,
  AiStrategyDraftSession,
  AiStrategySetupState,
  AiStrategyDraftVersionPayload,
  AiStrategyWorkflowVersion,
} from "@quantnest-trading/types/ai";
import { AiBuilderError } from "../errors";

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeDraftRequest(request: AiStrategyBuilderRequest): AiStrategyBuilderRequest {
  const allowedNodeTypes = Array.from(
    new Set([
      ...(request.allowedNodeTypes || []),
      ...AI_ALLOWED_NODE_TYPE_VALUES,
    ]),
  ) as AiStrategyBuilderRequest["allowedNodeTypes"];

  const preferredActions = request.preferredActions?.length
    ? Array.from(
        new Set([
          ...request.preferredActions,
          ...AI_PREFERRED_ACTION_VALUES,
        ]),
      ) as AiStrategyBuilderRequest["preferredActions"]
    : request.preferredActions;

  return {
    ...request,
    allowedNodeTypes,
    preferredActions,
  };
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

function buildWorkflowVersion(
  response: AiStrategyBuilderResponse,
  request: AiStrategyBuilderRequest,
  createdAt: string,
  instruction?: string,
  index = 0,
): AiStrategyWorkflowVersion {
  return {
    id: createId("version"),
    label: instruction ? `Edit ${index}` : "Initial draft",
    createdAt,
    prompt: request.prompt,
    instruction,
    response,
  };
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
    workflowVersions?: AiStrategyWorkflowVersion[];
    setupState?: AiStrategySetupState;
    setupStateByVersionId?: Record<string, AiStrategySetupState>;
    workflowId?: string;
  } = {},
): AiStrategyDraftSession {
  const createdAt = input.createdAt || new Date().toISOString();
  const updatedAt = input.updatedAt || createdAt;
  const normalizedRequest = normalizeDraftRequest(request);

  return aiStrategyDraftSessionSchema.parse({
    draftId,
    title: deriveTitle(request, response),
    status: deriveStatus(response),
    createdAt,
    updatedAt,
    request: normalizedRequest,
    response,
    edits: input.edits || [],
    messages:
      input.messages || [
        {
          id: createId("msg"),
          role: "user",
          kind: "prompt",
          content: normalizedRequest.prompt,
          createdAt,
          metadata: {
            market: normalizedRequest.market,
            goal: normalizedRequest.goal,
          },
        },
        ...buildAssistantMessages(response, createdAt),
      ],
    workflowVersions:
      input.workflowVersions || [buildWorkflowVersion(response, normalizedRequest, createdAt)],
    setupState: input.setupState,
    setupStateByVersionId: input.setupStateByVersionId,
    workflowId: input.workflowId,
  });
}

function getLatestVersionId(draft: AiStrategyDraftSession): string | undefined {
  return draft.workflowVersions[draft.workflowVersions.length - 1]?.id;
}

function getSetupStateForVersion(
  draft: AiStrategyDraftSession,
  versionId: string,
): AiStrategySetupState | undefined {
  const fromMap = draft.setupStateByVersionId?.[versionId];
  if (fromMap) {
    return fromMap;
  }

  const latestVersionId = getLatestVersionId(draft);
  if (latestVersionId && latestVersionId === versionId) {
    return draft.setupState;
  }

  return undefined;
}

function ensureSetupMap(draft: AiStrategyDraftSession): Record<string, AiStrategySetupState> {
  const nextMap: Record<string, AiStrategySetupState> = {
    ...(draft.setupStateByVersionId || {}),
  };

  const latestVersionId = getLatestVersionId(draft);
  if (latestVersionId && draft.setupState && !nextMap[latestVersionId]) {
    nextMap[latestVersionId] = draft.setupState;
  }

  return nextMap;
}

async function upsertVersionSnapshots(
  userId: string,
  draftId: string,
  versions: AiStrategyWorkflowVersion[],
  setupStateByVersionId: Record<string, AiStrategySetupState>,
) {
  if (!versions.length) {
    return;
  }

  await Promise.all(
    versions.map((version) =>
      AiStrategyDraftVersionModel.updateOne(
        {
          userId,
          draftId,
          versionId: version.id,
        },
        {
          $set: {
            version,
            setupState: setupStateByVersionId[version.id],
          },
        },
        { upsert: true },
      ),
    ),
  );
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
    await upsertVersionSnapshots(userId, draft.draftId, draft.workflowVersions, ensureSetupMap(draft));
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
    const normalized = buildDraftSession(parsed.data.draftId, parsed.data.request, parsed.data.response, {
      createdAt: parsed.data.createdAt,
      updatedAt: parsed.data.updatedAt,
      edits: parsed.data.edits,
      messages: parsed.data.messages,
      workflowVersions: parsed.data.workflowVersions,
      setupState: parsed.data.setupState,
      setupStateByVersionId: ensureSetupMap(parsed.data),
      workflowId: parsed.data.workflowId,
    });

    const shouldPersistNormalizedRequest =
      JSON.stringify(normalized.request) !== JSON.stringify(parsed.data.request);
    const shouldPersistSetupMigration =
      JSON.stringify(normalized.setupStateByVersionId || {}) !==
      JSON.stringify(parsed.data.setupStateByVersionId || {});

    if (shouldPersistNormalizedRequest || shouldPersistSetupMigration) {
      await AiStrategySessionModel.updateOne(
        { _id: draftId, userId },
        {
          $set: {
            title: normalized.title,
            status: normalized.status,
            sessionData: normalized,
          },
        },
      );
    }

    await upsertVersionSnapshots(userId, normalized.draftId, normalized.workflowVersions, ensureSetupMap(normalized));

    return normalized;
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
    const nextWorkflowVersions = [...existing.workflowVersions];

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
    nextWorkflowVersions.push(
      buildWorkflowVersion(
        response,
        request,
        updatedAt,
        instruction,
        nextWorkflowVersions.length,
      ),
    );

    const next = buildDraftSession(draftId, request, response, {
      createdAt: existing.createdAt,
      updatedAt,
      edits: nextEdits,
      messages: nextMessages,
      workflowVersions: nextWorkflowVersions,
      setupState: existing.setupState,
      setupStateByVersionId: ensureSetupMap(existing),
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

    await upsertVersionSnapshots(userId, next.draftId, next.workflowVersions, ensureSetupMap(next));

    return next;
  }

  async updateSetupState(
    userId: string,
    draftId: string,
    setupState: AiStrategySetupState,
    versionId?: string,
  ): Promise<AiStrategyDraftSession> {
    const existing = await this.get(userId, draftId);
    const targetVersionId = versionId || getLatestVersionId(existing);
    if (!targetVersionId) {
      throw new AiBuilderError("VERSION_NOT_FOUND", "AI draft version was not found.", 404);
    }

    if (!existing.workflowVersions.some((version) => version.id === targetVersionId)) {
      throw new AiBuilderError("VERSION_NOT_FOUND", "AI draft version was not found.", 404);
    }

    const nextSetupState = aiStrategySetupStateSchema.parse({
      ...(getSetupStateForVersion(existing, targetVersionId) || {}),
      ...setupState,
    });

    const nextSetupMap = {
      ...ensureSetupMap(existing),
      [targetVersionId]: nextSetupState,
    };

    const latestVersionId = getLatestVersionId(existing);
    const next = aiStrategyDraftSessionSchema.parse({
      ...existing,
      updatedAt: new Date().toISOString(),
      setupState: latestVersionId ? nextSetupMap[latestVersionId] : undefined,
      setupStateByVersionId: nextSetupMap,
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

    await AiStrategyDraftVersionModel.updateOne(
      {
        userId,
        draftId,
        versionId: targetVersionId,
      },
      {
        $set: {
          setupState: nextSetupState,
        },
      },
      { upsert: true },
    );

    return next;
  }

  async getVersion(
    userId: string,
    draftId: string,
    versionId: string,
  ): Promise<AiStrategyDraftVersionPayload> {
    const snapshot = await AiStrategyDraftVersionModel.findOne({
      userId,
      draftId,
      versionId,
    }).lean();

    if (snapshot?.version) {
      const parsedVersion = aiStrategyWorkflowVersionSchema.safeParse(snapshot.version);
      if (parsedVersion.success) {
        const parsedSetupState = aiStrategySetupStateSchema.safeParse(snapshot.setupState);
        return {
          draftId,
          version: parsedVersion.data,
          setupState: parsedSetupState.success ? parsedSetupState.data : undefined,
        };
      }
    }

    const existing = await this.get(userId, draftId);
    const version = existing.workflowVersions.find((entry) => entry.id === versionId);
    if (!version) {
      throw new AiBuilderError("VERSION_NOT_FOUND", "AI draft version was not found.", 404);
    }

    const setupState = getSetupStateForVersion(existing, versionId);
    await AiStrategyDraftVersionModel.updateOne(
      {
        userId,
        draftId,
        versionId,
      },
      {
        $set: {
          version,
          setupState,
        },
      },
      { upsert: true },
    );

    return {
      draftId: existing.draftId,
      version,
      setupState,
    };
  }
}

export const aiDraftStore = new AiDraftStore();
