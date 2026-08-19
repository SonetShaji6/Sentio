"use client";

import React, { useState } from "react";
import { getAccessToken, API_URL } from "@/lib/auth";
import {
  Sparkles,
  Send,
  Loader2,
  List,
  BarChart2,
  Presentation,
  Cloud,
  MessageSquare,
  Bot,
  User,
  Plus,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { AISlideGeneratorModal } from "./AISlideGeneratorModal";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface AIAssistantProps {
  presentationId: string;
  onAddSlides: (slides: any[]) => void;
}

export default function AIAssistant({
  presentationId,
  onAddSlides,
}: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<"generate" | "chat">("generate");
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; text: string }[]
  >([
    {
      role: "ai",
      text: "Hello! I'm Sentio AI. I can generate interactive quizzes, live polls, icebreakers, or full slide decks. What are you building today?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  // Quick generator modal trigger
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<
    "quiz" | "poll" | "deck" | "icebreaker"
  >("quiz");

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMsg,
          context: `Presentation ID: ${presentationId}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to get response from AI.");
      }
      setChatHistory((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (error: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          text: `Error: ${error.message || "Unable to connect to Sentio AI."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openGenerator = (type: "quiz" | "poll" | "deck" | "icebreaker") => {
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 select-none">
      {/* Header with Tabs */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
              Sentio AI Studio
            </h3>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              activeTab === "generate"
                ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            ⚡ Generate Slides
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              activeTab === "chat"
                ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            💬 AI Coach
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "generate" ? (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-transparent p-4 rounded-2xl border border-purple-200/50 dark:border-purple-800/40">
              <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Instant Slide Creator
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Generate high-engagement questions, polls, and structured decks
                with customizable parameters.
              </p>
            </div>

            {/* Quick Generator Cards */}
            <div className="space-y-2.5">
              <button
                onClick={() => openGenerator("quiz")}
                className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <List className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Interactive Quiz
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Generate 1-10 scored quiz questions
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => openGenerator("poll")}
                className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Audience Polls & Surveys
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Live single & multi-choice polls
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => openGenerator("deck")}
                className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <Presentation className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Complete Presentation Deck
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Title, insights, polls & outro slides
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => openGenerator("icebreaker")}
                className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Icebreakers & Word Clouds
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Warmup brainstorming prompts
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Direct Trigger Button */}
            <div className="pt-2">
              <button
                onClick={() => openGenerator("deck")}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Advanced AI Generator</span>
              </button>
            </div>
          </div>
        ) : (
          /* Chat Coach View */
          <div className="p-4 space-y-3">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white font-medium shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 shadow-xs"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <MarkdownRenderer content={msg.text} />
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 rounded-2xl p-3 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      {activeTab === "chat" && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask for feedback or ideas..."
              className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Generator Modal */}
      <AISlideGeneratorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        presentationId={presentationId}
        onAddSlides={onAddSlides}
        defaultType={modalDefaultType}
      />
    </div>
  );
}
