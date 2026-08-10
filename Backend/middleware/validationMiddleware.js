import { body, validationResult } from "express-validator";

// Validation middleware to check for errors
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Job validation rules
export const jobValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Job title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Job description is required")
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("requiredSkills")
    .isArray({ min: 1 })
    .withMessage("At least one skill is required"),
  body("experienceLevel")
    .isIn(["Entry Level", "Mid Level", "Senior Level", "Executive"])
    .withMessage("Invalid experience level (use one of: Entry Level, Mid Level, Senior Level, Executive)"),
  body("salary.min")
    .optional()
    .isNumeric()
    .withMessage("Minimum salary must be a number"),
  body("salary.max")
    .optional()
    .isNumeric()
    .withMessage("Maximum salary must be a number"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("jobType")
    .isIn(["Full-time", "Part-time", "Contract", "Remote"])
    .withMessage("Invalid job type (use one of: Full-time, Part-time, Contract, Remote)"),
];

// Candidate validation rules
export const candidateValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("phone")
    .optional()
    .matches(/^[0-9+\-() ]+$/)
    .withMessage("Invalid phone number"),
  body("university")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("University name is too long"),
  body("skills").optional().isArray().withMessage("Skills must be an array"),
  body("experience")
    .optional()
    .isNumeric()
    .withMessage("Experience must be a number"),
  body("experienceLevel")
    .optional()
    .isIn(["Entry", "Junior", "Mid", "Senior", "Lead"])
    .withMessage("Invalid experience level"),
];

// Company validation rules
export const companyValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Name must be between 2 and 200 characters"),
  body("industry").trim().notEmpty().withMessage("Industry is required"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description is too long"),
  body("website").optional().trim().isURL().withMessage("Invalid website URL"),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Location is too long"),
  body("size")
    .optional()
    .isIn(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"])
    .withMessage("Invalid company size"),
  body("founded")
    .optional()
    .isNumeric()
    .withMessage("Founded year must be a number")
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage("Invalid founded year"),
];

// Application validation rules
export const applicationValidation = [
  body("candidateId")
    .notEmpty()
    .withMessage("Candidate ID is required")
    .isMongoId()
    .withMessage("Invalid candidate ID"),
  body("jobId")
    .notEmpty()
    .withMessage("Job ID is required")
    .isMongoId()
    .withMessage("Invalid job ID"),
  body("matchPercentage")
    .optional()
    .isNumeric()
    .withMessage("Match percentage must be a number")
    .isInt({ min: 0, max: 100 })
    .withMessage("Match percentage must be between 0 and 100"),
];

// Notification validation rules
export const notificationValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Notification title is required")
    .isLength({ max: 200 })
    .withMessage("Title is too long"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Notification message is required")
    .isLength({ max: 500 })
    .withMessage("Message is too long"),
  body("type")
    .isIn(["application", "interview", "system", "message"])
    .withMessage("Invalid notification type"),
  body("link")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Link is too long"),
];
