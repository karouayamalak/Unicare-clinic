import { Router } from "express";
import { protect } from "../middleware/auth";
import {
  listDependents,
  createDependent,
  getDependent,
  updateDependent,
  deleteDependent,
  getDependentsByParent,
} from "../controllers/dependent.controller";

const router = Router();

router.use(protect);

router.get("/", listDependents);
router.post("/", createDependent);
router.get("/:id", getDependent);
router.patch("/:id", updateDependent);
router.delete("/:id", deleteDependent);
router.get("/by-parent/:email", getDependentsByParent);

export default router;
