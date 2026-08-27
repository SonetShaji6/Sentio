import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Sentio",
  description: "Sentio's Privacy Policy and data protection standards.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow py-20 sm:py-28 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs font-semibold mb-5 shadow-xs">
              <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Data Protection & Privacy</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
              Privacy Policy
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
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us when creating
                an account, hosting interactive presentations, or communicating
                with support. This includes account credentials, session
                telemetry, questions submitted, and file attachments processed
                for AI slide generation.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                2. How We Use Your Information
              </h2>
              <p>
                We use collected information to provide and optimize real-time
                polling, generate presentation analytics, maintain security and
                fraud prevention, and generate AI insights tailored to your
                presentations.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                3. Data Security & Storage
              </h2>
              <p>
                All data in transit is encrypted using TLS 1.3, and data at rest
                is secured with enterprise-grade encryption. Passwords and
                credentials use industry-standard cryptographic hashing. We
                never sell your audience response data.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                4. Third-Party Sharing
              </h2>
              <p>
                We only share data with essential infrastructure service
                providers (such as cloud hosting and AI model inference
                gateways) strictly necessary to deliver Sentio services.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
