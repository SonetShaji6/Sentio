"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { ISlide } from "@/types/slide";
import { Heart, Send, CheckCircle2, AlertCircle } from "lucide-react";

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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { isConnected, emit, subscribe } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Join the session
    emit("join-session", { joinCode, displayName });

    const unsubSuccess = subscribe("join-success", (data) => {
      setSession(data.session);
      setCurrentSlideIndex(data.session.currentSlideIndex || 0);
      setConnectionState("joined");
    });

    const unsubError = subscribe("join-error", (msg) => {
      setErrorMessage(msg);
      setConnectionState("error");
    });

    const unsubStarted = subscribe("session-started", (data) => {
      setSession(data.session);
      setCurrentSlideIndex(0);
      setHasSubmitted(false);
    });

    const unsubSlide = subscribe("slide-changed", (data) => {
      setCurrentSlideIndex(data.slideIndex);
      setHasSubmitted(false);
    });

    const unsubEnded = subscribe("session-ended", () => {
      setSession((prev: any) => ({ ...prev, status: "ended" }));
    });

    const unsubPaused = subscribe("session-paused", () => {
      setSession((prev: any) => ({ ...prev, status: "paused" }));
    });

    const unsubResumed = subscribe("session-resumed", () => {
      setSession((prev: any) => ({ ...prev, status: "live" }));
    });

    return () => {
      unsubSuccess();
      unsubError();
      unsubStarted();
      unsubSlide();
      unsubEnded();
      unsubPaused();
      unsubResumed();
    };
  }, [isConnected, emit, subscribe, joinCode, displayName]);

  if (connectionState === "connecting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
          <Heart className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          You're in, {displayName}!
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400">
          {session.status === "waiting"
            ? "Waiting for the presenter to start..."
            : "The presentation is currently paused."}
        </p>
      </div>
    );
  }

  // Render active slide form
  // For a real implementation, we would need the slide content.
  // The host should ideally broadcast the current slide object, or we fetch it.
  // Assuming the host broadcasts the full slide or we have simple interactions:

  const handleSubmit = (answer: any) => {
    setHasSubmitted(true);
    emit("audience-submit", {
      joinCode,
      response: { answer, timestamp: new Date() },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <header className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm">
        <div className="font-semibold text-gray-900 dark:text-white text-lg">
          Sentio
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Live
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto">
        {hasSubmitted ? (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Response recorded
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Waiting for the next slide...
            </p>
          </div>
        ) : (
          <div className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Submit your response
            </h2>

            <div className="space-y-4">
              {/* Mock generic buttons for interaction */}
              {["A", "B", "C", "D"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSubmit(opt)}
                  className="w-full py-4 px-6 text-left bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-2 border-transparent hover:border-blue-500 rounded-2xl font-medium text-lg text-gray-900 dark:text-white transition-all transform hover:scale-[1.01]"
                >
                  Option {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
