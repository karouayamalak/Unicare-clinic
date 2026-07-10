import { Request, Response, NextFunction } from "express";
import { AppError } from "./error";
import { verifyAccessToken } from "../utils/tokens";
import { User } from "../models/user.model";

export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (process.env.NODE_ENV === "development") {
      const cookieKeys = req.signedCookies ? Object.keys(req.signedCookies) : [];
      console.debug(
        "Auth debug - signedCookies:",
        cookieKeys,
        "authorization:",
        !!req.headers.authorization,
      );
    }

    let token: string | undefined;

    // 1. Try signed cookie first (preferred — httpOnly, tamper-proof)
    if (req.signedCookies?.accessToken) {
      token = req.signedCookies.accessToken;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError(
          "Authentication required. Please log in to access this resource.",
          401,
        ),
      );
    }

    let decoded: ReturnType<typeof verifyAccessToken>;
    try {
      decoded = verifyAccessToken(token);
    } catch (err: any) {
      console.warn(`Failed access token verification: ${err.message}`);
      return next(
        new AppError(
          "Session is invalid or expired. Please sign in again.",
          401,
        ),
      );
    }

    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(
        new AppError(
          "The user session belongs to an account that no longer exists.",
          401,
        ),
      );
    }

    if (!currentUser.isActive) {
      return next(
        new AppError(
          "This account is deactivated. Please contact support.",
          403,
        ),
      );
    }

    if (decoded.iat && currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          "Password was recently updated. Please authenticate again.",
          401,
        ),
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};
