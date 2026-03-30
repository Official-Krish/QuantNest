import mongoose , { Schema } from 'mongoose';
import crypto from "crypto";

export const REUSABLE_SECRET_SERVICES = [
    "zerodha",
    "groww",
    "lighter",
    "slack",
    "telegram",
    "discord",
    "whatsapp",
    "notion-daily-report",
    "google-drive-daily-csv",
] as const;

export type ReusableSecretService = typeof REUSABLE_SECRET_SERVICES[number];

export type EncryptedSecretPayload = {
    iv: string;
    authTag: string;
    ciphertext: string;
};

function getReusableSecretKey() {
    const raw = process.env.REUSABLE_SECRET_ENCRYPTION_KEY || process.env.JWT_SECRET || "";
    if (!raw) {
        throw new Error("REUSABLE_SECRET_ENCRYPTION_KEY must be configured.");
    }
    return crypto.createHash("sha256").update(raw).digest();
}

export function encryptReusableSecretPayload(payload: Record<string, unknown>): EncryptedSecretPayload {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", getReusableSecretKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(payload), "utf8"),
        cipher.final(),
    ]);

    return {
        iv: iv.toString("base64"),
        authTag: cipher.getAuthTag().toString("base64"),
        ciphertext: encrypted.toString("base64"),
    };
}

export function decryptReusableSecretPayload(payload: EncryptedSecretPayload): Record<string, unknown> {
    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        getReusableSecretKey(),
        Buffer.from(payload.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(payload.ciphertext, "base64")),
        decipher.final(),
    ]);
    return JSON.parse(decrypted.toString("utf8"));
}

const UserPreferencesSchema = new Schema({
    defaultMarket: {
        type: String,
        enum: ["Indian", "US", "Crypto"],
        default: "Indian",
    },
    defaultBroker: {
        type: String,
        enum: ["Zerodha", "Groww", "Lighter", "Paper Trading"],
        default: "Zerodha",
    },
    theme: {
        type: String,
        enum: ["Dark", "Light"],
        default: "Dark",
    },
}, {
    _id: false,
});

const UserNotificationPreferencesSchema = new Schema({
    workflowAlerts: {
        type: Boolean,
        default: true,
    },
}, {
    _id: false,
});

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    }, 
    avatarUrl: {
        type: String,
        required: false,
    },
    displayName: {
        type: String,
        required: false,
        trim: true,
    },
    preferences: {
        type: UserPreferencesSchema,
        default: () => ({
            defaultMarket: "Indian",
            defaultBroker: "Zerodha",
            theme: "Dark",
        }),
    },
    notifications: {
        type: UserNotificationPreferencesSchema,
        default: () => ({
            workflowAlerts: true,
        }),
    },
    emailVerified: {
        type: Boolean,
        default: true,
    },
    emailVerificationToken: {
        type: String,
        required: false,
    },
    emailVerificationExpiresAt: {
        type: Date,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const EdgesSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    target: {
        type: String,
        required: true,
    },
    sourceHandle: {
        type: String,
        required: false,
    },
    targetHandle: {
        type: String,
        required: false,
    },
}, {
    _id: false,
});

const PositionSchema = new Schema({
    x: {
        type: Number,
        required: true,
    },
    y: {
        type: Number,
        required: true,
    },
}, {
    _id: false,
});

const NodeDataSchema = new Schema({
    kind: {
        type: String,
        enum: ["action", "trigger", "ACTION", "TRIGGER"],
    },
    metadata: Schema.Types.Mixed,
}, {
    _id: false,
});

const WorkflowNodeSchema = new Schema({
    id : {
        type: String,
        required: true,
    },
    nodeId: {
        type: String,
        ref: "Nodes",
        required: true,
    },
    type: {
        type: String,
        required: false,
    },
    data: NodeDataSchema,
    position: PositionSchema,
    Credentials: Schema.Types.Mixed,
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, {
    _id: false,
})

const WorkflowSchema = new Schema({
    workflowName: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    nodes: [WorkflowNodeSchema],
    edges: [EdgesSchema],
    status: {
        type: String,
        enum: ["active", "paused"],
        default: "active",
    },
    triggerType: {
        type: String,
        enum: ["timer", "price-trigger", "conditional-trigger"],
        required: false,
        index: true,
    },
    triggerNodeId: {
        type: String,
        required: false,
    },
    triggerConfig: {
        type: Schema.Types.Mixed,
        required: false,
    },
    nextRunAt: {
        type: Date,
        required: false,
        index: true,
    },
    lastTriggeredAt: {
        type: Date,
        required: false,
    },
    lastEvaluatedAt: {
        type: Date,
        required: false,
    },
});

const CreedentialTypeSchema = new Schema({
    title: {type: String, required: true},
    required: {type: Boolean, required: true},
})

const NodesSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    credentialType: {
        type: [CreedentialTypeSchema],
        required: false,
    },
    metadataSchema: {
        type: Schema.Types.Mixed,
    },
    type: {
        type: String,
        enum: ["action", "trigger", "ACTION", "TRIGGER"],
        required: false,
    },
    credentials: [CreedentialTypeSchema],
});

const ExrcutionStepSchema = new Schema({
    step: {
        type: Number,
        required: true,
    },
    nodeId: {
        type: String,
        required: true,
    },
    nodeType: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Success", "Failed"],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
}, {
    _id: false,
});

const ExecutionSchema = new Schema({
    workflowId: {
        type: mongoose.Types.ObjectId,
        ref: 'Workflows',
        required: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    status: {
        type: String,
        enum: ["Success", "Failed", "InProgress"],
        required: true,
    },
    steps: [ExrcutionStepSchema],
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
});

const NotificationSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    workflowId: {
        type: mongoose.Types.ObjectId,
        ref: 'Workflows',
        required: false,
    },
    workflowName: {
        type: String,
        required: false,
    },
    type: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: ["info", "warning", "error"],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    metadata: {
        type: Schema.Types.Mixed,
        required: false,
    },
    dedupeKey: {
        type: String,
        required: false,
    },
    read: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const WorkflowExampleSchema = new Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    summary: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ["Execution", "Reporting", "Alerts", "AI"],
        required: true,
    },
    market: {
        type: String,
        enum: ["Indian", "Crypto", "Cross-market"],
        required: true,
    },
    difficulty: {
        type: String,
        enum: ["Starter", "Intermediate", "Advanced"],
        required: true,
    },
    setupMinutes: {
        type: Number,
        required: true,
    },
    nodeFlow: {
        type: [String],
        required: true,
    },
    trigger: {
        type: String,
        required: true,
    },
    logic: {
        type: String,
        required: true,
    },
    actions: {
        type: [String],
        required: true,
    },
    outcomes: {
        type: [String],
        required: true,
    },
    nodes: {
        type: [WorkflowNodeSchema],
        required: true,
    },
    edges: {
        type: [EdgesSchema],
        required: true,
    },
    sortOrder: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});

const ZerodhaTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    workflowId: {
        type: mongoose.Types.ObjectId,
        ref: 'Workflows',
        required: true,
    },
    accessToken: {
        type: String,
        required: false,  // Not required initially
    },
    tokenRequestId: {
        type: String,
        unique: true,
    },
    status: {
        type: String,
        enum: ["pending", "active", "expired"],
        default: "pending",
    },
    tokenExpiresAt: {
        type: Date,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const AiStrategySessionSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ["draft", "needs-inputs", "ready", "archived"],
        default: "draft",
        index: true,
    },
    workflowId: {
        type: mongoose.Types.ObjectId,
        ref: 'Workflows',
        required: false,
    },
    sessionData: {
        type: Schema.Types.Mixed,
        required: true,
    },
}, { timestamps: true });

const AiStrategyDraftVersionSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true,
    },
    draftId: {
        type: mongoose.Types.ObjectId,
        ref: 'AiStrategySessions',
        required: true,
        index: true,
    },
    versionId: {
        type: String,
        required: true,
        trim: true,
    },
    version: {
        type: Schema.Types.Mixed,
        required: true,
    },
    setupState: {
        type: Schema.Types.Mixed,
        required: false,
    },
}, { timestamps: true });

const UserReusableSecretSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "Users",
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    service: {
        type: String,
        enum: REUSABLE_SECRET_SERVICES,
        required: true,
        index: true,
    },
    fieldKeys: {
        type: [String],
        required: true,
        default: [],
    },
    encryptedPayload: {
        iv: { type: String, required: true },
        authTag: { type: String, required: true },
        ciphertext: { type: String, required: true },
    },
    lastUsedAt: {
        type: Date,
        required: false,
    },
}, { timestamps: true });

// Compound unique index for userId + workflowId
ZerodhaTokenSchema.index({ userId: 1, workflowId: 1 }, { unique: true });
AiStrategySessionSchema.index({ userId: 1, updatedAt: -1 });
AiStrategyDraftVersionSchema.index({ userId: 1, draftId: 1, versionId: 1 }, { unique: true });
AiStrategyDraftVersionSchema.index({ draftId: 1, createdAt: 1 });
WorkflowSchema.index({ status: 1, triggerType: 1, nextRunAt: 1 });
UserReusableSecretSchema.index({ userId: 1, service: 1, name: 1 }, { unique: true });

export const ZerodhaTokenModel = mongoose.model('ZerodhaTokens', ZerodhaTokenSchema);
export const UserModel = mongoose.model('Users', UserSchema);
export const WorkflowModel = mongoose.model('Workflows', WorkflowSchema);
export const NodesModel = mongoose.model('Nodes', NodesSchema);
export const ExecutionModel = mongoose.model('Executions', ExecutionSchema);
export const NotificationModel = mongoose.model('Notifications', NotificationSchema);
export const WorkflowExampleModel = mongoose.model('WorkflowExamples', WorkflowExampleSchema);
export const AiStrategySessionModel = mongoose.model('AiStrategySessions', AiStrategySessionSchema);
export const AiStrategyDraftVersionModel = mongoose.model('AiStrategyDraftVersions', AiStrategyDraftVersionSchema);
export const UserReusableSecretModel = mongoose.model('UserReusableSecrets', UserReusableSecretSchema);
