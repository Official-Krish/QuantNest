import axios from "axios";
import type {
  AiModelDescriptor,
  AiStrategyDraftEditRequest,
  AiStrategyDraftSession,
  AiStrategyDraftSummary,
  AiStrategySetupState,
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
  IdResponse,
  UserProfileNotifications,
  UserProfilePreferences,
  UserProfileResponse,
  marketStatus,
  SigninResponse,
  UserNotification,
  Workflow,
  WorkflowExample,
} from "./types/api";

const API_BASE =
  (import.meta as any).env?.VITE_BACKEND_URL?.toString?.() ??
  "http://localhost:3000/api/v1";

const SESSION_KEY = "quantnest_session";
export const AUTH_STATE_EVENT = "quantnest-auth-state";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

function emitAuthStateChange(isAuthenticated: boolean) {
  window.dispatchEvent(
    new CustomEvent(AUTH_STATE_EVENT, {
      detail: { isAuthenticated },
    }),
  );
}

export function setAuthSession() {
  localStorage.setItem(SESSION_KEY, "1");
  emitAuthStateChange(true);
}

export function clearAuthSession() {
  localStorage.removeItem(SESSION_KEY);
  emitAuthStateChange(false);
}

export function hasAuthSession() {
  return localStorage.getItem(SESSION_KEY) === "1";
}

export function setAvatarUrl(avatarUrl?: string) {
  if (avatarUrl) {
    localStorage.setItem("avatarUrl", avatarUrl);
    return;
  }

  localStorage.removeItem("avatarUrl");
}

// AUTH

export async function apiSignup(body: { username: string; password: string; email: string }): Promise<(IdResponse & { requiresEmailVerification?: boolean; email?: string }) | { status: number }> {
  try {
    const res = await api.post<IdResponse & { requiresEmailVerification?: boolean; email?: string }>("/user/signup", body);
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 409) {
      return { status: 409 };
    }
    throw error;
  }
}

export async function apiSignin(body: { username: string; password: string }): Promise<SigninResponse> {
  const res = await api.post<SigninResponse>("/user/signin", body);
  setAuthSession();
  setAvatarUrl(res.data.avatarUrl);
  return res.data;
}

export async function apiSignout(): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>("/user/signout");
  clearAuthSession();
  return res.data;
}

export async function apiVerifyToken(): Promise<{ message: string }> {
  const res = await api.get<{ message: string }>("/user/verify");
  return res.data;
}

export async function apiGetProfile(): Promise<UserProfileResponse> {
  const res = await api.get<UserProfileResponse>("/user/profile");
  return res.data;
}

export async function apiSaveProfile(body: {
  displayName: string;
  preferences: UserProfilePreferences;
  notifications: UserProfileNotifications;
}): Promise<{
  message: string;
  displayName: string;
  preferences: UserProfilePreferences;
  notifications: UserProfileNotifications;
}> {
  const res = await api.patch<{
    message: string;
    displayName: string;
    preferences: UserProfilePreferences;
    notifications: UserProfileNotifications;
  }>("/user/profile", body);
  return res.data;
}

export async function apiUploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await api.post<{ message: string; avatarUrl: string }>(
    "/user/avatar-upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return {
    avatarUrl: res.data.avatarUrl,
  };
}

export async function apiVerifyEmailToken(token: string): Promise<{ message: string }> {
  const res = await api.get<{ message: string }>(`/user/verify-email?token=${encodeURIComponent(token)}`);
  return res.data;
}

export async function apiResendVerificationEmail(email: string): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>("/user/resend-verification", { email });
  return res.data;
}

// WORKFLOW

export async function apiCreateWorkflow(body: any): Promise<IdResponse> {
  const res = await api.post<IdResponse>("/workflow", body);
  return res.data;
}

export async function apiUpdateWorkflow(workflowId: string, body: any): Promise<IdResponse> {
  const res = await api.put<IdResponse>(`/workflow/${workflowId}`, body);
  return res.data;
}

export async function apiGetWorkflow(workflowId: string): Promise<Workflow> {
  const res = await api.get<{ message: string; workflow: Workflow }>(`/workflow/${workflowId}`);
  return res.data.workflow;
}

export async function apiGetAllWorkflows(): Promise<{ workflows: Workflow[] }> {
  const res = await api.get<{ message: string; workflows: Workflow[] }>("/workflow/getAll");
  return res.data;
}

export async function apiGetExecution(workflowId: string) {
  const res = await api.get(`/workflow/executions/${workflowId}`);
  return res.data;
}

export async function apiDeleteWorkflow(workflowId: string): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/workflow/${workflowId}`);
  return res.data;
}

export async function apiUpdateWorkflowStatus(
  workflowId: string,
  status: "active" | "paused",
): Promise<{ message: string; workflow: Workflow }> {
  const res = await api.patch<{ message: string; workflow: Workflow }>(
    `/workflow/${workflowId}/status`,
    { status },
  );
  return res.data;
}

export async function apiCreateZerodhaToken(body: { workflowId: string; accessToken: string }): Promise<{ success: boolean; message: string; tokenStatus: any }> {
  const res = await api.post<{ success: boolean; message: string; tokenStatus: any }>("/zerodha-token/create", body);
  return res.data;
}

export async function apiGetZerodhaTokenStatus(workflowId: string): Promise<{ success: boolean; tokenStatus: any }> {
  const res = await api.get<{ success: boolean; tokenStatus: any }>(`/zerodha-token/status/${workflowId}`);
  return res.data;
}

export async function apiDeleteZerodhaToken(workflowId: string): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/zerodha-token/${workflowId}`);
  return res.data;
}

export async function apiUpdateZerodhaToken(body: { workflowId: string; accessToken: string }): Promise<{ success: boolean; message: string; tokenStatus: any }> {
  const res = await api.put<{ success: boolean; message: string; tokenStatus: any }>("/zerodha-token/update", body);
  return res.data;
}

export async function apiGetMarketStatus(): Promise<{ success: boolean; marketStatus: marketStatus }> {
  const res = await api.get<{ success: boolean; marketStatus: marketStatus }>("/market-status");
  return res.data;
}

export type VerifyBrokerCredentialsBody = {
  brokerType: "zerodha" | "groww" | "lighter";
  apiKey?: string;
  accessToken?: string;
  accountIndex?: number;
  apiKeyIndex?: number;
};

export async function apiVerifyBrokerCredentials(
  body: VerifyBrokerCredentialsBody
): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(
    "/workflow/verify-broker-credentials",
    body
  );
  return res.data;
}

export async function apiGetNotifications(): Promise<{ notifications: UserNotification[] }> {
  const res = await api.get<{ message: string; notifications: UserNotification[] }>("/notification");
  return { notifications: res.data.notifications };
}

export async function apiMarkNotificationRead(notificationId: string): Promise<{ message: string }> {
  const res = await api.patch<{ message: string }>(`/notification/${notificationId}/read`);
  return res.data;
}

export async function apiMarkAllNotificationsRead(): Promise<{ message: string }> {
  const res = await api.patch<{ message: string }>("/notification/read-all");
  return res.data;
}

export async function apiGetExamples(): Promise<{ examples: WorkflowExample[] }> {
  const res = await api.get<{ message: string; examples: WorkflowExample[] }>("/examples");
  return { examples: res.data.examples };
}

export async function apiCreateWorkflowFromExample(
  slug: string,
  workflowName: string,
  metadataOverrides: Record<string, Record<string, unknown>>,
): Promise<IdResponse> {
  const res = await api.post<IdResponse>(`/examples/${slug}/create`, {
    workflowName,
    metadataOverrides,
  });
  return res.data;
}

export async function apiGetAiModels(): Promise<{ models: AiModelDescriptor[] }> {
  const res = await api.get<{ success: boolean; models: AiModelDescriptor[] }>("/ai/models");
  return { models: res.data.models };
}

export async function apiGenerateAiStrategyPlan(
  body: AiStrategyBuilderRequest,
): Promise<AiStrategyBuilderResponse> {
  const res = await api.post<{ success: boolean; data: AiStrategyBuilderResponse }>(
    "/ai/strategy/plan",
    body,
  );
  return res.data.data;
}

export async function apiCreateAiStrategyDraft(
  body: AiStrategyBuilderRequest,
): Promise<AiStrategyDraftSession> {
  const res = await api.post<{ success: boolean; data: { draft: AiStrategyDraftSession } }>(
    "/ai/strategy/drafts",
    body,
  );
  return res.data.data.draft;
}

export async function apiListAiStrategyDrafts(): Promise<AiStrategyDraftSummary[]> {
  const res = await api.get<{ success: boolean; data: { drafts: AiStrategyDraftSummary[] } }>(
    "/ai/strategy/drafts",
  );
  return res.data.data.drafts;
}

export async function apiGetAiStrategyDraft(
  draftId: string,
): Promise<AiStrategyDraftSession> {
  const res = await api.get<{ success: boolean; data: { draft: AiStrategyDraftSession } }>(
    `/ai/strategy/drafts/${draftId}`,
  );
  return res.data.data.draft;
}

export async function apiEditAiStrategyDraft(
  draftId: string,
  body: AiStrategyDraftEditRequest,
): Promise<AiStrategyDraftSession> {
  const res = await api.post<{ success: boolean; data: { draft: AiStrategyDraftSession } }>(
    `/ai/strategy/drafts/${draftId}/edit`,
    body,
  );
  return res.data.data.draft;
}

export async function apiSaveAiStrategyDraftSetup(
  draftId: string,
  body: AiStrategySetupState,
): Promise<AiStrategyDraftSession> {
  const res = await api.put<{ success: boolean; data: { draft: AiStrategyDraftSession } }>(
    `/ai/strategy/drafts/${draftId}/setup`,
    body,
  );
  return res.data.data.draft;
}
