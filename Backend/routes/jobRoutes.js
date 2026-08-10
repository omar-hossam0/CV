import express from "express";
import multer from "multer";
import {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  searchJobs,
  getJobApplicants,
  applyToJob,
  withdrawApplication,
  getSavedJobsHR,
  toggleSaveJobHR,
  getLatestJobs,
} from "../controllers/jobController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { jobValidation, validate } from "../middleware/validationMiddleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const router = express.Router();

// Public route - get latest 3 jobs (no authentication required)
router.get("/latest", getLatestJobs);

// All other routes require authentication
router.use(protect);

// Routes that require HR role for creation, but GET is public for authenticated users
router
  .route("/")
  .get(getAllJobs) // Allow all authenticated users to view jobs
  .post(authorizeRoles("hr"), upload.single("companyLogo"), createJob); // Only HR can create

router.get("/search", authorizeRoles("hr"), searchJobs);

router
  .route("/:id")
  .get(getJob)
  .put(authorizeRoles("hr"), jobValidation, validate, updateJob)
  .delete(authorizeRoles("hr"), deleteJob);

// Apply to a job (employees only)
router.post("/:id/apply", authorizeRoles("employee", "user"), applyToJob);

// Withdraw application (employees only)
router.delete(
  "/:id/withdraw",
  authorizeRoles("employee", "user"),
  withdrawApplication,
);

router.get("/:id/applicants", authorizeRoles("hr"), getJobApplicants);

// Saved jobs endpoints for HR
router.get("/hr/saved-jobs", authorizeRoles("hr"), getSavedJobsHR);
router.post("/hr/saved-jobs/:jobId", authorizeRoles("hr"), toggleSaveJobHR);

export default router;
