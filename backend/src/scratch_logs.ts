import mongoose from "mongoose";
import dotenv from "dotenv";
import { ActionLog } from "./models/actionLog.model";

dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/unicare";
  await mongoose.connect(uri);

  const logs = await ActionLog.find({}).sort({ createdAt: -1 }).limit(30);
  console.log("=== ACTION LOGS ===");
  for (const l of logs) {
    console.log(`[${l.createdAt.toISOString()}] User=${l.userId} Role=${l.userRole} Action=${l.action} Details=${JSON.stringify(l.details)}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
