import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import User from "../models/User";
import Presentation from "../models/Presentation";
import Session from "../models/Session";
import FileResource from "../models/FileResource";
import AILog from "../models/AILog";
import AuditLog from "../models/AuditLog";
import Organization from "../models/Organization";

const router = Router();

// Apply requireAdmin to all routes in this router
router.use(requireAdmin);

// ── Admin Dashboard Platform Overview ──
router.get("/dashboard", async (_req: any, res: any): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const activePresenters = await User.countDocuments({
      role: "presenter",
      isBlocked: false,
    });
    const totalOrganizations = await Organization.countDocuments();
    const totalPresentations = await Presentation.countDocuments({
      isDeleted: false,
    });
    const activeSessions = await Session.countDocuments({ status: "live" });
    const totalFiles = await FileResource.countDocuments({
      isLatestVersion: true,
    });

    // AI Telemetry summary (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const aiStats = await AILog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: "$totalTokens" },
          avgLatency: { $avg: "$latencyMs" },
          errors: {
            $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = aiStats[0] || {
      totalRequests: 0,
      totalTokens: 0,
      avgLatency: 0,
      errors: 0,
    };

    res.json({
      platform: {
        totalUsers,
        activePresenters,
        totalOrganizations,
        totalPresentations,
        activeSessions,
        totalFiles,
      },
      aiUsage: {
        totalRequests: stats.totalRequests,
        totalTokens: stats.totalTokens,
        avgLatencyMs: Math.round(stats.avgLatency || 0),
        errorRate:
          stats.totalRequests > 0
            ? ((stats.errors / stats.totalRequests) * 100).toFixed(1)
            : 0,
      },
      systemHealth: "OPERATIONAL",
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ message: "Failed to load admin dashboard data" });
  }
});

// ── User Management ──
router.get("/users", async (req: any, res: any): Promise<void> => {
  try {
    const { q, role, status, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (q) {
      const regex = new RegExp((q as string).trim(), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    if (role) filter.role = role;
    if (status === "blocked") filter.isBlocked = true;
    if (status === "active") filter.isBlocked = false;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const users = await User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Admin list users error:", error);
    res.status(500).json({ message: "Failed to list users" });
  }
});

// Update Role
router.patch("/users/:id/role", async (req: any, res: any): Promise<void> => {
  try {
    const { role } = req.body;
    if (!["admin", "presenter", "participant"].includes(role)) {
      res.status(400).json({ message: "Invalid role specified" });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Safeguard: Prevent removing last admin
    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        res
          .status(400)
          .json({ message: "Cannot demote the only remaining administrator." });
        return;
      }
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await AuditLog.create({
      user: req.user.id,
      action: "ROLE_CHANGED",
      target: user.email,
      details: { oldRole, newRole: role },
    });

    res.json({
      message: "User role updated",
      user: { id: user._id, role: user.role },
    });
  } catch (error) {
    console.error("Admin update role error:", error);
    res.status(500).json({ message: "Failed to update user role" });
  }
});

// Toggle Block / Unblock
router.patch("/users/:id/block", async (req: any, res: any): Promise<void> => {
  try {
    const { isBlocked } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.isBlocked = Boolean(isBlocked);
    await user.save();

    await AuditLog.create({
      user: req.user.id,
      action: isBlocked ? "USER_BLOCKED" : "USER_UNBLOCKED",
      target: user.email,
    });

    res.json({
      message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    console.error("Admin block user error:", error);
    res.status(500).json({ message: "Failed to update user block status" });
  }
});

// ── Session Administration ──
router.get("/sessions", async (req: any, res: any): Promise<void> => {
  try {
    const sessions = await Session.find()
      .populate("presentationId", "title owner")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(sessions);
  } catch (error) {
    console.error("Admin list sessions error:", error);
    res.status(500).json({ message: "Failed to list sessions" });
  }
});

router.post(
  "/sessions/:id/terminate",
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

      await AuditLog.create({
        user: req.user.id,
        action: "SESSION_TERMINATED",
        target: session.joinCode,
      });

      res.json({ message: "Session terminated by admin" });
    } catch (error) {
      console.error("Admin terminate session error:", error);
      res.status(500).json({ message: "Failed to terminate session" });
    }
  },
);

// ── AI Usage Monitoring ──
router.get("/ai-usage", async (_req: any, res: any): Promise<void> => {
  try {
    const logs = await AILog.find().sort({ createdAt: -1 }).limit(100);
    const totals = await AILog.aggregate([
      {
        $group: {
          _id: "$modelName",
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: "$totalTokens" },
          avgLatency: { $avg: "$latencyMs" },
        },
      },
    ]);

    res.json({ logs, summaryByModel: totals });
  } catch (error) {
    console.error("Admin AI usage error:", error);
    res.status(500).json({ message: "Failed to retrieve AI telemetry" });
  }
});

// ── Audit Logs ──
router.get("/audit-logs", async (_req: any, res: any): Promise<void> => {
  try {
    const logs = await AuditLog.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    console.error("Admin audit logs error:", error);
    res.status(500).json({ message: "Failed to retrieve audit logs" });
  }
});

export default router;
