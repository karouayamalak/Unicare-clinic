import { Router } from "express";
import {
  getPatientProfile,
  getMyPatientProfile,
  updatePatientProfile,
} from "../controllers/patientProfile.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/me", getMyPatientProfile);
router.get("/:email", getPatientProfile);
router.patch("/:email", updatePatientProfile);

export default router;
