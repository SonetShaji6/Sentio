import * as analyticsService from "./analyticsService";
import { aiService } from "../ai/AIService";

export async function generateSessionInsights(
  sessionId: string,
  userId: string,
) {
  // 1. Fetch raw data from analytics service
  const sessionOverview = await analyticsService.getSessionOverview(sessionId);
  if (!sessionOverview) {
    throw new Error("Session not found or access denied");
  }

  const participationMetrics =
    await analyticsService.getParticipationMetrics(sessionId);
  const quizMetrics = await analyticsService.getQuizMetrics(sessionId);
  const timeline = await analyticsService.getTimeline(sessionId);

  // Take the last 10 minutes of timeline for immediate context
  const recentTimeline = timeline.slice(-10);

  // 2. Pass the aggregated raw data to the AI Service
  const aiInsights = await aiService.analyzeEngagement(
    sessionOverview,
    quizMetrics,
    recentTimeline,
  );

  return {
    ...aiInsights,
    generatedAt: new Date().toISOString(),
    sessionId,
  };
}
