import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import User from "../models/User";
import Presentation from "../models/Presentation";
import Session from "../models/Session";
import FileResource from "../models/FileResource";
import AILog from "../models/AILog";
import AuditLog from "../models/AuditLog";
import Organization from "../models/Organization";
import OrganizationMember from "../models/OrganizationMember";
import { createNotification } from "../services/notificationService";
import { sendNotificationEmail } from "../services/email";

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
    const activeSessions = await Session.countDocuments({
      status: "presenting",
    });
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
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
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

    const userDocs = await User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    // Enhance users with presentation and file counts
    const users = await Promise.all(
      userDocs.map(async (u) => {
        const [presentationsCount, filesCount] = await Promise.all([
          Presentation.countDocuments({ owner: u._id, isDeleted: false }),
          FileResource.countDocuments({ owner: u._id, isLatestVersion: true }),
        ]);
        return {
          ...u.toObject(),
          presentationsCount,
          filesCount,
        };
      }),
    );

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

// ── Get Presentations by User ──
router.get(
  "/users/:id/presentations",
  async (req: any, res: any): Promise<void> => {
    try {
      const presentations = await Presentation.find({
        owner: req.params.id,
        isDeleted: false,
      })
        .populate("organization", "name slug")
        .sort({ updatedAt: -1 });

      res.json(presentations);
    } catch (error) {
      console.error("Admin get user presentations error:", error);
      res.status(500).json({ message: "Failed to load user presentations" });
    }
  },
);

// ── Get Knowledge Base / Files by User ──
router.get("/users/:id/files", async (req: any, res: any): Promise<void> => {
  try {
    const files = await FileResource.find({
      owner: req.params.id,
      isLatestVersion: true,
    }).sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    console.error("Admin get user files error:", error);
    res.status(500).json({ message: "Failed to load user knowledge base" });
  }
});

// ── Global Presentations Management (Admin View) ──
router.get("/presentations", async (req: any, res: any): Promise<void> => {
  try {
    const {
      q,
      userId,
      organizationId,
      status,
      page = 1,
      limit = 24,
    } = req.query;
    const filter: any = { isDeleted: false };

    if (q) {
      filter.title = { $regex: (q as string).trim(), $options: "i" };
    }
    if (userId) filter.owner = userId;
    if (organizationId) filter.organization = organizationId;
    if (status) filter.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const presentations = await Presentation.find(filter)
      .populate("owner", "name email avatar")
      .populate("organization", "name slug")
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Presentation.countDocuments(filter);

    res.json({
      presentations,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Admin list presentations error:", error);
    res.status(500).json({ message: "Failed to list presentations" });
  }
});

// ── Admin Get Presentation Sessions & Participants ──
router.get(
  "/presentations/:id/participants",
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findById(req.params.id).populate(
        "owner",
        "name email",
      );
      if (!presentation) {
        res.status(404).json({ message: "Presentation not found" });
        return;
      }

      const sessions = await Session.find({
        presentationId: req.params.id,
      }).sort({ createdAt: -1 });

      const allParticipants: any[] = [];
      const seen = new Set<string>();

      for (const s of sessions) {
        for (const p of s.participants) {
          const key =
            (p.email || p.displayName).toLowerCase() + "_" + s._id.toString();
          if (!seen.has(key)) {
            seen.add(key);
            allParticipants.push({
              sessionId: s._id,
              joinCode: s.joinCode,
              sessionStatus: s.status,
              sessionStartedAt: s.startedAt,
              socketId: p.socketId,
              displayName: p.displayName,
              email: p.email || "N/A",
              joinedAt: p.joinedAt,
              isOnline: p.isOnline,
              isApproved: p.isApproved,
              score: p.score,
            });
          }
        }
      }

      res.json({
        presentation: {
          id: presentation._id,
          title: presentation.title,
          owner: presentation.owner,
          status: presentation.status,
          sessionCode: presentation.sessionCode,
        },
        sessionsCount: sessions.length,
        totalParticipants: allParticipants.length,
        participants: allParticipants,
      });
    } catch (error) {
      console.error("Admin get presentation participants error:", error);
      res.status(500).json({ message: "Failed to load participants" });
    }
  },
);

// ── Admin Delete Presentation ──
router.delete(
  "/presentations/:id",
  async (req: any, res: any): Promise<void> => {
    try {
      const presentation = await Presentation.findById(req.params.id);
      if (!presentation) {
        res.status(404).json({ message: "Presentation not found" });
        return;
      }

      presentation.isDeleted = true;
      presentation.deletedAt = new Date();
      await presentation.save();

      await AuditLog.create({
        user: req.user.id,
        action: "PRESENTATION_DELETED",
        target: presentation.title,
        details: {
          presentationId: presentation._id,
          owner: presentation.owner,
        },
      });

      res.json({ message: "Presentation deleted successfully by admin" });
    } catch (error) {
      console.error("Admin delete presentation error:", error);
      res.status(500).json({ message: "Failed to delete presentation" });
    }
  },
);

// ── Global Knowledge Base / Files (Admin View) ──
router.get("/files", async (req: any, res: any): Promise<void> => {
  try {
    const { q, userId, category, page = 1, limit = 24 } = req.query;
    const filter: any = { isLatestVersion: true };

    if (q) {
      filter.originalName = { $regex: (q as string).trim(), $options: "i" };
    }
    if (userId) filter.owner = userId;
    if (category && category !== "all") filter.category = category;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const files = await FileResource.find(filter)
      .populate("owner", "name email avatar")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await FileResource.countDocuments(filter);

    res.json({
      files,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Admin list files error:", error);
    res.status(500).json({ message: "Failed to list knowledge files" });
  }
});

// ── Global Organizations Overview ──
router.get("/organizations", async (_req: any, res: any): Promise<void> => {
  try {
    const orgs = await Organization.find()
      .populate("owner", "name email avatar")
      .sort({ createdAt: -1 });

    const enrichedOrgs = await Promise.all(
      orgs.map(async (org) => {
        const [memberCount, presentationCount] = await Promise.all([
          OrganizationMember.countDocuments({ organization: org._id }),
          Presentation.countDocuments({
            organization: org._id,
            isDeleted: false,
          }),
        ]);
        return {
          ...org.toObject(),
          memberCount,
          presentationCount,
        };
      }),
    );

    res.json(enrichedOrgs);
  } catch (error) {
    console.error("Admin list organizations error:", error);
    res.status(500).json({ message: "Failed to list organizations" });
  }
});

// ── Single Organization Details (Members & Presentations) ──
router.get("/organizations/:id", async (req: any, res: any): Promise<void> => {
  try {
    const org = await Organization.findById(req.params.id).populate(
      "owner",
      "name email avatar",
    );
    if (!org) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    const [members, presentations] = await Promise.all([
      OrganizationMember.find({ organization: org._id })
        .populate("user", "name email avatar role isBlocked")
        .sort({ createdAt: 1 }),
      Presentation.find({ organization: org._id, isDeleted: false })
        .populate("owner", "name email avatar")
        .sort({ updatedAt: -1 }),
    ]);

    res.json({
      organization: org,
      members,
      presentations,
    });
  } catch (error) {
    console.error("Admin get organization details error:", error);
    res.status(500).json({ message: "Failed to load organization details" });
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

// ── Admin Delete User (Hard Delete) ──
router.delete("/users/:id", async (req: any, res: any): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Safety check - don't let admin delete themselves
    if (user.id === req.user.id) {
      res.status(400).json({ message: "You cannot delete your own account" });
      return;
    }

    await User.deleteOne({ _id: user._id });

    await AuditLog.create({
      user: req.user.id,
      action: "USER_DELETED",
      target: user.email,
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// ── Admin Block/Unblock Presentation ──
router.patch(
  "/presentations/:id/block",
  async (req: any, res: any): Promise<void> => {
    try {
      const { isBlocked } = req.body;
      const presentation = await Presentation.findById(req.params.id);
      if (!presentation) {
        res.status(404).json({ message: "Presentation not found" });
        return;
      }

      presentation.isBlocked = Boolean(isBlocked);
      await presentation.save();

      await AuditLog.create({
        user: req.user.id,
        action: isBlocked ? "PRESENTATION_BLOCKED" : "PRESENTATION_UNBLOCKED",
        target: presentation.title,
      });

      res.json({
        message: `Presentation ${isBlocked ? "blocked" : "unblocked"} successfully`,
        isBlocked: presentation.isBlocked,
      });
    } catch (error) {
      console.error("Admin block presentation error:", error);
      res.status(500).json({ message: "Failed to block presentation" });
    }
  },
);

// ── Admin Delete File ──
router.delete("/files/:id", async (req: any, res: any): Promise<void> => {
  try {
    const file = await FileResource.findById(req.params.id);
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    await FileResource.deleteOne({ _id: file._id });

    await AuditLog.create({
      user: req.user.id,
      action: "FILE_DELETED",
      target: file.originalName,
    });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Admin delete file error:", error);
    res.status(500).json({ message: "Failed to delete file" });
  }
});

// ── Admin Send System Notification ──
router.post(
  "/notifications/send",
  async (req: any, res: any): Promise<void> => {
    try {
      const { title, message, targetRole, targetUsers, deliveryMethod } =
        req.body;
      if (!title || !message) {
        res.status(400).json({ message: "Title and message are required" });
        return;
      }

      // deliveryMethod can be 'portal', 'email', or 'both'
      // targetUsers can be 'ALL' or an array of user IDs

      let usersToNotify: any[] = [];

      if (targetUsers === "ALL") {
        const filter: any = { isBlocked: false };
        if (targetRole && targetRole !== "ALL") filter.role = targetRole;
        usersToNotify = await User.find(filter).select("_id email preferences");
      } else if (Array.isArray(targetUsers) && targetUsers.length > 0) {
        usersToNotify = await User.find({
          _id: { $in: targetUsers },
          isBlocked: false,
        }).select("_id email preferences");
      }

      // Process notifications
      // We grab `io` from app if possible, or pass null
      const io = req.app.get("io");

      const portalPromises = [];
      const emailPromises = [];

      for (const user of usersToNotify) {
        if (deliveryMethod === "portal" || deliveryMethod === "both") {
          portalPromises.push(
            createNotification(
              user._id.toString(),
              {
                type: "system_announcement",
                title,
                message,
              },
              io,
            ),
          );
        }

        if (deliveryMethod === "email" || deliveryMethod === "both") {
          // Check if user has opted out of system announcement emails, but as admin we might bypass it.
          // For now, let's respect preferences if they exist, or just send.
          if (user.preferences?.notifications?.email !== false) {
            emailPromises.push(
              sendNotificationEmail(user.email, title, message),
            );
          }
        }
      }

      await Promise.allSettled([...portalPromises, ...emailPromises]);

      await AuditLog.create({
        user: req.user.id,
        action: "SYSTEM_NOTIFICATION_SENT",
        target:
          targetUsers === "ALL"
            ? targetRole || "ALL_USERS"
            : `SPECIFIC_USERS (${usersToNotify.length})`,
        details: {
          title,
          message,
          deliveryMethod,
          recipientsCount: usersToNotify.length,
        },
      });

      res.json({
        message: `Notification sent successfully to ${usersToNotify.length} users`,
      });
    } catch (error) {
      console.error("Admin send notification error:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  },
);

export default router;
