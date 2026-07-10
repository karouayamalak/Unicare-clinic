import jwt from "jsonwebtoken";
import { CookieOptions, Response } from "express";
import { env } from "../config";

export interface IAccessTokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface IRefreshTokenPayload {
  userId: string;
}

export const generateAccessToken = (payload: IAccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });
};

export const generateRefreshToken = (payload: IRefreshTokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });
};

const parseDurationToMs = (duration: string): number => {
  const amount = parseInt(duration, 10);
  const unit = duration.replace(amount.toString(), "").trim();
  switch (unit) {
    case "m":
    case "min":
      return amount * 60 * 1000;
    case "h":
    case "hr":
      return amount * 60 * 60 * 1000;
    case "d":
    case "day":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
};

export const getCookieOptions = (expiryString: string): CookieOptions => {
  const isProd = env.NODE_ENV === "production" || env.NODE_ENV === "test";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    signed: true,
    maxAge: parseDurationToMs(expiryString),
  };
};

export const sendTokens = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  res.cookie("accessToken", accessToken, getCookieOptions(env.JWT_ACCESS_EXPIRY));
  res.cookie("refreshToken", refreshToken, getCookieOptions(env.JWT_REFRESH_EXPIRY));
};

export const clearTokens = (res: Response): void => {
  const isProd = env.NODE_ENV === "production" || env.NODE_ENV === "test";
  const opts: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    signed: true,
  };
  res.clearCookie("accessToken", opts);
  res.clearCookie("refreshToken", opts);
};

export const verifyAccessToken = (token: string): IAccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as IAccessTokenPayload;
};

export const verifyRefreshToken = (token: string): IRefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as IRefreshTokenPayload;
};
