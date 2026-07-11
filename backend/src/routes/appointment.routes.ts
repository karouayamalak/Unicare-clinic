import { Router } from "express";
import { protect } from "../middleware/auth";
import {
  listAppointments,
  createAppointment,
  updateStatus,
  deleteAppointment,
  updatePrescription,
  listPatients,
  getBookedSlots,
} from "../controllers/appointment.controller";

const router = Router();

// Public: booked time slots for a doctor on a date (no auth needed)
router.get("/booked-slots", getBookedSlots);

router.use(protect);

router.get("/", listAppointments);
router.post("/", createAppointment);
router.patch("/:id/status", updateStatus);
router.delete("/:id", deleteAppointment);
router.patch("/:id/prescription", updatePrescription);
router.get("/patients", listPatients);

export default router;
