import axios from "axios";
import type {
  AiModelDescriptor,
  AiStrategyDraftEditRequest,
  AiStrategyDraftSession,
  AiStrategyDraftSummary,
  AiStrategyDraftVersionPayload,
  AiStrategySetupState,
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
  IdResponse,
  UserProfileNotifications,
  UserProfilePreferences,
  UserProfileResponse,
  ReusableSecretDetail,
  ReusableSecretService,
  ReusableSecretSummary,
  TelegramChatSummary,
  marketStatus,
  MarketAssetOption,
  SigninResponse,
  UsageSnapshot,
  UserNotification,
  Workflow,
  WorkflowLivePreview,
  WorkflowPreviewRequest,
  WorkflowExample,
  ExecutionTraceResponse,
  AiDebugQueryResponse,
} from "./types/api";

const API_BASE = "https://api.quantnest.krishlabs.tech/api/v1";

const SESSION_KEY = "quantnest_session";
export const AUTH_STATE_EVENT = "quantnest-auth-state";
export const MAINTENANCE_EVENT = "quantnest-maintenance";

let _maintenanceMode = false;

export function isMaintenanceMode() {
  return _maintenanceMode;
}

export function enableMaintenanceMode() {
  if (_maintenanceMode) return;
  _maintenanceMode = true;
  window.dispatchEvent(new CustomEvent(MAINTENANCE_EVENT, { detail: true }));
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  request: any;
}> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      enableMaintenanceMode();
    }

    const originalRequest = error.config;
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/user/signin") &&
      !originalRequest.url?.includes("/user/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, request: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      let refreshSucceeded = false;
      try {
        await api.post("/user/refresh");
        refreshSucceeded = true;
        const retry = await api(originalRequest);
        return retry;
      } catch (refreshError) {
        clearAuthSession();
        if (window.location.pathname.startsWith("/signin")) {
          return Promise.reject(error);
        }
        const returnUrl = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.href = `/signin?redirect=${returnUrl}`;
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
        if (refreshSucceeded) {
          refreshQueue.forEach(({ resolve, reject, request }) => {
            api(request).then(resolve).catch(reject);
          });
        } else {
          refreshQueue.forEach(({ reject }) => reject(error));
        }
        refreshQueue = [];
      }
    }
    return Promise.reject(error);
  },
);

function normalizeWorkflowPayload(body: any) {
  return {
    ...body,
    edges: Array.isArray(body?.edges)
      ? body.edges.map((edge: any) => ({
          ...edge,
          sourceHandle: edge?.sourceHandle ?? undefined,
          targetHandle: edge?.targetHandle ?? undefined,
        }))
      : body?.edges,
  };
}

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

export async function apiSignup(body: {
  username: string;
  password: string;
  email: string;
}): Promise<
  | (IdResponse & { requiresEmailVerification?: boolean; email?: string })
  | { status: number }
> {
  try {
    const res = await api.post<
      IdResponse & { requiresEmailVerification?: boolean; email?: string }
    >("/user/signup", body);
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 409) {
      return { status: 409 };
    }
    throw error;
  }
}

export async function apiSignin(body: {
  username: string;
  password: string;
}): Promise<SigninResponse> {
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

export async function apiGetUsageSnapshot(): Promise<UsageSnapshot> {
  const res = await api.get<{
    message: string;
    plan: UsageSnapshot["plan"];
    limits: UsageSnapshot["limits"];
    usage: UsageSnapshot["usage"];
  }>("/user/usage");

  return {
    plan: res.data.plan,
    limits: res.data.limits,
    usage: res.data.usage,
  };
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

export async function apiUploadAvatar(
  file: File,
): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await api.post<{ message: string; avatarUrl: string }>(
    "/user/avatar/upload",
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

export async function apiGetReusableSecrets(
  service?: ReusableSecretService,
): Promise<ReusableSecretSummary[]> {
  const res = await api.get<{
    message: string;
    secrets: ReusableSecretSummary[];
  }>("/user/secrets", {
    params: service ? { service } : undefined,
  });
  return res.data.secrets;
}

export async function apiGetReusableSecret(
  secretId: string,
): Promise<ReusableSecretDetail> {
  const res = await api.get<{ message: string; secret: ReusableSecretDetail }>(
    `/user/secrets/${secretId}`,
  );
  return res.data.secret;
}

export async function apiCreateReusableSecret(body: {
  name: string;
  service: ReusableSecretService;
  payload: Record<string, string | number | boolean>;
}): Promise<ReusableSecretSummary> {
  const res = await api.post<{
    message: string;
    secret: ReusableSecretSummary;
  }>("/user/secrets", body);
  return res.data.secret;
}

export async function apiUpdateReusableSecret(
  secretId: string,
  body: {
    name?: string;
    payload?: Record<string, string | number | boolean>;
  },
): Promise<ReusableSecretSummary> {
  const res = await api.patch<{
    message: string;
    secret: ReusableSecretSummary;
  }>(`/user/secrets/${secretId}`, body);
  return res.data.secret;
}

export async function apiDeleteReusableSecret(
  secretId: string,
): Promise<{ message: string; pausedWorkflowCount: number }> {
  const res = await api.delete<{
    message: string;
    pausedWorkflowCount: number;
  }>(`/user/secrets/${secretId}`);
  return res.data;
}

export async function apiGetTelegramChats(
  botToken: string,
): Promise<TelegramChatSummary[]> {
  const res = await api.post<{ message: string; chats: TelegramChatSummary[] }>(
    "/user/telegram/chats",
    {
      botToken,
    },
  );
  return res.data.chats;
}

export async function apiVerifyEmailToken(
  token: string,
): Promise<{ message: string }> {
  const res = await api.get<{ message: string }>(
    `/user/verify-email?token=${encodeURIComponent(token)}`,
  );
  return res.data;
}

export async function apiResendVerificationEmail(
  email: string,
): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>("/user/resend-verification", {
    email,
  });
  return res.data;
}

// WORKFLOW

export async function apiCreateWorkflow(body: any): Promise<IdResponse> {
  const res = await api.post<IdResponse>(
    "/workflow",
    normalizeWorkflowPayload(body),
  );
  return res.data;
}

export async function apiUpdateWorkflow(
  workflowId: string,
  body: any,
): Promise<IdResponse> {
  const res = await api.put<IdResponse>(
    `/workflow/${workflowId}`,
    normalizeWorkflowPayload(body),
  );
  return res.data;
}

export async function apiGetWorkflow(workflowId: string): Promise<Workflow> {
  const res = await api.get<{ message: string; workflow: Workflow }>(
    `/workflow/${workflowId}`,
  );
  return res.data.workflow;
}

export async function apiPreviewWorkflowMetrics(
  body: WorkflowPreviewRequest,
): Promise<WorkflowLivePreview> {
  const res = await api.post<{ message: string; preview: WorkflowLivePreview }>(
    "/workflow/preview-metrics",
    body,
  );
  return res.data.preview;
}

export async function apiGetAllWorkflows(): Promise<{ workflows: Workflow[] }> {
  const res = await api.get<{ message: string; workflows: Workflow[] }>(
    "/workflow/getAll",
  );
  return res.data;
}

export async function apiGetExecution(workflowId: string) {
  const res = await api.get(`/workflow/executions/${workflowId}`);
  return res.data;
}

export async function apiGetExecutionTrace(
  executionId: string,
): Promise<ExecutionTraceResponse> {
  const res = await api.get(`/workflow/executions/${executionId}/trace`);
  return res.data;
}

export async function apiExplainExecution(
  executionId: string,
  question: string,
  workflowName?: string,
): Promise<{ success: boolean; data: AiDebugQueryResponse }> {
  const res = await api.post("/ai/debug/explain", {
    executionId,
    question,
    workflowName,
  });
  return res.data;
}

export async function apiDeleteWorkflow(
  workflowId: string,
): Promise<{ message: string }> {
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

export async function apiUpdateWorkflowExecutionMode(
  workflowId: string,
  executionMode: "live" | "dry-run",
): Promise<{ message: string; workflow: Workflow }> {
  const res = await api.patch<{ message: string; workflow: Workflow }>(
    `/workflow/${workflowId}/execution-mode`,
    { executionMode },
  );
  return res.data;
}

export async function apiCreateZerodhaToken(body: {
  workflowId: string;
  accessToken: string;
}): Promise<{ success: boolean; message: string; tokenStatus: any }> {
  const res = await api.post<{
    success: boolean;
    message: string;
    tokenStatus: any;
  }>("/zerodha-token/create", body);
  return res.data;
}

export async function apiGetZerodhaTokenStatus(
  workflowId: string,
): Promise<{ success: boolean; tokenStatus: any }> {
  const res = await api.get<{ success: boolean; tokenStatus: any }>(
    `/zerodha-token/status/${workflowId}`,
  );
  return res.data;
}

export async function apiDeleteZerodhaToken(
  workflowId: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/zerodha-token/${workflowId}`,
  );
  return res.data;
}

export async function apiUpdateZerodhaToken(body: {
  workflowId: string;
  accessToken: string;
}): Promise<{ success: boolean; message: string; tokenStatus: any }> {
  const res = await api.put<{
    success: boolean;
    message: string;
    tokenStatus: any;
  }>("/zerodha-token/update", body);
  return res.data;
}

export async function apiGetMarketStatus(): Promise<{
  success: boolean;
  marketStatus: marketStatus;
}> {
  const res = await api.get<{ success: boolean; marketStatus: marketStatus }>(
    "/market-status",
  );
  return res.data;
}

export async function apiGetMarketAssets(
  market?: "Indian" | "Crypto",
  options?: { forceRefresh?: boolean },
): Promise<{ Indian: MarketAssetOption[]; Crypto: MarketAssetOption[] }> {
  const res = await api.get<
    | {
        success: boolean;
        market: "Indian" | "Crypto";
        assets: MarketAssetOption[];
      }
    | {
        success: boolean;
        assets: {
          Indian: MarketAssetOption[];
          Crypto: MarketAssetOption[];
        };
      }
  >("/market/assets", {
    params: {
      ...(market ? { market } : {}),
      ...(options?.forceRefresh ? { forceRefresh: true } : {}),
    },
  });

  if ("market" in res.data) {
    return res.data.market === "Indian"
      ? { Indian: res.data.assets || [], Crypto: [] }
      : { Indian: [], Crypto: res.data.assets || [] };
  }

  return {
    Indian: res.data.assets?.Indian || [],
    Crypto: res.data.assets?.Crypto || [],
  };
}

export type VerifyBrokerCredentialsBody = {
  brokerType: "zerodha" | "groww" | "lighter";
  apiKey?: string;
  accessToken?: string;
  accountIndex?: number;
  apiKeyIndex?: number;
  secretId?: string;
};

export type VerifyGoogleSheetsBody = {
  sheetUrl: string;
};

export async function apiVerifyBrokerCredentials(
  body: VerifyBrokerCredentialsBody,
): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(
    "/workflow/verify-broker-credentials",
    body,
  );
  return res.data;
}

export async function apiVerifyGoogleSheets(
  body: VerifyGoogleSheetsBody,
): Promise<{
  success: boolean;
  message: string;
  sheet: {
    sheetId: string;
    sheetName: string;
    spreadsheetTitle: string;
    serviceAccountEmail: string;
  };
}> {
  const res = await api.post<{
    success: boolean;
    message: string;
    sheet: {
      sheetId: string;
      sheetName: string;
      spreadsheetTitle: string;
      serviceAccountEmail: string;
    };
  }>("/workflow/verify-google-sheets", body);
  return res.data;
}

export async function apiGetGoogleSheetsServiceAccount(): Promise<{
  serviceAccountEmail: string;
}> {
  const res = await api.get<{
    success: boolean;
    serviceAccountEmail: string;
  }>("/workflow/google-sheets/service-account");
  return { serviceAccountEmail: res.data.serviceAccountEmail };
}

export async function apiGetNotifications(): Promise<{
  notifications: UserNotification[];
}> {
  const res = await api.get<{
    message: string;
    notifications: UserNotification[];
  }>("/notification");
  return { notifications: res.data.notifications };
}

export async function apiMarkNotificationRead(
  notificationId: string,
): Promise<{ message: string }> {
  const res = await api.patch<{ message: string }>(
    `/notification/${notificationId}/read`,
  );
  return res.data;
}

export async function apiMarkAllNotificationsRead(): Promise<{
  message: string;
}> {
  const res = await api.patch<{ message: string }>("/notification/read-all");
  return res.data;
}

export async function apiGetExamples(): Promise<{
  examples: WorkflowExample[];
}> {
  const res = await api.get<{ message: string; examples: WorkflowExample[] }>(
    "/examples",
  );
  return { examples: res.data.examples };
}

export async function apiGetPracticalAlgos(): Promise<{
  examples: WorkflowExample[];
}> {
  const res = await api.get<{ message: string; examples: WorkflowExample[] }>(
    "/examples/practical-algos",
  );
  return { examples: res.data.examples };
}

export async function apiCreateWorkflowFromExample(
  slug: string,
  workflowName: string,
  executionMode: "live" | "dry-run",
  metadataOverrides: Record<string, Record<string, unknown>>,
): Promise<IdResponse> {
  const res = await api.post<IdResponse>(`/examples/${slug}/create`, {
    workflowName,
    executionMode,
    metadataOverrides,
  });
  return res.data;
}

export async function apiGetAiModels(): Promise<{
  models: AiModelDescriptor[];
}> {
  const res = await api.get<{ success: boolean; models: AiModelDescriptor[] }>(
    "/ai/models",
  );
  return { models: res.data.models };
}

export async function apiGenerateAiStrategyPlan(
  body: AiStrategyBuilderRequest,
): Promise<AiStrategyBuilderResponse> {
  const res = await api.post<{
    success: boolean;
    data: AiStrategyBuilderResponse;
  }>("/ai/strategy/plan", body);
  return res.data.data;
}

export async function apiCreateAiStrategyDraft(
  body: AiStrategyBuilderRequest,
): Promise<AiStrategyDraftSession> {
  const res = await api.post<{
    success: boolean;
    data: { draft: AiStrategyDraftSession };
  }>("/ai/strategy/drafts", body);
  return res.data.data.draft;
}

export async function apiListAiStrategyDrafts(): Promise<
  AiStrategyDraftSummary[]
> {
  const res = await api.get<{
    success: boolean;
    data: { drafts: AiStrategyDraftSummary[] };
  }>("/ai/strategy/drafts");
  return res.data.data.drafts;
}

export async function apiGetAiStrategyDraft(
  draftId: string,
): Promise<AiStrategyDraftSession> {
  const res = await api.get<{
    success: boolean;
    data: { draft: AiStrategyDraftSession };
  }>(`/ai/strategy/drafts/${draftId}`);
  return res.data.data.draft;
}

export async function apiEditAiStrategyDraft(
  draftId: string,
  body: AiStrategyDraftEditRequest,
): Promise<AiStrategyDraftSession> {
  const res = await api.post<{
    success: boolean;
    data: { draft: AiStrategyDraftSession };
  }>(`/ai/strategy/drafts/${draftId}/edit`, body);
  return res.data.data.draft;
}

export async function apiGetAiStrategyDraftVersion(
  draftId: string,
  versionId: string,
): Promise<AiStrategyDraftVersionPayload> {
  const res = await api.get<{
    success: boolean;
    data: AiStrategyDraftVersionPayload;
  }>(`/ai/strategy/drafts/${draftId}/versions/${versionId}`);
  return res.data.data;
}

export async function apiSaveAiStrategyDraftSetup(
  draftId: string,
  body: AiStrategySetupState,
  versionId?: string,
): Promise<AiStrategyDraftSession> {
  const res = await api.put<{
    success: boolean;
    data: { draft: AiStrategyDraftSession };
  }>(`/ai/strategy/drafts/${draftId}/setup`, body, {
    params: versionId ? { versionId } : undefined,
  });
  return res.data.data.draft;
}

export async function apiDeleteAiStrategyDraft(
  draftId: string,
): Promise<{ draftId: string }> {
  const res = await api.delete<{ success: boolean; data: { draftId: string } }>(
    `/ai/strategy/drafts/${draftId}`,
  );
  return res.data.data;
}

export async function apiRenameAiStrategyDraft(
  draftId: string,
  title: string,
): Promise<AiStrategyDraftSession> {
  const res = await api.patch<{
    success: boolean;
    data: { draft: AiStrategyDraftSession };
  }>(`/ai/strategy/drafts/${draftId}/title`, { title });
  return res.data.data.draft;
}
