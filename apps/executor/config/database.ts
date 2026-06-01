import { connectMongoWithRetry } from "@quantnest-trading/db/client";

export async function connectDB() {
  await connectMongoWithRetry({ serviceName: "executor" });
}
