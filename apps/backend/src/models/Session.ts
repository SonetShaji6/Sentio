import mongoose, { Schema, Document } from "mongoose";

export interface IParticipant {
  socketId: string;
  displayName: string;
  joinedAt: Date;
  isOnline: boolean;
  score: number; // For leaderboard
  responses: any[]; // Legacy — keep for backward compat
}

export interface ISession extends Document {
  presentationId?: mongoose.Types.ObjectId; // For presentation sessions
  experienceId?: mongoose.Types.ObjectId; // For experience sessions
  status: "waiting" | "live" | "paused" | "ended";
  currentSlideIndex?: number; // Slide index
  currentConceptId?: string; // Replaces currentSlideIndex
  currentChallengeId?: mongoose.Types.ObjectId; // The active challenge
  joinCode: string;
  hostSocketId?: string;
  participants: IParticipant[];
  responseLocked: boolean;
  slideResponseLocks: Map<string, boolean>;
  reactionCounts: any; // { slideId: { emoji: count } }
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    socketId: { type: String, required: true },
    displayName: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: true },
    score: { type: Number, default: 0 },
    responses: { type: Schema.Types.Mixed, default: [] },
  },
  { _id: false },
);

const SessionSchema = new Schema<ISession>(
  {
    presentationId: {
      type: Schema.Types.ObjectId,
      ref: "Presentation",
      index: true,
    },
    experienceId: {
      type: Schema.Types.ObjectId,
      ref: "Experience",
      index: true,
    },
    status: {
      type: String,
      enum: ["waiting", "live", "paused", "ended"],
      default: "waiting",
    },
    currentSlideIndex: { type: Number, default: 0 },
    currentConceptId: { type: String },
    currentChallengeId: { type: Schema.Types.ObjectId, ref: "Challenge" },
    joinCode: { type: String, required: true, unique: true, index: true },
    hostSocketId: { type: String },
    participants: [ParticipantSchema],
    responseLocked: { type: Boolean, default: false },
    slideResponseLocks: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
    reactionCounts: { type: Schema.Types.Mixed, default: {} },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

// Indexes for fast querying
SessionSchema.index({ status: 1 });
SessionSchema.index({ experienceId: 1, status: 1 });

export default mongoose.model<ISession>("Session", SessionSchema);
