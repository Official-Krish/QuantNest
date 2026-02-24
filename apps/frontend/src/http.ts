import axios from "axios";
import type { IdResponse, marketStatus, SigninResponse, Workflow } from "./types/api";

const API_BASE =
  (import.meta as any).env?.VITE_BACKEND_URL?.toString?.() ??
  "http://localhost:3000/api/v1";

const SESSION_KEY = "quantnest_session";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export function setAuthSession() {
  localStorage.setItem(SESSION_KEY, "1");
}

export function clearAuthSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function hasAuthSession() {
  return localStorage.getItem(SESSION_KEY) === "1";
}

export function setAvatarUrl(avatarUrl: string) {
  localStorage.setItem("avatarUrl", avatarUrl);
}

// AUTH

export async function apiSignup(body: { username: string; password: string; email: string; avatarUrl: string }): Promise<IdResponse | { status: number }> {
  try {
    const res = await api.post<IdResponse>("/user/signup", body);
    setAuthSession();
    setAvatarUrl(body.avatarUrl);
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
  if (res.data.avatarUrl) {
    setAvatarUrl(res.data.avatarUrl);
  }
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

export async function apiGetProfile(): Promise<{ username: string; email: string; avatarUrl: string; totalWorkflows: number; memberSince: string }> {
  const res = await api.get<{ username: string; email: string; avatarUrl: string; totalWorkflows: number; memberSince: string }>("/user/profile");
  return res.data;
}

export async function apiUpdateProfile(body: { email?: string; avatarUrl: string }): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>("/user/update-avatar", body);
  if (res.status === 200) {
    setAvatarUrl(body.avatarUrl);
  }
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
