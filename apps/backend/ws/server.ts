import { serve } from "bun";
import type { ServerWebSocket } from "bun";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/security";
import { agentRegistry } from "./agentRegistry";
import type { WsData } from "./agentRegistry";
import { pendingRequests } from "./pendingRequests";
import crypto from "crypto";
import {
  AgentEventModel,
  UserModel,
  WorkflowModel,
} from "@quantnest-trading/db/client";
import { createUserNotification } from "@quantnest-trading/executor-utils";
import { pauseOpenClawWorkflowsForUser } from "../services/workflowCrud";
import { sendAgentDownEmail } from "../services/emailVerification";

const PING_INTERVAL = 30_000;
const WS_PORT = 9000;

interface Message {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
}

function send(ws: ServerWebSocket<WsData>, msg: Message): void {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(msg));
  }
}

const handlers = {
  open(ws: ServerWebSocket<WsData>) {
    const timer = setInterval(() => {
      send(ws, { id: crypto.randomUUID(), type: "PING" });
    }, PING_INTERVAL);
    ws.data.pingTimer = timer;
  },

  message(ws: ServerWebSocket<WsData>, raw: string | Buffer) {
    let msg: Message;
    try {
      msg = JSON.parse(raw.toString()) as Message;
    } catch {
      return;
    }

    switch (msg.type) {
      case "HELLO": {
        const agentId = crypto.randomUUID();
        ws.data.agentId = agentId;
        const payload = msg.payload as
          | {
              version?: string;
              os?: string;
              hostname?: string;
              capabilities?: string[];
            }
          | undefined;
        agentRegistry.register({
          id: agentId,
          userId: ws.data.userId,
          ws,
          version: payload?.version ?? "0.0.0",
          os: payload?.os ?? process.platform,
          hostname: payload?.hostname ?? "unknown",
          capabilities: payload?.capabilities ?? [],
          connectedAt: new Date(),
          lastPing: new Date(),
        });
        send(ws, {
          id: crypto.randomUUID(),
          type: "HELLO_ACK",
          payload: { agentId, serverVersion: "0.1.0" },
        });

        WorkflowModel.countDocuments({
          userId: ws.data.userId,
          status: "paused",
          useOpenClaw: true,
        })
          .then((count) => {
            if (count > 0) {
              createUserNotification({
                userId: ws.data.userId,
                type: "agent_reconnected",
                severity: "info",
                title: "Agent reconnected",
                message: `Your agent is back online. ${count} OpenClaw workflow${count > 1 ? "s" : ""} ${count > 1 ? "are" : "is"} paused — resume from the dashboard when ready.`,
                metadata: { agentId, pausedCount: count },
                dedupeKey: `agent-reconnect:${agentId}`,
                dedupeWindowHours: 1,
              }).catch(() => {});
            }
          })
          .catch(() => {});
        break;
      }

      case "PONG": {
        const aid = ws.data.agentId;
        if (aid) agentRegistry.updatePing(aid);
        break;
      }

      case "EXECUTE_AI_RESULT":
      case "VERIFY_CREDENTIALS_RESULT":
      case "SET_MODEL_RESULT":
      case "TEST_MODEL_RESULT": {
        const payload = msg.payload as
          | {
              jobId?: string;
              status?: string;
              message?: string;
              data?: unknown;
            }
          | undefined;
        if (payload?.jobId) {
          pendingRequests.resolve(payload.jobId, payload);
        }
        break;
      }

      case "STATUS": {
        const aid = ws.data.agentId;
        if (aid) {
          const agent = agentRegistry.get(aid);
          if (agent) {
            const payload = msg.payload as
              | {
                  openclawVersion?: string;
                  gatewayRunning?: boolean;
                  plugins?: Array<{
                    id: string;
                    version: string;
                    capabilities: string[];
                  }>;
                  availableModels?: string[];
                  selectedModel?: string | null;
                  modelReady?: boolean;
                  modelError?: string | null;
                }
              | undefined;
            if (payload?.plugins) {
              agent.capabilities = payload.plugins.flatMap(
                (p) => p.capabilities ?? [],
              );
            }
            if (payload?.gatewayRunning !== undefined) {
              (agent as any).gatewayRunning = payload.gatewayRunning;
            }
            if (payload?.openclawVersion !== undefined) {
              (agent as any).openclawVersion = payload.openclawVersion;
            }
            if (payload?.availableModels !== undefined) {
              agent.availableModels = payload.availableModels;
            }
            if (payload?.selectedModel !== undefined) {
              agent.selectedModel = payload.selectedModel;
            }
            if (payload?.modelReady !== undefined) {
              agent.modelReady = payload.modelReady;
            }
            if (payload?.modelError !== undefined) {
              agent.modelError = payload.modelError;
            }
          }
        }
        break;
      }

      case "AUDIT_EVENT": {
        const p = msg.payload as Record<string, unknown> | undefined;
        if (p && p.type) {
          AgentEventModel.create({
            userId: ws.data.userId,
            workflowId: (p.workflowId as string) || undefined,
            type: p.type as string,
            jobId: (p.jobId as string) || undefined,
            status: (p.status as string) || undefined,
            duration: (p.duration as number) || undefined,
            error: (p.error as string) || undefined,
            metadata: (p.metadata as Record<string, unknown>) || undefined,
            createdAt: (p.timestamp as string)
              ? new Date(p.timestamp as string)
              : new Date(),
          }).catch((err) => console.error("AUDIT_EVENT save error:", err));
        }
        break;
      }

      case "INSTALL_PLUGIN_RESULT":
      case "CONFIGURE_RESULT":
      case "PLUGINS_LIST":
      case "OPENCLAWS_STATUS_RESULT":
      case "LOGS_RESULT":
      case "HEALTH_RESULT": {
        break;
      }
    }
  },

  close(ws: ServerWebSocket<WsData>) {
    if (ws.data.pingTimer) clearInterval(ws.data.pingTimer);
    if (ws.data.agentId) {
      const userId = ws.data.userId;
      const agentId = ws.data.agentId;
      agentRegistry.unregister(agentId);
      pendingRequests.rejectByAgent(agentId, new Error("Agent disconnected"));

      if (!agentRegistry.isOnline(userId)) {
        pauseOpenClawWorkflowsForUser(userId).catch(() => {});

        createUserNotification({
          userId,
          type: "agent_disconnected",
          severity: "error",
          title: "Agent disconnected",
          message:
            "Your agent went offline. OpenClaw workflows have been paused. Restart the agent and resume workflows from the dashboard.",
          metadata: { agentId },
          dedupeKey: `agent-down:${agentId}`,
          dedupeWindowHours: 1,
        }).catch(() => {});

        UserModel.findById(userId)
          .select("email displayName")
          .lean()
          .then((user) => {
            if (user?.email) {
              sendAgentDownEmail({
                email: user.email,
                username: user.displayName ?? "Trader",
                agentId,
                reason: "agent_disconnected",
              }).catch(() => {});
            }
          })
          .catch(() => {});
      }
    }
  },

  drain(ws: ServerWebSocket<WsData>) {
    // no-op
  },
};

serve({
  port: WS_PORT,
  async fetch(request: Request, server: any) {
    const url = new URL(request.url);

    if (url.pathname.trimEnd().replace(/\/+$/, "") !== "/ws") {
      return new Response("Not found", { status: 404 });
    }

    const token =
      url.searchParams.get("token") ??
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) return new Response("Unauthorized", { status: 401 });

    try {
      const jwtSecret = getJwtSecret();
      const decoded = jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
      }) as { userId: string; type?: string };
      if (decoded.type !== "agent")
        return new Response("Forbidden", { status: 403 });

      const upgraded = server.upgrade(request, {
        data: { userId: decoded.userId } as WsData,
      });
      if (!upgraded) return new Response("Upgrade failed", { status: 500 });
      return;
    } catch {
      return new Response("Unauthorized", { status: 401 });
    }
  },
  websocket: handlers,
});

console.log(`WebSocket server running on port ${WS_PORT}`);

export function sendToAgent(agentId: string, msg: Message): boolean {
  const agent = agentRegistry.get(agentId);
  if (!agent) return false;
  send(agent.ws, msg);
  return true;
}
