import mongoose, { Schema, Document } from "mongoose";

export interface IParticipant {
  socketId: string;
  displayName: string;
  joinedAt: Date;
  isOnline: boolean;
  score: number; // For leaderboard
  responses: any[]; // Store their answers
}

export interface ISession extends Document {
  presentationId: mongoose.Types.ObjectId;
  status: "waiting" | "live" | "paused" | "ended";
  currentSlideIndex: number;
  joinCode: string;
  hostSocketId?: string;
  participants: IParticipant[];
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
    responses: { type: Array, default: [] },
  },
  { _id: false },
);

const SessionSchema = new Schema<ISession>(
  {
    presentationId: {
      type: Schema.Types.ObjectId,
      ref: "Presentation",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["waiting", "live", "paused", "ended"],
      default: "waiting",
    },
    currentSlideIndex: { type: Number, default: 0 },
    joinCode: { type: String, required: true, unique: true, index: true },
    hostSocketId: { type: String },
    participants: [ParticipantSchema],
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

// Optional: Index on status for active sessions query
SessionSchema.index({ status: 1 });

export default mongoose.model<ISession>("Session", SessionSchema);
