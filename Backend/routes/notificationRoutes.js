import express from "express";
import {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  notificationValidation,
  validate,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route("/")
  .get(getNotifications)
  .post(notificationValidation, validate, createNotification)
  .delete(deleteAllNotifications);

router.get("/unread-count", getUnreadCount);
router.put("/mark-all-read", markAllAsRead);

router.route("/:id").put(markAsRead).delete(deleteNotification);

export default router;
