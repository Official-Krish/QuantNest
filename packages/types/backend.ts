import z from "zod";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;
const ZERODHA_API_KEY_REGEX = /^[A-Za-z0-9]{8,32}$/;
const ACCESS_TOKEN_REGEX = /^[A-Za-z0-9._-]{16,512}$/;
const LIGHTER_PRIVATE_KEY_REGEX = /^(0x)?[a-fA-F0-9]{64}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLACK_BOT_TOKEN_REGEX = /^xoxb-[A-Za-z0-9-]+$/;
const SLACK_USER_ID_REGEX = /^[UW][A-Z0-9]+$/;
const TELEGRAM_BOT_TOKEN_REGEX = /^\d{6,12}:[A-Za-z0-9_-]{20,}$/;
const TELEGRAM_CHAT_ID_REGEX = /^-?\d{5,20}$/;
const DISCORD_WEBHOOK_REGEX = /^https:\/\/(discord(?:app)?\.com)\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+$/;
const WHATSAPP_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const NOTION_TOKEN_REGEX = /^(secret_[A-Za-z0-9]{20,}|ntn_[A-Za-z0-9_=-]{20,})$/;
const NOTION_PAGE_ID_REGEX = /^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
const GOOGLE_SERVICE_ACCOUNT_EMAIL_REGEX = /^[A-Za-z0-9-]+@[A-Za-z0-9-]+\.iam\.gserviceaccount\.com$/;

export const SignupSchema = z.object({
    username: z.string().min(3).max(30),
    password: z
        .string()
        .min(8)
        .max(100)
        .regex(
            PASSWORD_REGEX,
            "Password must include uppercase, lowercase, number, and special character."
    ),
    email: z.email(),
});

export const SigninSchema = z.object({
    username: z.string().min(3).max(30),
    password: z.string().min(8).max(100),
});

export const MarketPreferenceSchema = z.enum(["Indian", "US", "Crypto"]);
export const BrokerPreferenceSchema = z.enum(["Zerodha", "Groww", "Lighter", "Paper Trading"]);
export const ThemePreferenceSchema = z.enum(["Dark", "Light"]);

export const UserProfilePreferencesSchema = z.object({
    defaultMarket: MarketPreferenceSchema,
    defaultBroker: BrokerPreferenceSchema,
    theme: ThemePreferenceSchema,
});

export const UserProfileNotificationsSchema = z.object({
    workflowAlerts: z.boolean(),
});

export const UpdateUserProfileSchema = z.object({
    displayName: z.string().trim().min(1).max(80),
    preferences: UserProfilePreferencesSchema,
    notifications: UserProfileNotificationsSchema,
});

export const ReusableSecretServiceSchema = z.enum([
    "zerodha",
    "groww",
    "lighter",
    "slack",
    "telegram",
    "discord",
    "whatsapp",
    "notion-daily-report",
    "google-drive-daily-csv",
]);

export const ReusableSecretPayloadSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

export const CreateReusableSecretSchema = z.object({
    name: z.string().trim().min(2).max(80),
    service: ReusableSecretServiceSchema,
    payload: ReusableSecretPayloadSchema,
});

export const UpdateReusableSecretSchema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    payload: ReusableSecretPayloadSchema.optional(),
});

const WorkflowNodeSchema = z.object({
    nodeId: z.string().optional(),
    type: z.string().optional(),
    data: z.object({
        kind: z.union([
            z.enum(['TRIGGER', 'ACTION']),
            z.enum(['trigger', 'action']),
        ]),
        metadata: z.any(),
    }),
    id: z.string(),
    credentials: z.any().optional(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
});

const WorkflowEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.preprocess((value) => value ?? undefined, z.string().optional()),
    targetHandle: z.preprocess((value) => value ?? undefined, z.string().optional()),
});

function validateWorkflowNodes(
    nodes: Array<z.infer<typeof WorkflowNodeSchema>>,
    ctx: z.RefinementCtx
) {
    nodes.forEach((node, index) => {
        const type = String(node.type || "").toLowerCase();
        const metadata = node.data?.metadata || {};
        const path = ["nodes", index, "data", "metadata"] as const;

        const qty = Number((metadata as any).qty);
        if (["zerodha", "groww", "lighter"].includes(type)) {
            if (!Number.isFinite(qty) || qty <= 0) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "qty"],
                    message: "Quantity must be greater than 0.",
                });
            }
        }

        if (type === "zerodha") {
            const secretId = String((metadata as any).secretId || "").trim();
            const apiKey = String((metadata as any).apiKey || "").trim();
            const accessToken = String((metadata as any).accessToken || "").trim();
            if (!secretId && !ZERODHA_API_KEY_REGEX.test(apiKey)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "apiKey"],
                    message: "Invalid Zerodha API key format.",
                });
            }
            if (!secretId && accessToken.length > 0 && !ACCESS_TOKEN_REGEX.test(accessToken)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "accessToken"],
                    message: "Invalid Zerodha access token format.",
                });
            }
        }

        if (type === "groww") {
            const secretId = String((metadata as any).secretId || "").trim();
            const accessToken = String((metadata as any).accessToken || "").trim();
            if (!secretId && !ACCESS_TOKEN_REGEX.test(accessToken)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "accessToken"],
                    message: "Invalid Groww access token format.",
                });
            }
        }

        if (type === "lighter") {
            const secretId = String((metadata as any).secretId || "").trim();
            const apiKey = String((metadata as any).apiKey || "").trim();
            const accountIndex = Number((metadata as any).accountIndex);
            const apiKeyIndex = Number((metadata as any).apiKeyIndex);

            if (!secretId && !LIGHTER_PRIVATE_KEY_REGEX.test(apiKey)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "apiKey"],
                    message: "Invalid Lighter API key format.",
                });
            }
            if (!secretId && (!Number.isInteger(accountIndex) || accountIndex < 0)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "accountIndex"],
                    message: "Lighter accountIndex must be a non-negative integer.",
                });
            }
            if (!secretId && (!Number.isInteger(apiKeyIndex) || apiKeyIndex < 0)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "apiKeyIndex"],
                    message: "Lighter apiKeyIndex must be a non-negative integer.",
                });
            }
        }

        if (type === "google-drive-daily-csv") {
            const secretId = String((metadata as any).secretId || "").trim();
            const clientEmail = String((metadata as any).googleClientEmail || "").trim();
            const privateKey = String((metadata as any).googlePrivateKey || "").trim();
            const aiConsent = (metadata as any).aiConsent === true;

            if (!secretId && !GOOGLE_SERVICE_ACCOUNT_EMAIL_REGEX.test(clientEmail)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "googleClientEmail"],
                    message: "Invalid Google service account email.",
                });
            }

            if (!secretId && !privateKey.includes("BEGIN PRIVATE KEY")) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "googlePrivateKey"],
                    message: "Invalid Google private key format.",
                });
            }

            if (!aiConsent) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "aiConsent"],
                    message: "AI consent is required for Google Drive AI insights.",
                });
            }
        }

        if (type === "gmail") {
            const recipientEmail = String((metadata as any).recipientEmail || "").trim();
            if (!EMAIL_REGEX.test(recipientEmail)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "recipientEmail"],
                    message: "Invalid recipient email address.",
                });
            }
        }

        if (type === "discord") {
            const secretId = String((metadata as any).secretId || "").trim();
            const webhookUrl = String((metadata as any).webhookUrl || "").trim();
            if (!secretId && !DISCORD_WEBHOOK_REGEX.test(webhookUrl)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "webhookUrl"],
                    message: "Invalid Discord webhook URL.",
                });
            }
        }

        if (type === "slack") {
            const secretId = String((metadata as any).secretId || "").trim();
            const slackBotToken = String((metadata as any).slackBotToken || "").trim();
            const slackUserId = String((metadata as any).slackUserId || "").trim();
            if (!secretId && !SLACK_BOT_TOKEN_REGEX.test(slackBotToken)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "slackBotToken"],
                    message: "Invalid Slack bot token format.",
                });
            }
            if (!secretId && !SLACK_USER_ID_REGEX.test(slackUserId)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "slackUserId"],
                    message: "Invalid Slack user ID format.",
                });
            }
        }

        if (type === "telegram") {
            const secretId = String((metadata as any).secretId || "").trim();
            const telegramBotToken = String((metadata as any).telegramBotToken || "").trim();
            const telegramChatId = String((metadata as any).telegramChatId || "").trim();
            if (!secretId && !TELEGRAM_BOT_TOKEN_REGEX.test(telegramBotToken)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "telegramBotToken"],
                    message: "Invalid Telegram bot token format.",
                });
            }
            if (!secretId && !TELEGRAM_CHAT_ID_REGEX.test(telegramChatId)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "telegramChatId"],
                    message: "Invalid Telegram chat ID format.",
                });
            }
        }

        if (type === "whatsapp") {
            const secretId = String((metadata as any).secretId || "").trim();
            const recipientPhone = String((metadata as any).recipientPhone || "").trim();
            if (!secretId && !WHATSAPP_PHONE_REGEX.test(recipientPhone)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "recipientPhone"],
                    message: "Recipient phone must be in E.164 format.",
                });
            }
        }

        if (type === "notion-daily-report") {
            const secretId = String((metadata as any).secretId || "").trim();
            const notionApiKey = String((metadata as any).notionApiKey || "").trim();
            const parentPageId = String((metadata as any).parentPageId || "").trim();
            const aiConsent = (metadata as any).aiConsent === true;

            if (!secretId && !NOTION_TOKEN_REGEX.test(notionApiKey)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "notionApiKey"],
                    message: "Invalid Notion API key format.",
                });
            }

            if (!NOTION_PAGE_ID_REGEX.test(parentPageId)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "parentPageId"],
                    message: "Invalid Notion parent page ID format.",
                });
            }

            if (!aiConsent) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "aiConsent"],
                    message: "AI consent is required for Notion reporting.",
                });
            }
        }
    });
}

export const CreateWorkflowSchema = z.object({
    workflowName: z.string().min(3).max(100),
    nodes: z.array(WorkflowNodeSchema),
    edges: z.array(WorkflowEdgeSchema),
}).superRefine((data, ctx) => {
    validateWorkflowNodes(data.nodes, ctx);
});

export const UpdateWorkflowSchema = z.object({
    nodes: z.array(WorkflowNodeSchema),
    edges: z.array(WorkflowEdgeSchema),
}).superRefine((data, ctx) => {
    validateWorkflowNodes(data.nodes, ctx);
});

export const WorkflowStatusSchema = z.object({
    status: z.enum(["active", "paused"]),
});
