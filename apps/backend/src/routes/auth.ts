import { Router } from "express";
import { body } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import multer from "multer";
import { uploadAvatarToAzure } from "../services/azure";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "sentio-dev-secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "sentio-dev-refresh-secret";

// ── Helper: generate token pair ──
function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ sub: userId, role }, JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
}

// ── POST /api/auth/register ──
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain a number"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  validate,
  async (req: any, res: any) => {
    try {
      const { name, email, password } = req.body;

      // Duplicate email check
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({
          message: "Validation failed",
          errors: [{ field: "email", message: "Email already registered" }],
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${email.toLowerCase()}`;
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        avatar: avatarUrl,
      });

      const tokens = generateTokens(user.id, user.role);

      return res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
        ...tokens,
      });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ── POST /api/auth/login ──
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  async (req: any, res: any) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const tokens = generateTokens(user.id, user.role);

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
        ...tokens,
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ── GET /api/auth/me ──
router.get("/me", requireAuth, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user.sub).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── PATCH /api/auth/profile ──
router.patch(
  "/profile",
  requireAuth,
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("avatar")
      .optional()
      .trim()
      .isURL()
      .withMessage("Avatar must be a valid URL"),
    body("currentPassword")
      .optional()
      .notEmpty()
      .withMessage("Current password is required if setting a new password"),
    body("newPassword")
      .optional()
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("New password must contain an uppercase letter")
      .matches(/[0-9]/)
      .withMessage("New password must contain a number"),
  ],
  validate,
  async (req: any, res: any) => {
    try {
      const { name, avatar, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.sub);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Handle password update
      if (newPassword) {
        if (!currentPassword) {
          return res
            .status(400)
            .json({ message: "Current password is required" });
        }

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
          return res
            .status(400)
            .json({ message: "Incorrect current password" });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 12);
      }

      if (name) user.name = name;
      if (avatar) user.avatar = avatar;

      await user.save();

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (err) {
      console.error("Profile update error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ── POST /api/auth/profile/avatar ──
router.post(
  "/profile/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const user = await User.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Upload to Azure Blob Storage
      const avatarUrl = await uploadAvatarToAzure(
        user.id,
        req.file.buffer,
        req.file.mimetype,
      );

      // Save to database
      user.avatar = avatarUrl;
      await user.save();

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (err) {
      console.error("Avatar upload error:", err);
      return res
        .status(500)
        .json({ message: "Internal server error during upload" });
    }
  },
);

export default router;
