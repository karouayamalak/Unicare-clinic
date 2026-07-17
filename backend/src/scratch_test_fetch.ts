import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/user.model";
import { Doctor } from "./models/doctor.model";
import { Appointment } from "./models/appointment.model";
import { serializeAppointmentForClient } from "./utils/appointmentView";

dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/unicare";
  await mongoose.connect(uri);

  const user = await User.findOne({ email: "you5341@gmail.com" });
  if (!user) {
    console.log("Doctor user you5341@gmail.com not found!");
    await mongoose.disconnect();
    return;
  }
  console.log("Logged in user:", user._id, user.role);

  let filter: Record<string, unknown> = {};
  if (user.role === "Doctor") {
    let doc = await Doctor.findOne({ userId: user._id });
    if (!doc) {
      doc = await Doctor.findOne({ email: user.email.toLowerCase().trim() });
    }
    if (doc) {
      filter = { doctorId: doc._id };
    } else {
      filter = { doctorId: "000000000000000000000000" };
    }
    console.log("Found doctor profile:", doc ? doc._id : null, doc ? doc.name : null);
  }

  const appointments = await Appointment.find(filter)
    .populate("dependentId")
    .sort({ date: 1, time: 1 })
    .lean();

  console.log(`Query returned ${appointments.length} appointments:`);
  for (const a of appointments) {
    const serialized = serializeAppointmentForClient(a);
    console.log(`- Appt ID=${serialized._id}, patient=${serialized.patientName}, date=${serialized.date}, arrivedAt=${serialized.arrivedAt}, status=${serialized.status}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
