"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken, API_URL } from "@/lib/auth";
import { useSocket } from "@/hooks/useSocket";
import { ISlide } from "@/types/slide";
import { SOCKET_EVENTS } from "@sentio/shared/src/events/socket.events";
import { QRCodeSVG } from "qrcode.react";
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
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Radio,
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
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const { isConnected, emit, subscribe } = useSocket();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

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
    presentation?.shareId?.substring(0, 6).toUpperCase() ||
    "SENTIO";

  const joinUrl = origin
    ? `${origin}/join?code=${joinCode}`
    : `https://sentio.app/join?code=${joinCode}`;

  const currentSlide = slides[currentSlideIndex];

  // Fetch Q&A questions on mount if session exists
  useEffect(() => {
    if (!presentation || !joinCode) return;

    const fetchQnA = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
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
    setSessionStatus("live");
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
      emit(SOCKET_EVENTS.HOST_SLIDE_CHANGE, {
        joinCode,
        slideIndex: newIndex,
      });
      setResults(null);
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

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-zinc-950 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/presentations/${presentationId}/edit`}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white"
            title="Back to Editor"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold truncate max-w-xs sm:max-w-sm text-white">
              {presentation.title}
            </h1>
            {sessionStatus === "live" && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <Link
            href={`/presentations/${presentationId}/analytics`}
            className="hidden sm:flex text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-xl items-center gap-1.5 text-zinc-300 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Analytics
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Join Code Display with Click-to-Copy */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 px-3.5 py-1.5 rounded-xl border border-zinc-800 transition-colors group cursor-pointer"
            title="Click to copy join link"
          >
            <span className="text-xs text-zinc-400">Code:</span>
            <span className="text-base sm:text-lg font-mono font-black tracking-widest text-white">
              {joinCode}
            </span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
            )}
          </button>

          {/* QR Code Trigger Button */}
          <button
            onClick={() => setShowQRModal(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-colors border border-zinc-800"
            title="Show Presentation QR Code"
          >
            <QrCode className="w-5 h-5 text-zinc-100" />
          </button>

          {/* Audience Counter */}
          <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
            <Users className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-sm">{audienceCount}</span>
          </div>

          {/* Start / End Controls */}
          {sessionStatus === "waiting" ? (
            <button
              onClick={handleStartSession}
              className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-xl font-bold transition-all shadow-lg text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Session</span>
            </button>
          ) : (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-2 bg-red-600/90 hover:bg-red-700 px-4 py-2 rounded-xl font-bold transition-colors text-sm cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>End Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Canvas / Lobby Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-black relative overflow-auto">
          {sessionStatus === "waiting" ? (
            /* Waiting Lobby with Large QR Code */
            <div className="max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-750 rounded-full text-zinc-300 text-xs font-semibold mb-6">
                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>Presentation Lobby Active</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-white">
                Join this Presentation
              </h2>
              <p className="text-sm text-zinc-400 mb-6">
                Scan the QR code with any phone camera or open the link below
              </p>

              {/* High-Resolution QR Code */}
              <div className="inline-block p-4 bg-white rounded-2xl shadow-xl mb-6 transform hover:scale-105 transition-transform duration-200">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Join URL & Code Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-black border border-zinc-800 rounded-2xl p-4 mb-8">
                <div className="text-left flex-1 truncate">
                  <div className="text-xs text-zinc-400">Join URL:</div>
                  <div className="text-sm font-mono text-zinc-200 font-semibold truncate">
                    {origin ? `${origin}/join` : "sentio.app/join"}
                  </div>
                </div>
                <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
                <div className="text-center sm:text-right">
                  <div className="text-xs text-zinc-400">Code:</div>
                  <div className="text-2xl font-mono font-black tracking-widest text-white">
                    {joinCode}
                  </div>
                </div>
              </div>

              {/* Start Session Button */}
              <button
                onClick={handleStartSession}
                className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl text-base cursor-pointer transform hover:scale-[1.01]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Live Presentation ({audienceCount} Connected)</span>
              </button>
            </div>
          ) : (
            /* Live Slide Preview */
            <div className="w-full max-w-5xl aspect-[16/9] relative bg-white text-black shadow-2xl rounded-2xl overflow-hidden ring-4 ring-zinc-800">
              {slides.length > 0 ? (
                <SlideEditor slide={currentSlide} />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500">
                  No slides available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Presenter Sidebar (Results & Moderation) */}
        {sessionStatus === "live" && showResults && isInteractiveSlide && (
          <div className="w-96 bg-zinc-950 border-l border-zinc-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-zinc-200 flex items-center gap-2 text-sm">
                <BarChart2 className="w-4 h-4 text-white" />
                Live Results
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleResponseLock}
                  className={`p-2 rounded-xl transition-colors ${
                    responseLocked
                      ? "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800"
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
                  className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900"
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
          <div className="w-96 bg-zinc-950 border-l border-zinc-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-zinc-200 flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-white" />
                Q&A
              </h3>
              <button
                onClick={() => setShowQnA(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900"
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

      {/* Presenter Controls (Bottom Bar) */}
      <div className="h-20 flex items-center justify-between px-8 bg-zinc-950 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          {sessionStatus === "live" && (
            <>
              {!showResults && isInteractiveSlide && (
                <button
                  onClick={() => setShowResults(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold transition-colors text-zinc-300 hover:text-white"
                >
                  <BarChart2 className="w-4 h-4" /> Show Results
                </button>
              )}
              {!showQnA && (
                <button
                  onClick={() => setShowQnA(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold relative transition-colors text-zinc-300 hover:text-white"
                >
                  <MessageCircle className="w-4 h-4" /> Q&A
                  {pendingQnA > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black rounded-full text-[10px] flex items-center justify-center font-bold">
                      {pendingQnA}
                    </span>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Slide Navigators */}
        <div className="flex items-center gap-6">
          <button
            onClick={goToPrevSlide}
            disabled={currentSlideIndex === 0 || sessionStatus !== "live"}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-colors border border-zinc-800 text-zinc-300 hover:text-white"
            title="Previous Slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-base font-bold text-zinc-200 w-24 text-center font-mono">
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
            className="p-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-colors border border-zinc-800 text-zinc-300 hover:text-white"
            title="Next Slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors border border-zinc-800"
            title="Show Join Info"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Join Info</span>
          </button>
        </div>
      </div>

      {/* Pop-up QR Code Modal for Live Presenting */}
      {showQRModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Join this Presentation
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Scan with phone camera to participate
            </p>

            <div className="inline-block p-4 bg-white rounded-2xl shadow-2xl mb-6">
              <QRCodeSVG
                value={joinUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="bg-black border border-zinc-800 rounded-2xl p-3.5 mb-6 text-center">
              <div className="text-xs text-zinc-400 mb-1">
                Go to{" "}
                <span className="text-white font-bold">sentio.app/join</span> &
                enter:
              </div>
              <div className="text-3xl font-mono font-black tracking-widest text-white">
                {joinCode}
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-3 bg-white hover:bg-zinc-200 text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Join Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
