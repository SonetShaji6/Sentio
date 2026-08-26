"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  ArrowLeft,
  LayoutDashboard,
  Radio,
  Sparkles,
  HelpCircle,
  Home,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    router.push(`/join/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900 animate-fade-in">
      {/* Top minimal header */}
      <header className="p-6 md:px-12 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <Link
          href="/dashboard"
          className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
      </header>

      {/* Main 404 Content */}
      <main className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="max-w-xl w-full text-center space-y-8">
          {/* Animated 404 Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Error 404 • Page Not Found</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl font-black text-zinc-950 dark:text-white tracking-tight">
              Lost in space?
            </h1>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              The presentation or page you are looking for has been moved,
              deleted, or never existed in the universe.
            </p>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all active-press"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Link>

            <Link
              href="/"
              className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl font-bold text-xs flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 transition-all active-press"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Inline Live Session Code Finder */}
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900">
            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 max-w-md mx-auto hover-lift">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>Were you looking for a live presentation?</span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-4">
                Enter your 6-digit room code to jump directly into the session.
              </p>

              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Room Code (e.g. A3F8)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="flex-1 px-3.5 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-center focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white outline-none"
                />
                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl font-bold text-xs disabled:opacity-50 transition-all active-press cursor-pointer"
                >
                  Join Room
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="p-6 text-center text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full">
        <span>
          © {new Date().getFullYear()} Sentio Inc. All rights reserved.
        </span>
        <div className="flex gap-4 mt-2 sm:mt-0 font-medium">
          <Link
            href="/features"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="/faq"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            Support
          </Link>
        </div>
      </footer>
    </div>
  );
}
