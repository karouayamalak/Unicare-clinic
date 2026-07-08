import { Request, Response } from "express";
import { Doctor } from "../models/doctor.model";

export const listDoctors = async (_req: Request, res: Response) => {
  try {
    const doctors = await Doctor.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ doctors });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load doctors", error });
  }
};

export const createDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await Doctor.create(req.body);
    return res.status(201).json({ doctor });
  } catch (error) {
    return res.status(400).json({ message: "Unable to create doctor", error });
  }
};
