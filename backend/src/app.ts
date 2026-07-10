import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import hpp from "hpp";
import morgan from "morgan";
import { env } from "./config";
import { AppError, errorHandler } from "./middleware/error";
import authRouter from "./routes/auth.routes";
import doctorRouter from "./routes/doctor.routes";

const app = express();

// ─── Security hardening ────────────────────────────────────────────────────────

app.disable("x-powered-by");
app.use(helmet());

const allowedOrigins = [
  env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8082",
  "http://127.0.0.1:8082",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.use(hpp());

// ─── Request parsing ───────────────────────────────────────────────────────────

app.use(compression());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));

// ─── Request logging ───────────────────────────────────────────────────────────

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy and running",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/doctors", doctorRouter);

// ─── 404 wildcard ─────────────────────────────────────────────────────────────

app.all("*", (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ─── Centralised error handler (must be last) ─────────────────────────────────

app.use(errorHandler);

export default app;
