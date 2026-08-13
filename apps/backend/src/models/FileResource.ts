import mongoose, { Schema, Document } from "mongoose";

export interface IFileResource extends Document {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  owner: mongoose.Types.ObjectId;
  presentationId?: mongoose.Types.ObjectId;
  category: "presentation" | "document" | "image" | "reference";
  storagePath: string;
  fileUrl: string;
  status: "UPLOADING" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
  extractionStatus: "PENDING" | "COMPLETED" | "UNSUPPORTED" | "FAILED";
  extractedText?: string;
  extractedMetadata?: {
    slideCount?: number;
    wordCount?: number;
    keywords?: string[];
  };
  version: number;
  parentFileId?: mongoose.Types.ObjectId;
  isLatestVersion: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileResourceSchema = new Schema<IFileResource>(
  {
    originalName: { type: String, required: true, trim: true },
    storedName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    presentationId: { type: Schema.Types.ObjectId, ref: "Presentation" },
    category: {
      type: String,
      enum: ["presentation", "document", "image", "reference"],
      default: "document",
    },
    storagePath: { type: String, required: true },
    fileUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["UPLOADING", "UPLOADED", "PROCESSING", "READY", "FAILED"],
      default: "PROCESSING",
    },
    extractionStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "UNSUPPORTED", "FAILED"],
      default: "PENDING",
    },
    extractedText: { type: String, default: "" },
    extractedMetadata: {
      slideCount: { type: Number },
      wordCount: { type: Number },
      keywords: [{ type: String }],
    },
    version: { type: Number, default: 1 },
    parentFileId: { type: Schema.Types.ObjectId, ref: "FileResource" },
    isLatestVersion: { type: Boolean, default: true },
  },
  { timestamps: true },
);

FileResourceSchema.index({ owner: 1, createdAt: -1 });
FileResourceSchema.index({ presentationId: 1 });
FileResourceSchema.index({ category: 1 });
FileResourceSchema.index({ status: 1 });
FileResourceSchema.index({ originalName: "text", extractedText: "text" });

export default mongoose.model<IFileResource>(
  "FileResource",
  FileResourceSchema,
);
