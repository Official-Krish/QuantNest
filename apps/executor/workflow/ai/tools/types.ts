export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolHandler {
  definition: ToolDefinition;
  execute: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  id: string;
}

export interface ToolResult {
  name: string;
  result: Record<string, unknown>;
  id: string;
}
