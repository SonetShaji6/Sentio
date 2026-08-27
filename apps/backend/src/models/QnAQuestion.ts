import mongoose, { Schema, Document } from "mongoose";

export interface IQnAQuestion extends Document {
  sessionId: mongoose.Types.ObjectId;
  participantId: string;
  displayName: string;
  questionText: string;
  answerText?: string;
  answeredBy?: string;
  answeredAt?: Date;
  status: "pending" | "pinned" | "resolved" | "hidden";
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const QnAQuestionSchema = new Schema<IQnAQuestion>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    participantId: { type: String, required: true },
    displayName: { type: String, required: true },
    questionText: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    answerText: { type: String, trim: true, default: "" },
    answeredBy: { type: String, default: "" },
    answeredAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "pinned", "resolved", "hidden"],
      default: "pending",
    },
    upvotes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Indexes
QnAQuestionSchema.index({ sessionId: 1, status: 1 });
QnAQuestionSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.model<IQnAQuestion>("QnAQuestion", QnAQuestionSchema);
