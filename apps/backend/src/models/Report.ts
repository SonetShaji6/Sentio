import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  user: mongoose.Types.ObjectId;
  presentationId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  title: string;
  type: "full" | "summary" | "analytics";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  fileFormat: "pdf" | "csv" | "json";
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    presentationId: {
      type: Schema.Types.ObjectId,
      ref: "Presentation",
      required: true,
    },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["full", "summary", "analytics"],
      default: "full",
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    fileFormat: {
      type: String,
      enum: ["pdf", "csv", "json"],
      required: true,
    },
    fileUrl: { type: String },
    fileSize: { type: Number, default: 0 },
    error: { type: String },
  },
  { timestamps: true },
);

ReportSchema.index({ user: 1, createdAt: -1 });
ReportSchema.index({ presentationId: 1, createdAt: -1 });
ReportSchema.index({ sessionId: 1 });

export default mongoose.model<IReport>("Report", ReportSchema);
