import mongoose, { Schema, Document } from "mongoose";

export interface IDependent extends Document {
  parentEmail: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // "YYYY-MM-DD"
  gender: string;
  relationship: "Enfant" | "Autre dépendant";
  bloodType: string;
  allergies: string;
  chronicConditions: string;
  weight: number;
  height: number;
  notes: string;
  photo: string; // base64 or URL
  createdAt: Date;
  updatedAt: Date;
}

const dependentSchema = new Schema<IDependent>(
  {
    parentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: String,
      default: "",
    },
    gender: { type: String, default: "" },
    relationship: {
      type: String,
      enum: ["Enfant", "Autre dépendant"],
      default: "Enfant",
    },
    bloodType: { type: String, default: "" },
    allergies: { type: String, default: "" },
    chronicConditions: { type: String, default: "" },
    weight: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    photo: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Dependent = mongoose.model<IDependent>(
  "Dependent",
  dependentSchema,
);
