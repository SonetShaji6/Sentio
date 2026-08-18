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
  bulletPoints?: string[];
  kicker?: string;
  author?: string;
  authorRole?: string;
  lowLabel?: string;
  highLabel?: string;
  timer?: number | null;
  autoNext?: boolean;
  allowMultiple?: boolean;
  ratingRange?: { min: number; max: number; type: "star" | "numeric" };
  charLimit?: number;
  callToAction?: string;
  mediaUrl?: string;
  mediaPosition?:
    "right" | "left" | "top" | "bottom" | "background" | "custom" | "card";
  mediaAlt?: string;
  mediaWidth?: number; // width percentage: 20 to 100
  mediaHeight?: number; // height in px or percentage
  mediaX?: number; // X position percentage for floating: 0 to 100
  mediaY?: number; // Y position percentage for floating: 0 to 100
  mediaFit?: "cover" | "contain" | "fill";
  mediaRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  mediaShadow?: "none" | "sm" | "md" | "lg" | "2xl" | "glow";
  mediaOpacity?: number; // 10 to 100
  fontFamily?: "sans" | "serif" | "mono" | "display";
  textColor?: string;
  textMutedColor?: string;
  bgColor?: string;
  cardBgColor?: string;
  accentColor?: string;
  fontSize?: "small" | "normal" | "large" | "huge";
  align?: "left" | "center" | "right";
  layoutStyle?: "standard" | "split" | "centered" | "card";
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
