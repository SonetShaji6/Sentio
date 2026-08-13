import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { aiService } from "../ai/AIService";
import * as recommendationService from "../services/recommendationService";

const router = Router();

// Apply AI rate limiter to all AI routes
router.use(aiRateLimiter);

// ── Generate Interaction Slides ──
router.post(
  "/generate-slides",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { type, topic, count, difficulty, audience, context } = req.body;

      if (!topic || !count || count > 10) {
        res
          .status(400)
          .json({
            message:
              "Invalid parameters. 'topic' and 'count' (max 10) are required.",
          });
        return;
      }

      let generatedSlides = [];

      if (type === "quiz") {
        generatedSlides = await aiService.generateQuiz(
          topic,
          count,
          difficulty || "medium",
          context,
        );
      } else if (type === "poll") {
        generatedSlides = await aiService.generatePoll(topic, count, audience);
      } else {
        res
          .status(400)
          .json({ message: "Invalid type. Must be 'quiz' or 'poll'." });
        return;
      }

      res.json(generatedSlides);
    } catch (error) {
      console.error("AI slide generation error:", error);
      res.status(500).json({ message: "Failed to generate AI content" });
    }
  },
);

// ── Summarize Presentation ──
router.post(
  "/summarize",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { title, textContent } = req.body;

      if (!title || !textContent) {
        res.status(400).json({ message: "Missing title or textContent" });
        return;
      }

      const summary = await aiService.summarizePresentation(title, textContent);
      res.json({ summary });
    } catch (error) {
      console.error("AI summarization error:", error);
      res.status(500).json({ message: "Failed to summarize presentation" });
    }
  },
);

// ── AI Chat Assistant ──
router.post("/chat", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const { message, context } = req.body;

    if (!message) {
      res.status(400).json({ message: "Message is required" });
      return;
    }

    const reply = await aiService.chat(message, context || "");
    res.json({ reply });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ message: "AI chat failed" });
  }
});

// ── AI Analytics & Insights (Module 11) ──
router.get(
  "/insights/:sessionId",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const insights = await recommendationService.generateSessionInsights(
        req.params.sessionId,
        req.user.id,
      );
      res.json(insights);
    } catch (error) {
      console.error("AI insights error:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  },
);

export default router;
