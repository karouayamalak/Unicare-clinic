import { Router } from "express";
import {
  listDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  addBlockedSlot,
  removeBlockedSlot,
} from "../controllers/doctor.controller";
import { protect } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/", listDoctors);
router.get("/:id", getDoctor);

// Doctor-protected blocked slot routes
router.post("/me/blocked-slots", protect, addBlockedSlot);
router.delete("/me/blocked-slots/:slotId", protect, removeBlockedSlot);

// Admin-protected routes
router.post("/", protect, createDoctor);
router.patch("/:id", protect, updateDoctor);
router.delete("/:id", protect, deleteDoctor);

export default router;
