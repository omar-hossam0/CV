import express from "express";
import {
  getAllCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  searchCandidates,
  applyForJob,
  updateApplicationStatus,
  calculateMatch,
  uploadResume,
  downloadResume,
  getMyProfile,
  toggleSaveJob,
  getSavedJobs,
} from "../controllers/candidateController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  candidateValidation,
  applicationValidation,
  validate,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

import multer from "multer";

// Use memory storage (file will be in req.file.buffer)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// All routes require authentication
router.use(protect);

// Get my profile (for employees to get their own profile)
router.get("/me", getMyProfile);

// Saved jobs endpoints
router.get("/saved-jobs", authorizeRoles("employee"), getSavedJobs);
router.post("/saved-jobs/:jobId", authorizeRoles("employee"), toggleSaveJob);

router
  .route("/")
  .get(authorizeRoles("hr"), getAllCandidates)
  .post(candidateValidation, validate, createCandidate);

router.get("/search", authorizeRoles("hr"), searchCandidates);

router.post("/apply", applicationValidation, validate, applyForJob);

router.put(
  "/application/status",
  authorizeRoles("hr"),
  updateApplicationStatus
);

router.post("/match", authorizeRoles("hr"), calculateMatch);

// Employee resume upload (multipart/form-data) -> field name: cv
router.post(
  "/upload",
  authorizeRoles("employee"),
  upload.single("cv"),
  uploadResume
);

// Download candidate resume (for HR or employee viewing their own)
router.get("/:id/resume", downloadResume);

router
  .route("/:id")
  .get(getCandidate)
  .put(candidateValidation, validate, updateCandidate)
  .delete(deleteCandidate);

export default router;
