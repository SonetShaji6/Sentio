import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion } from "@/components/Accordion";
import { HelpCircle, Sparkles } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Sentio",
  description:
    "Frequently asked questions about Sentio's audience engagement platform, AI slide generation, and real-time polling.",
};

const faqs = [
  {
    question: "How do participants join a live session?",
    answer:
      "Participants simply go to the Sentio participant URL and enter the unique 6-digit session code (or scan the live QR code) provided by the presenter. No account or app download is required for participants.",
  },
  {
    question: "Do I need to download any software?",
    answer:
      "No, Sentio is entirely cloud-based. You can create presentations, host sessions, and participate directly from any modern web browser on your computer, tablet, or smartphone.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes, we take security very seriously. All data is encrypted in transit and at rest. We use enterprise-grade hashing for passwords and secure JWTs with role-based access control. We do not sell your audience data to third parties.",
  },
  {
    question: "Can I export the results of a session?",
    answer:
      "Yes! Presenters and administrators can export session results, including poll answers, quiz leaderboards, Q&A logs, and detailed participant analytics into PDF or CSV formats.",
  },
  {
    question: "How does the AI slide and quiz generation work?",
    answer:
      "Our AI engine analyzes your uploaded documents (PDFs, PPTXs, DOCXs) or any prompt you provide, automatically structuring interactive slides, teaching takeaways, and quiz questions with verified answers. You can customize them anytime in the slide builder.",
  },
  {
    question: "What happens when a participant is kicked out?",
    answer:
      "When a host kicks out a participant, they are banned from rejoining with the same name. Presenters can also enable 'Require Presenter Approval' to verify all participants in a waiting lobby before admitting them to the presentation.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow py-20 sm:py-28 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs font-semibold mb-5 shadow-xs">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Common Questions & Answers</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-5 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Everything you need to know about Sentio, hosting interactive
              presentations, and participant features.
            </p>
          </div>

          <Accordion items={faqs} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
