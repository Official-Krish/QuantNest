import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import plannerRouter from "./routes/planner";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, service: "ai-builder" });
});

app.use("/api/v1", plannerRouter);

app.listen(3001, () => {
  console.log(`AI builder service is running on port 3001`);
});
