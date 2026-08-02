import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

const CONFIG_DIR = `${process.env.HOME || "/tmp"}/.quantnest`;
const AUDIT_FILE = join(CONFIG_DIR, "audit.log");
const MAX_SIZE = 10 * 1024 * 1024;

export interface AuditEntry {
  timestamp: string;
  type: string;
  jobId?: string;
  workflowId?: string;
  status?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export function auditLog(entry: AuditEntry): void {
  mkdirSync(CONFIG_DIR, { recursive: true });

  if (existsSync(AUDIT_FILE) && statSync(AUDIT_FILE).size > MAX_SIZE) {
    const rotated = join(CONFIG_DIR, "audit.old.log");
    try {
      rmSync(rotated, { force: true });
    } catch {
      /* ignore */
    }
    try {
      appendFileSync(rotated, readFileSync(AUDIT_FILE));
    } catch {
      /* ignore */
    }
    rmSync(AUDIT_FILE, { force: true });
  }

  appendFileSync(AUDIT_FILE, JSON.stringify(entry) + "\n", "utf-8");
}

export function queryAudit(
  opts: {
    limit?: number;
    type?: string;
    tail?: boolean;
  } = {},
): AuditEntry[] {
  if (!existsSync(AUDIT_FILE)) return [];

  const text = readFileSync(AUDIT_FILE, "utf-8");
  const lines = text.trim().split("\n").filter(Boolean);

  const entries: AuditEntry[] = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line) as AuditEntry);
    } catch {
      /* skip corrupt lines */
    }
  }

  let filtered = opts.type
    ? entries.filter((e) => e.type === opts.type)
    : entries;

  if (opts.tail) {
    filtered = filtered.slice(-(opts.limit ?? 50));
  } else if (opts.limit) {
    filtered = filtered.slice(0, opts.limit);
  }

  return filtered;
}

export function clearAudit(): void {
  try {
    rmSync(AUDIT_FILE, { force: true });
  } catch {
    /* ignore */
  }
}
