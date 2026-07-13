import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { User } from "../models/user.model";
import { Token } from "../models/token.model";
import { Doctor } from "../models/doctor.model";
import { AppError } from "../middleware/error";
import { sendVerificationEmail, sendLoginOtpEmail } from "../utils/email";
import { verifyGoogleIdToken } from "../utils/googleAuth";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  sendTokens,
  clearTokens,
} from "../utils/tokens";

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError("Email is already registered.", 400));
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const hashedCode = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: "Patient",
      emailVerificationToken: hashedCode,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isEmailVerified: false,
      isActive: true,
      loginAttempts: 0,
    });

    await sendVerificationEmail(user.email, verificationCode);

    res.status(201).json({
      status: "success",
      message:
        "Account created successfully. A verification code has been sent to your email.",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new AppError("Invalid email or password.", 401));
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const lockMinutes = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / (60 * 1000),
      );
      return next(
        new AppError(
          `Account locked due to consecutive failures. Try again in ${lockMinutes} minutes.`,
          401,
        ),
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      console.warn(`Failed login attempt for email: ${email}`);
      return next(new AppError("Invalid email or password.", 401));
    }

    // In dev mode auto-verify; in production enforce verification
    if (!user.isEmailVerified) {
      if (process.env.NODE_ENV === "production") {
        return next(
          new AppError(
            "Votre email n'est pas vérifié. Veuillez vérifier votre boîte mail.",
            403,
          ),
        );
      }
      user.isEmailVerified = true;
    }

    await user.resetLoginAttempts();
 
    // Direct login token generation (OTP bypassed as requested; only verified on account registration)
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });
 
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
 
    await Token.create({ user: user._id, token: hashedToken, expiresAt, isRevoked: false });
 
    sendTokens(res, accessToken, refreshToken);
    console.log(` Login complete for ${user.email}`);
 
    res.status(200).json({
      status: "success",
      message: "Connexion réussie.",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          image: user.image,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Login OTP ─────────────────────────────────────────────────────────

export const verifyLoginOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return next(new AppError("Email and OTP code are required.", 400));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return next(new AppError("Invalid or expired verification code.", 401));
    }

    if (!user.loginOtpToken || !user.loginOtpExpires || user.loginOtpExpires < new Date()) {
      return next(new AppError("Le code de vérification a expiré. Veuillez vous reconnecter.", 401));
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedOtp !== user.loginOtpToken) {
      return next(new AppError("Code incorrect. Vérifiez votre email et réessayez.", 401));
    }

    // OTP valid — clear it and issue tokens
    user.loginOtpToken = undefined;
    user.loginOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Token.create({ user: user._id, token: hashedToken, expiresAt, isRevoked: false });

    sendTokens(res, accessToken, refreshToken);
    console.log(` OTP verified — login complete for ${user.email}`);

    res.status(200).json({
      status: "success",
      message: "Connexion réussie.",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          image: user.image,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return next(new AppError("Email and code are required.", 400));
    }

    const hashedCode = crypto
      .createHash("sha256")
      .update(String(code))
      .digest("hex");

    const user = await User.findOne({
      email,
      emailVerificationToken: hashedCode,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return next(new AppError("Invalid or expired verification code.", 400));
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Google Login ─────────────────────────────────────────────────────────────

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return next(new AppError("Google ID token is required.", 400));
    }

    const payload = await verifyGoogleIdToken(idToken);
    const email = payload.email.toLowerCase();
    const firstName =
      payload.given_name || payload.name?.split(" ")[0] || "Utilisateur";
    const lastName = payload.family_name || "";

    let user = await User.findOne({ email });
    if (!user) {
      return next(
        new AppError(
          "Ce compte Google n'est pas enregistré. Veuillez d'abord créer un compte.",
          400,
        ),
      );
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    const hashedToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    await Token.create({
      user: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
    });

    sendTokens(res, accessToken, refreshToken);

    res.status(200).json({
      status: "success",
      message: "Google login successful.",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          image: user.image,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Session ──────────────────────────────────────────────────────────

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token: string | undefined = req.signedCookies?.refreshToken;
    if (!token) {
      return next(new AppError("No refresh token provided.", 401));
    }

    let decoded: ReturnType<typeof verifyRefreshToken>;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return next(
        new AppError("Refresh token is invalid or expired.", 401),
      );
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const storedToken = await Token.findOne({
      user: decoded.userId,
      token: hashedToken,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      return next(new AppError("Refresh token is revoked or not found.", 401));
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return next(new AppError("User account is inactive.", 401));
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({ userId: user.id });
    const newHashedToken = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    storedToken.isRevoked = true;
    storedToken.replacedByToken = newHashedToken;
    await storedToken.save();

    await Token.create({
      user: user._id,
      token: newHashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
    });

    sendTokens(res, newAccessToken, newRefreshToken);

    res.status(200).json({ status: "success", message: "Session refreshed." });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token: string | undefined = req.signedCookies?.refreshToken;
    if (token) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      await Token.findOneAndUpdate(
        { token: hashedToken },
        { isRevoked: true },
      );
    }
    clearTokens(res);
    res.status(200).json({ status: "success", message: "Logged out." });
  } catch (error) {
    next(error);
  }
};

// ─── Logout All Devices ───────────────────────────────────────────────────────

export const logoutAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await Token.updateMany({ user: req.user!._id }, { isRevoked: true });
    clearTokens(res);
    res
      .status(200)
      .json({ status: "success", message: "Logged out from all devices." });
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { firstName, lastName, image } = req.body;
    const user = req.user!;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (image !== undefined) user.image = image;

    await user.save({ validateBeforeSave: false });

    // If this is a Doctor user, also sync the doctor profile name
    if (user.role === "Doctor") {
      await Doctor.findOneAndUpdate(
        { userId: user._id },
        {
          name: `Dr. ${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          ...(image !== undefined && { image }),
        },
      );
    }

    res.status(200).json({
      status: "success",
      message: "Profile updated.",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          image: user.image,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
