"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

export default function JoinSessionPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim() || !displayName.trim()) {
      setError("Please enter both a code and a display name.");
      return;
    }

    // Normalize join code
    const cleanCode = joinCode.trim().toUpperCase();

    if (cleanCode.length < 6) {
      setError("Join code must be at least 6 characters.");
      return;
    }

    router.push(`/play/${cleanCode}?name=${encodeURIComponent(displayName)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center transform rotate-12 shadow-lg shadow-blue-500/30">
              <Sparkles className="w-8 h-8 text-white -rotate-12" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Join Sentio
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Enter the code to join the live presentation
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
              Join Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError("");
              }}
              className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-950 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none transition-all text-xl font-bold tracking-widest text-center text-gray-900 dark:text-white"
              placeholder="123456"
              maxLength={8}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
              Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError("");
              }}
              className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-950 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none transition-all text-lg font-medium text-gray-900 dark:text-white text-center placeholder-gray-400"
              placeholder="How should we call you?"
              maxLength={20}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-xl shadow-blue-600/20"
          >
            Join Presentation
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
