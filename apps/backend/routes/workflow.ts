import { Router } from 'express';
import { authMiddleware } from '../middleware';
import { CreateWorkflowSchema, UpdateWorkflowSchema } from '@quantnest-trading/types/metadata';
import { ExecutionModel, WorkflowModel } from '@quantnest-trading/db/client';
import { saveZerodhaToken } from '@quantnest-trading/executor-utils';

const workFlowRouter = Router();

workFlowRouter.post('/', authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const {success, data} = CreateWorkflowSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({ message: "Invalid request body" });
        return;
    }
    try {
        const workflow = await WorkflowModel.create({
            workflowName: data.workflowName,
            userId,
            nodes: data.nodes,
            edges: data.edges
        });
        const ZerodhaNode = data.nodes.find((node) => node.type === "zerodha");
        if (ZerodhaNode) {
            const accessToken = ZerodhaNode.data?.metadata.accessToken || "";
            await saveZerodhaToken(userId, workflow._id.toString(), accessToken);
        }
        res.status(200).json({ message: "Workflow created", workflowId: workflow._id });
    } catch (error) {
        console.error(error);
        res.status(411).json({ message: "Workflow creation failed" });
    }
});

workFlowRouter.get('/getAll', authMiddleware, async (req, res) => {
    const userId = req.userId;

    try {
        const workflows = await WorkflowModel.find({ userId });
        res.status(200).json({ message: "Workflows retrieved", workflows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
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
        const executions = await ExecutionModel.find({ workflowId, userId }).sort({ startTime: -1 });
        res.status(200).json({ message: "Executions retrieved", executions });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

workFlowRouter.delete('/:workflowId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const workflowId = req.params.workflowId;

    try {
        const workflow = await WorkflowModel.findOneAndDelete({ _id: workflowId, userId });
        if (!workflow) {
            res.status(404).json({ message: "Workflow not found" });
            return;
        }
        res.status(200).json({ message: "Workflow deleted" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

export default workFlowRouter;