"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Sparkles,
  Users,
  Radio,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { QRScannerModal } from "./QRScannerModal";
import { API_URL } from "@/lib/auth";

interface JoinCodeCardProps {
  initialCode?: string;
  className?: string;
  compact?: boolean;
}

export function JoinCodeCard({
  initialCode = "",
  className = "",
}: JoinCodeCardProps) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState(initialCode);
  const [displayName, setDisplayName] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [sessionPreview, setSessionPreview] = useState<{
    title?: string;
    status?: string;
    slideCount?: number;
  } | null>(null);

  useEffect(() => {
    if (initialCode) {
      setJoinCode(initialCode.toUpperCase());
      checkSessionCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  // Check code with backend when length >= 4
  const checkSessionCode = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean.length < 4) {
      setSessionPreview(null);
      return;
    }

    try {
      setChecking(true);
      const res = await fetch(`${API_URL}/api/sessions/check/${clean}`);
      if (res.ok) {
        const data = await res.json();
        setSessionPreview(data);
        setError("");
      } else {
        setSessionPreview(null);
      }
    } catch {
      // Ignore network preview failures
    } finally {
      setChecking(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setJoinCode(val);
    setError("");
    if (val.length >= 4) {
      checkSessionCode(val);
    } else {
      setSessionPreview(null);
    }
  };

  const handleScanSuccess = (code: string) => {
    setIsScannerOpen(false);
    const clean = code.trim().toUpperCase();
    setJoinCode(clean);
    checkSessionCode(clean);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a presentation code.");
      return;
    }

    if (cleanCode.length < 4) {
      setError("Code must be at least 4 characters.");
      return;
    }

    const name = displayName.trim() || "Participant";
    router.push(`/play/${cleanCode}?name=${encodeURIComponent(name)}`);
  };

  return (
    <>
      <div
        className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/5 dark:shadow-white/5 transition-colors ${className}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-md">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white">
                Join a Live Session
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                No account needed • Instant access
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-semibold transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm"
            title="Scan QR Code with camera"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {sessionPreview && (
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2 truncate pr-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold truncate">
                  {sessionPreview.title || "Live Presentation"}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-full text-[10px] uppercase font-bold shrink-0">
                {sessionPreview.status || "Ready"}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                6-Digit Join Code
              </label>
              {checking && (
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 animate-pulse">
                  Verifying...
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={joinCode}
                onChange={handleCodeChange}
                placeholder="123456"
                maxLength={8}
                className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-black border-2 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white rounded-2xl outline-none transition-all font-mono text-xl sm:text-2xl font-black tracking-widest text-center text-zinc-950 dark:text-white placeholder:text-zinc-400 placeholder:font-normal placeholder:tracking-normal shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 px-1">
              Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError("");
              }}
              placeholder="How should we call you? (e.g., Alex)"
              maxLength={25}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white rounded-2xl outline-none transition-all text-sm font-medium text-zinc-950 dark:text-white placeholder:text-zinc-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-zinc-950 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-200 active:scale-[0.99] text-white dark:text-zinc-950 font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 dark:shadow-white/5 text-base cursor-pointer"
          >
            <span>Join Presentation</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />{" "}
            Live polling & quizzes
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />{" "}
            Interactive Q&A
          </span>
        </div>
      </div>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}
