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

interface SlideData {
  slideId: string;
  type: string;
  title: string;
  description: string;
  content?: string;
  config: any;
  responseLocked: boolean;
}

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
    "connecting" | "joined" | "error"
  >("connecting");
  const [errorMessage, setErrorMessage] = useState("");

  const [session, setSession] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState<SlideData | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [responseLocked, setResponseLocked] = useState(false);

  // Results state
  const [pollResults, setPollResults] = useState<any>(null);
  const [quizFeedback, setQuizFeedback] = useState<any>(null);
  const [revealedCorrectAnswers, setRevealedCorrectAnswers] = useState<
    number[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [wordCloudResults, setWordCloudResults] = useState<any>(null);
  const [ratingResults, setRatingResults] = useState<any>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
    {},
  );

  // Floating live emoji animations
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  // Q&A
  const [showQnA, setShowQnA] = useState(false);
  const [qnaQuestions, setQnaQuestions] = useState<QnAQuestion[]>([]);

  const { isConnected, emit, subscribe } = useSocket();

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
      subscribe(SOCKET_EVENTS.JOIN_ERROR, (msg: string) => {
        setErrorMessage(msg);
        setConnectionState("error");
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
        if (data.correctAnswers) {
          setRevealedCorrectAnswers(data.correctAnswers);
        }
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.INTERACTION_RESULT, (data: any) => {
        if (data.type === "quiz" && typeof data.isCorrect === "boolean") {
          setQuizFeedback({
            isCorrect: data.isCorrect,
            scoreAwarded: data.scoreAwarded ?? 0,
            correctAnswers: data.correctAnswers ?? [],
            selectedOptions: data.selectedOptions ?? [],
          });
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
        if (data.slideId === currentSlide?.slideId) {
          setReactionCounts(data.counts || {});
        }
      }),
    );

    // Q&A
    unsubs.push(
      subscribe(SOCKET_EVENTS.QNA_UPDATE, (data: any) => {
        if (data.action === "new") {
          setQnaQuestions((prev) => [data.question, ...prev]);
        } else if (data.action === "moderated") {
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
      <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-6 md:p-10 animate-fade-in selection:bg-zinc-900 selection:text-white">
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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Connected
            </span>
          </div>
          <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
            #{joinCode}
          </span>
        </header>

        {/* Center Welcome Card */}
        <main className="max-w-md w-full mx-auto text-center space-y-6 my-auto py-8">
          {/* Avatar with initial */}
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-3xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black text-2xl shadow-xl mx-auto">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[10px] text-white">
              ✓
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
              You&apos;re in, {displayName}!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Waiting for the presenter to launch the first slide. Keep this
              screen open.
            </p>
          </div>

          {/* Animated Waiting Progress Bar */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />{" "}
                Live Room
              </span>
              <span className="font-mono">Ready to broadcast</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-zinc-950 dark:bg-white rounded-full animate-pulse w-2/3" />
            </div>
          </div>

          {/* Interactive Reaction Warmup Zone */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Test your reactions while waiting
            </span>
            <div className="flex justify-center gap-2">
              {WARMUP_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-11 h-11 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 transition-all hover:scale-110 active-press cursor-pointer"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-all active-press cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
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
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQnA(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 z-10 cursor-pointer"
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
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-zinc-900 selection:text-white pb-20">
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
      <header className="px-4 py-3 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-[11px] font-mono font-bold rounded-lg uppercase">
            #{joinCode}
          </span>
          <span className="text-xs font-bold text-zinc-950 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
            {displayName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQnA(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 transition-all active-press cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Q&amp;A</span>
            {qnaQuestions.length > 0 && (
              <span className="w-4 h-4 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[10px] rounded-full flex items-center justify-center font-bold font-mono">
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
        <div className="w-full mb-6 text-center space-y-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider inline-block">
            {type === "quiz"
              ? "🎯 Quiz Challenge"
              : type === "poll" || type === "imagepoll"
                ? "📊 Live Poll"
                : type === "wordcloud"
                  ? "☁️ Word Cloud"
                  : type === "opentext"
                    ? "💬 Open Discussion"
                    : type === "rating"
                      ? "⭐ Rating Scale"
                      : "💡 Presentation Slide"}
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight leading-snug">
            {title || "Presentation Slide"}
          </h2>

          {description && (
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Content Slide Display (when non-interactive text/bullet slide) */}
        {(type === "content" ||
          type === "default" ||
          type === "title" ||
          (!type && content)) && (
          <div className="w-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-4 text-center">
            {content ? (
              <div className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                Viewing presentation slide. Listen to the presenter and react
                using the emoji bar below.
              </p>
            )}
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
            onSubmit={(selected, time) =>
              handleInteractionSubmit("quiz", {
                selectedOptions: selected,
                responseTimeMs: time,
              })
            }
            feedback={quizFeedback}
            revealedCorrectAnswers={revealedCorrectAnswers}
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
            <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center mb-3">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-zinc-950 dark:text-white">
                Live Leaderboard
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {leaderboard.length} participant
                {leaderboard.length === 1 ? "" : "s"} ranked
              </p>
            </div>

            <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  Awaiting player points from quiz challenges...
                </div>
              ) : (
                leaderboard.map((entry, idx) => {
                  const isYou = entry.displayName === displayName;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isYou
                          ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-md"
                          : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                            idx === 0
                              ? "bg-amber-400 text-black shadow-xs"
                              : idx === 1
                                ? "bg-zinc-300 text-black"
                                : idx === 2
                                  ? "bg-amber-700 text-white"
                                  : isYou
                                    ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black"
                                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}
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
          <div className="w-full text-center p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white">
              {title || "Thank You!"}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {description}
              </p>
            )}
            {config?.callToAction && (
              <div className="pt-2">
                <span className="inline-block px-5 py-2 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs shadow-xs">
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
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQnA(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 z-10 cursor-pointer"
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
