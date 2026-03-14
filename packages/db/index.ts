import mongoose , { Schema } from 'mongoose';

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

// Compound unique index for userId + workflowId
ZerodhaTokenSchema.index({ userId: 1, workflowId: 1 }, { unique: true });

export const ZerodhaTokenModel = mongoose.model('ZerodhaTokens', ZerodhaTokenSchema);
export const UserModel = mongoose.model('Users', UserSchema);
export const WorkflowModel = mongoose.model('Workflows', WorkflowSchema);
export const NodesModel = mongoose.model('Nodes', NodesSchema);
export const ExecutionModel = mongoose.model('Executions', ExecutionSchema);
export const NotificationModel = mongoose.model('Notifications', NotificationSchema);
export const WorkflowExampleModel = mongoose.model('WorkflowExamples', WorkflowExampleSchema);
