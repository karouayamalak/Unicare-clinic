import { Router } from "express";
import { createDoctor, listDoctors } from "../controllers/doctor.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/", listDoctors);
router.post("/", protect, createDoctor);

export default router;
