import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { aiService } from "../ai/AIService";
import * as recommendationService from "../services/recommendationService";

const router = Router();

// Apply AI rate limiter to all AI routes
router.use(aiRateLimiter);

// ── Generate Interaction & Presentation Slides ──
router.post(
  "/generate-slides",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { type, topic, count, difficulty, audience, context, tone } =
        req.body;

      const numCount = Number(count) || 3;

      if (!topic || numCount < 1 || numCount > 10) {
        res.status(400).json({
          message:
            "Invalid parameters. 'topic' and a valid 'count' (1-10) are required.",
        });
        return;
      }

      let generatedSlides: any[] = [];

      if (type === "quiz") {
        generatedSlides = await aiService.generateQuiz(
          topic,
          numCount,
          difficulty || "medium",
          context,
        );
      } else if (type === "poll") {
        generatedSlides = await aiService.generatePoll(
          topic,
          numCount,
          audience,
        );
      } else if (type === "deck" || type === "presentation") {
        generatedSlides = await aiService.generateFullDeck(
          topic,
          numCount,
          tone || "engaging",
          audience,
          context,
        );
      } else if (type === "icebreaker" || type === "icebreakers") {
        generatedSlides = await aiService.generateIcebreakers(
          topic,
          numCount,
          audience,
        );
      } else {
        // Fallback default: generate deck or quiz
        generatedSlides = await aiService.generateQuiz(
          topic,
          numCount,
          difficulty || "medium",
          context,
        );
      }

      res.json(generatedSlides || []);
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
