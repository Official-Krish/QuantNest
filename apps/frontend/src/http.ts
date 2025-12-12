import axios from "axios";
import type { IdResponse, SigninResponse, Workflow } from "./types/api";

const API_BASE = "http://localhost:3000/api/v1"; 

export const api = axios.create({
  baseURL: API_BASE,
});


export function setAuthToken(token: string) {
  localStorage.setItem("token", token);
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

const existing = localStorage.getItem("token");
if (existing) {
  api.defaults.headers.common["Authorization"] = `Bearer ${existing}`;
}

// AUTH

export async function apiSignup(body: { username: string; password: string }): Promise<IdResponse> {
  const res = await api.post<IdResponse>("/user/signup", body);
  return res.data;
}

export async function apiSignin(body: { username: string; password: string }): Promise<SigninResponse> {
  const res = await api.post<SigninResponse>("/user/signin", body);
  setAuthToken(res.data.token);
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
  const res = await api.get<Workflow>(`/workflow/${workflowId}`);
  return res.data;
}

export async function apiGetAllWorkflows(): Promise<{ workflows: Workflow[] }> {
  const res = await api.get<{ message: string; workflows: Workflow[] }>("/workflow/getAll");
  return res.data;
}

export async function apiGetExecution(workflowId: string) {
  const res = await api.get(`/workflow/executions/${workflowId}`);
  return res.data;
}
