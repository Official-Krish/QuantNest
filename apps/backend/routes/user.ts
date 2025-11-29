import useRouter  from 'express';
import { SigninSchema, SignupSchema } from "@n8n-trading/types/metadata";
import { UserModel } from '@n8n-trading/db/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware';

const userRouter = useRouter();
const JWT_SECRET = process.env.JWT_SECRET || 'JWT_SECRET_KEY';

userRouter.post('/signup', async (req, res) => {
    const parsedData = SignupSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.status(400).json({ message: "Invalid request body" });
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        const user = await UserModel.create({
            username: parsedData.data.username,
            password: hashedPassword,
        })
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1w' });
        res.status(200).json({ message: "User created", userId: user._id, token });
    } catch (error) {
        res.status(500).json({ message: "User already exists" });
    }
});

userRouter.post('/signin', (req, res) => {
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
        res.status(200).json({ message: "Signin successful", userId: user._id, token });
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
        res.status(200).json({ message: "User profile retrieved", user });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

export default userRouter;