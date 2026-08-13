// ── Interaction Types ──

export type InteractionType =
  "poll" | "quiz" | "wordcloud" | "opentext" | "rating";

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

// ── Submission Payloads (client → server) ──

export interface InteractionSubmitPayload {
  joinCode: string;
  slideId: string;
  type: InteractionType;
  payload:
    PollAnswer | QuizAnswer | WordCloudWord | OpenTextAnswer | RatingAnswer;
}

export interface PollAnswer {
  selectedOptions: number[]; // indexes of selected options
}

export interface QuizAnswer {
  selectedOptions: number[];
  responseTimeMs: number; // time taken to answer in ms
}

export interface WordCloudWord {
  word: string;
}

export interface OpenTextAnswer {
  text: string;
}

export interface RatingAnswer {
  rating: number;
}

// ── Result Payloads (server → client) ──

export interface PollResult {
  slideId: string;
  totalResponses: number;
  optionCounts: number[]; // count for each option index
  optionPercentages: number[];
  participationPercentage: number;
}

export interface QuizResult {
  slideId: string;
  totalResponses: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number; // percentage
  averageTimeMs: number;
}

export interface WordCloudResult {
  slideId: string;
  totalSubmissions: number;
  words: WordFrequency[];
}

export interface WordFrequency {
  word: string;
  displayWord: string; // original casing
  count: number;
}

export interface OpenTextResult {
  slideId: string;
  totalResponses: number;
  responses: OpenTextResponseItem[];
}

export interface OpenTextResponseItem {
  id: string;
  displayName: string;
  text: string;
  status: "visible" | "hidden" | "highlighted" | "approved";
  createdAt: string;
}

export interface RatingResult {
  slideId: string;
  totalResponses: number;
  average: number;
  min: number;
  max: number;
  distribution: Record<number, number>; // rating value → count
}

// ── Leaderboard ──

export interface LeaderboardEntry {
  displayName: string;
  score: number;
  rank: number;
  correctCount: number;
  totalQuestions: number;
  averageTimeMs: number;
}

// ── Emoji Reactions ──

export type EmojiType = "👍" | "❤️" | "👏" | "😂" | "😮";

export const EMOJI_SET: EmojiType[] = ["👍", "❤️", "👏", "😂", "😮"];

export interface ReactionPayload {
  joinCode: string;
  slideId: string;
  emoji: EmojiType;
}

export interface ReactionCounts {
  slideId: string;
  counts: Record<string, number>; // emoji → count
}

// ── Q&A ──

export interface QnASubmitPayload {
  joinCode: string;
  questionText: string;
}

export interface QnAModeratePayload {
  joinCode: string;
  questionId: string;
  action: "pin" | "resolve" | "hide";
}

export interface QnAQuestionItem {
  id: string;
  displayName: string;
  questionText: string;
  status: "pending" | "pinned" | "resolved" | "hidden";
  upvotes: number;
  createdAt: string;
}

// ── Slide Data (server → audience) ──

export interface SlideData {
  slideId: string;
  type: SlideType;
  title: string;
  description: string;
  config: {
    options?: string[];
    allowMultiple?: boolean;
    timer?: number | null;
    ratingRange?: { min: number; max: number; type?: string };
    charLimit?: number;
    points?: number;
    [key: string]: any;
  };
  responseLocked: boolean;
}

// ── Analytics ──

export interface SessionOverview {
  sessionId: string;
  presentationTitle: string;
  status: string;
  totalParticipants: number;
  activeParticipants: number;
  participationRate: number;
  totalResponses: number;
  totalSlides: number;
  interactiveSlides: number;
  engagementScore: number;
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number;
}

export interface ParticipationMetric {
  slideId: string;
  slideTitle: string;
  slideType: string;
  responseCount: number;
  responseRate: number;
}

export interface QuizMetrics {
  totalQuizSlides: number;
  totalQuizParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageAccuracy: number;
  averageResponseTimeMs: number;
  completionRate: number;
  questionPerformance: QuestionPerformance[];
}

export interface QuestionPerformance {
  slideId: string;
  slideTitle: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
  averageTimeMs: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface EngagementBreakdown {
  overall: number;
  participationRate: number;
  responseFrequency: number;
  quizParticipation: number;
  qnaParticipation: number;
  reactionActivity: number;
  completionRate: number;
}

export interface TimelineEvent {
  timestamp: string;
  type: "join" | "response" | "reaction" | "qna" | "slide_change";
  count: number;
}
