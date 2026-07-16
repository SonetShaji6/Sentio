import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion } from "@/components/Accordion";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Sentio",
  description:
    "Frequently asked questions about Sentio's audience engagement platform.",
};

const faqs = [
  {
    question: "How do participants join a live session?",
    answer:
      "Participants simply go to the Sentio participant URL and enter the unique 6-digit session code provided by the presenter. No account or app download is required for participants.",
  },
  {
    question: "Do I need to download any software?",
    answer:
      "No, Sentio is entirely cloud-based. You can create presentations, host sessions, and participate directly from any modern web browser on your computer, tablet, or smartphone.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes, we take security very seriously. All data is encrypted in transit and at rest. We use enterprise-grade hashing (bcrypt) for passwords and secure JWTs for authentication. We do not sell your audience data to third parties.",
  },
  {
    question: "Can I export the results of a session?",
    answer:
      "Yes! Presenters and administrators can export session results, including poll answers, Q&A logs, and audience analytics, into CSV or PDF formats for offline analysis.",
  },
  {
    question: "How does the AI quiz generation work?",
    answer:
      "Our AI assistant analyzes your presentation content or the topic you provide, and automatically generates relevant multiple-choice questions with correct answers and distractors. You can always edit or remove them before presenting.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-grow py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Everything you need to know about the product and billing.
            </p>
          </div>

          <Accordion items={faqs} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
