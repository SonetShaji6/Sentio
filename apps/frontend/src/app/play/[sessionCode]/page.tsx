"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@sentio/shared/src/events/socket.events";
import {
  Heart,
  AlertCircle,
  MessageCircle,
  X,
  Trophy,
  CheckCircle2,
  Radio,
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  Clock,
  ThumbsUp,
  Flame,
  Lightbulb,
  PartyPopper,
} from "lucide-react";

import { PollInteraction } from "@/components/interactions/PollInteraction";
import { QuizInteraction } from "@/components/interactions/QuizInteraction";
import { WordCloudInteraction } from "@/components/interactions/WordCloudInteraction";
import { OpenTextInteraction } from "@/components/interactions/OpenTextInteraction";
import { RatingInteraction } from "@/components/interactions/RatingInteraction";
import { EmojiReactions } from "@/components/interactions/EmojiReactions";
import { QnAPanel } from "@/components/interactions/QnAPanel";
import { resolveTheme } from "@/types/theme";

interface SlideData {
  slideId: string;
  type: string;
  title: string;
  description: string;
  content?: string;
  config: any;
  theme?: any;
  responseLocked: boolean;
}

const getFontFamilyStyle = (font?: string) => {
  switch (font) {
    case "serif":
      return "Georgia, Cambria, 'Times New Roman', Times, serif";
    case "mono":
      return "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace";
    case "display":
      return "'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
    case "sans":
    default:
      return "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  }
};

interface QnAQuestion {
  id: string;
  displayName: string;
  questionText: string;
  status: "pending" | "pinned" | "resolved" | "hidden";
  upvotes: number;
  createdAt: string;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;
}

const WARMUP_EMOJIS = ["❤️", "🔥", "👏", "💡", "🎉", "👍"];

export default function AudienceView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const joinCode = ((params.sessionCode as string) || "").toUpperCase();
  const displayName = searchParams.get("name") || "Participant";

  const [connectionState, setConnectionState] = useState<
    "connecting" | "pending_approval" | "joined" | "error"
  >("connecting");
  const [errorMessage, setErrorMessage] = useState("");

  const [session, setSession] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState<SlideData | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [responseLocked, setResponseLocked] = useState(false);

  // Results state
  const [pollResults, setPollResults] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [quizFeedback, setQuizFeedback] = useState<any>(null);
  const [revealedCorrectAnswers, setRevealedCorrectAnswers] = useState<
    number[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [wordCloudResults, setWordCloudResults] = useState<any>(null);
  const [ratingResults, setRatingResults] = useState<any>(null);
  const [audienceCount, setAudienceCount] = useState<number>(0);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
    {},
  );

  // Floating live emoji animations
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  // Q&A
  const [showQnA, setShowQnA] = useState(false);
  const [qnaQuestions, setQnaQuestions] = useState<QnAQuestion[]>([]);

  const { isConnected, emit, subscribe } = useSocket();

  // Resolve dynamic active theme from current slide or session
  const activeTheme = resolveTheme(
    currentSlide?.theme || currentSlide?.config?.theme || session?.theme,
  );

  // Track submitted slides
  const submittedSlidesRef = useRef<Set<string>>(new Set());

  const spawnFloatingEmoji = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const left = Math.floor(Math.random() * 80) + 10;
    setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  useEffect(() => {
    if (!isConnected) return;

    // Join the session
    emit(SOCKET_EVENTS.JOIN_SESSION, { joinCode, displayName });

    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribe(SOCKET_EVENTS.JOIN_SUCCESS, (data: any) => {
        setSession(data.session);
        setConnectionState("joined");
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.ADMISSION_PENDING, (data: any) => {
        if (data?.session) setSession(data.session);
        setConnectionState("pending_approval");
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.ADMISSION_APPROVED, (data: any) => {
        if (data?.session) setSession(data.session);
        setConnectionState("joined");
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.ADMISSION_REJECTED, (data: any) => {
        setErrorMessage(
          data?.message ||
            "Your request to join this session was declined by the presenter.",
        );
        setConnectionState("error");
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.JOIN_ERROR, (msg: string) => {
        setErrorMessage(msg);
        setConnectionState("error");
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.PARTICIPANT_KICKED, (data: any) => {
        setConnectionState("error");
        setErrorMessage(
          data?.message ||
            "You have been removed from this session by the presenter and cannot rejoin.",
        );
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.AUDIENCE_UPDATED, (data: { count: number }) => {
        setAudienceCount(data.count);
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SESSION_STARTED, (data: any) => {
        setSession(data.session || { status: "live" });
        resetSlideState();
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SLIDE_CHANGED, () => {
        // Slide data will follow immediately via SLIDE_DATA
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SLIDE_DATA, (data: SlideData) => {
        setCurrentSlide(data);
        setResponseLocked(Boolean(data.responseLocked));
        setHasSubmitted(submittedSlidesRef.current.has(data.slideId));
        setPollResults(null);
        setQuizResults(null);
        setQuizFeedback(null);
        setRevealedCorrectAnswers([]);
        setWordCloudResults(null);
        setRatingResults(null);
        setReactionCounts({});
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SESSION_ENDED, () => {
        setSession((prev: any) =>
          prev ? { ...prev, status: "ended" } : { status: "ended" },
        );
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SESSION_PAUSED, () => {
        setSession((prev: any) =>
          prev ? { ...prev, status: "paused" } : { status: "paused" },
        );
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SESSION_RESUMED, () => {
        setSession((prev: any) =>
          prev ? { ...prev, status: "live" } : { status: "live" },
        );
      }),
    );

    // Interaction results
    unsubs.push(
      subscribe(SOCKET_EVENTS.POLL_UPDATE, (data: any) => {
        setPollResults(data);
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.QUIZ_UPDATE, (data: any) => {
        setQuizResults(data);
        if (
          Array.isArray(data.correctAnswers) &&
          data.correctAnswers.length > 0
        ) {
          setRevealedCorrectAnswers(data.correctAnswers);
        }
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.INTERACTION_RESULT, (data: any) => {
        if (data.type === "quiz") {
          setQuizFeedback({
            isCorrect: data.isCorrect,
            scoreAwarded: data.scoreAwarded ?? 0,
            correctAnswers: data.correctAnswers ?? [],
            selectedOptions: data.selectedOptions ?? [],
          });
          if (
            Array.isArray(data.correctAnswers) &&
            data.correctAnswers.length > 0
          ) {
            setRevealedCorrectAnswers(data.correctAnswers);
          }
        }
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.WORDCLOUD_UPDATE, (data: any) => {
        setWordCloudResults(data);
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.RATING_UPDATE, (data: any) => {
        setRatingResults(data);
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.LEADERBOARD_UPDATE, (data: any) => {
        setLeaderboard(data);
      }),
    );

    // Response locks
    unsubs.push(
      subscribe(SOCKET_EVENTS.RESPONSE_LOCK, (data: any) => {
        if (!data.slideId || data.slideId === currentSlide?.slideId) {
          setResponseLocked(true);
          if (data.correctAnswers) {
            setRevealedCorrectAnswers(data.correctAnswers);
          }
        }
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.RESPONSE_UNLOCK, (data: any) => {
        if (!data.slideId || data.slideId === currentSlide?.slideId) {
          setResponseLocked(false);
        }
      }),
    );

    // Reactions
    unsubs.push(
      subscribe(SOCKET_EVENTS.REACTION_UPDATE, (data: any) => {
        if (!currentSlide || data.slideId === currentSlide?.slideId) {
          setReactionCounts(data.counts || {});
        }
        if (data.emoji) {
          spawnFloatingEmoji(data.emoji);
        }
      }),
    );

    // Q&A
    unsubs.push(
      subscribe(SOCKET_EVENTS.QNA_UPDATE, (data: any) => {
        if (data.action === "new") {
          setQnaQuestions((prev) => [data.question, ...prev]);
        } else if (data.action === "moderated" || data.action === "replied") {
          setQnaQuestions((prev) =>
            prev.map((q) => (q.id === data.question.id ? data.question : q)),
          );
        }
      }),
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [isConnected, joinCode, displayName]);

  const resetSlideState = () => {
    setCurrentSlide(null);
    setHasSubmitted(false);
    setPollResults(null);
    setQuizFeedback(null);
    setRevealedCorrectAnswers([]);
    setWordCloudResults(null);
    setRatingResults(null);
    setReactionCounts({});
  };

  const handleInteractionSubmit = useCallback(
    (type: string, payload: any) => {
      if (!currentSlide) return;
      emit(SOCKET_EVENTS.INTERACTION_SUBMIT, {
        joinCode,
        slideId: currentSlide.slideId,
        type,
        payload,
      });
      if (type !== "wordcloud") {
        setHasSubmitted(true);
        submittedSlidesRef.current.add(currentSlide.slideId);
      }
    },
    [currentSlide, emit, joinCode],
  );

  const handleReaction = useCallback(
    (emoji: string) => {
      spawnFloatingEmoji(emoji);
      if (!currentSlide) return;
      emit(SOCKET_EVENTS.REACTION_SEND, {
        joinCode,
        slideId: currentSlide.slideId,
        emoji,
      });
    },
    [currentSlide, emit, joinCode],
  );

  const handleQnASubmit = useCallback(
    (questionText: string) => {
      emit(SOCKET_EVENTS.QNA_SUBMIT, { joinCode, questionText });
    },
    [emit, joinCode],
  );

  // ── Render State 1: Connecting ──
  if (connectionState === "connecting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white p-6 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-950 dark:text-white" />
        </div>
        <h2 className="text-base font-bold text-zinc-950 dark:text-white">
          Connecting to Session...
        </h2>
        <p className="text-xs text-zinc-400 mt-1 font-mono">Room #{joinCode}</p>
      </div>
    );
  }

  // ── Render State 1.5: Pending Presenter Approval ──
  if (connectionState === "pending_approval") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in transition-colors duration-300"
        style={{
          backgroundColor: activeTheme.bg,
          color: activeTheme.text,
          fontFamily: getFontFamilyStyle(activeTheme.fontFamily),
        }}
      >
        <div
          className="max-w-md w-full border rounded-3xl p-8 sm:p-10 text-center shadow-xl space-y-5"
          style={{
            backgroundColor: activeTheme.cardBg,
            borderColor: activeTheme.border,
          }}
        >
          {/* Animated Pending Icon */}
          <div className="relative inline-block mx-auto">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-md animate-pulse"
              style={{
                backgroundColor: `${activeTheme.primary}15`,
                color: activeTheme.primary,
                border: `1px solid ${activeTheme.primary}30`,
              }}
            >
              <Clock className="w-10 h-10" />
            </div>
            <span
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white animate-bounce shadow-xs"
              style={{ backgroundColor: activeTheme.primary }}
            >
              ⏳
            </span>
          </div>

          <div className="space-y-2">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider"
              style={{
                backgroundColor: `${activeTheme.primary}15`,
                color: activeTheme.primary,
                border: `1px solid ${activeTheme.primary}30`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: activeTheme.primary }}
              />
              Awaiting Admission
            </div>

            <h2
              className="text-2xl font-black tracking-tight"
              style={{ color: activeTheme.text }}
            >
              Waiting for Presenter Approval
            </h2>

            <p
              className="text-xs sm:text-sm max-w-xs mx-auto leading-relaxed"
              style={{ color: activeTheme.textMuted }}
            >
              Hi{" "}
              <strong style={{ color: activeTheme.text }}>{displayName}</strong>
              , your request to join room{" "}
              <strong style={{ color: activeTheme.text }}>#{joinCode}</strong>{" "}
              was sent. The host will admit you shortly.
            </p>
          </div>

          {/* Pulsing visual indicator */}
          <div
            className="p-4 rounded-2xl border space-y-2 text-left"
            style={{
              backgroundColor: activeTheme.bg,
              borderColor: activeTheme.border,
            }}
          >
            <div
              className="flex items-center justify-between text-xs font-medium"
              style={{ color: activeTheme.textMuted }}
            >
              <span className="flex items-center gap-1.5">
                <Radio
                  className="w-3.5 h-3.5 animate-pulse"
                  style={{ color: activeTheme.primary }}
                />
                Admission Lobby
              </span>
              <span className="font-mono text-[11px]">Knocking...</span>
            </div>
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: activeTheme.border }}
            >
              <div
                className="h-full rounded-full animate-pulse w-3/4"
                style={{ backgroundColor: activeTheme.primary }}
              />
            </div>
          </div>

          <p
            className="text-[11px] font-medium"
            style={{ color: activeTheme.textMuted }}
          >
            Keep this screen open — you will enter automatically once approved.
          </p>

          <button
            onClick={() => router.push("/join")}
            className="text-xs font-bold hover:underline cursor-pointer block mx-auto pt-2"
            style={{ color: activeTheme.textMuted }}
          >
            Cancel &amp; Leave
          </button>
        </div>
      </div>
    );
  }

  // ── Render State 2: Join Error ──
  if (connectionState === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 p-6 animate-fade-in">
        <div className="max-w-md w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white mb-2">
            Could Not Join
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
            {errorMessage ||
              "The presentation session could not be reached or has ended."}
          </p>
          <button
            onClick={() => router.push("/join")}
            className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-xl shadow-xs transition-all active-press"
          >
            Try Another Code
          </button>
        </div>
      </div>
    );
  }

  // ── Render State 3: Session Ended ──
  if (session?.status === "ended") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 p-6 animate-fade-in">
        <div className="max-w-md w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
            Presentation Concluded
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
            Thank you for participating,{" "}
            <strong className="text-zinc-900 dark:text-white">
              {displayName}
            </strong>
            ! Your responses and participation points have been recorded.
          </p>
          <button
            onClick={() => router.push("/join")}
            className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-xl transition-all active-press"
          >
            Join Another Presentation
          </button>
        </div>
      </div>
    );
  }

  // ── Render State 4: Session Paused ──
  if (session?.status === "paused") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 p-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white mb-1">
          Session Paused
        </h2>
        <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
          The presenter has temporarily paused interactions. Please stand by.
        </p>
      </div>
    );
  }

  // ── Render State 5: Welcome Lobby Screen (Waiting for Presenter to Start) ──
  if (!currentSlide) {
    return (
      <div
        className="min-h-screen flex flex-col justify-between p-6 md:p-10 animate-fade-in transition-colors duration-300"
        style={{
          backgroundColor: activeTheme.bg,
          color: activeTheme.text,
          fontFamily: getFontFamilyStyle(activeTheme.fontFamily),
        }}
      >
        {/* Floating live reaction overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {floatingEmojis.map((item) => (
            <div
              key={item.id}
              style={{ left: `${item.left}%`, bottom: "100px" }}
              className="absolute text-4xl animate-float-up"
            >
              {item.emoji}
            </div>
          ))}
        </div>

        {/* Top Minimal Bar */}
        <header className="flex items-center justify-between max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: activeTheme.primary }}
            />
            <span
              className="text-xs font-mono font-bold uppercase tracking-wider"
              style={{ color: activeTheme.primary }}
            >
              Connected
            </span>
          </div>
          <span
            className="px-3 py-1 border rounded-full text-xs font-mono font-bold transition-colors"
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
              color: activeTheme.primary,
            }}
          >
            #{joinCode}
          </span>
        </header>

        {/* Center Welcome Card */}
        <main className="max-w-md w-full mx-auto text-center space-y-6 my-auto py-8">
          {/* Avatar with initial */}
          <div className="relative inline-block">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl mx-auto transition-transform"
              style={{
                backgroundColor: activeTheme.primary,
                color: "#FFFFFF",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white border-2"
              style={{
                backgroundColor: activeTheme.accent,
                borderColor: activeTheme.bg,
              }}
            >
              ✓
            </span>
          </div>

          <div className="space-y-2">
            <h1
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ color: activeTheme.text }}
            >
              You&apos;re in, {displayName}!
            </h1>
            <p
              className="text-xs sm:text-sm max-w-xs mx-auto leading-relaxed"
              style={{ color: activeTheme.textMuted }}
            >
              Waiting for the presenter to launch the first slide. Keep this
              screen open.
            </p>
          </div>

          {/* Animated Waiting Progress Bar */}
          <div
            className="p-4 border rounded-2xl space-y-3 transition-colors"
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
            }}
          >
            <div
              className="flex items-center justify-between text-xs font-medium"
              style={{ color: activeTheme.textMuted }}
            >
              <span className="flex items-center gap-1.5">
                <Radio
                  className="w-3.5 h-3.5 animate-pulse"
                  style={{ color: activeTheme.primary }}
                />{" "}
                Live Room
              </span>
              <span className="font-mono">Ready to broadcast</span>
            </div>
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: `${activeTheme.border}` }}
            >
              <div
                className="h-full rounded-full animate-pulse w-2/3"
                style={{ backgroundColor: activeTheme.primary }}
              />
            </div>
          </div>

          {/* Interactive Reaction Warmup Zone */}
          <div className="space-y-2 pt-2">
            <span
              className="text-[11px] font-bold uppercase tracking-wider block"
              style={{ color: activeTheme.textMuted }}
            >
              Test your reactions while waiting
            </span>
            <div className="flex justify-center gap-2">
              {WARMUP_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-11 h-11 rounded-2xl text-xl flex items-center justify-center border transition-all hover:scale-110 active-press cursor-pointer"
                  style={{
                    backgroundColor: activeTheme.cardBg,
                    borderColor: activeTheme.border,
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Bottom Q&A Trigger */}
        <footer className="max-w-xl mx-auto w-full pt-4 text-center">
          <button
            onClick={() => setShowQnA(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all active-press cursor-pointer"
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
          >
            <MessageCircle
              className="w-4 h-4"
              style={{ color: activeTheme.primary }}
            />
            <span>Open Q&amp;A Panel ({qnaQuestions.length})</span>
          </button>
        </footer>

        {/* Q&A Modal */}
        {showQnA && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowQnA(false)}
          >
            <div
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm border-l shadow-2xl transition-colors"
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: activeTheme.border,
                color: activeTheme.text,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQnA(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:opacity-75 z-10 cursor-pointer"
                style={{ color: activeTheme.textMuted }}
              >
                <X className="w-5 h-5" />
              </button>
              <QnAPanel questions={qnaQuestions} onSubmit={handleQnASubmit} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render State 6: Active Slide (Presentation Mode) ──
  const { type, title, description, content, config } = currentSlide;

  return (
    <div
      className="min-h-screen flex flex-col justify-between pb-20 transition-colors duration-300"
      style={{
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
        fontFamily: getFontFamilyStyle(activeTheme.fontFamily),
      }}
    >
      {/* Floating live reaction overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            style={{ left: `${item.left}%`, bottom: "90px" }}
            className="absolute text-4xl animate-float-up"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Top Header Bar */}
      <header
        className="px-4 py-3 backdrop-blur-md border-b flex items-center justify-between sticky top-0 z-20 transition-colors"
        style={{
          backgroundColor: `${activeTheme.bg}e6`,
          borderColor: activeTheme.border,
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-lg uppercase border transition-colors"
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
              color: activeTheme.primary,
            }}
          >
            #{joinCode}
          </span>
          <span
            className="text-xs font-bold truncate max-w-[140px] sm:max-w-[200px]"
            style={{ color: activeTheme.text }}
          >
            {displayName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQnA(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active-press cursor-pointer"
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
          >
            <MessageCircle
              className="w-3.5 h-3.5"
              style={{ color: activeTheme.primary }}
            />
            <span>Q&amp;A</span>
            {qnaQuestions.length > 0 && (
              <span
                className="w-4 h-4 text-[10px] rounded-full flex items-center justify-center font-bold font-mono"
                style={{
                  backgroundColor: activeTheme.primary,
                  color: "#FFFFFF",
                }}
              >
                {qnaQuestions.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Slide Card Container with smooth slide entrance */}
      <main
        key={currentSlide.slideId}
        className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-xl mx-auto w-full animate-slide-up"
      >
        <div className="w-full mb-5 text-center space-y-2">
          <span
            className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider inline-block transition-colors"
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
              color: activeTheme.primary,
            }}
          >
            {config?.kicker
              ? config.kicker
              : type === "teaching"
                ? "📖 Teaching & Concept"
                : type === "information"
                  ? "📌 Key Takeaways"
                  : type === "question"
                    ? "❓ Discussion Topic"
                    : type === "quiz"
                      ? "🎯 Quiz Challenge"
                      : type === "poll" || type === "imagepoll"
                        ? "📊 Live Poll"
                        : type === "wordcloud"
                          ? "☁️ Word Cloud"
                          : type === "opentext"
                            ? "💬 Open Discussion"
                            : type === "rating"
                              ? "⭐ Rating Scale"
                              : type === "title"
                                ? "🎯 Presentation"
                                : "💡 Presentation Slide"}
          </span>

          <h2
            className="text-xl sm:text-2xl font-black tracking-tight leading-snug"
            style={{ color: activeTheme.text }}
          >
            {title || "Presentation Slide"}
          </h2>

          {description &&
            description !== config?.paragraph &&
            description !== content && (
              <p
                className="text-xs sm:text-sm max-w-md mx-auto leading-relaxed"
                style={{ color: activeTheme.textMuted }}
              >
                {description}
              </p>
            )}
        </div>

        {/* Global Media/Image Display for slides with images */}
        {(config?.mediaUrl || config?.imageUrl) && (
          <div
            className="w-full mb-5 overflow-hidden rounded-2xl border shadow-xs max-h-64 sm:max-h-80 flex items-center justify-center transition-colors"
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
            }}
          >
            <img
              src={config.mediaUrl || config.imageUrl}
              alt={config.mediaAlt || title || "Slide Visual"}
              className="w-full h-auto max-h-64 sm:max-h-80 object-contain rounded-2xl"
            />
          </div>
        )}

        {/* Teaching & Informational Rich Content Slides */}
        {(type === "teaching" ||
          type === "information" ||
          type === "question" ||
          type === "content" ||
          type === "default" ||
          type === "title" ||
          (!type && (content || config?.paragraph))) && (
          <div
            className="w-full border rounded-3xl p-5 sm:p-7 shadow-xs space-y-5 text-left transition-all"
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
          >
            {/* Main Teaching Paragraph / Content */}
            {(config?.paragraph ||
              config?.content ||
              content ||
              description) && (
              <div
                className="text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal"
                style={{ color: activeTheme.text }}
              >
                {config?.paragraph || config?.content || content || description}
              </div>
            )}

            {/* Bullet Points List */}
            {Array.isArray(config?.bulletPoints) &&
              config.bulletPoints.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  {config.bulletPoints.map((point: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-2xl border transition-all"
                      style={{
                        backgroundColor: activeTheme.bg,
                        borderColor: activeTheme.border,
                        color: activeTheme.text,
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono"
                        style={{
                          backgroundColor: `${activeTheme.primary}20`,
                          color: activeTheme.primary,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className="text-xs sm:text-sm leading-relaxed font-medium"
                        style={{ color: activeTheme.text }}
                      >
                        {point}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {/* Key Takeaway / Highlight Box */}
            {(config?.takeaway || config?.callout) && (
              <div
                className="p-4 rounded-2xl flex items-center gap-3 shadow-xs"
                style={{
                  backgroundColor: activeTheme.primary,
                  color: "#FFFFFF",
                }}
              >
                <Sparkles
                  className="w-5 h-5 shrink-0"
                  style={{ color: activeTheme.accent }}
                />
                <div className="text-xs sm:text-sm font-bold">
                  {config.takeaway || config.callout}
                </div>
              </div>
            )}

            {/* Author / Presenter Info if Title Slide */}
            {(config?.author || config?.authorRole) && (
              <div
                className="pt-3 border-t flex items-center gap-3"
                style={{ borderColor: activeTheme.border }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    backgroundColor: activeTheme.primary,
                    color: "#FFFFFF",
                  }}
                >
                  {config.author?.charAt(0) || "P"}
                </div>
                <div>
                  <div
                    className="text-xs font-bold"
                    style={{ color: activeTheme.text }}
                  >
                    {config.author || "Presenter"}
                  </div>
                  {config.authorRole && (
                    <div
                      className="text-[11px]"
                      style={{ color: activeTheme.textMuted }}
                    >
                      {config.authorRole}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Audience Engagement Note */}
            <div
              className="text-[11px] text-center pt-2 flex items-center justify-center gap-1.5 font-medium"
              style={{ color: activeTheme.textMuted }}
            >
              <Radio
                className="w-3 h-3 animate-pulse"
                style={{ color: activeTheme.primary }}
              />
              <span>
                Live explanation &bull; React using the emoji bar below
              </span>
            </div>
          </div>
        )}

        {/* Interactive Slide Types */}
        {(type === "poll" || type === "imagepoll") && (
          <PollInteraction
            key={currentSlide.slideId}
            slideId={currentSlide.slideId}
            options={config?.options || []}
            allowMultiple={config?.allowMultiple}
            hasSubmitted={hasSubmitted}
            responseLocked={responseLocked}
            allAnswered={Boolean(pollResults?.allAnswered)}
            audienceCount={audienceCount}
            onSubmit={(selected) =>
              handleInteractionSubmit("poll", { selectedOptions: selected })
            }
            results={pollResults}
            showResults={true}
          />
        )}

        {type === "quiz" && (
          <QuizInteraction
            key={currentSlide.slideId}
            slideId={currentSlide.slideId}
            options={config?.options || []}
            timer={config?.timer}
            hasSubmitted={hasSubmitted}
            responseLocked={responseLocked}
            allAnswered={Boolean(quizResults?.allAnswered)}
            audienceCount={audienceCount}
            totalResponses={
              quizResults?.totalResponses ?? quizResults?.totalSubmissions ?? 0
            }
            onSubmit={(selected, time) =>
              handleInteractionSubmit("quiz", {
                selectedOptions: selected,
                responseTimeMs: time,
              })
            }
            feedback={quizFeedback}
            revealedCorrectAnswers={
              revealedCorrectAnswers.length > 0
                ? revealedCorrectAnswers
                : quizResults?.correctAnswers ||
                  quizFeedback?.correctAnswers ||
                  config?.correctAnswers ||
                  []
            }
          />
        )}

        {type === "wordcloud" && (
          <WordCloudInteraction
            key={currentSlide.slideId}
            slideId={currentSlide.slideId}
            hasSubmitted={false}
            responseLocked={responseLocked}
            onSubmit={(word) => handleInteractionSubmit("wordcloud", { word })}
            results={wordCloudResults}
          />
        )}

        {type === "opentext" && (
          <OpenTextInteraction
            key={currentSlide.slideId}
            slideId={currentSlide.slideId}
            charLimit={config?.charLimit || 500}
            hasSubmitted={hasSubmitted}
            responseLocked={responseLocked}
            onSubmit={(text) => handleInteractionSubmit("opentext", { text })}
          />
        )}

        {type === "rating" && (
          <RatingInteraction
            key={currentSlide.slideId}
            slideId={currentSlide.slideId}
            ratingRange={config?.ratingRange || { min: 1, max: 5 }}
            hasSubmitted={hasSubmitted}
            responseLocked={responseLocked}
            onSubmit={(rating) => handleInteractionSubmit("rating", { rating })}
            results={ratingResults}
          />
        )}

        {type === "leaderboard" && (
          <div className="w-full space-y-4">
            <div
              className="p-6 rounded-3xl border text-center shadow-xs transition-colors"
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: activeTheme.border,
              }}
            >
              <div
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 border shadow-xs"
                style={{
                  backgroundColor: `${activeTheme.primary}20`,
                  borderColor: `${activeTheme.primary}40`,
                  color: activeTheme.primary,
                }}
              >
                <Trophy className="w-7 h-7" />
              </div>
              <h3
                className="text-xl font-black"
                style={{ color: activeTheme.text }}
              >
                Live Leaderboard
              </h3>
              <p
                className="text-xs mt-1"
                style={{ color: activeTheme.textMuted }}
              >
                {leaderboard.length} participant
                {leaderboard.length === 1 ? "" : "s"} ranked
              </p>
            </div>

            <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
              {leaderboard.length === 0 ? (
                <div
                  className="text-center py-8 text-xs"
                  style={{ color: activeTheme.textMuted }}
                >
                  Awaiting player points from quiz challenges...
                </div>
              ) : (
                leaderboard.map((entry, idx) => {
                  const isYou = entry.displayName === displayName;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl border transition-all"
                      style={{
                        backgroundColor: isYou
                          ? activeTheme.primary
                          : activeTheme.cardBg,
                        borderColor: isYou
                          ? activeTheme.primary
                          : activeTheme.border,
                        color: isYou ? "#FFFFFF" : activeTheme.text,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black"
                          style={{
                            backgroundColor:
                              idx === 0
                                ? "#F59E0B"
                                : idx === 1
                                  ? "#94A3B8"
                                  : idx === 2
                                    ? "#B45309"
                                    : isYou
                                      ? "rgba(255,255,255,0.2)"
                                      : `${activeTheme.primary}20`,
                            color:
                              idx === 0 || idx === 1 || idx === 2
                                ? "#FFFFFF"
                                : isYou
                                  ? "#FFFFFF"
                                  : activeTheme.primary,
                          }}
                        >
                          {entry.rank || idx + 1}
                        </span>
                        <span className="font-bold text-xs truncate max-w-[170px]">
                          {entry.displayName}{" "}
                          {isYou && (
                            <span className="text-[11px] opacity-75 font-normal">
                              (You)
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="font-mono font-black text-xs">
                        {entry.score || 0} pts
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {type === "thankyou" && (
          <div
            className="w-full text-center p-8 rounded-3xl border shadow-sm space-y-4 transition-colors"
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
            }}
          >
            <div
              className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center shadow-xs border"
              style={{
                backgroundColor: `${activeTheme.primary}20`,
                borderColor: `${activeTheme.primary}40`,
                color: activeTheme.primary,
              }}
            >
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3
              className="text-2xl sm:text-3xl font-black"
              style={{ color: activeTheme.text }}
            >
              {title || "Thank You!"}
            </h3>
            {description && (
              <p
                className="text-xs sm:text-sm max-w-sm mx-auto leading-relaxed"
                style={{ color: activeTheme.textMuted }}
              >
                {description}
              </p>
            )}
            {config?.callToAction && (
              <div className="pt-2">
                <span
                  className="inline-block px-5 py-2 rounded-full font-bold text-xs shadow-xs"
                  style={{
                    backgroundColor: activeTheme.primary,
                    color: "#FFFFFF",
                  }}
                >
                  {config.callToAction}
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Fixed Bottom Floating Emoji Reaction Bar */}
      {currentSlide && session?.status === "live" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
          <EmojiReactions
            joinCode={joinCode}
            slideId={currentSlide.slideId}
            onReact={handleReaction}
            counts={reactionCounts}
          />
        </div>
      )}

      {/* Q&A Modal / Slide-in Panel */}
      {showQnA && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowQnA(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm border-l shadow-2xl transition-colors"
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQnA(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:opacity-75 z-10 cursor-pointer"
              style={{ color: activeTheme.textMuted }}
            >
              <X className="w-5 h-5" />
            </button>
            <QnAPanel questions={qnaQuestions} onSubmit={handleQnASubmit} />
          </div>
        </div>
      )}
    </div>
  );
}
