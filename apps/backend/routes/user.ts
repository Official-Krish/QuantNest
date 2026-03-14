import { Router } from 'express';
import { SigninSchema, SignupSchema } from "@quantnest-trading/types/metadata";
import { UserModel, WorkflowModel } from '@quantnest-trading/db/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware';
import type { CookieOptions } from 'express';
import { createEmailVerificationToken, getEmailVerificationExpiry, sendEmailVerificationEmail } from '../services/emailVerification';
import { getJwtSecret, isAllowedAvatarUrl } from '../utils/security';

const userRouter = Router();
const JWT_SECRET = getJwtSecret();

const cookieName = process.env.AUTH_COOKIE_NAME || "quantnest_auth";
const isProduction = process.env.NODE_ENV === "production";

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
            avatarUrl: parsedData.data.avatarUrl,
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

userRouter.get('/profile', authMiddleware, async (req, res) => {
    const userId = req.userId;

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const totalWorkflows = await WorkflowModel.countDocuments({ userId: userId });
        res.status(200).json({ message: "User profile retrieved", username: user.username, email: user.email, avatarUrl: user.avatarUrl, totalWorkflows, memberSince: user.createdAt.toDateString() });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

userRouter.post("/update-avatar", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { avatarUrl } = req.body;

    if (typeof avatarUrl !== 'string' || !isAllowedAvatarUrl(avatarUrl)) {
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
