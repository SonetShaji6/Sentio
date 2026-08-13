import mongoose, { Schema, Document } from "mongoose";

export interface IConceptNode {
  nodeId: string;
  label: string;
  description?: string;
  prerequisites?: string[]; // nodeIds of prerequisite concepts
}

export interface IConceptGraph {
  nodes: IConceptNode[];
  edges: { source: string; target: string; type: string }[];
}

export interface IExperience extends Document {
  owner: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  visibility: "private" | "unlisted" | "public";
  tags: string[];
  theme: any;
  status: "draft" | "published" | "live" | "completed" | "archived";
  mode: "adaptive" | "linear";
  conceptGraph: IConceptGraph;
  coverImage?: string;
  pdfUrl?: string;
  shareId: string;
  sessionCode?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConceptNodeSchema = new Schema<IConceptNode>(
  {
    nodeId: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String },
    prerequisites: [{ type: String }],
  },
  { _id: false },
);

const ConceptGraphSchema = new Schema<IConceptGraph>(
  {
    nodes: [ConceptNodeSchema],
    edges: [
      {
        source: { type: String, required: true },
        target: { type: String, required: true },
        type: { type: String, default: "requires" },
      },
    ],
  },
  { _id: false },
);

const ExperienceSchema = new Schema<IExperience>(
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
    mode: {
      type: String,
      enum: ["adaptive", "linear"],
      default: "adaptive",
    },
    conceptGraph: {
      type: ConceptGraphSchema,
      default: { nodes: [], edges: [] },
    },
    coverImage: { type: String },
    pdfUrl: { type: String },
    shareId: { type: String, required: true, unique: true },
    sessionCode: { type: String, sparse: true, unique: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

// Indexes for common queries
ExperienceSchema.index({ owner: 1, isDeleted: 1, updatedAt: -1 });
ExperienceSchema.index({ sessionCode: 1 }, { sparse: true });

export default mongoose.model<IExperience>("Experience", ExperienceSchema);
