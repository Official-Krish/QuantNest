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
        enum: ["Action" , "Trigger"],
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
        type: mongoose.Types.ObjectId,
        ref: "Nodes",
        required: true,
    },
    data: NodeDataSchema,
    position: PositionSchema,
    Credentials: Schema.Types.Mixed,
}, {
    _id: false,
})

const WorkflowSchema = new Schema({
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
    type: {
        type: String,
        enum: ["Action" , "Trigger"],
        required: true,
    },
    Credentials: [CreedentialTypeSchema],
});

const ExecutionSchema = new Schema({
    workflowId: {
        type: mongoose.Types.ObjectId,
        ref: 'Workflows',
        required: true,
    },
    status: {
        type: String,
        enum: ["Pending", "InProgress", "Success", "Failed"],
        required: true,
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
});

export const UserModel = mongoose.model('Users', UserSchema);
export const WorkflowModel = mongoose.model('Workflows', WorkflowSchema);
export const NodesModel = mongoose.model('Nodes', NodesSchema);
export const ExecutionModel = mongoose.model('Executions', ExecutionSchema);