export interface IdResponse {
  message: string;
  workflowId?: string;
  userId?: string;
}

export interface SigninResponse {
  message: string;
  userId: string;
  avatarUrl: string;
}

export interface Workflow {
  _id: string;
  workflowName: string;
  nodes: any[];
  edges: any[];
  status?: "active" | "paused";
  marketType?: "Indian" | "Crypto";
}

export type marketStatus = {
  isOpen: boolean;
  message: string;
  nextOpenTime?: string;
}
