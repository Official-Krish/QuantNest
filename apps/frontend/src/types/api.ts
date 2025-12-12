export interface IdResponse {
  message: string;
  workflowId?: string;
  userId?: string;
}

export interface SigninResponse {
  message: string;
  userId: string;
  token: string;
}

export interface Workflow {
  _id: string;
  nodes: any[];
  edges: any[];
}
