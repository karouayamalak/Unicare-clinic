import mongoose, { Schema, Document } from "mongoose";

export interface IPatientProfile extends Document {
  patientEmail: string;
  patientName: string;
  phone: string;
  address: string;
  emergencyContact: string;
  dateOfBirth: string;
  gender: string;
  weight: number;
  height: number;
  age: number;
  allergies: string;
  bloodType: string;
  chronicConditions: string;
  notes: string;
  lastModifiedByDoctor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const patientProfileSchema = new Schema<IPatientProfile>(
  {
    patientEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    dateOfBirth: { type: String, default: "" },
    gender: { type: String, default: "" },
    weight: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    age: { type: Number, default: 0 },
    allergies: { type: String, default: "" },
    bloodType: { type: String, default: "" },
    chronicConditions: { type: String, default: "" },
    notes: { type: String, default: "" },
    lastModifiedByDoctor: String,
  },
  { timestamps: true },
);

export const PatientProfile = mongoose.model<IPatientProfile>(
  "PatientProfile",
  patientProfileSchema,
);
