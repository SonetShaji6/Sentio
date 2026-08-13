import mongoose, { Schema, Document } from "mongoose";

export interface IOrganizationMember extends Document {
  organization: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

OrganizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });
OrganizationMemberSchema.index({ user: 1 });

export default mongoose.model<IOrganizationMember>(
  "OrganizationMember",
  OrganizationMemberSchema,
);
