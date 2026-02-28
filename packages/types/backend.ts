import z from "zod";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;
const ZERODHA_API_KEY_REGEX = /^[A-Za-z0-9]{8,32}$/;
const ACCESS_TOKEN_REGEX = /^[A-Za-z0-9._-]{16,512}$/;
const LIGHTER_PRIVATE_KEY_REGEX = /^(0x)?[a-fA-F0-9]{64}$/;

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
    email: z.string().email(),
    avatarUrl: z.url(),
});

export const SigninSchema = z.object({
    username: z.string().min(3).max(30),
    password: z.string().min(8).max(100),
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
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
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
            const apiKey = String((metadata as any).apiKey || "").trim();
            const accessToken = String((metadata as any).accessToken || "").trim();
            if (!ZERODHA_API_KEY_REGEX.test(apiKey)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "apiKey"],
                    message: "Invalid Zerodha API key format.",
                });
            }
            if (accessToken.length > 0 && !ACCESS_TOKEN_REGEX.test(accessToken)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "accessToken"],
                    message: "Invalid Zerodha access token format.",
                });
            }
        }

        if (type === "groww") {
            const accessToken = String((metadata as any).accessToken || "").trim();
            if (!ACCESS_TOKEN_REGEX.test(accessToken)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "accessToken"],
                    message: "Invalid Groww access token format.",
                });
            }
        }

        if (type === "lighter") {
            const apiKey = String((metadata as any).apiKey || "").trim();
            const accountIndex = Number((metadata as any).accountIndex);
            const apiKeyIndex = Number((metadata as any).apiKeyIndex);

            if (!LIGHTER_PRIVATE_KEY_REGEX.test(apiKey)) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "apiKey"],
                    message: "Invalid Lighter API key format.",
                });
            }
            if (!Number.isInteger(accountIndex) || accountIndex < 0) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "accountIndex"],
                    message: "Lighter accountIndex must be a non-negative integer.",
                });
            }
            if (!Number.isInteger(apiKeyIndex) || apiKeyIndex < 0) {
                ctx.addIssue({
                    code: "custom",
                    path: [...path, "apiKeyIndex"],
                    message: "Lighter apiKeyIndex must be a non-negative integer.",
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
