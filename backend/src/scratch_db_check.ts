import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/user.model";
import { Doctor } from "./models/doctor.model";
import { Appointment } from "./models/appointment.model";
import { resolveMongoConnectionString } from "./config";

dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/unicare";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);

  const appointments = await Appointment.find({});
  console.log("=== APPOINTMENTS ===");
  for (const a of appointments) {
    console.log(`Appt: ID=${a._id}, patient=${a.patientName}, doctorId=${a.doctorId}, date=${a.date}, time=${a.time}, status=${a.status}, arrivedAt=${a.arrivedAt}`);
  }

  const doctors = await Doctor.find({});
  console.log("=== DOCTORS ===");
  for (const d of doctors) {
    console.log(`Doctor: name=${d.name}, id=${d._id}, userId=${d.userId}`);
  }

  const users = await User.find({});
  console.log("=== USERS ===");
  for (const u of users) {
    console.log(`User: name=${u.firstName} ${u.lastName}, id=${u._id}, role=${u.role}, email=${u.email}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
