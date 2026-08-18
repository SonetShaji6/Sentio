"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@sentio/shared/src/events/socket.events";
import { Heart, AlertCircle, MessageCircle, X } from "lucide-react";

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
      subscribe(SOCKET_EVENTS.INTERACTION_RESULT, (data: any) => {
        if (data.type === "quiz" && data.isCorrect !== undefined) {
          setQuizFeedback({
            isCorrect: data.isCorrect,
            scoreAwarded: data.scoreAwarded,
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

    // Response lock events
    unsubs.push(
      subscribe(SOCKET_EVENTS.RESPONSE_LOCK, (data: any) => {
        if (!data.slideId || data.slideId === currentSlide?.slideId) {
          setResponseLocked(true);
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
        // Show briefly — could enhance with toast
        console.warn("Interaction error:", data.message);
      }),
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, joinCode, displayName]);

  const resetSlideState = () => {
    setCurrentSlide(null);
    setHasSubmitted(false);
    setPollResults(null);
    setQuizFeedback(null);
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
        // Word cloud allows unlimited submissions
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Connecting to presentation...
        </h2>
      </div>
    );
  }

  if (connectionState === "error" || (session && session.status === "ended")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {errorMessage || "This presentation has ended"}
        </h2>
        <button
          onClick={() => router.push("/join")}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          Join Another Session
        </button>
      </div>
    );
  }

  if (
    session &&
    (session.status === "waiting" || session.status === "paused")
  ) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-4 text-center transition-colors">
        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
          <Heart className="w-10 h-10 text-zinc-950 dark:text-white animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-zinc-950 dark:text-white mb-2">
          You&apos;re in, {displayName}!
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-sm">
          {session.status === "waiting"
            ? "Waiting for the presenter to start the presentation..."
            : "The presentation is currently paused."}
        </p>
      </div>
    );
  }

  // ── Active Live Slide ──

  const renderInteraction = () => {
    if (!currentSlide) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Waiting for presenter...
          </p>
        </div>
      );
    }

    const { type, config } = currentSlide;
    const isInteractive = [
      "poll",
      "quiz",
      "wordcloud",
      "opentext",
      "rating",
      "imagepoll",
    ].includes(type);

    if (!isInteractive) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {currentSlide.title || "Listening..."}
          </h2>
          {currentSlide.description && (
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {currentSlide.description}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full">
        {/* Slide title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          {currentSlide.title || "Question"}
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
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors">
      <header className="p-4 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-850 flex items-center justify-between shadow-sm">
        <div className="font-extrabold text-zinc-950 dark:text-white text-lg tracking-tight">
          Sentio
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQnA(!showQnA)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors relative text-zinc-700 dark:text-zinc-300"
          >
            <MessageCircle className="w-5 h-5" />
            {qnaQuestions.filter((q) => q.status === "pending").length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-950 dark:bg-white text-white dark:text-black rounded-full text-[10px] flex items-center justify-center font-bold">
                {qnaQuestions.filter((q) => q.status === "pending").length}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto relative">
        {renderInteraction()}
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
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl"
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
