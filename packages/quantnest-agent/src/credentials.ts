import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  chmodSync,
} from "node:fs";
import crypto from "node:crypto";

const CONFIG_DIR = `${process.env.HOME || "/tmp"}/.quantnest`;
const KEY_FILE = `${CONFIG_DIR}/.key`;
const CREDENTIALS_FILE = `${CONFIG_DIR}/credentials.json`;
const WORKFLOWS_DIR = `${CONFIG_DIR}/workflows`;

const ALGORITHM = "aes-256-gcm";

export interface Credentials {
  userId: string;
  accessToken: string;
  refreshToken: string;
  apiUrl: string;
  wsUrl: string;
  firstRunComplete?: boolean;
}

export interface WorkflowCreds {
  workflowId: string;
  brokers: Record<string, Record<string, string>>;
}

// ── Machine key ──────────────────────────────────────────

function getOrCreateKey(): Buffer {
  mkdirSync(CONFIG_DIR, { recursive: true });
  if (existsSync(KEY_FILE)) {
    return readFileSync(KEY_FILE);
  }
  const key = crypto.randomBytes(32);
  writeFileSync(KEY_FILE, key, { mode: 0o600 });
  chmodSync(KEY_FILE, 0o600);
  return key;
}

// ── Encrypt / Decrypt ────────────────────────────────────

function encrypt(plaintext: string): string {
  const key = getOrCreateKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(encoded: string): string {
  const key = getOrCreateKey();
  const parts = encoded.split(":");
  const iv = Buffer.from(parts[0]!, "hex");
  const tag = Buffer.from(parts[1]!, "hex");
  const data = Buffer.from(parts[2]!, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf-8");
}

// ── Session auth ─────────────────────────────────────────

export function readCredentials(): Credentials | null {
  try {
    if (!existsSync(CREDENTIALS_FILE)) return null;
    const text = readFileSync(CREDENTIALS_FILE, "utf-8");
    return JSON.parse(text) as Credentials;
  } catch {
    return null;
  }
}

export function writeCredentials(creds: Credentials): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), {
    mode: 0o600,
  });
  chmodSync(CREDENTIALS_FILE, 0o600);
}

export function isFirstRun(): boolean {
  const creds = readCredentials();
  return !creds || !creds.firstRunComplete;
}

export function markFirstRunComplete(): void {
  const creds = readCredentials();
  if (creds) {
    creds.firstRunComplete = true;
    writeCredentials(creds);
  }
}

export function clearCredentials(): void {
  try {
    rmSync(CREDENTIALS_FILE, { force: true });
  } catch {
    // ignore
  }
}

// ── Per-workflow encrypted creds ─────────────────────────

export function getWorkflowCredsPath(workflowId: string): string {
  return `${WORKFLOWS_DIR}/${workflowId}/creds.json.age`;
}

export function readWorkflowCreds(workflowId: string): WorkflowCreds | null {
  try {
    const path = getWorkflowCredsPath(workflowId);
    if (!existsSync(path)) return null;
    const encrypted = readFileSync(path, "utf-8").trim();
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted) as WorkflowCreds;
  } catch {
    return null;
  }
}

export function saveWorkflowCreds(creds: WorkflowCreds): void {
  const dir = `${WORKFLOWS_DIR}/${creds.workflowId}`;
  mkdirSync(dir, { recursive: true });
  const encrypted = encrypt(JSON.stringify(creds, null, 2));
  writeFileSync(getWorkflowCredsPath(creds.workflowId), encrypted, {
    mode: 0o600,
  });
}

export function deleteWorkflowCreds(workflowId: string): void {
  const dir = `${WORKFLOWS_DIR}/${workflowId}`;
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

export function clearAllWorkflowCreds(): void {
  try {
    rmSync(WORKFLOWS_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

export function listWorkflowCreds(): string[] {
  try {
    if (!existsSync(WORKFLOWS_DIR)) return [];
    return readFileSync(WORKFLOWS_DIR, "utf-8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
