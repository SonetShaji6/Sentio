"use client";

import { useState, type FormEvent } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, CheckCircle2, MessageSquare, Send, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      return;
    }

    setStatus("loading");

    setTimeout(() => {
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    }, 1200);
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow py-20 sm:py-28 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs font-semibold mb-5 shadow-xs">
              <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Get in Touch</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
              Contact Our Team
            </h1>
            <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
              Have questions, feedback, or need enterprise support? We'd love to
              hear from you.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 p-8 sm:p-10 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80">
            {status === "success" ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">
                  Message Sent Successfully!
                </h2>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
                  Thank you for reaching out. A member of our team will get back
                  to you shortly.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-semibold transition-all"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="label text-zinc-800 dark:text-zinc-200"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="input-field"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={status === "loading"}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="label text-zinc-800 dark:text-zinc-200"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input-field"
                    placeholder="jane@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === "loading"}
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="label text-zinc-800 dark:text-zinc-200"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="input-field h-auto py-3 resize-y"
                    placeholder="How can we help your team?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    disabled={status === "loading"}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full h-12 text-base font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Message
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
