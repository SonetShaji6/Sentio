"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken, API_URL } from "@/lib/auth";
import { useSocket } from "@/hooks/useSocket";
import { ISlide } from "@/types/slide";
import {
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { SlideEditor } from "@/components/builder/SlideEditor";

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

  useEffect(() => {
    if (!isConnected || !presentation) return;

    const unsubscribeStart = subscribe("session-started", () => {
      setSessionStatus("live");
    });

    const unsubscribeEnd = subscribe("session-ended", () => {
      setSessionStatus("ended");
    });

    const unsubscribeAudience = subscribe(
      "audience-updated",
      (data: { count: number }) => {
        setAudienceCount(data.count);
      },
    );

    const unsubscribeResults = subscribe("results-updated", (data) => {
      // Handle results update for polling slides
    });

    return () => {
      unsubscribeStart();
      unsubscribeEnd();
      unsubscribeAudience();
      unsubscribeResults();
    };
  }, [isConnected, subscribe, presentation]);

  const handleStartSession = () => {
    if (!presentation) return;
    const joinCode =
      presentation.sessionCode ||
      presentation.shareId.substring(0, 6).toUpperCase();
    emit("host-start", { presentationId, joinCode });
  };

  const handleEndSession = () => {
    if (!presentation) return;
    const joinCode =
      presentation.sessionCode ||
      presentation.shareId.substring(0, 6).toUpperCase();
    emit("host-end", { joinCode });
    router.push(`/presentations/${presentationId}/edit`);
  };

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      const newIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(newIndex);
      const joinCode =
        presentation.sessionCode ||
        presentation.shareId.substring(0, 6).toUpperCase();
      emit("host-slide-change", { joinCode, slideIndex: newIndex });
    }
  };

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(newIndex);
      const joinCode =
        presentation.sessionCode ||
        presentation.shareId.substring(0, 6).toUpperCase();
      emit("host-slide-change", { joinCode, slideIndex: newIndex });
    }
  };

  if (loading || !presentation) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const joinCode =
    presentation.sessionCode ||
    presentation.shareId.substring(0, 6).toUpperCase();

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
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-400">Join Code:</span>
            <span className="text-xl font-bold tracking-widest">
              {joinCode}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-400">
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

      {/* Main Slide Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black">
        {sessionStatus === "waiting" ? (
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Waiting for audience...</h2>
            <p className="text-xl text-gray-400 mb-8">
              Go to{" "}
              <span className="text-white font-mono">sentio.app/join</span> and
              enter code{" "}
              <span className="text-white font-mono text-3xl ml-2 tracking-wider">
                {joinCode}
              </span>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-6xl aspect-[16/9] relative bg-white text-black shadow-2xl rounded-xl overflow-hidden ring-4 ring-gray-800">
            {slides.length > 0 ? (
              <SlideEditor slide={slides[currentSlideIndex]} />
            ) : (
              <div className="flex items-center justify-center h-full">
                No slides available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Presenter Controls (Bottom) */}
      <div className="h-20 flex items-center justify-center gap-8 bg-gray-900 border-t border-gray-800">
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
            currentSlideIndex === slides.length - 1 || sessionStatus !== "live"
          }
          className="p-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
