import { Router } from 'express';
import { SigninSchema, SignupSchema } from "@quantnest-trading/types/metadata";
import { UserModel, WorkflowModel } from '@quantnest-trading/db/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware';
import type { CookieOptions } from 'express';

const userRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET"; ;

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
        const checkUniqueness = await UserModel.findOne({ username: parsedData.data.username });
        if (checkUniqueness) {
            res.status(409).json({ message: "User already exists" });
            return;
        }
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        const user = await UserModel.create({
            username: parsedData.data.username,
            password: hashedPassword,
            email: parsedData.data.email,
            avatarUrl: parsedData.data.avatarUrl,
            createdAt: new Date(),
        })
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1w' });
        res.cookie(cookieName, token, getAuthCookieOptions());
        res.status(200).json({ message: "User created", userId: user._id, avatarUrl: user.avatarUrl });
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
    UserModel.findOne({ username: parsedData.data.username }).then(async (user) => {
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
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

    if (typeof avatarUrl !== 'string') {
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
