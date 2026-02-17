import mongoose , { Schema } from 'mongoose';

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    }, 
    avatarUrl: {
        type: String,
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
