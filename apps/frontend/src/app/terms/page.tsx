import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileCheck } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - Sentio",
  description: "Sentio's Terms and Conditions for presenters and participants.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow py-20 sm:py-28 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs font-semibold mb-5 shadow-xs">
              <FileCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Terms of Service</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
              Terms & Conditions
            </h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-mono">
              Last updated:{" "}
              {new Date().toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 p-8 sm:p-12 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 space-y-8 text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                1. Contractual Relationship
              </h2>
              <p>
                These Terms of Use govern the access or use by you of
                applications, websites, content, products, and services made
                available by Sentio Inc. By accessing our platform, you agree to
                be bound by these terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                2. Platform Services
              </h2>
              <p>
                Sentio provides cloud software enabling creators, educators, and
                enterprise teams to generate interactive presentation slides,
                run live audience voting, manage Q&A dialogues, and analyze
                engagement analytics.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                3. User Conduct & Acceptable Use
              </h2>
              <p>
                You agree not to submit or broadcast unlawful, abusive,
                infringing, or malicious content through live presentations or
                public links. Presenters retain full moderation rights,
                including live attendee banning.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                4. Service Availability & Modifications
              </h2>
              <p>
                We strive for continuous 99.9% uptime for live sessions and
                presentation delivery. We reserve the right to deploy
                performance enhancements and feature updates to improve the
                platform.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
