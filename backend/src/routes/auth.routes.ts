import { Router } from "express";
import { z } from "zod";
import {
  register,
  login,
  verifyEmail,
  googleLogin,
  refresh,
  logout,
  logoutAll,
  updateProfile,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";

const router = Router();

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .refine((val) => /[A-Z]/.test(val), "Must contain an uppercase letter")
  .refine((val) => /[a-z]/.test(val), "Must contain a lowercase letter")
  .refine((val) => /[0-9]/.test(val), "Must contain a digit")
  .refine((val) => /[^A-Za-z0-9]/.test(val), "Must contain a special character");

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50).trim(),
    lastName: z.string().min(1, "Last name is required").max(50).trim(),
    email: z.string().min(1, "Email is required").email().trim().toLowerCase(),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email().trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

const googleSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post("/register", validateRequest({ body: registerSchema }), register);
router.post("/login", validateRequest({ body: loginSchema }), login);
router.post("/google", validateRequest({ body: googleSchema }), googleLogin);
router.post("/verify-email", verifyEmail);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Protected routes
router.post("/logout-all", protect, logoutAll);
router.patch("/profile", protect, updateProfile);

export default router;
