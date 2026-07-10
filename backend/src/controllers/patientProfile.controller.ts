import { Request, Response, NextFunction } from "express";
import { PatientProfile } from "../models/patientProfile.model";
import { User } from "../models/user.model";
import { AppError } from "../middleware/error";
import { logAction } from "../utils/log";

const normalizeEmail = (email: string | undefined): string | null => {
  if (typeof email !== "string") return null;
  const normalized = email.toLowerCase().trim();
  return normalized.length > 0 ? normalized : null;
};

// GET /api/v1/patient-profiles/:email (Doctor/Admin checks patient profile)
export const getPatientProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role === "Patient") {
      return next(new AppError("Non autorisé.", 403));
    }

    const email = req.params.email as string;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return next(new AppError("Email patient invalide.", 400));
    }

    let profile = await PatientProfile.findOne({
      patientEmail: normalizedEmail,
    });

    if (!profile) {
      const patientUser = await User.findOne({
        email: normalizedEmail,
        role: "Patient",
      });
      const patientName = patientUser
        ? `${patientUser.firstName} ${patientUser.lastName}`
        : normalizedEmail;

      profile = await PatientProfile.create({
        patientEmail: normalizedEmail,
        patientName,
      });
    }

    res.status(200).json({
      status: "success",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/patient-profiles/me (Patient checks own profile)
export const getMyPatientProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError("Non authentifié.", 401));
    }

    let profile = await PatientProfile.findOne({
      patientEmail: user.email.toLowerCase().trim(),
    });
    if (!profile) {
      profile = await PatientProfile.create({
        patientEmail: user.email.toLowerCase().trim(),
        patientName: `${user.firstName} ${user.lastName}`,
      });
    }

    res.status(200).json({
      status: "success",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/patient-profiles/:email (Doctor/Admin/User updates profile)
export const updatePatientProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError("Non authentifié.", 401));
    }

    const email = req.params.email as string;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return next(new AppError("Email patient invalide.", 400));
    }

    // Patients can only update their own profile; Doctors and Admins can update any
    if (user.role === "Patient" && user.email.toLowerCase().trim() !== normalizedEmail) {
      return next(new AppError("Non autorisé.", 403));
    }

    let profile = await PatientProfile.findOne({
      patientEmail: normalizedEmail,
    });
    if (!profile) {
      const patientUser = await User.findOne({
        email: normalizedEmail,
        role: "Patient",
      });
      const patientName = patientUser
        ? `${patientUser.firstName} ${patientUser.lastName}`
        : normalizedEmail;

      profile = new PatientProfile({
        patientEmail: normalizedEmail,
        patientName,
      });
    }

    const {
      patientName,
      phone,
      address,
      emergencyContact,
      dateOfBirth,
      gender,
      weight,
      height,
      age,
      allergies,
      bloodType,
      chronicConditions,
      notes,
    } = req.body;

    if (patientName !== undefined) profile.patientName = patientName;
    if (phone !== undefined) profile.phone = phone;
    if (address !== undefined) profile.address = address;
    if (emergencyContact !== undefined) profile.emergencyContact = emergencyContact;
    if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
    if (gender !== undefined) profile.gender = gender;
    if (weight !== undefined) profile.weight = weight;
    if (height !== undefined) profile.height = height;
    if (age !== undefined) profile.age = age;
    if (allergies !== undefined) profile.allergies = allergies;
    if (bloodType !== undefined) profile.bloodType = bloodType;
    if (chronicConditions !== undefined) profile.chronicConditions = chronicConditions;
    if (notes !== undefined) profile.notes = notes;

    profile.lastModifiedByDoctor =
      user.role === "Doctor"
        ? `Dr. ${user.firstName} ${user.lastName}`
        : user.role === "Admin"
        ? "Admin"
        : "Patient";

    await profile.save();

    await logAction(
      user,
      "Profil patient mis à jour",
      "PatientProfile",
      profile._id?.toString() ?? "",
      `${profile.patientName} (${normalizedEmail})`,
    );

    res.status(200).json({
      status: "success",
      message: "Dossier médical mis à jour.",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};
