import { ZerodhaTokenModel } from "@quantnest-trading/db/client";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface TokenStatus {
    hasValidToken: boolean;
    needsToken: boolean;
    expiresAt?: Date;
    message: string;
    tokenRequestId?: string;
}

/**
 * Get Zerodha token for a specific workflow
 */
export async function getZerodhaToken(userId: string, workflowId: string): Promise<string | null> {
    try {
        const record = await ZerodhaTokenModel.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            workflowId: new mongoose.Types.ObjectId(workflowId)
        });

        if (!record) {
            return null;
        }

        if (record.tokenExpiresAt && new Date() > record.tokenExpiresAt) {
            await ZerodhaTokenModel.updateOne(
                { _id: record._id },
                { status: "expired" }
            );
            return null;
        }

        if (record.status !== "active" || !record.accessToken) {
            return null;
        }

        return record.accessToken;
    } catch (error) {
        console.error("Error retrieving Zerodha token:", error);
        return null;
    }
}

/**
 * Create a token request for a workflow
 * Returns a unique request ID to be used for polling/webhook
 */
export async function createTokenRequest(userId: string, workflowId: string): Promise<string> {
    try {
        const tokenRequestId = uuidv4();
        
        const existingRecord = await ZerodhaTokenModel.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            workflowId: new mongoose.Types.ObjectId(workflowId)
        });
        if (existingRecord) {
            existingRecord.tokenRequestId = tokenRequestId;
            existingRecord.status = "pending";
            existingRecord.accessToken = undefined;
            await existingRecord.save();
        } else {
            await ZerodhaTokenModel.create({
                userId: new mongoose.Types.ObjectId(userId),
                workflowId: new mongoose.Types.ObjectId(workflowId),
                tokenRequestId,
                status: "pending",
            });
        }

        return tokenRequestId;
    } catch (error) {
        console.error("Error creating token request:", error);
        throw error;
    }
}

/**
 * Save Zerodha token for a specific workflow
 */
export async function saveZerodhaToken(
    userId: string,
    workflowId: string,
    accessToken: string
): Promise<void> {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        await ZerodhaTokenModel.updateOne(
            {
                userId: new mongoose.Types.ObjectId(userId),
                workflowId: new mongoose.Types.ObjectId(workflowId)
            },
            {
                userId: new mongoose.Types.ObjectId(userId),
                workflowId: new mongoose.Types.ObjectId(workflowId),
                accessToken,
                tokenExpiresAt: tomorrow,
                status: "active",
                updatedAt: new Date(),
            },
            { upsert: true }
        );
    } catch (error) {
        console.error("Error saving Zerodha token:", error);
        throw error;
    }
}

/**
 * Check token status for a workflow
 */
export async function checkTokenStatus(userId: string, workflowId: string): Promise<TokenStatus> {
    try {
        const record = await ZerodhaTokenModel.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            workflowId: new mongoose.Types.ObjectId(workflowId)
        });

        if (!record) {
            const tokenRequestId = await createTokenRequest(userId, workflowId);
            return {
                hasValidToken: false,
                needsToken: true,
                message: "Access token required. Please provide your Zerodha access token.",
                tokenRequestId,
            };
        }

        if (record.status === "pending" || !record.accessToken) {
            return {
                hasValidToken: false,
                needsToken: true,
                message: "Waiting for access token. Please provide your Zerodha access token.",
                tokenRequestId: record.tokenRequestId ?? undefined,
            };
        }

        if (record.status === "expired" || (record.tokenExpiresAt && new Date() > record.tokenExpiresAt)) {
            const newTokenRequestId = await createTokenRequest(userId, workflowId);
            return {
                hasValidToken: false,
                needsToken: true,
                message: "Your Zerodha access token has expired. Please provide a new token.",
                tokenRequestId: newTokenRequestId,
            };
        }

        const hoursUntilExpiry = record.tokenExpiresAt 
            ? (record.tokenExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60)
            : 24;

        return {
            hasValidToken: true,
            needsToken: false,
            expiresAt: record.tokenExpiresAt ?? undefined,
            message: `Token valid for ${Math.ceil(hoursUntilExpiry)} more hours.`,
        };
    } catch (error) {
        console.error("Error checking token status:", error);
        return {
            hasValidToken: false,
            needsToken: true,
            message: "Error checking token status",
        };
    }
}

/**
 * Delete token for a workflow
 */
export async function deleteZerodhaToken(userId: string, workflowId: string): Promise<void> {
    try {
        await ZerodhaTokenModel.deleteOne({
            userId: new mongoose.Types.ObjectId(userId),
            workflowId: new mongoose.Types.ObjectId(workflowId)
        });
    } catch (error) {
        console.error("Error deleting Zerodha token:", error);
        throw error;
    }
}

export function getMarketStatus(): {
    isOpen: boolean;
    message: string;
    nextOpenTime?: string;
} {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    
    const dayOfWeek = istTime.getDay();
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    
    const currentTimeInMinutes = hours * 60 + minutes;
    const marketOpenTime = 9 * 60 + 15;      // 9:15 AM
    const marketCloseTime = 15 * 60 + 30;    // 3:30 PM
    
    if (dayOfWeek === 0) {
        return {
            isOpen: false,
            message: "Market is closed on Sundays",
            nextOpenTime: "Monday 9:15 AM IST"
        };
    }
    
    if (dayOfWeek === 6) {
        return {
            isOpen: false,
            message: "Market is closed on Saturdays",
            nextOpenTime: "Monday 9:15 AM IST"
        };
    }
    
    if (currentTimeInMinutes < marketOpenTime) {
        const openingHour = Math.floor(marketOpenTime / 60);
        const openingMinute = marketOpenTime % 60;
        return {
            isOpen: false,
            message: `Market opens at ${openingHour}:${String(openingMinute).padStart(2, '0')} AM IST`,
            nextOpenTime: `Today ${openingHour}:${String(openingMinute).padStart(2, '0')} AM IST`
        };
    }
    
    if (currentTimeInMinutes > marketCloseTime) {
        return {
            isOpen: false,
            message: "Market is closed for the day",
            nextOpenTime: "Tomorrow 9:15 AM IST"
        };
    }
    
    return {
        isOpen: true,
        message: "Market is open"
    };
}