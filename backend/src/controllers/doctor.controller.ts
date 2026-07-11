import { Request, Response, NextFunction } from "express";
import { Doctor } from "../models/doctor.model";
import { User } from "../models/user.model";
import { AppError } from "../middleware/error";

// ─── GET /api/v1/doctors ─────────────────────────────────────────────────────

export const listDoctors = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { speciality, status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (speciality) filter.specialitySlug = speciality;
    if (status) filter.status = status;

    const doctors = await Doctor.find(filter).sort({ rating: -1 });

    res.status(200).json({
      status: "success",
      results: doctors.length,
      data: { doctors },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/v1/doctors/:id ─────────────────────────────────────────────────

export const getDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return next(new AppError("Doctor not found.", 404));

    res.status(200).json({ status: "success", data: { doctor } });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/v1/doctors ─────────────────────────────────────────────────────
// Admin creates a full doctor profile (and optionally a linked User account)

export const createDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.user?.role !== "Admin") {
      return next(new AppError("Not authorized.", 403));
    }

    const {
      firstName,
      lastName,
      email,
      password,
      speciality,
      specialitySlug,
      bio,
      image,
      location,
      fee,
      availableDays,
      availableHours,
      languages,
    } = req.body;

    if (!firstName || !lastName || !email || !speciality) {
      return next(
        new AppError(
          "firstName, lastName, email and speciality are required.",
          400,
        ),
      );
    }

    let userId: string | undefined;
    if (password) {
      // Validate password strength before attempting to create user
      if (password.length < 12) {
        return next(new AppError("Le mot de passe doit contenir au moins 12 caractères.", 400));
      }
      if (!/[A-Z]/.test(password)) {
        return next(new AppError("Le mot de passe doit contenir au moins une lettre majuscule.", 400));
      }
      if (!/[a-z]/.test(password)) {
        return next(new AppError("Le mot de passe doit contenir au moins une lettre minuscule.", 400));
      }
      if (!/[0-9]/.test(password)) {
        return next(new AppError("Le mot de passe doit contenir au moins un chiffre.", 400));
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        return next(new AppError("Le mot de passe doit contenir au moins un caractère spécial (ex: @, !, #).", 400));
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return next(new AppError("Email already registered as a user.", 400));
      }
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        role: "Doctor",
        isEmailVerified: true,
        isActive: true,
        loginAttempts: 0,
      });
      userId = (user._id as any).toString();
    }

    const slug =
      specialitySlug ||
      speciality
        .toLowerCase()
        .replace(/\s+/g, "-")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const doctor = await Doctor.create({
      firstName,
      lastName,
      name: `Dr. ${firstName} ${lastName}`,
      email,
      speciality,
      specialitySlug: slug,
      bio: bio ?? "",
      image: image ?? "",
      location: location ?? "Centre Médical Thazmarth, Béjaïa",
      fee: fee ?? 2000,
      availableDays:
        availableDays ?? ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
      availableHours: availableHours ?? { start: "08:00", end: "17:00" },
      languages: languages ?? ["Arabe", "Français"],
      ...(userId && { userId }),
    });

    res.status(201).json({ status: "success", data: { doctor } });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/v1/doctors/:id ────────────────────────────────────────────────

export const updateDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.user?.role !== "Admin" && req.user?.role !== "Doctor") {
      return next(new AppError("Not authorized.", 403));
    }

    // Find the existing doctor record first
    const existing = await Doctor.findById(req.params.id);
    if (!existing) return next(new AppError("Doctor not found.", 404));

    // Doctors can only update their own profile
    if (req.user.role === "Doctor" && existing.userId?.toString() !== req.user._id.toString()) {
      return next(new AppError("Vous ne pouvez modifier que votre propre profil.", 403));
    }

    // Admin cannot modify personal information fields — only the doctor can
    const PERSONAL_FIELDS = ["firstName", "lastName", "email", "phone", "bio", "image"];
    if (req.user.role === "Admin") {
      for (const field of PERSONAL_FIELDS) {
        if (field in req.body) {
          delete req.body[field];
        }
      }
    }

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doctor) return next(new AppError("Doctor not found.", 404));

    // Sync status changes to the linked User account (admin only)
    if (doctor.userId && req.user.role === "Admin") {
      const { status } = req.body;
      const userUpdates: Record<string, unknown> = {};

      // Deactivate/reactivate user account based on doctor status
      if (status === "Inactif") {
        userUpdates.isActive = false;
      } else if (status === "Actif" || status === "Congé") {
        userUpdates.isActive = true;
      }

      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(doctor.userId, userUpdates, {
          runValidators: false,
        });
      }
    }

    res.status(200).json({ status: "success", data: { doctor } });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/v1/doctors/:id ───────────────────────────────────────────────

export const deleteDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.user?.role !== "Admin") {
      return next(new AppError("Not authorized.", 403));
    }

    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return next(new AppError("Doctor not found.", 404));

    res
      .status(200)
      .json({ status: "success", message: "Doctor deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/v1/doctors/me/blocked-slots ────────────────────────────────────

export const addBlockedSlot = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { date, hour } = req.body;
    if (!date) return next(new AppError("Date is required.", 400));

    let doctor = await Doctor.findOne({ userId: req.user!._id });
    if (!doctor) {
      doctor = await Doctor.findOne({ email: req.user!.email.toLowerCase().trim() });
      if (doctor && !doctor.userId) {
        doctor.userId = req.user!._id as any;
        await doctor.save();
      }
    }
    if (!doctor) return next(new AppError("Doctor profile not found.", 404));

    doctor.blockedSlots.push({ date, hour });
    await doctor.save();

    res.status(200).json({
      status: "success",
      message: "Blocked slot added.",
      data: { blockedSlots: doctor.blockedSlots },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/v1/doctors/me/blocked-slots/:slotId ─────────────────────────

export const removeBlockedSlot = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let doctor = await Doctor.findOne({ userId: req.user!._id });
    if (!doctor) {
      doctor = await Doctor.findOne({ email: req.user!.email.toLowerCase().trim() });
      if (doctor && !doctor.userId) {
        doctor.userId = req.user!._id as any;
        await doctor.save();
      }
    }
    if (!doctor) return next(new AppError("Doctor profile not found.", 404));

    const slotIndex = doctor.blockedSlots.findIndex(
      (s: any) => s._id?.toString() === req.params.slotId,
    );
    if (slotIndex === -1)
      return next(new AppError("Blocked slot not found.", 404));

    doctor.blockedSlots.splice(slotIndex, 1);
    await doctor.save();

    res.status(200).json({
      status: "success",
      message: "Blocked slot removed.",
      data: { blockedSlots: doctor.blockedSlots },
    });
  } catch (error) {
    next(error);
  }
};
