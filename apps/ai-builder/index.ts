import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import plannerRouter from "./routes/planner";

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

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, service: "ai-builder" });
});

app.use("/api/v1/ai-builder", plannerRouter);

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`AI builder service is running on port ${port}`);
});
