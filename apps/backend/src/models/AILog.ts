import mongoose, { Schema, Document } from "mongoose";

export interface IAILog extends Document {
  user?: mongoose.Types.ObjectId;
  organization?: mongoose.Types.ObjectId;
  endpoint: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: "success" | "error";
  createdAt: Date;
}

const AILogSchema = new Schema<IAILog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    organization: { type: Schema.Types.ObjectId, ref: "Organization" },
    endpoint: { type: String, required: true },
    modelName: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    status: { type: String, enum: ["success", "error"], default: "success" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AILogSchema.index({ createdAt: -1 });
AILogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IAILog>("AILog", AILogSchema);
