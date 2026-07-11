import { Request, Response, NextFunction } from "express";
import { ActionLog } from "../models/actionLog.model";
import { AppError } from "../middleware/error";

// GET /api/v1/logs — Admin only
export const listLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== "Admin") {
      return next(new AppError("Not authorized.", 403));
    }

    const { actorRole, limit } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};

    if (actorRole) {
      filter.actorRole = {
        $in: actorRole.split(",").map((role) => role.trim()),
      };
    }

    const logs = await ActionLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 100, 500))
      .lean();

    res.status(200).json({
      status: "success",
      results: logs.length,
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
};
