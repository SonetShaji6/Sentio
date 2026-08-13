import mongoose, { Schema, Document } from "mongoose";

export interface IChallenge extends Document {
  experience: mongoose.Types.ObjectId;
  conceptId: string; // Refers to a nodeId in Experience.conceptGraph
  type: "quiz" | "scenario" | "open-ended" | "roleplay";
  prompt: string; // The text or context shown to the participant
  content: any; // Mixed payload for options, correct answers, evaluation rubrics
  adaptiveSettings: {
    difficultyLevel: number; // e.g. 1-10
    prerequisites: string[]; // Specific conditions to show this challenge
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    experience: {
      type: Schema.Types.ObjectId,
      ref: "Experience",
      required: true,
    },
    conceptId: { type: String, required: true },
    type: {
      type: String,
      enum: ["quiz", "scenario", "open-ended", "roleplay"],
      required: true,
    },
    prompt: { type: String, required: true },
    content: { type: Schema.Types.Mixed },
    adaptiveSettings: {
      difficultyLevel: { type: Number, default: 5 },
      prerequisites: [{ type: String }],
    },
  },
  { timestamps: true },
);

ChallengeSchema.index({ experience: 1, conceptId: 1 });

export default mongoose.model<IChallenge>("Challenge", ChallengeSchema);
