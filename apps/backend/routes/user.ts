import { Router } from 'express';
import {
    CreateReusableSecretSchema,
    SigninSchema,
    SignupSchema,
    UpdateReusableSecretSchema,
    UpdateUserProfileSchema,
} from "@quantnest-trading/types/metadata";
import { ExecutionModel, UserModel, WorkflowModel, ZerodhaTokenModel } from '@quantnest-trading/db/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware';
import type { CookieOptions } from 'express';
import { createEmailVerificationToken, getEmailVerificationExpiry, sendEmailVerificationEmail } from '../services/emailVerification';
import { uploadAvatarToGcp } from '../services/avatarUpload';
import { getJwtSecret } from '../utils/security';
import multer from 'multer';
import axios from 'axios';
import {
    createReusableSecret,
    deleteReusableSecret,
    getReusableSecretForEdit,
    listReusableSecrets,
    updateReusableSecret,
} from '../services/reusableSecrets';

const userRouter = Router();
const JWT_SECRET = getJwtSecret();
const upload = multer({ storage: multer.memoryStorage() });

const cookieName = process.env.AUTH_COOKIE_NAME || "quantnest_auth";
const isProduction = process.env.NODE_ENV === "production";

const INTEGRATION_CATALOG = [
    { key: "zerodha", name: "Zerodha", description: "Broker execution accounts linked through workflow credentials.", nodeType: "zerodha" },
    { key: "groww", name: "Groww", description: "Retail brokerage connections used across active workflows.", nodeType: "groww" },
    { key: "gmail", name: "Gmail", description: "Email delivery accounts referenced by workflow actions.", nodeType: "gmail" },
    { key: "slack", name: "Slack", description: "Direct-message destinations configured for workflow notifications.", nodeType: "slack" },
    { key: "telegram", name: "Telegram", description: "Bot destinations configured for workflow notifications.", nodeType: "telegram" },
    { key: "whatsapp", name: "WhatsApp", description: "Messaging destinations configured for urgent notifications.", nodeType: "whatsapp" },
    { key: "notion", name: "Notion", description: "Workspace destinations used for reports and journaling.", nodeType: "notion-daily-report" },
    { key: "discord", name: "Discord", description: "Webhook destinations used for community and bot alerts.", nodeType: "discord" },
] as const;

function buildDefaultDisplayName(username: string) {
    return username
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

async function buildIntegrationSummaries(userId: string) {
    const zerodhaActiveTokens = await ZerodhaTokenModel.countDocuments({ userId, status: "active" });

    const summaries = await Promise.all(
        INTEGRATION_CATALOG.map(async (integration) => {
            const linkedWorkflows = await WorkflowModel.countDocuments({
                userId,
                "nodes.type": integration.nodeType,
            });

            const connectedAccounts = integration.key === "zerodha" ? zerodhaActiveTokens : undefined;
            const isConnected = linkedWorkflows > 0 || (connectedAccounts ?? 0) > 0;

            return {
                key: integration.key,
                name: integration.name,
                description: integration.description,
                status: isConnected ? "connected" : "available",
                linkedWorkflows,
                connectedAccounts,
                managementMode: "workflow-scoped" as const,
            };
        }),
    );

    return summaries;
}

function getAuthCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: isProduction || process.env.COOKIE_SECURE === "true",
        sameSite: (process.env.COOKIE_SAMESITE as "lax" | "strict" | "none" | undefined)
            || (isProduction ? "none" : "lax"),
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
    };
}

userRouter.post('/signup', async (req, res) => {
    const parsedData = SignupSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.status(400).json({ message: "Invalid request body", issues: parsedData.error.issues });
        return;
    }

    try {
        const username = parsedData.data.username.trim();
        const email = parsedData.data.email.trim().toLowerCase();

        const existingUser = await UserModel.findOne({
            $or: [
                { username },
                { email },
            ],
        });
        if (existingUser) {
            res.status(409).json({ message: existingUser.email === email ? "Email already exists" : "User already exists" });
            return;
        }

        const emailVerificationToken = createEmailVerificationToken();
        const emailVerificationExpiresAt = getEmailVerificationExpiry();
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        const user = await UserModel.create({
            username,
            password: hashedPassword,
            email,
            emailVerified: false,
            emailVerificationToken,
            emailVerificationExpiresAt,
            createdAt: new Date(),
        });

        try {
            await sendEmailVerificationEmail({
                email: user.email,
                username: user.username,
                token: emailVerificationToken,
            });
        } catch (emailError) {
            await UserModel.deleteOne({ _id: user._id });
            throw emailError;
        }

        res.status(200).json({
            message: "Account created. Please verify your email before signing in.",
            requiresEmailVerification: true,
            email: user.email,
        });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

userRouter.post('/signin', async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Invalid request body", issues: parsedData.error.issues });
        return;
    }
    UserModel.findOne({ username: parsedData.data.username.trim() }).then(async (user) => {
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        if (user.emailVerified === false) {
            res.status(403).json({
                message: "Email not verified. Please verify your email before signing in.",
                code: "EMAIL_NOT_VERIFIED",
                email: user.email,
            });
            return;
        }
        const isPasswordValid = await bcrypt.compare(parsedData.data.password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1w' });
        res.cookie(cookieName, token, getAuthCookieOptions());
        res.status(200).json({ message: "Signin successful", userId: user._id, avatarUrl: user.avatarUrl});
    }).catch((error) => {
        res.status(500).json({ message: "Internal server error", error });
    });

});

userRouter.get('/verify-email', async (req, res) => {
    const token = String(req.query.token || "").trim();

    if (!token) {
        res.status(400).json({ message: "Verification token is required" });
        return;
    }

    try {
        const user = await UserModel.findOne({
            emailVerificationToken: token,
            emailVerificationExpiresAt: { $gt: new Date() },
        });

        if (!user) {
            res.status(400).json({ message: "Verification link is invalid or expired" });
            return;
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpiresAt = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.post('/resend-verification', async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
    }

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            res.status(200).json({ message: "If the email exists, a verification link has been sent." });
            return;
        }
        if (user.emailVerified !== false) {
            res.status(200).json({ message: "Email is already verified." });
            return;
        }

        user.emailVerificationToken = createEmailVerificationToken();
        user.emailVerificationExpiresAt = getEmailVerificationExpiry();
        await user.save();

        await sendEmailVerificationEmail({
            email: user.email,
            username: user.username,
            token: user.emailVerificationToken,
        });

        res.status(200).json({ message: "Verification email sent." });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.get('/secrets', authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const service = typeof req.query.service === "string" ? req.query.service : undefined;
        const secrets = await listReusableSecrets(userId, service as any);
        res.status(200).json({ message: "Reusable secrets retrieved", secrets });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.get('/secrets/:secretId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const secretId = String(req.params.secretId || "");
        const secret = await getReusableSecretForEdit(userId, secretId);
        if (!secret) {
            res.status(404).json({ message: "Secret not found" });
            return;
        }
        res.status(200).json({ message: "Reusable secret retrieved", secret });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.post('/secrets', authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const parsed = CreateReusableSecretSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
        return;
    }

    try {
        const secret = await createReusableSecret({
            userId,
            name: parsed.data.name,
            service: parsed.data.service,
            payload: parsed.data.payload,
        });
        res.status(200).json({ message: "Reusable secret created", secret });
    } catch (error: any) {
        if (error?.code === 11000) {
            res.status(409).json({ message: "A secret with this name already exists for that service." });
            return;
        }
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.patch('/secrets/:secretId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const parsed = UpdateReusableSecretSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
        return;
    }

    try {
        const secretId = String(req.params.secretId || "");
        const secret = await updateReusableSecret({
            userId,
            secretId,
            name: parsed.data.name,
            payload: parsed.data.payload,
        });
        if (!secret) {
            res.status(404).json({ message: "Secret not found" });
            return;
        }
        res.status(200).json({ message: "Reusable secret updated", secret });
    } catch (error: any) {
        if (error?.code === 11000) {
            res.status(409).json({ message: "A secret with this name already exists for that service." });
            return;
        }
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.delete('/secrets/:secretId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const secretId = String(req.params.secretId || "");
        const deleted = await deleteReusableSecret(userId, secretId);
        if (!deleted.deleted) {
            res.status(404).json({ message: "Secret not found" });
            return;
        }
        res.status(200).json({
            message: "Reusable secret deleted",
            pausedWorkflowCount: deleted.pausedWorkflowCount,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.post('/telegram/chats', authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const botToken = String(req.body?.botToken || "").trim();
    if (!botToken) {
        res.status(400).json({ message: "Telegram bot token is required" });
        return;
    }

    try {
        const telegramRes = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`, {
            timeout: 10000,
        });

        if (!telegramRes.data?.ok) {
            res.status(400).json({ message: "Unable to fetch Telegram chats from this bot token" });
            return;
        }

        const chatsById = new Map<string, {
            id: string;
            title: string;
            username?: string;
            type: "private" | "group" | "supergroup" | "channel" | "unknown";
            lastMessageAt?: string;
        }>();

        for (const update of telegramRes.data?.result || []) {
            const chat =
                update?.message?.chat ||
                update?.edited_message?.chat ||
                update?.callback_query?.message?.chat ||
                update?.channel_post?.chat ||
                update?.my_chat_member?.chat;

            if (!chat?.id) continue;

            const type = ["private", "group", "supergroup", "channel"].includes(chat.type)
                ? chat.type
                : "unknown";
            const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || String(chat.id);
            const lastMessageAt = update?.message?.date
                ? new Date(update.message.date * 1000).toISOString()
                : update?.edited_message?.date
                    ? new Date(update.edited_message.date * 1000).toISOString()
                    : update?.channel_post?.date
                        ? new Date(update.channel_post.date * 1000).toISOString()
                        : undefined;

            chatsById.set(String(chat.id), {
                id: String(chat.id),
                title,
                username: chat.username,
                type,
                lastMessageAt,
            });
        }

        const chats = Array.from(chatsById.values()).sort((a, b) => {
            return (b.lastMessageAt || "").localeCompare(a.lastMessageAt || "");
        });

        res.status(200).json({ message: "Telegram chats retrieved", chats });
    } catch (error: any) {
        const description = error?.response?.data?.description;
        res.status(500).json({
            message: description || "Failed to fetch Telegram chats. Ask the user to start the bot and send it a message first.",
        });
    }
});

userRouter.get('/profile', authMiddleware, async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalWorkflows, totalExecutions, executionsThisMonth, integrations] = await Promise.all([
            WorkflowModel.countDocuments({ userId }),
            ExecutionModel.countDocuments({ userId }),
            ExecutionModel.countDocuments({ userId, startTime: { $gte: startOfMonth } }),
            buildIntegrationSummaries(userId),
        ]);

        res.status(200).json({
            message: "User profile retrieved",
            username: user.username,
            displayName: user.displayName?.trim() || buildDefaultDisplayName(user.username),
            email: user.email,
            avatarUrl: user.avatarUrl,
            memberSince: user.createdAt.toDateString(),
            accountStatus: user.emailVerified === false ? "Pending verification" : "Active",
            preferences: {
                defaultMarket: user.preferences?.defaultMarket || "Indian",
                defaultBroker: user.preferences?.defaultBroker || "Zerodha",
                theme: user.preferences?.theme || "Dark",
            },
            notifications: {
                workflowAlerts: user.notifications?.workflowAlerts ?? true,
            },
            stats: {
                totalWorkflows,
                totalExecutions,
                executionsThisMonth,
                connectedIntegrations: integrations.filter((item) => item.status === "connected").length,
            },
            integrations,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.patch('/profile', authMiddleware, async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const parsedData = UpdateUserProfileSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.status(400).json({ message: "Invalid request body", issues: parsedData.error.issues });
        return;
    }

    try {
        const user = await UserModel.findByIdAndUpdate(
            userId,
            {
                displayName: parsedData.data.displayName,
                preferences: parsedData.data.preferences,
                notifications: parsedData.data.notifications,
            },
            { new: true },
        );

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({
            message: "Profile updated",
            displayName: user.displayName?.trim() || buildDefaultDisplayName(user.username),
            preferences: {
                defaultMarket: user.preferences?.defaultMarket || "Indian",
                defaultBroker: user.preferences?.defaultBroker || "Zerodha",
                theme: user.preferences?.theme || "Dark",
            },
            notifications: {
                workflowAlerts: user.notifications?.workflowAlerts ?? true,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.post("/update-avatar", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { avatarUrl } = req.body;

    if (typeof avatarUrl !== 'string' || avatarUrl.trim().length === 0) {
        res.status(400).json({ message: "Invalid avatar URL" });
        return;
    }

    try {
        const user = await UserModel.findByIdAndUpdate(userId, { avatarUrl }, { new: true });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ message: "Avatar updated", avatarUrl: user.avatarUrl });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.post("/avatar-upload", authMiddleware, upload.single("image"), async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    if (!req.file) {
        res.status(400).send('Missing file');
        return;
    }

    try {
        const uploadResult = await uploadAvatarToGcp({
            userId,
            mimeType: req.file.mimetype,
            fileBuffer: req.file.buffer,
        });

        if (uploadResult.error) {
            res.status(503).json({ message: uploadResult.message });
            return;
        }

        const { avatarUrl } = uploadResult;
        if (!avatarUrl) {
            res.status(500).json({ message: "Avatar URL not returned from upload service" });
            return;
        }

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { avatarUrl: avatarUrl },
            { new: true },
        );

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({
            message: "Avatar uploaded",
            avatarUrl: user.avatarUrl
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Avatar upload failed";
        res.status(500).json({ message });
    }
});

userRouter.get('/verify', authMiddleware, (req, res) => {
    res.status(200).json({ message: "Token is valid" });
});

userRouter.post('/signout', (_req, res) => {
    res.clearCookie(cookieName, {
        httpOnly: true,
        secure: isProduction || process.env.COOKIE_SECURE === "true",
        sameSite: (process.env.COOKIE_SAMESITE as "lax" | "strict" | "none" | undefined)
            || (isProduction ? "none" : "lax"),
        path: "/",
        ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
    });
    res.status(200).json({ message: "Signout successful" });
});

export default userRouter;
