import express from "express";
import {
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getAllCompanies,
} from "../controllers/companyController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  companyValidation,
  validate,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

// Public route
router.get("/all", getAllCompanies);

// Protected routes
router.use(protect);
router.use(authorizeRoles("hr"));

router
  .route("/")
  .get(getCompany)
  .post(companyValidation, validate, createCompany)
  .put(companyValidation, validate, updateCompany)
  .delete(deleteCompany);

export default router;
