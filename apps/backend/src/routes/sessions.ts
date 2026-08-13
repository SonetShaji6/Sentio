import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import Session from "../models/Session";
import Presentation from "../models/Presentation";
import QnAQuestion from "../models/QnAQuestion";
import * as interactionService from "../services/interactionService";

const router = Router();

// ── Get Session Details ──
router.get("/:id", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    // Verify ownership
    const presentation = await Presentation.findById(session.presentationId);
    if (!presentation || presentation.owner.toString() !== req.user.id) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.json(session);
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ message: "Failed to fetch session" });
  }
});

// ── Get Sessions for a Presentation ──
router.get(
  "/presentation/:presentationId",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findById(
        req.params.presentationId,
      );
      if (!presentation || presentation.owner.toString() !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const sessions = await Session.find({
        presentationId: req.params.presentationId,
      })
        .sort({ createdAt: -1 })
        .select("-participants.responses");

      res.json(sessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  },
);

// ── Get Slide Results ──
router.get(
  "/:id/results/:slideId",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const session = await Session.findById(req.params.id);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }

      const presentation = await Presentation.findById(session.presentationId);
      if (!presentation || presentation.owner.toString() !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const result = await interactionService.getSlideResults(
        req.params.id,
        req.params.slideId,
      );

      res.json(result || {});
    } catch (error) {
      console.error("Get results error:", error);
      res.status(500).json({ message: "Failed to fetch results" });
    }
  },
);

// ── Get Leaderboard ──
router.get(
  "/:id/leaderboard",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const session = await Session.findById(req.params.id);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }

      const presentation = await Presentation.findById(session.presentationId);
      if (!presentation || presentation.owner.toString() !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const leaderboard = await interactionService.getLeaderboard(
        req.params.id,
      );
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  },
);

// ── Get Q&A Questions ──
router.get(
  "/:id/qna",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const session = await Session.findById(req.params.id);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }

      const presentation = await Presentation.findById(session.presentationId);
      if (!presentation || presentation.owner.toString() !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const questions = await QnAQuestion.find({
        sessionId: req.params.id,
      }).sort({ createdAt: -1 });

      res.json(
        questions.map((q) => ({
          id: q._id.toString(),
          displayName: q.displayName,
          questionText: q.questionText,
          status: q.status,
          upvotes: q.upvotes,
          createdAt: q.createdAt.toISOString(),
        })),
      );
    } catch (error) {
      console.error("Get Q&A error:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  },
);

export default router;
