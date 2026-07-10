import { Request, Response, NextFunction } from "express";
import { Dependent } from "../models/dependent.model";
import { AppError } from "../middleware/error";
import { logAction } from "../utils/log";

// GET /api/v1/dependents - List dependents for parent
export const listDependents = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== "Patient") {
      return next(new AppError("Only patients can manage dependents.", 403));
    }

    const dependents = await Dependent.find({
      parentEmail: user.email.toLowerCase().trim(),
    }).sort({ dateOfBirth: 1 });

    res.status(200).json({
      status: "success",
      results: dependents.length,
      data: { dependents },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/dependents - Add dependent
export const createDependent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== "Patient") {
      return next(new AppError("Only patients can manage dependents.", 403));
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodType,
      allergies,
      chronicConditions,
      photo,
      relationship,
      weight,
      height,
      notes,
    } = req.body;

    if (!firstName || !lastName) {
      return next(new AppError("firstName and lastName are required.", 400));
    }

    // Validate dependent age (must be under 18)
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const age = Math.floor(
        (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );
      if (age >= 18) {
        return next(
          new AppError("Les dépendants doivent être âgés de moins de 18 ans.", 400),
        );
      }
    }

    const dependent = await Dependent.create({
      parentEmail: user.email.toLowerCase().trim(),
      firstName,
      lastName,
      dateOfBirth: dateOfBirth || "",
      gender: gender || "",
      relationship: relationship || "Enfant",
      bloodType: bloodType || "",
      allergies: allergies || "",
      chronicConditions: chronicConditions || "",
      weight: weight || 0,
      height: height || 0,
      notes: notes || "",
      photo: photo || "",
    });

    await logAction(
      user,
      "Dépendant ajouté",
      "Dependent",
      (dependent._id as any).toString(),
      `${dependent.firstName} ${dependent.lastName}`,
    );

    res.status(201).json({
      status: "success",
      message: "Dependent added successfully.",
      data: { dependent },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/dependents/:id - View specific dependent
export const getDependent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== "Patient") {
      return next(new AppError("Only patients can manage dependents.", 403));
    }

    const dependent = await Dependent.findById(req.params.id);
    if (!dependent) return next(new AppError("Dependent not found.", 404));

    if (dependent.parentEmail !== user.email.toLowerCase().trim()) {
      return next(new AppError("Not authorized.", 403));
    }

    res.status(200).json({
      status: "success",
      data: { dependent },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/dependents/:id - Update dependent
export const updateDependent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== "Patient") {
      return next(new AppError("Only patients can manage dependents.", 403));
    }

    const dependent = await Dependent.findById(req.params.id);
    if (!dependent) return next(new AppError("Dependent not found.", 404));

    if (dependent.parentEmail !== user.email.toLowerCase().trim()) {
      return next(new AppError("Not authorized.", 403));
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodType,
      allergies,
      chronicConditions,
      photo,
      relationship,
      weight,
      height,
      notes,
    } = req.body;

    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const age = Math.floor(
        (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );
      if (age >= 18) {
        return next(
          new AppError("Les dépendants doivent être âgés de moins de 18 ans.", 400),
        );
      }
    }

    if (firstName) dependent.firstName = firstName;
    if (lastName) dependent.lastName = lastName;
    if (dateOfBirth) dependent.dateOfBirth = dateOfBirth;
    if (gender !== undefined) dependent.gender = gender;
    if (bloodType !== undefined) dependent.bloodType = bloodType;
    if (allergies !== undefined) dependent.allergies = allergies;
    if (chronicConditions !== undefined) dependent.chronicConditions = chronicConditions;
    if (weight !== undefined) dependent.weight = weight;
    if (height !== undefined) dependent.height = height;
    if (notes !== undefined) dependent.notes = notes;
    if (photo !== undefined) dependent.photo = photo;
    if (relationship) dependent.relationship = relationship;

    await dependent.save();

    await logAction(
      user,
      "Dépendant modifié",
      "Dependent",
      (dependent._id as any).toString(),
      `${dependent.firstName} ${dependent.lastName}`,
    );

    res.status(200).json({
      status: "success",
      message: "Dependent updated successfully.",
      data: { dependent },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/dependents/:id - Remove dependent
export const deleteDependent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== "Patient") {
      return next(new AppError("Only patients can manage dependents.", 403));
    }

    const dependent = await Dependent.findById(req.params.id);
    if (!dependent) return next(new AppError("Dependent not found.", 404));

    if (dependent.parentEmail !== user.email.toLowerCase().trim()) {
      return next(new AppError("Not authorized.", 403));
    }

    await logAction(
      user,
      "Dépendant supprimé",
      "Dependent",
      (dependent._id as any).toString(),
      `${dependent.firstName} ${dependent.lastName}`,
    );

    await dependent.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Dependent removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/dependents/by-parent/:email (Doctor/Admin checks patient's children)
export const getDependentsByParent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (user.role !== "Doctor" && user.role !== "Admin")) {
      return next(
        new AppError("Only doctors and admins can view patient dependents.", 403),
      );
    }

    const email = req.params.email as string;
    if (!email) return next(new AppError("Patient email is required.", 400));

    const dependents = await Dependent.find({
      parentEmail: email.toLowerCase().trim(),
    }).sort({ dateOfBirth: 1 });

    res.status(200).json({
      status: "success",
      results: dependents.length,
      data: { dependents },
    });
  } catch (error) {
    next(error);
  }
};
