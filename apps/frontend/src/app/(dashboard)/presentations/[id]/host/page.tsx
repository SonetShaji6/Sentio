"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken, API_URL } from "@/lib/auth";
import { useSocket } from "@/hooks/useSocket";
import { ISlide } from "@/types/slide";
import { SOCKET_EVENTS } from "@sentio/shared/src/events/socket.events";
import {
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowLeft,
  Lock,
  Unlock,
  MessageCircle,
  BarChart2,
  X,
} from "lucide-react";
import Link from "next/link";
import { SlideEditor } from "@/components/builder/SlideEditor";
import { PresenterResults } from "@/components/presenter/PresenterResults";
import { ModerationPanel } from "@/components/presenter/ModerationPanel";
import { QnAPanel } from "@/components/interactions/QnAPanel";

export default function HostPresenterView() {
  const params = useParams();
  const router = useRouter();
  const presentationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [presentation, setPresentation] = useState<any>(null);
  const [slides, setSlides] = useState<ISlide[]>([]);

  const [sessionStatus, setSessionStatus] = useState<
    "waiting" | "live" | "ended"
  >("waiting");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [audienceCount, setAudienceCount] = useState(0);

  // Interaction State
  const [results, setResults] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [responseLocked, setResponseLocked] = useState(false);
  const [qnaQuestions, setQnaQuestions] = useState<any[]>([]);

  // UI State
  const [showQnA, setShowQnA] = useState(false);
  const [showResults, setShowResults] = useState(true);

  const { isConnected, emit, subscribe } = useSocket();

  useEffect(() => {
    const fetchData = async () => {
      const token = getAccessToken();
      if (!token) return router.replace("/login");

      try {
        const [presRes, slidesRes] = await Promise.all([
          fetch(`${API_URL}/api/presentations/${presentationId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/presentations/${presentationId}/slides`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (presRes.ok && slidesRes.ok) {
          const presData = await presRes.json();
          setPresentation(presData);
          setSlides(await slidesRes.json());
        }
      } catch (error) {
        console.error("Error fetching presentation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [presentationId, router]);

  const joinCode =
    presentation?.sessionCode ||
    presentation?.shareId?.substring(0, 6).toUpperCase();
  const currentSlide = slides[currentSlideIndex];

  // Fetch Q&A questions on mount if session exists
  useEffect(() => {
    if (!presentation || !joinCode) return;

    const fetchQnA = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        // We need the sessionId, which requires fetching the active session
        const sessionsRes = await fetch(
          `${API_URL}/api/sessions/presentation/${presentationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (sessionsRes.ok) {
          const sessions = await sessionsRes.json();
          const activeSession = sessions.find(
            (s: any) => s.status === "live" || s.status === "paused",
          );

          if (activeSession) {
            const qnaRes = await fetch(
              `${API_URL}/api/sessions/${activeSession._id}/qna`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (qnaRes.ok) {
              setQnaQuestions(await qnaRes.json());
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch QnA", err);
      }
    };

    if (sessionStatus === "live") {
      fetchQnA();
    }
  }, [presentation, presentationId, sessionStatus, joinCode]);

  // Socket setup
  useEffect(() => {
    if (!isConnected || !presentation) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribe(SOCKET_EVENTS.SESSION_STARTED, () => {
        setSessionStatus("live");
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.SESSION_ENDED, () => {
        setSessionStatus("ended");
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.AUDIENCE_UPDATED, (data: { count: number }) => {
        setAudienceCount(data.count);
      }),
    );

    // Interactions
    const handleResultUpdate = (data: any) => {
      if (currentSlide && data.slideId === currentSlide._id) {
        setResults(data);
      }
    };

    unsubs.push(subscribe(SOCKET_EVENTS.POLL_UPDATE, handleResultUpdate));
    unsubs.push(subscribe(SOCKET_EVENTS.QUIZ_UPDATE, handleResultUpdate));
    unsubs.push(subscribe(SOCKET_EVENTS.WORDCLOUD_UPDATE, handleResultUpdate));
    unsubs.push(subscribe(SOCKET_EVENTS.RATING_UPDATE, handleResultUpdate));

    unsubs.push(
      subscribe(SOCKET_EVENTS.OPENTEXT_UPDATE, (data: any) => {
        if (currentSlide && data.slideId === currentSlide._id) {
          setResults((prev: any) => {
            const r = prev || {
              slideId: data.slideId,
              totalResponses: 0,
              responses: [],
            };
            return {
              ...r,
              totalResponses: r.totalResponses + 1,
              responses: [data.response, ...r.responses],
            };
          });
        }
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.LEADERBOARD_UPDATE, (data: any) => {
        setLeaderboard(data);
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.RESPONSE_MODERATED, (data: any) => {
        if (currentSlide && data.interaction.slideId === currentSlide._id) {
          setResults((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              responses: prev.responses.map((r: any) =>
                r.id === data.interaction.id ? data.interaction : r,
              ),
            };
          });
        }
      }),
    );

    // Locks
    unsubs.push(
      subscribe(SOCKET_EVENTS.RESPONSE_LOCK, (data: any) => {
        if (!data.slideId || data.slideId === currentSlide?._id) {
          setResponseLocked(true);
        }
      }),
    );

    unsubs.push(
      subscribe(SOCKET_EVENTS.RESPONSE_UNLOCK, (data: any) => {
        if (!data.slideId || data.slideId === currentSlide?._id) {
          setResponseLocked(false);
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

    return () => unsubs.forEach((u) => u());
  }, [isConnected, subscribe, presentation, currentSlide]);

  const handleStartSession = () => {
    if (!presentation) return;
    emit(SOCKET_EVENTS.HOST_START, { presentationId, joinCode });
  };

  const handleEndSession = () => {
    if (!presentation) return;
    emit(SOCKET_EVENTS.HOST_END, { joinCode });
    router.push(`/presentations/${presentationId}/edit`);
  };

  const changeSlide = useCallback(
    (newIndex: number) => {
      setCurrentSlideIndex(newIndex);
      emit(SOCKET_EVENTS.HOST_SLIDE_CHANGE, { joinCode, slideIndex: newIndex });
      setResults(null); // Reset results for new slide
      setResponseLocked(false);
    },
    [emit, joinCode],
  );

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      changeSlide(currentSlideIndex + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      changeSlide(currentSlideIndex - 1);
    }
  };

  const toggleResponseLock = () => {
    if (!currentSlide) return;
    if (responseLocked) {
      emit(SOCKET_EVENTS.HOST_UNLOCK_RESPONSES, {
        joinCode,
        slideId: currentSlide._id,
      });
    } else {
      emit(SOCKET_EVENTS.HOST_LOCK_RESPONSES, {
        joinCode,
        slideId: currentSlide._id,
      });
    }
  };

  const handleModerateOpenText = (
    interactionId: string,
    action: "approve" | "hide" | "highlight",
  ) => {
    emit(SOCKET_EVENTS.RESPONSE_MODERATED, { joinCode, interactionId, action });
  };

  const handleModerateQnA = (
    questionId: string,
    action: "pin" | "resolve" | "hide",
  ) => {
    emit(SOCKET_EVENTS.QNA_MODERATE, { joinCode, questionId, action });
  };

  if (loading || !presentation) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const isInteractiveSlide =
    currentSlide &&
    ["poll", "quiz", "wordcloud", "opentext", "rating", "imagepoll"].includes(
      currentSlide.type,
    );

  const pendingQnA = qnaQuestions.filter((q) => q.status === "pending").length;

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link
            href={`/presentations/${presentationId}/edit`}
            className="p-2 hover:bg-gray-800 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold truncate max-w-sm">
            {presentation.title}
          </h1>
          <Link
            href={`/presentations/${presentationId}/analytics`}
            className="ml-2 text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-gray-300"
          >
            <BarChart2 className="w-4 h-4" />
            Analytics
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-400">Join Code:</span>
            <span className="text-xl font-bold tracking-widest">
              {joinCode}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-400 bg-gray-800 px-4 py-2 rounded-lg">
            <Users className="w-5 h-5" />
            <span className="font-medium text-lg">{audienceCount}</span>
          </div>

          {sessionStatus === "waiting" ? (
            <button
              onClick={handleStartSession}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Session
            </button>
          ) : (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Square className="w-5 h-5 fill-current" />
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black relative">
          {sessionStatus === "waiting" ? (
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">
                Waiting for audience...
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Go to{" "}
                <span className="text-white font-mono">sentio.app/join</span>{" "}
                and enter code{" "}
                <span className="text-white font-mono text-3xl ml-2 tracking-wider">
                  {joinCode}
                </span>
              </p>
            </div>
          ) : (
            <div className="w-full max-w-5xl aspect-[16/9] relative bg-white text-black shadow-2xl rounded-xl overflow-hidden ring-4 ring-gray-800">
              {slides.length > 0 ? (
                <SlideEditor slide={currentSlide} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  No slides available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Presenter Sidebar (Results & Moderation) */}
        {sessionStatus === "live" && showResults && isInteractiveSlide && (
          <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-200">Live Results</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleResponseLock}
                  className={`p-2 rounded-lg transition-colors ${
                    responseLocked
                      ? "bg-amber-900/50 text-amber-500"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                  }`}
                  title={responseLocked ? "Unlock Responses" : "Lock Responses"}
                >
                  {responseLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setShowResults(false)}
                  className="p-2 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <PresenterResults
                slideType={currentSlide.type}
                results={results}
                leaderboard={leaderboard}
                participantCount={audienceCount}
              />

              {currentSlide.type === "opentext" && results?.responses && (
                <ModerationPanel
                  responses={results.responses}
                  onModerate={handleModerateOpenText}
                />
              )}
            </div>
          </div>
        )}

        {/* Q&A Sidebar */}
        {sessionStatus === "live" && showQnA && (
          <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-200">Q&A</h3>
              <button
                onClick={() => setShowQnA(false)}
                className="p-2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <QnAPanel
                questions={qnaQuestions}
                onSubmit={() => {}}
                isPresenter={true}
                onModerate={handleModerateQnA}
              />
            </div>
          </div>
        )}
      </div>

      {/* Presenter Controls (Bottom) */}
      <div className="h-20 flex items-center justify-between px-8 bg-gray-900 border-t border-gray-800">
        <div className="flex items-center gap-4">
          {sessionStatus === "live" && (
            <>
              {!showResults && isInteractiveSlide && (
                <button
                  onClick={() => setShowResults(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium"
                >
                  <BarChart2 className="w-4 h-4" /> Show Results
                </button>
              )}
              {!showQnA && (
                <button
                  onClick={() => setShowQnA(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium relative"
                >
                  <MessageCircle className="w-4 h-4" /> Q&A
                  {pendingQnA > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                      {pendingQnA}
                    </span>
                  )}
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-8">
          <button
            onClick={goToPrevSlide}
            disabled={currentSlideIndex === 0 || sessionStatus !== "live"}
            className="p-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div className="text-lg font-medium text-gray-400 w-24 text-center">
            {slides.length > 0
              ? `${currentSlideIndex + 1} / ${slides.length}`
              : "0 / 0"}
          </div>

          <button
            onClick={goToNextSlide}
            disabled={
              currentSlideIndex === slides.length - 1 ||
              sessionStatus !== "live"
            }
            className="p-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
        <div className="w-32"></div> {/* Spacer for center alignment */}
      </div>
    </div>
  );
}
