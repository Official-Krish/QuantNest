import { Router } from 'express';
import { SigninSchema, SignupSchema } from "@quantnest-trading/types/metadata";
import { UserModel, WorkflowModel } from '@quantnest-trading/db/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware';

const userRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET"; ;

userRouter.post('/signup', async (req, res) => {
    const parsedData = SignupSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.status(400).json({ message: "Invalid request body" });
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
        res.status(200).json({ message: "User created", userId: user._id, token });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

userRouter.post('/signin', async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Invalid request body" });
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
        res.status(200).json({ message: "Signin successful", userId: user._id, token, avatarUrl: user.avatarUrl});
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

export default userRouter;