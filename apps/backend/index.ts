import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import notificationRouter from './routes/notification';
import userRouter from './routes/user';
import workFlowRouter from './routes/workflow';
import mongoose from 'mongoose';
import ZerodhaTokenRouter from './routes/token';
import { getMarketStatus } from '@quantnest-trading/executor-utils';

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

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

app.use("/api/v1/user", userRouter);
app.use("/api/v1/workflow", workFlowRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/zerodha-token", ZerodhaTokenRouter);

app.get("/market-status", async (req, res) => {
  try {
    const marketStatus = getMarketStatus();
    res.status(200).json({ success: true, marketStatus });  
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
