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
  UserX,
  UserCheck,
  ShieldCheck,
  CheckCheck,
  Ban,
  Search,
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
  Keyboard,
  Loader2,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  ArrowRight,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { SlideEditor } from "@/components/builder/SlideEditor";
import { PresenterResults } from "@/components/presenter/PresenterResults";
import { ModerationPanel } from "@/components/presenter/ModerationPanel";
import { LiveAICoachPanel } from "@/components/presenter/LiveAICoachPanel";
import { QnAPanel } from "@/components/interactions/QnAPanel";
import { KeyboardShortcutsModal } from "@/components/builder/KeyboardShortcutsModal";

export default function HostPresenterView() {
  const params = useParams();
  const router = useRouter();
  const presentationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [presentation, setPresentation] = useState<any>(null);
  const [slides, setSlides] = useState<ISlide[]>([]);

  const [sessionStatus, setSessionStatus] = useState<
    "ready" | "presenting" | "paused" | "complete" | "ended"
  >("ready");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [audienceCount, setAudienceCount] = useState(0);
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Participants & Admission State
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [requireApproval, setRequireApproval] = useState(true);
  const [participantsTab, setParticipantsTab] = useState<
    "pending" | "approved"
  >("approved");

  // Interaction State
  const [results, setResults] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [responseLocked, setResponseLocked] = useState(false);
  const [qnaQuestions, setQnaQuestions] = useState<any[]>([]);

  // UI State
  const [showQnA, setShowQnA] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [activePresenterTab, setActivePresenterTab] = useState<
    "results" | "aicoach" | "qna"
  >("aicoach");
  const [isPresenterSidebarOpen, setIsPresenterSidebarOpen] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [joinCode, setJoinCode] = useState<string>("");

  // Report Generation State on Ending Session
  const [isEndingModalOpen, setIsEndingModalOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<
    "idle" | "processing" | "completed" | "failed"
  >("idle");
  const [processingSeconds, setProcessingSeconds] = useState(0);
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportError, setReportError] = useState<string | null>(null);

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
        const [presRes, slidesRes, initRes] = await Promise.all([
          fetch(`${API_URL}/api/presentations/${presentationId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/presentations/${presentationId}/slides`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/sessions/presentation/${presentationId}/init`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (presRes.ok && slidesRes.ok) {
          const presData = await presRes.json();
          setPresentation(presData);
          setSlides(await slidesRes.json());
          if (presData.sessionCode) {
            setJoinCode(presData.sessionCode);
          }
        }

        if (initRes.ok) {
          const initData = await initRes.json();
          if (initData.joinCode) {
            setJoinCode(initData.joinCode);
          }
          if (initData.session) {
            setCurrentSession(initData.session);
            if (initData.session.status === "presenting") {
              setSessionStatus("presenting");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching presentation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [presentationId, router]);

  const joinUrl =
    origin && joinCode
      ? `${origin}/join?code=${joinCode}`
      : `https://sentio.app/join?code=${joinCode || "SENTIO"}`;

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
            setCurrentSession(activeSession);
            // Fetch Q&A
            const qnaRes = await fetch(
              `${API_URL}/api/sessions/${activeSession._id}/qna`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (qnaRes.ok) {
              setQnaQuestions(await qnaRes.json());
            }

            // Fetch Participants
            const partRes = await fetch(
              `${API_URL}/api/sessions/${activeSession._id}/participants`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (partRes.ok) {
              const data = await partRes.json();
              if (Array.isArray(data)) {
                setParticipants(data);
              } else if (data && data.participants) {
                setParticipants(data.participants);
                if (typeof data.requireApproval === "boolean") {
                  setRequireApproval(data.requireApproval);
                }
              }
            }

            // Fetch Slide Results if interactive
            if (currentSlide) {
              const resultsRes = await fetch(
                `${API_URL}/api/sessions/${activeSession._id}/results/${currentSlide._id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              if (resultsRes.ok) {
                const data = await resultsRes.json();
                if (
                  data &&
                  (data.totalResponses > 0 || data.totalSubmissions > 0)
                ) {
                  setResults(data);
                }
              }

              if (currentSlide.type === "quiz") {
                const lbRes = await fetch(
                  `${API_URL}/api/sessions/${activeSession._id}/leaderboard`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  },
                );
                if (lbRes.ok) {
                  setLeaderboard(await lbRes.json());
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch session state", err);
      }
    };

    if (sessionStatus === "presenting" || sessionStatus === "ready") {
      fetchQnA();
    }
  }, [presentation, presentationId, sessionStatus, joinCode, currentSlide]);

  // Floating live emoji animations for host view
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: string; emoji: string; left: number }[]
  >([]);

  const spawnFloatingEmoji = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const left = Math.floor(Math.random() * 70) + 15;
    setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1500);
  };

  // Kick Participant handler (adds them to ban list)
  const handleKickParticipant = (participant: any) => {
    if (
      !confirm(
        `Are you sure you want to kick and ban "${participant.displayName}" from rejoining this session?`,
      )
    ) {
      return;
    }
    emit(SOCKET_EVENTS.HOST_KICK_PARTICIPANT, {
      joinCode,
      socketId: participant.socketId,
      displayName: participant.displayName,
    });
  };

  // Admit single participant
  const handleAdmitParticipant = (participant: any) => {
    emit(SOCKET_EVENTS.HOST_ADMIT_PARTICIPANT, {
      joinCode,
      socketId: participant.socketId,
      displayName: participant.displayName,
    });
  };

  // Reject / Decline admission request
  const handleRejectParticipant = (participant: any) => {
    if (
      !confirm(`Decline admission request from "${participant.displayName}"?`)
    ) {
      return;
    }
    emit(SOCKET_EVENTS.HOST_REJECT_PARTICIPANT, {
      joinCode,
      socketId: participant.socketId,
      displayName: participant.displayName,
    });
  };

  // Admit all pending participants
  const handleAdmitAll = () => {
    emit(SOCKET_EVENTS.HOST_ADMIT_ALL, { joinCode });
  };

  // Toggle require approval setting
  const handleToggleApproval = () => {
    const nextVal = !requireApproval;
    setRequireApproval(nextVal);
    emit(SOCKET_EVENTS.HOST_TOGGLE_APPROVAL, {
      joinCode,
      requireApproval: nextVal,
    });
  };

  // Socket setup
  useEffect(() => {
    if (!isConnected || !presentation || !joinCode) return;

    emit("host-join", { joinCode, presentationId });

    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribe(SOCKET_EVENTS.SESSION_STARTED, (data: any) => {
        setSessionStatus("presenting");
        if (data?.session?.joinCode) {
          setJoinCode(data.session.joinCode);
        }
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

    unsubs.push(
      subscribe(SOCKET_EVENTS.PARTICIPANTS_UPDATE, (data: any) => {
        if (data.participants) {
          setParticipants(data.participants);
        }
        if (typeof data.requireApproval === "boolean") {
          setRequireApproval(data.requireApproval);
        }
      }),
    );

    // Live Reactions
    unsubs.push(
      subscribe(SOCKET_EVENTS.REACTION_UPDATE, (data: any) => {
        if (data.emoji) {
          spawnFloatingEmoji(data.emoji);
        }
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
        } else if (data.action === "moderated" || data.action === "replied") {
          setQnaQuestions((prev) =>
            prev.map((q) => (q.id === data.question.id ? data.question : q)),
          );
        }
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, [
    isConnected,
    subscribe,
    presentation,
    currentSlide,
    joinCode,
    presentationId,
  ]);

  const handleStartSession = () => {
    if (!presentation) return;
    setSessionStatus("presenting");
    emit(SOCKET_EVENTS.HOST_START, { presentationId, joinCode });
  };

  const handleEndSession = async () => {
    if (!presentation) return;
    setIsEndingModalOpen(true);
    setReportStatus("processing");
    setReportError(null);
    setProcessingSeconds(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      setProcessingSeconds((Date.now() - startTime) / 1000);
    }, 100);

    try {
      emit(SOCKET_EVENTS.HOST_END, {
        joinCode,
        sessionId: currentSession?._id,
        presentationId,
      });

      const token = getAccessToken();
      if (currentSession?._id && token) {
        const res = await fetch(
          `${API_URL}/api/sessions/${currentSession._id}/end`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          clearInterval(interval);
          const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
          setProcessingSeconds(Number(finalTime));
          setReportResult({ ...data, elapsed: finalTime });
          setReportStatus("completed");
          setSessionStatus("ended");
        } else {
          throw new Error("Failed to compile session intelligence report.");
        }
      } else {
        clearInterval(interval);
        setReportStatus("completed");
        setSessionStatus("ended");
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error("End session error:", err);
      setReportError(
        err.message ||
          "Failed to generate report. You can regenerate it anytime from the Presentations page.",
      );
      setReportStatus("failed");
    }
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

  const handleInsertSlideFromAI = async (
    suggestedSlide: any,
    presentImmediately = false,
  ) => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const newOrder = currentSlideIndex + 1;
      const res = await fetch(
        `${API_URL}/api/presentations/${presentationId}/slides`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: suggestedSlide.type || "poll",
            order: newOrder,
            title: suggestedSlide.title || "Interactive Slide",
            description: suggestedSlide.description || "",
            config: suggestedSlide.config || {},
          }),
        },
      );

      if (res.ok) {
        const freshSlidesRes = await fetch(
          `${API_URL}/api/presentations/${presentationId}/slides`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (freshSlidesRes.ok) {
          const freshSlides = await freshSlidesRes.json();
          setSlides(freshSlides);
        }

        if (presentImmediately) {
          changeSlide(newOrder);
        }
      }
    } catch (err) {
      console.error("Insert slide from AI coach error:", err);
    }
  };

  const handleUpdateSlideFromAI = async (slideId: string, updates: any) => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/presentations/${presentationId}/slides/${slideId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        },
      );

      if (res.ok) {
        const updated = await res.json();
        setSlides((prev) =>
          prev.map((s) => (s._id === slideId ? { ...s, ...updated } : s)),
        );
      }
    } catch (err) {
      console.error("Update slide from AI coach error:", err);
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
    action: "pin" | "resolve" | "hide" | "reply",
    answerText?: string,
  ) => {
    emit(SOCKET_EVENTS.QNA_MODERATE, {
      joinCode,
      questionId,
      action,
      answerText,
    });
  };

  // Keyboard Shortcuts Listener for Presenter Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "Escape") {
        if (showQRModal) {
          setShowQRModal(false);
          return;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        router.push(`/presentations/${presentationId}/edit`);
        return;
      }

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      // Next slide (ArrowRight, Space, PageDown, N)
      if (
        e.key === "ArrowRight" ||
        e.key === " " ||
        e.key === "PageDown" ||
        e.key.toLowerCase() === "n"
      ) {
        e.preventDefault();
        goToNextSlide();
        return;
      }

      // Previous slide (ArrowLeft, PageUp, P)
      if (
        e.key === "ArrowLeft" ||
        e.key === "PageUp" ||
        e.key.toLowerCase() === "p"
      ) {
        e.preventDefault();
        goToPrevSlide();
        return;
      }

      // Fullscreen toggle (F)
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }

      // Lock toggle (L)
      if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleResponseLock();
        return;
      }

      // Toggle QR modal (M)
      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        setShowQRModal((prev) => !prev);
        return;
      }

      // Toggle Results (R)
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        setActivePresenterTab("results");
        setIsPresenterSidebarOpen((prev) =>
          activePresenterTab === "results" ? !prev : true,
        );
        return;
      }

      // Toggle AI Coach (C)
      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        setActivePresenterTab("aicoach");
        setIsPresenterSidebarOpen((prev) =>
          activePresenterTab === "aicoach" ? !prev : true,
        );
        return;
      }

      // Toggle Q&A (Q)
      if (e.key.toLowerCase() === "q") {
        e.preventDefault();
        setActivePresenterTab("qna");
        setIsPresenterSidebarOpen((prev) =>
          activePresenterTab === "qna" ? !prev : true,
        );
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    goToNextSlide,
    goToPrevSlide,
    toggleResponseLock,
    showQRModal,
    isShortcutsOpen,
    presentationId,
    router,
  ]);

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
  const pendingParticipants = participants.filter(
    (p) => p.isApproved === false,
  );
  const approvedParticipants = participants.filter(
    (p) => p.isApproved !== false,
  );

  const activeTabParticipants =
    participantsTab === "pending" ? pendingParticipants : approvedParticipants;

  const filteredParticipants = activeTabParticipants.filter((p) =>
    (p.displayName || "")
      .toLowerCase()
      .includes(participantSearch.toLowerCase().trim()),
  );

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 sm:px-6 bg-zinc-950 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/presentations/${presentationId}/edit`}
            className="p-1.5 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white"
            title="Back to Editor (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold truncate max-w-xs sm:max-w-sm text-white">
              {presentation.title}
            </h1>
            {(sessionStatus === "presenting" ||
              sessionStatus === "complete") && (
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

          {/* Pending Admission Alert Badge */}
          {pendingParticipants.length > 0 && (
            <button
              onClick={() => {
                setParticipantsTab("pending");
                setIsParticipantsOpen(true);
              }}
              className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse transition-all cursor-pointer shadow-sm"
              title={`${pendingParticipants.length} participant(s) waiting for admission`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{pendingParticipants.length} Knocking</span>
            </button>
          )}

          {/* Audience Counter / Participants Modal Trigger */}
          <button
            onClick={() => {
              if (pendingParticipants.length > 0) {
                setParticipantsTab("pending");
              } else {
                setParticipantsTab("approved");
              }
              setIsParticipantsOpen(true);
            }}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
            title="View & Manage Joined Participants"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-sm">{audienceCount}</span>
          </button>

          {/* Start / End Controls */}
          {sessionStatus === "ready" ? (
            <button
              onClick={handleStartSession}
              className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-xl font-bold transition-all shadow-lg text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Session</span>
            </button>
          ) : sessionStatus === "presenting" || sessionStatus === "complete" ? (
            <button
              onClick={() => handleEndSession()}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg text-sm cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>End Session</span>
            </button>
          ) : (
            <span className="text-zinc-500 font-bold text-xs">Ended</span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Canvas / Lobby Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-black relative overflow-auto">
          {sessionStatus === "ready" ? (
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
            <div className="w-full h-full max-w-6xl max-h-[82vh] relative flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl">
              {slides.length > 0 ? (
                <SlideEditor
                  slide={currentSlide}
                  theme={presentation?.theme}
                  joinCode={joinCode}
                  isHost={true}
                  showToolbar={false}
                  leaderboard={leaderboard}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 font-medium">
                  No slides available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Presenter Assistant Sidebar (Results, AI Coach, Q&A) */}
        {(sessionStatus === "presenting" || sessionStatus === "complete") &&
          isPresenterSidebarOpen && (
            <div className="w-[420px] max-w-[90vw] bg-zinc-950 border-l border-zinc-800 flex flex-col shrink-0 shadow-2xl z-20">
              {/* Unified Sidebar Tab Bar */}
              <div className="p-2.5 px-3 border-b border-zinc-800/80 bg-zinc-900/70 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {isInteractiveSlide && (
                    <button
                      onClick={() => setActivePresenterTab("results")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        activePresenterTab === "results"
                          ? "bg-zinc-800 text-white shadow-xs"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Live Results</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActivePresenterTab("aicoach")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                      activePresenterTab === "aicoach"
                        ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border border-indigo-500/40 shadow-xs"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AI Coach</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </button>

                  <button
                    onClick={() => setActivePresenterTab("qna")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                      activePresenterTab === "qna"
                        ? "bg-zinc-800 text-white shadow-xs"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Q&A</span>
                    {pendingQnA > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold">
                        {pendingQnA}
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {activePresenterTab === "results" && isInteractiveSlide && (
                    <button
                      onClick={toggleResponseLock}
                      className={`p-1.5 rounded-lg transition-colors ${
                        responseLocked
                          ? "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      }`}
                      title={
                        responseLocked ? "Unlock Responses" : "Lock Responses"
                      }
                    >
                      {responseLocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setIsPresenterSidebarOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                    title="Close sidebar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {activePresenterTab === "results" && isInteractiveSlide && (
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
                )}

                {activePresenterTab === "aicoach" && (
                  <LiveAICoachPanel
                    presentationId={presentationId}
                    sessionId={currentSession?._id}
                    deckTitle={presentation?.title}
                    currentSlide={currentSlide}
                    currentSlideIndex={currentSlideIndex}
                    results={results}
                    audienceCount={audienceCount}
                    onInsertSlide={handleInsertSlideFromAI}
                    onUpdateSlide={handleUpdateSlideFromAI}
                  />
                )}

                {activePresenterTab === "qna" && (
                  <div className="flex-1 overflow-hidden">
                    <QnAPanel
                      questions={qnaQuestions}
                      onSubmit={() => {}}
                      isPresenter={true}
                      onModerate={handleModerateQnA}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Presenter Controls (Bottom Bar) */}
      <div className="h-20 flex items-center justify-between px-8 bg-zinc-950 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {(sessionStatus === "presenting" || sessionStatus === "complete") && (
            <>
              {isInteractiveSlide && (
                <button
                  onClick={() => {
                    setActivePresenterTab("results");
                    setIsPresenterSidebarOpen((prev) =>
                      isPresenterSidebarOpen && activePresenterTab === "results"
                        ? false
                        : true,
                    );
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                    isPresenterSidebarOpen && activePresenterTab === "results"
                      ? "bg-zinc-800 text-white border-zinc-700"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white"
                  }`}
                  title="Toggle Live Results (Hotkey: R)"
                >
                  <BarChart2 className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Results</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActivePresenterTab("aicoach");
                  setIsPresenterSidebarOpen((prev) =>
                    isPresenterSidebarOpen && activePresenterTab === "aicoach"
                      ? false
                      : true,
                  );
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isPresenterSidebarOpen && activePresenterTab === "aicoach"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-500/20"
                    : "bg-zinc-900 hover:bg-zinc-850 border-indigo-500/30 text-indigo-300 hover:text-white"
                }`}
                title="Toggle Live AI Coach (Hotkey: C)"
              >
                <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
                <span>AI Coach</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping hidden sm:inline" />
              </button>

              <button
                onClick={() => {
                  setActivePresenterTab("qna");
                  setIsPresenterSidebarOpen((prev) =>
                    isPresenterSidebarOpen && activePresenterTab === "qna"
                      ? false
                      : true,
                  );
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold relative transition-colors cursor-pointer border ${
                  isPresenterSidebarOpen && activePresenterTab === "qna"
                    ? "bg-zinc-800 text-white border-zinc-700"
                    : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white"
                }`}
                title="Toggle Q&A (Hotkey: Q)"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Q&A</span>
                {pendingQnA > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {pendingQnA}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Slide Navigators */}
        <div className="flex items-center gap-6">
          <button
            onClick={goToPrevSlide}
            disabled={
              currentSlideIndex === 0 ||
              (sessionStatus !== "presenting" && sessionStatus !== "complete")
            }
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
              (sessionStatus !== "presenting" && sessionStatus !== "complete")
            }
            className="p-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-colors border border-zinc-800 text-zinc-300 hover:text-white"
            title="Next Slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors hidden sm:flex border border-zinc-800"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors border border-zinc-800"
            title="Show Join Info (M)"
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

      {/* Floating Live Reaction Emojis on Presenter Screen */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            style={{ left: `${item.left}%` }}
            className="absolute bottom-20 text-5xl animate-float-up pointer-events-none select-none drop-shadow-lg"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        isHost={true}
      />

      {/* End Session & Report Generation Processing Modal */}
      {isEndingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative space-y-6">
            {reportStatus === "processing" && (
              <div className="space-y-5 py-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-white">
                    Compiling Session Intelligence Report
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Recording attendee responses, calculating user-wise
                    breakdowns, and generating your PDF report...
                  </p>
                </div>

                {/* Processing time counter */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Processing Time: {processingSeconds.toFixed(1)}s</span>
                </div>

                {/* Progress Steps */}
                <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl text-left space-y-2.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Audience responses &amp; score points recorded</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>User-wise accuracy &amp; speed aggregated</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300 font-medium animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      Rendering PDF &amp; indexing to Knowledge Base...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {reportStatus === "completed" && (
              <div className="space-y-5 py-2">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Report Generated Successfully!
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Compiled in{" "}
                    <strong className="text-white font-mono">
                      {reportResult?.elapsed || processingSeconds.toFixed(1)}s
                    </strong>
                    . Full user-wise interaction logs and analytics are now
                    available.
                  </p>
                </div>

                {/* Stats Summary Card */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-500">
                      Attendees
                    </div>
                    <div className="text-base font-black text-white font-mono mt-0.5">
                      {audienceCount ||
                        reportResult?.session?.participants?.length ||
                        0}
                    </div>
                  </div>
                  <div className="border-x border-zinc-800">
                    <div className="text-[10px] uppercase font-bold text-zinc-500">
                      Questions
                    </div>
                    <div className="text-base font-black text-white font-mono mt-0.5">
                      {
                        slides.filter(
                          (s) => s.type === "quiz" || s.type === "poll",
                        ).length
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-500">
                      Knowledge Base
                    </div>
                    <div className="text-xs font-black text-emerald-400 mt-1">
                      Indexed ✓
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  {(reportResult?.report?.fileUrl ||
                    reportResult?.fileResource?.fileUrl) && (
                    <a
                      href={
                        reportResult?.report?.fileUrl ||
                        reportResult?.fileResource?.fileUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF Intelligence Report</span>
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/files"
                      className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Knowledge Base</span>
                    </Link>
                    <Link
                      href={`/presentations/${presentationId}/edit`}
                      className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Return to Editor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <Link
                    href="/presentations"
                    className="block text-center text-xs text-zinc-500 hover:text-zinc-300 py-1 transition-colors"
                  >
                    Go to All Presentations
                  </Link>
                </div>
              </div>
            )}

            {reportStatus === "failed" && (
              <div className="space-y-4 py-2">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
                  <X className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Report Generation Notice
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {reportError}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleEndSession()}
                    className="py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-xl"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/presentations/${presentationId}/edit`)
                    }
                    className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl border border-zinc-800"
                  >
                    Go to Editor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Participants Management Modal */}
      {isParticipantsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsParticipantsOpen(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Participants &amp; Admission ({participants.length})
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {audienceCount} active attendee
                    {audienceCount === 1 ? "" : "s"} &bull;{" "}
                    {pendingParticipants.length} knocking
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsParticipantsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Approval Security Policy Toggle */}
            <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-zinc-200">
                  Require Presenter Approval
                </span>
              </div>
              <button
                onClick={handleToggleApproval}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  requireApproval
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                }`}
                title="Toggle whether new attendees require presenter approval to enter"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    requireApproval ? "bg-emerald-400" : "bg-zinc-500"
                  }`}
                />
                <span>
                  {requireApproval ? "Enabled (Knock)" : "Disabled (Open)"}
                </span>
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-zinc-800 bg-zinc-900/30">
              <button
                onClick={() => setParticipantsTab("pending")}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  participantsTab === "pending"
                    ? "border-amber-400 text-amber-300 bg-zinc-900/60"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Pending Admission ({pendingParticipants.length})</span>
                {pendingParticipants.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
              <button
                onClick={() => setParticipantsTab("approved")}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  participantsTab === "approved"
                    ? "border-blue-400 text-blue-300 bg-zinc-900/60"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Active Participants ({approvedParticipants.length})</span>
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder={
                    participantsTab === "pending"
                      ? "Search pending requests..."
                      : "Search active participants..."
                  }
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-600 transition-colors"
                />
              </div>
            </div>

            {/* Tab Contents: Pending Admission */}
            {participantsTab === "pending" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {pendingParticipants.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-3">
                    <span className="text-xs text-amber-200 font-medium">
                      {pendingParticipants.length} request
                      {pendingParticipants.length === 1 ? "" : "s"} waiting for
                      approval
                    </span>
                    <button
                      onClick={handleAdmitAll}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Admit All</span>
                    </button>
                  </div>
                )}

                {filteredParticipants.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 space-y-2">
                    <UserCheck className="w-10 h-10 mx-auto opacity-30 text-amber-400" />
                    <p className="text-sm font-medium text-zinc-300">
                      No pending join requests
                    </p>
                    <p className="text-xs max-w-xs mx-auto text-zinc-500">
                      When participants scan or join room #{joinCode}, their
                      knock request will appear here for your approval.
                    </p>
                  </div>
                ) : (
                  filteredParticipants.map((p, idx) => (
                    <div
                      key={p.socketId || idx}
                      className="p-3.5 bg-zinc-900/80 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 hover:border-amber-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-500/30 font-mono">
                          {(p.displayName || "A").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate">
                              {p.displayName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                              Knocking
                            </span>
                          </div>
                          {p.email && (
                            <div className="text-xs text-zinc-300 font-medium truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate">{p.email}</span>
                            </div>
                          )}
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            Waiting to join &bull; Room #{joinCode}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Admit & Decline */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAdmitParticipant(p)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          title={`Admit "${p.displayName}"`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Admit</span>
                        </button>
                        <button
                          onClick={() => handleRejectParticipant(p)}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-red-900/60 border border-zinc-700 hover:border-red-600 text-zinc-300 hover:text-red-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title={`Decline "${p.displayName}"`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab Contents: Active Participants */}
            {participantsTab === "approved" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {filteredParticipants.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 space-y-2">
                    <Users className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-sm font-medium">
                      No active participants
                    </p>
                    <p className="text-xs max-w-xs mx-auto text-zinc-600">
                      Admitted participants will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  filteredParticipants.map((p, idx) => (
                    <div
                      key={p.socketId || idx}
                      className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-zinc-700 font-mono">
                          {(p.displayName || "A").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate">
                              {p.displayName}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                p.isOnline !== false
                                  ? "bg-emerald-400"
                                  : "bg-zinc-600"
                              }`}
                              title={
                                p.isOnline !== false ? "Online" : "Offline"
                              }
                            />
                          </div>
                          {p.email && (
                            <div className="text-xs text-zinc-300 font-medium truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate">{p.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span>
                              {p.isOnline !== false ? "Active" : "Offline"}
                            </span>
                            {p.joinedAt && (
                              <>
                                <span>&bull;</span>
                                <span>
                                  Joined{" "}
                                  {new Date(p.joinedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </>
                            )}
                            {typeof p.score === "number" && p.score > 0 && (
                              <>
                                <span>&bull;</span>
                                <span className="text-amber-400 font-bold">
                                  {p.score} pts
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Kick Out & Ban Button */}
                      <button
                        onClick={() => handleKickParticipant(p)}
                        className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-600 border border-red-800/60 hover:border-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                        title={`Kick out and ban "${p.displayName}" from rejoining`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Kick &amp; Ban</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center text-xs text-zinc-400">
              <span>
                {approvedParticipants.length} active &bull;{" "}
                {pendingParticipants.length} pending
              </span>
              <button
                onClick={() => setIsParticipantsOpen(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
