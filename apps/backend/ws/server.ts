import { serve } from "bun";
import type { ServerWebSocket } from "bun";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/security";
import { agentRegistry } from "./agentRegistry";
import type { WsData } from "./agentRegistry";
import { pendingRequests } from "./pendingRequests";
import crypto from "crypto";

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
        break;
      }

      case "PONG": {
        const aid = ws.data.agentId;
        if (aid) agentRegistry.updatePing(aid);
        break;
      }

      case "EXECUTE_AI_RESULT":
      case "VERIFY_CREDENTIALS_RESULT": {
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
          }
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
    if (ws.data.agentId) agentRegistry.unregister(ws.data.agentId);
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
