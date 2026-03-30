export type NodeRegistryKind = "trigger" | "action";
export type BuilderActionCategory = "Indian" | "Crypto" | "Notification" | "Reporting" | "Flow";
export type BuilderPanelGroup = "Order Execution" | "Order Notification" | "Flow Control" | "Reporting";
export type BuilderFormId =
    | "timer"
    | "price-trigger"
    | "conditional"
    | "trading"
    | "gmail"
    | "slack"
    | "telegram"
    | "discord"
    | "whatsapp"
    | "delay"
    | "notion-daily-report"
    | "google-drive-daily-csv"
    | "none";
export type ExecutorTriggerProcessorId = "timer" | "price-trigger" | "conditional-trigger";
export type ExecutorActionHandlerId =
    | "noop"
    | "delay"
    | "zerodha"
    | "groww"
    | "lighter"
    | "gmail"
    | "slack"
    | "telegram"
    | "discord"
    | "whatsapp"
    | "notion-daily-report"
    | "google-drive-daily-csv";

export interface NodeRegistryEntry {
    id: string;
    title: string;
    description: string;
    kind: NodeRegistryKind;
    builderCategory?: BuilderActionCategory;
    builderPanelGroup?: BuilderPanelGroup;
    builderFormId?: BuilderFormId;
    builderRendererId?: string;
    aiAllowed?: boolean;
    aiPreferredAction?: boolean;
    aiNodeType?: string;
    aiPromptNodeType?: string;
    metadataFields: string[];
    reusableSecretService?: string;
    secretFieldKeys?: string[];
    executorTriggerProcessorId?: ExecutorTriggerProcessorId;
    executorActionHandlerId?: ExecutorActionHandlerId;
    aliases?: string[];
}

export const NODE_METADATA_FIELD_LABELS: Record<string, string> = {
    apiKey: "API key",
    accessToken: "Access token",
    recipientEmail: "Recipient email",
    recipientPhone: "Recipient phone",
    slackBotToken: "Slack bot token",
    slackUserId: "Slack user ID",
    telegramBotToken: "Telegram bot token",
    telegramChatId: "Telegram chat ID",
    webhookUrl: "Webhook URL",
    notionApiKey: "Notion API key",
    parentPageId: "Parent page ID",
    googleClientEmail: "Google service account email",
    googlePrivateKey: "Google private key",
    googleDriveFolderId: "Google Drive folder ID",
    accountIndex: "Account index",
    apiKeyIndex: "API key index",
    durationSeconds: "Delay duration (seconds)",
    aiConsent: "AI consent",
};

export const NODE_REGISTRY: NodeRegistryEntry[] = [
    {
        id: "timer",
        title: "Timer",
        description: "Run this trigger every X seconds/minutes/hours/days",
        kind: "trigger",
        builderFormId: "timer",
        builderRendererId: "timer",
        executorTriggerProcessorId: "timer",
        aiAllowed: true,
        aiNodeType: "timer",
        aiPromptNodeType: "timer",
        metadataFields: ["time", "marketType", "asset"],
    },
    {
        id: "price-trigger",
        title: "Price Trigger",
        description: "Run this trigger when a stock price crosses a certain threshold for an asset",
        kind: "trigger",
        builderFormId: "price-trigger",
        builderRendererId: "price-trigger",
        executorTriggerProcessorId: "price-trigger",
        aiAllowed: true,
        aiNodeType: "price",
        aiPromptNodeType: "price",
        aliases: ["price"],
        metadataFields: ["asset", "targetPrice", "marketType", "condition"],
    },
    {
        id: "conditional-trigger",
        title: "Conditional Trigger",
        description: "Run this trigger when a custom condition is met based on data from previous nodes",
        kind: "trigger",
        builderCategory: "Flow",
        builderFormId: "conditional",
        builderRendererId: "conditional-trigger",
        executorTriggerProcessorId: "conditional-trigger",
        aiAllowed: true,
        aiNodeType: "conditional-trigger",
        aiPromptNodeType: "conditional-trigger",
        metadataFields: ["asset", "marketType", "condition", "targetPrice", "timeWindowMinutes", "expression"],
    },
    {
        id: "zerodha",
        title: "Zerodha",
        description: "Execute an order on Zerodha",
        kind: "action",
        builderCategory: "Indian",
        builderPanelGroup: "Order Execution",
        builderFormId: "trading",
        builderRendererId: "zerodha",
        executorActionHandlerId: "zerodha",
        aiAllowed: true,
        aiPreferredAction: true,
        aiNodeType: "zerodha",
        aiPromptNodeType: "Zerodha",
        aliases: ["Zerodha"],
        metadataFields: ["type", "qty", "symbol", "apiKey", "accessToken", "exchange"],
        reusableSecretService: "zerodha",
        secretFieldKeys: ["apiKey", "accessToken"],
    },
    {
        id: "groww",
        title: "Groww",
        description: "Execute an order on Groww",
        kind: "action",
        builderCategory: "Indian",
        builderPanelGroup: "Order Execution",
        builderFormId: "trading",
        builderRendererId: "groww",
        executorActionHandlerId: "groww",
        aiAllowed: true,
        aiPreferredAction: true,
        aiNodeType: "groww",
        aiPromptNodeType: "Groww",
        aliases: ["Groww"],
        metadataFields: ["type", "qty", "symbol", "accessToken", "exchange"],
        reusableSecretService: "groww",
        secretFieldKeys: ["accessToken"],
    },
    {
        id: "lighter",
        title: "Lighter",
        description: "Execute a trade on Lighter",
        kind: "action",
        builderCategory: "Crypto",
        builderPanelGroup: "Order Execution",
        builderFormId: "trading",
        builderRendererId: "lighter",
        executorActionHandlerId: "lighter",
        aiPreferredAction: true,
        metadataFields: ["type", "qty", "symbol", "apiKey", "accountIndex", "apiKeyIndex"],
        reusableSecretService: "lighter",
        secretFieldKeys: ["apiKey", "accountIndex", "apiKeyIndex"],
    },
    {
        id: "if",
        title: "If",
        description: "Evaluate a condition mid-workflow and branch into true or false paths",
        kind: "action",
        builderCategory: "Flow",
        builderPanelGroup: "Flow Control",
        builderFormId: "conditional",
        builderRendererId: "if",
        executorActionHandlerId: "noop",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: ["asset", "marketType", "condition", "targetPrice", "timeWindowMinutes", "expression"],
    },
    {
        id: "filter",
        title: "Filter",
        description: "Continue only when a condition passes, without creating extra branches",
        kind: "action",
        builderCategory: "Flow",
        builderPanelGroup: "Flow Control",
        builderFormId: "conditional",
        builderRendererId: "filter",
        executorActionHandlerId: "noop",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: ["asset", "marketType", "condition", "targetPrice", "timeWindowMinutes", "expression"],
    },
    {
        id: "delay",
        title: "Delay",
        description: "Wait for a fixed duration before continuing to the next node",
        kind: "action",
        builderCategory: "Flow",
        builderPanelGroup: "Flow Control",
        builderFormId: "delay",
        builderRendererId: "delay",
        executorActionHandlerId: "delay",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: ["durationSeconds"],
    },
    {
        id: "merge",
        title: "Merge",
        description: "Join multiple branches back into one shared downstream path",
        kind: "action",
        builderCategory: "Flow",
        builderPanelGroup: "Flow Control",
        builderFormId: "none",
        builderRendererId: "merge",
        executorActionHandlerId: "noop",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: [],
    },
    {
        id: "gmail",
        title: "Gmail",
        description: "Send email notifications for workflow events",
        kind: "action",
        builderCategory: "Notification",
        builderPanelGroup: "Order Notification",
        builderFormId: "gmail",
        builderRendererId: "gmail",
        executorActionHandlerId: "gmail",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: ["recipientEmail", "recipientName"],
    },
    {
        id: "slack",
        title: "Slack",
        description: "Send Slack direct messages for workflow events",
        kind: "action",
        builderCategory: "Notification",
        builderPanelGroup: "Order Notification",
        builderFormId: "slack",
        builderRendererId: "slack",
        executorActionHandlerId: "slack",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: ["slackBotToken", "slackUserId", "recipientName"],
        reusableSecretService: "slack",
        secretFieldKeys: ["slackBotToken", "slackUserId"],
    },
    {
        id: "telegram",
        title: "Telegram",
        description: "Send Telegram bot messages for workflow events",
        kind: "action",
        builderCategory: "Notification",
        builderPanelGroup: "Order Notification",
        builderFormId: "telegram",
        builderRendererId: "telegram",
        executorActionHandlerId: "telegram",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: ["telegramBotToken", "telegramChatId", "recipientName"],
        reusableSecretService: "telegram",
        secretFieldKeys: ["telegramBotToken", "telegramChatId"],
    },
    {
        id: "discord",
        title: "Discord",
        description: "Send Discord webhook notifications for workflow events",
        kind: "action",
        builderCategory: "Notification",
        builderPanelGroup: "Order Notification",
        builderFormId: "discord",
        builderRendererId: "discord",
        executorActionHandlerId: "discord",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: ["webhookUrl", "recipientName"],
        reusableSecretService: "discord",
        secretFieldKeys: ["webhookUrl"],
    },
    {
        id: "whatsapp",
        title: "WhatsApp",
        description: "Send WhatsApp notifications for workflow events",
        kind: "action",
        builderCategory: "Notification",
        builderPanelGroup: "Order Notification",
        builderFormId: "whatsapp",
        builderRendererId: "whatsapp",
        executorActionHandlerId: "whatsapp",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: ["recipientPhone", "recipientName"],
        reusableSecretService: "whatsapp",
        secretFieldKeys: ["recipientPhone"],
    },
    {
        id: "notion-daily-report",
        title: "Notion Daily Report",
        description: "Create a daily AI performance report page in Notion (Zerodha only)",
        kind: "action",
        builderCategory: "Reporting",
        builderPanelGroup: "Reporting",
        builderFormId: "notion-daily-report",
        builderRendererId: "notion-daily-report",
        executorActionHandlerId: "notion-daily-report",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: ["notionApiKey", "parentPageId", "aiConsent"],
        reusableSecretService: "notion-daily-report",
        secretFieldKeys: ["notionApiKey"],
    },
    {
        id: "google-drive-daily-csv",
        title: "Google Drive Daily CSV",
        description: "After 3:30 PM IST, export Zerodha trades + AI insights to Google Drive once per day",
        kind: "action",
        builderCategory: "Reporting",
        builderPanelGroup: "Reporting",
        builderFormId: "google-drive-daily-csv",
        builderRendererId: "google-drive-daily-csv",
        executorActionHandlerId: "google-drive-daily-csv",
        aiAllowed: true,
        aiPreferredAction: true,
        metadataFields: ["googleClientEmail", "googlePrivateKey", "googleDriveFolderId", "filePrefix", "aiConsent"],
        reusableSecretService: "google-drive-daily-csv",
        secretFieldKeys: ["googleClientEmail", "googlePrivateKey"],
    },
];

export function getNodeRegistryEntry(nodeType: string) {
    const normalized = String(nodeType || "").trim().toLowerCase();
    return NODE_REGISTRY.find((entry) => {
        const aliases = [entry.id, ...(entry.aliases || []), entry.aiNodeType || "", entry.aiPromptNodeType || ""]
            .map((value) => String(value).trim().toLowerCase())
            .filter(Boolean);
        return aliases.includes(normalized);
    });
}

export function getBuilderActionGroups() {
    const groups: Record<BuilderActionCategory, Array<{ id: string; title: string; description: string }>> = {
        Indian: [],
        Crypto: [],
        Notification: [],
        Reporting: [],
        Flow: [],
    };

    for (const entry of NODE_REGISTRY) {
        if (entry.kind !== "action" || !entry.builderCategory) continue;
        groups[entry.builderCategory].push({
            id: entry.id,
            title: entry.title,
            description: entry.description,
        });
    }

    return groups;
}

export function getBuilderTriggerOptions() {
    return NODE_REGISTRY
        .filter((entry) => entry.kind === "trigger")
        .map((entry) => ({
            id: entry.id,
            title: entry.title,
            description: entry.description,
        }));
}

export function getBuilderPanelActions(group: BuilderPanelGroup, hasZerodhaAction = true, marketType?: "Indian" | "Crypto" | null) {
    return NODE_REGISTRY
        .filter((entry) => {
            if (entry.kind !== "action" || entry.builderPanelGroup !== group) return false;
            if (group === "Reporting" && !hasZerodhaAction) return false;
            if (group === "Order Execution" && marketType && entry.builderCategory !== marketType) return false;
            if (group === "Order Execution" && !marketType) return false;
            return true;
        })
        .map((entry) => ({
            id: entry.id,
            title: entry.title,
            description: entry.description,
        }));
}

export function getAiPreferredActionOptions() {
    return NODE_REGISTRY
        .filter((entry) => entry.kind === "action" && entry.aiPreferredAction)
        .map((entry) => entry.id);
}

export function getAiAllowedNodeTypes() {
    return Array.from(
        new Set(
            NODE_REGISTRY
                .filter((entry) => entry.aiAllowed)
                .flatMap((entry) => [entry.id, entry.aiNodeType, ...(entry.aliases || [])])
                .map((value) => String(value || "").trim().toLowerCase())
                .filter(Boolean),
        ),
    );
}

export function getAiPromptNodeTypes() {
    return NODE_REGISTRY
        .filter((entry) => entry.aiAllowed)
        .map((entry) => entry.aiPromptNodeType || entry.aiNodeType || entry.id);
}

export function getActionMetadataReference() {
    return Object.fromEntries(
        NODE_REGISTRY
            .filter((entry) => entry.kind === "action" && entry.aiPreferredAction)
            .map((entry) => [entry.id, entry.metadataFields]),
    );
}

export function getTriggerMetadataReference() {
    return Object.fromEntries(
        NODE_REGISTRY
            .filter((entry) => entry.kind === "trigger")
            .map((entry) => [entry.aiNodeType || entry.id, entry.metadataFields]),
    );
}
