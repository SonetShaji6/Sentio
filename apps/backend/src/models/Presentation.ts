import mongoose, { Schema, Document } from "mongoose";

export interface IPresentationVersion {
  versionId: string;
  createdAt: Date;
  title: string;
  description: string;
  contentSnapshot: any; // We'll keep this generic for now until the editor module defines the exact slide structure
}

export interface IPresentation extends Document {
  owner: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  visibility: "private" | "unlisted" | "public";
  tags: string[];
  theme: any;
  status: "draft" | "published" | "live" | "completed" | "archived";
  coverImage?: string;
  pdfUrl?: string;
  shareId: string;
  sessionCode?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  versionHistory: IPresentationVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const PresentationVersionSchema = new Schema<IPresentationVersion>(
  {
    versionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    contentSnapshot: { type: Schema.Types.Mixed }, // Store arbitrary JSON representation of slides
  },
  { _id: false },
);

const PresentationSchema = new Schema<IPresentation>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, default: "General" },
    visibility: {
      type: String,
      enum: ["private", "unlisted", "public"],
      default: "private",
    },
    tags: [{ type: String, trim: true }],
    theme: {
      type: Schema.Types.Mixed,
      default: {
        id: "light",
        name: "Light Mode",
        bg: "#ffffff",
        text: "#111827",
        primary: "#3b82f6",
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "live", "completed", "archived"],
      default: "draft",
    },
    coverImage: { type: String },
    pdfUrl: { type: String },
    shareId: { type: String, required: true, unique: true },
    sessionCode: { type: String, sparse: true, unique: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    versionHistory: [PresentationVersionSchema],
  },
  { timestamps: true },
);

// Indexes for common queries
PresentationSchema.index({ owner: 1, isDeleted: 1, updatedAt: -1 });
PresentationSchema.index({ shareId: 1 });
PresentationSchema.index({ sessionCode: 1 });

export default mongoose.model<IPresentation>(
  "Presentation",
  PresentationSchema,
);
