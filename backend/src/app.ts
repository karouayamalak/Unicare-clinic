import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import hpp from "hpp";
import morgan from "morgan";

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(hpp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
