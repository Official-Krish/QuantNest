import { Router } from "express";
import { NotificationModel } from "@quantnest-trading/db/client";
import { authMiddleware } from "../middleware";

const notificationRouter = Router();

notificationRouter.get("/", authMiddleware, async (req, res) => {
    const userId = req.userId;

    try {
        const notifications = await NotificationModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({ message: "Notifications retrieved", notifications });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

notificationRouter.patch("/:notificationId/read", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const notificationId = req.params.notificationId;

    try {
        const notification = await NotificationModel.findOneAndUpdate(
            { _id: notificationId, userId },
            {
                $set: {
                    read: true,
                    readAt: new Date(),
                },
            },
            { new: true },
        );

        if (!notification) {
            res.status(404).json({ message: "Notification not found" });
            return;
        }

        res.status(200).json({ message: "Notification marked as read", notification });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

notificationRouter.patch("/read-all", authMiddleware, async (req, res) => {
    const userId = req.userId;

    try {
        await NotificationModel.updateMany(
            { userId, read: false },
            {
                $set: {
                    read: true,
                    readAt: new Date(),
                },
            },
        );

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

export default notificationRouter;
