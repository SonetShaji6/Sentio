import Session from "../models/Session";
import Interaction from "../models/Interaction";
import Slide from "../models/Slide";
import QnAQuestion from "../models/QnAQuestion";
import Presentation from "../models/Presentation";
import {
  getLeaderboard,
  getPollResults,
  getQuizResults,
  getWordCloudResults,
  getOpenTextResults,
  getRatingResults,
} from "./interactionService";

// ── Interactive slide types ──
const INTERACTIVE_TYPES = [
  "poll",
  "quiz",
  "wordcloud",
  "opentext",
  "rating",
  "imagepoll",
];

// ── Session Overview ──

export async function getSessionOverview(sessionId: string): Promise<any> {
  const session = await Session.findById(sessionId).populate("presentationId");
  if (!session) return null;

  const presentation = await Presentation.findById(session.presentationId);
  const slides = await Slide.find({ presentationId: session.presentationId });
  const interactiveSlides = slides.filter((s) =>
    INTERACTIVE_TYPES.includes(s.type),
  );

  const totalResponses = await Interaction.countDocuments({ sessionId });
  const respondents = await Interaction.distinct("participantId", {
    sessionId,
  });

  const totalParticipants = session.participants.length;
  const activeParticipants = respondents.length;
  const participationRate =
    totalParticipants > 0
      ? Math.round((activeParticipants / totalParticipants) * 100)
      : 0;

  const engagementData = await calculateEngagementScore(sessionId);

  const durationMinutes =
    session.startedAt && session.endedAt
      ? Math.round(
          (session.endedAt.getTime() - session.startedAt.getTime()) / 60000,
        )
      : session.startedAt
        ? Math.round((Date.now() - session.startedAt.getTime()) / 60000)
        : 0;

  return {
    sessionId,
    presentationTitle: presentation?.title || "Unknown",
    status: session.status,
    totalParticipants,
    activeParticipants,
    participationRate,
    totalResponses,
    totalSlides: slides.length,
    interactiveSlides: interactiveSlides.length,
    engagementScore: engagementData.overall,
    startedAt: session.startedAt?.toISOString() || null,
    endedAt: session.endedAt?.toISOString() || null,
    durationMinutes,
  };
}

// ── Participation Metrics ──

export async function getParticipationMetrics(
  sessionId: string,
): Promise<any[]> {
  const session = await Session.findById(sessionId);
  if (!session) return [];

  const slides = await Slide.find({
    presentationId: session.presentationId,
  }).sort({ order: 1 });

  const totalParticipants = session.participants.length;
  const metrics = [];

  for (const slide of slides) {
    if (!INTERACTIVE_TYPES.includes(slide.type)) continue;

    const responseCount = await Interaction.countDocuments({
      sessionId,
      slideId: slide._id,
    });

    metrics.push({
      slideId: slide._id.toString(),
      slideTitle: slide.title || `Slide ${slide.order + 1}`,
      slideType: slide.type,
      responseCount,
      responseRate:
        totalParticipants > 0
          ? Math.round((responseCount / totalParticipants) * 100)
          : 0,
    });
  }

  return metrics;
}

// ── Quiz Metrics ──

export async function getQuizMetrics(sessionId: string): Promise<any> {
  const session = await Session.findById(sessionId);
  if (!session) return null;

  const quizSlides = await Slide.find({
    presentationId: session.presentationId,
    type: "quiz",
  });

  if (quizSlides.length === 0) {
    return {
      totalQuizSlides: 0,
      totalQuizParticipants: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      averageAccuracy: 0,
      averageResponseTimeMs: 0,
      completionRate: 0,
      questionPerformance: [],
    };
  }

  const quizInteractions = await Interaction.find({
    sessionId,
    type: "quiz",
  });

  const participants = new Set(quizInteractions.map((i) => i.participantId));
  const leaderboard = await getLeaderboard(sessionId);

  const scores = leaderboard.map((e) => e.score);
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  const totalCorrect = quizInteractions.filter((i) => i.isCorrect).length;
  const averageAccuracy =
    quizInteractions.length > 0
      ? Math.round((totalCorrect / quizInteractions.length) * 100)
      : 0;

  const totalTime = quizInteractions.reduce(
    (sum, i) => sum + (i.responseTimeMs || 0),
    0,
  );
  const averageResponseTimeMs =
    quizInteractions.length > 0
      ? Math.round(totalTime / quizInteractions.length)
      : 0;

  const totalParticipants = session.participants.length;
  const completionRate =
    totalParticipants > 0
      ? Math.round((participants.size / totalParticipants) * 100)
      : 0;

  // Per-question performance
  const questionPerformance = [];
  for (const slide of quizSlides) {
    const slideInteractions = quizInteractions.filter(
      (i) => i.slideId.toString() === slide._id.toString(),
    );
    const correct = slideInteractions.filter((i) => i.isCorrect).length;
    const total = slideInteractions.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgTime =
      total > 0
        ? Math.round(
            slideInteractions.reduce(
              (sum, i) => sum + (i.responseTimeMs || 0),
              0,
            ) / total,
          )
        : 0;

    let difficulty: "easy" | "medium" | "hard" = "medium";
    if (accuracy >= 70) difficulty = "easy";
    else if (accuracy < 40) difficulty = "hard";

    questionPerformance.push({
      slideId: slide._id.toString(),
      slideTitle: slide.title || `Question ${slide.order + 1}`,
      totalAttempts: total,
      correctCount: correct,
      accuracy,
      averageTimeMs: avgTime,
      difficulty,
    });
  }

  return {
    totalQuizSlides: quizSlides.length,
    totalQuizParticipants: participants.size,
    averageScore,
    highestScore,
    lowestScore,
    averageAccuracy,
    averageResponseTimeMs,
    completionRate,
    questionPerformance,
  };
}

// ── Engagement Score ──
/**
 * Deterministic Engagement Score Formula:
 *
 * engagement = (
 *   participationRate * 0.30 +     // % of participants who responded to ≥1 slide
 *   responseFrequency * 0.20 +     // avg responses per participant / total interactive slides
 *   quizParticipation * 0.15 +     // % who attempted quiz slides
 *   qnaParticipation * 0.10 +      // % who asked/upvoted questions
 *   reactionActivity * 0.10 +      // reactions per participant (capped at 100%)
 *   completionRate * 0.15          // % who stayed until session end
 * ) * 100
 *
 * Each component is a 0-1 fraction. Final score is 0-100.
 */
export async function calculateEngagementScore(
  sessionId: string,
): Promise<any> {
  const session = await Session.findById(sessionId);
  if (!session || session.participants.length === 0) {
    return {
      overall: 0,
      participationRate: 0,
      responseFrequency: 0,
      quizParticipation: 0,
      qnaParticipation: 0,
      reactionActivity: 0,
      completionRate: 0,
    };
  }

  const totalParticipants = session.participants.length;
  const slides = await Slide.find({ presentationId: session.presentationId });
  const interactiveSlides = slides.filter((s) =>
    INTERACTIVE_TYPES.includes(s.type),
  );
  const quizSlides = slides.filter((s) => s.type === "quiz");
  const interactiveCount = interactiveSlides.length || 1; // avoid div by 0

  // 1. Participation Rate
  const respondents = await Interaction.distinct("participantId", {
    sessionId,
  });
  const participationRate = Math.min(respondents.length / totalParticipants, 1);

  // 2. Response Frequency
  const totalResponses = await Interaction.countDocuments({ sessionId });
  const avgResponsesPerParticipant =
    totalParticipants > 0 ? totalResponses / totalParticipants : 0;
  const responseFrequency = Math.min(
    avgResponsesPerParticipant / interactiveCount,
    1,
  );

  // 3. Quiz Participation
  let quizParticipation = 0;
  if (quizSlides.length > 0) {
    const quizRespondents = await Interaction.distinct("participantId", {
      sessionId,
      type: "quiz",
    });
    quizParticipation = Math.min(quizRespondents.length / totalParticipants, 1);
  }

  // 4. Q&A Participation
  const qnaCount = await QnAQuestion.countDocuments({ sessionId });
  const qnaParticipants = await QnAQuestion.distinct("participantId", {
    sessionId,
  });
  const qnaParticipation = Math.min(
    qnaParticipants.length / totalParticipants,
    1,
  );

  // 5. Reaction Activity — estimate from stored counts
  const reactionData = session.reactionCounts || {};
  let totalReactions = 0;
  for (const slideId of Object.keys(reactionData)) {
    const slideCounts = reactionData[slideId] || {};
    for (const emoji of Object.keys(slideCounts)) {
      totalReactions += slideCounts[emoji] || 0;
    }
  }
  const reactionsPerParticipant =
    totalParticipants > 0 ? totalReactions / totalParticipants : 0;
  const reactionActivity = Math.min(reactionsPerParticipant / 5, 1); // cap at 5 reactions/person

  // 6. Completion Rate — % who stayed online at session end (or are still online)
  const onlineAtEnd = session.participants.filter((p) => p.isOnline).length;
  const completionRate = Math.min(onlineAtEnd / totalParticipants, 1);

  // Calculate weighted score
  const overall = Math.round(
    (participationRate * 0.3 +
      responseFrequency * 0.2 +
      quizParticipation * 0.15 +
      qnaParticipation * 0.1 +
      reactionActivity * 0.1 +
      completionRate * 0.15) *
      100,
  );

  return {
    overall: Math.min(overall, 100),
    participationRate: Math.round(participationRate * 100),
    responseFrequency: Math.round(responseFrequency * 100),
    quizParticipation: Math.round(quizParticipation * 100),
    qnaParticipation: Math.round(qnaParticipation * 100),
    reactionActivity: Math.round(reactionActivity * 100),
    completionRate: Math.round(completionRate * 100),
  };
}

// ── Timeline ──

export async function getTimeline(sessionId: string): Promise<any[]> {
  const session = await Session.findById(sessionId);
  if (!session) return [];

  // Get join events
  const joinEvents = session.participants.map((p) => ({
    timestamp: p.joinedAt.toISOString(),
    type: "join" as const,
    count: 1,
  }));

  // Get response events (bucketed by minute)
  const interactions = await Interaction.find({ sessionId })
    .sort({ createdAt: 1 })
    .select("createdAt type");

  const responseBuckets = new Map<string, number>();
  for (const i of interactions) {
    const minute = new Date(i.createdAt);
    minute.setSeconds(0, 0);
    const key = minute.toISOString();
    responseBuckets.set(key, (responseBuckets.get(key) || 0) + 1);
  }

  const responseEvents = Array.from(responseBuckets.entries()).map(
    ([timestamp, count]) => ({
      timestamp,
      type: "response" as const,
      count,
    }),
  );

  // Get Q&A events
  const qnaQuestions = await QnAQuestion.find({ sessionId })
    .sort({ createdAt: 1 })
    .select("createdAt");

  const qnaBuckets = new Map<string, number>();
  for (const q of qnaQuestions) {
    const minute = new Date(q.createdAt);
    minute.setSeconds(0, 0);
    const key = minute.toISOString();
    qnaBuckets.set(key, (qnaBuckets.get(key) || 0) + 1);
  }

  const qnaEvents = Array.from(qnaBuckets.entries()).map(
    ([timestamp, count]) => ({
      timestamp,
      type: "qna" as const,
      count,
    }),
  );

  // Combine and sort
  const all = [...joinEvents, ...responseEvents, ...qnaEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return all;
}

// ── Export Data ──

export async function getExportData(
  sessionId: string,
  format: "csv" | "json",
): Promise<any> {
  const session = await Session.findById(sessionId);
  if (!session) return null;

  const presentation = await Presentation.findById(session.presentationId);
  const slides = await Slide.find({
    presentationId: session.presentationId,
  }).sort({ order: 1 });

  const interactions = await Interaction.find({ sessionId }).sort({
    createdAt: 1,
  });

  const qnaQuestions = await QnAQuestion.find({ sessionId }).sort({
    createdAt: -1,
  });

  const overview = await getSessionOverview(sessionId);
  const engagement = await calculateEngagementScore(sessionId);

  if (format === "json") {
    return {
      presentation: {
        title: presentation?.title,
        id: presentation?._id.toString(),
      },
      session: {
        id: sessionId,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        joinCode: session.joinCode,
      },
      overview,
      engagement,
      participants: session.participants.map((p) => ({
        displayName: p.displayName,
        joinedAt: p.joinedAt,
        isOnline: p.isOnline,
        score: p.score,
      })),
      responses: interactions.map((i) => ({
        slideId: i.slideId.toString(),
        slideTitle:
          slides.find((s) => s._id.toString() === i.slideId.toString())
            ?.title || "",
        type: i.type,
        displayName: i.displayName,
        payload: i.payload,
        isCorrect: i.isCorrect,
        score: i.score,
        responseTimeMs: i.responseTimeMs,
        createdAt: i.createdAt,
      })),
      qna: qnaQuestions.map((q) => ({
        displayName: q.displayName,
        questionText: q.questionText,
        status: q.status,
        upvotes: q.upvotes,
        createdAt: q.createdAt,
      })),
    };
  }

  // CSV format
  const csvRows = [
    [
      "Slide Title",
      "Slide Type",
      "Participant",
      "Response",
      "Correct",
      "Score",
      "Response Time (ms)",
      "Timestamp",
    ].join(","),
  ];

  for (const i of interactions) {
    const slideTitle =
      slides
        .find((s) => s._id.toString() === i.slideId.toString())
        ?.title?.replace(/,/g, ";") || "";
    const response = JSON.stringify(i.payload || {}).replace(/,/g, ";");
    csvRows.push(
      [
        `"${slideTitle}"`,
        i.type,
        `"${i.displayName}"`,
        `"${response}"`,
        i.isCorrect ?? "",
        i.score ?? "",
        i.responseTimeMs ?? "",
        i.createdAt.toISOString(),
      ].join(","),
    );
  }

  return csvRows.join("\n");
}
