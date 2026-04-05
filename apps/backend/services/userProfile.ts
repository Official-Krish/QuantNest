import { ExecutionModel, UserModel, WorkflowModel, ZerodhaTokenModel } from "@quantnest-trading/db/client";

const INTEGRATION_CATALOG = [
  {
    key: "zerodha",
    name: "Zerodha",
    description: "Broker execution accounts linked through workflow credentials.",
    nodeType: "zerodha",
  },
  {
    key: "groww",
    name: "Groww",
    description: "Retail brokerage connections used across active workflows.",
    nodeType: "groww",
  },
  {
    key: "gmail",
    name: "Gmail",
    description: "Email delivery accounts referenced by workflow actions.",
    nodeType: "gmail",
  },
  {
    key: "slack",
    name: "Slack",
    description: "Direct-message destinations configured for workflow notifications.",
    nodeType: "slack",
  },
  {
    key: "telegram",
    name: "Telegram",
    description: "Bot destinations configured for workflow notifications.",
    nodeType: "telegram",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    description: "Messaging destinations configured for urgent notifications.",
    nodeType: "whatsapp",
  },
  {
    key: "notion",
    name: "Notion",
    description: "Workspace destinations used for reports and journaling.",
    nodeType: "notion-daily-report",
  },
  {
    key: "discord",
    name: "Discord",
    description: "Webhook destinations used for community and bot alerts.",
    nodeType: "discord",
  },
] as const;

export function buildDefaultDisplayName(username: string) {
  return username
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function buildIntegrationSummaries(userId: string) {
  const zerodhaActiveTokens = await ZerodhaTokenModel.countDocuments({ userId, status: "active" });

  return Promise.all(
    INTEGRATION_CATALOG.map(async (integration) => {
      const linkedWorkflows = await WorkflowModel.countDocuments({
        userId,
        "nodes.type": integration.nodeType,
      });

      const connectedAccounts = integration.key === "zerodha" ? zerodhaActiveTokens : undefined;
      const isConnected = linkedWorkflows > 0 || (connectedAccounts ?? 0) > 0;

      return {
        key: integration.key,
        name: integration.name,
        description: integration.description,
        status: isConnected ? "connected" : "available",
        linkedWorkflows,
        connectedAccounts,
        managementMode: "workflow-scoped" as const,
      };
    }),
  );
}

export async function getUserProfilePayload(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) {
    return null;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalWorkflows, totalExecutions, executionsThisMonth, integrations] = await Promise.all([
    WorkflowModel.countDocuments({ userId }),
    ExecutionModel.countDocuments({ userId }),
    ExecutionModel.countDocuments({ userId, startTime: { $gte: startOfMonth } }),
    buildIntegrationSummaries(userId),
  ]);

  return {
    message: "User profile retrieved",
    username: user.username,
    displayName: user.displayName?.trim() || buildDefaultDisplayName(user.username),
    email: user.email,
    avatarUrl: user.avatarUrl,
    memberSince: user.createdAt.toDateString(),
    accountStatus: user.emailVerified === false ? "Pending verification" : "Active",
    preferences: {
      defaultMarket: user.preferences?.defaultMarket || "Indian",
      defaultBroker: user.preferences?.defaultBroker || "Zerodha",
      theme: user.preferences?.theme || "Dark",
    },
    notifications: {
      workflowAlerts: user.notifications?.workflowAlerts ?? true,
    },
    stats: {
      totalWorkflows,
      totalExecutions,
      executionsThisMonth,
      connectedIntegrations: integrations.filter((item) => item.status === "connected").length,
    },
    integrations,
  };
}

export async function updateUserProfilePayload(params: {
  userId: string;
  displayName: string;
  preferences: any;
  notifications: any;
}) {
  const user = await UserModel.findByIdAndUpdate(
    params.userId,
    {
      displayName: params.displayName,
      preferences: params.preferences,
      notifications: params.notifications,
    },
    { new: true },
  );

  if (!user) {
    return null;
  }

  return {
    message: "Profile updated",
    displayName: user.displayName?.trim() || buildDefaultDisplayName(user.username),
    preferences: {
      defaultMarket: user.preferences?.defaultMarket || "Indian",
      defaultBroker: user.preferences?.defaultBroker || "Zerodha",
      theme: user.preferences?.theme || "Dark",
    },
    notifications: {
      workflowAlerts: user.notifications?.workflowAlerts ?? true,
    },
  };
}
