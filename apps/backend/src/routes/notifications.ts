import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import Notification from "../models/Notification";

const router = Router();

// Get all notifications for current user
router.get("/", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.patch(
  "/:id/read",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const userId = req.user!.id;
      const notificationId = req.params.id;

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true },
        { new: true },
      );

      if (!notification) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      res.json(notification);
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  },
);

// Mark all notifications as read
router.post(
  "/mark-all-read",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const userId = req.user!.id;
      await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true },
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res
        .status(500)
        .json({ error: "Failed to mark all notifications as read" });
    }
  },
);

export default router;
