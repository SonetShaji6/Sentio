"use client";

import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

interface OpenTextInteractionProps {
  slideId: string;
  charLimit?: number;
  hasSubmitted: boolean;
  responseLocked: boolean;
  onSubmit: (text: string) => void;
}

export function OpenTextInteraction({
  slideId,
  charLimit = 500,
  hasSubmitted,
  responseLocked,
  onSubmit,
}: OpenTextInteractionProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || hasSubmitted || responseLocked) return;
    onSubmit(trimmed);
  };

  if (hasSubmitted) {
    return (
      <div className="w-full text-center py-8">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Response submitted!
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Thank you for your input
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={charLimit}
        rows={4}
        disabled={responseLocked}
        placeholder="Share your thoughts..."
        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400 transition-all resize-none disabled:opacity-50"
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {text.length}/{charLimit}
        </span>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || responseLocked}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
        >
          <Send className="w-4 h-4" />
          Submit
        </button>
      </div>

      {responseLocked && (
        <p className="text-center text-amber-500 font-medium">
          Responses are currently locked
        </p>
      )}
    </div>
  );
}
