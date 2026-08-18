import Interaction, { IInteraction } from "../models/Interaction";
import Session, { ISession } from "../models/Session";
import Slide from "../models/Slide";
import mongoose from "mongoose";

// ── Helpers ──

function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ── Validation ──

async function validateSessionAndSlide(
  joinCode: string,
  slideId: string,
  participantSocketId: string,
): Promise<{
  session: ISession;
  slide: any;
  participant: any;
  error?: string;
}> {
  const session = await Session.findOne({
    joinCode,
    status: { $in: ["live", "paused"] },
  });

  if (!session) {
    return {
      session: null as any,
      slide: null,
      participant: null,
      error: "Session not found or has ended",
    };
  }

  const participant = session.participants.find(
    (p) => p.socketId === participantSocketId,
  );

  if (!participant) {
    return {
      session,
      slide: null,
      participant: null,
      error: "You are not a participant in this session",
    };
  }

  // Check global response lock
  if (session.responseLocked) {
    return {
      session,
      slide: null,
      participant,
      error: "Responses are currently locked",
    };
  }

  // Check per-slide lock
  if (session.slideResponseLocks?.get(slideId)) {
    return {
      session,
      slide: null,
      participant,
      error: "Responses are locked for this slide",
    };
  }

  const slide = await Slide.findById(slideId);
  if (!slide) {
    return { session, slide: null, participant, error: "Slide not found" };
  }

  return { session, slide, participant };
}

// ── Poll ──

export async function submitPollResponse(
  joinCode: string,
  slideId: string,
  socketId: string,
  selectedOptions: number[],
): Promise<{ error?: string; result?: any }> {
  const { session, slide, participant, error } = await validateSessionAndSlide(
    joinCode,
    slideId,
    socketId,
  );
  if (error) return { error };

  if (slide.type !== "poll" && slide.type !== "imagepoll") {
    return { error: "This slide does not accept poll responses" };
  }

  const options = slide.config?.options || [];
  if (selectedOptions.some((i) => i < 0 || i >= options.length)) {
    return { error: "Invalid option selected" };
  }

  const participantId = `${session._id}-${participant.displayName}`;

  // Check for duplicate
  const existing = await Interaction.findOne({
    sessionId: session._id,
    slideId,
    participantId,
    type: "poll",
  });

  if (existing) {
    return { error: "You have already responded to this poll" };
  }

  await Interaction.create({
    sessionId: session._id,
    slideId,
    participantId,
    displayName: participant.displayName,
    type: "poll",
    payload: { selectedOptions },
  });

  // Calculate aggregated results
  const result = await getPollResults(session._id.toString(), slideId);
  return { result };
}

export async function getPollResults(
  sessionId: string,
  slideId: string,
): Promise<any> {
  const slide = await Slide.findById(slideId);
  const options = slide?.config?.options || [];
  const optionsCount = options.length;

  const interactions = await Interaction.find({
    sessionId,
    slideId,
    type: "poll",
  });

  const optionCounts = new Array(optionsCount).fill(0);
  for (const interaction of interactions) {
    const selected = interaction.payload?.selectedOptions || [];
    for (const idx of selected) {
      if (idx >= 0 && idx < optionsCount) {
        optionCounts[idx]++;
      }
    }
  }

  const totalResponses = interactions.length;
  const optionPercentages = optionCounts.map((c) =>
    totalResponses > 0 ? Math.round((c / totalResponses) * 100) : 0,
  );

  const session = await Session.findById(sessionId);
  const totalParticipants = session?.participants?.length || 0;
  const participationPercentage =
    totalParticipants > 0
      ? Math.round((totalResponses / totalParticipants) * 100)
      : 0;

  return {
    slideId,
    totalResponses,
    options,
    optionCounts,
    optionPercentages,
    participationPercentage,
  };
}

// ── Quiz ──

export async function submitQuizResponse(
  joinCode: string,
  slideId: string,
  socketId: string,
  selectedOptions: number[],
  responseTimeMs: number,
): Promise<{
  error?: string;
  result?: any;
  scoreAwarded?: number;
  isCorrect?: boolean;
  correctAnswers?: number[];
}> {
  const { session, slide, participant, error } = await validateSessionAndSlide(
    joinCode,
    slideId,
    socketId,
  );
  if (error) return { error };

  if (slide.type !== "quiz") {
    return { error: "This slide does not accept quiz responses" };
  }

  const participantId = `${session._id}-${participant.displayName}`;

  // Prevent duplicate
  const existing = await Interaction.findOne({
    sessionId: session._id,
    slideId,
    participantId,
    type: "quiz",
  });

  if (existing) {
    return { error: "You have already answered this question" };
  }

  // Check timer — gracefully clamp response time to prevent network lag rejections
  const timeLimit = slide.config?.timer;
  const safeResponseTimeMs = Math.max(
    0,
    Math.min(
      responseTimeMs || 0,
      timeLimit && timeLimit > 0 ? timeLimit * 1000 : 30000,
    ),
  );

  // Validate answer
  const correctAnswers: number[] = slide.config?.correctAnswers || [];
  const isCorrect =
    correctAnswers.length > 0 &&
    selectedOptions.length === correctAnswers.length &&
    selectedOptions.every((o: number) => correctAnswers.includes(o));

  // Time-based scoring
  let scoreAwarded = 0;
  if (isCorrect) {
    const basePoints = slide.config?.points || 1000;
    if (timeLimit && timeLimit > 0) {
      const timeFraction = Math.min(safeResponseTimeMs / (timeLimit * 1000), 1);
      scoreAwarded = Math.max(
        Math.round(basePoints - timeFraction * (basePoints * 0.5)),
        Math.round(basePoints * 0.1),
      );
    } else {
      scoreAwarded = basePoints;
    }
  }

  await Interaction.create({
    sessionId: session._id,
    slideId,
    participantId,
    displayName: participant.displayName,
    type: "quiz",
    payload: { selectedOptions },
    isCorrect,
    score: scoreAwarded,
    responseTimeMs: safeResponseTimeMs,
  });

  // Update participant score in session
  if (scoreAwarded > 0) {
    await Session.updateOne(
      { _id: session._id, "participants.socketId": socketId },
      { $inc: { "participants.$.score": scoreAwarded } },
    );
  }

  const result = await getQuizResults(session._id.toString(), slideId);
  return { result, scoreAwarded, isCorrect, correctAnswers };
}

export async function getQuizResults(
  sessionId: string,
  slideId: string,
): Promise<any> {
  const slide = await Slide.findById(slideId);
  const options: string[] = slide?.config?.options || [];
  const correctAnswers: number[] = slide?.config?.correctAnswers || [];
  const optionsCount = options.length;

  const interactions = await Interaction.find({
    sessionId,
    slideId,
    type: "quiz",
  });

  const totalResponses = interactions.length;
  const correctCount = interactions.filter((i) => i.isCorrect).length;
  const incorrectCount = totalResponses - correctCount;
  const accuracy =
    totalResponses > 0 ? Math.round((correctCount / totalResponses) * 100) : 0;

  const totalTime = interactions.reduce(
    (sum, i) => sum + (i.responseTimeMs || 0),
    0,
  );
  const averageTimeMs =
    totalResponses > 0 ? Math.round(totalTime / totalResponses) : 0;

  // Option distribution breakdown
  const optionCounts = new Array(optionsCount).fill(0);
  for (const interaction of interactions) {
    const selected = interaction.payload?.selectedOptions || [];
    for (const idx of selected) {
      if (idx >= 0 && idx < optionsCount) {
        optionCounts[idx]++;
      }
    }
  }
  const optionPercentages = optionCounts.map((c) =>
    totalResponses > 0 ? Math.round((c / totalResponses) * 100) : 0,
  );

  return {
    slideId,
    totalResponses,
    correctCount,
    incorrectCount,
    accuracy,
    averageTimeMs,
    options,
    correctAnswers,
    optionCounts,
    optionPercentages,
  };
}

export async function getLeaderboard(sessionId: string): Promise<any[]> {
  const session = await Session.findById(sessionId);
  if (!session) return [];

  const interactions = await Interaction.find({
    sessionId,
    type: "quiz",
  });

  const participantMap = new Map<
    string,
    { score: number; correctCount: number; totalTime: number; count: number }
  >();

  for (const interaction of interactions) {
    const key = interaction.displayName;
    const current = participantMap.get(key) || {
      score: 0,
      correctCount: 0,
      totalTime: 0,
      count: 0,
    };
    current.score += interaction.score || 0;
    if (interaction.isCorrect) current.correctCount++;
    current.totalTime += interaction.responseTimeMs || 0;
    current.count++;
    participantMap.set(key, current);
  }

  // Also include participants with 0 interactions
  for (const p of session.participants || []) {
    if (!participantMap.has(p.displayName)) {
      participantMap.set(p.displayName, {
        score: p.score || 0,
        correctCount: 0,
        totalTime: 0,
        count: 0,
      });
    }
  }

  const sorted = Array.from(participantMap.entries())
    .map(([displayName, data]) => ({
      displayName,
      score: data.score,
      correctCount: data.correctCount,
      accuracy:
        data.count > 0 ? Math.round((data.correctCount / data.count) * 100) : 0,
      averageResponseTimeMs:
        data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount)
        return b.correctCount - a.correctCount;
      return a.averageResponseTimeMs - b.averageResponseTimeMs;
    });

  let currentRank = 1;
  return sorted.map((entry, index) => {
    if (index > 0 && entry.score < sorted[index - 1].score) {
      currentRank = index + 1;
    }
    return {
      ...entry,
      rank: currentRank,
    };
  });
}

// ── Word Cloud ──

export async function submitWordCloudWord(
  joinCode: string,
  slideId: string,
  socketId: string,
  rawWord: string,
): Promise<{ error?: string; result?: any }> {
  const { session, slide, error } = await validateSessionAndSlide(
    joinCode,
    slideId,
    socketId,
  );
  if (error) return { error };

  if (slide.type !== "wordcloud") {
    return { error: "This slide does not accept word cloud submissions" };
  }

  const trimmedWord = (rawWord || "").trim();
  if (!trimmedWord) {
    return { error: "Word cannot be empty" };
  }
  if (trimmedWord.length > 50) {
    return { error: "Word is too long (max 50 characters)" };
  }

  const sanitizedWord = sanitizeHtml(trimmedWord);
  const participant = session.participants.find((p) => p.socketId === socketId);
  const participantId = `${session._id}-${participant?.displayName || "anon"}`;

  await Interaction.create({
    sessionId: session._id,
    slideId,
    participantId,
    displayName: participant?.displayName || "Anonymous",
    type: "wordcloud",
    payload: {
      word: sanitizedWord,
      normalizedWord: sanitizedWord.toLowerCase(),
    },
  });

  const result = await getWordCloudResults(session._id.toString(), slideId);
  return { result };
}

export async function getWordCloudResults(
  sessionId: string,
  slideId: string,
): Promise<any> {
  const interactions = await Interaction.find({
    sessionId,
    slideId,
    type: "wordcloud",
  });

  const wordMap = new Map<string, { displayWord: string; count: number }>();
  for (const interaction of interactions) {
    const normalized = interaction.payload?.normalizedWord || "";
    const display = interaction.payload?.word || normalized;
    const existing = wordMap.get(normalized);
    if (existing) {
      existing.count++;
    } else {
      wordMap.set(normalized, { displayWord: display, count: 1 });
    }
  }

  const words = Array.from(wordMap.entries())
    .map(([word, data]) => ({
      word,
      displayWord: data.displayWord,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    slideId,
    totalSubmissions: interactions.length,
    words,
  };
}

// ── Open Text ──

export async function submitOpenTextResponse(
  joinCode: string,
  slideId: string,
  socketId: string,
  rawText: string,
): Promise<{ error?: string; result?: any }> {
  const { session, slide, participant, error } = await validateSessionAndSlide(
    joinCode,
    slideId,
    socketId,
  );
  if (error) return { error };

  if (slide.type !== "opentext") {
    return { error: "This slide does not accept open text responses" };
  }

  const trimmedText = (rawText || "").trim();
  if (!trimmedText) {
    return { error: "Response cannot be empty" };
  }

  const charLimit = slide.config?.charLimit || 500;
  if (trimmedText.length > charLimit) {
    return { error: `Response exceeds ${charLimit} character limit` };
  }

  const sanitizedText = sanitizeHtml(trimmedText);
  const participantId = `${session._id}-${participant.displayName}`;

  const interaction = await Interaction.create({
    sessionId: session._id,
    slideId,
    participantId,
    displayName: participant.displayName,
    type: "opentext",
    payload: { text: sanitizedText },
    status: "approved",
  });

  return {
    result: {
      id: interaction._id.toString(),
      displayName: participant.displayName,
      text: sanitizedText,
      status: "approved",
      createdAt: interaction.createdAt.toISOString(),
    },
  };
}

export async function getOpenTextResults(
  sessionId: string,
  slideId: string,
): Promise<any> {
  const interactions = await Interaction.find({
    sessionId,
    slideId,
    type: "opentext",
  }).sort({ createdAt: -1 });

  return {
    slideId,
    totalResponses: interactions.length,
    responses: interactions.map((i) => ({
      id: i._id.toString(),
      displayName: i.displayName,
      text: i.payload?.text || "",
      status: i.status,
      createdAt: i.createdAt.toISOString(),
    })),
  };
}

export async function moderateResponse(
  interactionId: string,
  action: "approve" | "hide" | "highlight",
): Promise<{ error?: string; interaction?: any }> {
  const statusMap: Record<string, string> = {
    approve: "approved",
    hide: "hidden",
    highlight: "highlighted",
  };

  const interaction = await Interaction.findByIdAndUpdate(
    interactionId,
    { status: statusMap[action] },
    { returnDocument: "after" },
  );

  if (!interaction) {
    return { error: "Interaction not found" };
  }

  return {
    interaction: {
      id: interaction._id.toString(),
      displayName: interaction.displayName,
      text: interaction.payload?.text || "",
      status: interaction.status,
      slideId: interaction.slideId.toString(),
    },
  };
}

// ── Rating ──

export async function submitRating(
  joinCode: string,
  slideId: string,
  socketId: string,
  rating: number,
): Promise<{ error?: string; result?: any }> {
  const { session, slide, participant, error } = await validateSessionAndSlide(
    joinCode,
    slideId,
    socketId,
  );
  if (error) return { error };

  if (slide.type !== "rating") {
    return { error: "This slide does not accept ratings" };
  }

  const range = slide.config?.ratingRange || { min: 1, max: 5 };
  if (rating < range.min || rating > range.max) {
    return { error: `Rating must be between ${range.min} and ${range.max}` };
  }

  const participantId = `${session._id}-${participant.displayName}`;

  const existing = await Interaction.findOne({
    sessionId: session._id,
    slideId,
    participantId,
    type: "rating",
  });

  if (existing) {
    return { error: "You have already submitted a rating" };
  }

  await Interaction.create({
    sessionId: session._id,
    slideId,
    participantId,
    displayName: participant.displayName,
    type: "rating",
    payload: { rating },
  });

  const result = await getRatingResults(session._id.toString(), slideId);
  return { result };
}

export async function getRatingResults(
  sessionId: string,
  slideId: string,
): Promise<any> {
  const interactions = await Interaction.find({
    sessionId,
    slideId,
    type: "rating",
  });

  if (interactions.length === 0) {
    return {
      slideId,
      totalResponses: 0,
      average: 0,
      min: 0,
      max: 0,
      distribution: {},
    };
  }

  const ratings = interactions.map((i) => i.payload?.rating || 0);
  const sum = ratings.reduce((a, b) => a + b, 0);
  const distribution: Record<number, number> = {};
  for (const r of ratings) {
    distribution[r] = (distribution[r] || 0) + 1;
  }

  return {
    slideId,
    totalResponses: interactions.length,
    average: Math.round((sum / interactions.length) * 10) / 10,
    min: Math.min(...ratings),
    max: Math.max(...ratings),
    distribution,
  };
}

// ── Generic slide results ──

export async function getSlideResults(
  sessionId: string,
  slideId: string,
): Promise<any> {
  const slide = await Slide.findById(slideId);
  if (!slide) return null;

  switch (slide.type) {
    case "poll":
    case "imagepoll":
      return getPollResults(sessionId, slideId);
    case "quiz":
      return getQuizResults(sessionId, slideId);
    case "wordcloud":
      return getWordCloudResults(sessionId, slideId);
    case "opentext":
      return getOpenTextResults(sessionId, slideId);
    case "rating":
      return getRatingResults(sessionId, slideId);
    default:
      return null;
  }
}
