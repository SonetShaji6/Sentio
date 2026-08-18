export type SlideType =
  | "title"
  | "information"
  | "question"
  | "poll"
  | "quiz"
  | "rating"
  | "wordcloud"
  | "opentext"
  | "imagepoll"
  | "leaderboard"
  | "thankyou";

export interface SlideConfig {
  options?: any[];
  correctAnswers?: any[];
  points?: number;
  timer?: number | null;
  autoNext?: boolean;
  allowMultiple?: boolean;
  ratingRange?: { min: number; max: number; type: "star" | "numeric" };
  charLimit?: number;
  callToAction?: string;
  mediaUrl?: string;
  [key: string]: any; // Allow extensibility
}

export interface SlideElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  properties?: any;
  interactionConfig?: any;
}

export interface ISlide {
  _id: string;
  presentationId: string;
  type: SlideType;
  order: number;
  title: string;
  description: string;
  config: SlideConfig;
  isHidden: boolean;
  isLocked: boolean;
  themeOverrides?: any;
  elements?: SlideElement[];
  createdAt: string;
  updatedAt: string;
}
