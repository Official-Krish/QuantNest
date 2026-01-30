import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/myapp");
}
