import mongoose , { Schema } from 'mongoose';

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

// Compound unique index for userId + workflowId
ZerodhaTokenSchema.index({ userId: 1, workflowId: 1 }, { unique: true });
AiStrategySessionSchema.index({ userId: 1, updatedAt: -1 });

export const ZerodhaTokenModel = mongoose.model('ZerodhaTokens', ZerodhaTokenSchema);
export const UserModel = mongoose.model('Users', UserSchema);
export const WorkflowModel = mongoose.model('Workflows', WorkflowSchema);
export const NodesModel = mongoose.model('Nodes', NodesSchema);
export const ExecutionModel = mongoose.model('Executions', ExecutionSchema);
export const NotificationModel = mongoose.model('Notifications', NotificationSchema);
export const WorkflowExampleModel = mongoose.model('WorkflowExamples', WorkflowExampleSchema);
export const AiStrategySessionModel = mongoose.model('AiStrategySessions', AiStrategySessionSchema);
