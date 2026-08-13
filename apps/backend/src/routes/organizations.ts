import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth";
import Organization from "../models/Organization";
import OrganizationMember from "../models/OrganizationMember";
import OrganizationInvitation from "../models/OrganizationInvitation";
import User from "../models/User";
import { sendOrgInvitationEmail } from "../services/email";

const router = Router();

// ── Create Organization ──
router.post("/", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: "Organization name is required" });
      return;
    }

    const slug =
      name.toLowerCase().replace(/[^a-z0-9]/g, "-") +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    const org = new Organization({
      name,
      slug,
      owner: req.user.id,
      description: description || "",
    });

    await org.save();

    // Add owner to members table
    await OrganizationMember.create({
      organization: org._id,
      user: req.user.id,
      role: "owner",
    });

    res.status(201).json(org);
  } catch (error: any) {
    console.error("Create organization error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to create organization" });
  }
});

// ── List User Organizations ──
router.get("/", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const memberships = await OrganizationMember.find({
      user: req.user.id,
    }).populate("organization");
    const orgs = memberships.map((m) => ({
      ...((m.organization as any).toObject
        ? (m.organization as any).toObject()
        : m.organization),
      myRole: m.role,
    }));
    res.json(orgs);
  } catch (error) {
    console.error("List organizations error:", error);
    res.status(500).json({ message: "Failed to list organizations" });
  }
});

// ── Get Organization Details & Roster ──
router.get("/:id", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const member = await OrganizationMember.findOne({
      organization: req.params.id,
      user: req.user.id,
    });

    if (!member) {
      res.status(403).json({ message: "Access denied to organization" });
      return;
    }

    const org = await Organization.findById(req.params.id);
    const members = await OrganizationMember.find({
      organization: req.params.id,
    }).populate("user", "name email avatar role");
    const pendingInvites = await OrganizationInvitation.find({
      organization: req.params.id,
      status: "pending",
    });

    res.json({ org, members, pendingInvites, myRole: member.role });
  } catch (error) {
    console.error("Get organization details error:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve organization details" });
  }
});

// ── Invite Member ──
router.post(
  "/:id/invite",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { email, role } = req.body;
      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      const member = await OrganizationMember.findOne({
        organization: req.params.id,
        user: req.user.id,
        role: { $in: ["owner", "admin"] },
      });

      if (!member) {
        res
          .status(403)
          .json({
            message: "Only organization owners/admins can invite members.",
          });
        return;
      }

      const org = await Organization.findById(req.params.id);
      if (!org) {
        res.status(404).json({ message: "Organization not found" });
        return;
      }

      const token = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invite = new OrganizationInvitation({
        organization: org._id,
        email: email.toLowerCase(),
        role: role || "member",
        token,
        invitedBy: req.user.id,
        expiresAt,
      });

      await invite.save();

      const inviteUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/join-org?token=${token}`;
      await sendOrgInvitationEmail(email, org.name, inviteUrl);

      res.status(201).json({ message: "Invitation sent", invite });
    } catch (error) {
      console.error("Invite organization member error:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  },
);

// ── Accept Invitation ──
router.post(
  "/invitations/accept",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const { token } = req.body;
      const invite = await OrganizationInvitation.findOne({
        token,
        status: "pending",
      });
      if (!invite) {
        res
          .status(404)
          .json({ message: "Invalid or expired invitation token" });
        return;
      }

      if (new Date() > invite.expiresAt) {
        invite.status = "expired";
        await invite.save();
        res.status(400).json({ message: "Invitation has expired" });
        return;
      }

      invite.status = "accepted";
      await invite.save();

      await OrganizationMember.create({
        organization: invite.organization,
        user: req.user.id,
        role: invite.role,
      });

      res.json({
        message: "Successfully joined organization",
        organizationId: invite.organization,
      });
    } catch (error) {
      console.error("Accept invitation error:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  },
);

// ── Remove Member ──
router.delete(
  "/:id/members/:userId",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    try {
      const requester = await OrganizationMember.findOne({
        organization: req.params.id,
        user: req.user.id,
        role: { $in: ["owner", "admin"] },
      });

      if (!requester) {
        res.status(403).json({ message: "Permission denied" });
        return;
      }

      await OrganizationMember.deleteOne({
        organization: req.params.id,
        user: req.params.userId,
      });

      res.json({ message: "Member removed from organization" });
    } catch (error) {
      console.error("Remove org member error:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  },
);

export default router;
