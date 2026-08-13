import mongoose, { Schema, Document } from "mongoose";

export interface IOrganizationInvitation extends Document {
  organization: mongoose.Types.ObjectId;
  email: string;
  role: "admin" | "member";
  token: string;
  invitedBy: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: Date;
  createdAt: Date;
}

const OrganizationInvitationSchema = new Schema<IOrganizationInvitation>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

OrganizationInvitationSchema.index({ organization: 1, email: 1 });

export default mongoose.model<IOrganizationInvitation>(
  "OrganizationInvitation",
  OrganizationInvitationSchema,
);
