import mongoose, { Schema, Document } from "mongoose";

export interface IParticipantState extends Document {
  session: mongoose.Types.ObjectId; // Refers to the live Session
  participantId: string; // E.g. socket ID or authenticated user ID
  displayName: string;
  comprehensionScore: number; // Aggregate score based on their performance (0-100)
  currentConceptId?: string; // Concept they are currently being tested on
  answeredChallenges: {
    challengeId: mongoose.Types.ObjectId;
    response: any;
    isCorrect: boolean;
    scoreGiven: number;
    timestamp: Date;
  }[];
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnsweredChallengeSchema = new Schema(
  {
    challengeId: {
      type: Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },
    response: { type: Schema.Types.Mixed },
    isCorrect: { type: Boolean, default: false },
    scoreGiven: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ParticipantStateSchema = new Schema<IParticipantState>(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    participantId: { type: String, required: true },
    displayName: { type: String, required: true },
    comprehensionScore: { type: Number, default: 0 },
    currentConceptId: { type: String },
    answeredChallenges: [AnsweredChallengeSchema],
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ParticipantStateSchema.index(
  { session: 1, participantId: 1 },
  { unique: true },
);

export default mongoose.model<IParticipantState>(
  "ParticipantState",
  ParticipantStateSchema,
);
