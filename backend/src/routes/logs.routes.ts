import { Router } from "express";
import { protect } from "../middleware/auth";
import { listLogs } from "../controllers/log.controller";

const router = Router();

router.use(protect);
router.get("/", listLogs);

export default router;
