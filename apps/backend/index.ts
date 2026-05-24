import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import notificationRouter from './routes/notification';
import aiRouter from './routes/ai';
import userRouter from './routes/user';
import workFlowRouter from './routes/workflow';
import examplesRouter from './routes/examples';
import mongoose from 'mongoose';
import ZerodhaTokenRouter from './routes/token';
import { getMarketStatus } from '@quantnest-trading/executor-utils';
import { getAllMarketAssets, getMarketAssets } from '@quantnest-trading/market';

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

const cookieSecret = process.env.COOKIE_SECRET || crypto.randomUUID();
app.use(cookieParser(cookieSecret));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Try again later." },
});
app.use("/api/v1/user/signin", authLimiter);
app.use("/api/v1/user/signup", authLimiter);

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/myapp')
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

app.use("/api/v1/user", userRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/workflow", workFlowRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/zerodha-token", ZerodhaTokenRouter);
app.use("/api/v1/examples", examplesRouter);

const handleMarketStatus = async (req: express.Request, res: express.Response) => {
  try {
    const marketStatus = getMarketStatus();
    res.status(200).json({ success: true, marketStatus });  
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error });
  }
};

const handleMarketAssets = async (req: express.Request, res: express.Response) => {
  try {
    const marketQuery = String(req.query.market || "").trim();
    const limit = Number(req.query.limit || 50);
    const forceRefresh = String(req.query.forceRefresh || "").toLowerCase() === "true";

    if (marketQuery === "Indian" || marketQuery === "Crypto") {
      const assets = await getMarketAssets(marketQuery, {
        limit,
        forceRefresh,
      });
      res.status(200).json({ success: true, market: marketQuery, assets });
      return;
    }

    const assets = await getAllMarketAssets({
      limitPerMarket: limit,
      forceRefresh,
    });
    res.status(200).json({ success: true, assets });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch market assets", error });
  }
};

app.get("/market-status", handleMarketStatus);
app.get("/api/v1/market-status", handleMarketStatus);
app.get("/market/assets", handleMarketAssets);
app.get("/api/v1/market/assets", handleMarketAssets);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
