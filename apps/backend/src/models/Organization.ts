import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  logo?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    logo: { type: String },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

OrganizationSchema.index({ owner: 1 });

export default mongoose.model<IOrganization>(
  "Organization",
  OrganizationSchema,
);
