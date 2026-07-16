import mongoose, { Schema, Document } from "mongoose";
import type { UserRole } from "@sentio/shared";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: UserRole;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    avatar: { type: String },
    role: {
      type: String,
      enum: ["admin", "presenter", "participant"],
      default: "presenter",
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>("User", UserSchema);
