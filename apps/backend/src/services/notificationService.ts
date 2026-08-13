import Notification, { INotification } from "../models/Notification";
import User from "../models/User";
import { sendNotificationEmail } from "./email";
import { SOCKET_EVENTS } from "@sentio/shared";

export async function createNotification(
  userId: string,
  data: {
    type:
      | "presentation_update"
      | "report_status"
      | "ai_status"
      | "system_announcement";
    title: string;
    message: string;
    relatedResource?: string;
  },
  io?: any,
): Promise<INotification | null> {
  const user = await User.findById(userId);
  if (!user || user.isBlocked) return null;

  // Check preferences
  const prefs = user.preferences?.notifications;
  if (prefs) {
    if (data.type === "ai_status" && prefs.aiStatus === false) return null;
    if (data.type === "report_status" && prefs.reportReady === false)
      return null;
    if (
      data.type === "system_announcement" &&
      prefs.systemAnnouncements === false
    )
      return null;
  }

  const notification = new Notification({
    user: userId,
    type: data.type,
    title: data.title,
    message: data.message,
    relatedResource: data.relatedResource,
    isRead: false,
  });

  await notification.save();

  // Socket.IO real-time delivery to user room
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION, notification);
  }

  // Email notification dispatch if email preference is true
  if (prefs?.email !== false && user.email) {
    sendNotificationEmail(user.email, data.title, data.message).catch((err) =>
      console.warn("Failed to dispatch notification email:", err),
    );
  }

  return notification;
}

export async function clearReadNotifications(userId: string) {
  await Notification.deleteMany({ user: userId, isRead: true });
}
