import express from 'express';
import cors from 'cors';
import userRouter from './routes/user';
import workFlowRouter from './routes/workflow';
import mongoose from 'mongoose';
import ZerodhaTokenRouter from './routes/token';
import { getMarketStatus } from '@quantnest-trading/executor-utils';

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/myapp')

app.use("/api/v1/user", userRouter);
app.use("/api/v1/workflow", workFlowRouter);
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