import express from "express";
import { saveZerodhaToken, checkTokenStatus, deleteZerodhaToken } from "@quantnest-trading/executor-utils";
import { authMiddleware } from "../middleware";

const ZerodhaTokenRouter = express.Router();
ZerodhaTokenRouter.post("/create", authMiddleware, async (req, res) => {
    try {
        const { userId, workflowId, accessToken } = req.body;

        if (!userId || !workflowId || !accessToken) {
            return res.status(400).json({
                success: false,
                message: "Missing userId, workflowId, or accessToken"
            });
        }

        await saveZerodhaToken(userId, workflowId, accessToken);
        
        const tokenStatus = await checkTokenStatus(userId, workflowId);
        
        res.json({
            success: true,
            message: "Access token saved successfully",
            tokenStatus,
        });
    } catch (error: any) {
        console.error("Error saving token:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save token",
            error: error.message
        });
    }
});

ZerodhaTokenRouter.put("/update", authMiddleware, async (req, res) => {
    try {
        const { workflowId, accessToken } = req.body;
        const userId = req.userId;

        if (!userId || !workflowId || !accessToken) {
            return res.status(400).json({
                success: false,
                message: "Missing userId, workflowId, or accessToken"
            });
        }

        await saveZerodhaToken(userId, workflowId, accessToken);
        
        const tokenStatus = await checkTokenStatus(userId, workflowId);
        
        res.json({
            success: true,
            message: "Access token updated successfully",
            tokenStatus,
        });
    } catch (error: any) {
        console.error("Error updating token:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update token",
            error: error.message
        });
    }
});

ZerodhaTokenRouter.get("/status/:workflowId", authMiddleware,  async (req, res) => {
    try {
        const { workflowId } = req.params;
        const userId = req.userId;

        if (!userId || !workflowId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId or workflowId"
            });
        }

        const tokenStatus = await checkTokenStatus(userId, workflowId);
        
        res.json({
            success: true,
            tokenStatus,
        });
    } catch (error: any) {
        console.error("Error checking token:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check token status",
            error: error.message
        });
    }
});


ZerodhaTokenRouter.delete("/:workflowId", authMiddleware, async (req, res) => {
    try {
        const {workflowId } = req.params;
        const userId = req.userId;

        if (!userId || !workflowId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId or workflowId"
            });
        }

        await deleteZerodhaToken(userId, workflowId);
        
        res.json({
            success: true,
            message: "Token deleted successfully"
        });
    } catch (error: any) {
        console.error("Error deleting token:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete token",
            error: error.message
        });
    }
});


export default ZerodhaTokenRouter;
