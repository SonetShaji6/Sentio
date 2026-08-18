"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken, API_URL } from "@/lib/auth";
import { useAutoSave } from "@/hooks/useAutoSave";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Settings,
  Play,
  Layers,
  Sliders,
  Sparkles,
  Palette,
  Eye,
  PanelLeft,
  PanelRight,
  Keyboard,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { ISlide, SlideType } from "@/types/slide";
import { SlideNavigator } from "@/components/builder/SlideNavigator";
import { SlideEditor } from "@/components/builder/SlideEditor";
import { SlideConfiguration } from "@/components/builder/SlideConfiguration";
import { AddSlideModal } from "@/components/builder/AddSlideModal";
import { ThemeSettings } from "@/components/builder/ThemeSettings";
import AIAssistant from "@/components/ai/AIAssistant";
import { AISlideGeneratorModal } from "@/components/ai/AISlideGeneratorModal";
import { KeyboardShortcutsModal } from "@/components/builder/KeyboardShortcutsModal";
import { DEFAULT_THEME, resolveTheme } from "@/types/theme";

interface PresentationData {
  title: string;
  description: string;
  theme?: any;
  shareId?: string;
  sessionCode?: string;
}

export default function PresentationBuilder() {
  const params = useParams();
  const router = useRouter();
  const presentationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<ISlide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Responsive panel states
  const [mobileTab, setMobileTab] = useState<"navigator" | "canvas" | "config">(
    "canvas",
  );
  const [showNavigatorDesktop, setShowNavigatorDesktop] = useState(true);
  const [showConfigDesktop, setShowConfigDesktop] = useState(true);

  const [initialData, setInitialData] = useState<PresentationData>({
    title: "",
    description: "",
    theme: DEFAULT_THEME,
  });

  const {
    data: presentation,
    updateData: updatePresentation,
    saveState,
  } = useAutoSave<PresentationData>(
    `${API_URL}/api/presentations/${presentationId}`,
    initialData,
    1000,
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
            theme: presData.theme || DEFAULT_THEME,
            shareId: presData.shareId,
            sessionCode: presData.sessionCode,
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // ESC: Close open modals first, or navigate back if no modal is open
      if (e.key === "Escape") {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isAIGeneratorOpen) {
          setIsAIGeneratorOpen(false);
          return;
        }
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
          return;
        }
        if (isThemeModalOpen) {
          setIsThemeModalOpen(false);
          return;
        }
        if (isAIOpen) {
          setIsAIOpen(false);
          return;
        }
        if (!isInput) {
          router.push("/presentations");
        }
        return;
      }

      // Help Shortcut (?)
      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Save (Cmd+S / Ctrl+S)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        return;
      }

      // Present Live (Cmd+Enter or P when not typing)
      if (
        ((e.metaKey || e.ctrlKey) && e.key === "Enter") ||
        (e.key.toLowerCase() === "p" && !isInput && !e.metaKey && !e.ctrlKey)
      ) {
        e.preventDefault();
        router.push(`/presentations/${presentationId}/host`);
        return;
      }

      if (isInput) return;

      // Navigate Slides (ArrowLeft / ArrowRight / ArrowUp / ArrowDown)
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = slides.findIndex((s) => s._id === activeSlideId);
        if (currentIndex > 0) {
          setActiveSlideId(slides[currentIndex - 1]._id);
        }
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const currentIndex = slides.findIndex((s) => s._id === activeSlideId);
        if (currentIndex < slides.length - 1 && currentIndex >= 0) {
          setActiveSlideId(slides[currentIndex + 1]._id);
        }
      } else if (e.key.toLowerCase() === "a") {
        e.preventDefault();
        setIsAddModalOpen(true);
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setIsThemeModalOpen(true);
      } else if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        setIsAIOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    slides,
    activeSlideId,
    isShortcutsOpen,
    isAIGeneratorOpen,
    isAddModalOpen,
    isThemeModalOpen,
    isAIOpen,
    presentationId,
    router,
  ]);

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
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Slide`,
            order: slides.length,
          }),
        },
      );

      if (res.ok) {
        const newSlide = await res.json();
        setSlides([...slides, newSlide]);
        setActiveSlideId(newSlide._id);
        setIsAddModalOpen(false);
        setMobileTab("canvas");
      }
    } catch (error) {
      console.error("Failed to add slide:", error);
    }
  };

  const handleAddGeneratedSlides = async (generatedSlides: any[]) => {
    if (!Array.isArray(generatedSlides)) return;
    const token = getAccessToken();
    if (!token) return;

    try {
      const addedSlides: any[] = [];
      let currentOrder = slides.length;
      for (const gs of generatedSlides) {
        const res = await fetch(
          `${API_URL}/api/presentations/${presentationId}/slides`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: gs.type,
              title: gs.title,
              description: gs.description,
              config: gs.config,
              order: currentOrder,
            }),
          },
        );
        if (res.ok) {
          addedSlides.push(await res.json());
          currentOrder++;
        }
      }
      setSlides((prev) => [...prev, ...addedSlides]);
      if (addedSlides.length > 0)
        setActiveSlideId(addedSlides[addedSlides.length - 1]._id);
    } catch (error) {
      console.error("Failed to add generated slides:", error);
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
  const currentTheme = resolveTheme(presentation.theme);
  const joinCode =
    presentation.sessionCode ||
    presentation.shareId?.substring(0, 6).toUpperCase() ||
    "SENTIO";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-hidden select-none">
      {/* Compact Slim Top Navbar */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 py-1.5 flex items-center justify-between shrink-0 z-20 shadow-xs h-13">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/presentations"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors shrink-0"
            title="Back to Presentations (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex flex-col min-w-0">
            <input
              type="text"
              className="text-xs sm:text-sm font-bold bg-transparent border-none p-0 focus:ring-0 text-zinc-900 dark:text-white placeholder-zinc-400 truncate w-36 sm:w-60 md:w-72 outline-none"
              value={presentation.title}
              onChange={(e) => updatePresentation({ title: e.target.value })}
              placeholder="Untitled Presentation"
            />
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              {saveState === "saving" && (
                <span className="flex items-center text-blue-500">
                  <Save className="w-2.5 h-2.5 mr-1 animate-pulse" /> Saving...
                </span>
              )}
              {saveState === "saved" && (
                <span className="flex items-center text-emerald-500">
                  <CheckCircle className="w-2.5 h-2.5 mr-1" /> Saved
                </span>
              )}
              {saveState === "error" && (
                <span className="text-red-500">Save failed</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Desktop Panel Toggles */}
        <div className="hidden lg:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
          <button
            onClick={() => setShowNavigatorDesktop(!showNavigatorDesktop)}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              showNavigatorDesktop
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
            title="Toggle Slide List"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowConfigDesktop(!showConfigDesktop)}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              showConfigDesktop
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
            title="Toggle Customizer Panel"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Shortcuts Info Trigger */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:flex"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Sentio AI Button */}
          <button
            onClick={() => setIsAIOpen(!isAIOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isAIOpen
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60"
            }`}
            title="Sentio AI Assistant (I)"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">AI Studio</span>
          </button>

          {/* Theme Settings Button */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors border border-zinc-200 dark:border-zinc-700/60"
            title="Theme & Colors (T)"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentTheme.primary }}
            />
            <span className="hidden sm:inline">Theme</span>
          </button>

          {/* Present Live CTA */}
          <Link
            href={`/presentations/${presentationId}/host`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer ml-1"
            title="Present Live (P or ⌘+Enter)"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Present</span>
          </Link>
        </div>
      </header>

      {/* Mobile / Tablet Tab Switcher */}
      <div className="flex md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-1 justify-around shrink-0 z-10">
        <button
          onClick={() => setMobileTab("navigator")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            mobileTab === "navigator"
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              : "text-zinc-500"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Slides ({slides.length})
        </button>
        <button
          onClick={() => setMobileTab("canvas")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            mobileTab === "canvas"
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              : "text-zinc-500"
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Canvas
        </button>
        <button
          onClick={() => setMobileTab("config")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            mobileTab === "config"
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              : "text-zinc-500"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Customizer
        </button>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Slide Navigator (Desktop or Mobile active) */}
        <div
          className={`${
            showNavigatorDesktop ? "hidden md:flex" : "hidden"
          } ${mobileTab === "navigator" ? "!flex w-full" : ""}`}
        >
          <SlideNavigator
            slides={slides}
            theme={currentTheme}
            activeSlideId={activeSlideId}
            onSelectSlide={(id) => {
              setActiveSlideId(id);
              setMobileTab("canvas");
            }}
            onAddSlide={() => setIsAddModalOpen(true)}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onReorderSlides={handleReorderSlides}
          />
        </div>

        {/* Center: Slide Canvas Editor */}
        <div
          className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ${
            mobileTab !== "canvas" ? "hidden md:flex" : "flex"
          }`}
        >
          <SlideEditor
            slide={activeSlide}
            theme={currentTheme}
            joinCode={joinCode}
          />
        </div>

        {/* Right: Slide Configuration */}
        <div
          className={`${
            showConfigDesktop ? "hidden md:flex" : "hidden"
          } ${mobileTab === "config" ? "!flex w-full" : ""}`}
        >
          <SlideConfiguration
            presentationId={presentationId}
            slide={activeSlide}
            onUpdateLocal={handleUpdateLocalSlide}
          />
        </div>

        {/* Far Right: AI Assistant Drawer */}
        {isAIOpen && (
          <div className="w-80 shrink-0 border-l border-zinc-200 dark:border-zinc-800 z-10">
            <AIAssistant
              presentationId={presentationId}
              onAddSlides={handleAddGeneratedSlides}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddSlideModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSlide={handleAddSlide}
        onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
      />

      <AISlideGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        presentationId={presentationId}
        onAddSlides={handleAddGeneratedSlides}
      />

      <ThemeSettings
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        presentationId={presentationId}
        initialTheme={presentation.theme}
        onThemeUpdate={(newTheme) => updatePresentation({ theme: newTheme })}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        isHost={false}
      />
    </div>
  );
}
