import mongoose, { Schema, Document } from "mongoose";

export type AppointmentStatus =
  | "Confirmé"
  | "En attente"
  | "En consultation"
  | "Terminé"
  | "Annulé";

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  patientName: string;
  patientEmail: string;
  dependentId?: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  doctorName: string;
  speciality: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  reason: string;
  mode: "In-clinic" | "Video";
  status: AppointmentStatus;
  arrivedAt?: string;
  notes?: string;
  prescription?: {
    drug: string;
    dose: string;
    freq: string;
    refills: number;
    notes?: string;
    drugs?: Array<{
      drug: string;
      dose: string;
      freq: string;
      refills: number;
      notes?: string;
    }>;
  };
  price?: number;
  receiptNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true, lowercase: true },
    dependentId: {
      type: Schema.Types.ObjectId,
      ref: "Dependent",
      required: false,
    },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    doctorName: { type: String, required: true },
    speciality: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String, required: true },
    mode: {
      type: String,
      enum: ["In-clinic", "Video"],
      default: "In-clinic",
    },
    status: {
      type: String,
      enum: ["Confirmé", "En attente", "En consultation", "Terminé", "Annulé"],
      default: "Confirmé",
    },
    arrivedAt: String,
    notes: String,
    prescription: {
      drug: String,
      dose: String,
      freq: String,
      refills: Number,
      notes: String,
      drugs: [
        {
          drug: String,
          dose: String,
          freq: String,
          refills: Number,
          notes: String,
        },
      ],
    },
    price: { type: Number, default: 0 },
    receiptNumber: String,
  },
  { timestamps: true },
);

appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ["Annulé", "Terminé"] } },
  },
);

export const Appointment = mongoose.model<IAppointment>(
  "Appointment",
  appointmentSchema,
);
