import express from "express";
import crypto from "crypto";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import notificationRouter from "./routes/notification";
import aiRouter from "./routes/ai";
import userRouter from "./routes/user";
import workFlowRouter from "./routes/workflow";
import examplesRouter from "./routes/examples";
import ZerodhaTokenRouter from "./routes/token";
import onchainRouter from "./routes/onchain";
import { getMarketStatus } from "@quantnest-trading/executor-utils";
import { getAllMarketAssets, getMarketAssets } from "@quantnest-trading/market";
import { connectMongoWithRetry } from "@quantnest-trading/db/client";
import { initRedis } from "@quantnest-trading/redis";
import { idempotencyMiddleware } from "./middleware/idempotency";

const app = express();
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// Body parsing with size limit
app.use(express.json({ limit: "100kb" }));

// HTTP parameter pollution protection
app.use(hpp());

const cookieSecret = process.env.COOKIE_SECRET || crypto.randomUUID();
app.use(cookieParser(cookieSecret));

// CSRF protection — require custom header on mutating requests
app.use((req, res, next) => {
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    next();
    return;
  }
  const requestedWith = req.headers["x-requested-with"];
  const csrfToken = req.headers["x-csrf-token"];
  if (requestedWith === "XMLHttpRequest" || csrfToken) {
    next();
    return;
  }
  res.status(403).json({ message: "CSRF validation failed" });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Slow down after 40 requests in 1 minute
const speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 40,
  delayMs: () => 500,
});
app.use(speedLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Try again later." },
});
app.use("/api/v1/user/signin", authLimiter);
app.use("/api/v1/user/signup", authLimiter);

// Idempotency middleware
app.use(idempotencyMiddleware);

void connectMongoWithRetry({ serviceName: "backend" });
void initRedis();

app.use("/api/v1/user", userRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/workflow", workFlowRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/zerodha-token", ZerodhaTokenRouter);
app.use("/api/v1/examples", examplesRouter);
app.use("/api/v1/onchain", onchainRouter);

const handleMarketStatus = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const marketStatus = getMarketStatus();
    res.status(200).json({ success: true, marketStatus });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};

const handleMarketAssets = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const marketQuery = String(req.query.market || "").trim();
    const limit = Number(req.query.limit || 50);
    const forceRefresh =
      String(req.query.forceRefresh || "").toLowerCase() === "true";

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
    res.status(500).json({
      success: false,
      message: "Failed to fetch market assets",
      error,
    });
  }
};

app.get("/market-status", handleMarketStatus);
app.get("/api/v1/market-status", handleMarketStatus);
app.get("/market/assets", handleMarketAssets);
app.get("/api/v1/market/assets", handleMarketAssets);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
