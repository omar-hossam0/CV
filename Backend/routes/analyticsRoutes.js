import express from "express";
import {
  getDashboardAnalytics,
  saveAnalytics,
  getHistoricalAnalytics,
} from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication and HR role
router.use(protect);
router.use(authorizeRoles("hr"));

router.get("/dashboard", getDashboardAnalytics);
router.get("/history", getHistoricalAnalytics);
router.post("/", saveAnalytics);

export default router;
