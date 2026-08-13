import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  target?: string;
  details?: any;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    target: { type: String },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
