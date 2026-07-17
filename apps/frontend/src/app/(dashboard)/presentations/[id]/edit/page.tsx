"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken, API_URL } from "@/lib/auth";
import { useAutoSave } from "@/hooks/useAutoSave";
import { ArrowLeft, Save, CheckCircle, Settings, Play } from "lucide-react";
import Link from "next/link";
import { ISlide, SlideType } from "@/types/slide";
import { SlideNavigator } from "@/components/builder/SlideNavigator";
import { SlideEditor } from "@/components/builder/SlideEditor";
import { SlideConfiguration } from "@/components/builder/SlideConfiguration";
import { AddSlideModal } from "@/components/builder/AddSlideModal";
import { ThemeSettings } from "@/components/builder/ThemeSettings";

interface PresentationData {
  title: string;
  description: string;
  theme?: any;
}

export default function PresentationBuilder() {
  const params = useParams();
  const router = useRouter();
  const presentationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<ISlide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const [initialData, setInitialData] = useState<PresentationData>({
    title: "",
    description: "",
    theme: null,
  });

  const {
    data: presentation,
    updateData: updatePresentation,
    saveState,
  } = useAutoSave<PresentationData>(
    `${API_URL}/api/presentations/${presentationId}`,
    initialData,
    1500,
  );

  useEffect(() => {
    const fetchPresentationAndSlides = async () => {
      const token = getAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }

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
          const slidesData = await slidesRes.json();

          setInitialData({
            title: presData.title,
            description: presData.description,
            theme: presData.theme,
          });

          setSlides(slidesData);
          if (slidesData.length > 0) {
            setActiveSlideId(slidesData[0]._id);
          }
        } else if (presRes.status === 404) {
          router.replace("/presentations");
          return;
        } else {
          console.error("Failed to load presentation data");
          router.replace("/presentations");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPresentationAndSlides();
  }, [presentationId, router]);

  const handleAddSlide = async (type: SlideType) => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/presentations/${presentationId}/slides`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type,
            title: `New ${type} slide`,
            order: slides.length,
          }),
        },
      );

      if (res.ok) {
        const newSlide = await res.json();
        setSlides([...slides, newSlide]);
        setActiveSlideId(newSlide._id);
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to add slide:", error);
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/presentations/${presentationId}/slides/${slideId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const newSlides = slides.filter((s) => s._id !== slideId);
        setSlides(newSlides);
        if (activeSlideId === slideId) {
          setActiveSlideId(newSlides.length > 0 ? newSlides[0]._id : null);
        }
      }
    } catch (error) {
      console.error("Failed to delete slide:", error);
    }
  };

  const handleDuplicateSlide = async (slideId: string) => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/presentations/${presentationId}/slides/${slideId}/duplicate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const duplicate = await res.json();
        const index = slides.findIndex((s) => s._id === slideId);
        const newSlides = [...slides];
        newSlides.splice(index + 1, 0, duplicate);
        setSlides(newSlides);
        setActiveSlideId(duplicate._id);
      }
    } catch (error) {
      console.error("Failed to duplicate slide:", error);
    }
  };

  const handleReorderSlides = async (slideIds: string[]) => {
    const token = getAccessToken();
    if (!token) return;

    const reorderedSlides = slideIds
      .map((id) => slides.find((s) => s._id === id)!)
      .filter(Boolean);
    setSlides(reorderedSlides);

    try {
      await fetch(
        `${API_URL}/api/presentations/${presentationId}/slides/reorder`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slideIds }),
        },
      );
    } catch (error) {
      console.error("Failed to reorder slides:", error);
    }
  };

  const handleUpdateLocalSlide = (
    slideId: string,
    updates: Partial<ISlide>,
  ) => {
    setSlides((prev) =>
      prev.map((s) => (s._id === slideId ? { ...s, ...updates } : s)),
    );
  };

  const activeSlide = slides.find((s) => s._id === activeSlideId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Editor Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <Link
            href="/presentations"
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input
            type="text"
            className="text-lg font-bold bg-transparent border-none p-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 w-48 md:w-96"
            value={presentation.title}
            onChange={(e) => updatePresentation({ title: e.target.value })}
            placeholder="Presentation Title"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm mr-2">
            {saveState === "saving" && (
              <span className="flex items-center text-gray-500">
                <Save className="w-4 h-4 mr-1 animate-pulse" /> Saving...
              </span>
            )}
            {saveState === "saved" && (
              <span className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4 mr-1" /> Saved
              </span>
            )}
          </div>

          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm">
            <Play className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Present</span>
          </button>
        </div>
      </header>

      {/* 3-Panel Builder Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <SlideNavigator
          slides={slides}
          activeSlideId={activeSlideId}
          onSelectSlide={setActiveSlideId}
          onAddSlide={() => setIsAddModalOpen(true)}
          onDeleteSlide={handleDeleteSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onReorderSlides={handleReorderSlides}
        />

        <SlideEditor slide={activeSlide} />

        <SlideConfiguration
          presentationId={presentationId}
          slide={activeSlide}
          onUpdateLocal={handleUpdateLocalSlide}
        />
      </div>

      <AddSlideModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSlide={handleAddSlide}
      />

      <ThemeSettings
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        presentationId={presentationId}
        initialTheme={presentation.theme}
        onThemeUpdate={(theme) => updatePresentation({ theme })}
      />
    </div>
  );
}
