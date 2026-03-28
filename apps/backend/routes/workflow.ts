import { Router } from 'express';
import { authMiddleware } from '../middleware';
import { CreateWorkflowSchema, UpdateWorkflowSchema, WorkflowStatusSchema } from '@quantnest-trading/types/metadata';
import { ExecutionModel, WorkflowModel } from '@quantnest-trading/db/client';
import type {
    IndicatorConditionGroup,
} from '@quantnest-trading/types';
import { createUserNotification, deriveWorkflowTriggerState, saveZerodhaToken } from '@quantnest-trading/executor-utils';
import {
    getCurrentPrice,
    type MarketCandle,
} from '@quantnest-trading/market';
import {
    isBrokerVerificationError,
    verifyBrokerCredentials,
    verifyBrokerCredentialsForNodes,
} from "../services/brokerVerification";
import { resolveNodeMetadataSecrets } from '../services/reusableSecrets';
import { collectIndicatorReferences, evaluateExpression, normalizeMarket, resolveOperandValue } from '../services/market';

const workFlowRouter = Router();


workFlowRouter.post('/preview-metrics', authMiddleware, async (req, res) => {
    try {
        const marketType = normalizeMarket(req.body?.marketType);
        const asset = typeof req.body?.asset === "string" ? req.body.asset : undefined;
        const targetPrice = typeof req.body?.targetPrice === "number" ? req.body.targetPrice : Number(req.body?.targetPrice);
        const condition = req.body?.condition;
        const expression = req.body?.expression as IndicatorConditionGroup | undefined;
        const historicalCache = new Map<string, MarketCandle[]>();
        const valueCache = new Map<string, number | null>();

        let currentPrice: number | undefined;
        let conditionMet: boolean | undefined;
        let distanceToTarget: number | null | undefined;

        if (asset) {
            currentPrice = await getCurrentPrice(asset, marketType);
        }

        if (
            typeof currentPrice === "number" &&
            Number.isFinite(targetPrice) &&
            (condition === "above" || condition === "below")
        ) {
            distanceToTarget = currentPrice - targetPrice;
            conditionMet = condition === "above"
                ? currentPrice > targetPrice
                : currentPrice < targetPrice;
        }

        const indicatorSnapshot = [];
        if (expression) {
            const refs = collectIndicatorReferences(expression);
            for (const ref of refs) {
                const value = await resolveOperandValue(
                    {
                        type: "indicator",
                        indicator: ref,
                    },
                    valueCache,
                    historicalCache,
                );

                indicatorSnapshot.push({
                    symbol: ref.symbol,
                    marketType: normalizeMarket(ref.marketType),
                    timeframe: ref.timeframe,
                    indicator: ref.indicator,
                    period: ref.params?.period,
                    value,
                });
            }

            conditionMet = await evaluateExpression(expression, valueCache, historicalCache);
        }

        const preview = {
            currentPrice,
            conditionMet,
            distanceToTarget,
            indicatorSnapshot,
            evaluatedAt: new Date().toISOString(),
        };

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
        await verifyBrokerCredentialsForNodes(data.nodes, userId);

        const workflow = await WorkflowModel.create({
            workflowName: data.workflowName,
            userId,
            nodes: data.nodes,
            edges: data.edges,
            status: "active",
            ...deriveWorkflowTriggerState(data.nodes),
        });
        const ZerodhaNode = data.nodes.find((node) => node.type === "zerodha");
        if (ZerodhaNode) {
            const resolvedMetadata = await resolveNodeMetadataSecrets({
                userId,
                service: "zerodha",
                metadata: ZerodhaNode.data?.metadata || {},
            });
            const accessToken = (resolvedMetadata as any)?.accessToken || "";
            await saveZerodhaToken(userId, workflow._id.toString(), accessToken);
        }
        res.status(200).json({ message: "Workflow created", workflowId: workflow._id });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Workflow creation failed";
        if (isBrokerVerificationError(error)) {
            await createUserNotification({
                userId,
                type: "broker_verification_failed_on_save",
                severity: "error",
                title: "Workflow save blocked by broker verification",
                message,
                workflowName: data.workflowName,
                metadata: { stage: "create" },
                dedupeKey: `workflow-save-broker-failure:create:${data.workflowName}`,
                dedupeWindowHours: 6,
            });
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
        const workflows = await WorkflowModel.find({ userId });
        res.status(200).json({ message: "Workflows retrieved", workflows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
    }
});

workFlowRouter.patch('/:workflowId/status', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const workflowId = req.params.workflowId;
    const parsedStatus = WorkflowStatusSchema.safeParse(req.body);

    if (!parsedStatus.success) {
        res.status(400).json({ message: "Invalid workflow status" });
        return;
    }

    try {
        const existingWorkflow = await WorkflowModel.findOne({ _id: workflowId, userId });
        if (!existingWorkflow) {
            res.status(404).json({ message: "Workflow not found" });
            return;
        }

        const workflow = await WorkflowModel.findOneAndUpdate(
            { _id: workflowId, userId },
            {
                $set: {
                    status: parsedStatus.data.status,
                    ...(parsedStatus.data.status === "active"
                        ? deriveWorkflowTriggerState(existingWorkflow.nodes as any)
                        : {}),
                },
            },
            { new: true }
        );

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
        const workflowId = req.params.workflowId;
        await verifyBrokerCredentialsForNodes(data.nodes, userId);

        const workflow = await WorkflowModel.findOneAndUpdate(
            { _id: workflowId, userId },
            {
                $set: {
                    nodes: data.nodes,
                    edges: data.edges,
                    updatedAt: new Date(),
                    ...deriveWorkflowTriggerState(data.nodes),
                },
            },
            { new: true }
        );
        if (!workflow) {
            res.status(404).json({ message: "Workflow not found" });
            return;
        }
        res.status(200).json({ message: "Workflow updated", workflow });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (isBrokerVerificationError(error)) {
            if (userId) {
                await createUserNotification({
                    userId,
                    workflowId: String(req.params.workflowId),
                    type: "broker_verification_failed_on_save",
                    severity: "error",
                    title: "Workflow update blocked by broker verification",
                    message,
                    metadata: { stage: "update" },
                    dedupeKey: `workflow-save-broker-failure:update:${req.params.workflowId}`,
                    dedupeWindowHours: 6,
                });
            }
            res.status(400).json({ message });
            return;
        }
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
