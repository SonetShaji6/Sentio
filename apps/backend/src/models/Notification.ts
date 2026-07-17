import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type:
    | "presentation_update"
    | "report_status"
    | "ai_status"
    | "system_announcement";
  title: string;
  message: string;
  isRead: boolean;
  relatedResource?: string; // e.g. presentation ID
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "presentation_update",
        "report_status",
        "ai_status",
        "system_announcement",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedResource: { type: String },
  },
  { timestamps: true },
);

// Index for efficiently fetching a user's unread/recent notifications
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
