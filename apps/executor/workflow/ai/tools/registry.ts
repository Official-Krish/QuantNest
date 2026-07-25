import type {
  ToolDefinition,
  ToolHandler,
  ToolCall,
  ToolResult,
} from "./types";
import { getPriceTool, getVolumeTool } from "./market";

const toolHandlers = new Map<string, ToolHandler>([
  ["get_market_price", getPriceTool],
  ["get_market_volume", getVolumeTool],
]);

export function getToolDefinitions(): ToolDefinition[] {
  return Array.from(toolHandlers.values()).map((h) => h.definition);
}

export function getToolHandlers(): Map<string, ToolHandler> {
  return toolHandlers;
}

export async function executeToolCalls(
  calls: ToolCall[],
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const call of calls) {
    const handler = toolHandlers.get(call.name);
    if (!handler) {
      results.push({
        name: call.name,
        result: { error: `Unknown tool: ${call.name}` },
        id: call.id,
      });
      continue;
    }

    try {
      const result = await handler.execute(call.args);
      results.push({ name: call.name, result, id: call.id });
    } catch (error) {
      results.push({
        name: call.name,
        result: {
          error:
            error instanceof Error ? error.message : "Tool execution failed",
        },
        id: call.id,
      });
    }
  }

  return results;
}
