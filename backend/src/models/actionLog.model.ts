import mongoose, { Schema, Document } from "mongoose";

export interface IActionLog extends Document {
  actorId?: string;
  actorEmail: string;
  actorName: string;
  actorRole: "Patient" | "Doctor" | "Admin";
  action: string;
  objectType: string;
  objectId?: string;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

const actionLogSchema = new Schema<IActionLog>(
  {
    actorId: { type: String, default: "" },
    actorEmail: { type: String, required: true, lowercase: true, trim: true },
    actorName: { type: String, required: true, trim: true },
    actorRole: {
      type: String,
      enum: ["Patient", "Doctor", "Admin"],
      required: true,
    },
    action: { type: String, required: true, trim: true },
    objectType: { type: String, required: true, trim: true },
    objectId: { type: String, default: "" },
    details: { type: String, default: "" },
  },
  { timestamps: true },
);

export const ActionLog = mongoose.model<IActionLog>(
  "ActionLog",
  actionLogSchema,
);
