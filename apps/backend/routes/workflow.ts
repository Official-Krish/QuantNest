import useRouter  from 'express';
import { authMiddleware } from '../middleware';
import { CreateWorkflowSchema, UpdateWorkflowSchema } from '@n8n-trading/types/metadata';
import { ExecutionModel, WorkflowModel } from '@n8n-trading/db/client';

const workFlowRouter = useRouter();

workFlowRouter.post('/', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const {success, data} = CreateWorkflowSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({ message: "Invalid request body" });
        return;
    }
    try {
        const workflow = await WorkflowModel.create({
            userId,
            nodes: data.nodes,
            edges: data.edges
        });
        res.status(200).json({ message: "Workflow created", workflowId: workflow._id });
    } catch (error) {
        res.status(411).json({ message: "Workflow creation failed" });
    }
});

workFlowRouter.put('/:workflowId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { success, data } = UpdateWorkflowSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({ message: "Invalid request body" });
        return;
    }
    try {
        const workflowId = req.params.workflowId;
        const workflow = await WorkflowModel.findOneAndUpdate(
            { _id: workflowId, userId },
            { $set: { nodes: data.nodes, edges: data.edges } },
            { new: true }
        );
        if (!workflow) {
            res.status(404).json({ message: "Workflow not found" });
            return;
        }
        res.status(200).json({ message: "Workflow updated", workflow });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

workFlowRouter.get('/:workflowId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const workflowId = req.params.workflowId;

    try {
        const workflow = await WorkflowModel.findOne({ _id: workflowId, userId });
        if (!workflow) {
            res.status(404).json({ message: "Workflow not found" });
            return;
        }
        res.status(200).json({ message: "Workflow retrieved", workflow });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

workFlowRouter.get('/executions/:workflowId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const workflowId = req.params.workflowId;

    try {
        const execution = await ExecutionModel.findOne({ workflowId, userId });
        if (!execution) {
            res.status(404).json({ message: "Execution not found" });
            return;
        }
        res.status(200).json({ message: "Execution retrieved", execution });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

workFlowRouter.get('/getAll', authMiddleware, async (req, res) => {
    const userId = req.userId;

    try {
        const workflows = await WorkflowModel.find({ userId });
        res.status(200).json({ message: "Workflows retrieved", workflows });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

export default workFlowRouter;