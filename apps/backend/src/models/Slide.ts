import mongoose, { Schema, Document } from "mongoose";

export interface ISlide extends Document {
  presentationId: mongoose.Types.ObjectId;
  type: string;
  order: number;
  title: string;
  description: string;
  config: any;
  isHidden: boolean;
  isLocked: boolean;
  themeOverrides?: any;
  createdAt: Date;
  updatedAt: Date;
}

const SlideSchema = new Schema<ISlide>(
  {
    presentationId: {
      type: Schema.Types.ObjectId,
      ref: "Presentation",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "title",
        "information",
        "question",
        "poll",
        "quiz",
        "rating",
        "wordcloud",
        "opentext",
        "imagepoll",
        "leaderboard",
        "thankyou",
      ],
      required: true,
      default: "title",
    },
    order: { type: Number, required: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    config: { type: Schema.Types.Mixed, default: {} },
    isHidden: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    themeOverrides: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Indexes
SlideSchema.index({ presentationId: 1, order: 1 });

export default mongoose.model<ISlide>("Slide", SlideSchema);
