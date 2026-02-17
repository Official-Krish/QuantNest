import z from "zod";

export const SignupSchema = z.object({
    username: z.string().min(3).max(30),
    password: z.string().min(8).max(100),
    email: z.email(),
    avatarUrl: z.url(),
});

export const SigninSchema = z.object({
    username: z.string().min(3).max(30),
    password: z.string().min(8).max(100),
});

export const CreateWorkflowSchema = z.object({
    workflowName: z.string().min(3).max(100),
    nodes: z.array(z.object({
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
    })),
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        sourceHandle: z.string().optional(),
        targetHandle: z.string().optional(),
    })),
})

export const UpdateWorkflowSchema = z.object({
    nodes: z.array(z.object({
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
    })),
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        sourceHandle: z.string().optional(),
        targetHandle: z.string().optional(),
    })),
})
