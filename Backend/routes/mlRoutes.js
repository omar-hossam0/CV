import express from "express";
import multer from "multer";
import {
  matchCV,
  matchJobs,
  getMatchInputs,
  matchCVsToJob,
  classifyCV,
  analyzeJobForUser,
  chatModel,
} from "../controllers/mlController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public endpoint: forward CV to Python ML service
router.post("/match", upload.single("cvFile"), matchCV);

// Chat endpoint for frontend chatbot (employee interview page)
router.post("/chat", protect, chatModel);

// Protected endpoint: match jobs with user's CV
// Match jobs using ML (can be GET or POST)
router.get("/match-jobs", protect, matchJobs);
router.post("/match-jobs", protect, matchJobs);

// Protected endpoint: analyze specific job for user (skills analysis)
router.get("/analyze-job/:jobId", protect, analyzeJobForUser);

// HR only: Match CVs to a job description
router.post("/match-cvs", protect, authorizeRoles("hr"), matchCVsToJob);

// Public endpoint: view matcher inputs without authentication
router.get("/match-inputs", getMatchInputs);

// Protected endpoint: Classify CV to determine job title
router.post("/classify-cv", protect, classifyCV);

export default router;
