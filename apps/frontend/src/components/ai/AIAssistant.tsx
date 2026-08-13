"use client";

import React, { useState } from "react";
import { getAccessToken, API_URL } from "@/lib/auth";

export default function AIAssistant({
  presentationId,
  onAddSlides,
}: {
  presentationId: string;
  onAddSlides: (slides: any[]) => void;
}) {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [generatingSlides, setGeneratingSlides] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
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

  const handleGenerateQuiz = async () => {
    const topic = prompt("What topic should the quiz cover?");
    if (!topic) return;

    setGeneratingSlides(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/ai/generate-slides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "quiz",
          topic,
          count: 3,
          difficulty: "medium",
        }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data.message || "Failed to generate slides.");
      }
      onAddSlides(data);
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: "I generated a 3-question quiz for you!" },
      ]);
    } catch (error: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          text: `Error: ${error.message || "Failed to generate quiz."}`,
        },
      ]);
    } finally {
      setGeneratingSlides(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
          <span className="text-xl">✨</span> Sentio AI
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-gray-500 text-sm text-center mt-4">
            How can I help you build your presentation today?
          </div>
        )}
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 rounded-lg p-3 text-sm animate-pulse">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleGenerateQuiz}
            disabled={generatingSlides || loading}
            className="text-xs bg-white border border-gray-300 rounded px-2 py-1 shadow-sm hover:bg-gray-50 text-gray-700 disabled:opacity-50"
          >
            {generatingSlides ? "Generating..." : "⚡ Generate Quiz"}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask AI to improve your slides..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
