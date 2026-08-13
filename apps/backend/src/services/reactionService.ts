import Session from "../models/Session";

// In-memory reaction aggregation to avoid per-event DB writes
const reactionBuffers = new Map<string, Map<string, Record<string, number>>>();
// Rate limiting: participantId -> { emoji -> lastTimestamp }
const rateLimits = new Map<string, Map<string, number>>();

const RATE_LIMIT_MS = 2000; // 2 seconds per emoji per participant
const FLUSH_INTERVAL_MS = 10000; // Flush to DB every 10s

// ── Add Reaction ──

export function addReaction(
  sessionId: string,
  slideId: string,
  emoji: string,
  participantId: string,
): { error?: string; counts?: Record<string, number> } {
  // Rate limiting
  const participantLimits =
    rateLimits.get(participantId) || new Map<string, number>();
  const lastTime = participantLimits.get(emoji) || 0;
  const now = Date.now();

  if (now - lastTime < RATE_LIMIT_MS) {
    return { error: "Please wait before sending another reaction" };
  }

  participantLimits.set(emoji, now);
  rateLimits.set(participantId, participantLimits);

  // Aggregate in memory
  const sessionBuffer =
    reactionBuffers.get(sessionId) || new Map<string, Record<string, number>>();
  const slideCounts = sessionBuffer.get(slideId) || {};
  slideCounts[emoji] = (slideCounts[emoji] || 0) + 1;
  sessionBuffer.set(slideId, slideCounts);
  reactionBuffers.set(sessionId, sessionBuffer);

  return { counts: { ...slideCounts } };
}

// ── Get Reaction Counts ──

export function getReactionCounts(
  sessionId: string,
  slideId: string,
): Record<string, number> {
  const sessionBuffer = reactionBuffers.get(sessionId);
  if (!sessionBuffer) return {};
  return { ...(sessionBuffer.get(slideId) || {}) };
}

// ── Flush to DB ──

export async function flushReactions(sessionId: string): Promise<void> {
  const sessionBuffer = reactionBuffers.get(sessionId);
  if (!sessionBuffer || sessionBuffer.size === 0) return;

  try {
    const reactionCounts: Record<string, any> = {};
    for (const [slideId, counts] of sessionBuffer.entries()) {
      reactionCounts[slideId] = counts;
    }

    await Session.updateOne({ _id: sessionId }, { $set: { reactionCounts } });
  } catch (err) {
    console.error("Failed to flush reactions:", err);
  }
}

// ── Cleanup ──

export function clearSessionReactions(sessionId: string): void {
  reactionBuffers.delete(sessionId);
  // Clear rate limits for this session's participants
  // (In production, you'd track which participants belong to which session)
}

// ── Periodic flush (started per-session) ──

const flushIntervals = new Map<string, ReturnType<typeof setInterval>>();

export function startPeriodicFlush(sessionId: string): void {
  if (flushIntervals.has(sessionId)) return;

  const interval = setInterval(() => {
    flushReactions(sessionId);
  }, FLUSH_INTERVAL_MS);

  flushIntervals.set(sessionId, interval);
}

export function stopPeriodicFlush(sessionId: string): void {
  const interval = flushIntervals.get(sessionId);
  if (interval) {
    clearInterval(interval);
    flushIntervals.delete(sessionId);
  }
  // Final flush
  flushReactions(sessionId);
}
