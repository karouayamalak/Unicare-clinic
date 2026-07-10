import dotenv from "dotenv";
import mongoose from "mongoose";
import { z } from "zod";
import { User } from "./models/user.model";
import { resolveMongoConnectionUri } from "./utils/mongo";

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().optional().default(""),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  COOKIE_SECRET: z
    .string()
    .min(32, "COOKIE_SECRET must be at least 32 characters"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(2525),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  FROM_EMAIL: z.string().email().default("noreply@thazmarth.clinic"),
  FRONTEND_URL: z.string().url().default("http://localhost:8082"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  CLINIC_HOLIDAYS: z.string().default(""),
  MAX_APPOINTMENT_FUTURE_DAYS: z.coerce.number().default(90),
  APPOINTMENT_DURATION_MINUTES: z.coerce.number().default(30),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(" Invalid environment variables configuration:");
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

// ─── Database Connection ───────────────────────────────────────────────────

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set("strictQuery", true);

    const uri = resolveMongoConnectionUri(env.MONGO_URI);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed default Admin account if none exists
    const adminExists = await User.findOne({ role: "Admin" });
    if (!adminExists) {
      await User.create({
        firstName: "Admin",
        lastName: "Unicare",
        email: "admin@unicare.dz",
        password: "UnicareAdmin123!",
        role: "Admin",
        isEmailVerified: true,
        isActive: true,
        loginAttempts: 0,
      });
      console.log(
        "Default administrator seeded: admin@unicare.dz / UnicareAdmin123!",
      );
    } else if (!adminExists.isEmailVerified || !adminExists.isActive) {
      // Repair a broken admin account
      adminExists.isEmailVerified = true;
      adminExists.isActive = true;
      adminExists.loginAttempts = 0;
      adminExists.lockUntil = undefined;
      await adminExists.save({ validateBeforeSave: false });
      console.log(
        "Admin account repaired: isEmailVerified and isActive set to true.",
      );
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection disconnected.");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB Database Error: ${err.message}`);
});

export const closeDB = async (): Promise<void> => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed gracefully.");
};
