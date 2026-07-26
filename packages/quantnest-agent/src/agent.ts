import crypto from "node:crypto";
import os from "node:os";
import { execSync } from "node:child_process";
import { select, text, password, isCancel, cancel } from "@clack/prompts";
import {
  readCredentials,
  readWorkflowCreds,
  saveWorkflowCreds,
} from "./credentials";
import { renderTui, clearTui } from "./tui";

interface Message {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
}

const BACKOFF_MAX = 60_000;
const PING_INTERVAL = 30_000;
const OPENCLAWS_BASE = "http://127.0.0.1:18789";

let ws: WebSocket | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let running = false;
let startTime = 0;

export interface AgentStatus {
  connected: boolean;
  agentId: string | null;
  userId: string | null;
  hostname: string;
  os: string;
  version: string;
  uptime: number;
  openclawRunning: boolean;
  lastPing: Date | null;
}

const status: AgentStatus = {
  connected: false,
  agentId: null,
  userId: null,
  hostname: os.hostname(),
  os: process.platform,
  version: "0.1.0",
  uptime: 0,
  openclawRunning: false,
  lastPing: null,
};

export function getStatus(): AgentStatus {
  return {
    ...status,
    uptime: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0,
  };
}

function send(msg: Message) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

async function getWsToken(
  apiUrl: string,
  creds: { accessToken?: string; refreshToken: string },
): Promise<string> {
  const tryToken = async (token: string) => {
    const res = await fetch(`${apiUrl}/api/v1/user/agent-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { token?: string };
    return body.token ?? null;
  };

  if (creds.accessToken) {
    const wsToken = await tryToken(creds.accessToken);
    if (wsToken) return wsToken;
  }

  const refreshRes = await fetch(`${apiUrl}/api/v1/user/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: `quantnest_refresh=${creds.refreshToken}`,
    },
  });
  if (!refreshRes.ok)
    throw new Error("Session expired. Run `quantnest login` again.");

  const cookies = refreshRes.headers.getSetCookie?.() ?? [];
  const allCookies =
    cookies.length > 0 ? cookies : [refreshRes.headers.get("set-cookie") ?? ""];
  const cookieStr = allCookies.join("; ");
  const accessMatch = cookieStr.match(/quantnest_auth=([^;]+)/);
  const newAccess = accessMatch?.[1];
  if (!newAccess) throw new Error("Failed to refresh access token");

  const wsToken = await tryToken(newAccess);
  if (!wsToken) throw new Error("Failed to get WS token after refresh");
  return wsToken;
}

// ── Prompt overlay (pause / resume TUI) ──────────────────

let tuiPaused = false;

async function promptOverlay<T>(fn: () => Promise<T>): Promise<T> {
  tuiPaused = true;
  clearTui();
  process.stdout.write("\u001b[?25h");
  try {
    return await fn();
  } finally {
    tuiPaused = false;
    if (running) renderTui(getStatus);
  }
}

// ── Credential verification ──────────────────────────────

interface BrokerField {
  key: string;
  label: string;
  secret?: boolean;
}

const BROKER_SCHEMAS: Record<string, BrokerField[]> = {
  zerodha: [
    { key: "apiKey", label: "Zerodha API Key" },
    { key: "accessToken", label: "Zerodha Access Token", secret: true },
  ],
  groww: [
    { key: "apiKey", label: "Groww API Key" },
    { key: "clientId", label: "Groww Client ID" },
    { key: "clientSecret", label: "Groww Client Secret", secret: true },
  ],
  jupiter: [
    { key: "rpcUrl", label: "Solana RPC URL" },
    { key: "walletPrivateKey", label: "Wallet Private Key", secret: true },
  ],
  lighter: [
    { key: "apiKey", label: "Lighter API Key" },
    { key: "secretKey", label: "Lighter Secret Key", secret: true },
  ],
};

async function collectBrokerCreds(
  workflowId: string,
  brokers: string[],
): Promise<{
  credentials: Record<string, Record<string, string>>;
  verified: boolean;
  errors: string[];
}> {
  const existing = readWorkflowCreds(workflowId);
  const result: Record<string, Record<string, string>> = {};
  const errors: string[] = [];

  for (const broker of brokers) {
    const fields = BROKER_SCHEMAS[broker];
    if (!fields) {
      errors.push(`Unknown broker: ${broker}`);
      continue;
    }

    const saved = existing?.brokers?.[broker];
    let useSaved = false;

    if (saved) {
      const answer = await select({
        message: `Saved ${broker} credentials found. Use them?`,
        options: [
          { label: "Yes, use saved", value: "yes" },
          { label: "No, enter new", value: "no" },
        ],
      });
      if (isCancel(answer)) continue;
      useSaved = answer === "yes";
    }

    if (useSaved && saved) {
      result[broker] = saved;
    } else {
      const vals: Record<string, string> = {};
      for (const field of fields) {
        const val = field.secret
          ? await password({
              message: field.label,
              validate: (v) =>
                v?.trim() ? undefined : `${field.label} is required`,
            })
          : await text({
              message: field.label,
              validate: (v) =>
                v?.trim() ? undefined : `${field.label} is required`,
            });
        if (isCancel(val)) continue;
        vals[field.key] = (val as string).trim();
      }
      result[broker] = vals;
    }
  }

  // verify locally via OpenClaw
  for (const [broker, creds] of Object.entries(result)) {
    try {
      const verifyRes = await fetch(
        `${OPENCLAWS_BASE}/v1/plugins/quantnest/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ broker, credentials: creds }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!verifyRes.ok) {
        const body = (await verifyRes.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        errors.push(
          `${broker}: ${(body.message as string) ?? "Verification failed"}`,
        );
      }
    } catch (err) {
      errors.push(
        `${broker}: ${err instanceof Error ? err.message : "Verification error"}`,
      );
    }
  }

  const verified = errors.length === 0;

  if (verified) {
    saveWorkflowCreds({ workflowId, brokers: result });
  }

  return { credentials: result, verified, errors };
}

async function handleVerifyCredentials(payload: Record<string, unknown>) {
  const { jobId, workflowId, brokers } = payload as {
    jobId?: string;
    workflowId?: string;
    brokers?: string[];
  };
  if (!jobId || !workflowId || !brokers?.length) return;

  const { verified, errors } = await promptOverlay(() =>
    collectBrokerCreds(workflowId, brokers),
  );

  send({
    id: crypto.randomUUID(),
    type: "VERIFY_CREDENTIALS_RESULT",
    payload: { jobId, verified, errors },
  });
}

// ── AI execution ─────────────────────────────────────────

async function handleExecuteAi(payload: Record<string, unknown>) {
  const { jobId, prompt, tools, timeout } = payload as {
    jobId?: string;
    prompt?: string;
    tools?: string[];
    timeout?: number;
  };
  if (!jobId || !prompt) return;

  try {
    const openclawPayload: Record<string, unknown> = {
      model: "quantnest",
      messages: [{ role: "user", content: prompt }],
    };
    if (tools?.length) openclawPayload.tools = tools;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeout ?? 30_000);

    const res = await fetch(`${OPENCLAWS_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(openclawPayload),
      signal: controller.signal,
    });
    clearTimeout(t);

    const data = await res.json();
    send({
      id: crypto.randomUUID(),
      type: "EXECUTE_AI_RESULT",
      payload: { jobId, status: res.ok ? "success" : "error", data },
    });
  } catch (err: unknown) {
    send({
      id: crypto.randomUUID(),
      type: "EXECUTE_AI_RESULT",
      payload: {
        jobId,
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      },
    });
  }
}

// ── Other handlers ───────────────────────────────────────

async function handleVerify() {
  try {
    const res = await fetch(`${OPENCLAWS_BASE}/v1/models`, {
      signal: AbortSignal.timeout(5000),
    });
    const gatewayRunning = res.ok;
    status.openclawRunning = gatewayRunning;
    send({
      id: crypto.randomUUID(),
      type: "STATUS",
      payload: {
        openclawVersion: gatewayRunning ? "running" : "unknown",
        gatewayRunning,
        os: status.os,
        hostname: status.hostname,
      },
    });
  } catch {
    status.openclawRunning = false;
    send({
      id: crypto.randomUUID(),
      type: "STATUS",
      payload: {
        openclawVersion: "unknown",
        gatewayRunning: false,
        os: status.os,
        hostname: status.hostname,
      },
    });
  }
}

async function handleInstallPlugin(payload: Record<string, unknown>) {
  const { pluginId, source } = payload as {
    pluginId?: string;
    source?: string;
  };
  try {
    const src = source || pluginId || "";
    const res = await fetch(`${OPENCLAWS_BASE}/v1/plugins/install`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: src }),
    });
    send({
      id: crypto.randomUUID(),
      type: "INSTALL_PLUGIN_RESULT",
      payload: {
        pluginId,
        success: res.ok,
        message: res.ok ? "Installed" : "Failed",
      },
    });
  } catch (err: unknown) {
    send({
      id: crypto.randomUUID(),
      type: "INSTALL_PLUGIN_RESULT",
      payload: {
        pluginId,
        success: false,
        message: err instanceof Error ? err.message : String(err),
      },
    });
  }
}

async function handleListPlugins() {
  try {
    const res = await fetch(`${OPENCLAWS_BASE}/v1/plugins`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = res.ok ? await res.json() : [];
    send({
      id: crypto.randomUUID(),
      type: "PLUGINS_LIST",
      payload: { plugins: Array.isArray(data) ? data : [] },
    });
  } catch {
    send({
      id: crypto.randomUUID(),
      type: "PLUGINS_LIST",
      payload: { plugins: [] },
    });
  }
}

async function handleConfigure(payload: Record<string, unknown>) {
  const { pluginId, config } = payload as {
    pluginId?: string;
    config?: Record<string, unknown>;
  };
  try {
    const res = await fetch(`${OPENCLAWS_BASE}/v1/plugins/${pluginId}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config || {}),
    });
    send({
      id: crypto.randomUUID(),
      type: "CONFIGURE_RESULT",
      payload: { success: res.ok, message: res.ok ? "Configured" : "Failed" },
    });
  } catch (err: unknown) {
    send({
      id: crypto.randomUUID(),
      type: "CONFIGURE_RESULT",
      payload: {
        success: false,
        message: err instanceof Error ? err.message : String(err),
      },
    });
  }
}

async function handleOpenclawStatus() {
  try {
    const res = await fetch(`${OPENCLAWS_BASE}/v1/models`, {
      signal: AbortSignal.timeout(5000),
    });
    send({
      id: crypto.randomUUID(),
      type: "OPENCLAWS_STATUS_RESULT",
      payload: { running: res.ok, version: "unknown", uptime: 0 },
    });
  } catch {
    send({
      id: crypto.randomUUID(),
      type: "OPENCLAWS_STATUS_RESULT",
      payload: { running: false, version: "unknown", uptime: 0 },
    });
  }
}

async function handleLogs() {
  send({
    id: crypto.randomUUID(),
    type: "LOGS_RESULT",
    payload: { lines: [] },
  });
}

async function handleHealth() {
  let gatewayOk = false;
  try {
    const res = await fetch(`${OPENCLAWS_BASE}/v1/models`, {
      signal: AbortSignal.timeout(5000),
    });
    gatewayOk = res.ok;
  } catch {
    /* not running */
  }
  send({
    id: crypto.randomUUID(),
    type: "HEALTH_RESULT",
    payload: {
      openclaw: { running: gatewayOk },
      plugins: [],
      system: { platform: status.os },
    },
  });
}

// ── WebSocket connection ─────────────────────────────────

function connect(wsUrl: string, token: string) {
  const url = `${wsUrl}/ws?token=${encodeURIComponent(token)}`;
  ws = new WebSocket(url);

  ws.onopen = () => {
    status.connected = true;
    send({
      id: crypto.randomUUID(),
      type: "HELLO",
      payload: {
        version: status.version,
        os: status.os,
        hostname: status.hostname,
      },
    });
    pingTimer = setInterval(
      () => send({ id: crypto.randomUUID(), type: "PING" }),
      PING_INTERVAL,
    );
  };

  ws.onmessage = (event: MessageEvent) => {
    let msg: Message;
    try {
      msg = JSON.parse(event.data as string) as Message;
    } catch {
      return;
    }

    switch (msg.type) {
      case "HELLO_ACK": {
        const p = msg.payload as Record<string, unknown> | undefined;
        status.agentId = (p?.agentId as string) ?? null;
        break;
      }
      case "PING":
        send({ id: crypto.randomUUID(), type: "PONG" });
        break;
      case "EXECUTE_AI":
        handleExecuteAi(msg.payload ?? {});
        break;
      case "VERIFY_CREDENTIALS":
        handleVerifyCredentials(msg.payload ?? {});
        break;
      case "VERIFY":
        handleVerify();
        break;
      case "INSTALL_PLUGIN":
        handleInstallPlugin(msg.payload ?? {});
        break;
      case "LIST_PLUGINS":
        handleListPlugins();
        break;
      case "CONFIGURE":
        handleConfigure(msg.payload ?? {});
        break;
      case "OPENCLAWS_STATUS":
        handleOpenclawStatus();
        break;
      case "LOGS":
        handleLogs();
        break;
      case "HEALTH":
        handleHealth();
        break;
    }
  };

  ws.onclose = () => {
    status.connected = false;
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
    ws = null;
    if (running) reconnect(wsUrl, token, 0);
  };

  ws.onerror = () => {
    /* close fires next */
  };
}

async function reconnect(wsUrl: string, _token: string, attempt: number) {
  if (!running) return;
  const delay = Math.min(1000 * 2 ** attempt, BACKOFF_MAX);
  await sleep(delay);
  if (!running) return;

  try {
    const creds = readCredentials();
    if (!creds) {
      running = false;
      return;
    }
    const newToken = await getWsToken(creds.apiUrl, creds);
    connect(wsUrl, newToken);
  } catch {
    reconnect(wsUrl, _token, Math.min(attempt + 1, 10));
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Node version check ───────────────────────────────────

const REQUIRED_NODE = "v22.17.0";

function ensureNodeVersion(): void {
  const current = process.version;
  if (current === REQUIRED_NODE) return;

  try {
    execSync(
      `[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use ${REQUIRED_NODE}`,
      {
        encoding: "utf-8",
        shell: "bash",
        stdio: "pipe",
      },
    );
    console.log(`\x1b[33mSwitched to Node ${REQUIRED_NODE} via nvm\x1b[0m`);
    return;
  } catch {
    // nvm not available or failed
  }

  const [major, minor] = current.slice(1).split(".").map(Number);
  const [reqMajor, reqMinor] = REQUIRED_NODE.slice(1).split(".").map(Number);
  if (major !== reqMajor || minor !== reqMinor) {
    console.warn(
      `\x1b[33mWarning: Running Node ${current}, OpenClaw expects ${REQUIRED_NODE}\x1b[0m`,
    );
  }
}

// ── Public API ───────────────────────────────────────────

export async function startAgent() {
  ensureNodeVersion();

  const creds = readCredentials();
  if (!creds) {
    console.error("Not logged in. Run `quantnest login` first.");
    process.exit(1);
  }

  running = true;
  startTime = Date.now();

  try {
    const token = await getWsToken(creds.apiUrl, creds);
    connect(creds.wsUrl, token);
  } catch (err) {
    console.error(
      `Failed to connect: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  renderTui(getStatus);

  const healthTimer = setInterval(async () => {
    try {
      const res = await fetch(`${OPENCLAWS_BASE}/v1/models`, {
        signal: AbortSignal.timeout(3000),
      });
      status.openclawRunning = res.ok;
    } catch {
      status.openclawRunning = false;
    }
  }, 10_000);

  try {
    const res = await fetch(`${OPENCLAWS_BASE}/v1/models`, {
      signal: AbortSignal.timeout(3000),
    });
    status.openclawRunning = res.ok;
  } catch {
    status.openclawRunning = false;
  }

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      running = false;
      clearInterval(healthTimer);
      stopAgent();
      clearTui();
      console.log("\nAgent stopped.");
      resolve();
    });
    process.on("SIGTERM", () => {
      running = false;
      clearInterval(healthTimer);
      stopAgent();
      clearTui();
      console.log("\nAgent stopped.");
      resolve();
    });
  });
}

export function stopAgent() {
  running = false;
  status.connected = false;
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
  ws?.close();
  ws = null;
}
