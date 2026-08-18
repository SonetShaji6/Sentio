"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function AudienceView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const joinCode = params.sessionCode as string;
  const displayName = searchParams.get("name") || "Anonymous";

  const [connectionState, setConnectionState] = useState<
    "connecting" | "joined" | "error"
  >("connecting");
  const [errorMessage, setErrorMessage] = useState("");

  const [session, setSession] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState<SlideData | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [responseLocked, setResponseLocked] = useState(false);

  // Results state (for real-time updates)
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

  // Q&A
  const [showQnA, setShowQnA] = useState(false);
  const [qnaQuestions, setQnaQuestions] = useState<QnAQuestion[]>([]);

  const { isConnected, emit, subscribe } = useSocket();

  // Track submitted slides to prevent re-submission on slide revisit
  const [submittedSlides, setSubmittedSlides] = useState<Set<string>>(
    new Set(),
  );

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
        setSession(data.session);
        resetSlideState();
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SLIDE_CHANGED, () => {
        // Slide data will come via SLIDE_DATA event
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SLIDE_DATA, (data: SlideData) => {
        setCurrentSlide(data);
        setResponseLocked(data.responseLocked);
        // Check if already submitted this slide
        setHasSubmitted(submittedSlides.has(data.slideId));
        // Reset results for new slide
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
        setSession((prev: any) => (prev ? { ...prev, status: "ended" } : prev));
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SESSION_PAUSED, () => {
        setSession((prev: any) =>
          prev ? { ...prev, status: "paused" } : prev,
        );
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SESSION_RESUMED, () => {
        setSession((prev: any) => (prev ? { ...prev, status: "live" } : prev));
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
        if (data.type === "quiz") {
          setQuizFeedback({
            isCorrect: data.isCorrect,
            scoreAwarded: data.scoreAwarded,
            correctAnswers: data.correctAnswers,
            selectedOptions: data.selectedOptions,
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

    // Response lock events
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

    // Interaction errors
    unsubs.push(
      subscribe(SOCKET_EVENTS.INTERACTION_ERROR, (data: any) => {
        console.warn("Interaction error:", data.message);
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

  // ── Submission Handlers ──

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
        setSubmittedSlides((prev) => new Set(prev).add(currentSlide.slideId));
      }
    },
    [currentSlide, emit, joinCode],
  );

  const handleReaction = useCallback(
    (emoji: string) => {
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

  // ── Render States ──

  if (connectionState === "connecting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Connecting to session...</p>
      </div>
    );
  }

  if (connectionState === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Could Not Join
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {errorMessage}
          </p>
          <button
            onClick={() => router.push("/join")}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
          >
            Try Another Code
          </button>
        </div>
      </div>
    );
  }

  if (session?.status === "ended") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 text-center">
          <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Session Ended
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Thank you for participating!
          </p>
          <button
            onClick={() => router.push("/join")}
            className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-900 dark:text-white font-semibold rounded-xl"
          >
            Join Another Session
          </button>
        </div>
      </div>
    );
  }

  if (session?.status === "paused") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Session Paused
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          The presenter has paused the session. Please hold on.
        </p>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-4 animate-bounce">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          You&apos;re in!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-1">
          Waiting for the presenter to start the presentation...
        </p>
        <span className="text-sm font-mono text-gray-400">
          Code: {joinCode} &bull; {displayName}
        </span>
      </div>
    );
  }

  const { type, title, config } = currentSlide;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Top Bar */}
      <header className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
            {joinCode}
          </span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {displayName}
          </span>
        </div>
        <button
          onClick={() => setShowQnA(true)}
          className="flex items-center gap-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Q&amp;A</span>
          {qnaQuestions.length > 0 && (
            <span className="w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              {qnaQuestions.length}
            </span>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          {title || "Interactive Slide"}
        </h2>
        {currentSlide.description && (
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            {currentSlide.description}
          </p>
        )}

        {/* Interaction component */}
        {(type === "poll" || type === "imagepoll") && (
          <PollInteraction
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
            slideId={currentSlide.slideId}
            hasSubmitted={false}
            responseLocked={responseLocked}
            onSubmit={(word) => handleInteractionSubmit("wordcloud", { word })}
            results={wordCloudResults}
          />
        )}

        {type === "opentext" && (
          <OpenTextInteraction
            slideId={currentSlide.slideId}
            charLimit={config?.charLimit || 500}
            hasSubmitted={hasSubmitted}
            responseLocked={responseLocked}
            onSubmit={(text) => handleInteractionSubmit("opentext", { text })}
          />
        )}

        {type === "rating" && (
          <RatingInteraction
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
            <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 text-center shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-3">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white">
                Live Leaderboard
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {leaderboard.length} participant
                {leaderboard.length === 1 ? "" : "s"} joined
              </p>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {leaderboard.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-sm">
                  Waiting for players to score in quiz challenges...
                </div>
              ) : (
                leaderboard.map((entry, idx) => {
                  const isYou = entry.displayName === displayName;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isYou
                          ? "bg-blue-600/20 border-blue-500/50 ring-2 ring-blue-500/40 text-white"
                          : "bg-zinc-900/80 border-zinc-800 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                            idx === 0
                              ? "bg-amber-400 text-black shadow-md"
                              : idx === 1
                                ? "bg-zinc-300 text-black"
                                : idx === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {entry.rank || idx + 1}
                        </span>
                        <span className="font-bold text-sm truncate max-w-[170px]">
                          {entry.displayName}{" "}
                          {isYou && (
                            <span className="text-xs text-blue-400 font-normal">
                              (You)
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="font-mono font-black text-amber-400 text-sm">
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
          <div className="w-full text-center p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-3xl font-black text-white">
              {title || "Thank You!"}
            </h3>
            {currentSlide.description && (
              <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {currentSlide.description}
              </p>
            )}
            {config?.callToAction && (
              <div className="pt-2">
                <span className="inline-block px-5 py-2.5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 font-bold text-sm">
                  {config.callToAction}
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Emoji Reactions Bar */}
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

      {/* Q&A Panel */}
      {showQnA && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowQnA(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-850 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQnA(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 z-10"
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
