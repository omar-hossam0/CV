import express from "express";
import multer from "multer";
import {
  register,
  login,
  getMyProfile,
  updateMyProfile,
  updateMyPassword,
  deleteMyAccount,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadProfileImage,
} from "../controllers/authController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

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

// ============================================
// Public Routes (مفتوحة للجميع)
// ============================================
router.post("/register", register);
router.post("/login", login);

// ============================================
// User Dashboard Routes (محمية - أي مستخدم مسجل)
// ============================================
router.get("/me", verifyToken, getMyProfile);
router.put("/me", verifyToken, updateMyProfile);
router.post(
  "/me/upload-image",
  verifyToken,
  upload.single("profileImage"),
  uploadProfileImage
);
router.patch("/me/password", verifyToken, updateMyPassword);
router.delete("/me", verifyToken, deleteMyAccount);

// ============================================
// HR Dashboard Routes (محمية - HR فقط)
// ============================================
router.get("/users", verifyToken, requireRole(["hr"]), getAllUsers);
router.get("/users/:id", verifyToken, requireRole(["hr"]), getUserById);
router.put("/users/:id", verifyToken, requireRole(["hr"]), updateUser);
router.delete("/users/:id", verifyToken, requireRole(["hr"]), deleteUser);

export default router;
