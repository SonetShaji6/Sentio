import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - Sentio",
  description:
    "Learn about Sentio's mission to transform presentations from one-way broadcasts into interactive, data-driven conversations.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-grow py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-8">
            Our Mission
          </h1>

          <div className="prose prose-lg text-gray-600">
            <p>
              At Sentio, we believe that the best presentations are
              conversations, not monologues. Our mission is to empower
              presenters, educators, and leaders to connect with their audiences
              in meaningful, interactive ways.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
              The Problem
            </h2>
            <p>
              Traditional presentations are often passive experiences. Audiences
              zone out, presenters struggle to gauge comprehension, and valuable
              insights are lost in the void. Feedback is typically collected
              after the fact, when it's too late to adjust the content.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
              The Sentio Solution
            </h2>
            <p>
              We built Sentio to bridge the gap between speaker and audience. By
              integrating real-time polling, AI-assisted quizzes, and live Q&A
              directly into the presentation experience, we transform passive
              listeners into active participants.
            </p>
            <p>
              Our platform provides instant, actionable data. Presenters can see
              exactly what the audience understands and where they need more
              clarity, allowing them to adapt on the fly.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
              Our Technology
            </h2>
            <p>
              Built on a modern, high-performance stack, Sentio leverages secure
              cloud infrastructure, real-time WebSocket connections, and
              advanced AI models to deliver a seamless, instantaneous experience
              for thousands of concurrent participants.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
