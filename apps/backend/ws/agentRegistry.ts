import type { ServerWebSocket } from "bun";

export interface WsData {
  userId: string;
  agentId?: string;
  pingTimer?: ReturnType<typeof setInterval>;
}

export interface Agent {
  id: string;
  userId: string;
  ws: ServerWebSocket<WsData>;
  version: string;
  os: string;
  hostname: string;
  capabilities: string[];
  connectedAt: Date;
  lastPing: Date;
}

export class AgentRegistry {
  private agents = new Map<string, Agent>();
  private userAgents = new Map<string, Set<string>>();

  register(agent: Agent): void {
    this.agents.set(agent.id, agent);
    const existing = this.userAgents.get(agent.userId) ?? new Set();
    existing.add(agent.id);
    this.userAgents.set(agent.userId, existing);
  }

  unregister(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      const userSet = this.userAgents.get(agent.userId);
      if (userSet) {
        userSet.delete(agentId);
        if (userSet.size === 0) this.userAgents.delete(agent.userId);
      }
    }
  }

  get(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getByUser(userId: string): Agent[] {
    const ids = this.userAgents.get(userId);
    if (!ids) return [];
    return [...ids].map((id) => this.agents.get(id)).filter(Boolean) as Agent[];
  }

  isOnline(userId: string): boolean {
    const ids = this.userAgents.get(userId);
    return !!ids && ids.size > 0;
  }

  pickForUser(userId: string): Agent | undefined {
    const agents = this.getByUser(userId);
    if (agents.length === 0) return undefined;
    return agents.reduce((a, b) => (a.lastPing > b.lastPing ? a : b));
  }

  updatePing(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) agent.lastPing = new Date();
  }

  getAll(): Agent[] {
    return [...this.agents.values()];
  }
}

export const agentRegistry = new AgentRegistry();
