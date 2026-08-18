"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Camera,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Radio,
} from "lucide-react";
import { QRScannerModal } from "@/components/QRScannerModal";
import { API_URL } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [sessionPreview, setSessionPreview] = useState<{
    title?: string;
    status?: string;
    slideCount?: number;
  } | null>(null);

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    const nameFromUrl = searchParams.get("name");
    if (codeFromUrl) {
      const clean = codeFromUrl.trim().toUpperCase();
      setJoinCode(clean);
      checkCode(clean);
    }
    if (nameFromUrl) {
      setDisplayName(nameFromUrl);
    }
  }, [searchParams]);

  const checkCode = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean.length < 4) {
      setSessionPreview(null);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/sessions/check/${clean}`);
      if (res.ok) {
        const data = await res.json();
        setSessionPreview(data);
        setError("");
      } else {
        setSessionPreview(null);
      }
    } catch {
      // Ignore preview errors
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setJoinCode(val);
    setError("");
    if (val.length >= 4) {
      checkCode(val);
    } else {
      setSessionPreview(null);
    }
  };

  const handleScanSuccess = (code: string) => {
    setIsScannerOpen(false);
    const clean = code.trim().toUpperCase();
    setJoinCode(clean);
    checkCode(clean);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a join code.");
      return;
    }

    if (cleanCode.length < 4) {
      setError("Join code must be at least 4 characters.");
      return;
    }

    const name = displayName.trim() || "Participant";
    router.push(`/play/${cleanCode}?name=${encodeURIComponent(name)}`);
  };

  return (
    <>
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-white/5 border border-zinc-200 dark:border-zinc-800 p-8 z-10 transition-colors">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors"
            title="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Scan QR</span>
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl flex items-center justify-center shadow-xl">
              <Radio className="w-7 h-7 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
            Join Sentio
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
            Enter the 6-digit code or scan the presentation QR code
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {sessionPreview && (
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium flex items-center justify-between">
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

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">
              Join Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={handleCodeChange}
              className="w-full px-5 py-4 bg-zinc-50 dark:bg-black border-2 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white rounded-2xl outline-none transition-all text-2xl font-mono font-black tracking-widest text-center text-zinc-950 dark:text-white placeholder:text-zinc-400"
              placeholder="123456"
              maxLength={8}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">
              Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError("");
              }}
              className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white rounded-2xl outline-none transition-all text-base font-medium text-zinc-950 dark:text-white text-center placeholder:text-zinc-400"
              placeholder="How should we call you?"
              maxLength={25}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-zinc-950 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-200 active:scale-[0.99] text-white dark:text-zinc-950 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 dark:shadow-white/5 text-base cursor-pointer"
          >
            <span>Join Presentation</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hosting a session?{" "}
            <Link
              href="/login"
              className="text-zinc-950 dark:text-white font-semibold underline underline-offset-4 hover:opacity-80"
            >
              Sign in as presenter
            </Link>
          </p>
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

export default function JoinSessionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4 relative overflow-hidden transition-colors">
      <Suspense
        fallback={
          <div className="p-8 text-center text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-950 dark:border-white mx-auto mb-2" />
            Loading join portal...
          </div>
        }
      >
        <JoinForm />
      </Suspense>
    </div>
  );
}
