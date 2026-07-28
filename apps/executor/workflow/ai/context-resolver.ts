import type { ExecutionContext } from "../execute.context";

const VARIABLE_PATTERN = /\{\{\s*([\w.[\]]+)\s*\}\}/g;

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const key = arrayMatch[1];
      const indexStr = arrayMatch[2];
      if (!key || !indexStr) return undefined;
      current = (current as Record<string, unknown>)[key];
      const index = parseInt(indexStr, 10);
      if (Array.isArray(current) && !isNaN(index)) current = current[index];
      else return undefined;
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }
  return current;
}

export function resolveTemplateVariables(
  template: string,
  context: ExecutionContext,
): string {
  const details = (context.details ?? {}) as Record<string, unknown>;

  return template.replace(VARIABLE_PATTERN, (_match, varPath: string) => {
    let value: unknown;

    if (varPath.startsWith("ai.") || varPath.startsWith("ai[")) {
      value = resolvePath(details, varPath);
    }

    if (value === undefined) {
      value = resolvePath(details, varPath);
    }

    if (value === undefined) {
      return _match;
    }

    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
    return JSON.stringify(value);
  });
}

export function evaluateContextCondition(
  expression: string,
  context: ExecutionContext,
): boolean {
  const resolved = resolveTemplateVariables(expression, context);
  const normalized = resolved.trim();

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  const compareVals = (
    expr: string,
    operator: string,
  ): [string, string] | null => {
    const idx = expr.indexOf(operator);
    if (idx === -1) return null;
    const left = expr
      .slice(0, idx)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    const right = expr
      .slice(idx + operator.length)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    return [left, right];
  };

  let parts: [string, string] | null;

  parts = compareVals(normalized, "==");
  if (parts) return parts[0] === parts[1];

  parts = compareVals(normalized, "!=");
  if (parts) return parts[0] !== parts[1];

  parts = compareVals(normalized, ">=");
  if (parts) return parseFloat(parts[0]) >= parseFloat(parts[1]);

  parts = compareVals(normalized, "<=");
  if (parts) return parseFloat(parts[0]) <= parseFloat(parts[1]);

  parts = compareVals(normalized, ">");
  if (parts) return parseFloat(parts[0]) > parseFloat(parts[1]);

  parts = compareVals(normalized, "<");
  if (parts) return parseFloat(parts[0]) < parseFloat(parts[1]);

  return false;
}
