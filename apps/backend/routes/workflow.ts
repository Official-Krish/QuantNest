import { Router } from 'express';
import { authMiddleware } from '../middleware';
import { CreateWorkflowSchema, UpdateWorkflowSchema, WorkflowStatusSchema } from '@quantnest-trading/types/metadata';
import { createUserNotification } from '@quantnest-trading/executor-utils';
import {
    isBrokerVerificationError,
    verifyBrokerCredentials,
} from "../services/brokerVerification";
import { getGoogleSheetsServiceAccountEmail, verifyGoogleSheetAccess } from "../services/googleSheets";
import { resolveNodeMetadataSecrets } from '../services/reusableSecrets';
import { buildWorkflowPreview } from '../services/workflowPreview';
import {
    createWorkflowForUser,
    deleteWorkflowForUser,
    getWorkflowForUser,
    handleWorkflowBrokerVerificationFailure,
    listExecutionsForWorkflow,
    listWorkflowsForUser,
    updateWorkflowForUser,
    updateWorkflowStatusForUser,
} from '../services/workflowCrud';

const workFlowRouter = Router();


workFlowRouter.post('/preview-metrics', authMiddleware, async (req, res) => {
    try {
        const preview = await buildWorkflowPreview(req.body);

        res.status(200).json({
            message: "Workflow preview generated",
            preview,
        });
    } catch (error: any) {
        res.status(400).json({
            message: error?.message || "Failed to generate workflow preview",
        });
    }
});

workFlowRouter.post('/verify-broker-credentials', authMiddleware, async (req, res) => {
    const brokerType = String(req.body?.brokerType || "").toLowerCase();
    const apiKey = String(req.body?.apiKey || "");
    const accessToken = String(req.body?.accessToken || "");
    const accountIndex = Number(req.body?.accountIndex);
    const apiKeyIndex = Number(req.body?.apiKeyIndex);

    try {
        if (!["zerodha", "groww", "lighter"].includes(brokerType)) {
            res.status(400).json({ success: false, message: "Unsupported broker type" });
            return;
        }
        const secretId = String(req.body?.secretId || "").trim();
        const service = brokerType as "zerodha" | "groww" | "lighter";
        const resolved = secretId
            ? await resolveNodeMetadataSecrets({ userId: req.userId!, service, metadata: { secretId } })
            : null;

        await verifyBrokerCredentials({
            brokerType: brokerType as "zerodha" | "groww" | "lighter",
            apiKey: String((resolved as any)?.apiKey || apiKey),
            accessToken: String((resolved as any)?.accessToken || accessToken),
            accountIndex: Number((resolved as any)?.accountIndex ?? accountIndex),
            apiKeyIndex: Number((resolved as any)?.apiKeyIndex ?? apiKeyIndex),
        });
        res.status(200).json({ success: true, message: "Credentials verified" });
    } catch (error: any) {
        if (req.userId) {
            await createUserNotification({
                userId: req.userId,
                type: "broker_credentials_invalid",
                severity: "error",
                title: "Broker credential verification failed",
                message: error?.message || "Credential verification failed",
                metadata: { brokerType },
                dedupeKey: `broker-verify:${brokerType}:${apiKey || accessToken || accountIndex || "unknown"}`,
                dedupeWindowHours: 6,
            });
        }
        res.status(400).json({
            success: false,
            message: error?.message || "Credential verification failed",
        });
    }
});

workFlowRouter.post('/verify-google-sheets', authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }

    try {
        const sheetUrl = String(req.body?.sheetUrl || "").trim();
        const verification = await verifyGoogleSheetAccess({
            sheetUrl,
        });

        res.status(200).json({
            success: true,
            message: "Google Sheet verified",
            sheet: verification,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error?.message || "Google Sheet verification failed",
            serviceAccountEmail: getGoogleSheetsServiceAccountEmail(),
        });
    }
});

workFlowRouter.get('/google-sheets/service-account', authMiddleware, async (req, res) => {
    const serviceAccountEmail = getGoogleSheetsServiceAccountEmail();
    if (!serviceAccountEmail) {
        res.status(500).json({
            success: false,
            message: "Google Sheets service account is not configured on backend.",
        });
        return;
    }

    res.status(200).json({
        success: true,
        serviceAccountEmail,
    });
});

workFlowRouter.post('/', authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const parsedCreate = CreateWorkflowSchema.safeParse(req.body);
    if (!parsedCreate.success) {
        res.status(400).json({ message: "Invalid request body", issues: parsedCreate.error.issues });
        return;
    }
    const { data } = parsedCreate;
    try {
        const workflow = await createWorkflowForUser({
            userId,
            workflowName: data.workflowName,
            nodes: data.nodes,
            edges: data.edges,
        });
        res.status(200).json({ message: "Workflow created", workflowId: workflow._id });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Workflow creation failed";
        if (await handleWorkflowBrokerVerificationFailure({
            userId,
            workflowName: data.workflowName,
            stage: "create",
            error,
        })) {
            res.status(400).json({ message });
            return;
        }
        console.error(error);
        res.status(411).json({ message: "Workflow creation failed" });
    }
});

workFlowRouter.get('/getAll', authMiddleware, async (req, res) => {
    const userId = req.userId;

    try {
        const workflows = await listWorkflowsForUser(userId);
        res.status(200).json({ message: "Workflows retrieved", workflows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
    }
});

workFlowRouter.patch('/:workflowId/status', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const workflowId = String(req.params.workflowId);
    const parsedStatus = WorkflowStatusSchema.safeParse(req.body);

    if (!parsedStatus.success) {
        res.status(400).json({ message: "Invalid workflow status" });
        return;
    }

    try {
        const workflow = await updateWorkflowStatusForUser({
            userId,
            workflowId,
            status: parsedStatus.data.status,
        });
        if (!workflow) {
            res.status(404).json({ message: "Workflow not found" });
            return;
        }

        res.status(200).json({
            message: `Workflow ${parsedStatus.data.status === "paused" ? "paused" : "resumed"}`,
            workflow,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

workFlowRouter.put('/:workflowId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const parsedUpdate = UpdateWorkflowSchema.safeParse(req.body);
    if (!parsedUpdate.success) {
        res.status(400).json({ message: "Invalid request body", issues: parsedUpdate.error.issues });
        return;
    }
    const { data } = parsedUpdate;
    try {
        const workflowId = String(req.params.workflowId);
        const workflow = await updateWorkflowForUser({
            userId,
            workflowId,
            nodes: data.nodes,
            edges: data.edges,
        });
        if (!workflow) {
            res.status(404).json({ message: "Workflow not found" });
            return;
        }
        res.status(200).json({ message: "Workflow updated", workflow });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (await handleWorkflowBrokerVerificationFailure({
            userId,
            workflowId: String(req.params.workflowId),
            stage: "update",
            error,
        })) {
            res.status(400).json({ message });
            return;
        }
        res.status(500).json({ message: "Internal server error", error });
    }
});

workFlowRouter.get('/:workflowId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const workflowId = String(req.params.workflowId);

    try {
        const workflow = await getWorkflowForUser(userId, workflowId);
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
    const workflowId = String(req.params.workflowId);

    try {
        const executions = await listExecutionsForWorkflow(userId, workflowId);
        res.status(200).json({ message: "Executions retrieved", executions });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

workFlowRouter.delete('/:workflowId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const workflowId = String(req.params.workflowId);

    try {
        const workflow = await deleteWorkflowForUser(userId, workflowId);
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
