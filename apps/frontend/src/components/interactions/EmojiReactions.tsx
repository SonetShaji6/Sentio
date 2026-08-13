"use client";

import React, { useState, useCallback } from "react";

interface EmojiReactionsProps {
  joinCode: string;
  slideId: string;
  onReact: (emoji: string) => void;
  counts?: Record<string, number>;
}

const EMOJI_SET = ["👍", "❤️", "👏", "😂", "😮"];

export function EmojiReactions({
  joinCode,
  slideId,
  onReact,
  counts = {},
}: EmojiReactionsProps) {
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({});
  const [animations, setAnimations] = useState<{ id: number; emoji: string }[]>(
    [],
  );

  const handleReact = useCallback(
    (emoji: string) => {
      if (cooldowns[emoji]) return;

      onReact(emoji);

      // Show floating animation
      const id = Date.now();
      setAnimations((prev) => [...prev, { id, emoji }]);
      setTimeout(() => {
        setAnimations((prev) => prev.filter((a) => a.id !== id));
      }, 1000);

      // Set cooldown
      setCooldowns((prev) => ({ ...prev, [emoji]: true }));
      setTimeout(() => {
        setCooldowns((prev) => ({ ...prev, [emoji]: false }));
      }, 2000);
    },
    [cooldowns, onReact],
  );

  return (
    <div className="relative">
      {/* Floating animations */}
      <div className="absolute bottom-full left-0 right-0 pointer-events-none">
        {animations.map((a) => (
          <div
            key={a.id}
            className="absolute left-1/2 -translate-x-1/2 animate-bounce text-3xl"
            style={{
              animation: "floatUp 1s ease-out forwards",
            }}
          >
            {a.emoji}
          </div>
        ))}
      </div>

      {/* Emoji buttons */}
      <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-md rounded-full px-2 py-1">
        {EMOJI_SET.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            disabled={cooldowns[emoji]}
            className={`relative flex flex-col items-center px-2 py-1 rounded-full transition-all hover:bg-white/10 active:scale-90 ${
              cooldowns[emoji] ? "opacity-50" : ""
            }`}
          >
            <span className="text-xl">{emoji}</span>
            {(counts[emoji] || 0) > 0 && (
              <span className="text-[10px] font-bold text-gray-300 leading-none">
                {counts[emoji]}
              </span>
            )}
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-60px) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
