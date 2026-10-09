import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import Session from "../models/Session";
import Presentation from "../models/Presentation";
import Slide from "../models/Slide";
import QnAQuestion from "../models/QnAQuestion";
import * as interactionService from "../services/interactionService";
import * as reportService from "../services/reportService";
import { generateUnique6DigitCode } from "../utils/codeGenerator";

const router = Router();

// ── Public Check Session By Join Code ──
router.get("/check/:joinCode", async (req: any, res: any): Promise<void> => {
  try {
    const cleanCode = (req.params.joinCode || "").trim().toUpperCase();
    const session = await Session.findOne({
      joinCode: cleanCode,
      status: { $ne: "ended" },
    });

    if (!session) {
      // Check if there's a presentation with this sessionCode or shareId prefix
      const presentation = await Presentation.findOne({
        $or: [
          { sessionCode: cleanCode, isDeleted: false },
          {
            shareId: { $regex: new RegExp(`^${cleanCode}`, "i") },
            isDeleted: false,
          },
        ],
      });

      if (presentation) {
        const slideCount = await Slide.countDocuments({
          presentationId: presentation._id,
        });
        res.json({
          exists: true,
          status: presentation.status === "live" ? "presenting" : "ready",
          title: presentation.title,
          slideCount,
          joinCode: cleanCode,
          presentationId: presentation._id,
        });
        return;
      }

      res
        .status(404)
        .json({ exists: false, message: "Session not found or has ended" });
      return;
    }

    let title = "Sentio Live Presentation";
    let slideCount = 0;
    if (session.presentationId) {
      const presentation = await Presentation.findById(session.presentationId);
      if (presentation) {
        title = presentation.title;
        slideCount = await Slide.countDocuments({
          presentationId: presentation._id,
        });
      }
    }

    res.json({
      exists: true,
      status: session.status,
      title,
      slideCount,
      joinCode: session.joinCode,
      currentSlideIndex: session.currentSlideIndex || 0,
      participantCount:
        session.participants?.filter((p) => p.isOnline).length || 0,
    });
  } catch (error) {
    console.error("Check session error:", error);
    res.status(500).json({ message: "Failed to verify session" });
  }
});

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

// ── Initialize or Start Presentation Session with Unique 6-Digit Code ──
router.post(
  "/presentation/:presentationId/init",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { presentationId } = req.params;
      const { forceNew } = req.body || {};

      const presentation = await Presentation.findById(presentationId);
      if (!presentation) {
        res.status(404).json({ message: "Presentation not found" });
        return;
      }

      if (presentation.owner.toString() !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      // Check for an existing active session
      let session = null;
      if (!forceNew) {
        session = await Session.findOne({
          presentationId,
          status: { $in: ["presenting", "paused", "ready"] },
        }).sort({ createdAt: -1 });
      }

      // If forceNew is requested or previous session ended, end any remaining active sessions
      if (forceNew) {
        await Session.updateMany(
          { presentationId, status: { $ne: "ended" } },
          { $set: { status: "ended", endedAt: new Date() } },
        );
      }

      let joinCode = session?.joinCode;

      // Ensure joinCode is a valid 6-digit numeric string
      if (!session || !joinCode || !/^\d{6}$/.test(joinCode)) {
        joinCode = await generateUnique6DigitCode();

        session = new Session({
          presentationId: presentation._id,
          joinCode,
          status: "ready",
          startedAt: new Date(),
          currentSlideIndex: 0,
          requireApproval: false,
          participants: [],
        });
        await session.save();

        presentation.sessionCode = joinCode;
        presentation.status = "live";
        await presentation.save();
      }

      res.json({
        session,
        joinCode,
      });
    } catch (error) {
      console.error("Init session error:", error);
      res
        .status(500)
        .json({ message: "Failed to initialize presentation session" });
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

// ── Get Session Participants ──
router.get(
  "/:id/participants",
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

      res.json({
        requireApproval: session.requireApproval !== false,
        participants: session.participants.map((p) => ({
          socketId: p.socketId,
          displayName: p.displayName,
          isOnline: p.isOnline,
          isApproved: p.isApproved !== false,
          joinedAt: p.joinedAt,
          score: p.score,
          email: p.email,
        })),
      });
    } catch (error) {
      console.error("Get participants error:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
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
          answerText: q.answerText || "",
          answeredBy: q.answeredBy || "",
          answeredAt: q.answeredAt ? q.answeredAt.toISOString() : undefined,
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

// ── End Session & Generate Report ──
router.post(
  "/:id/end",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const session = await Session.findById(req.params.id);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }

      session.status = "ended";
      session.endedAt = new Date();
      await session.save();

      if (session.presentationId) {
        await Presentation.findByIdAndUpdate(session.presentationId, {
          status: "completed",
        });
      }

      // Trigger automatic report generation
      const reportResult = await reportService.generateAndSaveSessionReport(
        session._id.toString(),
      );

      res.json({
        message: "Session ended successfully",
        session,
        report: reportResult?.report,
        fileResource: reportResult?.fileResource,
      });
    } catch (error) {
      console.error("End session error:", error);
      res.status(500).json({ message: "Failed to end session" });
    }
  },
);

export default router;
