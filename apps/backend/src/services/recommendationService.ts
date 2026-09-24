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

export interface LiveRecommendationPayload {
  sessionId?: string;
  presentationId?: string;
  currentSlide: any;
  results?: any;
  audienceCount?: number;
  deckTitle?: string;
}

export async function generateLiveRecommendation({
  sessionId,
  presentationId,
  currentSlide,
  results,
  audienceCount = 0,
  deckTitle = "Interactive Deck",
}: LiveRecommendationPayload) {
  // 1. Calculate deterministic real-time participation & correctness metrics
  const totalResponses =
    results?.totalResponses ??
    results?.totalSubmissions ??
    (Array.isArray(results?.responses) ? results.responses.length : 0);

  const participationRate =
    audienceCount > 0
      ? Math.min(100, Math.round((totalResponses / audienceCount) * 100))
      : 0;

  const isQuiz = currentSlide?.type === "quiz";
  const isPoll = currentSlide?.type === "poll";

  let accuracyRate: number | null = null;
  let isEveryoneCorrect: boolean = false;
  let correctVotes = 0;
  let topDistractor: string | null = null;

  if (isQuiz && results?.optionCounts) {
    const correctIndices: number[] =
      results?.correctAnswers || currentSlide?.config?.correctAnswers || [];

    let maxWrongCount = 0;
    let maxWrongIndex = -1;

    Object.entries(results.optionCounts).forEach(
      ([key, count]: [string, any]) => {
        const idx = parseInt(key);
        const voteCount = Number(count) || 0;
        if (correctIndices.includes(idx)) {
          correctVotes += voteCount;
        } else {
          if (voteCount > maxWrongCount) {
            maxWrongCount = voteCount;
            maxWrongIndex = idx;
          }
        }
      },
    );

    accuracyRate =
      totalResponses > 0
        ? Math.round((correctVotes / totalResponses) * 100)
        : null;
    isEveryoneCorrect = totalResponses > 0 && accuracyRate === 100;

    if (maxWrongIndex >= 0 && currentSlide?.config?.options?.[maxWrongIndex]) {
      topDistractor = currentSlide.config.options[maxWrongIndex];
    }
  }

  const calculatedMetrics = {
    totalResponses,
    audienceCount,
    participationRate,
    accuracyRate,
    isEveryoneCorrect,
    topDistractor,
    isQuiz,
    isPoll,
  };

  // 2. Query Gemini / Groq for nuanced real-time recommendations
  try {
    const aiResult = await aiService.generateLiveRecommendation(
      currentSlide,
      results,
      audienceCount,
      deckTitle,
      calculatedMetrics,
    );

    return {
      ...aiResult,
      participationRate,
      accuracyRate,
      isEveryoneCorrect,
      totalResponses,
      audienceCount,
      generatedAt: new Date().toISOString(),
      slideId: currentSlide?._id,
    };
  } catch (error) {
    console.warn(
      "[recommendationService] AI live recommendation fallback triggered:",
      error,
    );

    // Rule-based high quality fallback
    let verdict = "Good Pacing";
    let summary =
      "Audience is following along nicely. Continue with the planned presentation flow.";
    let pacingAdvice = "Maintain your current pace and invite questions.";
    const suggestedSlides: any[] = [];
    const questionImprovements: any[] = [];

    if (isQuiz) {
      if (accuracyRate !== null && accuracyRate < 50) {
        verdict = "Knowledge Gap Detected";
        summary = `Only ${accuracyRate}% answered correctly. ${topDistractor ? `Most struggled with "${topDistractor}".` : "The concept needs clarification."}`;
        pacingAdvice =
          "Pause and clarify the core misunderstanding before moving on.";
        questionImprovements.push({
          original: currentSlide?.title || "Current Quiz",
          improved: `Clarify: What makes ${currentSlide?.config?.options?.[currentSlide?.config?.correctAnswers?.[0] || 0] || "the correct answer"} distinct?`,
          reason: "Directly addresses the distractor chosen by the audience.",
        });
        suggestedSlides.push({
          title: `Recap: ${currentSlide?.title || "Key Concept"} Clarified`,
          type: "teaching",
          description: "Clear up the misconception identified in the quiz",
          config: {
            bulletPoints: [
              `Common pitfall: ${topDistractor || "Confusing similar options"}`,
              `Correct mechanism: Key takeaway`,
              "Why this distinction matters in practice",
            ],
          },
        });
        suggestedSlides.push({
          title: "Quick Check: Did that make sense?",
          type: "poll",
          description: "Verify audience feels confident after explanation",
          config: {
            question: "Is this concept clearer now?",
            options: [
              "Crystal clear now!",
              "Still a bit fuzzy",
              "Need another example",
            ],
          },
        });
      } else if (
        isEveryoneCorrect ||
        (accuracyRate !== null && accuracyRate >= 85)
      ) {
        verdict = "High Mastery";
        summary = `Outstanding understanding! ${accuracyRate}% of participants answered correctly.`;
        pacingAdvice =
          "Audience is sharp and engaged. You can accelerate or provide an advanced tip.";
        suggestedSlides.push({
          title: "Bonus Challenge: Take It Further",
          type: "quiz",
          description: "Optional advanced challenge while energy is high",
          config: {
            question: `Advanced: What is the next logical step beyond ${currentSlide?.title || "this"}?`,
            options: [
              "Optimization phase",
              "Direct implementation",
              "Edge case validation",
              "All of the above",
            ],
            correctAnswers: [3],
          },
        });
      }
    } else if (isPoll) {
      verdict = "Active Discussion";
      summary = `Poll engagement received ${totalResponses} responses (${participationRate}% participation).`;
      pacingAdvice =
        "Highlight the leading opinion and invite 1-2 audience members to share why.";
      suggestedSlides.push({
        title: "Audience Perspectives: Open Floor",
        type: "opentext",
        description: "Let participants share the reasoning behind their votes",
        config: {
          prompt:
            "Why did you vote for your choice? Share a 1-sentence thought:",
        },
      });
    }

    if (audienceCount > 3 && participationRate < 40) {
      verdict = "Low Participation";
      summary = `Only ${participationRate}% of attendees submitted. Some may need an extra moment or prompt.`;
      pacingAdvice =
        "Give 15 more seconds and verbally remind the room to tap their screens.";
      suggestedSlides.push({
        title: "Quick Pulse: How's the Pace?",
        type: "rating",
        description: "Low-friction rating to wake up the audience",
        config: {
          question: "How is the speed of this presentation so far?",
          scale: 5,
        },
      });
    }

    return {
      verdict,
      sentiment:
        accuracyRate !== null && accuracyRate < 50 ? "Confused" : "Engaged",
      summary,
      pacingAdvice,
      participationRate,
      accuracyRate,
      isEveryoneCorrect,
      totalResponses,
      audienceCount,
      questionImprovements,
      suggestedSlides,
      slideUpdates: {
        suggestedTitle: currentSlide?.title,
        clarificationNote: topDistractor
          ? `Tip: Point out why "${topDistractor}" is tempting but incorrect.`
          : "Tip: Summarize the core takeaway in 1 sentence.",
      },
      generatedAt: new Date().toISOString(),
      slideId: currentSlide?._id,
    };
  }
}
