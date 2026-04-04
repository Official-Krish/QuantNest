import { AiStrategySessionModel } from "@quantnest-trading/db/client";
import {
  aiStrategyDraftSessionSchema,
  aiStrategyDraftSummarySchema,
} from "@quantnest-trading/types/ai";

function formatDraftParseIssues(error: any) {
  return error.issues.map((issue: any) => ({
    path: issue.path.join("."),
    code: issue.code,
    message: issue.message,
    expected: "expected" in issue ? issue.expected : undefined,
    received: "received" in issue ? issue.received : undefined,
  }));
}

export async function listUserAiDraftSummaries(userId: string) {
  const docs = await AiStrategySessionModel.find({ userId }).sort({ updatedAt: -1 }).limit(50).lean();

  const drafts = docs.flatMap((doc) => {
    const parsedDraft = aiStrategyDraftSessionSchema.safeParse(doc.sessionData);
    if (!parsedDraft.success) {
      const issueDetails = formatDraftParseIssues(parsedDraft.error);
      console.error("Failed to parse draft session data for summary", {
        userId,
        draftId: doc._id,
        issues: issueDetails,
        issuesJson: JSON.stringify(issueDetails),
      });
      return [];
    }

    const draft = parsedDraft.data;
    const lastMessage = [...draft.messages].reverse().find((message) => message.role === "user")?.content;
    return [
      aiStrategyDraftSummarySchema.parse({
        draftId: draft.draftId,
        title: draft.title,
        status: draft.status,
        updatedAt: draft.updatedAt,
        createdAt: draft.createdAt,
        workflowId: draft.workflowId,
        lastMessage,
      }),
    ];
  });

  return drafts;
}

export async function getUserAiDraft(userId: string, draftId: string) {
  const doc = await AiStrategySessionModel.findOne({
    _id: draftId,
    userId,
  }).lean();

  if (!doc) {
    return { status: "not_found" as const };
  }

  const parsedDraft = aiStrategyDraftSessionSchema.safeParse(doc.sessionData);
  if (!parsedDraft.success) {
    const issueDetails = formatDraftParseIssues(parsedDraft.error);
    console.error("Failed to parse draft session data", {
      userId,
      draftId,
      issues: issueDetails,
      issuesJson: JSON.stringify(issueDetails),
    });

    return {
      status: "invalid" as const,
      issues: issueDetails,
    };
  }

  return {
    status: "ok" as const,
    draft: parsedDraft.data,
  };
}