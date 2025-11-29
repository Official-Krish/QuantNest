import express from 'express';
import cors from 'cors';
import userRouter from './routes/user';
import workFlowRouter from './routes/workflow';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/myapp')

app.use("/api/v1/user", userRouter);
app.use("/api/v1/workflow", workFlowRouter)

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});