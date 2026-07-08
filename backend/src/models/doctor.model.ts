import mongoose, { Schema, Document } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  specialty: string;
  bio: string;
  experienceYears: number;
  location: string;
  isActive: boolean;
}

const doctorSchema = new Schema<IDoctor>({
  name: { type: String, required: true, trim: true },
  specialty: { type: String, required: true, trim: true },
  bio: { type: String, default: "" },
  experienceYears: { type: Number, default: 0 },
  location: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Doctor = mongoose.model<IDoctor>("Doctor", doctorSchema);
