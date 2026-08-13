import mongoose, { Schema, Document } from "mongoose";

export interface IInteraction extends Document {
  sessionId: mongoose.Types.ObjectId;
  slideId: mongoose.Types.ObjectId;
  participantId: string; // socketId-based composite key
  displayName: string;
  type: "poll" | "quiz" | "wordcloud" | "opentext" | "rating";
  payload: any; // type-specific answer data
  isCorrect?: boolean; // quiz only
  score?: number; // quiz only
  responseTimeMs?: number; // quiz only
  status: "visible" | "hidden" | "highlighted" | "approved";
  createdAt: Date;
  updatedAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    slideId: {
      type: Schema.Types.ObjectId,
      ref: "Slide",
      required: true,
    },
    participantId: { type: String, required: true },
    displayName: { type: String, required: true },
    type: {
      type: String,
      enum: ["poll", "quiz", "wordcloud", "opentext", "rating"],
      required: true,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    isCorrect: { type: Boolean },
    score: { type: Number },
    responseTimeMs: { type: Number },
    status: {
      type: String,
      enum: ["visible", "hidden", "highlighted", "approved"],
      default: "visible",
    },
  },
  { timestamps: true },
);

// Compound indexes for efficient queries
InteractionSchema.index({ sessionId: 1, slideId: 1 });
InteractionSchema.index({ sessionId: 1, slideId: 1, participantId: 1 });
InteractionSchema.index({ sessionId: 1, type: 1 });
InteractionSchema.index({ sessionId: 1, createdAt: 1 });

export default mongoose.model<IInteraction>("Interaction", InteractionSchema);
