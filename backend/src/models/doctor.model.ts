import mongoose, { Schema, Document } from "mongoose";

export interface IDoctor extends Document {
  firstName: string;
  lastName: string;
  name: string; // computed: "Dr. FirstName LastName"
  email: string;
  speciality: string;
  specialitySlug: string;
  bio: string;
  image: string; // base64 or URL
  location: string;
  fee: number;
  rating: number;
  reviews: number;
  patients: number;
  availableDays: string[];
  availableHours: { start: string; end: string };
  breaks: Array<{ start: string; end: string }>;
  vacationDays: string[];
  dailyAppointmentLimit: number;
  languages: string[];
  status: "Actif" | "Inactif" | "Congé";
  blockedSlots: Array<{ _id?: string; date: string; hour?: string }>;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    speciality: { type: String, required: true },
    specialitySlug: { type: String, required: true },
    bio: { type: String, default: "" },
    image: { type: String, default: "" },
    location: { type: String, default: "Centre Médical Thazmarth, Béjaïa" },
    fee: { type: Number, default: 2000 },
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    patients: { type: Number, default: 0 },
    availableDays: {
      type: [String],
      default: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
    },
    availableHours: {
      start: { type: String, default: "08:00" },
      end: { type: String, default: "17:00" },
    },
    breaks: {
      type: [
        {
          start: { type: String, required: true },
          end: { type: String, required: true },
        },
      ],
      default: [],
    },
    vacationDays: { type: [String], default: [] },
    dailyAppointmentLimit: { type: Number, default: 20 },
    languages: { type: [String], default: ["Arabe", "Français"] },
    status: {
      type: String,
      enum: ["Actif", "Inactif", "Congé"],
      default: "Actif",
    },
    blockedSlots: [
      {
        date: { type: String, required: true },
        hour: { type: String, required: false },
      },
    ],
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true },
);

doctorSchema.index({ email: 1 });
doctorSchema.index({ specialitySlug: 1 });

export const Doctor = mongoose.model<IDoctor>("Doctor", doctorSchema);
