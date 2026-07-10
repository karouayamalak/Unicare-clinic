import { Request, Response, NextFunction } from "express";
import { env } from "../config";

// Custom operational error class
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Centralised error handler ─────────────────────────────────────────────────

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err.statusCode ?? 500;
  const message =
    err.isOperational || env.NODE_ENV === "development"
      ? err.message
      : "An unexpected error occurred. Please try again later.";

  if (env.NODE_ENV === "development") {
    console.error("ERROR:", err);
  }

  res.status(statusCode).json({
    status: err.status ?? "error",
    message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
